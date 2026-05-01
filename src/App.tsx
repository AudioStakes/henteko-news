import { useEffect, useMemo } from "react";
import { NEXT_SCREEN_IMAGE_URLS } from "./assets/imageUrls";
import { AppHeader } from "./components/AppHeader";
import { ResultScreen } from "./components/ResultScreen";
import { SoundScreen } from "./components/SoundScreen";
import { StartScreen } from "./components/StartScreen";
import { WordSelectScreen } from "./components/WordSelectScreen";
import { WordsAudioCheckScreen } from "./components/WordsAudioCheckScreen";
import { CATEGORIES } from "./data/words";
import { useGameFlow } from "./hooks/useGameFlow";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useNewsSpeech } from "./hooks/useNewsSpeech";
import type { SoundSettings } from "./types/game";
import { preloadImagesWhenIdle } from "./utils/preload";
import { buildNewsLines } from "./utils/speechText";

const INITIAL_SOUND: SoundSettings = { enabled: true, speed: "normal" };
const normalizeSoundSettings = (sound: SoundSettings): SoundSettings => ({
  enabled: Boolean(sound.enabled),
  speed: ["slow", "normal", "fast", "veryFast"].includes(sound.speed)
    ? sound.speed
    : ("normal" as const),
});

export default function App() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const { screen, setScreen, step, selections, startGame, handleSelectWord, setSelections } =
    useGameFlow();
  const [soundSettings, setSoundSettings] = useLocalStorage<SoundSettings>(
    "henteko-news-sound",
    INITIAL_SOUND,
  );
  const {
    reaction,
    speechError,
    setReaction,
    setSpeechError,
    isSupported,
    warmup,
    cancel,
    speakNews,
  } = useNewsSpeech(soundSettings);
  const lines = useMemo(() => buildNewsLines(selections), [selections]);

  useEffect(() => {
    const normalized = normalizeSoundSettings(soundSettings);
    if (normalized.enabled !== soundSettings.enabled || normalized.speed !== soundSettings.speed)
      setSoundSettings(normalized);
  }, [soundSettings, setSoundSettings]);
  useEffect(() => {
    preloadImagesWhenIdle(NEXT_SCREEN_IMAGE_URLS);
  }, []);

  if (pathname === "/words-audio-check")
    return (
      <div className="viewport">
        <main className="app-shell">
          <AppHeader />
          <WordsAudioCheckScreen />
        </main>
      </div>
    );

  const start = () => {
    cancel();
    warmup();
    setSelections({});
    setReaction("");
    setSpeechError("");
    startGame();
  };
  const onSelect = (word: string) => {
    warmup();
    const next = handleSelectWord(word);
    if (step === CATEGORIES.length - 1) speakNews(next);
  };

  return (
    <div className="viewport">
      <main className="app-shell">
        <AppHeader />
        {screen === "start" && <StartScreen onStart={start} />}
        {screen === "sound" && (
          <SoundScreen
            settings={soundSettings}
            onUpdate={setSoundSettings}
            onBack={() => setScreen("result")}
          />
        )}
        {screen === "select" && (
          <WordSelectScreen
            key={CATEGORIES[step].key}
            category={CATEGORIES[step]}
            onSelect={onSelect}
          />
        )}
        {screen === "result" && (
          <ResultScreen
            lines={lines}
            reaction={reaction || (isSupported ? "" : "おとはつかえないけど、たのしい！")}
            speechError={speechError}
            onReplayVoice={() => speakNews(selections)}
            onOpenSound={() => setScreen("sound")}
            onRestartGame={start}
          />
        )}
      </main>
    </div>
  );
}
