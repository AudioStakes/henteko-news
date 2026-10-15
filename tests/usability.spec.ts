import { expect, type Locator, type Page, test } from "@playwright/test";
import { activateControl, getVisibleBounds, NEWS_QUESTIONS, pressTab } from "./helpers";

const COMPACT_VIEWPORTS = [
  { name: "small-phone", width: 320, height: 568 },
  { name: "phone-landscape", width: 667, height: 375 },
  { name: "wide-phone-landscape", width: 844, height: 390 },
  { name: "short-desktop", width: 1024, height: 600 },
  { name: "scroll-breakpoint", width: 1024, height: 621 },
];

async function expectNoHorizontalOverflow(page: Page) {
  const sizes = await page.evaluate(() => {
    const main = document.querySelector(".app-shell__main");
    return {
      pageWidth: document.documentElement.clientWidth,
      pageContentWidth: document.documentElement.scrollWidth,
      mainWidth: main?.clientWidth ?? 0,
      mainContentWidth: main?.scrollWidth ?? 0,
    };
  });
  expect(sizes.pageContentWidth).toBeLessThanOrEqual(sizes.pageWidth + 1);
  expect(sizes.mainContentWidth).toBeLessThanOrEqual(sizes.mainWidth + 1);
}

async function expectUsableChoice(choice: Locator) {
  const clippedContainers = await choice.evaluate((element) => {
    const clipped = [];
    for (let parent: Element | null = element; parent !== null; parent = parent.parentElement) {
      const overflow = getComputedStyle(parent).overflowY;
      if (
        (overflow === "hidden" || overflow === "clip") &&
        parent.scrollHeight > parent.clientHeight + 1
      ) {
        clipped.push({
          className: parent.getAttribute("class"),
          height: parent.clientHeight,
          contentHeight: parent.scrollHeight,
        });
      }
    }
    return clipped;
  });
  expect(
    clippedContainers,
    "Choices must remain reachable without scrolling clipped containers",
  ).toStrictEqual([]);
  await choice.scrollIntoViewIfNeeded();
  await expect(choice).toBeInViewport({ ratio: 0.99 });
  const bounds = await getVisibleBounds(
    choice,
    "A choice must remain visible when scrolled into view",
  );
  expect(bounds.height).toBeGreaterThanOrEqual(44);
  const label = choice.locator(".choice-card__label");
  const size = await label.evaluate((element) => ({
    width: element.clientWidth,
    contentWidth: element.scrollWidth,
    height: element.clientHeight,
    contentHeight: element.scrollHeight,
  }));
  expect(size.contentWidth).toBeLessThanOrEqual(size.width + 1);
  expect(size.contentHeight).toBeLessThanOrEqual(size.height + 1);
}

test("keyboard users can create a complete news item and start another", async ({
  page,
  browserName,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true });
  });
  await page.goto("/");
  await pressTab(page, browserName);
  await expect(page.getByRole("button", { name: "音声設定", exact: true })).toBeFocused();
  await pressTab(page, browserName);
  await expect(page.getByRole("button", { name: "ニュースをつくる" })).toBeFocused();
  await page.keyboard.press("Enter");

  for (const label of NEWS_QUESTIONS) {
    await expect(page.getByRole("heading", { name: label, exact: true })).toBeFocused();
    await pressTab(page, browserName);
    await expect(page.getByTestId("choice-card").first()).toBeFocused();
    await page.keyboard.press("Enter");
  }

  await expect(page.getByRole("heading", { name: "かんせいニュース", exact: true })).toBeFocused();
  await expect(page.locator(".result-text")).toHaveCount(5);
  await pressTab(page, browserName);
  await expect(page.getByRole("button", { name: "つぎのニュース →" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "だれが？", exact: true })).toBeFocused();
});

for (const viewport of COMPACT_VIEWPORTS) {
  test(`all game screens remain readable and operable at ${viewport.name}`, async ({
    page,
    hasTouch,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.addInitScript(() => {
      // Keep the displayed words reproducible across browsers and viewport cases.
      Math.random = () => 0.5;
      Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true });
    });
    await page.goto("/");
    await expectNoHorizontalOverflow(page);
    await activateControl(page.getByRole("button", { name: "ニュースをつくる" }), hasTouch);

    for (const label of NEWS_QUESTIONS) {
      await expect(page.getByRole("heading", { name: label, exact: true })).toBeVisible();
      const choices = page.getByTestId("choice-card");
      await expect(choices).toHaveCount(5);
      for (const choice of await choices.all()) {
        await expectUsableChoice(choice);
      }
      await expectNoHorizontalOverflow(page);
      await activateControl(choices.first(), hasTouch);
    }

    await expect(page.locator(".result-text")).toHaveCount(5);
    const result = page.getByRole("article", { name: "かんせいニュース", exact: true });
    const resultTextFits = await result
      .locator(".result-text")
      .evaluateAll((lines) => lines.every((line) => line.scrollWidth <= line.clientWidth + 1));
    expect(resultTextFits).toBe(true);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: test.info().outputPath(`${viewport.name}-result.png`) });
    await activateControl(page.getByRole("button", { name: "つぎのニュース →" }), hasTouch);
    await expect(page.getByRole("heading", { name: "だれが？", exact: true })).toBeVisible();
    expect(errors).toStrictEqual([]);
  });
}
