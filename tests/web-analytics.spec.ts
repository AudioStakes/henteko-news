import { expect, type Route, test } from "@playwright/test";
import { NEWS_QUESTIONS } from "./helpers";

test.use({ serviceWorkers: "block" });

test("the game remains playable when the production analytics script cannot load", async ({
  page,
  baseURL,
}) => {
  const productionOrigin = "https://henteko-news.netlify.app";
  const errors: string[] = [];
  const analyticsRequests: Route[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true });
  });
  await page.route(`${productionOrigin}/**`, async (route) => {
    const url = new URL(route.request().url());
    const target = new URL(`${url.pathname}${url.search}`, baseURL);
    const response = await route.fetch({
      url: target.href,
      headers: { ...route.request().headers(), host: target.host },
    });
    await route.fulfill({ response });
  });
  await page.route(/^https:\/\/(?:[^/]+\.)?cloudflareinsights\.com\//, (route) => {
    // Keep analytics stalled while the page loads and the game responds.
    analyticsRequests.push(route);
  });

  await page.goto(productionOrigin);
  await expect(page.getByRole("link", { name: "プライバシー", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/AudioStakes/henteko-news/blob/main/docs/PRIVACY.md",
  );
  await page.getByRole("button", { name: "ニュースをつくる" }).click();
  for (const label of NEWS_QUESTIONS) {
    await expect(page.locator(".speech-select")).toHaveText(label);
    await page.getByTestId("choice-card").first().click();
  }
  await expect(page.locator(".result-text")).toHaveCount(5);
  await expect
    .poll(() => analyticsRequests.map((route) => route.request().url()))
    .toStrictEqual(["https://static.cloudflareinsights.com/beacon.min.js"]);
  const failedBeacon = page.waitForEvent("requestfailed", {
    predicate: (request) => request.url() === "https://static.cloudflareinsights.com/beacon.min.js",
  });
  for (const route of analyticsRequests) {
    await route.abort();
  }
  await failedBeacon;
  await page.getByRole("button", { name: "つぎのニュース →" }).click();
  await expect(page.locator(".speech-select")).toHaveText("だれが？");
  expect(analyticsRequests).toHaveLength(1);
  expect(errors).toStrictEqual([]);
});
