import type { SpeechPhase } from "../application";
import { NewsCaster } from "./NewsCaster";
import { useButtonSound } from "./useButtonSound";

type ResultScreenProps = {
  lines: readonly string[];
  speechError: string;
  speechStatusText?: string;
  speechPhase?: SpeechPhase;
  imageUrl: string;
  onReplayVoice: () => void;
  replayDisabled?: boolean;
  replayDisabledReason?: string | undefined;
  onRestartGame: () => void;
};

export function ResultScreen({
  lines,
  speechError,
  speechStatusText,
  speechPhase = "idle",
  imageUrl,
  onReplayVoice,
  replayDisabled,
  replayDisabledReason,
  onRestartGame,
}: ResultScreenProps) {
  const { playOnPressStart, withClickSound } = useButtonSound();
  const busy = speechPhase !== "idle";
  const longestLineLength = Math.max(1, ...lines.map((line) => Array.from(line).length));

  return (
    <section className="screen result-screen">
      <NewsCaster imageUrl={imageUrl} phase={speechPhase} />
      <article className="result-bubble" aria-label="かんせいニュース">
        <h2
          className="result-text"
          style={{
            fontSize: `clamp(1.125rem, calc(100cqi / ${longestLineLength}), var(--result-font-max, 2.8125rem))`,
          }}
          data-screen-heading
          tabIndex={-1}
        >
          {lines.map((line) => (
            <span className="news-line" key={line}>
              {line}
            </span>
          ))}
        </h2>
      </article>
      <p
        className={
          speechError.length > 0 || (replayDisabled === true && !busy) ? "error-note" : "sr-only"
        }
        role="status"
      >
        {speechError.length > 0 ? speechError : speechStatusText}
      </p>
      <div className="result-actions">
        <button
          type="button"
          className="button primary"
          aria-label="きく"
          title={replayDisabled === true ? replayDisabledReason : undefined}
          onClick={withClickSound(() => {
            onReplayVoice();
          })}
          onPointerDown={playOnPressStart}
          disabled={replayDisabled}
        >
          <span className="play-icon" aria-hidden="true" />
          {busy ? (
            <small>{speechPhase === "preparing" ? "じゅんび中" : "よんでいるよ"}</small>
          ) : (
            " きく"
          )}
        </button>
        <button
          type="button"
          className="button button--secondary secondary"
          aria-label="つぎをつくる"
          onClick={withClickSound(() => {
            onRestartGame();
          })}
          onPointerDown={playOnPressStart}
        >
          つぎを
          <br />
          つくる
        </button>
      </div>
    </section>
  );
}
