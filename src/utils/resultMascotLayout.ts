export type ResultMascotLayoutInput = {
  frameWidth: number;
  textContentHeight: number;
  fontSize: number;
  maxCharacterCount: number;
};

export type ResultMascotLayout = {
  mascotHeight: number;
  mascotWidth: number;
  mascotOverlap: number;
  bubbleCharacterGap: number;
};

export type ResultMascotExpansionInput = {
  baseLayout: ResultMascotLayout;
  frameWidth: number;
  maxAvailableHeight?: number;
};

export type ResultMascotHeightFromSpaceInput = {
  resultScreenHeight: number;
  actionsHeight: number;
  bubbleContentHeight: number;
  bubblePaddingBlock: number;
  headerSafeTopGap: number;
  mascotOverlap: number;
  bubbleCharacterGap: number;
};

type MascotPreset = {
  minHeight: number;
  maxHeight: number;
  minOverlap: number;
  maxOverlap: number;
  minGap: number;
  maxGap: number;
  aspectRatio: number;
};

const DEFAULT_FRAME_WIDTH = 373;
const MASCOT_PRESETS = [
  {
    maxFrameWidth: 304,
    minHeight: 130,
    maxHeight: 190,
    minOverlap: 6,
    maxOverlap: 10,
    minGap: 1,
    maxGap: 4,
    aspectRatio: 0.9,
  },
  {
    maxFrameWidth: 373,
    minHeight: 146,
    maxHeight: 220,
    minOverlap: 6,
    maxOverlap: 11,
    minGap: 1,
    maxGap: 4,
    aspectRatio: 0.9,
  },
  {
    maxFrameWidth: Number.POSITIVE_INFINITY,
    minHeight: 156,
    maxHeight: 250,
    minOverlap: 7,
    maxOverlap: 12,
    minGap: 0,
    maxGap: 3,
    aspectRatio: 0.9,
  },
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getMascotPreset(frameWidth: number): MascotPreset {
  const safeFrameWidth = Math.max(1, frameWidth || DEFAULT_FRAME_WIDTH);

  for (const preset of MASCOT_PRESETS) {
    if (safeFrameWidth <= preset.maxFrameWidth) {
      return preset;
    }
  }

  return MASCOT_PRESETS[MASCOT_PRESETS.length - 1];
}

export function calculateResultMascotLayout({
  frameWidth,
  textContentHeight,
  fontSize,
  maxCharacterCount,
}: ResultMascotLayoutInput): ResultMascotLayout {
  const preset = getMascotPreset(frameWidth);
  const safeTextContentHeight = Math.max(0, textContentHeight);
  const safeFontSize = Math.max(0, fontSize);
  const safeMaxCharacterCount = Math.max(0, maxCharacterCount);

  const heightLoad = clamp((safeTextContentHeight - 150) / 170, 0, 1);
  const fontLoad = clamp((48 - safeFontSize) / 24, 0, 1);
  const widthLoad = clamp((safeMaxCharacterCount - 6) / 9, 0, 1);
  const textLoad = clamp(heightLoad * 0.55 + fontLoad * 0.3 + widthLoad * 0.15, 0, 1);
  const clampedMascotHeight = clamp(
    Math.round(preset.maxHeight - (preset.maxHeight - preset.minHeight) * textLoad),
    preset.minHeight,
    preset.maxHeight,
  );
  const mascotOverlap = Math.round(
    preset.minOverlap + (preset.maxOverlap - preset.minOverlap) * (1 - textLoad) * 0.55,
  );
  const bubbleCharacterGap = Math.round(preset.minGap + (preset.maxGap - preset.minGap) * textLoad);

  return {
    mascotHeight: clampedMascotHeight,
    mascotWidth: Math.round(clampedMascotHeight * preset.aspectRatio),
    mascotOverlap: clamp(mascotOverlap, preset.minOverlap, preset.maxOverlap),
    bubbleCharacterGap: clamp(bubbleCharacterGap, preset.minGap, preset.maxGap),
  };
}

export function calculateMaxResultMascotHeightFromSpace({
  resultScreenHeight,
  actionsHeight,
  bubbleContentHeight,
  bubblePaddingBlock,
  headerSafeTopGap,
  mascotOverlap,
  bubbleCharacterGap,
}: ResultMascotHeightFromSpaceInput) {
  const safeResultScreenHeight = Math.max(0, resultScreenHeight);
  const safeActionsHeight = Math.max(0, actionsHeight);
  const safeBubbleContentHeight = Math.max(0, bubbleContentHeight);
  const safeBubblePaddingBlock = Math.max(0, bubblePaddingBlock);
  const safeHeaderSafeTopGap = Math.max(0, headerSafeTopGap);
  const safeMascotOverlap = Math.max(0, mascotOverlap);
  const safeBubbleCharacterGap = Math.max(0, bubbleCharacterGap);

  if (safeResultScreenHeight === 0 || safeActionsHeight === 0 || safeBubblePaddingBlock === 0) {
    return 0;
  }

  const bubbleOuterHeight = safeBubbleContentHeight + safeBubblePaddingBlock;

  return Math.max(
    0,
    safeResultScreenHeight -
      safeActionsHeight -
      safeHeaderSafeTopGap -
      bubbleOuterHeight +
      safeMascotOverlap -
      safeBubbleCharacterGap,
  );
}

export function expandResultMascotLayoutToAvailableHeight({
  baseLayout,
  frameWidth,
  maxAvailableHeight,
}: ResultMascotExpansionInput): ResultMascotLayout {
  const preset = getMascotPreset(frameWidth);
  const safeAvailableHeight =
    maxAvailableHeight === undefined ? undefined : Math.max(0, maxAvailableHeight);

  if (safeAvailableHeight === undefined || safeAvailableHeight <= 0) {
    return baseLayout;
  }

  const expandedHeight = clamp(
    Math.max(baseLayout.mascotHeight, Math.floor(safeAvailableHeight)),
    0,
    preset.maxHeight,
  );

  return {
    mascotHeight: expandedHeight,
    mascotWidth: Math.round(expandedHeight * preset.aspectRatio),
    mascotOverlap: baseLayout.mascotOverlap,
    bubbleCharacterGap: baseLayout.bubbleCharacterGap,
  };
}
