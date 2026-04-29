import { useEffect, useMemo, useState } from 'react';
import { PickedScreen } from './components/PickedScreen';
import { ResultScreen } from './components/ResultScreen';
import { SoundScreen } from './components/SoundScreen';
import { StartScreen } from './components/StartScreen';
import { WordSelectScreen } from './components/WordSelectScreen';
import { CATEGORIES, REACTIONS } from './data/words';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSpeech } from './hooks/useSpeech';
import type { Selections, SoundSettings } from './types/game';

type Screen = 'start' | 'sound' | 'select' | 'picked' | 'result';

const INITIAL_SOUND: SoundSettings = {
  enabled: true,
  speed: 'normal',
  pitch: 'normal',
};

const PICK_DELAY_MS = 650;

const ACTION_POLITE_MAP: Record<string, string> = {
  たべた: 'たべました',
  ふっとばした: 'ふっとばしました',
  かくした: 'かくしました',
  おどらせた: 'おどらせました',
  こちょこちょした: 'こちょこちょしました',
  ころがした: 'ころがしました',
  'ぎゅーした': 'ぎゅーしました',
  もってかえった: 'もってかえりました',
};

function buildNewsLines(selections: Selections) {
  return [
    selections.who,
    selections.when,
    selections.where,
    selections.what,
    selections.action ? `${selections.action}！` : undefined,
  ].filter((word): word is string => Boolean(word));
}

function toPoliteAction(action?: string) {
  if (!action) return '';
  const normalized = action.replace(/[！!]/g, '').trim();

  if (!normalized) return '';
  if (normalized.endsWith('しました') || normalized.endsWith('ました')) {
    return normalized;
  }

  if (ACTION_POLITE_MAP[normalized]) {
    return ACTION_POLITE_MAP[normalized];
  }

  if (normalized.endsWith('した')) {
    return `${normalized.slice(0, -2)}しました`;
  }

  return normalized;
}

function toSpeechText(selections: Selections) {
  const parts = [
    selections.who,
    selections.when,
    selections.where,
    selections.what,
    toPoliteAction(selections.action),
  ].filter((word): word is string => Boolean(word));

  return parts.length > 0 ? `ニュースです！${parts.join('、')}！` : 'ニュースです！';
}

function pickReaction() {
  return REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
}

function normalizeSoundSettings(sound: SoundSettings): SoundSettings {
  const speed = sound.speed === 'slow' || sound.speed === 'normal' || sound.speed === 'fast' ? sound.speed : 'normal';
  const pitch = sound.pitch === 'low' || sound.pitch === 'normal' || sound.pitch === 'high' ? sound.pitch : 'normal';

  return {
    enabled: Boolean(sound.enabled),
    speed,
    pitch,
  };
}

function getVoiceConfig(sound: SoundSettings) {
  const rate = sound.speed === 'slow' ? 0.75 : sound.speed === 'fast' ? 1.1 : 0.9;
  const pitch = sound.pitch === 'low' ? 0.85 : sound.pitch === 'high' ? 1.25 : 1.0;

  return { rate, pitch };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Selections>({});
  const [pickedWord, setPickedWord] = useState('');
  const [reaction, setReaction] = useState('');
  const [soundSettings, setSoundSettings] = useLocalStorage<SoundSettings>('henteko-news-sound', INITIAL_SOUND);

  useEffect(() => {
    const normalized = normalizeSoundSettings(soundSettings);
    if (
      normalized.enabled !== soundSettings.enabled ||
      normalized.speed !== soundSettings.speed ||
      normalized.pitch !== soundSettings.pitch
    ) {
      setSoundSettings(normalized);
    }
  }, [soundSettings, setSoundSettings]);

  const { speak, isSupported } = useSpeech();

  const lines = useMemo(() => buildNewsLines(selections), [selections]);
  const speechText = useMemo(() => toSpeechText(selections), [selections]);

  const startGame = () => {
    setSelections({});
    setStep(0);
    setScreen('select');
    setReaction('');
  };

  const handleSelectWord = (word: string) => {
    const category = CATEGORIES[step];
    setSelections((prev) => ({ ...prev, [category.key]: word }));
    setPickedWord(word);
    setScreen('picked');

    window.setTimeout(() => {
      if (step === CATEGORIES.length - 1) {
        setScreen('result');
      } else {
        setStep((prev) => prev + 1);
        setScreen('select');
      }
    }, PICK_DELAY_MS);
  };

  const speakNews = () => {
    if (!soundSettings.enabled || lines.length !== 5) return;
    const { rate, pitch } = getVoiceConfig(soundSettings);
    const ok = speak(speechText, {
      rate,
      pitch,
      onEnd: () => setReaction(pickReaction()),
    });

    if (!ok) {
      setReaction('おとがつかえないけど、ニュースはバッチリ！');
    }
  };

  useEffect(() => {
    if (screen === 'result' && soundSettings.enabled) {
      speakNews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  if (screen === 'start') {
    return <StartScreen onStart={startGame} onOpenSound={() => setScreen('sound')} />;
  }

  if (screen === 'sound') {
    return <SoundScreen settings={soundSettings} onUpdate={setSoundSettings} onBack={() => setScreen('start')} />;
  }

  if (screen === 'select') {
    return <WordSelectScreen category={CATEGORIES[step]} onSelect={handleSelectWord} />;
  }

  if (screen === 'picked') {
    return <PickedScreen word={pickedWord} />;
  }

  return (
    <ResultScreen
      lines={lines}
      reaction={reaction || (isSupported ? 'よみあげちゅう…' : 'おとはつかえないけど、たのしい！')}
      onReplayVoice={speakNews}
      onRestartGame={startGame}
      onGoHome={() => setScreen('start')}
    />
  );
}
