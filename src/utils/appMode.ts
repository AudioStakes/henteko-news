import type { Selections, WordOption } from "../types/game";

export function parseDebugWord(value: string | null): WordOption | undefined {
  if (!value) return undefined;
  const decoded = value.trim();
  if (!decoded) return undefined;
  return { display: decoded, speech: decoded };
}

export function getDebugSelections(search: string): Selections | null {
  const params = new URLSearchParams(search);
  if (params.get("debugResult") !== "1") return null;

  return {
    who: parseDebugWord(params.get("who")),
    when: parseDebugWord(params.get("when")),
    where: parseDebugWord(params.get("where")),
    what: parseDebugWord(params.get("what")),
    action: parseDebugWord(params.get("action")),
  };
}

export function resolveAppMode(pathname: string, search: string) {
  return {
    isWordsAudioCheckRoute: pathname === "/words-audio-check",
    debugSelections: getDebugSelections(search),
  };
}
