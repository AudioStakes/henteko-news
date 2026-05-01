import { useCallback, useEffect, useRef } from 'react';

type SpeakOptions = {
  rate: number;
  pitch: number;
  onEnd?: () => void;
  onError?: (reason: 'timeout' | 'error') => void;
};

const DEFAULT_LANG = 'ja-JP';

let speechWarmedUp = false;

function splitSpeechText(text: string) {
  return text
    .split(/[、。！!？?]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function logSpeechState(label: string) {
  const synth = window.speechSynthesis;
  const voices = synth.getVoices().map((voice) => ({
    name: voice.name,
    lang: voice.lang,
    default: voice.default,
    localService: voice.localService,
  }));

  console.log(`[speech] ${label}`, {
    speaking: synth.speaking,
    pending: synth.pending,
    paused: synth.paused,
    voiceCount: voices.length,
    voices,
    visibilityState: document.visibilityState,
    hasFocus: document.hasFocus(),
  });
}

export function useSpeech() {
  const onEndRef = useRef<(() => void) | undefined>(undefined);
  const requestIdRef = useRef(0);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeakingRef = useRef(false);
  const startWatchdogRef = useRef<number | null>(null);

  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };

    loadVoices();
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      if (startWatchdogRef.current !== null) {
        window.clearTimeout(startWatchdogRef.current);
      }
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const warmup = useCallback(() => {
    if (!isSupported || speechWarmedUp) return;

    speechWarmedUp = true;
    try {
      logSpeechState('warmup-before');
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance('。');
      utterance.lang = DEFAULT_LANG;
      utterance.volume = 0.01;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onstart = () => logSpeechState('warmup-onstart');
      utterance.onend = () => logSpeechState('warmup-onend');
      utterance.onerror = (event) => {
        console.error('speechSynthesis warmup error', {
          error: event.error,
          charIndex: event.charIndex,
          elapsedTime: event.elapsedTime,
        });
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      // 読み上げに失敗してもアプリを壊さない
    }
  }, [isSupported]);

  const speak = useCallback(
    (text: string, options: SpeakOptions) => {
      if (!isSupported) return false;
      if (isSpeakingRef.current) return false;

      try {
        requestIdRef.current += 1;
        const requestId = requestIdRef.current;
        onEndRef.current = options.onEnd;
        const parts = splitSpeechText(text);
        logSpeechState('speak-before');
        let index = 0;

        const speakNext = () => {
          if (requestId !== requestIdRef.current) return;
          if (index >= parts.length) {
            activeUtteranceRef.current = null;
            isSpeakingRef.current = false;
            onEndRef.current?.();
            return;
          }

          const utterance = new SpeechSynthesisUtterance(parts[index]);
          activeUtteranceRef.current = utterance;
          isSpeakingRef.current = true;
          utterance.rate = options.rate;
          utterance.pitch = options.pitch;
          utterance.lang = DEFAULT_LANG;
          utterance.volume = 1;

          if (startWatchdogRef.current !== null) {
            window.clearTimeout(startWatchdogRef.current);
          }
          startWatchdogRef.current = window.setTimeout(() => {
            if (requestId !== requestIdRef.current) return;
            if (activeUtteranceRef.current !== utterance) return;
            console.warn('speechSynthesis start timeout', { text: parts[index] });
            activeUtteranceRef.current = null;
            isSpeakingRef.current = false;
            window.speechSynthesis.cancel();
            options.onError?.('timeout');
          }, 1500);

          utterance.onstart = () => {
            logSpeechState(`utterance-onstart-${index}`);
            if (startWatchdogRef.current !== null) {
              window.clearTimeout(startWatchdogRef.current);
              startWatchdogRef.current = null;
            }
          };

          utterance.onend = () => {
            logSpeechState(`utterance-onend-${index}`);
            if (requestId !== requestIdRef.current) return;
            if (startWatchdogRef.current !== null) {
              window.clearTimeout(startWatchdogRef.current);
              startWatchdogRef.current = null;
            }
            index += 1;
            speakNext();
          };
          utterance.onerror = (event) => {
            activeUtteranceRef.current = null;
            isSpeakingRef.current = false;
            if (startWatchdogRef.current !== null) {
              window.clearTimeout(startWatchdogRef.current);
              startWatchdogRef.current = null;
            }
            console.error('speechSynthesis error', {
              error: event.error,
              charIndex: event.charIndex,
              elapsedTime: event.elapsedTime,
              text: parts[index],
            });
            logSpeechState(`utterance-onerror-${index}`);
            options.onError?.('error');
          };

          window.speechSynthesis.resume();
          logSpeechState(`speak-call-${index}`);
          window.speechSynthesis.speak(utterance);
        };
        speakNext();

        return true;
      } catch {
        isSpeakingRef.current = false;
        return false;
      }
    },
    [isSupported],
  );

  return {
    isSupported,
    speak,
    warmup,
    cancel: () => {
      if (!isSupported) return;
      requestIdRef.current += 1;
      activeUtteranceRef.current = null;
      isSpeakingRef.current = false;
      if (startWatchdogRef.current !== null) {
        window.clearTimeout(startWatchdogRef.current);
        startWatchdogRef.current = null;
      }
      window.speechSynthesis.cancel();
    },
  };
}
