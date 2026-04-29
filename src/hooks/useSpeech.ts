import { useCallback, useEffect, useRef, useState } from 'react';

type SpeakOptions = {
  rate: number;
  pitch: number;
  onEnd?: () => void;
};

const DEFAULT_LANG = 'ja-JP';

let speechWarmedUp = false;
let cachedJapaneseVoice: SpeechSynthesisVoice | null = null;

function pickJapaneseVoice(voices: SpeechSynthesisVoice[]) {
  cachedJapaneseVoice =
    voices.find((voice) => voice.lang === DEFAULT_LANG) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('ja')) ??
    null;

  return cachedJapaneseVoice;
}

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const onEndRef = useRef<(() => void) | undefined>(undefined);

  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const loaded = window.speechSynthesis.getVoices();
      setVoices(loaded);
      pickJapaneseVoice(loaded);
    };

    loadVoices();
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const warmup = useCallback(() => {
    if (!isSupported || speechWarmedUp) return;

    speechWarmedUp = true;
    try {
      window.speechSynthesis.cancel();
      const loaded = window.speechSynthesis.getVoices();
      if (loaded.length > 0) pickJapaneseVoice(loaded);

      const utterance = new SpeechSynthesisUtterance('。');
      utterance.lang = DEFAULT_LANG;
      utterance.volume = 0.01;
      utterance.rate = 1;
      utterance.pitch = 1;
      if (cachedJapaneseVoice) utterance.voice = cachedJapaneseVoice;
      window.speechSynthesis.speak(utterance);
    } catch {
      // 読み上げに失敗してもアプリを壊さない
    }
  }, [isSupported]);

  const speak = useCallback(
    (text: string, options: SpeakOptions) => {
      if (!isSupported) return false;

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate;
        utterance.pitch = options.pitch;
        utterance.lang = DEFAULT_LANG;

        const fallbackVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
        const jaVoice = cachedJapaneseVoice ?? pickJapaneseVoice(fallbackVoices);
        if (jaVoice) utterance.voice = jaVoice;

        onEndRef.current = options.onEnd;
        utterance.onend = () => onEndRef.current?.();
        utterance.onerror = () => onEndRef.current?.();

        window.speechSynthesis.speak(utterance);
        return true;
      } catch {
        return false;
      }
    },
    [isSupported, voices],
  );

  return {
    isSupported,
    speak,
    warmup,
    cancel: () => {
      if (isSupported) window.speechSynthesis.cancel();
    },
  };
}
