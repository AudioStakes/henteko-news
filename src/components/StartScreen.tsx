type StartScreenProps = {
  onStart: () => void;
  onOpenSound: () => void;
};

export function StartScreen({ onStart, onOpenSound }: StartScreenProps) {
  return (
    <section className="screen start-screen">
      <p className="logo">🗞️</p>
      <h1>へんてこニュース</h1>
      <p className="subtitle">へんなニュースをつくるよ！</p>
      <div className="button-stack">
        <button className="primary big" onClick={onStart}>はじめるドーン！</button>
        <button className="secondary" onClick={onOpenSound}>おと</button>
      </div>
    </section>
  );
}
