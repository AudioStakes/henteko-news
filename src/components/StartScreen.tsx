import { NewsCaster } from "./NewsCaster";
import { useButtonSound } from "./useButtonSound";

type StartScreenProps = { onStart: () => void; imageUrl: string };

export function StartScreen({ onStart, imageUrl }: StartScreenProps) {
  const { playOnPressStart, withClickSound } = useButtonSound();
  return (
    <section className="screen home-screen">
      <NewsCaster imageUrl={imageUrl} welcome />
      <h2 className="welcome-copy" data-screen-heading tabIndex={-1}>
        5つ えらぶと
        <br />
        ニュースに なるよ
      </h2>
      <button
        type="button"
        className="button primary start-button"
        onClick={withClickSound(() => {
          onStart();
        })}
        onPointerDown={playOnPressStart}
      >
        <span className="play-icon" aria-hidden="true" />
        はじめる
      </button>
      <p className="sound-note">
        <svg viewBox="0 0 32 28" aria-hidden="true">
          <path d="M3 9h6l8-7v24l-8-7H3a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" />
          <path
            d="M21 7q7 7 0 14M25 3q11 11 0 22"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        おとが でるよ
      </p>
    </section>
  );
}
