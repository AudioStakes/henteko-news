import { CATEGORIES } from "../data/words";
import type { CategoryKey, WordOption } from "../types/game";
import { buildNewsLines } from "../utils/speechText";
import { buildShuffledChoices, type Choice, type GameCategory } from "./gameChoices";

export type ScreenState =
  | Readonly<{ name: "start" }>
  | Readonly<{ name: "select"; step: number }>
  | Readonly<{ name: "result" }>;

export type GameSelections = Readonly<Partial<Record<CategoryKey, Readonly<WordOption>>>>;

export type GameSnapshot = Readonly<{
  screen: ScreenState;
  selections: GameSelections;
  currentStep: number;
  currentCategory: GameCategory | null;
  totalSteps: number;
  choices: readonly Choice[];
  lines: readonly string[];
}>;

export type GameSession = ReturnType<typeof createGameSession>;

const categories: readonly GameCategory[] = Object.freeze(
  CATEGORIES.map((category) =>
    Object.freeze({
      ...category,
      words: Object.freeze(
        category.words.map((word) =>
          typeof word === "string" ? word : Object.freeze({ ...word }),
        ),
      ),
    }),
  ),
);

export function createGameSession({ random = Math.random }: { random?: () => number } = {}) {
  let round = 0;
  const listeners = new Set<() => void>();

  function createSnapshot(screen: ScreenState, selections: GameSelections): GameSnapshot {
    const currentStep = screen.name === "select" ? screen.step : 0;
    const currentCategory = screen.name === "select" ? categories[currentStep] : null;
    if (currentCategory === undefined) {
      throw new RangeError("Selection step is out of bounds");
    }
    const choices = currentCategory
      ? buildShuffledChoices(currentCategory, 5, random).map((choice) =>
          Object.freeze({ ...choice, id: `${round}:${currentStep}:${choice.id}` }),
        )
      : [];

    return Object.freeze({
      screen: Object.freeze(screen),
      selections: Object.freeze(selections),
      currentStep,
      currentCategory,
      totalSteps: categories.length,
      choices: Object.freeze(choices),
      lines: Object.freeze(buildNewsLines(selections)),
    });
  }

  let snapshot = createSnapshot({ name: "start" }, {});

  function publish(next: GameSnapshot) {
    snapshot = next;
    for (const listener of [...listeners]) {
      listener();
    }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(this: void, listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start(this: void) {
      round += 1;
      publish(createSnapshot({ name: "select", step: 0 }, {}));
    },
    select(this: void, choiceId: string): boolean {
      if (snapshot.screen.name !== "select" || snapshot.currentCategory === null) {
        return false;
      }
      const choice = snapshot.choices.find((candidate) => candidate.id === choiceId);
      if (choice === undefined) {
        return false;
      }
      const selections = { ...snapshot.selections, [snapshot.currentCategory.key]: choice.option };
      const step = snapshot.screen.step + 1;
      publish(
        createSnapshot(
          step < categories.length ? { name: "select", step } : { name: "result" },
          selections,
        ),
      );
      return true;
    },
  };
}
