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
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
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
});
