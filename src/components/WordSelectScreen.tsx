import { useMemo, useState } from 'react';
import type { Category } from '../types/game';
import { toCardWord } from '../utils/words';
import { AlienAnnouncer } from './AlienAnnouncer';
import selectStudio from '../assets/select-studio.svg';

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
  const [pickedWord, setPickedWord] = useState('');

  const handlePick = (word: string) => {
    if (pickedWord) return;
    setPickedWord(word);
    window.setTimeout(() => onSelect(word), 220);
  };

  return (
    <section className="screen select-screen">
      <div className="hero hero-select">
        <img className="hero-bg" src={selectStudio} alt="" />
        <AlienAnnouncer className="alien-select" />
        <div className="speech speech-select">{category.label}</div>
      </div>
      <div className="choice-grid">
        {shuffledWords.map((word, index) => {
          const colors = ['yellow', 'green', 'purple', 'blue-line', 'orange-line', 'teal'];
          const isPicked = pickedWord === word;
          return (
            <button
              key={word}
              className={`choice-card ${colors[index % colors.length]}${isPicked ? ' picked' : ''}`}
              disabled={Boolean(pickedWord)}
              onClick={() => handlePick(word)}
            >
              {toCardWord(word)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
