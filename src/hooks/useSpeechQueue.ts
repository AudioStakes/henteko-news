import { useRef, useState } from "react";
import { DEFAULT_NEWS_SPEECH_CONFIG } from "../constants/speech";
import { useSpeech } from "./useSpeech";

type Options = { onComplete?: () => void; onError?: (message: string) => void };

const ERR_UNSUPPORTED = "このブラウザでは よみあげが つかえません。";
const ERR_PLAYBACK = "よみあげが とちゅうで とまりました。もういちど はじめてください。";

export function useSpeechQueue(items: string[], options: Options = {}) {
  const { speak, cancel, isSupported } = useSpeech();
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");
  const queueIdRef = useRef(0);
  const isPlayingRef = useRef(false);

  const stop = () => {
    queueIdRef.current += 1;
    isPlayingRef.current = false;
    cancel();
    setIsPlaying(false);
    setCurrentIndex(-1);
  };

  const failQueue = (queueId: number, message: string) => {
    if (queueId !== queueIdRef.current) return;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setError(message);
    options.onError?.(message);
  };

  const start = (startIndex: number) => {
    if (!isSupported) {
      setError(ERR_UNSUPPORTED);
      options.onError?.(ERR_UNSUPPORTED);
      return false;
    }
    const safeStartIndex = Math.max(0, Math.min(startIndex, Math.max(items.length - 1, 0)));
    stop();
    const queueId = queueIdRef.current;
    setError("");
    isPlayingRef.current = true;
    setIsPlaying(true);

    const next = (idx: number) => {
      if (!isPlayingRef.current || queueId !== queueIdRef.current) return;
      if (idx >= items.length) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        setCurrentIndex(items.length - 1);
        options.onComplete?.();
        return;
      }
      setCurrentIndex(idx);
      const ok = speak(items[idx], {
        ...DEFAULT_NEWS_SPEECH_CONFIG,
        onEnd: () => next(idx + 1),
        onError: () => failQueue(queueId, ERR_PLAYBACK),
      });
      if (!ok) failQueue(queueId, ERR_PLAYBACK);
    };

    if (items.length === 0) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setCurrentIndex(-1);
      options.onComplete?.();
      return true;
    }

    next(safeStartIndex);
    return true;
  };

  return { start, stop, currentIndex, isPlaying, error, isSupported };
}
