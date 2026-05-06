import { useMemo, useState } from "react";
import { CATEGORIES } from "../data/words";
import type { Category, Selections, WordOption } from "../types/game";
import { toWordOption } from "../utils/wordOption";

export type ScreenState = { name: "start" } | { name: "select"; step: number } | { name: "result" };

export function useGameFlow() {
  const [screen, setScreen] = useState<ScreenState>({ name: "start" });
  const [selections, setSelections] = useState<Selections>({});
  const currentStep = screen.name === "select" ? screen.step : 0;
  const currentCategory: Category | null = useMemo(
    () => (screen.name === "select" ? (CATEGORIES[screen.step] ?? null) : null),
    [screen],
  );
  const isLastSelectStep = screen.name === "select" && screen.step === CATEGORIES.length - 1;

  const startGame = () => {
    setSelections({});
    setScreen({ name: "select", step: 0 });
  };
  const handleSelectWord = (word: string | WordOption) => {
    if (screen.name !== "select") return selections;
    const category = CATEGORIES[screen.step];
    const nextSelections = { ...selections, [category.key]: toWordOption(word) };
    setSelections(nextSelections);
    if (screen.step === CATEGORIES.length - 1) setScreen({ name: "result" });
    else setScreen({ name: "select", step: screen.step + 1 });
    return nextSelections;
  };
  return {
    screen,
    currentStep,
    currentCategory,
    isLastSelectStep,
    selections,
    startGame,
    handleSelectWord,
    setSelections,
  };
}
