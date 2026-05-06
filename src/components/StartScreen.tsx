import { useButtonSound } from "../hooks/useButtonSound";
import { CharacterImage } from "./CharacterImage";

type StartScreenProps = {
  onStart: () => void;
  imageUrl: string;
};

export function StartScreen({ onStart, imageUrl }: StartScreenProps) {
  const { playOnPressStart, withClickSound } = useButtonSound();

  return (
    <section className="screen home-screen">
      <div className="hero hero-home">
        <div className="speech speech-home speech-home--guide">
          <span>
            えらんだ<span className="speech-home__highlight">ことば</span>が
          </span>
          <span>
            <span className="speech-home__highlight">ニュース</span>になるよ！
          </span>
        </div>
        <CharacterImage variant="home" src={imageUrl} className="home-character" />
      </div>
      <div className="action-stack">
        <button
          type="button"
          className="action-btn orange"
          onClick={withClickSound(onStart)}
          onPointerDown={playOnPressStart}
        >
          <span className="action-btn__label">ニュースをつくる</span>
        </button>
      </div>
    </section>
  );
}
