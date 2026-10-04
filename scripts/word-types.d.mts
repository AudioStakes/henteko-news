import type { WordOption } from "../src/types/game.js";

export type LiteralValue =
  | string
  | number
  | boolean
  | null
  | LiteralValue[]
  | { [key: string]: LiteralValue };

export type ActionWord = Required<WordOption>;
