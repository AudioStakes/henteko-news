import { type ReactNode, useEffect, useMemo, useRef } from "react";
import {
  DEFAULT_SPEECH_SETTINGS,
  type NewsApplication,
  type SpeechSettingsApi,
} from "../application";
import { getRandomHiyokoImageUrl, NEXT_SCREEN_IMAGE_URLS } from "../assets/imageUrls";
import { preloadImagesWhenIdle } from "../utils/preload";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";
import { ResultScreen } from "./ResultScreen";
import { StartScreen } from "./StartScreen";
import { WordSelectScreen } from "./WordSelectScreen";

type AppViewProps = {
  application: NewsApplication;
  settings: SpeechSettingsApi;
  audioCheck: ReactNode;
};

const SPEECH_STATUS_TEXT = {
  speaking: "ただいま よみあげちゅう。",
  unsupported: "このブラウザでは読み上げできないことがあります。でも文字で遊べます。",
  ready: "こえのボタンで もういちど よめるよ。",
  error: "こえが うまくでないときも、文字でニュースを読めるよ。",
};

export function AppView({ application: { state, commands }, settings, audioCheck }: AppViewProps) {
  const { game, mode, speech } = state;
  const mainRef = useRef<HTMLElement>(null);
  const screenKey =
    mode === "game"
      ? game.screen.name === "select"
        ? `select-${game.currentStep}`
        : game.screen.name
      : mode;
  const previousScreenKey = useRef(screenKey);
  const screenImage = useMemo(
    () => ({ screenKey, imageUrl: getRandomHiyokoImageUrl() }),
    [screenKey],
  );

  useEffect(() => {
    preloadImagesWhenIdle(NEXT_SCREEN_IMAGE_URLS);
  }, []);

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

  const speechStatusText = SPEECH_STATUS_TEXT[speech.availability];

  return (
    <div className="viewport">
      <div className="app-shell">
        {state.isOffline && (
          <p className="offline-notice">
            オフラインです。読み上げや画像の一部が動かないことがあります。
          </p>
        )}
        <AppHeader
          settings={settings.settings}
          defaults={DEFAULT_SPEECH_SETTINGS}
          onSave={settings.saveSettings}
        />
        <main className="app-shell__main" ref={mainRef}>
          {mode === "audio-check" && audioCheck}
          {mode === "game" && game.screen.name === "start" && (
            <StartScreen onStart={commands.start} imageUrl={screenImage.imageUrl} />
          )}
          {mode === "game" && game.screen.name === "select" && game.currentCategory && (
            <WordSelectScreen
              key={game.choices[0]?.id}
              category={game.currentCategory}
              choices={game.choices}
              currentStep={game.currentStep}
              totalSteps={game.totalSteps}
              imageUrl={screenImage.imageUrl}
              onSelect={commands.select}
            />
          )}
          {(mode === "debug-result" || (mode === "game" && game.screen.name === "result")) && (
            <ResultScreen
              lines={state.lines}
              speechError={mode === "game" && speech.isSupported ? speech.error : ""}
              speechStatusText={mode === "game" ? speechStatusText : ""}
              imageUrl={screenImage.imageUrl}
              replayDisabled={mode === "debug-result" || speech.isSpeaking || !speech.isSupported}
              replayDisabledReason={
                speech.isSpeaking
                  ? "いま よみあげちゅうだよ。おわったら もういちど よめるよ。"
                  : !speech.isSupported
                    ? "このブラウザでは よみあげに たいおうしていないことがあります。"
                    : undefined
              }
              onReplayVoice={commands.replay}
              onRestartGame={commands.start}
            />
          )}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
