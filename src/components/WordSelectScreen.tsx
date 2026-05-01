import { useMemo, useState } from "react";
import { useButtonSound } from "../hooks/useButtonSound";
import { useFitText } from "../hooks/useFitText";
import type { Category, WordOption } from "../types/game";
import { toWordOption } from "../utils/wordOption";
import { toCardWord } from "../utils/words";
import { CharacterImage } from "./CharacterImage";
import { StepIndicator } from "./StepIndicator";

type WordSelectScreenProps = {
  category: Category;
  onSelect: (word: WordOption) => void;
  currentStep: number;
  totalSteps: number;
};
const MAX_CHOICES = 6;
function shuffleWords(words: Array<{ id: string; option: WordOption }>) {
  const shuffled = [...words];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function WordSelectScreen({
  category,
  onSelect,
  currentStep,
  totalSteps,
}: WordSelectScreenProps) {
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
  const [gridElement, setGridElement] = useState<HTMLDivElement | null>(null);
  useFitText({
    root: gridElement,
    minFontSize: 24,
    maxFontSize: 38,
    targetsSelector: ".choice-card",
    fitMode: "individual",
  });

  const handlePick = (id: string, option: WordOption) => {
    if (pickedId) return;
    setPickedId(id);
    window.setTimeout(() => onSelect(option), 320);
  };

  return (
    <section className="screen select-screen">
      <StepIndicator current={currentStep} total={totalSteps} />
      <div className="hero hero-select">
        <CharacterImage variant="select" className="select-character" />
        <div className="speech speech-select speech-select--from-hiyoko">{category.label}</div>
      </div>
      <div className="choice-grid" ref={setGridElement}>
        {shuffledWords.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className={`choice-card${pickedId === choice.id ? " is-selected" : ""}`}
            disabled={Boolean(pickedId)}
            onClick={withClickSound(() => handlePick(choice.id, choice.option))}
            onPointerDown={primeOnPressStart}
          >
            {toCardWord(choice.option.display)}
          </button>
        ))}
      </div>
    </section>
  );
}
