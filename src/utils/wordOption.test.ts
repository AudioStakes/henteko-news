import { describe, expect, test } from "vitest";
import { toWordOption, wordDisplay } from "./wordOption";

describe("wordOption", () => {
  test("converts string to display/speech object", () => {
    expect(toWordOption("ねこ")).toEqual({ display: "ねこ", speech: "ねこ" });
  });
  test("keeps WordOption object", () => {
    const option = { display: "ねこ", speech: "ネコ" };
    expect(toWordOption(option)).toBe(option);
  });
  test("wordDisplay returns display", () => {
    expect(wordDisplay({ display: "いぬ", speech: "イヌ" })).toBe("いぬ");
  });
});
