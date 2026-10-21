import { type ReactNode, useEffect, useRef } from "react";
import {
  DEFAULT_SPEECH_SETTINGS,
  type NewsApplication,
  type SpeechSettingsApi,
} from "../application";
import homeImage from "../assets/hiyoko3.webp";
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
  unsupported: "この おとでは よめないよ。もじで たのしんでね。",
  ready: "きく ボタンで もういちど よめるよ。",
  error: "こえが うまくでないときも、文字でニュースを読めるよ。",
};
const CASTER_IDLE_IMAGE = "/assets/caster-idle.png";
const CASTER_READING_IMAGE = "/assets/caster-reading.png";

function getReplayDisabledReason(speech: NewsApplication["state"]["speech"]) {
  if (speech.isSpeaking) {
    return speech.phase === "preparing"
      ? "いま こえを じゅんびしているよ。"
      : "いま よみあげちゅうだよ。おわったら もういちど よめるよ。";
  }
  return speech.isSupported
    ? undefined
    : "このブラウザでは よみあげに たいおうしていないことがあります。";
}

function focusScreen(main: HTMLElement | null) {
  const heading = main?.querySelector<HTMLElement>("[data-screen-heading]");
  heading?.focus({ preventScroll: true });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  const bounds = heading?.getBoundingClientRect();
  if (bounds && bounds.bottom > window.innerHeight) {
    const top = Math.max(0, bounds.top - 16);
    document.documentElement.scrollTop = top;
    document.body.scrollTop = top;
  }
}

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
  useEffect(() => {
    preloadImagesWhenIdle([CASTER_IDLE_IMAGE, CASTER_READING_IMAGE]);
  }, []);

  useEffect(() => {
    if (previousScreenKey.current === screenKey) {
      return;
    }
    previousScreenKey.current = screenKey;
    if (document.querySelector("dialog[open]")) {
      return;
    }
    focusScreen(mainRef.current);
  }, [screenKey]);

  const speechPhase = mode === "debug-result" ? "idle" : speech.phase;
  const speechStatusText =
    speechPhase === "preparing"
      ? "こえを じゅんびしているよ。"
      : SPEECH_STATUS_TEXT[speech.availability];

  return (
    <div className="viewport">
      <div className="app-shell">
        <div className="child-stage">
          <AppHeader
            settings={settings.settings}
            defaults={DEFAULT_SPEECH_SETTINGS}
            onSave={settings.saveSettings}
          />
          {state.isOffline && (
            <p className="offline-notice" role="status">
              いまは オフラインだよ。
              <br />
              もじで あそべるよ。
            </p>
          )}
          <main className="app-shell__main" ref={mainRef}>
            {mode === "audio-check" && audioCheck}
            {mode === "game" && game.screen.name === "start" && (
              <StartScreen onStart={commands.start} imageUrl={homeImage} />
            )}
            {mode === "game" && game.screen.name === "select" && game.currentCategory && (
              <WordSelectScreen
                key={`${game.currentStep}-${game.choices[0]?.id}`}
                category={game.currentCategory}
                choices={game.choices}
                currentStep={game.currentStep}
                totalSteps={game.totalSteps}
                imageUrl={CASTER_IDLE_IMAGE}
                onSelect={commands.select}
              />
            )}
            {(mode === "debug-result" || (mode === "game" && game.screen.name === "result")) && (
              <ResultScreen
                lines={state.lines}
                speechError={mode === "game" && speech.isSupported ? speech.error : ""}
                speechStatusText={mode === "game" ? speechStatusText : ""}
                speechPhase={speechPhase}
                imageUrl={speechPhase === "speaking" ? CASTER_READING_IMAGE : CASTER_IDLE_IMAGE}
                replayDisabled={mode === "debug-result" || speech.isSpeaking || !speech.isSupported}
                replayDisabledReason={getReplayDisabledReason(speech)}
                onReplayVoice={commands.replay}
                onRestartGame={commands.start}
              />
            )}
          </main>
        </div>
        <AppFooter />
      </div>
    </div>
  );
}
