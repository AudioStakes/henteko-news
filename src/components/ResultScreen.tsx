import { useLayoutEffect, useMemo, useState } from "react";
import { useButtonSound } from "../hooks/useButtonSound";
import { calculateResultTextLayout } from "../utils/resultTextLayout";
import { CharacterImage } from "./CharacterImage";

type ResultScreenProps = {
  lines: string[];
  speechError: string;
  imageUrl: string;
  onReplayVoice: () => void;
  replayDisabled?: boolean;
  onRestartGame: () => void;
  onOpenSound?: () => void;
};
const MAX_FONT_SIZE = 64;
const RESULT_GLYPH_WIDTH_RATIO = 1;
const RESULT_LINE_GAP_RATIO = 0.24;
const RESULT_BUBBLE_HEIGHT_BY_WIDTH = [
  { maxFrameWidth: 304, maxBubbleHeight: 307 },
  { maxFrameWidth: 373, maxBubbleHeight: 336 },
] as const;
const RESULT_BUBBLE_MAX_HEIGHT_FALLBACK = 355;
function getResultBubbleMaxHeight(frameWidth: number) {
  for (const rule of RESULT_BUBBLE_HEIGHT_BY_WIDTH) {
    if (frameWidth <= rule.maxFrameWidth) return rule.maxBubbleHeight;
  }

  return RESULT_BUBBLE_MAX_HEIGHT_FALLBACK;
}

export function ResultScreen({
  lines,
  speechError,
  imageUrl,
  onReplayVoice,
  replayDisabled,
  onRestartGame,
  onOpenSound,
}: ResultScreenProps) {
  const { primeOnPressStart, withClickSound } = useButtonSound();
  const [bubbleElement, setBubbleElement] = useState<HTMLElement | null>(null);
  const [resultFrameWidth, setResultFrameWidth] = useState(0);
  useLayoutEffect(() => {
    if (!bubbleElement) return;

    const updateFrameWidth = () => {
      const styles = window.getComputedStyle(bubbleElement);
      const inlinePadding =
        Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight);

      setResultFrameWidth(Math.max(0, Math.floor(bubbleElement.clientWidth - inlinePadding)));
    };

    updateFrameWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateFrameWidth);
      return () => window.removeEventListener("resize", updateFrameWidth);
    }

    const observer = new ResizeObserver(updateFrameWidth);
    observer.observe(bubbleElement);

    return () => observer.disconnect();
  }, [bubbleElement]);
  const resultLayout = useMemo(
    () =>
      calculateResultTextLayout({
        frameWidth: resultFrameWidth,
        lines,
        maxFontSize: MAX_FONT_SIZE,
        maxBubbleHeight: getResultBubbleMaxHeight(resultFrameWidth),
        lineGapRatio: RESULT_LINE_GAP_RATIO,
        glyphWidthRatio: RESULT_GLYPH_WIDTH_RATIO,
      }),
    [lines, resultFrameWidth],
  );
  const lineKeyCount = new Map<string, number>();
  const keyedLines = lines.map((line) => {
    const seen = (lineKeyCount.get(line) ?? 0) + 1;
    lineKeyCount.set(line, seen);
    return { line, key: `${line}-${seen}` };
  });

  return (
    <section className="screen result-screen">
      <article
        ref={setBubbleElement}
        className="result-bubble"
        aria-label="かんせいニュース"
        style={{
          ["--result-line-count" as string]: String(Math.max(lines.length, 1)),
          ["--result-font-size" as string]: `${resultLayout.fontSize}px`,
          ["--result-line-gap" as string]: `${resultLayout.lineGap}px`,
          ["--result-content-height" as string]: `${resultLayout.bubbleHeight}px`,
        }}
      >
        {keyedLines.map((item) => (
          <p className="result-text" key={item.key}>
            {item.line}
          </p>
        ))}
      </article>
      <div className="result-bottom">
        <CharacterImage variant="result" src={imageUrl} className="result-character" />
        {speechError ? (
          <p className="speech-error" role="status" aria-live="polite">
            {speechError}
          </p>
        ) : null}
      </div>
      <div className="action-stack compact result-actions">
        <button
          type="button"
          className="action-btn result-action replay"
          onClick={withClickSound(onReplayVoice)}
          onPointerDown={primeOnPressStart}
          disabled={replayDisabled}
        >
          <span className="action-icon" aria-hidden="true">
            ↻
          </span>
        </button>
        {onOpenSound ? (
          <button
            type="button"
            className="action-btn blue small"
            onClick={withClickSound(onOpenSound)}
            onPointerDown={primeOnPressStart}
          >
            <span>こえ</span>
          </button>
        ) : null}
        <button
          type="button"
          className="action-btn result-action next"
          onClick={withClickSound(onRestartGame)}
          onPointerDown={primeOnPressStart}
        >
          <span>つぎのニュース →</span>
        </button>
      </div>
    </section>
  );
}
