import { describe, expect, test } from "vitest";
import { DEFAULT_NEWS_SPEECH_CONFIG } from "./speech";

describe("DEFAULT_NEWS_SPEECH_CONFIG", () => {
  test("uses fixed rate and pitch", () => {
    expect(DEFAULT_NEWS_SPEECH_CONFIG).toEqual({ rate: 1, pitch: 1 });
  });
});
