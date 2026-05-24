import { useCallback, useEffect, useRef, useState } from "react";
import {
  preloadSupertonic,
  synthesizeSupertonicSpeech,
} from "../utils/supertonic/supertonicClient";

type SpeakOptions = {
  rate: number;
  pitch: number;
  onEnd?: () => void;
  onError?: (reason: "timeout" | "error") => void;
};

const START_WATCHDOG_TIMEOUT_MS = 1500;
const speechWarmupState = { warmed: false };

function splitSpeechText(text: string) {
  return text
    .split(/[、。！!？?]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  const requestIdRef = useRef(0);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const startWatchdogRef = useRef<number | null>(null);
  const activeRevokeRef = useRef<(() => void) | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    typeof window.Audio !== "undefined" &&
    typeof window.fetch !== "undefined";

  const setSpeaking = useCallback((next: boolean) => {
    isSpeakingRef.current = next;
    setIsSpeaking(next);
  }, []);

  const cleanupPlayback = useCallback(() => {
    if (startWatchdogRef.current !== null) {
      window.clearTimeout(startWatchdogRef.current);
      startWatchdogRef.current = null;
    }
    if (activeAudioRef.current) {
      activeAudioRef.current.onended = null;
      activeAudioRef.current.onerror = null;
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    activeRevokeRef.current?.();
    activeRevokeRef.current = null;
  }, []);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      cleanupPlayback();
      isSpeakingRef.current = false;
    },
    [cleanupPlayback],
  );

  const cancel = useCallback(() => {
    if (!isSupported) return;
    requestIdRef.current += 1;
    cleanupPlayback();
    setSpeaking(false);
  }, [cleanupPlayback, isSupported, setSpeaking]);

  const warmup = useCallback(() => {
    if (!isSupported || speechWarmupState.warmed) return;
    speechWarmupState.warmed = true;
    void preloadSupertonic();
  }, [isSupported]);

  const speak = useCallback(
    (text: string, options: SpeakOptions) => {
      if (!isSupported || isSpeakingRef.current) return false;
      const parts = splitSpeechText(text);
      if (parts.length === 0) return false;

      requestIdRef.current += 1;
      const requestId = requestIdRef.current;
      setSpeaking(true);

      const playPart = async (index: number): Promise<void> => {
        if (requestId !== requestIdRef.current) return;
        if (index >= parts.length) {
          cleanupPlayback();
          setSpeaking(false);
          options.onEnd?.();
          return;
        }

        try {
          cleanupPlayback();
          if (startWatchdogRef.current !== null) window.clearTimeout(startWatchdogRef.current);
          startWatchdogRef.current = window.setTimeout(() => {
            if (requestId !== requestIdRef.current) return;
            cleanupPlayback();
            setSpeaking(false);
            options.onError?.("timeout");
          }, START_WATCHDOG_TIMEOUT_MS);

          const result = await synthesizeSupertonicSpeech({
            text: parts[index],
            speed: options.rate,
          });
          if (requestId !== requestIdRef.current) {
            result.revoke();
            return;
          }
          if (startWatchdogRef.current !== null) {
            window.clearTimeout(startWatchdogRef.current);
            startWatchdogRef.current = null;
          }

          const audio = new Audio(result.url);
          activeAudioRef.current = audio;
          activeRevokeRef.current = result.revoke;

          audio.onended = () => {
            if (requestId !== requestIdRef.current) return;
            cleanupPlayback();
            void playPart(index + 1);
          };
          audio.onerror = () => {
            if (requestId !== requestIdRef.current) return;
            cleanupPlayback();
            setSpeaking(false);
            options.onError?.("error");
          };

          await audio.play();
        } catch {
          if (requestId !== requestIdRef.current) return;
          cleanupPlayback();
          setSpeaking(false);
          options.onError?.("error");
        }
      };

      void playPart(0);
      return true;
    },
    [cleanupPlayback, isSupported, setSpeaking],
  );

  return { isSupported, isSpeaking, speak, warmup, cancel };
}
