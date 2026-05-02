import { describe, expect, test } from "vitest";
import { calculateResultTextLayout } from "./resultTextLayout";

const FRAME_WIDTHS = [
  { label: "minimum screen width", frameWidth: 304, maxBubbleHeight: 307 },
  { label: "regular screen width", frameWidth: 373, maxBubbleHeight: 336 },
  { label: "maximum screen width", frameWidth: 410, maxBubbleHeight: 355 },
] as const;

const LINE_SETS = [
  {
    label: "minimum character count",
    lines: ["アリが", "いまで", "うみで", "アイスを", "みた"],
    expectedMaxCharacterCount: 4,
    expectedFontSizes: {
      304: 51,
      373: 56,
      410: 59,
    },
  },
  {
    label: "maximum character count",
    lines: [
      "しょうぼうしさんが",
      "リモコンをさがしているとき",
      "すべりだいのてっぺんで",
      "きょうりゅうのたまごを",
      "そうじきですいそうになった",
    ],
    expectedMaxCharacterCount: 15,
    expectedFontSizes: {
      304: 20,
      373: 24,
      410: 27,
    },
  },
] as const;

describe("calculateResultTextLayout", () => {
  test.each(
    FRAME_WIDTHS.flatMap(({ label: widthLabel, frameWidth, maxBubbleHeight }) =>
      LINE_SETS.map((lineSet) => ({
        name: `${widthLabel} / ${lineSet.label}`,
        frameWidth,
        maxBubbleHeight,
        ...lineSet,
      })),
    ),
  )("$name", ({
    frameWidth,
    maxBubbleHeight,
    lines,
    expectedMaxCharacterCount,
    expectedFontSizes,
  }) => {
    const layout = calculateResultTextLayout({
      frameWidth,
      lines,
      maxFontSize: 64,
      maxBubbleHeight,
      lineGapRatio: 0.24,
      glyphWidthRatio: 1,
    });

    const expectedFontSize = expectedFontSizes[frameWidth as keyof typeof expectedFontSizes];

    expect(layout.maxCharacterCount).toBe(expectedMaxCharacterCount);
    expect(layout.fontSize).toBe(expectedFontSize);
    expect(layout.lineGap).toBe(Math.ceil(expectedFontSize * 0.24));
    expect(layout.bubbleHeight).toBe(layout.contentHeight);
    expect(layout.lineLayouts).toHaveLength(5);
    expect(new Set(layout.lineLayouts.map((line) => line.fontSize))).toEqual(
      new Set([expectedFontSize]),
    );

    for (const line of layout.lineLayouts) {
      expect(line.measuredWidth).toBeLessThanOrEqual(frameWidth);
    }

    const totalTextHeight =
      layout.lineLayouts.length * layout.fontSize +
      (layout.lineLayouts.length - 1) * layout.lineGap;

    expect(layout.contentHeight).toBe(totalTextHeight);
    expect(totalTextHeight).toBeLessThanOrEqual(layout.bubbleHeight);
  });

  test.each(FRAME_WIDTHS)("keeps bubble content within max height on $label", ({
    frameWidth,
    maxBubbleHeight,
  }) => {
    const layout = calculateResultTextLayout({
      frameWidth,
      lines: ["ゆうしゃが", "はみがきのあと", "おみせのまえで", "ぬいぐるみを", "あつめました！"],
      maxFontSize: 64,
      maxBubbleHeight,
      lineGapRatio: 0.24,
      glyphWidthRatio: 1,
    });

    expect(layout.contentHeight).toBeLessThanOrEqual(maxBubbleHeight);
    expect(layout.bubbleHeight).toBeLessThanOrEqual(maxBubbleHeight);
  });
});
