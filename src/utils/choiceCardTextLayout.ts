export type ChoiceCardWidthRule = {
  label: string;
  maxGridWidth: number;
  availableTextWidth: number;
  maxFontSize: number;
  fontSizeAdjustment: number;
};

export type ChoiceCardTextLayoutInput = {
  gridWidth: number;
  text: string;
  minFontSize: number;
  maxFontSize: number;
  glyphWidthRatio: number;
};

export type ChoiceCardTextLayout = {
  fontSize: number;
  characterCount: number;
  measuredWidth: number;
  availableTextWidth: number;
  widthRule: ChoiceCardWidthRule;
};

export const CHOICE_CARD_WIDTH_RULES: readonly ChoiceCardWidthRule[] = [
  {
    label: "minimum screen width",
    maxGridWidth: 304,
    availableTextWidth: 280,
    maxFontSize: 24,
    fontSizeAdjustment: 3,
  },
  {
    label: "regular screen width",
    maxGridWidth: 373,
    availableTextWidth: 345,
    maxFontSize: 27,
    fontSizeAdjustment: 3,
  },
  {
    label: "maximum screen width",
    maxGridWidth: 410,
    availableTextWidth: 380,
    maxFontSize: 35,
    fontSizeAdjustment: 3,
  },
] as const;

function countCharacters(text: string) {
  return Array.from(text).length;
}

export function getChoiceCardWidthRule(gridWidth: number): ChoiceCardWidthRule {
  const safeGridWidth = Math.max(0, gridWidth);

  for (const rule of CHOICE_CARD_WIDTH_RULES) {
    if (safeGridWidth <= rule.maxGridWidth) return rule;
  }

  return CHOICE_CARD_WIDTH_RULES[CHOICE_CARD_WIDTH_RULES.length - 1];
}

export function calculateChoiceCardTextLayout({
  gridWidth,
  text,
  minFontSize,
  maxFontSize,
  glyphWidthRatio,
}: ChoiceCardTextLayoutInput): ChoiceCardTextLayout {
  const safeMinFontSize = Math.max(0, minFontSize);
  const safeMaxFontSize = Math.max(safeMinFontSize, maxFontSize);
  const safeGlyphWidthRatio = Math.max(Number.EPSILON, glyphWidthRatio);
  const characterCount = countCharacters(text);
  const widthRule = getChoiceCardWidthRule(gridWidth);
  const effectiveMaxFontSize = Math.min(safeMaxFontSize, widthRule.maxFontSize);
  const widthLimitedFontSize =
    characterCount > 0
      ? Math.floor(widthRule.availableTextWidth / (characterCount * safeGlyphWidthRatio))
      : effectiveMaxFontSize;
  const adjustedWidthLimitedFontSize = Math.max(
    0,
    widthLimitedFontSize - widthRule.fontSizeAdjustment,
  );
  const fontSize = Math.max(
    safeMinFontSize,
    Math.min(effectiveMaxFontSize, adjustedWidthLimitedFontSize),
  );

  return {
    fontSize,
    characterCount,
    measuredWidth: characterCount * fontSize * safeGlyphWidthRatio,
    availableTextWidth: widthRule.availableTextWidth,
    widthRule,
  };
}
