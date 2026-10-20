// @vitest-environment node

import { assert, describe, expect, test, vi } from "vitest";
import { CATEGORIES } from "../data/words";
import type { Selections } from "../types/game";
import { buildNewsLines, toSpeechText } from "../utils/speechText";
import { toWordOption } from "../utils/wordOption";
import { buildShuffledChoices } from "./gameChoices";
import { createGameSession, type GameSession } from "./gameSession";

function firstChoice(session: GameSession) {
  const choice = session.getSnapshot().choices[0];
  if (choice === undefined) {
    throw new Error("Expected a current choice");
  }
  return choice;
}

function finishRound(session: GameSession) {
  for (let step = 0; step < CATEGORIES.length; step += 1) {
    expect(session.select(firstChoice(session).id)).toBe(true);
  }
}

describe("createGameSession", () => {
  test("starts with a stable, empty snapshot and rejects selections before starting", () => {
    const random = vi.fn(() => 0);
    const session = createGameSession({ random });
    const initial = session.getSnapshot();

    expect(initial).toStrictEqual({
      screen: { name: "start" },
      selections: {},
      currentStep: 0,
      currentCategory: null,
      totalSteps: CATEGORIES.length,
      choices: [],
      lines: [],
    });
    expect(session.select("arbitrary-id")).toBe(false);
    expect(session.getSnapshot()).toBe(initial);
    expect(random).not.toHaveBeenCalled();
  });

  test("synchronously progresses through every category and builds the final news", () => {
    const session = createGameSession({ random: () => 0.999999 });
    const selections: Selections = {};
    session.start();

    for (const [step, category] of CATEGORIES.entries()) {
      const snapshot = session.getSnapshot();
      expect(snapshot.screen).toStrictEqual({ name: "select", step });
      expect(snapshot.currentStep).toBe(step);
      expect(snapshot.currentCategory).toStrictEqual(category);
      expect(snapshot.totalSteps).toBe(CATEGORIES.length);
      expect(snapshot.choices).toHaveLength(5);
      expect(new Set(snapshot.choices.map((choice) => choice.id)).size).toBe(5);
      expect(snapshot.choices.map((choice) => choice.option)).toStrictEqual(
        category.words.slice(0, 5).map(toWordOption),
      );

      const choice = firstChoice(session);
      selections[category.key] = choice.option;
      expect(session.select(choice.id)).toBe(true);
      expect(session.getSnapshot().selections).toStrictEqual(selections);
      expect(session.getSnapshot()).not.toBe(snapshot);
      expect(snapshot.selections[category.key]).toBeUndefined();
    }

    expect(session.getSnapshot()).toMatchObject({
      screen: { name: "result" },
      currentStep: 0,
      currentCategory: null,
      choices: [],
      selections,
      lines: buildNewsLines(selections),
    });
  });

  test("rejects arbitrary, unoffered, previous-step, and duplicate choices without changes", () => {
    const random = vi.fn(() => 0);
    const session = createGameSession({ random });
    const listener = vi.fn();
    session.subscribe(listener);
    session.start();
    const first = session.getSnapshot();
    const currentChoice = firstChoice(session);
    assert(first.currentCategory);
    const unofferedChoice = buildShuffledChoices(
      first.currentCategory,
      Number.POSITIVE_INFINITY,
      () => 0,
    ).find(
      (choice) =>
        !first.choices.some((offered) => offered.option.display === choice.option.display),
    );
    assert(unofferedChoice);
    const unofferedId = `1:0:${unofferedChoice.id}`;

    for (const id of ["", "who-0", "invalid", unofferedId]) {
      expect(session.select(id)).toBe(false);
      expect(session.getSnapshot()).toBe(first);
    }
    const callsBefore = random.mock.calls.length;
    expect(session.select(currentChoice.id)).toBe(true);
    const second = session.getSnapshot();
    const callsAfter = random.mock.calls.length;
    expect(callsAfter).toBeGreaterThan(callsBefore);

    for (const choice of first.choices) {
      expect(session.select(choice.id)).toBe(false);
      expect(session.getSnapshot()).toBe(second);
    }
    expect(random).toHaveBeenCalledTimes(callsAfter);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(second.screen).toStrictEqual({ name: "select", step: 1 });
    expect(Object.keys(second.selections)).toStrictEqual(["who"]);
  });

  test("accepts the current choice on the next step immediately in the same tick", () => {
    const session = createGameSession({ random: () => 0 });
    session.start();
    const select = session.select;

    expect(select(firstChoice(session).id)).toBe(true);
    expect(select(firstChoice(session).id)).toBe(true);
    expect(session.getSnapshot().screen).toStrictEqual({ name: "select", step: 2 });
    expect(Object.keys(session.getSnapshot().selections)).toStrictEqual(["who", "when"]);
  });

  test("rejects all choices after completion and resets every result when restarting", () => {
    const session = createGameSession({ random: () => 0 });
    session.start();
    const oldChoice = firstChoice(session);
    finishRound(session);
    const result = session.getSnapshot();

    expect(session.select(oldChoice.id)).toBe(false);
    expect(session.select("invalid")).toBe(false);
    expect(session.getSnapshot()).toBe(result);

    session.start();
    const restarted = session.getSnapshot();
    expect(restarted.screen).toStrictEqual({ name: "select", step: 0 });
    expect(restarted.selections).toStrictEqual({});
    expect(restarted.lines).toStrictEqual([]);
    assert(restarted.currentCategory);
    expect(restarted.choices.map((choice) => choice.option)).toStrictEqual(
      buildShuffledChoices(restarted.currentCategory, 5, () => 0).map((choice) => choice.option),
    );
    expect(session.select(oldChoice.id)).toBe(false);
    expect(session.getSnapshot()).toBe(restarted);
    expect(firstChoice(session).id).not.toBe(oldChoice.id);
    expect(result.screen.name).toBe("result");
    expect(Object.keys(result.selections)).toHaveLength(CATEGORIES.length);
  });

  test("starting during selection creates a new round even when choices are identical", () => {
    const session = createGameSession({ random: () => 0 });
    session.start();
    const first = session.getSnapshot();
    session.start();
    const restarted = session.getSnapshot();

    expect(restarted.choices.map((choice) => choice.option)).toStrictEqual(
      first.choices.map((choice) => choice.option),
    );
    for (const choice of first.choices) {
      expect(session.select(choice.id)).toBe(false);
    }
    expect(session.getSnapshot()).toBe(restarted);
    expect(session.select(firstChoice(session).id)).toBe(true);
    session.start();
    expect(session.getSnapshot().selections).toStrictEqual({});
    expect(session.getSnapshot().screen).toStrictEqual({ name: "select", step: 0 });
  });

  test("notifies subscribers only after accepted changes and supports unsubscribe", () => {
    const session = createGameSession({ random: () => 0 });
    const snapshots: ReturnType<GameSession["getSnapshot"]>[] = [];
    const listener = vi.fn(() => snapshots.push(session.getSnapshot()));
    const unsubscribe = session.subscribe(listener);
    const otherListener = vi.fn();
    const unsubscribeOther = session.subscribe(otherListener);

    expect(listener).not.toHaveBeenCalled();
    session.start();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(snapshots[0]).toBe(session.getSnapshot());
    session.select("invalid");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribeOther();
    session.select(firstChoice(session).id);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(snapshots[1]).toBe(session.getSnapshot());
    expect(otherListener).toHaveBeenCalledTimes(1);
    unsubscribe();
    unsubscribe();
    session.start();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  test("keeps snapshots stable between commands and does not reshuffle on reads", () => {
    const random = vi.fn(() => 0.5);
    const session = createGameSession({ random });
    session.start();
    const snapshot = session.getSnapshot();
    const calls = random.mock.calls.length;

    expect(session.getSnapshot()).toBe(snapshot);
    expect(session.getSnapshot().choices).toBe(snapshot.choices);
    expect(session.getSnapshot().lines).toBe(snapshot.lines);
    expect(random).toHaveBeenCalledTimes(calls);
  });

  test("freezes all exposed data without freezing or sharing the vocabulary definitions", () => {
    const session = createGameSession({ random: () => 0.999999 });
    session.start();
    const snapshot = session.getSnapshot();
    const category = snapshot.currentCategory;
    const choice = firstChoice(session);
    assert(category);
    expect(category).not.toBe(CATEGORIES[0]);
    expect(category.words).not.toBe(CATEGORIES[0]?.words);

    for (const value of [
      snapshot,
      snapshot.screen,
      snapshot.selections,
      snapshot.choices,
      snapshot.lines,
      category,
      category.words,
      choice,
      choice.option,
    ]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
    expect(Reflect.set(snapshot, "currentStep", 4)).toBe(false);
    expect(Reflect.set(snapshot.screen, "step", 4)).toBe(false);
    expect(Reflect.set(snapshot.selections, "action", { display: "改ざん" })).toBe(false);
    expect(
      Reflect.set(snapshot.choices, "0", { id: "forged", option: { display: "改ざん" } }),
    ).toBe(false);
    expect(Reflect.set(snapshot.lines, "0", "改ざん")).toBe(false);
    expect(Reflect.set(category, "key", "action")).toBe(false);
    expect(Reflect.set(category.words, "0", "改ざん")).toBe(false);
    expect(Reflect.set(choice, "id", "forged")).toBe(false);
    expect(Reflect.set(choice.option, "display", "改ざん")).toBe(false);
    expect(session.select(choice.id)).toBe(true);
    const selected = session.getSnapshot().selections.who;
    expect(selected).toStrictEqual(choice.option);
    expect(Object.isFrozen(selected)).toBe(true);
    expect(Object.isFrozen(CATEGORIES)).toBe(false);
    expect(Object.isFrozen(CATEGORIES[0])).toBe(false);
    expect(Object.isFrozen(CATEGORIES[0]?.words)).toBe(false);

    for (let step = 1; step < CATEGORIES.length - 1; step += 1) {
      session.select(firstChoice(session).id);
    }
    const actionCategory = session.getSnapshot().currentCategory;
    const originalAction = CATEGORIES[CATEGORIES.length - 1]?.words[0];
    expect(actionCategory?.words[0]).toStrictEqual(originalAction);
    expect(actionCategory?.words[0]).not.toBe(originalAction);
    expect(Object.isFrozen(actionCategory?.words[0])).toBe(true);
    expect(Object.isFrozen(originalAction)).toBe(false);
  });

  test("preserves display and speech through choices, selections, and the result", () => {
    const session = createGameSession({ random: () => 0.999999 });
    session.start();
    for (let step = 0; step < CATEGORIES.length - 1; step += 1) {
      session.select(firstChoice(session).id);
    }
    const choice = firstChoice(session);
    expect(choice.option).toStrictEqual({
      display: "100こにふやした",
      speech: "100こにふやしました",
    });
    session.select(choice.id);

    expect(session.getSnapshot().selections.action).toStrictEqual(choice.option);
    const lines = session.getSnapshot().lines;
    expect(lines[lines.length - 1]).toBe("100こにふやしました！");
    expect(toSpeechText(session.getSnapshot().selections)).toContain("100こにふやしました");
  });
});

describe("buildShuffledChoices", () => {
  test("retains the existing deterministic shuffle and choice limit", () => {
    expect(
      buildShuffledChoices(
        { key: "who", label: "だれが？", words: ["ねこ", "いぬ", "とり"] },
        2,
        () => 0,
      ),
    ).toStrictEqual([
      { id: "who-1-いぬ", option: { display: "いぬ", speech: "いぬ" } },
      { id: "who-2-とり", option: { display: "とり", speech: "とり" } },
    ]);
  });

  test("rejects an out-of-bounds random choice index", () => {
    expect(() =>
      buildShuffledChoices({ key: "who", label: "だれが？", words: ["ねこ", "いぬ"] }, 5, () => 1),
    ).toThrow(RangeError);
  });
});
