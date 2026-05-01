import { useState } from "react";
import { useButtonSound } from "../hooks/useButtonSound";
import { useFitText } from "../hooks/useFitText";
import { CharacterImage } from "./CharacterImage";

type ResultScreenProps = {
  lines: string[];
  reaction: string;
  speechError: string;
  onReplayVoice: () => void;
  replayDisabled?: boolean;
  onOpenSound: () => void;
  onRestartGame: () => void;
};
const MIN_FONT_SIZE = 28;
const MAX_FONT_SIZE = 48;

function clampFontSize(size: number) {
  return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size));
}

function getInitialFontSize(lines: string[]) {
  const lineCount = Math.max(lines.length, 1);
  const heightLimited = MAX_FONT_SIZE - Math.max(0, lineCount - 3) * 3;
  return clampFontSize(heightLimited);
}
export function ResultScreen({
  lines,
  reaction,
  speechError,
  onReplayVoice,
  replayDisabled,
  onOpenSound,
  onRestartGame,
}: ResultScreenProps) {
  const { primeOnPressStart, withClickSound } = useButtonSound();
  const [bubbleElement, setBubbleElement] = useState<HTMLElement | null>(null);
  const [fontSize, setFontSize] = useState(() => getInitialFontSize(lines));
  useFitText({
    root: bubbleElement,
    minFontSize: MIN_FONT_SIZE,
    maxFontSize: MAX_FONT_SIZE,
    targetsSelector: ".result-text",
    getInitialFontSize: () => getInitialFontSize(lines),
    setFontSize,
    watchDeps: [lines],
    fitMode: "shared",
  });
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
          ["--result-font-size" as string]: `${fontSize}px`,
        }}
      >
        {keyedLines.map((item) => (
          <p className="result-text" key={item.key}>
            {item.line}
          </p>
        ))}
      </article>
      <div className="result-bottom">
        <CharacterImage variant="result" className="result-character" />
        <div className="result-sidecopy">
          {speechError ? (
            <p className="speech-error" role="status" aria-live="polite">
              {speechError}
            </p>
          ) : null}
          <p className="reaction" aria-live="polite">
            {reaction}
          </p>
        </div>
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
          <span>もう1かいきく</span>
        </button>
        <button
          type="button"
          className="action-btn result-action sound"
          onClick={withClickSound(onOpenSound)}
          onPointerDown={primeOnPressStart}
        >
          <span className="action-icon" aria-hidden="true">
            🔊
          </span>
          <span>こえ</span>
        </button>
        <button
          type="button"
          className="action-btn result-action next"
          onClick={withClickSound(onRestartGame)}
          onPointerDown={primeOnPressStart}
        >
          <span>ニュースをつくる</span>
        </button>
      </div>
    </section>
  );
}
