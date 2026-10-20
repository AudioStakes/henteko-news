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
  const { speak, isSupported, isSpeaking, warmup, cancel: cancelSpeech, settingsKey } = useSpeech();
  const previousSettingsKey = useRef(settingsKey);
  const requestIdRef = useRef(0);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      busyRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (previousSettingsKey.current === settingsKey) {
      return;
    }
    previousSettingsKey.current = settingsKey;
    requestIdRef.current += 1;
    busyRef.current = false;
    setSpeechError("");
  }, [settingsKey]);

  useEffect(() => {
    trackEvent(
      isSupported ? ANALYTICS_EVENT_NAMES.speechSupported : ANALYTICS_EVENT_NAMES.speechUnsupported,
    );
  }, [isSupported]);

  const speechAvailability: SpeechAvailability = useMemo(() => {
    if (!isSupported) {
      return "unsupported";
    }
    if (isSpeaking) {
      return "speaking";
    }
    if (speechError.length > 0) {
      return "error";
    }
    return "ready";
  }, [isSupported, isSpeaking, speechError]);

  const cancel = () => {
    requestIdRef.current += 1;
    busyRef.current = false;
    cancelSpeech();
  };

  const speakNews = (nextSelections: Selections): boolean => {
    if (
      !mountedRef.current ||
      busyRef.current ||
      buildNewsLines(nextSelections).length !== CATEGORIES.length
    ) {
      return false;
    }

    if (!isSupported) {
      setSpeechError(buildSpeechError("unsupported"));
      trackEvent(ANALYTICS_EVENT_NAMES.speechUnsupported);
      return false;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    busyRef.current = true;
    setSpeechError("");
    let failureReported = false;
    const reportFailure = (reason: "timeout" | "error") => {
      if (requestId !== requestIdRef.current || !busyRef.current) {
        return;
      }
      failureReported = true;
      busyRef.current = false;
      setSpeechError(buildSpeechError(reason));
      trackError(ANALYTICS_EVENT_NAMES.speechError, { reason });
    };
    const ok = speak(toSpeechText(nextSelections), {
      ...DEFAULT_NEWS_SPEECH_CONFIG,
      onEnd: () => {
        if (requestId === requestIdRef.current) {
          busyRef.current = false;
        }
      },
      onError: reportFailure,
    });

    if (!(ok || isSpeaking)) {
      reportFailure("error");
    } else if (!ok && requestId === requestIdRef.current) {
      busyRef.current = false;
    }
    return ok && !failureReported;
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
