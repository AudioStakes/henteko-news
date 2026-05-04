import { describe, expect, test } from "vitest";
import { buildNewsLines, toSpeechText } from "./speechText";

describe("speechText", () => {
  test("buildNewsLines returns category order and polite action with exclamation", () => {
    const selections = {
      who: { display: "ねこが" },
      when: { display: "いま" },
      where: { display: "そらで" },
      what: { display: "パンを" },
      action: { display: "あつめた" },
    };
    expect(buildNewsLines(selections)).toEqual([
      "ねこが",
      "いま",
      "そらで",
      "パンを",
      "あつめました！",
    ]);
  });
  test("toSpeechText prefers speech and action speech", () => {
    const selections = {
      who: { display: "ねこ", speech: "ネコ" },
      action: { display: "あつめた", speech: "ダンスした" },
    };
    expect(toSpeechText(selections)).toBe("ニュースです！ネコ、ダンスした！");
  });
  test("does not crash with missing categories", () => {
    expect(buildNewsLines({ action: { display: "あつめた" } })).toEqual(["あつめました！"]);
    expect(toSpeechText({})).toBe("ニュースです！");
  });
});
