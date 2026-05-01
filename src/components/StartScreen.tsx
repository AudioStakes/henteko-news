import { playChoiceSound, primeChoiceSound } from "../utils/soundEffects";
import { CharacterImage } from "./CharacterImage";

type StartScreenProps = {
  onStart: () => void;
};

export function StartScreen({ onStart }: StartScreenProps) {
  const handleStart = () => {
    void playChoiceSound().catch(() => {
      // Keep navigation responsive even if sound playback is unavailable.
    });
    onStart();
  };

  const handlePressStart = () => {
    void primeChoiceSound().catch(() => {
      // iOS Safari may reject unlock attempts; try again on actual tap.
    });
  };

  return (
    <section className="screen home-screen">
      <div className="hero hero-home">
        <div className="speech speech-home speech-home--guide">
          <span>
            ことばを<span className="speech-home__highlight">5つ</span>えらんで
          </span>
          <span><span className="speech-home__highlight">ニュース</span>をつくろう！</span>
        </div>
        <CharacterImage variant="home" className="home-character" />
      </div>
      <div className="action-stack">
        <button
          type="button"
          className="action-btn orange"
          onClick={handleStart}
          onPointerDown={handlePressStart}
          onTouchStart={handlePressStart}
        >
          <span className="action-btn__label">ニュースをつくる</span>
          <span className="action-btn__star" aria-hidden="true">
            ⭐
          </span>
        </button>
        <p className="trust-pill">
          <span className="trust-pill__icon trust-pill__icon--heart" aria-hidden="true">
            ♡
          </span>
          <span>無料・ログインなし・広告なし</span>
          <span className="trust-pill__icon trust-pill__icon--shield" aria-hidden="true">
            🛡️
          </span>
        </p>
      </div>
    </section>
  );
}
