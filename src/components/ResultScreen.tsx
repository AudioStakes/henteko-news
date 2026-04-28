type ResultScreenProps = {
  lines: string[];
  reaction: string;
  onReplayVoice: () => void;
  onRestartGame: () => void;
  onGoHome: () => void;
};

export function ResultScreen({ lines, reaction, onReplayVoice, onRestartGame, onGoHome }: ResultScreenProps) {
  return (
    <section className="screen result-screen">
      <h2>へんてこニュース！</h2>
      <article className="news-board" aria-label="かんせいニュース">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </article>
      <p className="reaction">{reaction}</p>
      <div className="button-stack">
        <button className="primary big" onClick={onReplayVoice}>もういっかいきく！</button>
        <button className="secondary" onClick={onRestartGame}>もういっかいつくる！</button>
        <button className="ghost" onClick={onGoHome}>さいしょへ</button>
      </div>
    </section>
  );
}
