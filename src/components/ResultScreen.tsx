import { useRef, useState } from "react";
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
const MIN_FONT_SIZE = 20;
const MAX_FONT_SIZE = 48;
function getInitialFontSize(lines: string[]) {
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const lineCount = Math.max(lines.length, 1);
  const widthLimited = MAX_FONT_SIZE - Math.max(0, longest - 6) * 2.8;
  const heightLimited = MAX_FONT_SIZE - Math.max(0, lineCount - 3) * 4.5;
  return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, Math.min(widthLimited, heightLimited)));
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
  const bubbleRef = useRef<HTMLElement | null>(null);
  const [fontSize, setFontSize] = useState(() => getInitialFontSize(lines));
  useFitText([bubbleRef.current], {
    minFontSize: MIN_FONT_SIZE,
    maxFontSize: MAX_FONT_SIZE,
    selectors: ".result-text",
    getInitialFontSize: () => getInitialFontSize(lines),
    setFontSize,
  });
  return (
    <section className="screen result-screen">
      <article
        ref={bubbleRef}
        className="result-bubble"
        aria-label="かんせいニュース"
        style={{
          ["--result-line-count" as string]: String(Math.max(lines.length, 1)),
          ["--result-font-size" as string]: `${fontSize}px`,
        }}
      >
        {lines.map((line) => (
          <p className="result-text" key={line + Math.random().toString(36).slice(2, 6)}>
            {line}
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
