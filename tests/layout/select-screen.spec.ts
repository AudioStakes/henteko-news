import { expect, test } from "@playwright/test";
import { getVisibleBounds } from "../helpers";

const VIEWPORTS = [
  { name: "narrow-android", width: 360, height: 740 },
  { name: "small-phone", width: 375, height: 667 },
  { name: "standard-phone", width: 390, height: 844 },
  { name: "pixel-ish", width: 393, height: 852 },
  { name: "large-phone", width: 430, height: 932 },
];

test.describe("select screen layout", () => {
  for (const viewport of VIEWPORTS) {
    test(`keeps five choices readable in the picture-book layout at ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript(() => {
        // The first five who choices stay short enough for the regular 2/1/2 layout.
        Math.random = () => 0;
      });
      await page.goto("/");
      await page.getByRole("button", { name: "はじめる", exact: true }).click();

      const choices = page.getByTestId("choice-card");
      await expect(choices).toHaveCount(5);
      const grid = page.locator(".choice-grid");
      const first = await getVisibleBounds(choices.nth(0), "First choice must exist");
      const second = await getVisibleBounds(choices.nth(1), "Second choice must exist");
      const middle = await getVisibleBounds(choices.nth(2), "Middle choice must exist");
      const fourth = await getVisibleBounds(choices.nth(3), "Fourth choice must exist");
      const fifth = await getVisibleBounds(choices.nth(4), "Fifth choice must exist");
      expect(Math.abs(first.y - second.y)).toBeLessThanOrEqual(2);
      expect(middle.y).toBeGreaterThan(first.y + first.height);
      expect(fourth.y).toBeGreaterThan(middle.y + middle.height);
      expect(Math.abs(fourth.y - fifth.y)).toBeLessThanOrEqual(2);
      const gridBox = await getVisibleBounds(grid, "Choice grid must exist");
      expect(
        Math.abs(middle.x + middle.width / 2 - (gridBox.x + gridBox.width / 2)),
      ).toBeLessThanOrEqual(2);

      for (const choice of await choices.all()) {
        await choice.scrollIntoViewIfNeeded();
        await expect(choice).toBeInViewport({ ratio: 0.99 });
        const box = await getVisibleBounds(choice, "Each choice must be reachable");
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
        const label = choice.locator(".choice-card__label");
        expect(
          await label.evaluate(
            (element) =>
              element.scrollWidth <= element.clientWidth + 1 &&
              element.scrollHeight <= element.clientHeight + 1,
          ),
        ).toBe(true);
      }

      const footer = page.locator(".app-footer");
      await footer.scrollIntoViewIfNeeded();
      await expect(footer).toBeInViewport({ ratio: 0.99 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        ),
      ).toBe(true);
    });
  }
});
