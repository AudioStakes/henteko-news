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
import { useNewsSpeech } from "./hooks/useNewsSpeech";
import { useSoundSettings } from "./hooks/useSoundSettings";
import { preloadImagesWhenIdle } from "./utils/preload";
import { buildNewsLines } from "./utils/speechText";

export default function App() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const {
    screen,
    currentStep,
    currentCategory,
    isLastSelectStep,
    selections,
    startGame,
    handleSelectWord,
    setSelections,
    openSound,
    closeSound,
  } = useGameFlow();
  const [soundSettings, setSoundSettings] = useSoundSettings();
  const {
    reaction,
    speechError,
    setReaction,
    setSpeechError,
    isSupported,
    warmup,
    cancel,
    speakNews,
    isSpeaking,
  } = useNewsSpeech(soundSettings);
  const lines = useMemo(() => buildNewsLines(selections), [selections]);
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
  return (
    <div className="viewport">
      <main className="app-shell">
        <AppHeader />
        {screen.name === "start" && <StartScreen onStart={start} />}
        {screen.name === "sound" && (
          <SoundScreen settings={soundSettings} onUpdate={setSoundSettings} onBack={closeSound} />
        )}
        {screen.name === "select" && currentCategory && (
          <WordSelectScreen
            key={currentCategory.key}
            category={currentCategory}
            currentStep={currentStep}
            totalSteps={CATEGORIES.length}
            onSelect={(word) => {
              warmup();
              const next = handleSelectWord(word);
              if (isLastSelectStep) speakNews(next);
            }}
          />
        )}
        {screen.name === "result" && (
          <ResultScreen
            lines={lines}
            reaction={reaction || (isSupported ? "" : "おとはつかえないけど、たのしい！")}
            speechError={speechError}
            replayDisabled={isSpeaking}
            onReplayVoice={() => speakNews(selections)}
            onOpenSound={() => openSound("result")}
            onRestartGame={start}
          />
        )}
      </main>
    </div>
  );
}
