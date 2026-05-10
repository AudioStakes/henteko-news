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
    mockSpeak.mockReset();
    mockWarmup.mockReset();
    mockCancel.mockReset();
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

  it("does not call speak when one of five selections is missing", () => {
    const { action, ...incompleteSelections } = fullSelections;
    const { result } = renderHook(() => useNewsSpeech());

    act(() => {
      result.current.speakNews(incompleteSelections);
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

  it("shows unavailable message via speak onError callback", () => {
    mockSpeak.mockReturnValue(true);
    const { result } = renderHook(() => useNewsSpeech());

    act(() => {
      result.current.speakNews(fullSelections);
    });

    const options = mockSpeak.mock.calls[0]?.[1] as
      | { onError?: (reason: string) => void }
      | undefined;

    act(() => {
      options?.onError?.("timeout");
    });

    expect(result.current.speechError).toContain("文字");
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

  it("exposes speechAvailability as ready by default", () => {
    const { result } = renderHook(() => useNewsSpeech());

    expect(result.current.speechAvailability).toBe("ready");
  });

  it("exposes speechAvailability as unsupported when speech is not supported", () => {
    mockIsSupported = false;
    const { result } = renderHook(() => useNewsSpeech());

    expect(result.current.speechAvailability).toBe("unsupported");
  });

  it("exposes speechAvailability as speaking while currently speaking", () => {
    mockIsSpeaking = true;
    const { result } = renderHook(() => useNewsSpeech());

    expect(result.current.speechAvailability).toBe("speaking");
  });

  it("exposes speechAvailability as error after speech failure", () => {
    mockSpeak.mockReturnValue(false);
    const { result } = renderHook(() => useNewsSpeech());

    act(() => {
      result.current.speakNews(fullSelections);
    });

    expect(result.current.speechAvailability).toBe("error");
  });
});
