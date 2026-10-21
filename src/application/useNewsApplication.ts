import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useNewsSpeech } from "../hooks/useNewsSpeech";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "../utils/analytics";
import { resolveAppMode } from "../utils/appMode";
import { buildNewsLines } from "../utils/speechText";
import { createGameSession } from "./gameSession";

export type ApplicationMode = "game" | "debug-result" | "audio-check";

export function useNewsApplication() {
  const [session] = useState(() => createGameSession());
  const game = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const [isOffline, setIsOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine,
  );
  const { isWordsAudioCheckRoute, debugSelections } = resolveAppMode(
    typeof window === "undefined" ? "/" : window.location.pathname,
    typeof window === "undefined" ? "" : window.location.search,
  );
  const mode: ApplicationMode = isWordsAudioCheckRoute
    ? "audio-check"
    : debugSelections !== null
      ? "debug-result"
      : "game";
  const speech = useNewsSpeech();
  const runtime = useRef({ mode, speech, active: true });

  useLayoutEffect(() => {
    runtime.current = { mode, speech, active: true };
  });
  useLayoutEffect(
    () => () => {
      runtime.current.active = false;
    },
    [],
  );

  useEffect(() => {
    const online = () => {
      setIsOffline(false);
      trackEvent(ANALYTICS_EVENT_NAMES.onlineRestored);
    };
    const offline = () => {
      setIsOffline(true);
      trackEvent(ANALYTICS_EVENT_NAMES.offlineDetected);
    };
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  const commands = useMemo(
    () => ({
      start(this: void) {
        const { active, mode, speech } = runtime.current;
        if (!active || mode !== "game") {
          return false;
        }
        trackEvent(ANALYTICS_EVENT_NAMES.gameStart);
        speech.cancel();
        speech.warmup();
        speech.setSpeechError("");
        session.start();
        return true;
      },
      select(this: void, choiceId: string) {
        const { active, mode, speech } = runtime.current;
        if (!active || mode !== "game" || !session.select(choiceId)) {
          return false;
        }
        // Keep audio preparation in the user event, before React renders the next screen.
        speech.warmup();
        const next = session.getSnapshot();
        if (next.screen.name === "result") {
          speech.speakNews(next.selections);
        }
        return true;
      },
      replay(this: void) {
        const { active, mode, speech } = runtime.current;
        const current = session.getSnapshot();
        if (
          !active ||
          mode !== "game" ||
          current.screen.name !== "result" ||
          !speech.isSupported ||
          speech.isSpeaking
        ) {
          return false;
        }
        return speech.speakNews(current.selections);
      },
    }),
    [session],
  );

  return {
    state: {
      mode,
      game,
      isOffline,
      lines: debugSelections === null ? game.lines : buildNewsLines(debugSelections),
      speech: {
        error: speech.speechError,
        isSupported: speech.isSupported,
        isSpeaking: speech.isSpeaking,
        phase: mode === "game" ? speech.phase : "idle",
        availability: speech.speechAvailability,
      },
    },
    commands,
  };
}

export type NewsApplication = ReturnType<typeof useNewsApplication>;
