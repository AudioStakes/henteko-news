import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./hooks/useButtonSound", () => ({
  useButtonSound: () => ({
    playOnPressStart: vi.fn(),
    withClickSound: <T extends unknown[]>(handler: (...args: T) => void) => handler,
  }),
}));

const speechState = {
  speechError: "",
  setSpeechError: vi.fn(),
  isSupported: true,
  warmup: vi.fn(),
  cancel: vi.fn(),
  speakNews: vi.fn(),
  isSpeaking: false,
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
  for (let i = 0; i < 5; i += 1) {
    const choices = screen.getAllByTestId("choice-card");
    fireEvent.click(choices[0]);
    act(() => {
      vi.advanceTimersByTime(300);
    });
  }
}

describe("App game flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
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

    expect(screen.getByRole("button", { name: "ニュースをつくる" })).toBeInTheDocument();
  });

  it("moves from start to result after five selections", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "ニュースをつくる" }));

    completeOneGame();

    expect(screen.getByLabelText("かんせいニュース")).toBeInTheDocument();
    expect(speechState.speakNews).toHaveBeenCalledTimes(1);
  });

  it("restarts from result into the first select step", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "ニュースをつくる" }));
    completeOneGame();

    fireEvent.click(screen.getByRole("button", { name: "つぎのニュース →" }));

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

    expect(screen.getByText("オフラインです。こえがでないことがあるよ。")).toBeInTheDocument();
  });

  it("shows ResultScreen instead of start/select flow when debugResult=1", () => {
    window.history.replaceState({}, "", "/?debugResult=1");

    render(<App />);

    expect(screen.getByLabelText("かんせいニュース")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ニュースをつくる" })).not.toBeInTheDocument();
    expect(screen.queryByText("だれが？")).not.toBeInTheDocument();
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

  it("shows offline notice on normal route", () => {
    render(<App />);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(screen.getByText("オフラインです。こえがでないことがあるよ。")).toBeInTheDocument();
  });
});
