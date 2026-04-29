import { useCallback, useEffect, useRef, useState } from 'react';

type SpeakOptions = {
  rate: number;
  pitch: number;
  onEnd?: () => void;
};

const DEFAULT_LANG = 'ja-JP';

function pickJapaneseVoice(voices: SpeechSynthesisVoice[]) {
  return (
    voices.find((voice) => voice.lang === DEFAULT_LANG) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('ja')) ??
    null
  );
}

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const onEndRef = useRef<(() => void) | undefined>(undefined);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const speak = useCallback(
    (text: string, options: SpeakOptions) => {
      if (!isSupported) return false;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate;
      utterance.pitch = options.pitch;
      utterance.lang = DEFAULT_LANG;

      const jaVoice = pickJapaneseVoice(voices.length > 0 ? voices : window.speechSynthesis.getVoices());
      if (jaVoice) utterance.voice = jaVoice;

      onEndRef.current = options.onEnd;
      utterance.onend = () => onEndRef.current?.();
      utterance.onerror = () => onEndRef.current?.();

      window.speechSynthesis.speak(utterance);
      return true;
    },
    [isSupported, voices],
  );

  return {
    isSupported,
    speak,
    cancel: () => {
      if (isSupported) window.speechSynthesis.cancel();
    },
  };
}
