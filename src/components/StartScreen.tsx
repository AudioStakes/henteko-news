import { playChoiceSound, primeChoiceSound } from "../utils/soundEffects";
import { CharacterImage } from "./CharacterImage";

type StartScreenProps = {
  onStart: () => void;
  imageUrl: string;
};

export function StartScreen({ onStart, imageUrl }: StartScreenProps) {
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
          <span>
            <span className="speech-home__highlight">ニュース</span>をつくろう！
          </span>
        </div>
        <CharacterImage variant="home" src={imageUrl} className="home-character" />
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
        </button>
      </div>
    </section>
  );
}
