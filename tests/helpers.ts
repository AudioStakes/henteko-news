import type { Locator } from "@playwright/test";

export async function getVisibleBounds(locator: Locator, failureMessage: string) {
  const bounds = await locator.boundingBox();
  if (bounds === null) {
    throw new Error(failureMessage);
  }
  return bounds;
}
