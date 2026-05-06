import { useLayoutEffect, useMemo, useState } from "react";
import { useButtonSound } from "../hooks/useButtonSound";
import { calculateSafeResultBubbleMaxHeight } from "../utils/resultBubbleMaxHeight";
import {
  calculateMaxResultMascotHeightFromSpace,
  calculateResultMascotLayout,
  expandResultMascotLayoutToAvailableHeight,
} from "../utils/resultMascotLayout";
import { calculateResultTextLayout } from "../utils/resultTextLayout";
import { CharacterImage } from "./CharacterImage";

type ResultScreenProps = {
  lines: string[];
  speechError: string;
  imageUrl: string;
  onReplayVoice: () => void;
  replayDisabled?: boolean;
  onRestartGame: () => void;
};
const MAX_FONT_SIZE = 64;
const RESULT_GLYPH_WIDTH_RATIO = 1;
const RESULT_LINE_GAP_RATIO = 0.24;
const RESULT_DEFAULT_FRAME_WIDTH = 373;
const RESULT_LAYOUT_ITERATIONS = 3;
const RESULT_BUBBLE_HEIGHT_BY_WIDTH = [
  { maxFrameWidth: 304, maxBubbleHeight: 307 },
  { maxFrameWidth: 373, maxBubbleHeight: 336 },
] as const;
const RESULT_BUBBLE_MAX_HEIGHT_FALLBACK = 355;
const RESULT_HEADER_SAFE_TOP_GAP = 16;

function getResultBubbleMaxHeight(frameWidth: number) {
  for (const rule of RESULT_BUBBLE_HEIGHT_BY_WIDTH) {
    if (frameWidth <= rule.maxFrameWidth) return rule.maxBubbleHeight;
  }

  return RESULT_BUBBLE_MAX_HEIGHT_FALLBACK;
}

function buildResultTextLayout(
  lines: readonly string[],
  frameWidth: number,
  maxBubbleHeight: number,
) {
  return calculateResultTextLayout({
    frameWidth,
    lines,
    maxFontSize: MAX_FONT_SIZE,
    maxBubbleHeight,
    lineGapRatio: RESULT_LINE_GAP_RATIO,
    glyphWidthRatio: RESULT_GLYPH_WIDTH_RATIO,
  });
}

function buildMascotLayout(
  frameWidth: number,
  textContentHeight: number,
  fontSize: number,
  maxCharacterCount: number,
) {
  return calculateResultMascotLayout({
    frameWidth,
    textContentHeight,
    fontSize,
    maxCharacterCount,
  });
}

export function ResultScreen({
  lines,
  speechError,
  imageUrl,
  onReplayVoice,
  replayDisabled,
  onRestartGame,
}: ResultScreenProps) {
  const { playOnPressStart, withClickSound } = useButtonSound();
  const [resultScreenElement, setResultScreenElement] = useState<HTMLElement | null>(null);
  const [bubbleElement, setBubbleElement] = useState<HTMLElement | null>(null);
  const [actionsElement, setActionsElement] = useState<HTMLElement | null>(null);
  const [layoutMetrics, setLayoutMetrics] = useState({
    frameWidth: 0,
    resultScreenHeight: 0,
    actionsHeight: 0,
    bubblePaddingBlock: 0,
  });

  useLayoutEffect(() => {
    if (!resultScreenElement && !bubbleElement && !actionsElement) return;

    const updateLayoutMetrics = () => {
      const bubbleStyles = bubbleElement ? window.getComputedStyle(bubbleElement) : null;
      const frameWidth =
        bubbleElement && bubbleStyles
          ? Math.max(
              0,
              Math.floor(
                bubbleElement.clientWidth -
                  (Number.parseFloat(bubbleStyles.paddingLeft) +
                    Number.parseFloat(bubbleStyles.paddingRight)),
              ),
            )
          : 0;
      const bubblePaddingBlock = bubbleStyles
        ? Math.max(
            0,
            Math.round(
              Number.parseFloat(bubbleStyles.paddingTop) +
                Number.parseFloat(bubbleStyles.paddingBottom) +
                8,
            ),
          )
        : 0;
      const resultScreenHeight = resultScreenElement
        ? Math.max(0, Math.floor(resultScreenElement.clientHeight))
        : 0;
      const actionsHeight = actionsElement
        ? Math.max(0, Math.ceil(actionsElement.offsetHeight))
        : 0;

      setLayoutMetrics((current) =>
        current.frameWidth === frameWidth &&
        current.resultScreenHeight === resultScreenHeight &&
        current.actionsHeight === actionsHeight &&
        current.bubblePaddingBlock === bubblePaddingBlock
          ? current
          : { frameWidth, resultScreenHeight, actionsHeight, bubblePaddingBlock },
      );
    };

    updateLayoutMetrics();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateLayoutMetrics);
      return () => window.removeEventListener("resize", updateLayoutMetrics);
    }

    const observer = new ResizeObserver(updateLayoutMetrics);
    if (resultScreenElement) observer.observe(resultScreenElement);
    if (bubbleElement) observer.observe(bubbleElement);
    if (actionsElement) observer.observe(actionsElement);

    return () => observer.disconnect();
  }, [actionsElement, bubbleElement, resultScreenElement]);

  const effectiveFrameWidth = layoutMetrics.frameWidth || RESULT_DEFAULT_FRAME_WIDTH;
  const widthBasedMaxBubbleHeight = getResultBubbleMaxHeight(effectiveFrameWidth);
  const resolvedLayouts = useMemo(() => {
    let maxBubbleHeight = widthBasedMaxBubbleHeight;
    let resultLayout = buildResultTextLayout(lines, effectiveFrameWidth, maxBubbleHeight);
    let baseMascotLayout = buildMascotLayout(
      effectiveFrameWidth,
      resultLayout.contentHeight,
      resultLayout.fontSize,
      resultLayout.maxCharacterCount,
    );

    for (let iteration = 0; iteration < RESULT_LAYOUT_ITERATIONS; iteration += 1) {
      const nextMaxBubbleHeight = calculateSafeResultBubbleMaxHeight({
        widthBasedMaxBubbleHeight,
        resultScreenHeight: layoutMetrics.resultScreenHeight,
        actionsHeight: layoutMetrics.actionsHeight,
        mascotHeight: baseMascotLayout.mascotHeight,
        mascotOverlap: baseMascotLayout.mascotOverlap,
        bubbleCharacterGap: baseMascotLayout.bubbleCharacterGap,
        bubblePaddingBlock: layoutMetrics.bubblePaddingBlock,
        headerSafeTopGap: RESULT_HEADER_SAFE_TOP_GAP,
      });

      if (nextMaxBubbleHeight === maxBubbleHeight) break;

      maxBubbleHeight = nextMaxBubbleHeight;
      resultLayout = buildResultTextLayout(lines, effectiveFrameWidth, maxBubbleHeight);
      baseMascotLayout = buildMascotLayout(
        effectiveFrameWidth,
        resultLayout.contentHeight,
        resultLayout.fontSize,
        resultLayout.maxCharacterCount,
      );
    }

    const maxMascotHeightFromSpace = calculateMaxResultMascotHeightFromSpace({
      resultScreenHeight: layoutMetrics.resultScreenHeight,
      actionsHeight: layoutMetrics.actionsHeight,
      bubbleContentHeight: resultLayout.contentHeight,
      bubblePaddingBlock: layoutMetrics.bubblePaddingBlock,
      headerSafeTopGap: RESULT_HEADER_SAFE_TOP_GAP,
      mascotOverlap: baseMascotLayout.mascotOverlap,
      bubbleCharacterGap: baseMascotLayout.bubbleCharacterGap,
    });
    const mascotLayout = expandResultMascotLayoutToAvailableHeight({
      baseLayout: baseMascotLayout,
      frameWidth: effectiveFrameWidth,
      maxAvailableHeight: maxMascotHeightFromSpace,
    });

    return {
      maxBubbleHeight,
      resultLayout,
      baseMascotLayout,
      mascotLayout,
    };
  }, [effectiveFrameWidth, layoutMetrics, lines, widthBasedMaxBubbleHeight]);
  const { mascotLayout, resultLayout } = resolvedLayouts;
  const lineKeyCount = new Map<string, number>();
  const keyedLines = lines.map((line) => {
    const seen = (lineKeyCount.get(line) ?? 0) + 1;
    lineKeyCount.set(line, seen);
    return { line, key: `${line}-${seen}` };
  });

  return (
    <section
      ref={setResultScreenElement}
      className="screen result-screen"
      style={{
        ["--result-character-width" as string]: `${mascotLayout.mascotWidth}px`,
        ["--result-character-height" as string]: `${mascotLayout.mascotHeight}px`,
        ["--result-character-overlap" as string]: `${mascotLayout.mascotOverlap}px`,
        ["--result-bubble-character-gap" as string]: `${mascotLayout.bubbleCharacterGap}px`,
      }}
    >
      <article
        ref={setBubbleElement}
        className="result-bubble"
        aria-label="かんせいニュース"
        style={{
          ["--result-line-count" as string]: String(Math.max(lines.length, 1)),
          ["--result-font-size" as string]: `${resultLayout.fontSize}px`,
          ["--result-line-gap" as string]: `${resultLayout.lineGap}px`,
          ["--result-content-height" as string]: `${resultLayout.contentHeight}px`,
        }}
      >
        {keyedLines.map((item) => (
          <p className="result-text" key={item.key}>
            {item.line}
          </p>
        ))}
      </article>
      <div className="result-bottom">
        <div className="result-character-wrap">
          <CharacterImage variant="result" src={imageUrl} className="result-character" />
        </div>
        {speechError ? (
          <p className="speech-error" role="status" aria-live="polite">
            {speechError}
          </p>
        ) : null}
      </div>
      <div ref={setActionsElement} className="action-stack compact result-actions">
        <button
          type="button"
          className="action-btn result-action replay"
          onClick={withClickSound(onReplayVoice)}
          onPointerDown={playOnPressStart}
          disabled={replayDisabled}
        >
          <span className="action-icon" aria-hidden="true">
            ↻
          </span>
        </button>
        <button
          type="button"
          className="action-btn result-action next"
          onClick={withClickSound(onRestartGame)}
          onPointerDown={playOnPressStart}
        >
          <span>つぎのニュース →</span>
        </button>
      </div>
    </section>
  );
}
