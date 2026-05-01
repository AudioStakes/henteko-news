import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Category } from "../types/game";
import { playChoiceSound, primeChoiceSound } from "../utils/soundEffects";
import { toWordOption } from "../utils/wordOption";
import { toCardWord } from "../utils/words";
import { CharacterImage } from "./CharacterImage";

type WordSelectScreenProps = {
  category: Category;
  onSelect: (word: string) => void;
};

const MAX_CHOICES = 6;
const MAX_FONT_SIZE = 38;
const MIN_FONT_SIZE = 18;

function shuffleWords(words: Array<{ id: string; text: string }>) {
  const shuffled = [...words];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function WordSelectScreen({ category, onSelect }: WordSelectScreenProps) {
  const shuffledWords = useMemo(
    () =>
      shuffleWords(
        category.words.map((word, originalIndex) => ({
          id: `${category.key}-${originalIndex}-${toWordOption(word).display}`,
          text: toWordOption(word).display,
        })),
      ).slice(0, MAX_CHOICES),
    [category],
  );
  const [pickedWord, setPickedWord] = useState("");
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handlePick = (word: string) => {
    if (pickedWord) return;

    setPickedWord(word);

    void playChoiceSound().catch((_error) => {
      // keep game flow even when sound playback is unavailable
    });
    window.setTimeout(() => onSelect(word), 320);
  };

  const handlePressStart = () => {
    void primeChoiceSound().catch(() => {
      // iOS Safari may reject unlock attempts; try again on actual tap.
    });
  };

  useLayoutEffect(() => {
    const fitChoices = () => {
      buttonRefs.current.forEach((button) => {
        if (!button) return;

        let nextSize = MAX_FONT_SIZE;
        button.style.fontSize = `${nextSize}px`;

        while (
          nextSize > MIN_FONT_SIZE &&
          (Math.ceil(button.scrollWidth) > Math.ceil(button.clientWidth) ||
            Math.ceil(button.scrollHeight) > Math.ceil(button.clientHeight))
        ) {
          nextSize -= 1;
          button.style.fontSize = `${nextSize}px`;
        }
      });
    };

    fitChoices();

    const resizeObserver = new ResizeObserver(() => {
      fitChoices();
    });

    buttonRefs.current.forEach((button) => {
      if (button) resizeObserver.observe(button);
    });

    window.addEventListener("resize", fitChoices);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", fitChoices);
    };
  }, []);

  return (
    <section className="screen select-screen">
      <div className="hero hero-select">
        <CharacterImage variant="select" className="select-character" />
        <div className="speech speech-select speech-select--from-hiyoko">{category.label}</div>
      </div>
      <div className="choice-grid">
        {shuffledWords.map((choice, index) => {
          const isPicked = pickedWord === choice.text;
          return (
            <button
              key={choice.id}
              type="button"
              className={`choice-card${isPicked ? " is-selected" : ""}`}
              disabled={Boolean(pickedWord)}
              onClick={() => handlePick(choice.text)}
              onPointerDown={handlePressStart}
              onTouchStart={handlePressStart}
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
            >
              {toCardWord(choice.text)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
