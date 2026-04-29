import { useMemo, useState } from 'react';
import type { Category } from '../types/game';
import { toCardWord } from '../utils/words';
import { playChoiceSound } from '../utils/soundEffects';
import { CharacterImage } from './CharacterImage';

type WordSelectScreenProps = {
  category: Category;
  onSelect: (word: string) => void;
};

const MAX_CHOICES = 6;

function shuffleWords(words: string[]) {
  const shuffled = [...words];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function WordSelectScreen({ category, onSelect }: WordSelectScreenProps) {
  const shuffledWords = useMemo(
    () => shuffleWords(category.words).slice(0, MAX_CHOICES),
    [category],
  );
  const [pickedWord, setPickedWord] = useState('');

  const handlePick = (word: string) => {
    if (pickedWord) return;

    setPickedWord(word);

    void playChoiceSound().catch((_error) => {
      // keep game flow even when sound playback is unavailable
    });
    window.setTimeout(() => onSelect(word), 320);
  };

  return (
    <section className="screen select-screen">
      <div className="hero hero-select">
        <CharacterImage variant="select" className="select-character" />
        <div className="speech speech-select speech-select--from-alien">{category.label}</div>
      </div>
      <div className="choice-grid">
        {shuffledWords.map((word) => {
          const isPicked = pickedWord === word;
          return (
            <button
              key={word}
              className={`choice-card${isPicked ? ' is-selected' : ''}`}
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
