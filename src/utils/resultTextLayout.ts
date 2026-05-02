import { ACTION_POLITE_MAP } from "../data/actions";

export type ResultTextLayoutInput = {
  frameWidth: number;
  lines: readonly string[];
  maxFontSize: number;
  maxBubbleHeight?: number;
  lineGapRatio: number;
  glyphWidthRatio: number;
};

export type ResultTextLineLayout = {
  text: string;
  characterCount: number;
  measuredWidth: number;
  fontSize: number;
};

export type ResultTextLayout = {
  fontSize: number;
  lineGap: number;
  contentHeight: number;
  bubbleHeight: number;
  maxCharacterCount: number;
  lineLayouts: ResultTextLineLayout[];
};

function countCharacters(text: string) {
  return Array.from(text).length;
}

function normalizeActionLine(line: string) {
  return line.trim().replace(/[！!]$/u, "");
}

function getLineCharacterCount(line: string, index: number, lineCount: number) {
  if (index !== lineCount - 1) return countCharacters(line);

  const politeAction = ACTION_POLITE_MAP[normalizeActionLine(line)];
  const lineHasExclamation = /[！!]$/.test(line);
  const displayCharacterCount = countCharacters(line) + (lineHasExclamation ? 0 : 1);

  return Math.max(displayCharacterCount, politeAction ? countCharacters(politeAction) : 0);
}

export function calculateResultTextLayout({
  frameWidth,
  lines,
  maxFontSize,
  maxBubbleHeight,
  lineGapRatio,
  glyphWidthRatio,
}: ResultTextLayoutInput): ResultTextLayout {
  const safeFrameWidth = Math.max(0, frameWidth);
  const safeMaxFontSize = Math.max(0, maxFontSize);
  const safeMaxBubbleHeight =
    maxBubbleHeight === undefined ? Number.POSITIVE_INFINITY : Math.max(0, maxBubbleHeight);
  const safeGlyphWidthRatio = Math.max(Number.EPSILON, glyphWidthRatio);
  const lineCharacterCounts = lines.map((line, index) =>
    getLineCharacterCount(line, index, lines.length),
  );
  const maxCharacterCount = Math.max(0, ...lineCharacterCounts);
  const widthLimitedFontSize =
    safeFrameWidth > 0 && maxCharacterCount > 0
      ? Math.floor(safeFrameWidth / (maxCharacterCount * safeGlyphWidthRatio))
      : safeMaxFontSize;
  const heightLimitedFontSize = findHeightLimitedFontSize(
    lines.length,
    safeMaxBubbleHeight,
    lineGapRatio,
    safeMaxFontSize,
  );
  const fontSize = Math.min(
    safeMaxFontSize,
    Math.max(0, widthLimitedFontSize),
    heightLimitedFontSize,
  );
  const lineGap = Math.ceil(fontSize * lineGapRatio);
  const contentHeight = lines.length * fontSize + Math.max(0, lines.length - 1) * lineGap;

  return {
    fontSize,
    lineGap,
    contentHeight,
    bubbleHeight: contentHeight,
    maxCharacterCount,
    lineLayouts: lines.map((line, index) => {
      const characterCount = lineCharacterCounts[index];

      return {
        text: line,
        characterCount,
        measuredWidth: characterCount * fontSize * safeGlyphWidthRatio,
        fontSize,
      };
    }),
  };
}

function findHeightLimitedFontSize(
  lineCount: number,
  maxBubbleHeight: number,
  lineGapRatio: number,
  maxFontSize: number,
) {
  if (!Number.isFinite(maxBubbleHeight)) return maxFontSize;
  if (lineCount <= 0) return maxFontSize;

  let low = 0;
  let high = maxFontSize;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const lineGap = Math.ceil(mid * lineGapRatio);
    const contentHeight = lineCount * mid + Math.max(0, lineCount - 1) * lineGap;

    if (contentHeight <= maxBubbleHeight) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}
