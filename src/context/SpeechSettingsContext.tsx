import { createContext, type ReactNode, useContext, useMemo } from "react";
import { type SpeechSettingsApi, validateSpeechSettings } from "../application/speechSettings";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  DEFAULT_SPEECH_SETTINGS,
  parseSpeechSettings,
  SPEECH_SETTINGS_STORAGE_KEY,
} from "../utils/speechSettings";

const SpeechSettingsContext = createContext<SpeechSettingsApi>(
  Object.freeze<SpeechSettingsApi>({
    settings: DEFAULT_SPEECH_SETTINGS,
    saveSettings: () => ({
      ok: false,
      errors: {
        provider: "音声設定を利用できません。",
        modelBasePath: "",
        voiceStylePath: "",
      },
    }),
  }),
);

export function SpeechSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage(
    SPEECH_SETTINGS_STORAGE_KEY,
    DEFAULT_SPEECH_SETTINGS,
    parseSpeechSettings,
  );
  const value = useMemo(
    (): SpeechSettingsApi =>
      Object.freeze({
        settings,
        saveSettings: (next: unknown) => {
          const result = validateSpeechSettings(next);
          if (result.ok) {
            setSettings(result.settings);
          }
          return result;
        },
      }),
    [settings, setSettings],
  );

  return <SpeechSettingsContext.Provider value={value}>{children}</SpeechSettingsContext.Provider>;
}

export function useSpeechSettings() {
  return useContext(SpeechSettingsContext);
}
