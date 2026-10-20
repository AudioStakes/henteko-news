import { useEffect, useRef, useState } from "react";
import { DEFAULT_NEWS_SPEECH_CONFIG } from "../constants/speech";
import { useSpeech } from "./useSpeech";

type Options = { onComplete?: () => void; onError?: (message: string) => void };

const ERR_UNSUPPORTED = "このブラウザでは よみあげが つかえません。";
const ERR_PLAYBACK = "よみあげが とちゅうで とまりました。もういちど はじめてください。";

export function useSpeechQueue(items: string[], options: Options = {}) {
  const { speak, cancel, isSupported, settingsKey } = useSpeech();
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");
  const queueIdRef = useRef(0);
  const isPlayingRef = useRef(false);
  const resumeIndexRef = useRef(0);
  const previousSettingsKey = useRef(settingsKey);

  useEffect(() => {
    if (previousSettingsKey.current === settingsKey) {
      return;
    }
    previousSettingsKey.current = settingsKey;
    queueIdRef.current += 1;
    isPlayingRef.current = false;
    resumeIndexRef.current = 0;
    setIsPlaying(false);
    setCurrentIndex(-1);
    setError("");
  }, [settingsKey]);

  useEffect(
    () => () => {
      queueIdRef.current += 1;
      isPlayingRef.current = false;
      cancel();
    },
    [cancel],
  );

  const stop = () => {
    queueIdRef.current += 1;
    isPlayingRef.current = false;
    cancel();
    setIsPlaying(false);
    setCurrentIndex(-1);
  };

  const failQueue = (queueId: number, message: string) => {
    if (queueId !== queueIdRef.current || !isPlayingRef.current) {
      return;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
    setError(message);
    options.onError?.(message);
  };

  const start = (startIndex: number) => {
    if (isPlayingRef.current || !Number.isFinite(startIndex)) {
      return false;
    }
    if (!isSupported) {
      setError(ERR_UNSUPPORTED);
      options.onError?.(ERR_UNSUPPORTED);
      return false;
    }
    const safeStartIndex = Math.max(
      0,
      Math.min(Math.floor(startIndex), Math.max(items.length - 1, 0)),
    );
    stop();
    const queueId = queueIdRef.current;
    setError("");
    isPlayingRef.current = true;
    setIsPlaying(true);

    const next = (idx: number) => {
      if (!isPlayingRef.current || queueId !== queueIdRef.current) {
        return;
      }
      const item = items[idx];
      if (item === undefined) {
        isPlayingRef.current = false;
        resumeIndexRef.current = 0;
        setIsPlaying(false);
        setCurrentIndex(items.length - 1);
        options.onComplete?.();
        return;
      }
      resumeIndexRef.current = idx;
      setCurrentIndex(idx);
      const completion = { settled: false };
      const ok = speak(item, {
        ...DEFAULT_NEWS_SPEECH_CONFIG,
        onEnd: () => {
          if (completion.settled) {
            return;
          }
          completion.settled = true;
          next(idx + 1);
        },
        onError: () => {
          if (completion.settled) {
            return;
          }
          completion.settled = true;
          failQueue(queueId, ERR_PLAYBACK);
        },
      });
      if (!(ok || completion.settled)) {
        completion.settled = true;
        failQueue(queueId, ERR_PLAYBACK);
      }
    };

    if (items.length === 0) {
      isPlayingRef.current = false;
      resumeIndexRef.current = 0;
      setIsPlaying(false);
      setCurrentIndex(-1);
      options.onComplete?.();
      return true;
    }

    next(safeStartIndex);
    return true;
  };

  const resume = () => start(resumeIndexRef.current);

  return { start, resume, stop, currentIndex, isPlaying, error, isSupported };
}
