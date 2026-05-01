import { useState } from "react";
import { CATEGORIES } from "../data/words";
import type { Selections } from "../types/game";
import { toWordOption } from "../utils/wordOption";

type Screen = "start" | "sound" | "select" | "result";

export function useGameFlow() {
  const [screen, setScreen] = useState<Screen>("start");
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Selections>({});

  const startGame = () => {
    setSelections({});
    setStep(0);
    setScreen("select");
  };

  const handleSelectWord = (word: string) => {
    const category = CATEGORIES[step];
    const nextSelections = { ...selections, [category.key]: toWordOption(word) };
    setSelections(nextSelections);
    if (step === CATEGORIES.length - 1) setScreen("result");
    else setStep((prev) => prev + 1);
    return nextSelections;
  };

  return { screen, setScreen, step, selections, startGame, handleSelectWord, setSelections };
}
