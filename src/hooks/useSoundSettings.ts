import type { SoundSettings } from "../types/game";
import { useLocalStorage } from "./useLocalStorage";

export const INITIAL_SOUND: SoundSettings = { enabled: true };

export function parseSoundSettings(value: unknown): SoundSettings {
  if (!value || typeof value !== "object") return INITIAL_SOUND;
  const raw = value as Record<string, unknown>;
  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : INITIAL_SOUND.enabled,
  };
}

export function useSoundSettings() {
  return useLocalStorage<SoundSettings>("henteko-news-sound", INITIAL_SOUND, parseSoundSettings);
}
