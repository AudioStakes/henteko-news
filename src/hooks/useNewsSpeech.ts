import { useMemo, useState } from "react";
import { DEFAULT_NEWS_SPEECH_CONFIG } from "../constants/speech";
import { CATEGORIES } from "../data/words";
import type { Selections } from "../types/game";
import { buildNewsLines, toSpeechText } from "../utils/speechText";
import { useSpeech } from "./useSpeech";

type SpeechAvailability = "ready" | "unsupported" | "speaking" | "error";

function buildSpeechError(reason: "unsupported" | "timeout" | "error") {
  if (reason === "unsupported") {
    return "このブラウザでは読み上げできないことがあります。でも文字で遊べます。";
  }

  if (reason === "timeout") {
    return "いまは こえが でにくいみたい。文字を見てあそんで、あとで もういちど よんでみてね。";
  }

  return "よみあげが うまくできませんでした。文字でニュースを読んであそべます。";
}

export function useNewsSpeech() {
  const [speechError, setSpeechError] = useState("");
  const { speak, isSupported, isSpeaking, warmup, cancel } = useSpeech();

  const speechAvailability: SpeechAvailability = useMemo(() => {
    if (!isSupported) return "unsupported";
    if (isSpeaking) return "speaking";
    if (speechError) return "error";
    return "ready";
  }, [isSupported, isSpeaking, speechError]);

  const speakNews = (nextSelections: Selections) => {
    if (buildNewsLines(nextSelections).length !== CATEGORIES.length) return;

    if (!isSupported) {
      setSpeechError(buildSpeechError("unsupported"));
      return;
    }

    setSpeechError("");
    const ok = speak(toSpeechText(nextSelections), {
      ...DEFAULT_NEWS_SPEECH_CONFIG,
      onError: (reason) => setSpeechError(buildSpeechError(reason)),
    });

    if (!ok && !isSpeaking) {
      setSpeechError(buildSpeechError("error"));
    }
  };

  return {
    speechError,
    setSpeechError,
    isSupported,
    warmup,
    cancel,
    speakNews,
    isSpeaking,
    speechAvailability,
  };
}
