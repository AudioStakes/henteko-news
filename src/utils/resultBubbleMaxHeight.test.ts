import { describe, expect, test } from "vitest";
import { calculateSafeResultBubbleMaxHeight } from "./resultBubbleMaxHeight";

describe("calculateSafeResultBubbleMaxHeight", () => {
  test("returns the width-based max when vertical metrics are unavailable", () => {
    const maxHeight = calculateSafeResultBubbleMaxHeight({
      widthBasedMaxBubbleHeight: 324,
      resultScreenHeight: 0,
      actionsHeight: 96,
      mascotHeight: 180,
      mascotOverlap: 8,
      bubbleCharacterGap: 2,
      bubblePaddingBlock: 62,
      headerSafeTopGap: 48,
    });

    expect(maxHeight).toBe(324);
  });

  test("returns the width-based max when actions or padding metrics are unavailable", () => {
    const missingActions = calculateSafeResultBubbleMaxHeight({
      widthBasedMaxBubbleHeight: 324,
      resultScreenHeight: 620,
      actionsHeight: 0,
      mascotHeight: 180,
      mascotOverlap: 8,
      bubbleCharacterGap: 2,
      bubblePaddingBlock: 62,
      headerSafeTopGap: 16,
    });
    const missingPadding = calculateSafeResultBubbleMaxHeight({
      widthBasedMaxBubbleHeight: 324,
      resultScreenHeight: 620,
      actionsHeight: 96,
      mascotHeight: 180,
      mascotOverlap: 8,
      bubbleCharacterGap: 2,
      bubblePaddingBlock: 0,
      headerSafeTopGap: 16,
    });

    expect(missingActions).toBe(324);
    expect(missingPadding).toBe(324);
  });

  test("returns a smaller value when vertical space is constrained", () => {
    const maxHeight = calculateSafeResultBubbleMaxHeight({
      widthBasedMaxBubbleHeight: 324,
      resultScreenHeight: 520,
      actionsHeight: 116,
      mascotHeight: 196,
      mascotOverlap: 8,
      bubbleCharacterGap: 2,
      bubblePaddingBlock: 62,
      headerSafeTopGap: 48,
    });

    expect(maxHeight).toBeLessThan(324);
    expect(maxHeight).toBe(104);
  });

  test("never returns a negative height", () => {
    const maxHeight = calculateSafeResultBubbleMaxHeight({
      widthBasedMaxBubbleHeight: 324,
      resultScreenHeight: 220,
      actionsHeight: 140,
      mascotHeight: 200,
      mascotOverlap: 4,
      bubbleCharacterGap: 4,
      bubblePaddingBlock: 68,
      headerSafeTopGap: 72,
    });

    expect(maxHeight).toBe(0);
  });

  test("preserves width-based max when there is enough space", () => {
    const maxHeight = calculateSafeResultBubbleMaxHeight({
      widthBasedMaxBubbleHeight: 300,
      resultScreenHeight: 900,
      actionsHeight: 110,
      mascotHeight: 170,
      mascotOverlap: 8,
      bubbleCharacterGap: 2,
      bubblePaddingBlock: 62,
      headerSafeTopGap: 48,
    });

    expect(maxHeight).toBe(300);
  });

  test("accounts for padding block in the vertical cap", () => {
    const lessPadding = calculateSafeResultBubbleMaxHeight({
      widthBasedMaxBubbleHeight: 324,
      resultScreenHeight: 560,
      actionsHeight: 116,
      mascotHeight: 196,
      mascotOverlap: 8,
      bubbleCharacterGap: 2,
      bubblePaddingBlock: 40,
      headerSafeTopGap: 48,
    });
    const morePadding = calculateSafeResultBubbleMaxHeight({
      widthBasedMaxBubbleHeight: 324,
      resultScreenHeight: 560,
      actionsHeight: 116,
      mascotHeight: 196,
      mascotOverlap: 8,
      bubbleCharacterGap: 2,
      bubblePaddingBlock: 70,
      headerSafeTopGap: 48,
    });

    expect(morePadding).toBeLessThan(lessPadding);
  });

  test("returns a larger safe value when the header safe gap is reduced", () => {
    const largerGap = calculateSafeResultBubbleMaxHeight({
      widthBasedMaxBubbleHeight: 336,
      resultScreenHeight: 560,
      actionsHeight: 112,
      mascotHeight: 188,
      mascotOverlap: 8,
      bubbleCharacterGap: 2,
      bubblePaddingBlock: 62,
      headerSafeTopGap: 24,
    });
    const smallerGap = calculateSafeResultBubbleMaxHeight({
      widthBasedMaxBubbleHeight: 336,
      resultScreenHeight: 560,
      actionsHeight: 112,
      mascotHeight: 188,
      mascotOverlap: 8,
      bubbleCharacterGap: 2,
      bubblePaddingBlock: 62,
      headerSafeTopGap: 12,
    });

    expect(smallerGap).toBeGreaterThanOrEqual(largerGap);
  });

  test("returns a larger safe value when the mascot is smaller", () => {
    const largerMascot = calculateSafeResultBubbleMaxHeight({
      widthBasedMaxBubbleHeight: 336,
      resultScreenHeight: 560,
      actionsHeight: 112,
      mascotHeight: 204,
      mascotOverlap: 8,
      bubbleCharacterGap: 2,
      bubblePaddingBlock: 62,
      headerSafeTopGap: 16,
    });
    const smallerMascot = calculateSafeResultBubbleMaxHeight({
      widthBasedMaxBubbleHeight: 336,
      resultScreenHeight: 560,
      actionsHeight: 112,
      mascotHeight: 160,
      mascotOverlap: 8,
      bubbleCharacterGap: 2,
      bubblePaddingBlock: 62,
      headerSafeTopGap: 16,
    });

    expect(smallerMascot).toBeGreaterThanOrEqual(largerMascot);
  });
});
