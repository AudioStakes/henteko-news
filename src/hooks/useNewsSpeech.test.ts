import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requiredArrayElement } from "../test/requiredArrayElement";
import type { Selections } from "../types/game";
import type { trackError, trackEvent } from "../utils/analytics";
import { useNewsSpeech } from "./useNewsSpeech";
import type { useSpeech } from "./useSpeech";

const { mockTrackEvent, mockTrackError } = vi.hoisted(() => ({
  mockTrackEvent: vi.fn<typeof trackEvent>(),
  mockTrackError: vi.fn<typeof trackError>(),
}));
const mockSpeak = vi.fn<ReturnType<typeof useSpeech>["speak"]>();
const mockWarmup = vi.fn<ReturnType<typeof useSpeech>["warmup"]>();
const mockCancel = vi.fn<ReturnType<typeof useSpeech>["cancel"]>();

let mockIsSupported = true;
let mockIsSpeaking = false;

vi.mock("../utils/analytics", () => ({
  ANALYTICS_EVENT_NAMES: {
    gameStart: "game_start",
    speechSupported: "speech_supported",
    speechUnsupported: "speech_unsupported",
    speechError: "speech_error",
    offlineDetected: "offline_detected",
    onlineRestored: "online_restored",
    serviceWorkerError: "service_worker_error",
  },
  trackEvent: mockTrackEvent,
  trackError: mockTrackError,
}));

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
    mockTrackEvent.mockReset();
    mockTrackError.mockReset();
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

  it("passes the entire reported news on the first reading and replay", () => {
    const selections: Selections = {
      who: { display: "モンスターが", speech: "モンスターが" },
      when: { display: "おやつをたべたあと", speech: "おやつをたべたあと" },
      where: { display: "テーブルのうえで", speech: "テーブルのうえで" },
      what: { display: "やきそばを", speech: "やきそばを" },
      action: { display: "みんなにわたした", speech: "みんなにわたしました" },
    };
    mockSpeak.mockReturnValue(true);
    const { result, rerender } = renderHook(() => useNewsSpeech());

    act(() => {
      result.current.speakNews(selections);
    });
    rerender();
    act(() => {
      result.current.speakNews(selections);
    });

    expect(mockSpeak.mock.calls.map(([text]) => text)).toStrictEqual([
      "ニュースです！モンスターが、おやつをたべたあと、テーブルのうえで、やきそばを、みんなにわたしました！",
      "ニュースです！モンスターが、おやつをたべたあと、テーブルのうえで、やきそばを、みんなにわたしました！",
    ]);
  });

  it("shows unavailable message via speak onError callback", () => {
    mockSpeak.mockReturnValue(true);
    const { result } = renderHook(() => useNewsSpeech());

    act(() => {
      result.current.speakNews(fullSelections);
    });

    const options = requiredArrayElement(mockSpeak.mock.calls, 0)[1];

    act(() => {
      options.onError?.("timeout");
    });

    expect(result.current.speechError).toContain("文字");
    expect(mockTrackError).toHaveBeenCalledWith("speech_error", { reason: "timeout" });
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

  it("reports one analytics error when speak calls onError synchronously and returns false", () => {
    mockSpeak.mockImplementationOnce((_text, options) => {
      expect(options.onError).toBeDefined();
      if (options.onError === undefined) {
        throw new Error("Expected synchronous speech error callback");
      }
      options.onError("error");
      return false;
    });
    const { result } = renderHook(() => useNewsSpeech());
    act(() => {
      result.current.speakNews(fullSelections);
    });
    expect(result.current.speechAvailability).toBe("error");
    expect(mockTrackError).toHaveBeenCalledExactlyOnceWith("speech_error", { reason: "error" });
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
