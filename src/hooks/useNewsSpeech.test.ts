import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Selections } from "../types/game";
import { useNewsSpeech } from "./useNewsSpeech";

const mockSpeak = vi.fn();
const mockWarmup = vi.fn();
const mockCancel = vi.fn();

let mockIsSupported = true;
let mockIsSpeaking = false;

vi.mock("./useSpeech", () => ({
  useSpeech: () => ({
    speak: mockSpeak,
    warmup: mockWarmup,
    cancel: mockCancel,
    isSupported: mockIsSupported,
    isSpeaking: mockIsSpeaking,
  }),
}));

const fullSelections: Selections = {
  who: { display: "ねこ", speech: "ねこ" },
  when: { display: "あさ", speech: "あさ" },
  where: { display: "こうえん", speech: "こうえん" },
  what: { display: "りんご", speech: "りんご" },
  action: { display: "たべる", speech: "たべる" },
};

describe("useNewsSpeech", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSupported = true;
    mockIsSpeaking = false;
  });

  it("does not call speak when selections are incomplete", () => {
    const { result } = renderHook(() => useNewsSpeech());

    act(() => {
      result.current.speakNews({ who: fullSelections.who });
    });

    expect(mockSpeak).not.toHaveBeenCalled();
    expect(result.current.speechError).toBe("");
  });

  it("calls speak when selections are complete", () => {
    mockSpeak.mockReturnValue(true);
    const { result } = renderHook(() => useNewsSpeech());

    act(() => {
      result.current.speakNews(fullSelections);
    });

    expect(mockSpeak).toHaveBeenCalledTimes(1);
    expect(result.current.speechError).toBe("");
  });

  it("shows unavailable message when speak fails and is not speaking", () => {
    mockSpeak.mockReturnValue(false);
    mockIsSpeaking = false;
    const { result } = renderHook(() => useNewsSpeech());

    act(() => {
      result.current.speakNews(fullSelections);
    });

    expect(result.current.speechError).toContain("よみあげ");
  });

  it("does not show unavailable message when speak fails but is currently speaking", () => {
    mockSpeak.mockReturnValue(false);
    mockIsSpeaking = true;
    const { result } = renderHook(() => useNewsSpeech());

    act(() => {
      result.current.speakNews(fullSelections);
    });

    expect(result.current.speechError).toBe("");
  });

  it("exposes useSpeech support flags and controls", () => {
    mockIsSupported = false;
    const { result } = renderHook(() => useNewsSpeech());

    expect(result.current.isSupported).toBe(false);
    act(() => {
      result.current.warmup();
      result.current.cancel();
    });

    expect(mockWarmup).toHaveBeenCalledTimes(1);
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });
});
