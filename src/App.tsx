import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { ResultScreen } from './components/ResultScreen';
import { SoundScreen } from './components/SoundScreen';
import { StartScreen } from './components/StartScreen';
import { WordSelectScreen } from './components/WordSelectScreen';
import { CATEGORIES, REACTIONS } from './data/words';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSpeech } from './hooks/useSpeech';
import { buildNewsLines, toSpeechText } from './utils/speechText';
import type { Selections, SoundSettings } from './types/game';

type Screen = 'start' | 'sound' | 'select' | 'result';

const INITIAL_SOUND: SoundSettings = {
  enabled: true,
  speed: 'normal',
  pitch: 'normal',
};

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
    if (step === CATEGORIES.length - 1) {
      setScreen('result');
    } else {
      setStep((prev) => prev + 1);
    }
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

  return (
    <div className="viewport">
      <main className="app-shell">
        <AppHeader />
        {screen === 'start' && <StartScreen onStart={startGame} onOpenSound={() => setScreen('sound')} />}
        {screen === 'sound' && (
          <SoundScreen settings={soundSettings} onUpdate={setSoundSettings} onBack={() => setScreen('start')} />
        )}
        {screen === 'select' && (
          <WordSelectScreen key={CATEGORIES[step].key} category={CATEGORIES[step]} onSelect={handleSelectWord} />
        )}
        {screen === 'result' && (
          <ResultScreen
            lines={lines}
            reaction={reaction || (isSupported ? '' : 'おとはつかえないけど、たのしい！')}
            onReplayVoice={speakNews}
            onRestartGame={startGame}
          />
        )}
      </main>
    </div>
  );
}
