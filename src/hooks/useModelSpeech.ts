import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeechSettings } from "../utils/speechSettings";
import { DEFAULT_SPEECH_SETTINGS } from "../utils/speechSettings";
import {
  preloadSupertonic,
  synthesizeSupertonicSpeech,
} from "../utils/supertonic/supertonicClient";
import type { SpeakOptions } from "./useSpeech";

export const SYNTHESIS_TIMEOUT_MS = 60_000;
const PLAYBACK_START_TIMEOUT_MS = 10_000;

function splitSpeechText(text: string) {
  return text
    .split(/[、。！!？?]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function useModelSpeech(settings: SpeechSettings = DEFAULT_SPEECH_SETTINGS) {
  const { modelBasePath, voiceStylePath } = settings;
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
      activeAudioRef.current.onplaying = null;
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
    if (!isSupported) return;
    // A missing model or a failed download must not create an unhandled rejection.
    // The client coalesces concurrent attempts and allows retry after failure.
    void preloadSupertonic({ modelBasePath, voiceStylePath }).catch(() => undefined);
  }, [isSupported, modelBasePath, voiceStylePath]);

  const speak = useCallback(
    (text: string, options: SpeakOptions) => {
      if (!isSupported || isSpeakingRef.current) return false;
      const parts = splitSpeechText(text);
      if (parts.length === 0) return false;

      requestIdRef.current += 1;
      const requestId = requestIdRef.current;
      setSpeaking(true);

      const fail = (reason: "timeout" | "error") => {
        if (requestId !== requestIdRef.current) return;
        requestIdRef.current += 1;
        cleanupPlayback();
        setSpeaking(false);
        options.onError?.(reason);
      };

      const playPart = async (index: number): Promise<void> => {
        if (requestId !== requestIdRef.current) return;
        if (index >= parts.length) {
          cleanupPlayback();
          requestIdRef.current += 1;
          setSpeaking(false);
          options.onEnd?.();
          return;
        }

        try {
          cleanupPlayback();
          startWatchdogRef.current = window.setTimeout(() => fail("timeout"), SYNTHESIS_TIMEOUT_MS);

          const result = await synthesizeSupertonicSpeech({
            text: parts[index],
            speed: options.rate,
            modelBasePath,
            voiceStylePath,
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

          startWatchdogRef.current = window.setTimeout(
            () => fail("timeout"),
            PLAYBACK_START_TIMEOUT_MS,
          );
          audio.onplaying = () => {
            if (requestId !== requestIdRef.current) return;
            if (startWatchdogRef.current !== null) window.clearTimeout(startWatchdogRef.current);
            startWatchdogRef.current = window.setTimeout(
              () => fail("timeout"),
              Math.max(PLAYBACK_START_TIMEOUT_MS, result.durationSec * 1000 + 10_000),
            );
          };

          audio.onended = () => {
            if (requestId !== requestIdRef.current) return;
            cleanupPlayback();
            void playPart(index + 1);
          };
          audio.onerror = () => fail("error");

          await audio.play();
        } catch {
          fail("error");
        }
      };

      void playPart(0);
      return true;
    },
    [cleanupPlayback, isSupported, setSpeaking, modelBasePath, voiceStylePath],
  );

  return { isSupported, isSpeaking, speak, warmup, cancel };
}
