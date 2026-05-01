import type { WordOption } from "../types/game";

export function toWordOption(word: string | WordOption): WordOption {
  return typeof word === "string" ? { display: word, speech: word } : word;
}

export function wordDisplay(word: string | WordOption): string {
  return toWordOption(word).display;
}
