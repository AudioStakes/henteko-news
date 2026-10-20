import type { Category, WordOption } from "../types/game";
import { toWordOption } from "../utils/wordOption";

export type GameCategory = Readonly<{
  key: Category["key"];
  label: string;
  words: readonly (string | Readonly<WordOption>)[];
}>;

export type Choice = Readonly<{ id: string; option: Readonly<WordOption> }>;

export function buildShuffledChoices(
  category: GameCategory,
  maxChoices = 5,
  randomFn: () => number = Math.random,
): Choice[] {
  const shuffled = category.words.map((word, i) => {
    const option = Object.freeze({ ...toWordOption(word) });
    return Object.freeze({ id: `${category.key}-${i}-${option.display}`, option });
  });

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));
    const currentChoice = shuffled[i];
    const randomChoice = shuffled[j];
    if (currentChoice === undefined || randomChoice === undefined) {
      throw new RangeError("Random choice index is out of bounds");
    }
    shuffled[i] = randomChoice;
    shuffled[j] = currentChoice;
  }

  return shuffled.slice(0, maxChoices);
}
