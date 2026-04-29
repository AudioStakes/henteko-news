type StartScreenProps = {
  onStart: () => void;
  onOpenSound: () => void;
};

export function StartScreen({ onStart, onOpenSound }: StartScreenProps) {
  return (
    <section className="screen start-screen">
      <p className="logo">🗞️</p>
      <h1>へんてこニュース</h1>
      <div className="button-stack">
        <button className="primary big" onClick={onStart}>つくる</button>
        <button className="secondary" onClick={onOpenSound}>おと</button>
      </div>
    </section>
  );
}
