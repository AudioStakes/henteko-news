import { expect, type Page, test } from "@playwright/test";

async function completeNews(page: Page) {
  await page.getByRole("button", { name: "ニュースをつくる" }).click();
  for (const label of ["だれが？", "いつ？", "どこで？", "なにを？", "どうした？"]) {
    await expect(page.locator(".speech-select")).toHaveText(label);
    await page.getByTestId("choice-card").first().click();
  }
  await expect(page.locator(".result-text")).toHaveCount(5);
}

test("completes and restarts a game when browser speech is unavailable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true });
  });
  await page.goto("/");
  await completeNews(page);
  await expect(page.locator(".speech-status")).toContainText("文字で遊べます");
  await page.getByRole("button", { name: "つぎのニュース →" }).click();
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
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => {
            resolve();
          },
          { once: true },
        );
      });
    }
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".offline-notice")).toBeVisible();
  await completeNews(page);
  expect(errors).toStrictEqual([]);
});
