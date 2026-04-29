import { AlienAnnouncer } from './AlienAnnouncer';
import { AppHeader } from './AppHeader';

type StartScreenProps = {
  onStart: () => void;
  onOpenSound: () => void;
};

export function StartScreen({ onStart, onOpenSound }: StartScreenProps) {
  return (
    <section className="screen start-screen">
      <AppHeader />
      <div className="studio-panel">
        <p className="speech-balloon small">ニュースです！</p>
        <AlienAnnouncer variant="home" />
      </div>
      <div className="button-stack home-buttons">
        <button className="primary big" onClick={onStart}>つくる</button>
        <button className="secondary big" onClick={onOpenSound}>おと</button>
      </div>
    </section>
  );
}
