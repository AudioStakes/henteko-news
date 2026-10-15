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
  speechStatusText?: string;
  imageUrl: string;
  onReplayVoice: () => void;
  replayDisabled?: boolean;
  replayDisabledReason?: string | undefined;
  onRestartGame: () => void;
};
type ResultLayoutMetrics = {
  frameWidth: number;
  resultScreenHeight: number;
  footerHeight: number;
  rowGap: number;
  bubblePaddingBlock: number;
};

const MAX_FONT_SIZE = 64;
const RESULT_GLYPH_WIDTH_RATIO = 1;
const RESULT_LINE_GAP_RATIO = 0.24;
const RESULT_DEFAULT_FRAME_WIDTH = 373;
const RESULT_LAYOUT_ITERATIONS = 3;
const RESULT_BUBBLE_HEIGHT_BY_WIDTH = [
  { maxFrameWidth: 304, maxBubbleHeight: 316 },
  { maxFrameWidth: 373, maxBubbleHeight: 344 },
] as const;
const RESULT_BUBBLE_MAX_HEIGHT_FALLBACK = 364;
// Keeps the bubble from visually colliding with the top area in short viewports.
const RESULT_HEADER_SAFE_TOP_GAP = 12;
// Bubble border is 4px top + 4px bottom.
const RESULT_BUBBLE_CHROME_HEIGHT = 8;

function getResultBubbleMaxHeight(frameWidth: number) {
  for (const rule of RESULT_BUBBLE_HEIGHT_BY_WIDTH) {
    if (frameWidth <= rule.maxFrameWidth) {
      return rule.maxBubbleHeight;
    }
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

function measureBubble(
  element: HTMLElement | null,
): Pick<ResultLayoutMetrics, "frameWidth" | "bubblePaddingBlock"> {
  if (element === null) {
    return { frameWidth: 0, bubblePaddingBlock: 0 };
  }
  const styles = window.getComputedStyle(element);
  return {
    frameWidth: Math.max(
      0,
      Math.floor(
        element.clientWidth -
          (Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight)),
      ),
    ),
    bubblePaddingBlock: Math.max(
      0,
      Math.round(
        Number.parseFloat(styles.paddingTop) +
          Number.parseFloat(styles.paddingBottom) +
          RESULT_BUBBLE_CHROME_HEIGHT,
      ),
    ),
  };
}

export function ResultScreen({
  lines,
  speechError,
  speechStatusText,
  imageUrl,
  onReplayVoice,
  replayDisabled,
  replayDisabledReason,
  onRestartGame,
}: ResultScreenProps) {
  const { playOnPressStart, withClickSound } = useButtonSound();
  const [resultScreenElement, setResultScreenElement] = useState<HTMLElement | null>(null);
  const [bubbleElement, setBubbleElement] = useState<HTMLElement | null>(null);
  const [footerElement, setFooterElement] = useState<HTMLElement | null>(null);
  const [layoutMetrics, setLayoutMetrics] = useState<ResultLayoutMetrics>({
    frameWidth: 0,
    resultScreenHeight: 0,
    footerHeight: 0,
    rowGap: 0,
    bubblePaddingBlock: 0,
  });

  useLayoutEffect(() => {
    if (resultScreenElement === null && bubbleElement === null && footerElement === null) {
      return;
    }

    const updateLayoutMetrics = () => {
      const { frameWidth, bubblePaddingBlock } = measureBubble(bubbleElement);
      const screenStyles = resultScreenElement
        ? window.getComputedStyle(resultScreenElement)
        : null;
      const rowGap = screenStyles
        ? Math.max(0, Math.round(Number.parseFloat(screenStyles.rowGap)))
        : 0;
      const resultScreenHeight = resultScreenElement
        ? Math.max(0, Math.floor(resultScreenElement.clientHeight))
        : 0;
      const footerHeight = footerElement ? Math.max(0, Math.ceil(footerElement.offsetHeight)) : 0;

      setLayoutMetrics((current) =>
        current.frameWidth === frameWidth &&
        current.resultScreenHeight === resultScreenHeight &&
        current.footerHeight === footerHeight &&
        current.rowGap === rowGap &&
        current.bubblePaddingBlock === bubblePaddingBlock
          ? current
          : { frameWidth, resultScreenHeight, footerHeight, rowGap, bubblePaddingBlock },
      );
    };

    updateLayoutMetrics();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateLayoutMetrics);
      return () => {
        window.removeEventListener("resize", updateLayoutMetrics);
      };
    }

    const observer = new ResizeObserver(updateLayoutMetrics);
    if (resultScreenElement) {
      observer.observe(resultScreenElement);
    }
    if (bubbleElement) {
      observer.observe(bubbleElement);
    }
    if (footerElement) {
      observer.observe(footerElement);
    }

    return () => {
      observer.disconnect();
    };
  }, [bubbleElement, footerElement, resultScreenElement]);

  const effectiveFrameWidth =
    layoutMetrics.frameWidth === 0 || Number.isNaN(layoutMetrics.frameWidth)
      ? RESULT_DEFAULT_FRAME_WIDTH
      : layoutMetrics.frameWidth;
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
        resultScreenHeight: Math.max(0, layoutMetrics.resultScreenHeight - layoutMetrics.rowGap),
        actionsHeight: layoutMetrics.footerHeight,
        mascotHeight: baseMascotLayout.mascotHeight,
        mascotOverlap: baseMascotLayout.mascotOverlap,
        bubbleCharacterGap: baseMascotLayout.bubbleCharacterGap,
        bubblePaddingBlock: layoutMetrics.bubblePaddingBlock,
        headerSafeTopGap: RESULT_HEADER_SAFE_TOP_GAP,
      });

      if (nextMaxBubbleHeight === maxBubbleHeight) {
        break;
      }

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
      resultScreenHeight: Math.max(0, layoutMetrics.resultScreenHeight - layoutMetrics.rowGap),
      actionsHeight: layoutMetrics.footerHeight,
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
  const hasSpeechError = speechError.length > 0;
  const hasSpeechStatusText = speechStatusText !== undefined && speechStatusText.length > 0;

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
      <div className="result-composition">
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
          <h2 className="visually-hidden" data-screen-heading tabIndex={-1}>
            かんせいニュース
          </h2>
          {keyedLines.map((item) => (
            <p className="result-text" key={item.key}>
              {item.line}
            </p>
          ))}
        </article>
        <div className="result-character-wrap">
          <CharacterImage variant="result" src={imageUrl} className="result-character" />
        </div>
      </div>
      <div ref={setFooterElement} className="result-footer">
        {hasSpeechStatusText ? (
          <p
            className="speech-status"
            role={hasSpeechError ? undefined : "status"}
            aria-live={hasSpeechError ? undefined : "polite"}
          >
            {speechStatusText}
          </p>
        ) : null}
        {hasSpeechError ? (
          <p className="speech-error" role="status" aria-live="polite">
            {speechError}
          </p>
        ) : null}
        <div className="action-stack compact result-actions">
          <button
            type="button"
            className="action-btn result-action replay"
            aria-label="もういちどよむ"
            title={replayDisabled === true ? replayDisabledReason : undefined}
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
      </div>
    </section>
  );
}
