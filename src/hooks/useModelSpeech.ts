import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeechSettings } from "../utils/speechSettings";
import { DEFAULT_SPEECH_SETTINGS } from "../utils/speechSettings";
import {
  invalidateSupertonic,
  preloadSupertonic,
  synthesizeSupertonicSpeech,
} from "../utils/supertonic/supertonicClient";
import type { SpeakOptions, SpeechPhase } from "./useSpeech";

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
  const [phase, setPhase] = useState<SpeechPhase>("idle");
  const isSpeaking = phase !== "idle";
  const isSpeakingRef = useRef(false);
  const requestIdRef = useRef(0);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const startWatchdogRef = useRef<number | null>(null);
  const activeRevokeRef = useRef<(() => void) | null>(null);
  const invalidatePendingRef = useRef<(() => void) | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    typeof window.Audio !== "undefined" &&
    typeof window.fetch !== "undefined";

  const setSpeaking = useCallback((next: SpeechPhase) => {
    isSpeakingRef.current = next !== "idle";
    setPhase(next);
  }, []);

  const clearWatchdog = useCallback(() => {
    if (startWatchdogRef.current !== null) {
      window.clearTimeout(startWatchdogRef.current);
      startWatchdogRef.current = null;
    }
  }, []);

  const cleanupPlayback = useCallback(() => {
    clearWatchdog();
    if (activeAudioRef.current) {
      activeAudioRef.current.onended = null;
      activeAudioRef.current.onerror = null;
      activeAudioRef.current.onplaying = null;
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    activeRevokeRef.current?.();
    activeRevokeRef.current = null;
  }, [clearWatchdog]);

  const invalidatePending = useCallback(() => {
    invalidatePendingRef.current?.();
    invalidatePendingRef.current = null;
  }, []);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      invalidatePending();
      cleanupPlayback();
      isSpeakingRef.current = false;
    },
    [cleanupPlayback, invalidatePending],
  );

  const cancel = useCallback(() => {
    if (!isSupported) {
      return;
    }
    requestIdRef.current += 1;
    invalidatePending();
    cleanupPlayback();
    setSpeaking("idle");
  }, [cleanupPlayback, invalidatePending, isSupported, setSpeaking]);

  const warmup = useCallback(() => {
    if (!isSupported) {
      return;
    }
    // A missing model or a failed download must not create an unhandled rejection.
    // The client coalesces concurrent attempts and allows retry after failure.
    void preloadSupertonic({ modelBasePath, voiceStylePath }).catch(() => undefined);
  }, [isSupported, modelBasePath, voiceStylePath]);

  const speak = useCallback(
    (text: string, options: SpeakOptions) => {
      if (!isSupported || isSpeakingRef.current) {
        return false;
      }
      const parts = splitSpeechText(text);
      if (parts.length === 0) {
        return false;
      }

      requestIdRef.current += 1;
      const requestId = requestIdRef.current;
      setSpeaking("preparing");

      const fail = (reason: "timeout" | "error") => {
        if (requestId !== requestIdRef.current) {
          return;
        }
        requestIdRef.current += 1;
        invalidatePending();
        cleanupPlayback();
        setSpeaking("idle");
        options.onError?.(reason);
      };

      const playPart = async (index: number): Promise<void> => {
        if (requestId !== requestIdRef.current) {
          return;
        }
        const part = parts[index];
        if (part === undefined) {
          cleanupPlayback();
          requestIdRef.current += 1;
          setSpeaking("idle");
          options.onEnd?.();
          return;
        }

        try {
          cleanupPlayback();
          setSpeaking("preparing");
          startWatchdogRef.current = window.setTimeout(() => {
            fail("timeout");
          }, SYNTHESIS_TIMEOUT_MS);

          invalidatePendingRef.current = () => {
            invalidateSupertonic({ modelBasePath, voiceStylePath });
          };
          const result = await synthesizeSupertonicSpeech({
            text: part,
            speed: options.rate,
            modelBasePath,
            voiceStylePath,
          });
          if (requestId !== requestIdRef.current) {
            result.revoke();
            return;
          }
          invalidatePendingRef.current = null;
          clearWatchdog();

          const audio = new Audio(result.url);
          activeAudioRef.current = audio;
          activeRevokeRef.current = result.revoke;

          startWatchdogRef.current = window.setTimeout(() => {
            fail("timeout");
          }, PLAYBACK_START_TIMEOUT_MS);
          audio.onplaying = () => {
            if (requestId !== requestIdRef.current || activeAudioRef.current !== audio) {
              return;
            }
            setSpeaking("speaking");
            clearWatchdog();
            startWatchdogRef.current = window.setTimeout(
              () => {
                fail("timeout");
              },
              Math.max(PLAYBACK_START_TIMEOUT_MS, result.durationSec * 1000 + 10_000),
            );
          };

          audio.onended = () => {
            if (requestId !== requestIdRef.current || activeAudioRef.current !== audio) {
              return;
            }
            cleanupPlayback();
            playPart(index + 1).catch(() => {
              fail("error");
            });
          };
          audio.onerror = () => {
            if (activeAudioRef.current === audio) {
              fail("error");
            }
          };

          await audio.play();
        } catch {
          fail("error");
        }
      };

      playPart(0).catch(() => {
        fail("error");
      });
      return true;
    },
    [
      cleanupPlayback,
      clearWatchdog,
      invalidatePending,
      isSupported,
      setSpeaking,
      modelBasePath,
      voiceStylePath,
    ],
  );

  return { isSupported, isSpeaking, phase, speak, warmup, cancel };
}
