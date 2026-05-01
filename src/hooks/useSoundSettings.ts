import type { SoundSettings } from "../types/game";
import { useLocalStorage } from "./useLocalStorage";

export const INITIAL_SOUND: SoundSettings = { enabled: true, speed: "normal" };

function parseSoundSettings(value: unknown): SoundSettings {
  if (!value || typeof value !== "object") return INITIAL_SOUND;
  const raw = value as Record<string, unknown>;
  const speed = raw.speed;
  return {
    enabled: Boolean(raw.enabled),
    speed:
      speed === "slow" || speed === "normal" || speed === "fast" || speed === "veryFast"
        ? speed
        : "normal",
  };
}

export function useSoundSettings() {
  return useLocalStorage<SoundSettings>("henteko-news-sound", INITIAL_SOUND, parseSoundSettings);
}
