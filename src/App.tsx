import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { ResultScreen } from './components/ResultScreen';
import { SoundScreen } from './components/SoundScreen';
import { StartScreen } from './components/StartScreen';
import { WordSelectScreen } from './components/WordSelectScreen';
import { WordsAudioCheckScreen } from './components/WordsAudioCheckScreen';
import { CATEGORIES, REACTIONS } from './data/words';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSpeech } from './hooks/useSpeech';
import { buildNewsLines, toSpeechText } from './utils/speechText';
import { preloadImagesWhenIdle } from './utils/preload';
import { NEXT_SCREEN_IMAGE_URLS } from './assets/imageUrls';
import type { Selections, SoundSettings } from './types/game';

type Screen = 'start' | 'sound' | 'select' | 'result';

const INITIAL_SOUND: SoundSettings = {
  enabled: true,
  speed: 'normal',
};

function pickReaction() {
  return REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
}

function normalizeSoundSettings(sound: SoundSettings): SoundSettings {
  const speed =
    sound.speed === 'slow' ||
    sound.speed === 'normal' ||
    sound.speed === 'fast' ||
    sound.speed === 'veryFast'
      ? sound.speed
      : 'normal';

  return {
    enabled: Boolean(sound.enabled),
    speed,
  };
}

function getVoiceConfig(sound: SoundSettings) {
  const rate =
    sound.speed === 'slow' ? 0.75 : sound.speed === 'fast' ? 1.1 : sound.speed === 'veryFast' ? 1.3 : 0.9;
  const pitch =
    sound.speed === 'slow' ? 0.85 : sound.speed === 'fast' ? 1.25 : sound.speed === 'veryFast' ? 1.45 : 1.0;

  return { rate, pitch };
}

export default function App() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const [screen, setScreen] = useState<Screen>('start');
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Selections>({});
  const [reaction, setReaction] = useState('');
  const [speechError, setSpeechError] = useState('');
  const [soundSettings, setSoundSettings] = useLocalStorage<SoundSettings>('henteko-news-sound', INITIAL_SOUND);

  useEffect(() => {
    const normalized = normalizeSoundSettings(soundSettings);
    if (normalized.enabled !== soundSettings.enabled || normalized.speed !== soundSettings.speed) {
      setSoundSettings(normalized);
    }
  }, [soundSettings, setSoundSettings]);

  const { speak, isSupported, warmup, cancel } = useSpeech();

  const lines = useMemo(() => buildNewsLines(selections), [selections]);
  useEffect(() => {
    preloadImagesWhenIdle(NEXT_SCREEN_IMAGE_URLS);
  }, []);

  if (pathname === '/words-audio-check') {
    return (
      <div className="viewport">
        <main className="app-shell">
          <AppHeader />
          <WordsAudioCheckScreen />
        </main>
      </div>
    );
  }

  const showSpeechUnavailable = () => {
    setSpeechError('よみあげの おとが でません。ブラウザを さいきどうすると なおるかも。');
  };

  const speakNews = (nextSelections: Selections = selections) => {
    const nextLines = buildNewsLines(nextSelections);
    if (!soundSettings.enabled || nextLines.length !== 5) return;

    setSpeechError('');
    const text = toSpeechText(nextSelections);
    const { rate, pitch } = getVoiceConfig(soundSettings);
    const ok = speak(text, {
      rate,
      pitch,
      onEnd: () => setReaction(pickReaction()),
      onError: () => showSpeechUnavailable(),
    });

    if (!ok) {
      showSpeechUnavailable();
    }
  };

  const startGame = () => {
    cancel();
    warmup();
    setSelections({});
    setStep(0);
    setScreen('select');
    setReaction('');
    setSpeechError('');
  };

  const handleSelectWord = (word: string) => {
    warmup();
    const category = CATEGORIES[step];
    const nextSelections = { ...selections, [category.key]: word };
    setSelections(nextSelections);
    if (step === CATEGORIES.length - 1) {
      setScreen('result');
      speakNews(nextSelections);
    } else {
      setStep((prev) => prev + 1);
    }
  };

  return (
    <div className="viewport">
      <main className="app-shell">
        <AppHeader />
        {screen === 'start' && <StartScreen onStart={startGame} />}
        {screen === 'sound' && (
          <SoundScreen settings={soundSettings} onUpdate={setSoundSettings} onBack={() => setScreen('result')} />
        )}
        {screen === 'select' && (
          <WordSelectScreen key={CATEGORIES[step].key} category={CATEGORIES[step]} onSelect={handleSelectWord} />
        )}
        {screen === 'result' && (
          <ResultScreen
            lines={lines}
            reaction={reaction || (isSupported ? '' : 'おとはつかえないけど、たのしい！')}
            speechError={speechError}
            onReplayVoice={speakNews}
            onOpenSound={() => setScreen('sound')}
            onRestartGame={startGame}
          />
        )}
      </main>
    </div>
  );
}
