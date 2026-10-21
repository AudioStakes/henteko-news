import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeakOptions, SpeechPhase } from "./useSpeech";

export const WEB_SPEECH_START_TIMEOUT_MS = 10_000;

function japaneseVoice(voices: SpeechSynthesisVoice[]) {
  const japanese = voices.filter((voice) => /^ja(?:[-_]|$)/i.test(voice.lang));
  return (
    japanese.find((voice) => voice.default) ??
    // macOS's alphabetically first Eddy voice can omit Japanese news phrases.
    japanese.find((voice) => /^Kyoko(?:\s*\(|$)/i.test(voice.name)) ??
    japanese.find((voice) => /^ja[-_]JP$/i.test(voice.lang)) ??
    japanese[0] ??
    null
  );
}

export function useWebSpeech() {
  const [phase, setPhase] = useState<SpeechPhase>("idle");
  const isSpeaking = phase !== "idle";
  const speakingRef = useRef(false);
  const requestIdRef = useRef(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const watchdogRef = useRef<number | null>(null);
  const speechWindow: { speechSynthesis?: SpeechSynthesis | null } | undefined =
    typeof window === "undefined" ? undefined : window;
  const synthesis = speechWindow?.speechSynthesis;
  const isSupported =
    synthesis !== undefined &&
    synthesis !== null &&
    typeof window.SpeechSynthesisUtterance === "function";

  const refreshVoices = useCallback(() => {
    if (!isSupported) {
      return;
    }
    try {
      voiceRef.current = japaneseVoice(synthesis.getVoices());
    } catch {
      // Some browsers expose voices only after speech has first been requested.
      voiceRef.current = null;
    }
  }, [isSupported, synthesis]);

  const cleanup = useCallback(
    (cancelPlayback: boolean) => {
      if (watchdogRef.current !== null) {
        window.clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
      if (utteranceRef.current) {
        utteranceRef.current.onstart = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current = null;
        if (cancelPlayback) {
          synthesis?.cancel();
        }
      }
      speakingRef.current = false;
    },
    [synthesis],
  );

  const cancel = useCallback(() => {
    requestIdRef.current += 1;
    cleanup(true);
    setPhase("idle");
  }, [cleanup]);

  useEffect(() => {
    if (!isSupported) {
      return;
    }
    refreshVoices();
    synthesis.addEventListener("voiceschanged", refreshVoices);
    return () => {
      synthesis.removeEventListener("voiceschanged", refreshVoices);
      requestIdRef.current += 1;
      cleanup(true);
    };
  }, [cleanup, isSupported, refreshVoices, synthesis]);

  const speak = useCallback(
    (text: string, options: SpeakOptions) => {
      if (
        !isSupported ||
        speakingRef.current ||
        synthesis.speaking ||
        synthesis.pending ||
        text.trim().length === 0
      ) {
        return false;
      }

      const requestId = ++requestIdRef.current;
      const finish = (reason?: "timeout" | "error") => {
        if (requestId !== requestIdRef.current) {
          return;
        }
        requestIdRef.current += 1;
        cleanup(reason !== undefined);
        setPhase("idle");
        if (reason !== undefined) {
          options.onError?.(reason);
        } else {
          options.onEnd?.();
        }
      };

      try {
        refreshVoices();
        const utterance = new window.SpeechSynthesisUtterance(text.trim());
        utterance.lang = "ja-JP";
        if (voiceRef.current) {
          utterance.voice = voiceRef.current;
        }
        utterance.rate = Number.isFinite(options.rate)
          ? Math.max(0.1, Math.min(10, options.rate))
          : 1;
        utterance.pitch = Number.isFinite(options.pitch)
          ? Math.max(0, Math.min(2, options.pitch))
          : 1;
        utteranceRef.current = utterance;
        speakingRef.current = true;
        setPhase("preparing");
        watchdogRef.current = window.setTimeout(() => {
          finish("timeout");
        }, WEB_SPEECH_START_TIMEOUT_MS);
        utterance.onstart = () => {
          if (requestId !== requestIdRef.current) {
            return;
          }
          setPhase("speaking");
          if (watchdogRef.current !== null) {
            window.clearTimeout(watchdogRef.current);
          }
          // Bound playback even when a browser never dispatches its end/error event.
          watchdogRef.current = window.setTimeout(
            () => {
              finish("timeout");
            },
            Math.max(WEB_SPEECH_START_TIMEOUT_MS, (text.length * 300) / utterance.rate + 10_000),
          );
        };
        utterance.onend = () => {
          finish();
        };
        utterance.onerror = () => {
          finish("error");
        };
        synthesis.speak(utterance);
        return true;
      } catch {
        finish("error");
        return false;
      }
    },
    [cleanup, isSupported, refreshVoices, synthesis],
  );

  return { isSupported, isSpeaking, phase, speak, warmup: refreshVoices, cancel };
}
