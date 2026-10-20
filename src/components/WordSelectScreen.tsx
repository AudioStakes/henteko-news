import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Choice } from "../application";
import { calculateChoiceCardTextLayout } from "../utils/choiceCardTextLayout";
import { toCardWord } from "../utils/words";
import { CharacterImage } from "./CharacterImage";
import { StepIndicator } from "./StepIndicator";
import { useButtonSound } from "./useButtonSound";

type WordSelectScreenProps = {
  category: { readonly label: string };
  choices: readonly Choice[];
  onSelect: (choiceId: string) => void;
  currentStep: number;
  totalSteps: number;
  imageUrl: string;
};
const CHOICE_CARD_MIN_FONT_SIZE = 18;
const CHOICE_CARD_MAX_FONT_SIZE = 35;
const CHOICE_CARD_GLYPH_WIDTH_RATIO = 1;

export function WordSelectScreen({
  category,
  choices,
  onSelect,
  currentStep,
  totalSteps,
  imageUrl,
}: WordSelectScreenProps) {
  const { playOnPressStart, withClickSound } = useButtonSound();
  const [pickedId, setPickedId] = useState("");
  const [gridElement, setGridElement] = useState<HTMLDivElement | null>(null);
  const [choiceGridWidth, setChoiceGridWidth] = useState(373);
  const pickedIdRef = useRef("");
  const selectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    if (!gridElement) {
      return;
    }

    const updateGridWidth = () => {
      setChoiceGridWidth(Math.max(0, Math.floor(gridElement.clientWidth)));
    };

    updateGridWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateGridWidth);
      return () => {
        window.removeEventListener("resize", updateGridWidth);
      };
    }

    const observer = new ResizeObserver(updateGridWidth);
    observer.observe(gridElement);

    return () => {
      observer.disconnect();
    };
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
      choices.map((choice) => {
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
    [choiceGridWidth, choices],
  );

  const handlePick = (id: string) => {
    if (pickedIdRef.current.length > 0) {
      return;
    }
    pickedIdRef.current = id;
    setPickedId(id);
    selectTimeoutRef.current = window.setTimeout(() => {
      selectTimeoutRef.current = null;
      onSelect(id);
    }, 260);
  };

  return (
    <section className="screen select-screen">
      <StepIndicator current={currentStep} total={totalSteps} />
      <div className="hero hero-select">
        <CharacterImage variant="select" src={imageUrl} className="select-character" />
        <h2
          className="speech speech-select speech-select--from-hiyoko"
          data-screen-heading
          tabIndex={-1}
        >
          {category.label}
        </h2>
      </div>
      <div className="choice-grid" ref={setGridElement}>
        {choiceCards.map((choice) => (
          <button
            key={choice.id}
            type="button"
            data-testid="choice-card"
            className={`choice-card${pickedId === choice.id ? " is-selected" : ""}`}
            disabled={Boolean(pickedId)}
            onClick={(event) => {
              withClickSound(() => {
                handlePick(choice.id);
              })(event);
            }}
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
