import { useState } from "react";
import type { Selections, SoundSettings } from "../types/game";
import { buildNewsLines, toSpeechText } from "../utils/speechText";
import { useSpeech } from "./useSpeech";

export function useNewsSpeech(soundSettings: SoundSettings) {
  const [speechError, setSpeechError] = useState("");
  const { speak, isSupported, isSpeaking, warmup, cancel } = useSpeech();
  const showSpeechUnavailable = () =>
    setSpeechError("よみあげの おとが でません。ブラウザを さいきどうすると なおるかも。");

  const speakNews = (nextSelections: Selections) => {
    if (!soundSettings.enabled || buildNewsLines(nextSelections).length !== 5) return;
    setSpeechError("");
    const ok = speak(toSpeechText(nextSelections), {
      rate: 1,
      pitch: 1,
      onError: showSpeechUnavailable,
    });
    if (!ok && !isSpeaking) showSpeechUnavailable();
  };

  return {
    speechError,
    setSpeechError,
    isSupported,
    warmup,
    cancel,
    speakNews,
    isSpeaking,
  };
}
