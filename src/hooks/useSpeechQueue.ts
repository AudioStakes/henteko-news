import { useState } from "react";
import { useSpeech } from "./useSpeech";

type Options = { onComplete?: () => void; onError?: (message: string) => void };

export function useSpeechQueue(items: string[], options: Options = {}) {
  const { speak, cancel, isSupported } = useSpeech();
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");

  const stop = () => {
    cancel();
    setIsPlaying(false);
    setCurrentIndex(-1);
  };
  const start = (startIndex: number) => {
    if (!isSupported) {
      const m = "このブラウザでは よみあげが つかえません。";
      setError(m);
      options.onError?.(m);
      return false;
    }
    stop();
    setError("");
    setIsPlaying(true);
    const next = (idx: number) => {
      if (idx >= items.length) {
        setIsPlaying(false);
        setCurrentIndex(items.length - 1);
        options.onComplete?.();
        return;
      }
      setCurrentIndex(idx);
      const ok = speak(items[idx], {
        rate: 0.9,
        pitch: 1,
        onEnd: () => next(idx + 1),
        onError: () => {
          const m = "よみあげが とちゅうで とまりました。もういちど はじめてください。";
          setIsPlaying(false);
          setError(m);
          options.onError?.(m);
        },
      });
      if (!ok) {
        const m = "よみあげが とちゅうで とまりました。もういちど はじめてください。";
        setIsPlaying(false);
        setError(m);
        options.onError?.(m);
      }
    };
    next(startIndex);
    return true;
  };

  return { start, stop, currentIndex, isPlaying, error, isSupported };
}
