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

test("completed news keeps each normal phrase on one full line across live resizes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  const words = {
    who: "しょうぼうしさんが",
    when: "ぎゅうにゅうをふきだしたあと",
    where: "さばくで",
    what: "おほしさまを",
    action: "パタパタあおぎました",
  };
  await page.goto(`/?${new URLSearchParams({ debugResult: "1", ...words }).toString()}`);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const lines = page
    .getByRole("article", { name: "かんせいニュース", exact: true })
    .locator(".news-line");

  for (const width of [320, 390, 696, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(lines).toHaveText([
      words.who,
      words.when,
      words.where,
      words.what,
      `${words.action}！`,
    ]);
    await expect
      .poll(
        () =>
          lines.evaluateAll((elements) =>
            elements.map((element) => {
              const range = document.createRange();
              range.selectNodeContents(element);
              const fragments = Array.from(range.getClientRects()).filter(
                (rect) => rect.width > 0 && rect.height > 0,
              );
              const bounds = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              const lineClamp = style.getPropertyValue("-webkit-line-clamp");
              return {
                fragmentCount: fragments.length,
                clipsText:
                  element.scrollWidth > element.clientWidth + 1 ||
                  element.scrollHeight > element.clientHeight + 1 ||
                  fragments.some(
                    (rect) => rect.left < bounds.left - 1 || rect.right > bounds.right + 1,
                  ),
                ellipsis:
                  style.textOverflow === "ellipsis" || (lineClamp !== "" && lineClamp !== "none"),
              };
            }),
          ),
        `${width}px: every phrase must occupy one unclipped visual line`,
      )
      .toStrictEqual(
        Array.from({ length: 5 }, () => ({ fragmentCount: 1, clipsText: false, ellipsis: false })),
      );
    await expectNoHorizontalOverflow(page);
  }
});

test("long completed news stays fully readable and restart stays reachable on a small phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true });
  });
  const words = {
    who: "バスのうんてんしゅさんが",
    when: "とてもとてもながいひるやすみに",
    where: "どうぶつたちがあつまるひろばで",
    what: "おおきなおおきなおべんとうを",
    action: "れいぞうこでひやしました",
  };
  await page.goto(`/?${new URLSearchParams({ debugResult: "1", ...words }).toString()}`);
  const lines = page
    .getByRole("article", { name: "かんせいニュース", exact: true })
    .locator(".news-line");
  await expect(lines).toHaveText([
    words.who,
    words.when,
    words.where,
    words.what,
    `${words.action}！`,
  ]);
  for (const line of await lines.all()) {
    expect(
      await line.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          clipsText:
            element.scrollWidth > element.clientWidth + 1 ||
            element.scrollHeight > element.clientHeight + 1,
          ellipsis:
            style.textOverflow === "ellipsis" ||
            (style.getPropertyValue("-webkit-line-clamp") !== "" &&
              style.getPropertyValue("-webkit-line-clamp") !== "none"),
        };
      }),
    ).toStrictEqual({ clipsText: false, ellipsis: false });
  }
  await expectNoHorizontalOverflow(page);
  const restart = page.getByRole("button", { name: "つぎをつくる", exact: true });
  await restart.scrollIntoViewIfNeeded();
  await expect(restart).toBeInViewport({ ratio: 0.99 });
  const bounds = await getVisibleBounds(restart, "Restart must be reachable after long news");
  expect(bounds.height).toBeGreaterThanOrEqual(44);
  await expect(restart).toBeEnabled();
});

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
  await expect(page.getByRole("button", { name: "はじめる" })).toBeFocused();
  await page.keyboard.press("Enter");

  for (const label of NEWS_QUESTIONS) {
    await expect(page.getByRole("heading", { name: label, exact: true })).toBeFocused();
    await pressTab(page, browserName);
    await expect(page.getByTestId("choice-card").first()).toBeFocused();
    await page.keyboard.press("Enter");
  }

  await expect(
    page.getByRole("article", { name: "かんせいニュース", exact: true }).getByRole("heading"),
  ).toBeFocused();
  await expect(page.locator(".news-line")).toHaveCount(5);
  await pressTab(page, browserName);
  await expect(page.getByRole("button", { name: "つぎをつくる" })).toBeFocused();
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
    await activateControl(page.getByRole("button", { name: "はじめる" }), hasTouch);

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

    await expect(page.locator(".news-line")).toHaveCount(5);
    const result = page.getByRole("article", { name: "かんせいニュース", exact: true });
    const resultTextFits = await result
      .locator(".news-line")
      .evaluateAll((lines) => lines.every((line) => line.scrollWidth <= line.clientWidth + 1));
    expect(resultTextFits).toBe(true);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: test.info().outputPath(`${viewport.name}-result.png`) });
    await activateControl(page.getByRole("button", { name: "つぎをつくる" }), hasTouch);
    await expect(page.getByRole("heading", { name: "だれが？", exact: true })).toBeVisible();
    expect(errors).toStrictEqual([]);
  });
}
