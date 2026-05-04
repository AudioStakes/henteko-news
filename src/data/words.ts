import type { Category } from "../types/game";
import { ACTION_WORDS } from "./words/action";
import { WHAT_WORDS } from "./words/what";
import { WHEN_WORDS } from "./words/when";
import { WHERE_WORDS } from "./words/where";
import { WHO_WORDS } from "./words/who";

export const CATEGORIES: Category[] = [
  { key: "who", label: "だれが？", words: [...WHO_WORDS] },
  { key: "when", label: "いつ？", words: [...WHEN_WORDS] },
  { key: "where", label: "どこで？", words: [...WHERE_WORDS] },
  { key: "what", label: "なにを？", words: [...WHAT_WORDS] },
  { key: "action", label: "どうした？", words: [...ACTION_WORDS] },
];
