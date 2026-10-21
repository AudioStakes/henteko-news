import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { CATEGORIES } from "./data/words";
import type { useNewsSpeech } from "./hooks/useNewsSpeech";
import { requiredArrayElement } from "./test/requiredArrayElement";
import type { trackEvent } from "./utils/analytics";

vi.mock("./components/useButtonSound", () => ({
  useButtonSound: () => ({
    playOnPressStart: vi.fn(),
    withClickSound: <T extends unknown[]>(handler: (...args: T) => void) => handler,
  }),
}));

const { mockTrackEvent } = vi.hoisted(() => ({
  mockTrackEvent: vi.fn<typeof trackEvent>(),
}));

vi.mock("./utils/analytics", () => ({
  ANALYTICS_EVENT_NAMES: {
    gameStart: "game_start",
    speechSupported: "speech_supported",
    speechUnsupported: "speech_unsupported",
    speechError: "speech_error",
    offlineDetected: "offline_detected",
    onlineRestored: "online_restored",
    serviceWorkerError: "service_worker_error",
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
  phase: "idle",
  speechAvailability: "ready",
};

vi.mock("./hooks/useNewsSpeech", () => ({
  useNewsSpeech: () => speechState,
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

function completeOneGame() {
  for (let i = 0; i < CATEGORIES.length; i += 1) {
    const choices = screen.getAllByTestId("choice-card");
    fireEvent.click(requiredArrayElement(choices, 0));
    act(() => {
      vi.advanceTimersByTime(300);
    });
  }
}

describe("App game flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(speechState.speakNews).mockReturnValue(true);
    vi.useFakeTimers();
    mockTrackEvent.mockReset();
    speechState.speechError = "";
    speechState.isSupported = true;
    speechState.isSpeaking = false;
    speechState.phase = "idle";
    speechState.speechAvailability = "ready";
    setNavigatorOnline(true);
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    restoreNavigatorOnline();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("renders start screen initially", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: "はじめる" })).toBeInTheDocument();
  });

  it("connects start, selection, replay and restart controls to the application API", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "はじめる" }));
    expect(mockTrackEvent).toHaveBeenCalledWith("game_start");

    completeOneGame();

    expect(screen.getByLabelText("かんせいニュース")).toBeInTheDocument();
    expect(speechState.speakNews).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "きく" }));
    expect(speechState.speakNews).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: "つぎをつくる" }));

    expect(screen.getByText("だれが？")).toBeInTheDocument();
    expect(screen.getAllByTestId("choice-card")).toHaveLength(5);
  });

  it("renders WordsAudioCheckScreen on /words-audio-check", () => {
    window.history.replaceState({}, "", "/words-audio-check");

    render(<App />);

    expect(screen.getByRole("heading", { name: "おんせい かくにん" })).toBeInTheDocument();
  });

  it("shows offline notice on /words-audio-check", () => {
    setNavigatorOnline(false);
    window.history.replaceState({}, "", "/words-audio-check");

    render(<App />);

    expect(screen.getByText(/いまは オフラインだよ。/)).toBeInTheDocument();
  });

  it("reflects debug query who/when/where/what/action in result", () => {
    const params = new URLSearchParams({
      debugResult: "1",
      who: "テスト太郎",
      when: "きょう",
      where: "しぶやで",
      what: "コーヒーを",
      action: "のみました",
    });
    window.history.replaceState({}, "", `/?${params.toString()}`);

    render(<App />);

    expect(screen.getByText("テスト太郎")).toBeInTheDocument();
    expect(screen.getByText("きょう")).toBeInTheDocument();
    expect(screen.getByText("しぶやで")).toBeInTheDocument();
    expect(screen.getByText("コーヒーを")).toBeInTheDocument();
    expect(screen.getByText("のみました！")).toBeInTheDocument();
  });

  it("displays connection state from the API", () => {
    render(<App />);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(mockTrackEvent).toHaveBeenCalledWith("offline_detected");

    expect(screen.getByText(/いまは オフラインだよ。/)).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByText(/いまは オフラインだよ。/)).not.toBeInTheDocument();
  });

  it("announces only speech error when an error is shown on result screen", () => {
    speechState.speechError = "よみあげエラー";
    speechState.speechAvailability = "error";
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "はじめる" }));
    completeOneGame();

    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("よみあげエラー");
  });
});
