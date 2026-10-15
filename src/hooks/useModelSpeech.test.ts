import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deferred } from "../test/deferred";
import { requiredArrayElement } from "../test/requiredArrayElement";
import type {
  invalidateSupertonic,
  preloadSupertonic,
  synthesizeSupertonicSpeech,
} from "../utils/supertonic/supertonicClient";
import { SYNTHESIS_TIMEOUT_MS, useModelSpeech } from "./useModelSpeech";

const { mockInvalidate, mockPreload, mockSynthesize } = vi.hoisted(() => ({
  mockInvalidate: vi.fn<typeof invalidateSupertonic>(),
  mockPreload: vi.fn<typeof preloadSupertonic>(),
  mockSynthesize: vi.fn<typeof synthesizeSupertonicSpeech>(),
}));

vi.mock("../utils/supertonic/supertonicClient", () => ({
  invalidateSupertonic: mockInvalidate,
  preloadSupertonic: mockPreload,
  synthesizeSupertonicSpeech: mockSynthesize,
}));

describe("useModelSpeech", () => {
  const audioInstances: Array<{
    onended: (() => void) | null;
    onerror: (() => void) | null;
    play: ReturnType<typeof vi.fn<() => Promise<void>>>;
    pause: ReturnType<typeof vi.fn<() => void>>;
  }> = [];

  beforeEach(() => {
    audioInstances.length = 0;
    mockPreload.mockReset().mockResolvedValue(undefined);
    mockInvalidate.mockReset();
    mockSynthesize.mockReset();
    const MockAudio = function MockAudio() {
      const audio = {
        onended: null,
        onerror: null,
        play: vi.fn(() => Promise.resolve()),
        pause: vi.fn<() => void>(),
      };
      audioInstances.push(audio);
      return audio;
    };
    vi.stubGlobal("Audio", MockAudio);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns false when speak is called while busy", () => {
    mockSynthesize.mockResolvedValue({ url: "blob:1", revoke: vi.fn(), durationSec: 1 });
    const { result } = renderHook(() => useModelSpeech());

    const first = result.current.speak("こんにちは", { rate: 1, pitch: 1 });
    const second = result.current.speak("にどめ", { rate: 1, pitch: 1 });

    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it("warmup calls preloadSupertonic", () => {
    const { result } = renderHook(() => useModelSpeech());
    act(() => {
      result.current.warmup();
    });
    expect(mockPreload).toHaveBeenCalledTimes(1);
  });

  it("calls onEnd after successful playback", async () => {
    const revoke = vi.fn();
    const onEnd = vi.fn();
    mockSynthesize.mockResolvedValue({ url: "blob:ok", revoke, durationSec: 1 });

    const { result } = renderHook(() => useModelSpeech());
    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1, onEnd });
    });
    await Promise.resolve();
    act(() => {
      requiredArrayElement(audioInstances, 0).onended?.();
    });

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it('calls onError("error") when synthesis fails', async () => {
    const onError = vi.fn();
    mockSynthesize.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useModelSpeech());

    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1, onError });
    });
    await Promise.resolve();

    expect(onError).toHaveBeenCalledWith("error");
  });

  it("does not call stale onEnd after cancel", async () => {
    const onEnd = vi.fn();
    const revoke = vi.fn();
    mockSynthesize.mockResolvedValue({ url: "blob:cancel", revoke, durationSec: 1 });

    const { result } = renderHook(() => useModelSpeech());
    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1, onEnd });
    });
    await Promise.resolve();
    act(() => {
      result.current.cancel();
    });
    act(() => {
      requiredArrayElement(audioInstances, 0).onended?.();
    });

    expect(onEnd).not.toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it("does not report an error while a cold synthesis takes longer than 1.5 seconds", async () => {
    vi.useFakeTimers();
    mockSynthesize.mockReturnValue(new Promise(() => {}));
    const onError = vi.fn();
    const { result } = renderHook(() => useModelSpeech());
    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1, onError });
    });
    await act(async () => vi.advanceTimersByTimeAsync(2_000));
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(true);
  });

  it("revokes a late synthesis result after timeout without playing it", async () => {
    vi.useFakeTimers();
    const revoke = vi.fn();
    const synthesis = deferred<Awaited<ReturnType<typeof synthesizeSupertonicSpeech>>>();
    mockSynthesize.mockReturnValue(synthesis.promise);
    const onError = vi.fn();
    const onEnd = vi.fn();
    const { result } = renderHook(() => useModelSpeech());
    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1, onError, onEnd });
    });
    await act(async () => vi.advanceTimersByTimeAsync(SYNTHESIS_TIMEOUT_MS));
    expect(onError).toHaveBeenCalledExactlyOnceWith("timeout");
    expect(result.current.isSpeaking).toBe(false);
    await act(async () => {
      synthesis.resolve({ url: "blob:late", revoke, durationSec: 1 });
      await synthesis.promise;
    });
    expect(audioInstances).toHaveLength(0);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("ignores a late synthesis rejection after timeout", async () => {
    vi.useFakeTimers();
    const synthesis = deferred<Awaited<ReturnType<typeof synthesizeSupertonicSpeech>>>();
    mockSynthesize.mockReturnValue(synthesis.promise);
    const onError = vi.fn();
    const { result } = renderHook(() => useModelSpeech());
    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1, onError });
    });
    await act(async () => vi.advanceTimersByTimeAsync(SYNTHESIS_TIMEOUT_MS));
    await act(async () => {
      synthesis.reject(new Error("late failure"));
      await Promise.resolve();
    });
    expect(onError).toHaveBeenCalledExactlyOnceWith("timeout");
  });

  it("invalidates pending assets after timeout and allows a new speech request", async () => {
    vi.useFakeTimers();
    mockSynthesize.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useModelSpeech());
    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1 });
    });
    await act(async () => vi.advanceTimersByTimeAsync(SYNTHESIS_TIMEOUT_MS));
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
    act(() => {
      expect(result.current.speak("もういちど", { rate: 1, pitch: 1 })).toBe(true);
    });
    expect(mockSynthesize).toHaveBeenCalledTimes(2);
  });

  it("keeps a newer synthesis pending when a cancelled request finishes", async () => {
    const first = deferred<Awaited<ReturnType<typeof synthesizeSupertonicSpeech>>>();
    mockSynthesize.mockReturnValueOnce(first.promise).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useModelSpeech());
    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1 });
      result.current.cancel();
      result.current.speak("もういちど", { rate: 1, pitch: 1 });
    });
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
    const revoke = vi.fn();
    await act(async () => {
      first.resolve({ url: "blob:stale", revoke, durationSec: 1 });
      await first.promise;
    });
    act(() => {
      result.current.cancel();
    });
    expect(mockInvalidate).toHaveBeenCalledTimes(2);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(audioInstances).toHaveLength(0);
  });

  it("keeps initialized assets when cancelling audio playback", async () => {
    mockSynthesize.mockResolvedValue({ url: "blob:ready", revoke: vi.fn(), durationSec: 1 });
    const { result } = renderHook(() => useModelSpeech());
    await act(async () => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1 });
      await Promise.resolve();
    });
    act(() => {
      result.current.cancel();
    });
    expect(mockInvalidate).not.toHaveBeenCalled();
  });

  it("handles warmup failures and permits another warmup attempt", async () => {
    mockPreload.mockRejectedValueOnce(new Error("missing models"));
    const { result } = renderHook(() => useModelSpeech());
    await act(async () => {
      result.current.warmup();
      await Promise.resolve();
    });
    await act(async () => {
      result.current.warmup();
      await Promise.resolve();
    });
    expect(mockPreload).toHaveBeenCalledTimes(2);
  });

  it("revokes a pending synthesis after unmount", async () => {
    const revoke = vi.fn();
    const synthesis = deferred<Awaited<ReturnType<typeof synthesizeSupertonicSpeech>>>();
    mockSynthesize.mockReturnValue(synthesis.promise);
    const { result, unmount } = renderHook(() => useModelSpeech());
    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1 });
    });
    unmount();
    await act(async () => {
      synthesis.resolve({ url: "blob:late", revoke, durationSec: 1 });
      await synthesis.promise;
    });
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(audioInstances).toHaveLength(0);
  });
});
