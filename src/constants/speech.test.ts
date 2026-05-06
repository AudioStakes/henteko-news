import { describe, expect, test } from "vitest";
import { DEFAULT_NEWS_SPEECH_CONFIG } from "./speech";

describe("DEFAULT_NEWS_SPEECH_CONFIG", () => {
  test("uses fixed rate and pitch", () => {
    expect(DEFAULT_NEWS_SPEECH_CONFIG).toEqual({ rate: 0.75, pitch: 1.25 });
  });
});
