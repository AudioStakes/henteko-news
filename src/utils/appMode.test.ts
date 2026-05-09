import { describe, expect, test } from "vitest";
import { getDebugSelections, parseDebugWord, resolveAppMode } from "./appMode";

describe("appMode", () => {
  test("parseDebugWord trims and maps to display/speech", () => {
    expect(parseDebugWord(" テスト太郎 ")).toEqual({
      display: "テスト太郎",
      speech: "テスト太郎",
    });
  });

  test("parseDebugWord returns undefined for empty or whitespace", () => {
    expect(parseDebugWord("")).toBeUndefined();
    expect(parseDebugWord("   ")).toBeUndefined();
  });

  test("getDebugSelections returns null unless debugResult=1", () => {
    expect(getDebugSelections("")).toBeNull();
    expect(getDebugSelections("?debugResult=0&who=テスト太郎")).toBeNull();
  });

  test("getDebugSelections keeps empty query values as undefined", () => {
    expect(getDebugSelections("?debugResult=1&who=&when=%20%20%20")).toEqual({
      who: undefined,
      when: undefined,
      where: undefined,
      what: undefined,
      action: undefined,
    });
  });

  test("resolveAppMode combines route and debug query decisions", () => {
    expect(resolveAppMode("/words-audio-check", "?debugResult=1&who=テスト太郎")).toEqual({
      isWordsAudioCheckRoute: true,
      debugSelections: {
        who: { display: "テスト太郎", speech: "テスト太郎" },
        when: undefined,
        where: undefined,
        what: undefined,
        action: undefined,
      },
    });
  });

  test("resolveAppMode marks non /words-audio-check routes as normal", () => {
    expect(resolveAppMode("/", "?debugResult=1")).toEqual({
      isWordsAudioCheckRoute: false,
      debugSelections: {
        who: undefined,
        when: undefined,
        where: undefined,
        what: undefined,
        action: undefined,
      },
    });
  });
});
