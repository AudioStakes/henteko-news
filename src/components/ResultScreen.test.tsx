import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResultScreen } from "./ResultScreen";

vi.mock("./useButtonSound", () => ({
  useButtonSound: () => ({
    playOnPressStart: vi.fn(),
    withClickSound: <T extends unknown[]>(handler: (...args: T) => void) => handler,
  }),
}));

const lines = ["ねこが", "きのうのよる", "こうえんで", "おにぎりを", "たべました！"];

describe("ResultScreen", () => {
  it.each(["preparing", "speaking"] as const)(
    "keeps the completed news and restart available during %s",
    (phase) => {
      const onReplayVoice = vi.fn();
      const onRestartGame = vi.fn();
      render(
        <ResultScreen
          lines={lines}
          speechError=""
          speechPhase={phase}
          imageUrl="/caster.png"
          onReplayVoice={onReplayVoice}
          replayDisabled
          replayDisabledReason="読み上げ中です。"
          onRestartGame={onRestartGame}
        />,
      );

      for (const line of lines) {
        expect(screen.getByText(line, { exact: true })).toBeInTheDocument();
      }
      expect(screen.getByRole("button", { name: "きく" })).toBeDisabled();
      expect(
        screen.getByRole("img", {
          name: phase === "speaking" ? "原稿を読むひよこキャスター" : "赤い帽子のひよこキャスター",
        }),
      ).toBeInTheDocument();
      const restart = screen.getByRole("button", { name: "つぎをつくる" });
      expect(restart).toBeEnabled();
      fireEvent.click(restart);
      expect(onRestartGame).toHaveBeenCalledTimes(1);
      expect(onReplayVoice).not.toHaveBeenCalled();
    },
  );

  it("preserves long lines and supports replay after the narration ends", () => {
    const longLines = [
      "バスのうんてんしゅさんが",
      "とてもとてもながいひるやすみに",
      "どうぶつたちがあつまるひろばで",
      "おおきなおおきなおべんとうを",
      "れいぞうこでひやしました！",
    ];
    const onReplayVoice = vi.fn();
    render(
      <ResultScreen
        lines={longLines}
        speechError=""
        imageUrl="/caster.png"
        onReplayVoice={onReplayVoice}
        onRestartGame={vi.fn()}
      />,
    );

    for (const line of longLines) {
      expect(screen.getByText(line, { exact: true })).toBeInTheDocument();
    }
    expect(screen.queryByText("きみのニュース")).not.toBeInTheDocument();
    const replay = screen.getByRole("button", { name: "きく" });
    expect(replay).toBeEnabled();
    fireEvent.click(replay);
    expect(onReplayVoice).toHaveBeenCalledTimes(1);
  });
});
