import { expect, type Locator, type Page } from "@playwright/test";

export const NEWS_QUESTIONS = ["だれが？", "いつ？", "どこで？", "なにを？", "どうした？"];

export async function waitForAppWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
}

export async function activateControl(control: Locator, hasTouch: boolean) {
  if (hasTouch) {
    await control.tap();
  } else {
    await control.click();
  }
}

export async function pressTab(page: Page, browserName: string, backwards = false) {
  // Safari on macOS uses Option+Tab to include buttons in keyboard navigation.
  const option = process.platform === "darwin" && browserName === "webkit" ? "Alt+" : "";
  await page.keyboard.press(`${option}${backwards ? "Shift+" : ""}Tab`);
}

export async function getVisibleBounds(locator: Locator, failureMessage: string) {
  const bounds = await locator.boundingBox();
  if (bounds === null) {
    throw new Error(failureMessage);
  }
  return bounds;
}
