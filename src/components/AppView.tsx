import { useEffect, useRef } from "react";
import type { ScreenState } from "../hooks/useGameFlow";
import type { Category, Selections, WordOption } from "../types/game";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";
import { ResultScreen } from "./ResultScreen";
import { StartScreen } from "./StartScreen";
import { WordSelectScreen } from "./WordSelectScreen";
import { WordsAudioCheckScreen } from "./WordsAudioCheckScreen";

type AppViewProps = {
  isOffline: boolean;
  isWordsAudioCheckRoute: boolean;
  debugSelections: Selections | null;
  screen: ScreenState;
  currentStep: number;
  currentCategory: Category | null;
  totalSteps: number;
  lines: string[];
  speechError: string;
  speechStatusText: string;
  isSupported: boolean;
  isSpeaking: boolean;
  imageUrl: string;
  onStart: () => void;
  onSelectWord: (word: WordOption) => void;
  onReplayVoice: () => void;
  onRestartGame: () => void;
};

export function AppView({
  isOffline,
  isWordsAudioCheckRoute,
  debugSelections,
  screen,
  currentStep,
  currentCategory,
  totalSteps,
  lines,
  speechError,
  speechStatusText,
  isSupported,
  isSpeaking,
  imageUrl,
  onStart,
  onSelectWord,
  onReplayVoice,
  onRestartGame,
}: AppViewProps) {
  const mainRef = useRef<HTMLElement>(null);
  const screenKey = isWordsAudioCheckRoute
    ? "audio-check"
    : debugSelections !== null
      ? "debug-result"
      : screen.name === "select"
        ? `select-${currentStep}`
        : screen.name;
  const previousScreenKey = useRef(screenKey);

  useEffect(() => {
    if (previousScreenKey.current === screenKey) {
      return;
    }
    previousScreenKey.current = screenKey;
    if (document.querySelector("dialog[open]")) {
      return;
    }
    const main = mainRef.current;
    main?.querySelector<HTMLElement>("[data-screen-heading]")?.focus({ preventScroll: true });
    if (main) {
      main.scrollTop = 0;
    }
  }, [screenKey]);

  return (
    <div className="viewport">
      <div className="app-shell">
        {isOffline && (
          <p className="offline-notice">
            オフラインです。読み上げや画像の一部が動かないことがあります。
          </p>
        )}
        <AppHeader />
        <main className="app-shell__main" ref={mainRef}>
          {isWordsAudioCheckRoute && <WordsAudioCheckScreen />}
          {!isWordsAudioCheckRoute && debugSelections && (
            <ResultScreen
              lines={lines}
              speechError=""
              speechStatusText=""
              imageUrl={imageUrl}
              replayDisabled
              onReplayVoice={() => {}}
              onRestartGame={() => {}}
            />
          )}
          {!isWordsAudioCheckRoute && debugSelections === null && screen.name === "start" && (
            <StartScreen onStart={onStart} imageUrl={imageUrl} />
          )}
          {!isWordsAudioCheckRoute &&
            debugSelections === null &&
            screen.name === "select" &&
            currentCategory && (
              <WordSelectScreen
                key={currentCategory.key}
                category={currentCategory}
                currentStep={currentStep}
                totalSteps={totalSteps}
                imageUrl={imageUrl}
                onSelect={onSelectWord}
              />
            )}
          {!isWordsAudioCheckRoute && debugSelections === null && screen.name === "result" && (
            <ResultScreen
              lines={lines}
              speechError={isSupported ? speechError : ""}
              speechStatusText={speechStatusText}
              imageUrl={imageUrl}
              replayDisabled={isSpeaking || !isSupported}
              replayDisabledReason={
                isSpeaking
                  ? "いま よみあげちゅうだよ。おわったら もういちど よめるよ。"
                  : !isSupported
                    ? "このブラウザでは よみあげに たいおうしていないことがあります。"
                    : undefined
              }
              onReplayVoice={onReplayVoice}
              onRestartGame={onRestartGame}
            />
          )}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
