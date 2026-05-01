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
          <span>ニュースをつくる</span>
        </button>
      </div>
    </section>
  );
}
