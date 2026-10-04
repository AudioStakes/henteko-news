import { useEffect, useRef } from "react";
import { useSpeechSettings } from "../context/SpeechSettingsContext";
import { useModelSpeech } from "./useModelSpeech";
import { useWebSpeech } from "./useWebSpeech";

export type SpeakOptions = {
  rate: number;
  pitch: number;
  onEnd?: () => void;
  onError?: (reason: "timeout" | "error") => void;
};

export { SYNTHESIS_TIMEOUT_MS } from "./useModelSpeech";

export function useSpeech() {
  const { settings } = useSpeechSettings();
  const webSpeech = useWebSpeech();
  const modelSpeech = useModelSpeech(settings);
  const settingsKey = JSON.stringify([
    settings.provider,
    settings.modelBasePath,
    settings.voiceStylePath,
  ]);
  const cancelWeb = webSpeech.cancel;
  const cancelModel = modelSpeech.cancel;
  const previousSettingsKey = useRef(settingsKey);

  useEffect(() => {
    if (previousSettingsKey.current === settingsKey) {
      return;
    }
    previousSettingsKey.current = settingsKey;
    cancelWeb();
    cancelModel();
  }, [settingsKey, cancelWeb, cancelModel]);

  return {
    ...(settings.provider === "supertonic" ? modelSpeech : webSpeech),
    settingsKey,
  };
}
