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
  isSupported,
  isSpeaking,
  imageUrl,
  onStart,
  onSelectWord,
  onReplayVoice,
  onRestartGame,
}: AppViewProps) {
  if (isWordsAudioCheckRoute) {
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
  }

  return (
    <div className="viewport">
      <main className="app-shell">
        {isOffline && <p className="offline-notice">オフラインです。こえがでないことがあるよ。</p>}
        <AppHeader />
        {debugSelections && (
          <ResultScreen
            lines={lines}
            speechError=""
            imageUrl={imageUrl}
            replayDisabled
            onReplayVoice={() => {}}
            onRestartGame={() => {}}
          />
        )}
        {!debugSelections && screen.name === "start" && (
          <StartScreen onStart={onStart} imageUrl={imageUrl} />
        )}
        {!debugSelections && screen.name === "select" && currentCategory && (
          <WordSelectScreen
            key={currentCategory.key}
            category={currentCategory}
            currentStep={currentStep}
            totalSteps={totalSteps}
            imageUrl={imageUrl}
            onSelect={onSelectWord}
          />
        )}
        {!debugSelections && screen.name === "result" && (
          <ResultScreen
            lines={lines}
            speechError={isSupported ? speechError : ""}
            imageUrl={imageUrl}
            replayDisabled={isSpeaking || !isSupported}
            onReplayVoice={onReplayVoice}
            onRestartGame={onRestartGame}
          />
        )}
        <AppFooter />
      </main>
    </div>
  );
}
