import { useCallback, useEffect, useRef, useState } from "react";

type SpeakOptions = {
  rate: number;
  pitch: number;
  onEnd?: () => void;
  onError?: (reason: "timeout" | "error") => void;
};

const DEFAULT_LANG = "ja-JP";
const DEBUG_SPEECH = import.meta.env.DEV;
const START_WATCHDOG_TIMEOUT_MS = 1500;
const speechWarmupState = { warmed: false };

function splitSpeechText(text: string) {
  return text
    .split(/[、。！!？?]/)
    .map((part) => part.trim())
    .filter(Boolean);
}
function pickJapaneseVoice(voices: SpeechSynthesisVoice[]) {
  return (
    voices.find((voice) => voice.lang === DEFAULT_LANG) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("ja")) ??
    null
  );
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const requestIdRef = useRef(0);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startWatchdogRef = useRef<number | null>(null);
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const isSupported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  useEffect(() => {
    if (!isSupported) return;
    const loadVoices = () =>
      (preferredVoiceRef.current = pickJapaneseVoice(window.speechSynthesis.getVoices()));
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      if (startWatchdogRef.current !== null) window.clearTimeout(startWatchdogRef.current);
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    requestIdRef.current += 1;
    activeUtteranceRef.current = null;
    setIsSpeaking(false);
    if (startWatchdogRef.current !== null) window.clearTimeout(startWatchdogRef.current);
    startWatchdogRef.current = null;
    window.speechSynthesis.cancel();
  }, [isSupported]);

  const warmup = useCallback(() => {
    if (!isSupported || speechWarmupState.warmed) return;
    speechWarmupState.warmed = true;
    try {
      const utterance = new SpeechSynthesisUtterance("。");
      utterance.lang = DEFAULT_LANG;
      utterance.voice = preferredVoiceRef.current;
      utterance.volume = 0.01;
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }, [isSupported]);

  const speak = useCallback(
    (text: string, options: SpeakOptions) => {
      if (!isSupported || isSpeaking) return false;
      try {
        requestIdRef.current += 1;
        const requestId = requestIdRef.current;
        const parts = splitSpeechText(text);
        let index = 0;
        setIsSpeaking(true);
        const speakNext = () => {
          if (requestId !== requestIdRef.current) return;
          if (index >= parts.length) {
            activeUtteranceRef.current = null;
            setIsSpeaking(false);
            options.onEnd?.();
            return;
          }
          const utterance = new SpeechSynthesisUtterance(parts[index]);
          activeUtteranceRef.current = utterance;
          utterance.rate = options.rate;
          utterance.pitch = options.pitch;
          utterance.lang = DEFAULT_LANG;
          utterance.voice = preferredVoiceRef.current;
          utterance.volume = 1;
          if (startWatchdogRef.current !== null) window.clearTimeout(startWatchdogRef.current);
          startWatchdogRef.current = window.setTimeout(() => {
            if (requestId !== requestIdRef.current || activeUtteranceRef.current !== utterance)
              return;
            activeUtteranceRef.current = null;
            setIsSpeaking(false);
            window.speechSynthesis.cancel();
            options.onError?.("timeout");
          }, START_WATCHDOG_TIMEOUT_MS);
          utterance.onstart = () => {
            if (startWatchdogRef.current !== null) window.clearTimeout(startWatchdogRef.current);
            startWatchdogRef.current = null;
          };
          utterance.onend = () => {
            if (requestId !== requestIdRef.current) return;
            if (startWatchdogRef.current !== null) window.clearTimeout(startWatchdogRef.current);
            startWatchdogRef.current = null;
            index += 1;
            speakNext();
          };
          utterance.onerror = () => {
            activeUtteranceRef.current = null;
            setIsSpeaking(false);
            if (startWatchdogRef.current !== null) window.clearTimeout(startWatchdogRef.current);
            startWatchdogRef.current = null;
            options.onError?.("error");
          };
          window.speechSynthesis.resume();
          if (DEBUG_SPEECH) void 0;
          window.speechSynthesis.speak(utterance);
        };
        speakNext();
        return true;
      } catch {
        setIsSpeaking(false);
        return false;
      }
    },
    [isSupported, isSpeaking],
  );

  return { isSupported, isSpeaking, speak, warmup, cancel };
}
