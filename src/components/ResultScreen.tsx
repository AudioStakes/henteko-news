import { AlienAnnouncer } from './AlienAnnouncer';
import { AppHeader } from './AppHeader';

type ResultScreenProps = {
  lines: string[];
  reaction: string;
  onReplayVoice: () => void;
  onRestartGame: () => void;
};

export function ResultScreen({ lines, reaction, onReplayVoice, onRestartGame }: ResultScreenProps) {
  return (
    <section className="screen result-screen">
      <AppHeader />
      <article className="speech-balloon result" aria-label="かんせいニュース">
        {lines.map((line) => <p key={line}>{line}</p>)}
      </article>
      <div className="result-caster-row">
        <AlienAnnouncer variant="result" />
        <p className="reaction">{reaction}</p>
      </div>
      <div className="button-stack result-buttons">
        <button className="primary" onClick={onReplayVoice}>もういっかいきく！</button>
        <button className="secondary" onClick={onRestartGame}>もういっかいつくる！</button>
      </div>
    </section>
  );
}
