import { expect, type Page, test } from "@playwright/test";
import { NEWS_QUESTIONS, waitForAppWorker } from "./helpers";

async function completeNews(page: Page) {
  await page.getByRole("button", { name: "はじめる" }).click();
  for (const label of NEWS_QUESTIONS) {
    await expect(page.locator(".speech-select")).toHaveText(label);
    await page.getByTestId("choice-card").first().click();
  }
  await expect(page.locator(".news-line")).toHaveCount(5);
}

test("completes and restarts a game when browser speech is unavailable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true });
  });
  await page.goto("/");
  await completeNews(page);
  await expect(page.getByRole("status")).toContainText("もじで たのしんでね");
  await page.getByRole("button", { name: "つぎをつくる" }).click();
  await expect(page.locator(".speech-select")).toHaveText("だれが？");
  expect(errors).toStrictEqual([]);
});

test("a first online visit caches enough of the production build to play offline", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await waitForAppWorker(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".offline-notice")).toBeVisible();
  await completeNews(page);
  await context.setOffline(false);
  const onlineResponsePromise = page.waitForResponse("**/index.html?connection-check=1");
  await page.evaluate(async () => {
    await fetch("/index.html?connection-check=1", { cache: "no-store" });
  });
  const onlineResponse = await onlineResponsePromise;
  expect(onlineResponse.ok()).toBe(true);
  expect(onlineResponse.fromServiceWorker()).toBe(false);
  // Firefox's emulated reconnect does not emit online after an offline reload.
  // Check live connectivity events separately, and verify a fresh online boot here.
  await page.reload();
  await expect(page.locator(".offline-notice")).toBeHidden();
  await page.getByRole("button", { name: "はじめる" }).click();
  await expect(page.getByRole("heading", { name: "だれが？", exact: true })).toBeVisible();
  expect(errors).toStrictEqual([]);
});

test("connectivity notices follow live browser network changes without reloading", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "はじめる" })).toBeVisible();
  await context.setOffline(true);
  await expect(page.locator(".offline-notice")).toBeVisible();
  await context.setOffline(false);
  await expect(page.locator(".offline-notice")).toBeHidden();
  await page.getByRole("button", { name: "はじめる" }).click();
  await expect(page.getByRole("heading", { name: "だれが？", exact: true })).toBeVisible();
});
