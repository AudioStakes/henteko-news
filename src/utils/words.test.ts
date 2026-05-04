import { describe, expect, test } from "vitest";
import { toCardWord } from "./words";

describe("toCardWord", () => {
  test("removes trailing particles が/を/で", () => {
    expect(toCardWord("ねこが")).toBe("ねこ");
    expect(toCardWord("パンを")).toBe("パン");
    expect(toCardWord("そらで")).toBe("そら");
  });
  test("keeps other endings", () => {
    expect(toCardWord("いつ")).toBe("いつ");
  });
  test("trims spaces", () => {
    expect(toCardWord("  ねこが  ")).toBe("ねこ");
  });
});
