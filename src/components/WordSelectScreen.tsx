import type { Category } from '../types/game';

type WordSelectScreenProps = {
  category: Category;
  onSelect: (word: string) => void;
};

export function WordSelectScreen({ category, onSelect }: WordSelectScreenProps) {
  return (
    <section className="screen">
      <p className="step">えらぶのは {category.label}</p>
      <h2>{category.label}</h2>
      <div className="word-grid">
        {category.words.map((word) => (
          <button key={word} className="word-card" onClick={() => onSelect(word)}>
            {word}
          </button>
        ))}
      </div>
    </section>
  );
}
