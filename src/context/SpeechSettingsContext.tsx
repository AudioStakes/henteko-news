import { createContext, type ReactNode, useContext, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  DEFAULT_SPEECH_SETTINGS,
  parseSpeechSettings,
  SPEECH_SETTINGS_STORAGE_KEY,
  type SpeechSettings,
} from "../utils/speechSettings";

type SpeechSettingsContextValue = {
  settings: SpeechSettings;
  updateSettings: (next: SpeechSettings) => void;
};

const SpeechSettingsContext = createContext<SpeechSettingsContextValue>({
  settings: DEFAULT_SPEECH_SETTINGS,
  updateSettings: () => {},
});

export function SpeechSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage(
    SPEECH_SETTINGS_STORAGE_KEY,
    DEFAULT_SPEECH_SETTINGS,
    parseSpeechSettings,
  );
  const value = useMemo(
    () => ({
      settings,
      updateSettings: (next: SpeechSettings) => {
        setSettings(parseSpeechSettings(next));
      },
    }),
    [settings, setSettings],
  );

  return <SpeechSettingsContext.Provider value={value}>{children}</SpeechSettingsContext.Provider>;
}

export function useSpeechSettings() {
  return useContext(SpeechSettingsContext);
}
