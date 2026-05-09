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
import { toCardWord } from "../utils/words";
import { CharacterImage } from "./CharacterImage";
import { StepIndicator } from "./StepIndicator";
import {
  buildShuffledChoices,
  computePickState,
  scheduleSelection,
} from "./wordSelectScreenHelpers";

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

export function WordSelectScreen({
  category,
  onSelect,
  currentStep,
  totalSteps,
  imageUrl,
}: WordSelectScreenProps) {
  const { playOnPressStart, withClickSound } = useButtonSound();
  const shuffledWords = useMemo(() => buildShuffledChoices(category, MAX_CHOICES), [category]);
  const [pickedId, setPickedId] = useState("");
  const [gridElement, setGridElement] = useState<HTMLDivElement | null>(null);
  const [choiceGridWidth, setChoiceGridWidth] = useState(373);
  const pickedIdRef = useRef("");
  const selectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        clearTimeout(selectTimeoutRef.current);
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
    const nextPickedId = computePickState(pickedIdRef.current, id);
    if (nextPickedId === pickedIdRef.current) return;

    pickedIdRef.current = nextPickedId;
    event.currentTarget.blur();
    setPickedId(nextPickedId);
    selectTimeoutRef.current = scheduleSelection(
      (selectedWord) => {
        selectTimeoutRef.current = null;
        onSelect(selectedWord);
      },
      option,
      260,
      window.setTimeout,
    );
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
            data-testid="choice-card"
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
