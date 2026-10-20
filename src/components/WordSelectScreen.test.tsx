import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requiredArrayElement } from "../test/requiredArrayElement";
import { WordSelectScreen } from "./WordSelectScreen";

vi.mock("./useButtonSound", () => ({
  useButtonSound: () => ({
    playOnPressStart: vi.fn(),
    withClickSound: <T extends unknown[]>(handler: (...args: T) => void) => handler,
  }),
}));

const category = { label: "だれが？" };
const choices = [
  { id: "first", option: { display: "ねこ" } },
  { id: "second", option: { display: "いぬ" } },
];

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
        choices={choices}
        onSelect={onSelect}
        currentStep={1}
        totalSteps={5}
        imageUrl="/test.png"
      />,
    );

    const buttons = screen.getAllByTestId("choice-card");
    const firstChoice = requiredArrayElement(buttons, 0);
    const secondChoice = requiredArrayElement(buttons, 1);

    fireEvent.click(firstChoice);
    fireEvent.click(secondChoice);

    act(() => {
      vi.advanceTimersByTime(260);
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("first");
  });

  it("clears a pending selection timeout on unmount", () => {
    const onSelect = vi.fn();

    const { unmount } = render(
      <WordSelectScreen
        category={category}
        choices={choices}
        onSelect={onSelect}
        currentStep={1}
        totalSteps={5}
        imageUrl="/test.png"
      />,
    );

    fireEvent.click(requiredArrayElement(screen.getAllByTestId("choice-card"), 0));
    unmount();

    act(() => {
      vi.advanceTimersByTime(260);
    });

    expect(onSelect).not.toHaveBeenCalled();
  });
});
