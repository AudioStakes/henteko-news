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
  pitch: 'high',
};

const PICK_DELAY_MS = 650;

function buildNewsLines(selections: Selections) {
  return [
    selections.who,
    selections.when,
    selections.where,
    selections.what,
    selections.action ? `${selections.action}！` : undefined,
  ].filter((word): word is string => Boolean(word));
}

function toSpeechText(lines: string[]) {
  const main = lines.map((line) => line.replace('！', '')).join('、');
  return `ニュースです！${main}しました！`;
}

function pickReaction() {
  return REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
}

function getVoiceConfig(sound: SoundSettings) {
  return {
    rate: sound.speed === 'slow' ? 0.8 : 0.9,
    pitch: sound.pitch === 'high' ? 1.25 : 1,
  };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Selections>({});
  const [pickedWord, setPickedWord] = useState('');
  const [reaction, setReaction] = useState('');
  const [soundSettings, setSoundSettings] = useLocalStorage<SoundSettings>('henteko-news-sound', INITIAL_SOUND);

  const { speak, isSupported } = useSpeech();

  const lines = useMemo(() => buildNewsLines(selections), [selections]);
  const speechText = useMemo(() => toSpeechText(lines), [lines]);

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
