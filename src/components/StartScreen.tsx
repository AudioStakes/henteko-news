import { AlienAnnouncer } from './AlienAnnouncer';
import homeStudio from '../assets/home-studio.webp';

type StartScreenProps = {
  onStart: () => void;
  onOpenSound: () => void;
};

export function StartScreen({ onStart, onOpenSound }: StartScreenProps) {
  return (
    <section className="screen home-screen">
      <div className="hero hero-home">
        <img className="hero-bg" src={homeStudio} alt="" />
        <AlienAnnouncer className="alien-home" alt="へんてこニュースの宇宙人キャスター" />
      </div>
      <div className="action-stack" aria-label="メニュー">
        <button className="action-btn orange" onClick={onStart}><span>つくる</span></button>
        <button className="action-btn blue quiet" onClick={onOpenSound}><span>こえ</span></button>
      </div>
    </section>
  );
}
