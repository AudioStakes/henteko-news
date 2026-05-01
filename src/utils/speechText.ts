import { ACTION_POLITE_MAP } from "../data/actions";
import type { Selections, WordOption } from "../types/game";

function toSpeech(word?: WordOption) {
  if (!word) return "";
  if (word.speech?.trim()) return word.speech.trim();
  const normalized = word.display.replace(/[！!]/g, "").trim();
  if (!normalized) return "";
  if (ACTION_POLITE_MAP[normalized]) return ACTION_POLITE_MAP[normalized];
  if (normalized.endsWith("しました") || normalized.endsWith("ました")) return normalized;
  if (normalized.endsWith("した")) return `${normalized.slice(0, -2)}しました`;
  return normalized;
}

export function buildNewsLines(selections: Selections) {
  return [
    selections.who?.display,
    selections.when?.display,
    selections.where?.display,
    selections.what?.display,
    selections.action ? `${toSpeech(selections.action)}！` : undefined,
  ].filter((word): word is string => Boolean(word));
}

export function toSpeechText(selections: Selections) {
  const parts = [
    selections.who?.speech ?? selections.who?.display,
    selections.when?.speech ?? selections.when?.display,
    selections.where?.speech ?? selections.where?.display,
    selections.what?.speech ?? selections.what?.display,
    toSpeech(selections.action),
  ].filter((word): word is string => Boolean(word));
  return parts.length > 0 ? `ニュースです！${parts.join("、")}！` : "ニュースです！";
}
