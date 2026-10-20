import { CharacterImage } from "./CharacterImage";
import { useButtonSound } from "./useButtonSound";

type StartScreenProps = {
  onStart: () => void;
  imageUrl: string;
};

export function StartScreen({ onStart, imageUrl }: StartScreenProps) {
  const { playOnPressStart, withClickSound } = useButtonSound();

  return (
    <section className="screen home-screen">
      <div className="hero hero-home">
        <h2 className="speech speech-home speech-home--guide" data-screen-heading tabIndex={-1}>
          <span>
            えらんだ<span className="speech-home__highlight">ことば</span>が
          </span>
          <span>
            <span className="speech-home__highlight">ニュース</span>になるよ！
          </span>
        </h2>
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
