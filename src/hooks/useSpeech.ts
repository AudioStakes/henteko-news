import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SpeakOptions = {
  rate: number;
  pitch: number;
  onEnd?: () => void;
};

const DEFAULT_LANG = 'ja-JP';

export function useSpeech() {
  const [voicesReady, setVoicesReady] = useState(false);
  const onEndRef = useRef<(() => void) | undefined>(undefined);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      window.speechSynthesis.getVoices();
      setVoicesReady(true);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const jaVoice = useMemo(() => {
    if (!isSupported || !voicesReady) return null;
    const voices = window.speechSynthesis.getVoices();
    return voices.find((voice) => voice.lang.toLowerCase().startsWith('ja')) ?? null;
  }, [isSupported, voicesReady]);

  const speak = useCallback(
    (text: string, options: SpeakOptions) => {
      if (!isSupported) return false;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate;
      utterance.pitch = options.pitch;
      utterance.lang = jaVoice?.lang ?? DEFAULT_LANG;
      if (jaVoice) {
        utterance.voice = jaVoice;
      }

      onEndRef.current = options.onEnd;
      utterance.onend = () => onEndRef.current?.();
      utterance.onerror = () => onEndRef.current?.();

      window.speechSynthesis.speak(utterance);
      return true;
    },
    [isSupported, jaVoice],
  );

  return {
    isSupported,
    speak,
    cancel: () => {
      if (isSupported) window.speechSynthesis.cancel();
    },
  };
}
