import { CharacterImage } from './CharacterImage';

type StartScreenProps = {
  onStart: () => void;
  onOpenSound: () => void;
};

export function StartScreen({ onStart, onOpenSound }: StartScreenProps) {
  return (
    <section className="screen home-screen">
      <div className="hero hero-home">
        <CharacterImage variant="home" className="home-character" />
      </div>
      <div className="action-stack" aria-label="メニュー">
        <button className="action-btn orange" onClick={onStart}><span>つくる</span></button>
        <button className="action-btn blue quiet" onClick={onOpenSound}><span>おと</span></button>
      </div>
    </section>
  );
}
