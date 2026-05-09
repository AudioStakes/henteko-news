import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Category } from "../types/game";
import { WordSelectScreen } from "./WordSelectScreen";

vi.mock("../hooks/useButtonSound", () => ({
  useButtonSound: () => ({
    playOnPressStart: vi.fn(),
    withClickSound: <T extends unknown[]>(handler: (...args: T) => void) => handler,
  }),
}));

const category: Category = {
  key: "who",
  label: "だれが？",
  words: ["ねこ", "いぬ", "とり"],
};

describe("WordSelectScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("keeps the first pick scheduled when multiple choices are clicked in the same tick", () => {
    const onSelect = vi.fn();

    render(
      <WordSelectScreen
        category={category}
        onSelect={onSelect}
        currentStep={1}
        totalSteps={5}
        imageUrl="/test.png"
      />,
    );

    const [firstChoice, secondChoice] = screen.getAllByTestId("choice-card");
    const firstLabel = firstChoice.textContent ?? "";

    fireEvent.click(firstChoice);
    fireEvent.click(secondChoice);

    act(() => {
      vi.advanceTimersByTime(260);
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith({ display: firstLabel, speech: firstLabel });
  });

  it("clears a pending selection timeout on unmount", () => {
    const onSelect = vi.fn();

    const { unmount } = render(
      <WordSelectScreen
        category={category}
        onSelect={onSelect}
        currentStep={1}
        totalSteps={5}
        imageUrl="/test.png"
      />,
    );

    fireEvent.click(screen.getAllByTestId("choice-card")[0]);
    unmount();

    act(() => {
      vi.advanceTimersByTime(260);
    });

    expect(onSelect).not.toHaveBeenCalled();
  });
});
