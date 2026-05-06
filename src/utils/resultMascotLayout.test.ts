import { describe, expect, test } from "vitest";
import {
  calculateMaxResultMascotHeightFromSpace,
  calculateResultMascotLayout,
  expandResultMascotLayoutToAvailableHeight,
} from "./resultMascotLayout";

describe("calculateResultMascotLayout", () => {
  test("longer text produces a mascot no larger than shorter text", () => {
    const shortLayout = calculateResultMascotLayout({
      frameWidth: 373,
      textContentHeight: 168,
      fontSize: 52,
      maxCharacterCount: 6,
    });
    const longLayout = calculateResultMascotLayout({
      frameWidth: 373,
      textContentHeight: 304,
      fontSize: 24,
      maxCharacterCount: 14,
    });

    expect(longLayout.mascotHeight).toBeLessThanOrEqual(shortLayout.mascotHeight);
  });

  test.each([
    { frameWidth: 304, minHeight: 130, maxHeight: 190 },
    { frameWidth: 373, minHeight: 146, maxHeight: 220 },
    { frameWidth: 410, minHeight: 156, maxHeight: 250 },
  ])("clamps mascot height for width $frameWidth", ({ frameWidth, minHeight, maxHeight }) => {
    const layout = calculateResultMascotLayout({
      frameWidth,
      textContentHeight: 240,
      fontSize: 32,
      maxCharacterCount: 10,
    });

    expect(layout.mascotHeight).toBeGreaterThanOrEqual(minHeight);
    expect(layout.mascotHeight).toBeLessThanOrEqual(maxHeight);
  });

  test("keeps overlap in a small safe range", () => {
    const shortLayout = calculateResultMascotLayout({
      frameWidth: 373,
      textContentHeight: 168,
      fontSize: 52,
      maxCharacterCount: 6,
    });
    const longLayout = calculateResultMascotLayout({
      frameWidth: 373,
      textContentHeight: 304,
      fontSize: 24,
      maxCharacterCount: 14,
    });

    expect(shortLayout.mascotOverlap).toBeGreaterThanOrEqual(4);
    expect(shortLayout.mascotOverlap).toBeLessThanOrEqual(14);
    expect(longLayout.mascotOverlap).toBeGreaterThanOrEqual(4);
    expect(longLayout.mascotOverlap).toBeLessThanOrEqual(14);
  });

  test("keeps bubble-to-character gap in a small safe range", () => {
    const layout = calculateResultMascotLayout({
      frameWidth: 304,
      textContentHeight: 260,
      fontSize: 28,
      maxCharacterCount: 12,
    });

    expect(layout.bubbleCharacterGap).toBeGreaterThanOrEqual(0);
    expect(layout.bubbleCharacterGap).toBeLessThanOrEqual(8);
  });

  test("returns a positive width proportional to height", () => {
    const layout = calculateResultMascotLayout({
      frameWidth: 410,
      textContentHeight: 180,
      fontSize: 44,
      maxCharacterCount: 7,
    });

    expect(layout.mascotWidth).toBeGreaterThan(0);
    expect(layout.mascotWidth / layout.mascotHeight).toBeCloseTo(0.9, 1);
  });

  test("handles zero frame width safely", () => {
    const layout = calculateResultMascotLayout({
      frameWidth: 0,
      textContentHeight: 0,
      fontSize: 0,
      maxCharacterCount: 0,
    });

    expect(layout.mascotHeight).toBeGreaterThanOrEqual(0);
    expect(layout.mascotWidth).toBeGreaterThanOrEqual(0);
    expect(layout.mascotOverlap).toBeGreaterThanOrEqual(0);
    expect(layout.bubbleCharacterGap).toBeGreaterThanOrEqual(0);
  });

  test("expansion keeps the same layout without an available height", () => {
    const baseLayout = calculateResultMascotLayout({
      frameWidth: 373,
      textContentHeight: 220,
      fontSize: 36,
      maxCharacterCount: 9,
    });

    expect(
      expandResultMascotLayoutToAvailableHeight({
        baseLayout,
        frameWidth: 373,
      }),
    ).toEqual(baseLayout);
  });

  test("expansion increases mascot height when more space is available", () => {
    const baseLayout = calculateResultMascotLayout({
      frameWidth: 373,
      textContentHeight: 260,
      fontSize: 28,
      maxCharacterCount: 12,
    });
    const expandedLayout = expandResultMascotLayoutToAvailableHeight({
      baseLayout,
      frameWidth: 373,
      maxAvailableHeight: 220,
    });

    expect(expandedLayout.mascotHeight).toBeGreaterThanOrEqual(baseLayout.mascotHeight);
    expect(expandedLayout.mascotHeight).toBe(220);
    expect(expandedLayout.mascotWidth / expandedLayout.mascotHeight).toBeCloseTo(0.9, 1);
    expect(expandedLayout.mascotOverlap).toBe(baseLayout.mascotOverlap);
    expect(expandedLayout.bubbleCharacterGap).toBe(baseLayout.bubbleCharacterGap);
  });

  test("expansion respects the width-bucket maximum", () => {
    const baseLayout = calculateResultMascotLayout({
      frameWidth: 304,
      textContentHeight: 180,
      fontSize: 48,
      maxCharacterCount: 7,
    });
    const expandedLayout = expandResultMascotLayoutToAvailableHeight({
      baseLayout,
      frameWidth: 304,
      maxAvailableHeight: 260,
    });

    expect(expandedLayout.mascotHeight).toBe(190);
  });

  test("expansion does not make the mascot negative on tiny space", () => {
    const baseLayout = calculateResultMascotLayout({
      frameWidth: 410,
      textContentHeight: 220,
      fontSize: 36,
      maxCharacterCount: 9,
    });
    const expandedLayout = expandResultMascotLayoutToAvailableHeight({
      baseLayout,
      frameWidth: 410,
      maxAvailableHeight: 8,
    });

    expect(expandedLayout.mascotHeight).toBe(baseLayout.mascotHeight);
  });
});

describe("calculateMaxResultMascotHeightFromSpace", () => {
  test("returns 0 when measurements are missing", () => {
    expect(
      calculateMaxResultMascotHeightFromSpace({
        resultScreenHeight: 0,
        actionsHeight: 96,
        bubbleContentHeight: 220,
        bubblePaddingBlock: 62,
        headerSafeTopGap: 16,
        mascotOverlap: 8,
        bubbleCharacterGap: 2,
      }),
    ).toBe(0);
  });

  test("returns larger values on taller screens", () => {
    const shorter = calculateMaxResultMascotHeightFromSpace({
      resultScreenHeight: 620,
      actionsHeight: 110,
      bubbleContentHeight: 220,
      bubblePaddingBlock: 62,
      headerSafeTopGap: 16,
      mascotOverlap: 8,
      bubbleCharacterGap: 2,
    });
    const taller = calculateMaxResultMascotHeightFromSpace({
      resultScreenHeight: 760,
      actionsHeight: 110,
      bubbleContentHeight: 220,
      bubblePaddingBlock: 62,
      headerSafeTopGap: 16,
      mascotOverlap: 8,
      bubbleCharacterGap: 2,
    });

    expect(taller).toBeGreaterThan(shorter);
  });

  test("accounts for actions, header gap, padding, overlap, and gap", () => {
    const layout = calculateMaxResultMascotHeightFromSpace({
      resultScreenHeight: 700,
      actionsHeight: 100,
      bubbleContentHeight: 240,
      bubblePaddingBlock: 60,
      headerSafeTopGap: 20,
      mascotOverlap: 10,
      bubbleCharacterGap: 2,
    });

    expect(layout).toBe(288);
  });
});
