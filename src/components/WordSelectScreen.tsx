import { useMemo } from 'react';
import type { Category } from '../types/game';
import { toCardWord } from '../utils/words';
import { AlienAnnouncer } from './AlienAnnouncer';
import { AppHeader } from './AppHeader';

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
      <AppHeader />
      <div className="studio-panel compact">
        <AlienAnnouncer variant="select" />
        <p className="speech-balloon">{category.label}</p>
      </div>
      <div className="word-grid">
        {shuffledWords.map((word) => (
          <button key={word} className="word-card" onClick={() => onSelect(word)}>{toCardWord(word)}</button>
        ))}
      </div>
    </section>
  );
}
