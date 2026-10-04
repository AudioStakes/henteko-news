import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_NEWS_SPEECH_CONFIG } from "../constants/speech";
import { CATEGORIES } from "../data/words";
import type { Selections } from "../types/game";
import { ANALYTICS_EVENT_NAMES, trackError, trackEvent } from "../utils/analytics";
import { buildNewsLines, toSpeechText } from "../utils/speechText";
import { useSpeech } from "./useSpeech";

export type SpeechAvailability = "ready" | "unsupported" | "speaking" | "error";

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
  const { speak, isSupported, isSpeaking, warmup, cancel, settingsKey } = useSpeech();
  const previousSettingsKey = useRef(settingsKey);

  useEffect(() => {
    if (previousSettingsKey.current === settingsKey) return;
    previousSettingsKey.current = settingsKey;
    setSpeechError("");
  }, [settingsKey]);

  useEffect(() => {
    trackEvent(
      isSupported ? ANALYTICS_EVENT_NAMES.speechSupported : ANALYTICS_EVENT_NAMES.speechUnsupported,
    );
  }, [isSupported]);

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
      trackEvent(ANALYTICS_EVENT_NAMES.speechUnsupported);
      return;
    }

    setSpeechError("");
    let failureReported = false;
    const reportFailure = (reason: "timeout" | "error") => {
      if (failureReported) return;
      failureReported = true;
      setSpeechError(buildSpeechError(reason));
      trackError(ANALYTICS_EVENT_NAMES.speechError, { reason });
    };
    const ok = speak(toSpeechText(nextSelections), {
      ...DEFAULT_NEWS_SPEECH_CONFIG,
      onError: reportFailure,
    });

    if (!ok && !isSpeaking) {
      reportFailure("error");
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
