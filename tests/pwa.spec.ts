import { expect, test } from "@playwright/test";
import { waitForAppWorker } from "./helpers";

test("the install manifest and home-screen icons are served by the production build", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  expect(await manifest.json()).toMatchObject({
    name: "へんてこニュース",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    icons: [
      expect.objectContaining({ src: "/icons/icon-192.png", sizes: "192x192" }),
      expect.objectContaining({ src: "/icons/icon-512.png", sizes: "512x512" }),
      expect.objectContaining({ src: "/icons/icon-512-maskable.png", purpose: "maskable" }),
    ],
  });
  const icons = await page.evaluate(async () => {
    const paths = ["/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-512-maskable.png"];
    return Promise.all(
      paths.map(async (path) => {
        const image = new Image();
        image.src = path;
        await image.decode();
        return { width: image.naturalWidth, height: image.naturalHeight };
      }),
    );
  });
  expect(icons).toStrictEqual([
    { width: 192, height: 192 },
    { width: 512, height: 512 },
    { width: 512, height: 512 },
  ]);
  for (const image of await page.getByRole("img").all()) {
    await expect(image).toHaveJSProperty("complete", true);
    const width = await image.evaluate((element: HTMLImageElement) => element.naturalWidth);
    expect(width).toBeGreaterThan(0);
  }
});

test("a new worker removes obsolete app caches and preserves unrelated caches", async ({
  page,
}) => {
  // Visit a non-app document so the previous release caches exist before installation.
  await page.goto("/robots.txt");
  await page.evaluate(async () => {
    await Promise.all(
      ["henteko-static-previous-release", "henteko-html-previous-release", "unrelated-cache"].map(
        async (name) => {
          const cache = await caches.open(name);
          await cache.put("/previous-release", new Response("previous release"));
        },
      ),
    );
  });
  await page.goto("/");
  await waitForAppWorker(page);
  const cacheNames = await page.evaluate(() => caches.keys());
  expect(cacheNames).not.toContain("henteko-static-previous-release");
  expect(cacheNames).not.toContain("henteko-html-previous-release");
  expect(cacheNames).toContain("unrelated-cache");
  expect(cacheNames.filter((name) => /^henteko-(static|html)-/.test(name))).toHaveLength(2);
});

test("the audio-check route remains available offline", async ({ page, context }) => {
  await page.goto("/");
  await waitForAppWorker(page);
  await context.setOffline(true);
  const response = await page.goto("/words-audio-check?offline=1");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "おんせい かくにん", exact: true })).toBeVisible();
});

// shortcut: Firefox keeps worker fetches online; check unknown-path status with a stopped origin.
test("the cached 404 page remains available offline and can return home", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await waitForAppWorker(page);
  await context.setOffline(true);
  const response = await page.goto("/404.html");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "404", exact: true })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("ページが見つかりません");
  await expect(page.locator("script")).toHaveCount(0);
  const home = page.getByRole("link", { name: "トップへ戻る" });
  await expect(home).toHaveAttribute("href", "/");
  await home.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "はじめる" })).toBeVisible();
});
