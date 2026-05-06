import { useState } from "react";
import { DEFAULT_NEWS_SPEECH_CONFIG } from "../constants/speech";
import type { Selections } from "../types/game";
import { buildNewsLines, toSpeechText } from "../utils/speechText";
import { useSpeech } from "./useSpeech";

export function useNewsSpeech() {
  const [speechError, setSpeechError] = useState("");
  const { speak, isSupported, isSpeaking, warmup, cancel } = useSpeech();
  const showSpeechUnavailable = () =>
    setSpeechError("よみあげの おとが でません。ブラウザを さいきどうすると なおるかも。");

  const speakNews = (nextSelections: Selections) => {
    if (buildNewsLines(nextSelections).length !== 5) return;
    setSpeechError("");
    const ok = speak(toSpeechText(nextSelections), {
      ...DEFAULT_NEWS_SPEECH_CONFIG,
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
