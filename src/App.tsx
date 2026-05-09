import { useEffect, useMemo, useState } from "react";
import { getRandomHiyokoImageUrl, NEXT_SCREEN_IMAGE_URLS } from "./assets/imageUrls";
import { AppFooter } from "./components/AppFooter";
import { AppHeader } from "./components/AppHeader";
import { ResultScreen } from "./components/ResultScreen";
import { StartScreen } from "./components/StartScreen";
import { WordSelectScreen } from "./components/WordSelectScreen";
import { WordsAudioCheckScreen } from "./components/WordsAudioCheckScreen";
import { CATEGORIES } from "./data/words";
import { useGameFlow } from "./hooks/useGameFlow";
import { useNewsSpeech } from "./hooks/useNewsSpeech";
import { resolveAppMode } from "./utils/appMode";
import { preloadImagesWhenIdle } from "./utils/preload";
import { buildNewsLines } from "./utils/speechText";

export default function App() {
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof navigator === "undefined") return false;
    return !navigator.onLine;
  });
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const search = typeof window !== "undefined" ? window.location.search : "";
  const { isWordsAudioCheckRoute, debugSelections } = resolveAppMode(pathname, search);
  const {
    screen,
    currentStep,
    currentCategory,
    isLastSelectStep,
    selections,
    startGame,
    handleSelectWord,
    setSelections,
  } = useGameFlow();
  const { speechError, setSpeechError, isSupported, warmup, cancel, speakNews, isSpeaking } =
    useNewsSpeech();
  const effectiveSelections = debugSelections ?? selections;
  const lines = useMemo(() => buildNewsLines(effectiveSelections), [effectiveSelections]);
  const hiyokoImageUrl = useMemo(() => {
    void screen;
    return getRandomHiyokoImageUrl();
  }, [screen]);

  useEffect(() => {
    preloadImagesWhenIdle(NEXT_SCREEN_IMAGE_URLS);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  if (isWordsAudioCheckRoute)
    return (
      <div className="viewport">
        <main className="app-shell">
          {isOffline && (
            <p className="offline-notice">オフラインです。こえがでないことがあるよ。</p>
          )}
          <AppHeader />
          <WordsAudioCheckScreen />
        </main>
      </div>
    );
  const start = () => {
    cancel();
    warmup();
    setSelections({});
    setSpeechError("");
    startGame();
  };
  return (
    <div className="viewport">
      <main className="app-shell">
        {isOffline && <p className="offline-notice">オフラインです。こえがでないことがあるよ。</p>}
        <AppHeader />
        {debugSelections && (
          <ResultScreen
            lines={lines}
            speechError=""
            imageUrl={hiyokoImageUrl}
            replayDisabled
            onReplayVoice={() => {}}
            onRestartGame={() => {}}
          />
        )}
        {!debugSelections && screen.name === "start" && (
          <StartScreen onStart={start} imageUrl={hiyokoImageUrl} />
        )}
        {!debugSelections && screen.name === "select" && currentCategory && (
          <WordSelectScreen
            key={currentCategory.key}
            category={currentCategory}
            currentStep={currentStep}
            totalSteps={CATEGORIES.length}
            imageUrl={hiyokoImageUrl}
            onSelect={(word) => {
              warmup();
              const next = handleSelectWord(word);
              if (isLastSelectStep) speakNews(next);
            }}
          />
        )}
        {!debugSelections && screen.name === "result" && (
          <ResultScreen
            lines={lines}
            speechError={isSupported ? speechError : ""}
            imageUrl={hiyokoImageUrl}
            replayDisabled={isSpeaking || !isSupported}
            onReplayVoice={() => speakNews(effectiveSelections)}
            onRestartGame={start}
          />
        )}
        <AppFooter />
      </main>
    </div>
  );
}
