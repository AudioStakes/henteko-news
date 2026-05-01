import { useMemo, useRef, useState } from "react";
import { useButtonSound } from "../hooks/useButtonSound";
import { useFitText } from "../hooks/useFitText";
import type { Category, WordOption } from "../types/game";
import { toWordOption } from "../utils/wordOption";
import { toCardWord } from "../utils/words";
import { CharacterImage } from "./CharacterImage";

type WordSelectScreenProps = { category: Category; onSelect: (word: WordOption) => void };
const MAX_CHOICES = 6;
function shuffleWords(words: Array<{ id: string; option: WordOption }>) {
  const shuffled = [...words];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function WordSelectScreen({ category, onSelect }: WordSelectScreenProps) {
  const { primeOnPressStart, withClickSound } = useButtonSound();
  const shuffledWords = useMemo(
    () =>
      shuffleWords(
        category.words.map((word, i) => {
          const option = toWordOption(word);
          return { id: `${category.key}-${i}-${option.display}`, option };
        }),
      ).slice(0, MAX_CHOICES),
    [category],
  );
  const [pickedId, setPickedId] = useState("");
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  useFitText(buttonRefs.current, { minFontSize: 18, maxFontSize: 38 });

  const handlePick = (id: string, option: WordOption) => {
    if (pickedId) return;
    setPickedId(id);
    window.setTimeout(() => onSelect(option), 320);
  };

  return (
    <section className="screen select-screen">
      <div className="hero hero-select">
        <CharacterImage variant="select" className="select-character" />
        <div className="speech speech-select speech-select--from-hiyoko">{category.label}</div>
      </div>
      <div className="choice-grid">
        {shuffledWords.map((choice, index) => (
          <button
            key={choice.id}
            type="button"
            className={`choice-card${pickedId === choice.id ? " is-selected" : ""}`}
            disabled={Boolean(pickedId)}
            onClick={withClickSound(() => handlePick(choice.id, choice.option))}
            onPointerDown={primeOnPressStart}
            ref={(element) => {
              buttonRefs.current[index] = element;
            }}
          >
            {toCardWord(choice.option.display)}
          </button>
        ))}
      </div>
    </section>
  );
}
