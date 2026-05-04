import { describe, expect, test } from "vitest";
import { INITIAL_SOUND, parseSoundSettings } from "./useSoundSettings";

describe("parseSoundSettings", () => {
  test("parses valid enabled values and ignores speed", () => {
    expect(parseSoundSettings({ enabled: true, speed: "normal" })).toEqual({ enabled: true });
    expect(parseSoundSettings({ enabled: false })).toEqual({ enabled: false });
  });
  test("falls back for unknown/broken values", () => {
    expect(parseSoundSettings(undefined)).toEqual(INITIAL_SOUND);
    expect(parseSoundSettings(null)).toEqual(INITIAL_SOUND);
    expect(parseSoundSettings({})).toEqual(INITIAL_SOUND);
    expect(parseSoundSettings({ enabled: "yes" })).toEqual(INITIAL_SOUND);
  });
});
