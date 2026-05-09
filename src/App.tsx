import { useEffect, useMemo, useState } from "react";
import { getRandomHiyokoImageUrl, NEXT_SCREEN_IMAGE_URLS } from "./assets/imageUrls";
import { AppView } from "./components/AppView";
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

  const start = () => {
    cancel();
    warmup();
    setSelections({});
    setSpeechError("");
    startGame();
  };

  const handleSelect = (word: Parameters<typeof handleSelectWord>[0]) => {
    warmup();
    const next = handleSelectWord(word);
    if (isLastSelectStep) speakNews(next);
  };

  return (
    <AppView
      isOffline={isOffline}
      isWordsAudioCheckRoute={isWordsAudioCheckRoute}
      debugSelections={debugSelections}
      screen={screen}
      currentStep={currentStep}
      currentCategory={currentCategory}
      totalSteps={CATEGORIES.length}
      lines={lines}
      speechError={speechError}
      isSupported={isSupported}
      isSpeaking={isSpeaking}
      imageUrl={hiyokoImageUrl}
      onStart={start}
      onSelectWord={handleSelect}
      onReplayVoice={() => speakNews(effectiveSelections)}
      onRestartGame={start}
    />
  );
}
