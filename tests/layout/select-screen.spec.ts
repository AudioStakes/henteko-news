import { expect, type Locator, type Page, test } from "@playwright/test";

type Viewport = {
  name: string;
  width: number;
  height: number;
};

const VIEWPORTS: Viewport[] = [
  { name: "narrow-android", width: 360, height: 740 },
  { name: "small-phone", width: 375, height: 667 },
  { name: "standard-phone", width: 390, height: 844 },
  { name: "pixel-ish", width: 393, height: 852 },
  { name: "large-phone", width: 430, height: 932 },
];

const TOLERANCE_PX = 2;

async function expectInViewport(locator: Locator, viewport: Viewport, label: string) {
  const box = await locator.boundingBox();
  expect(box, `${viewport.name}: ${label} should have a visible bounding box`).not.toBeNull();
  if (!box) return;

  expect(box.width, `${viewport.name}: ${label} width should be > 0`).toBeGreaterThan(0);
  expect(box.height, `${viewport.name}: ${label} height should be > 0`).toBeGreaterThan(0);
  expect(box.x, `${viewport.name}: ${label} left edge should be in viewport`).toBeGreaterThanOrEqual(
    -TOLERANCE_PX,
  );
  expect(box.y, `${viewport.name}: ${label} top edge should be in viewport`).toBeGreaterThanOrEqual(
    -TOLERANCE_PX,
  );
  expect(box.x + box.width, `${viewport.name}: ${label} right edge should be in viewport`).toBeLessThanOrEqual(
    viewport.width + TOLERANCE_PX,
  );
  expect(
    box.y + box.height,
    `${viewport.name}: ${label} bottom edge should be in viewport`,
  ).toBeLessThanOrEqual(viewport.height + TOLERANCE_PX);
}

async function expectInsideParent(
  child: Locator,
  parent: Locator,
  viewport: Viewport,
  label: string,
) {
  const childBox = await child.boundingBox();
  const parentBox = await parent.boundingBox();

  expect(childBox, `${viewport.name}: ${label} child box should exist`).not.toBeNull();
  expect(parentBox, `${viewport.name}: ${label} parent box should exist`).not.toBeNull();
  if (!childBox || !parentBox) return;

  expect(childBox.x, `${viewport.name}: ${label} left edge inside parent`).toBeGreaterThanOrEqual(
    parentBox.x - TOLERANCE_PX,
  );
  expect(childBox.y, `${viewport.name}: ${label} top edge inside parent`).toBeGreaterThanOrEqual(
    parentBox.y - TOLERANCE_PX,
  );
  expect(childBox.x + childBox.width, `${viewport.name}: ${label} right edge inside parent`).toBeLessThanOrEqual(
    parentBox.x + parentBox.width + TOLERANCE_PX,
  );
  expect(
    childBox.y + childBox.height,
    `${viewport.name}: ${label} bottom edge inside parent`,
  ).toBeLessThanOrEqual(parentBox.y + parentBox.height + TOLERANCE_PX);
}

async function expectNoVerticalOverflow(page: Page, viewport: Viewport) {
  const overflow = await page.evaluate(() => {
    const root = document.querySelector("#root");
    return {
      innerHeight: window.innerHeight,
      documentScrollHeight: document.documentElement.scrollHeight,
      bodyScrollHeight: document.body.scrollHeight,
      rootScrollHeight: root?.scrollHeight ?? 0,
    };
  });

  expect(
    overflow.documentScrollHeight,
    `${viewport.name}: document.documentElement scrollHeight overflows viewport`,
  ).toBeLessThanOrEqual(overflow.innerHeight + TOLERANCE_PX);
  expect(overflow.bodyScrollHeight, `${viewport.name}: body scrollHeight overflows viewport`).toBeLessThanOrEqual(
    overflow.innerHeight + TOLERANCE_PX,
  );
  expect(overflow.rootScrollHeight, `${viewport.name}: #root scrollHeight overflows viewport`).toBeLessThanOrEqual(
    overflow.innerHeight + TOLERANCE_PX,
  );
}

test.describe("select screen layout", () => {
  for (const viewport of VIEWPORTS) {
    test(`keeps select choices and footer in-bounds at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");

      await page.getByRole("button", { name: "ニュースをつくる" }).click();

      const appShell = page.locator(".app-shell");
      const appMain = page.locator(".app-shell__main");
      const footer = page.locator(".app-footer");
      const selectScreen = page.locator(".select-screen");
      const choiceGrid = page.locator(".choice-grid");
      const choiceCards = page.locator(".choice-card");

      await expect(appShell).toBeVisible();
      await expect(appMain).toBeVisible();
      await expect(footer).toBeVisible();
      await expect(selectScreen).toBeVisible();
      await expect(choiceGrid).toBeVisible();
      await expect(choiceCards).toHaveCount(5);

      await expectNoVerticalOverflow(page, viewport);
      await expectInViewport(appShell, viewport, ".app-shell");
      await expectInViewport(appMain, viewport, ".app-shell__main");
      await expectInViewport(footer, viewport, ".app-footer");
      await expectInViewport(selectScreen, viewport, ".select-screen");
      await expectInViewport(choiceGrid, viewport, ".choice-grid");

      for (let i = 0; i < 5; i += 1) {
        const choice = choiceCards.nth(i);
        const label = `.choice-card:nth(${i + 1})`;

        await expectInViewport(choice, viewport, label);
        await expectInsideParent(choice, choiceGrid, viewport, `${label} inside .choice-grid`);
        await expectInsideParent(choice, selectScreen, viewport, `${label} inside .select-screen`);
        await expectInsideParent(choice, appMain, viewport, `${label} inside .app-shell__main`);
        await expectInsideParent(choice, appShell, viewport, `${label} inside .app-shell`);

        const choiceBox = await choice.boundingBox();
        expect(choiceBox, `${viewport.name}: ${label} should have box`).not.toBeNull();
        if (!choiceBox) continue;
        expect(choiceBox.height, `${viewport.name}: ${label} height should be practical`).toBeGreaterThanOrEqual(32);
      }

      const lastChoiceBox = await choiceCards.nth(4).boundingBox();
      const footerBox = await footer.boundingBox();

      expect(lastChoiceBox, `${viewport.name}: last choice should have box`).not.toBeNull();
      expect(footerBox, `${viewport.name}: footer should have box`).not.toBeNull();
      if (lastChoiceBox && footerBox) {
        expect(
          lastChoiceBox.y + lastChoiceBox.height,
          `${viewport.name}: last choice should not overlap or pass footer top`,
        ).toBeLessThanOrEqual(footerBox.y + TOLERANCE_PX);
      }
    });
  }
});
