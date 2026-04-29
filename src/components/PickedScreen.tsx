import { toCardWord } from '../utils/words';

type PickedScreenProps = {
  word: string;
};

export function PickedScreen({ word }: PickedScreenProps) {
  return (
    <section className="screen picked-screen">
      <p className="picked-label">えらんだ！</p>
      <p className="picked-word">{toCardWord(word)}</p>
      <p className="picked-sub">ドーン！</p>
    </section>
  );
}
