import { useEffect, useMemo, useState } from "react";
import { getRandomHiyokoImageUrl, NEXT_SCREEN_IMAGE_URLS } from "./assets/imageUrls";
import { AppView } from "./components/AppView";
import { CATEGORIES } from "./data/words";
import { useGameFlow } from "./hooks/useGameFlow";
import { useNewsSpeech } from "./hooks/useNewsSpeech";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "./utils/analytics";
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
  const {
    speechError,
    setSpeechError,
    isSupported,
    warmup,
    cancel,
    speakNews,
    isSpeaking,
    speechAvailability,
  } = useNewsSpeech();
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

    const handleOnline = () => {
      setIsOffline(false);
      trackEvent(ANALYTICS_EVENT_NAMES.onlineRestored);
    };
    const handleOffline = () => {
      setIsOffline(true);
      trackEvent(ANALYTICS_EVENT_NAMES.offlineDetected);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const start = () => {
    trackEvent(ANALYTICS_EVENT_NAMES.gameStart);
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
      speechStatusText={
        speechAvailability === "speaking"
          ? "ただいま よみあげちゅう。"
          : speechAvailability === "unsupported"
            ? "このブラウザでは読み上げできないことがあります。でも文字で遊べます。"
            : speechAvailability === "ready"
              ? "こえのボタンで もういちど よめるよ。"
              : "こえが うまくでないときも、文字でニュースを読めるよ。"
      }
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
