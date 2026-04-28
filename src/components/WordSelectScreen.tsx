import { useMemo } from 'react';
import type { Category } from '../types/game';

type WordSelectScreenProps = {
  category: Category;
  onSelect: (word: string) => void;
};

function shuffleWords(words: string[]) {
  const shuffled = [...words];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function WordSelectScreen({ category, onSelect }: WordSelectScreenProps) {
  const shuffledWords = useMemo(() => shuffleWords(category.words), [category]);

  return (
    <section className="screen">
      <p className="step">えらぶのは {category.label}</p>
      <h2>{category.label}</h2>
      <div className="word-grid">
        {shuffledWords.map((word) => (
          <button key={word} className="word-card" onClick={() => onSelect(word)}>
            {word}
          </button>
        ))}
      </div>
    </section>
  );
}
