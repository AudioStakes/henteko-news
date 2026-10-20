import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CATEGORIES } from "../data/words";
import type { useNewsSpeech } from "../hooks/useNewsSpeech";
import { requiredArrayElement } from "../test/requiredArrayElement";
import type { trackEvent } from "../utils/analytics";
import { buildNewsLines } from "../utils/speechText";
import { useNewsApplication } from "./useNewsApplication";

const { mockTrackEvent } = vi.hoisted(() => ({
  mockTrackEvent: vi.fn<typeof trackEvent>(),
}));

vi.mock("../utils/analytics", () => ({
  ANALYTICS_EVENT_NAMES: {
    gameStart: "game_start",
    offlineDetected: "offline_detected",
    onlineRestored: "online_restored",
  },
  trackEvent: mockTrackEvent,
}));

const speechState: ReturnType<typeof useNewsSpeech> = {
  speechError: "",
  setSpeechError: vi.fn<ReturnType<typeof useNewsSpeech>["setSpeechError"]>(),
  isSupported: true,
  warmup: vi.fn<ReturnType<typeof useNewsSpeech>["warmup"]>(),
  cancel: vi.fn<ReturnType<typeof useNewsSpeech>["cancel"]>(),
  speakNews: vi.fn<ReturnType<typeof useNewsSpeech>["speakNews"]>(),
  isSpeaking: false,
  speechAvailability: "ready",
};

vi.mock("../hooks/useNewsSpeech", () => ({
  useNewsSpeech: () => ({ ...speechState }),
}));

const originalNavigatorOnLine = Object.getOwnPropertyDescriptor(window.navigator, "onLine");

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    get: () => value,
  });
}

function restoreNavigatorOnline() {
  if (originalNavigatorOnLine) {
    Object.defineProperty(window.navigator, "onLine", originalNavigatorOnLine);
    return;
  }
  Reflect.deleteProperty(window.navigator, "onLine");
}

type ApplicationResult = { current: ReturnType<typeof useNewsApplication> };

function startGame(result: ApplicationResult) {
  act(() => {
    expect(result.current.commands.start()).toBe(true);
  });
}

function chooseFirst(result: ApplicationResult) {
  const choice = requiredArrayElement(result.current.state.game.choices, 0);
  act(() => {
    expect(result.current.commands.select(choice.id)).toBe(true);
  });
  return choice.id;
}

function completeGame(result: ApplicationResult) {
  startGame(result);
  for (const _category of CATEGORIES) {
    chooseFirst(result);
  }
}

describe("useNewsApplication public API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    speechState.speakNews = vi
      .fn<ReturnType<typeof useNewsSpeech>["speakNews"]>()
      .mockReturnValue(true);
    speechState.speechError = "";
    speechState.isSupported = true;
    speechState.isSpeaking = false;
    speechState.speechAvailability = "ready";
    setNavigatorOnline(true);
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    restoreNavigatorOnline();
    vi.restoreAllMocks();
  });

  it("exposes the initial game and speech state without a rendered UI", () => {
    const { result } = renderHook(() => useNewsApplication());

    expect(result.current.state.mode).toBe("game");
    expect(result.current.state.game.choices).toStrictEqual([]);
    expect(result.current.state.lines).toStrictEqual([]);
    expect(result.current.state.isOffline).toBe(false);
    expect(result.current.state.speech).toStrictEqual({
      error: "",
      isSupported: true,
      isSpeaking: false,
      availability: "ready",
    });
    expect(speechState.speakNews).not.toHaveBeenCalled();
  });

  it("rejects selection and replay before starting without changing the game", () => {
    const { result } = renderHook(() => useNewsApplication());
    const initialGame = result.current.state.game;

    act(() => {
      expect(result.current.commands.select("unknown-choice")).toBe(false);
      expect(result.current.commands.replay()).toBe(false);
    });

    expect(result.current.state.game).toBe(initialGame);
    expect(speechState.speakNews).not.toHaveBeenCalled();
  });

  it("starts a game, clears speech errors, cancels old audio, and warms up speech", () => {
    speechState.speechError = "previous error";
    const { result } = renderHook(() => useNewsApplication());

    startGame(result);

    expect(result.current.state.game.choices.length).toBeGreaterThan(0);
    expect(result.current.state.lines).toStrictEqual([]);
    expect(speechState.cancel).toHaveBeenCalledTimes(1);
    expect(speechState.warmup).toHaveBeenCalledTimes(1);
    expect(speechState.setSpeechError).toHaveBeenCalledWith("");
    expect(mockTrackEvent).toHaveBeenCalledWith("game_start");
  });

  it("accepts current choice IDs and exposes each selected line", () => {
    const { result } = renderHook(() => useNewsApplication());
    startGame(result);

    chooseFirst(result);

    expect(result.current.state.lines).toHaveLength(1);
    expect(result.current.state.game.choices.length).toBeGreaterThan(0);
    expect(speechState.speakNews).not.toHaveBeenCalled();
  });

  it("rejects an unknown choice without advancing or producing speech", () => {
    const { result } = renderHook(() => useNewsApplication());
    startGame(result);
    const beforeSelection = result.current.state.game;

    act(() => {
      expect(result.current.commands.select("unknown-choice")).toBe(false);
    });

    expect(result.current.state.game).toBe(beforeSelection);
    expect(result.current.state.lines).toStrictEqual([]);
    expect(speechState.speakNews).not.toHaveBeenCalled();
  });

  it("accepts only the first synchronous selection of the same choice", () => {
    const { result } = renderHook(() => useNewsApplication());
    startGame(result);
    const choice = requiredArrayElement(result.current.state.game.choices, 0);
    const { select } = result.current.commands;
    const accepted: boolean[] = [];

    act(() => {
      accepted.push(select(choice.id));
      accepted.push(select(choice.id));
    });

    expect(accepted).toStrictEqual([true, false]);
    expect(result.current.state.lines).toHaveLength(1);
    expect(speechState.speakNews).not.toHaveBeenCalled();
  });

  it("rejects a choice from an earlier category", () => {
    const { result } = renderHook(() => useNewsApplication());
    startGame(result);
    const staleChoiceId = chooseFirst(result);
    const beforeSelection = result.current.state.game;

    act(() => {
      expect(result.current.commands.select(staleChoiceId)).toBe(false);
    });

    expect(result.current.state.game).toBe(beforeSelection);
    expect(result.current.state.lines).toHaveLength(1);
  });

  it("speaks the completed result once and ignores further selections and rerenders", () => {
    const { result, rerender } = renderHook(() => useNewsApplication());
    startGame(result);
    let lastChoiceId = "";
    for (const _category of CATEGORIES) {
      lastChoiceId = chooseFirst(result);
    }
    const completedGame = result.current.state.game;

    act(() => {
      expect(result.current.commands.select(lastChoiceId)).toBe(false);
    });
    rerender();
    rerender();

    expect(result.current.state.game).toBe(completedGame);
    expect(result.current.state.lines).toHaveLength(CATEGORIES.length);
    expect(result.current.state.game.choices).toStrictEqual([]);
    expect(speechState.speakNews).toHaveBeenCalledTimes(1);
    const [spokenSelections] = requiredArrayElement(vi.mocked(speechState.speakNews).mock.calls, 0);
    expect(buildNewsLines(spokenSelections)).toStrictEqual(result.current.state.lines);
  });

  it("replays the same completed selections without changing the game", () => {
    const { result } = renderHook(() => useNewsApplication());
    completeGame(result);
    const completedGame = result.current.state.game;
    const [spokenSelections] = requiredArrayElement(vi.mocked(speechState.speakNews).mock.calls, 0);

    act(() => {
      expect(result.current.commands.replay()).toBe(true);
    });

    expect(result.current.state.game).toBe(completedGame);
    expect(speechState.speakNews).toHaveBeenCalledTimes(2);
    expect(speechState.speakNews).toHaveBeenLastCalledWith(spokenSelections);
  });

  it("rejects replay while choices remain", () => {
    const { result } = renderHook(() => useNewsApplication());
    startGame(result);
    chooseFirst(result);

    act(() => {
      expect(result.current.commands.replay()).toBe(false);
    });

    expect(speechState.speakNews).not.toHaveBeenCalled();
  });

  it("rejects replay while speech is busy and permits it after speech stops", () => {
    const { result, rerender } = renderHook(() => useNewsApplication());
    completeGame(result);
    speechState.isSpeaking = true;
    speechState.speechAvailability = "speaking";
    rerender();

    act(() => {
      expect(result.current.commands.replay()).toBe(false);
    });
    expect(speechState.speakNews).toHaveBeenCalledTimes(1);

    speechState.isSpeaking = false;
    speechState.speechAvailability = "ready";
    rerender();
    act(() => {
      expect(result.current.commands.replay()).toBe(true);
    });
    expect(speechState.speakNews).toHaveBeenCalledTimes(2);
  });

  it("rejects replay when speech becomes unsupported", () => {
    const { result, rerender } = renderHook(() => useNewsApplication());
    completeGame(result);
    speechState.isSupported = false;
    speechState.speechAvailability = "unsupported";
    rerender();

    act(() => {
      expect(result.current.commands.replay()).toBe(false);
    });

    expect(speechState.speakNews).toHaveBeenCalledTimes(1);
    expect(result.current.state.speech.isSupported).toBe(false);
    expect(result.current.state.speech.availability).toBe("unsupported");
  });

  it("keeps commands stable and uses the latest speech support in saved handlers", () => {
    const { result, rerender } = renderHook(() => useNewsApplication());
    completeGame(result);
    const commands = result.current.commands;
    speechState.isSupported = false;
    rerender();

    expect(result.current.commands).toBe(commands);
    expect(commands.replay()).toBe(false);
    expect(speechState.speakNews).toHaveBeenCalledTimes(1);
  });

  it("returns speech rejection without changing a completed game", () => {
    const { result } = renderHook(() => useNewsApplication());
    completeGame(result);
    const game = result.current.state.game;
    vi.mocked(speechState.speakNews).mockReturnValue(false);

    expect(result.current.commands.replay()).toBe(false);
    expect(result.current.state.game).toBe(game);
  });

  it("forwards a retained replay command to a replacement speech provider", () => {
    const { result, rerender } = renderHook(() => useNewsApplication());
    completeGame(result);
    const { replay } = result.current.commands;
    const previousSpeak = speechState.speakNews;
    const nextSpeak = vi.fn<ReturnType<typeof useNewsSpeech>["speakNews"]>().mockReturnValue(true);
    speechState.speakNews = nextSpeak;
    rerender();

    expect(replay()).toBe(true);
    expect(previousSpeak).toHaveBeenCalledTimes(1);
    expect(nextSpeak).toHaveBeenCalledExactlyOnceWith(result.current.state.game.selections);
  });

  it("keeps commands active after StrictMode effect setup is repeated", () => {
    const { result } = renderHook(() => useNewsApplication(), { wrapper: StrictMode });

    startGame(result);
    chooseFirst(result);

    expect(result.current.state.game.currentStep).toBe(1);
    expect(speechState.cancel).toHaveBeenCalledTimes(1);
  });

  it("rejects retained commands after unmount without side effects", () => {
    const { result, unmount } = renderHook(() => useNewsApplication());
    startGame(result);
    const { commands, state } = result.current;
    const choice = requiredArrayElement(state.game.choices, 0);
    unmount();
    vi.clearAllMocks();

    expect(commands.start()).toBe(false);
    expect(commands.select(choice.id)).toBe(false);
    expect(commands.replay()).toBe(false);
    expect(speechState.cancel).not.toHaveBeenCalled();
    expect(speechState.warmup).not.toHaveBeenCalled();
    expect(speechState.speakNews).not.toHaveBeenCalled();
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it("restarts a completed game with cleared selections and fresh speech setup", () => {
    const { result } = renderHook(() => useNewsApplication());
    completeGame(result);
    vi.clearAllMocks();

    startGame(result);

    expect(result.current.state.lines).toStrictEqual([]);
    expect(result.current.state.game.choices.length).toBeGreaterThan(0);
    expect(speechState.cancel).toHaveBeenCalledTimes(1);
    expect(speechState.warmup).toHaveBeenCalledTimes(1);
    expect(speechState.setSpeechError).toHaveBeenCalledWith("");
    expect(speechState.speakNews).not.toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith("game_start");
  });

  it("invalidates old choices when restarting a game in progress", () => {
    const { result } = renderHook(() => useNewsApplication());
    startGame(result);
    const staleChoice = requiredArrayElement(result.current.state.game.choices, 0);
    chooseFirst(result);
    startGame(result);
    const restartedGame = result.current.state.game;

    act(() => {
      expect(result.current.commands.select(staleChoice.id)).toBe(false);
    });

    expect(result.current.state.game).toBe(restartedGame);
    expect(result.current.state.lines).toStrictEqual([]);
  });

  it("starts a fresh game while speech is busy", () => {
    speechState.isSpeaking = true;
    speechState.speechAvailability = "speaking";
    const { result } = renderHook(() => useNewsApplication());

    startGame(result);

    expect(result.current.state.game.choices.length).toBeGreaterThan(0);
    expect(speechState.cancel).toHaveBeenCalledTimes(1);
    expect(speechState.warmup).toHaveBeenCalledTimes(1);
  });

  it("projects speech errors and availability into public state", () => {
    const { result, rerender } = renderHook(() => useNewsApplication());
    speechState.speechError = "よみあげエラー";
    speechState.speechAvailability = "error";
    rerender();

    expect(result.current.state.speech).toStrictEqual({
      error: "よみあげエラー",
      isSupported: true,
      isSpeaking: false,
      availability: "error",
    });
  });

  it("exposes debug news as read-only state and rejects all game commands", () => {
    const params = new URLSearchParams({
      debugResult: "1",
      who: "テスト太郎が",
      when: "きょう",
      where: "しぶやで",
      what: "コーヒーを",
      action: "のみました",
    });
    window.history.replaceState({}, "", `/?${params.toString()}`);
    const { result } = renderHook(() => useNewsApplication());

    act(() => {
      expect(result.current.commands.start()).toBe(false);
      expect(result.current.commands.select("unknown-choice")).toBe(false);
      expect(result.current.commands.replay()).toBe(false);
    });

    expect(result.current.state.mode).toBe("debug-result");
    expect(result.current.state.lines).toStrictEqual([
      "テスト太郎が",
      "きょう",
      "しぶやで",
      "コーヒーを",
      "のみました！",
    ]);
    expect(speechState.cancel).not.toHaveBeenCalled();
    expect(speechState.warmup).not.toHaveBeenCalled();
    expect(speechState.speakNews).not.toHaveBeenCalled();
    expect(mockTrackEvent).not.toHaveBeenCalledWith("game_start");
  });

  it("keeps an empty debug result read-only", () => {
    window.history.replaceState({}, "", "/?debugResult=1");
    const { result } = renderHook(() => useNewsApplication());

    act(() => {
      expect(result.current.commands.start()).toBe(false);
      expect(result.current.commands.replay()).toBe(false);
    });

    expect(result.current.state.mode).toBe("debug-result");
    expect(result.current.state.lines).toStrictEqual([]);
    expect(speechState.speakNews).not.toHaveBeenCalled();
  });

  it.each(["/words-audio-check", "/words-audio-check?debugResult=1&who=ねこが"])(
    "keeps game commands disabled on the audio check route: %s",
    (url) => {
      window.history.replaceState({}, "", url);
      const { result } = renderHook(() => useNewsApplication());
      const initialGame = result.current.state.game;

      act(() => {
        expect(result.current.commands.start()).toBe(false);
        expect(result.current.commands.select("unknown-choice")).toBe(false);
        expect(result.current.commands.replay()).toBe(false);
      });

      expect(result.current.state.mode).toBe("audio-check");
      expect(result.current.state.game).toBe(initialGame);
      expect(speechState.cancel).not.toHaveBeenCalled();
      expect(speechState.warmup).not.toHaveBeenCalled();
      expect(speechState.speakNews).not.toHaveBeenCalled();
      expect(mockTrackEvent).not.toHaveBeenCalledWith("game_start");
    },
  );

  it("initializes offline state from the browser", () => {
    setNavigatorOnline(false);
    const { result } = renderHook(() => useNewsApplication());

    expect(result.current.state.isOffline).toBe(true);
  });

  it("updates offline state and tracks browser connectivity events", () => {
    const { result } = renderHook(() => useNewsApplication());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.state.isOffline).toBe(true);
    expect(mockTrackEvent).toHaveBeenCalledWith("offline_detected");

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current.state.isOffline).toBe(false);
    expect(mockTrackEvent).toHaveBeenCalledWith("online_restored");
  });

  it("removes its connectivity listeners when the application unmounts", () => {
    const addListener = vi.spyOn(window, "addEventListener");
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useNewsApplication());
    const [, onOffline] = requiredArrayElement(
      addListener.mock.calls.filter(([type]) => type === "offline"),
      0,
    );
    const [, onOnline] = requiredArrayElement(
      addListener.mock.calls.filter(([type]) => type === "online"),
      0,
    );

    unmount();
    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("online"));

    expect(removeListener).toHaveBeenCalledWith("offline", onOffline);
    expect(removeListener).toHaveBeenCalledWith("online", onOnline);
    expect(mockTrackEvent).not.toHaveBeenCalledWith("offline_detected");
    expect(mockTrackEvent).not.toHaveBeenCalledWith("online_restored");
  });
});
