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

const fiveChoices = ["ねこが", "いぬが", "ぞうが", "りすが", "くまが"].map((display, index) => ({
  id: `choice-${index}`,
  option: { display },
}));

describe("WordSelectScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("shows all five short choices and the current question", () => {
    render(
      <WordSelectScreen
        category={category}
        choices={fiveChoices}
        onSelect={vi.fn()}
        currentStep={1}
        totalSteps={5}
        imageUrl="/test.png"
      />,
    );

    expect(screen.getByRole("heading", { name: "だれが？" })).toBeInTheDocument();
    expect(screen.getAllByTestId("choice-card")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "ねこ" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "くま" })).toBeEnabled();
  });

  it("keeps every candidate and its full label when one choice needs the long-word layout", () => {
    const longChoice = { id: "long", option: { display: "バスのうんてんしゅさんが" } };
    const { container } = render(
      <WordSelectScreen
        category={category}
        choices={[longChoice, ...fiveChoices.slice(1)]}
        onSelect={vi.fn()}
        currentStep={1}
        totalSteps={5}
        imageUrl="/test.png"
      />,
    );

    expect(screen.getAllByTestId("choice-card")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "バスのうんてんしゅさん" })).toBeEnabled();
    expect(container.querySelector(".choice-grid")).toHaveClass("long-choices");
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

    expect(onSelect).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(260);
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("first");
  });

  it("submits the final choice once in the click event so browser speech keeps its user gesture", () => {
    const onSelect = vi.fn();
    render(
      <WordSelectScreen
        category={{ label: "どうした？" }}
        choices={choices}
        onSelect={onSelect}
        currentStep={4}
        totalSteps={5}
        imageUrl="/test.png"
      />,
    );

    const buttons = screen.getAllByTestId("choice-card");
    const firstChoice = requiredArrayElement(buttons, 0);
    const secondChoice = requiredArrayElement(buttons, 1);
    fireEvent.click(firstChoice);

    expect(onSelect).toHaveBeenCalledExactlyOnceWith("first");
    fireEvent.click(secondChoice);
    fireEvent.click(firstChoice);
    act(() => {
      vi.advanceTimersByTime(260);
    });
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("first");
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
