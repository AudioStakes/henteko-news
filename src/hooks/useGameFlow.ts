import { useState } from "react";
import { CATEGORIES } from "../data/words";
import type { Selections, WordOption } from "../types/game";
import { toWordOption } from "../utils/wordOption";

export type ScreenState =
  | { name: "start" }
  | { name: "select"; step: number }
  | { name: "result" }
  | { name: "sound"; returnTo: "start" | "result" };

export function useGameFlow() {
  const [screen, setScreen] = useState<ScreenState>({ name: "start" });
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Selections>({});
  const startGame = () => {
    setSelections({});
    setStep(0);
    setScreen({ name: "select", step: 0 });
  };
  const openSound = (returnTo: "start" | "result") => setScreen({ name: "sound", returnTo });
  const closeSound = () =>
    setScreen((prev) => (prev.name === "sound" ? { name: prev.returnTo } : prev));
  const handleSelectWord = (word: string | WordOption) => {
    const category = CATEGORIES[step];
    const nextSelections = { ...selections, [category.key]: toWordOption(word) };
    setSelections(nextSelections);
    if (step === CATEGORIES.length - 1) setScreen({ name: "result" });
    else {
      const next = step + 1;
      setStep(next);
      setScreen({ name: "select", step: next });
    }
    return nextSelections;
  };
  return {
    screen,
    step,
    selections,
    startGame,
    handleSelectWord,
    setSelections,
    openSound,
    closeSound,
  };
}
