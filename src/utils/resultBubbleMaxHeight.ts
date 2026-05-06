export type SafeResultBubbleMaxHeightInput = {
  widthBasedMaxBubbleHeight: number;
  resultScreenHeight: number;
  actionsHeight: number;
  mascotHeight: number;
  mascotOverlap: number;
  bubbleCharacterGap: number;
  bubblePaddingBlock: number;
  headerSafeTopGap: number;
};

export function calculateSafeResultBubbleMaxHeight({
  widthBasedMaxBubbleHeight,
  resultScreenHeight,
  actionsHeight,
  mascotHeight,
  mascotOverlap,
  bubbleCharacterGap,
  bubblePaddingBlock,
  headerSafeTopGap,
}: SafeResultBubbleMaxHeightInput) {
  const safeWidthBasedMaxBubbleHeight = Math.max(0, widthBasedMaxBubbleHeight);
  const safeResultScreenHeight = Math.max(0, resultScreenHeight);
  const safeActionsHeight = Math.max(0, actionsHeight);
  const safeMascotHeight = Math.max(0, mascotHeight);
  const safeMascotOverlap = Math.max(0, mascotOverlap);
  const safeBubbleCharacterGap = Math.max(0, bubbleCharacterGap);
  const safeBubblePaddingBlock = Math.max(0, bubblePaddingBlock);
  const safeHeaderSafeTopGap = Math.max(0, headerSafeTopGap);

  if (safeResultScreenHeight === 0 || safeActionsHeight === 0 || safeBubblePaddingBlock === 0) {
    return safeWidthBasedMaxBubbleHeight;
  }

  const maxBubbleOuterHeight =
    safeResultScreenHeight -
    safeActionsHeight -
    safeMascotHeight +
    safeMascotOverlap -
    safeBubbleCharacterGap -
    safeHeaderSafeTopGap;
  const verticalMaxContentHeight = maxBubbleOuterHeight - safeBubblePaddingBlock;

  return Math.max(0, Math.min(safeWidthBasedMaxBubbleHeight, verticalMaxContentHeight));
}
