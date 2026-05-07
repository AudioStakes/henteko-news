import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useButtonSound } from "../hooks/useButtonSound";
import type { Category, WordOption } from "../types/game";
import { calculateChoiceCardTextLayout } from "../utils/choiceCardTextLayout";
import { toWordOption } from "../utils/wordOption";
import { toCardWord } from "../utils/words";
import { CharacterImage } from "./CharacterImage";
import { StepIndicator } from "./StepIndicator";

type WordSelectScreenProps = {
  category: Category;
  onSelect: (word: WordOption) => void;
  currentStep: number;
  totalSteps: number;
  imageUrl: string;
};
const MAX_CHOICES = 5;
const CHOICE_CARD_MIN_FONT_SIZE = 18;
const CHOICE_CARD_MAX_FONT_SIZE = 35;
const CHOICE_CARD_GLYPH_WIDTH_RATIO = 1;

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
  imageUrl,
}: WordSelectScreenProps) {
  const { playOnPressStart, withClickSound } = useButtonSound();
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
  const [choiceGridWidth, setChoiceGridWidth] = useState(373);
  const selectTimeoutRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (!gridElement) return;

    const updateGridWidth = () => {
      setChoiceGridWidth(Math.max(0, Math.floor(gridElement.clientWidth)));
    };

    updateGridWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateGridWidth);
      return () => window.removeEventListener("resize", updateGridWidth);
    }

    const observer = new ResizeObserver(updateGridWidth);
    observer.observe(gridElement);

    return () => observer.disconnect();
  }, [gridElement]);

  useEffect(
    () => () => {
      if (selectTimeoutRef.current !== null) {
        window.clearTimeout(selectTimeoutRef.current);
      }
    },
    [],
  );

  const choiceCards = useMemo(
    () =>
      shuffledWords.map((choice) => {
        const cardLabel = toCardWord(choice.option.display);
        const layout = calculateChoiceCardTextLayout({
          gridWidth: choiceGridWidth,
          text: cardLabel,
          minFontSize: CHOICE_CARD_MIN_FONT_SIZE,
          maxFontSize: CHOICE_CARD_MAX_FONT_SIZE,
          glyphWidthRatio: CHOICE_CARD_GLYPH_WIDTH_RATIO,
        });

        return {
          ...choice,
          cardLabel,
          fontSize: layout.fontSize,
        };
      }),
    [choiceGridWidth, shuffledWords],
  );

  const handlePick = (
    event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
    id: string,
    option: WordOption,
  ) => {
    if (pickedId) return;
    event.currentTarget.blur();
    setPickedId(id);
    selectTimeoutRef.current = window.setTimeout(() => {
      selectTimeoutRef.current = null;
      onSelect(option);
    }, 260);
  };

  return (
    <section className="screen select-screen">
      <StepIndicator current={currentStep} total={totalSteps} />
      <div className="hero hero-select">
        <CharacterImage variant="select" src={imageUrl} className="select-character" />
        <div className="speech speech-select speech-select--from-hiyoko">{category.label}</div>
      </div>
      <div className="choice-grid" ref={setGridElement}>
        {choiceCards.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className={`choice-card${pickedId === choice.id ? " is-selected" : ""}`}
            disabled={Boolean(pickedId)}
            onClick={withClickSound((event) => handlePick(event, choice.id, choice.option))}
            onPointerDown={playOnPressStart}
            style={{
              ["--choice-card-font-size" as string]: `${choice.fontSize}px`,
            }}
          >
            <span className="choice-card__label">{choice.cardLabel}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
