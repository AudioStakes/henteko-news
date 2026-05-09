import type { Category, WordOption } from "../types/game";
import { toWordOption } from "../utils/wordOption";

export type ShuffledChoice = { id: string; option: WordOption };

export function buildShuffledChoices(
  category: Category,
  maxChoices = 5,
  randomFn: () => number = Math.random,
): ShuffledChoice[] {
  const shuffled = category.words.map((word, i) => {
    const option = toWordOption(word);
    return { id: `${category.key}-${i}-${option.display}`, option };
  });

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, maxChoices);
}

export function computePickState(prevPickedId: string, nextId: string): string {
  return prevPickedId || nextId;
}

export function scheduleSelection(
  onSelect: (word: WordOption) => void,
  option: WordOption,
  delayMs = 260,
  scheduleFn: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout> = setTimeout,
) {
  return scheduleFn(() => {
    onSelect(option);
  }, delayMs);
}
