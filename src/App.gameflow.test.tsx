import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("App game flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    window.history.replaceState({}, "", "/");
  });

  it("moves from start to result and can restart", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "ニュースをつくる" }));

    for (let i = 0; i < 5; i += 1) {
      const choices = screen
        .getAllByRole("button")
        .filter((button) => button.className.includes("choice-card"));
      fireEvent.click(choices[0]);
      act(() => {
        vi.advanceTimersByTime(300);
      });
    }

    expect(screen.getByLabelText("かんせいニュース")).toBeInTheDocument();
    expect(speechState.speakNews).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "つぎのニュース →" }));

    expect(screen.getByText("だれが？")).toBeInTheDocument();
  });
});
