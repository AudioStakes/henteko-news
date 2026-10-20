import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requiredArrayElement } from "../test/requiredArrayElement";
import type { SpeakOptions } from "./useSpeech";
import { useSpeechQueue } from "./useSpeechQueue";

const { speak, cancel } = vi.hoisted(() => ({
  speak: vi.fn<(text: string, options: SpeakOptions) => boolean>(),
  cancel: vi.fn<() => void>(),
}));

vi.mock("./useSpeech", () => ({
  useSpeech: () => ({ speak, cancel, isSupported: true, settingsKey: "web-speech" }),
}));

describe("useSpeechQueue", () => {
  beforeEach(() => {
    speak.mockReset().mockReturnValue(true);
    cancel.mockReset();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects invalid index %s without speech or cancellation",
    (index) => {
      const onComplete = vi.fn<() => void>();
      const { result } = renderHook(() => useSpeechQueue(["ひとつ", "ふたつ"], { onComplete }));
      act(() => {
        expect(result.current.start(index)).toBe(false);
      });

      expect(speak).not.toHaveBeenCalled();
      expect(cancel).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
      expect(result.current.currentIndex).toBe(-1);
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.error).toBe("");
    },
  );

  it.each([
    [-10, 0],
    [1.9, 1],
    [100, 1],
  ])("normalizes finite index %s to %s", (input, expectedIndex) => {
    const items = ["ひとつ", "ふたつ"];
    const { result } = renderHook(() => useSpeechQueue(items));
    act(() => {
      expect(result.current.start(input)).toBe(true);
    });

    expect(result.current.currentIndex).toBe(expectedIndex);
    expect(requiredArrayElement(speak.mock.calls, 0)[0]).toBe(items[expectedIndex]);
  });

  it("consumes each word callback once and ignores a finished word's later error", () => {
    const onComplete = vi.fn<() => void>();
    const onError = vi.fn<(message: string) => void>();
    const { result } = renderHook(() =>
      useSpeechQueue(["ひとつ", "ふたつ"], { onComplete, onError }),
    );
    act(() => {
      result.current.start(0);
    });
    const first = requiredArrayElement(speak.mock.calls, 0)[1];
    act(() => {
      first.onEnd?.();
      first.onEnd?.();
      first.onError?.("error");
    });

    expect(speak).toHaveBeenCalledTimes(2);
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.isPlaying).toBe(true);
    expect(onError).not.toHaveBeenCalled();

    const second = requiredArrayElement(speak.mock.calls, 1)[1];
    act(() => {
      second.onEnd?.();
      second.onEnd?.();
      second.onError?.("error");
    });

    expect(result.current.isPlaying).toBe(false);
    expect(onComplete).toHaveBeenCalledExactlyOnceWith();
    expect(onError).not.toHaveBeenCalled();
  });

  it("reports one failure when speech errors synchronously and returns false", () => {
    const onError = vi.fn<(message: string) => void>();
    speak.mockImplementation((_text, options) => {
      options.onError?.("error");
      return false;
    });
    const { result } = renderHook(() => useSpeechQueue(["ひとつ"], { onError }));
    act(() => {
      result.current.start(0);
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.error).toContain("とちゅうで とまりました");
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("ignores late callbacks after a refused speech request and resumes the same word", () => {
    const onError = vi.fn<(message: string) => void>();
    speak.mockReturnValueOnce(false);
    const { result } = renderHook(() => useSpeechQueue(["ひとつ", "ふたつ"], { onError }));
    act(() => {
      result.current.start(0);
    });
    const refused = requiredArrayElement(speak.mock.calls, 0)[1];

    expect(result.current.isPlaying).toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.resume();
      refused.onEnd?.();
      refused.onError?.("error");
    });

    expect(speak).toHaveBeenCalledTimes(2);
    expect(requiredArrayElement(speak.mock.calls, 1)[0]).toBe("ひとつ");
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.error).toBe("");
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("does not let callbacks from a stopped queue advance or fail a restarted queue", () => {
    const { result } = renderHook(() => useSpeechQueue(["ひとつ", "ふたつ"]));
    act(() => {
      result.current.start(0);
    });
    const old = requiredArrayElement(speak.mock.calls, 0)[1];
    act(() => {
      result.current.stop();
      result.current.start(1);
      old.onEnd?.();
      old.onError?.("error");
    });

    expect(speak).toHaveBeenCalledTimes(2);
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.error).toBe("");
  });

  it("completes an empty queue without requesting speech", () => {
    const onComplete = vi.fn<() => void>();
    const { result } = renderHook(() => useSpeechQueue([], { onComplete }));
    act(() => {
      expect(result.current.start(0)).toBe(true);
    });

    expect(result.current.currentIndex).toBe(-1);
    expect(result.current.isPlaying).toBe(false);
    expect(speak).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledExactlyOnceWith();
  });
});
