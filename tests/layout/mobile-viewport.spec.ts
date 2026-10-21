import { fileURLToPath } from "node:url";
import { expect, type Page, test } from "@playwright/test";
import { getVisibleBounds, NEWS_QUESTIONS } from "../helpers";
import { expectOneScreen, expectUnclippedText } from "./viewport-helpers";

const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 349, height: 640 },
  { width: 350, height: 640 },
  { width: 351, height: 640 },
  { width: 390, height: 799 },
  { width: 390, height: 800 },
  { width: 390, height: 801 },
];

type WordReader = { readTsConstArray: (path: string, name: string) => Promise<unknown> };

function isWordReader(value: unknown): value is WordReader {
  return (
    typeof value === "object" &&
    value !== null &&
    "readTsConstArray" in value &&
    typeof value.readTsConstArray === "function"
  );
}

async function loadWords(path: string, name: string) {
  // Reuse the Node parser without importing application types into the E2E TypeScript project.
  const reader: unknown = await import(
    new URL("../../scripts/words-utils.mjs", import.meta.url).href
  );
  if (!isWordReader(reader)) {
    throw new Error("The repository word parser is unavailable");
  }
  const words: unknown = await reader.readTsConstArray(path, name);
  if (!Array.isArray(words)) {
    throw new Error(`${name} must contain a word array`);
  }
  return words.map((word: unknown) => {
    if (typeof word === "string") {
      return { display: word, speech: word };
    }
    if (
      typeof word === "object" &&
      word !== null &&
      "display" in word &&
      "speech" in word &&
      typeof word.display === "string" &&
      typeof word.speech === "string"
    ) {
      return { display: word.display, speech: word.speech };
    }
    throw new Error(`Invalid word in ${name}`);
  });
}

const CATEGORY_WORDS = await Promise.all(
  ["who", "when", "where", "what", "action"].map(async (key) => {
    const path = fileURLToPath(new URL(`../../src/data/words/${key}.ts`, import.meta.url));
    const name = `${key.toUpperCase()}_WORDS`;
    const words = await loadWords(path, name);
    return { key, words };
  }),
);

const LONGEST_CHOICES = CATEGORY_WORDS.map((category, index) => {
  const words = category.words;
  const longest = words.reduce((a, b) =>
    Array.from(a.display.replace(/[がをで]$/u, "")).length >=
    Array.from(b.display.replace(/[がをで]$/u, "")).length
      ? a
      : b,
  );
  const longestIndex = words.indexOf(longest);
  // Preserve the order except for moving the longest word to the first card in the shuffle.
  const randomValues = Array.from({ length: words.length - 1 }, (_, index) => {
    const i = words.length - 1 - index;
    return (i === longestIndex ? 0.5 : i + 0.5) / (i + 1);
  });
  return {
    key: category.key,
    question: NEWS_QUESTIONS[index] ?? "",
    choice: longest.display.replace(/[がをで]$/u, ""),
    word: longest,
    randomValues,
  };
});

test.use({ serviceWorkers: "block" });

async function installFixedChoices(page: Page) {
  await page.addInitScript(() => {
    // Fix the card contents, independent of the browser and test worker.
    Math.random = () => 0;
    Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true });
  });
}

async function installHeldSpeech(page: Page) {
  await page.addInitScript(
    (categoryValues) => {
      let values: number[] = [];
      Math.random = () => values.shift() ?? 0;
      window.addEventListener("test:shuffle-category", (event) => {
        if (!(event instanceof CustomEvent)) {
          return;
        }
        const index: unknown = event.detail;
        if (typeof index !== "number") {
          throw new Error("A category index is required");
        }
        values = [...(categoryValues[index] ?? [])];
      });
      let current: SpeechSynthesisUtterance | null = null;
      const synthesis = Object.assign(new EventTarget(), {
        getVoices: () => [],
        cancel: () => {
          current = null;
        },
        speak: (utterance: SpeechSynthesisUtterance) => {
          current = utterance;
        },
      });
      window.addEventListener("test:speech-start", () =>
        current?.dispatchEvent(new Event("start")),
      );
      window.addEventListener("test:speech-error", () =>
        current?.dispatchEvent(new Event("error")),
      );
      Object.defineProperty(window, "speechSynthesis", { value: synthesis, configurable: true });
    },
    LONGEST_CHOICES.map(({ randomValues }) => randomValues),
  );
}

async function prepareChoices(page: Page, categoryIndex: number) {
  await page.evaluate((index) => {
    window.dispatchEvent(new CustomEvent("test:shuffle-category", { detail: index }));
  }, categoryIndex);
}

for (const viewport of VIEWPORTS) {
  test(`all seven game screens fit without scrolling at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await installFixedChoices(page);
    await page.goto("/");
    await expectOneScreen(page, "top");
    await page.getByRole("button", { name: "はじめる", exact: true }).click();

    for (const question of NEWS_QUESTIONS) {
      await expect(page.getByRole("heading", { name: question, exact: true })).toBeVisible();
      await expect(page.getByTestId("choice-card")).toHaveCount(5);
      await expectOneScreen(page, question);
      await page.getByTestId("choice-card").first().click();
    }
    await expect(page.locator(".news-line")).toHaveCount(5);
    await expect(page.locator(".error-note")).toContainText("もじで たのしんでね");
    await expectOneScreen(page, "result with unavailable speech notice");
  });
}

test("short choices retain their centered 2/1/2 arrangement", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await installFixedChoices(page);
  await page.goto("/");
  await page.getByRole("button", { name: "はじめる", exact: true }).click();
  const grid = page.locator(".choice-grid");
  await expect(grid).not.toHaveClass(/long-choices/);
  await expect(page.getByTestId("choice-card")).toHaveCount(5);
  const cards = page.getByTestId("choice-card");
  const first = await getVisibleBounds(cards.nth(0), "First choice is required");
  const second = await getVisibleBounds(cards.nth(1), "Second choice is required");
  const middle = await getVisibleBounds(cards.nth(2), "Middle choice is required");
  const fourth = await getVisibleBounds(cards.nth(3), "Fourth choice is required");
  const fifth = await getVisibleBounds(cards.nth(4), "Fifth choice is required");
  expect(Math.abs(first.y - second.y)).toBeLessThanOrEqual(1);
  expect(middle.y).toBeGreaterThanOrEqual(first.y + first.height);
  expect(fourth.y).toBeGreaterThanOrEqual(middle.y + middle.height);
  expect(Math.abs(fourth.y - fifth.y)).toBeLessThanOrEqual(1);
  const gridBounds = await getVisibleBounds(grid, "Choice grid must be visible");
  expect(
    Math.abs(middle.x + middle.width / 2 - (gridBounds.x + gridBounds.width / 2)),
  ).toBeLessThanOrEqual(1);
  await expectOneScreen(page, "short choices");
});

test("the longest news phrases fit together with the offline notice on the smallest phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const longestWords = Object.fromEntries(
    CATEGORY_WORDS.map(({ key, words }) => {
      const longest = words.reduce((a, b) =>
        Array.from(a.speech).length >= Array.from(b.speech).length ? a : b,
      );
      return [key, longest.speech];
    }),
  );
  await page.goto(`/?${new URLSearchParams({ debugResult: "1", ...longestWords }).toString()}`);
  await expect(page.locator(".news-line")).toHaveCount(5);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(page.locator(".offline-notice")).toBeVisible();
  await expectOneScreen(page, "longest result while offline");
});

test("short news does not grow beyond the available height on the smallest phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(
    `/?${new URLSearchParams({ debugResult: "1", who: "アリが", when: "いま", where: "そとで", what: "すなを", action: "みました" }).toString()}`,
  );
  await expect(page.locator(".news-line")).toHaveCount(5);
  await expectOneScreen(page, "short result");
});

for (const height of [568, 800]) {
  test(`longest choices and speech states fit with offline notice at 320x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height });
    await installHeldSpeech(page);
    await page.goto("/");
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await expect(page.locator(".offline-notice")).toBeVisible();
    await expectOneScreen(page, "offline top");
    await prepareChoices(page, 0);
    await page.getByRole("button", { name: "はじめる", exact: true }).click();
    for (const [index, { question, choice }] of LONGEST_CHOICES.entries()) {
      await expect(page.getByRole("heading", { name: question, exact: true })).toBeVisible();
      const first = page.getByTestId("choice-card").first();
      await expect(first).toHaveText(choice);
      await expect(page.locator(".choice-grid")).toHaveClass(/long-choices/);
      await expectOneScreen(page, `${question} with the longest choice and offline notice`);
      await prepareChoices(page, index + 1);
      await first.click();
    }
    const caster = page.locator(".result-screen .caster");
    await expect(caster).toHaveAttribute("data-phase", "preparing");
    await expectOneScreen(page, "preparing speech");
    await page.evaluate(() => window.dispatchEvent(new Event("test:speech-start")));
    await expect(caster).toHaveAttribute("data-phase", "speaking");
    await expectOneScreen(page, "speaking");
    await page.evaluate(() => window.dispatchEvent(new Event("test:speech-error")));
    await expect(caster).toHaveAttribute("data-phase", "idle");
    await expect(page.locator(".error-note")).not.toBeEmpty();
    await expectOneScreen(page, "speech error with offline notice");
  });
}

for (const scaling of [
  { name: "200 percent root text", css: "font-size:200%" },
  {
    name: "200 percent text autosizing",
    css: "text-size-adjust:200%;-webkit-text-size-adjust:200%",
  },
]) {
  test(`${scaling.name} can scroll to every choice, restart and footer without clipping`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await installHeldSpeech(page);
    await page.goto("/");
    await page.addStyleTag({ content: `html { ${scaling.css} }` });
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await expect(page.locator(".offline-notice")).toBeVisible();
    await prepareChoices(page, 0);
    await page.getByRole("button", { name: "はじめる", exact: true }).click();
    for (const [index, { question, choice: expectedChoice }] of LONGEST_CHOICES.entries()) {
      await expect(page.getByRole("heading", { name: question, exact: true })).toBeVisible();
      const choices = page.getByTestId("choice-card");
      await expect(choices).toHaveCount(5);
      await expect(choices.first()).toHaveText(expectedChoice);
      for (const choice of await choices.all()) {
        await choice.scrollIntoViewIfNeeded();
        await expect(choice).toBeInViewport({ ratio: 0.99 });
        expect(
          await choice.locator(".choice-card__label").evaluate((label) => ({
            clipped:
              label.scrollWidth > label.clientWidth + 1 ||
              label.scrollHeight > label.clientHeight + 1,
            ellipsis: getComputedStyle(label).textOverflow === "ellipsis",
          })),
        ).toStrictEqual({ clipped: false, ellipsis: false });
      }
      await expectUnclippedText(page, false);
      await page.locator(".app-footer").scrollIntoViewIfNeeded();
      await expect(page.locator(".app-footer")).toBeInViewport({ ratio: 0.99 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        ),
      ).toBe(true);
      await prepareChoices(page, index + 1);
      await choices.first().click();
    }
    await expect(page.locator(".news-line")).toHaveCount(5);
    const caster = page.locator(".result-screen .caster");
    await expect(caster).toHaveAttribute("data-phase", "preparing");
    await expectUnclippedText(page, false);
    await expect(caster).toHaveAttribute("data-phase", "preparing");
    await page.evaluate(() => window.dispatchEvent(new Event("test:speech-error")));
    await expect(caster).toHaveAttribute("data-phase", "idle");
    await expect(page.locator(".error-note")).not.toBeEmpty();
    await expectUnclippedText(page, false);
    expect(
      await page
        .locator(".news-line")
        .evaluateAll((lines) =>
          lines.every(
            (line) =>
              line.scrollWidth <= line.clientWidth + 1 &&
              line.scrollHeight <= line.clientHeight + 1,
          ),
        ),
    ).toBe(true);
    const restart = page.getByRole("button", { name: "つぎをつくる", exact: true });
    await restart.scrollIntoViewIfNeeded();
    await expect(restart).toBeInViewport({ ratio: 0.99 });
    await page.locator(".app-footer").scrollIntoViewIfNeeded();
    await expect(page.locator(".app-footer")).toBeInViewport({ ratio: 0.99 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      ),
    ).toBe(true);
  });
}
