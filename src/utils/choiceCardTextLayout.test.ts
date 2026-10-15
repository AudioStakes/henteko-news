import { describe, expect, test } from "vitest";
import {
  CHOICE_CARD_WIDTH_RULES,
  calculateChoiceCardTextLayout,
  getChoiceCardWidthRule,
} from "./choiceCardTextLayout";

const GRID_WIDTHS = CHOICE_CARD_WIDTH_RULES.map(
  ({ label, maxGridWidth, availableTextWidth, maxFontSize }) => ({
    label,
    gridWidth: maxGridWidth,
    availableTextWidth,
    maxFontSize,
  }),
);

const CARD_TEXTS = [
  {
    label: "minimum character count",
    text: "いつ",
    expectedCharacterCount: 2,
    expectedFontSizes: {
      304: 24,
      373: 27,
      410: 35,
    },
  },
  {
    label: "regular character count",
    text: "くすぐられたあと",
    expectedCharacterCount: 8,
    expectedFontSizes: {
      304: 24,
      373: 27,
      410: 35,
    },
  },
  {
    label: "maximum character count",
    text: "そうじきですいそうになった",
    expectedCharacterCount: 13,
    expectedFontSizes: {
      304: 18,
      373: 23,
      410: 26,
    },
  },
] as const;

describe("calculateChoiceCardTextLayout", () => {
  test.each(
    GRID_WIDTHS.flatMap(({ label: widthLabel, gridWidth, availableTextWidth, maxFontSize }) =>
      CARD_TEXTS.map((cardText) => ({
        name: `${widthLabel} / ${cardText.label}`,
        gridWidth,
        availableTextWidth,
        maxFontSize,
        ...cardText,
      })),
    ),
  )(
    "$name",
    ({ gridWidth, availableTextWidth, text, expectedCharacterCount, expectedFontSizes }) => {
      const layout = calculateChoiceCardTextLayout({
        gridWidth,
        text,
        minFontSize: 18,
        maxFontSize: 38,
        glyphWidthRatio: 1,
      });

      const expectedFontSize = expectedFontSizes[gridWidth];

      expect(layout.characterCount).toBe(expectedCharacterCount);
      expect(layout.availableTextWidth).toBe(availableTextWidth);
      expect(layout.fontSize).toBe(expectedFontSize);
      expect(layout.measuredWidth).toBeLessThanOrEqual(availableTextWidth);
      expect(layout.widthRule).toStrictEqual(getChoiceCardWidthRule(gridWidth));
    },
  );

  test.each(GRID_WIDTHS)("caps short text font size on $label", ({ gridWidth, maxFontSize }) => {
    const layout = calculateChoiceCardTextLayout({
      gridWidth,
      text: "うみ",
      minFontSize: 18,
      maxFontSize: 38,
      glyphWidthRatio: 1,
    });

    expect(layout.fontSize).toBe(maxFontSize);
  });

  test("uses the largest width rule above the maximum screen width", () => {
    const layout = calculateChoiceCardTextLayout({
      gridWidth: 480,
      text: "そうじきですいそうになった",
      minFontSize: 18,
      maxFontSize: 38,
      glyphWidthRatio: 1,
    });

    expect(layout.widthRule).toStrictEqual(
      CHOICE_CARD_WIDTH_RULES[CHOICE_CARD_WIDTH_RULES.length - 1],
    );
    expect(layout.measuredWidth).toBeLessThanOrEqual(layout.availableTextWidth);
  });

  test("uses the actual card width below the smallest reference screen", () => {
    const layout = calculateChoiceCardTextLayout({
      gridWidth: 250,
      text: "くすぐられたあと",
      minFontSize: 18,
      maxFontSize: 38,
      glyphWidthRatio: 1,
    });

    expect(layout.availableTextWidth).toBe(226);
    expect(layout.measuredWidth).toBeLessThanOrEqual(layout.availableTextWidth);
  });
});
