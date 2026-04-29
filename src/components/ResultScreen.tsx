import { CharacterImage } from './CharacterImage';

type ResultScreenProps = {
  lines: string[];
  reaction: string;
  onReplayVoice: () => void;
  onRestartGame: () => void;
};

export function ResultScreen({ lines, reaction, onReplayVoice, onRestartGame }: ResultScreenProps) {
  return (
    <section className="screen result-screen">
      <article className="result-bubble" aria-label="かんせいニュース">
        {lines.map((line) => <p className="result-text" key={line}>{line}</p>)}
      </article>
      <div className="result-bottom">
        <CharacterImage variant="result" className="result-character" />
        <p className="reaction">{reaction}</p>
      </div>
      <div className="action-stack compact">
        <button className="action-btn orange small" onClick={onReplayVoice}><span>もういっかいきく！</span></button>
        <button className="action-btn blue small" onClick={onRestartGame}><span>もういっかいつくる！</span></button>
      </div>
    </section>
  );
}
