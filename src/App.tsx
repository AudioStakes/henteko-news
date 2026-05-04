import { useEffect, useMemo } from "react";
import { getRandomHiyokoImageUrl, NEXT_SCREEN_IMAGE_URLS } from "./assets/imageUrls";
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
import type { Selections, WordOption } from "./types/game";
import { preloadImagesWhenIdle } from "./utils/preload";
import { buildNewsLines } from "./utils/speechText";

function parseDebugWord(value: string | null): WordOption | undefined {
  if (!value) return undefined;
  const decoded = value.trim();
  if (!decoded) return undefined;
  return { display: decoded, speech: decoded };
}

function getDebugSelections(search: string): Selections | null {
  const params = new URLSearchParams(search);
  if (params.get("debugResult") !== "1") return null;

  return {
    who: parseDebugWord(params.get("who")),
    when: parseDebugWord(params.get("when")),
    where: parseDebugWord(params.get("where")),
    what: parseDebugWord(params.get("what")),
    action: parseDebugWord(params.get("action")),
  };
}

export default function App() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const search = typeof window !== "undefined" ? window.location.search : "";
  const debugSelections = getDebugSelections(search);
  const {
    screen,
    currentStep,
    currentCategory,
    isLastSelectStep,
    selections,
    startGame,
    handleSelectWord,
    setSelections,
    closeSound,
  } = useGameFlow();
  const [soundSettings, setSoundSettings] = useSoundSettings();
  const { speechError, setSpeechError, isSupported, warmup, cancel, speakNews, isSpeaking } =
    useNewsSpeech(soundSettings);
  const effectiveSelections = debugSelections ?? selections;
  const lines = useMemo(() => buildNewsLines(effectiveSelections), [effectiveSelections]);
  const hiyokoImageUrl = useMemo(() => {
    void screen;
    return getRandomHiyokoImageUrl();
  }, [screen]);

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
    setSpeechError("");
    startGame();
  };
  return (
    <div className="viewport">
      <main className="app-shell">
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
        {!debugSelections && screen.name === "sound" && (
          <SoundScreen settings={soundSettings} onUpdate={setSoundSettings} onBack={closeSound} />
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
            speechError={isSupported ? speechError : "おとはつかえないけど、たのしい！"}
            imageUrl={hiyokoImageUrl}
            replayDisabled={isSpeaking}
            onReplayVoice={() => speakNews(effectiveSelections)}
            onRestartGame={start}
          />
        )}
      </main>
    </div>
  );
}
