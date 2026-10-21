import { useEffect, useRef, useState } from "react";
import type { Choice } from "../application";
import { toCardWord } from "../utils/words";
import { NewsCaster } from "./NewsCaster";
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
  const pickedIdRef = useRef("");
  const selectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const choiceCards = choices.map((choice) => ({
    ...choice,
    label: toCardWord(choice.option.display),
  }));
  const hasLongWords = choiceCards.some((choice) => Array.from(choice.label).length > 8);

  useEffect(
    () => () => {
      if (selectTimeoutRef.current !== null) {
        clearTimeout(selectTimeoutRef.current);
      }
    },
    [],
  );

  const handlePick = (id: string) => {
    if (pickedIdRef.current.length > 0) {
      return;
    }
    pickedIdRef.current = id;
    setPickedId(id);
    if (currentStep === totalSteps - 1) {
      // Narration must start in the user event to retain browser audio permission.
      onSelect(id);
      return;
    }
    selectTimeoutRef.current = window.setTimeout(() => {
      selectTimeoutRef.current = null;
      onSelect(id);
    }, 260);
  };

  return (
    <section className="screen select-screen">
      <NewsCaster imageUrl={imageUrl} />
      <StepIndicator current={currentStep} total={totalSteps} />
      <h2 className="question speech-select" data-screen-heading tabIndex={-1}>
        {category.label}
      </h2>
      <div className={`choice-grid${hasLongWords ? " long-choices" : ""}`}>
        {choiceCards.map((choice) => (
          <button
            key={choice.id}
            type="button"
            data-testid="choice-card"
            className={`choice-card${pickedId === choice.id ? " is-selected" : ""}`}
            disabled={pickedId.length > 0}
            onClick={(event) => {
              withClickSound(() => {
                handlePick(choice.id);
              })(event);
            }}
            onPointerDown={playOnPressStart}
          >
            <span className="choice-card__label">{choice.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
