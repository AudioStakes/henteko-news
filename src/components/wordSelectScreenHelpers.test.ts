import { describe, expect, test, vi } from "vitest";
import type { Category } from "../types/game";
import {
  buildShuffledChoices,
  computePickState,
  scheduleSelection,
} from "./wordSelectScreenHelpers";

const category: Category = {
  key: "who",
  label: "だれが？",
  words: ["ねこ", "いぬ", "とり"],
};

describe("wordSelectScreenHelpers", () => {
  test("buildShuffledChoices deterministically shuffles and caps choices", () => {
    expect(buildShuffledChoices(category, 2, () => 0)).toEqual([
      { id: "who-1-いぬ", option: { display: "いぬ", speech: "いぬ" } },
      { id: "who-2-とり", option: { display: "とり", speech: "とり" } },
    ]);
  });

  test("computePickState keeps the first picked id once selection is pending", () => {
    expect(computePickState("", "first-id")).toBe("first-id");
    expect(computePickState("first-id", "second-id")).toBe("first-id");
  });

  test("scheduleSelection delegates to the provided scheduler and forwards the option", () => {
    const onSelect = vi.fn();
    const scheduleFn = vi.fn((callback: () => void, delayMs: number) => {
      expect(delayMs).toBe(125);
      callback();
      return 42;
    });

    const result = scheduleSelection(
      onSelect,
      { display: "ねこ", speech: "ねこ" },
      125,
      scheduleFn,
    );

    expect(result).toBe(42);
    expect(onSelect).toHaveBeenCalledWith({ display: "ねこ", speech: "ねこ" });
  });
});
