import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SYNTHESIS_TIMEOUT_MS, useSpeech } from "./useSpeech";

const { mockPreload, mockSynthesize } = vi.hoisted(() => ({
  mockPreload: vi.fn(),
  mockSynthesize: vi.fn(),
}));

vi.mock("../utils/supertonic/supertonicClient", () => ({
  preloadSupertonic: mockPreload,
  synthesizeSupertonicSpeech: mockSynthesize,
}));

describe("useSpeech", () => {
  const audioInstances: Array<{
    onended: (() => void) | null;
    onerror: (() => void) | null;
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
  }> = [];

  beforeEach(() => {
    audioInstances.length = 0;
    mockPreload.mockReset().mockResolvedValue(undefined);
    mockSynthesize.mockReset();
    const MockAudio = function MockAudio() {
      const audio = {
        onended: null,
        onerror: null,
        play: vi.fn(async () => {}),
        pause: vi.fn(),
      };
      audioInstances.push(audio);
      return audio;
    };
    vi.stubGlobal("Audio", MockAudio as unknown as typeof Audio);
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
    const { result } = renderHook(() => useSpeech());

    const first = result.current.speak("こんにちは", { rate: 1, pitch: 1 });
    const second = result.current.speak("にどめ", { rate: 1, pitch: 1 });

    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it("warmup calls preloadSupertonic", () => {
    const { result } = renderHook(() => useSpeech());
    act(() => result.current.warmup());
    expect(mockPreload).toHaveBeenCalledTimes(1);
  });

  it("calls onEnd after successful playback", async () => {
    const revoke = vi.fn();
    const onEnd = vi.fn();
    mockSynthesize.mockResolvedValue({ url: "blob:ok", revoke, durationSec: 1 });

    const { result } = renderHook(() => useSpeech());
    act(() => result.current.speak("こんにちは", { rate: 1, pitch: 1, onEnd }));
    await Promise.resolve();
    act(() => audioInstances[0].onended?.());

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it('calls onError("error") when synthesis fails', async () => {
    const onError = vi.fn();
    mockSynthesize.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useSpeech());

    act(() => result.current.speak("こんにちは", { rate: 1, pitch: 1, onError }));
    await Promise.resolve();

    expect(onError).toHaveBeenCalledWith("error");
  });

  it("does not call stale onEnd after cancel", async () => {
    const onEnd = vi.fn();
    const revoke = vi.fn();
    mockSynthesize.mockResolvedValue({ url: "blob:cancel", revoke, durationSec: 1 });

    const { result } = renderHook(() => useSpeech());
    act(() => result.current.speak("こんにちは", { rate: 1, pitch: 1, onEnd }));
    await Promise.resolve();
    act(() => result.current.cancel());
    act(() => audioInstances[0].onended?.());

    expect(onEnd).not.toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it("does not report an error while a cold synthesis takes longer than 1.5 seconds", async () => {
    vi.useFakeTimers();
    mockSynthesize.mockReturnValue(new Promise(() => {}));
    const onError = vi.fn();
    const { result } = renderHook(() => useSpeech());
    act(() => result.current.speak("こんにちは", { rate: 1, pitch: 1, onError }));
    await act(async () => vi.advanceTimersByTimeAsync(2_000));
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(true);
  });

  it("revokes a late synthesis result after timeout without playing it", async () => {
    vi.useFakeTimers();
    const revoke = vi.fn();
    let resolveSynthesis!: (value: { url: string; revoke: () => void; durationSec: number }) => void;
    mockSynthesize.mockReturnValue(new Promise((resolve) => { resolveSynthesis = resolve; }));
    const onError = vi.fn();
    const onEnd = vi.fn();
    const { result } = renderHook(() => useSpeech());
    act(() => result.current.speak("こんにちは", { rate: 1, pitch: 1, onError, onEnd }));
    await act(async () => vi.advanceTimersByTimeAsync(SYNTHESIS_TIMEOUT_MS));
    expect(onError).toHaveBeenCalledExactlyOnceWith("timeout");
    expect(result.current.isSpeaking).toBe(false);
    await act(async () => resolveSynthesis({ url: "blob:late", revoke, durationSec: 1 }));
    expect(audioInstances).toHaveLength(0);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("ignores a late synthesis rejection after timeout", async () => {
    vi.useFakeTimers();
    let rejectSynthesis!: (reason: Error) => void;
    mockSynthesize.mockReturnValue(new Promise((_resolve, reject) => { rejectSynthesis = reject; }));
    const onError = vi.fn();
    const { result } = renderHook(() => useSpeech());
    act(() => result.current.speak("こんにちは", { rate: 1, pitch: 1, onError }));
    await act(async () => vi.advanceTimersByTimeAsync(SYNTHESIS_TIMEOUT_MS));
    await act(async () => rejectSynthesis(new Error("late failure")));
    expect(onError).toHaveBeenCalledExactlyOnceWith("timeout");
  });

  it("handles warmup failures and permits another warmup attempt", async () => {
    mockPreload.mockRejectedValueOnce(new Error("missing models"));
    const { result } = renderHook(() => useSpeech());
    await act(async () => result.current.warmup());
    await act(async () => result.current.warmup());
    expect(mockPreload).toHaveBeenCalledTimes(2);
  });

  it("revokes a pending synthesis after unmount", async () => {
    const revoke = vi.fn();
    let resolveSynthesis!: (value: { url: string; revoke: () => void; durationSec: number }) => void;
    mockSynthesize.mockReturnValue(new Promise((resolve) => { resolveSynthesis = resolve; }));
    const { result, unmount } = renderHook(() => useSpeech());
    act(() => result.current.speak("こんにちは", { rate: 1, pitch: 1 }));
    unmount();
    await act(async () => resolveSynthesis({ url: "blob:late", revoke, durationSec: 1 }));
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(audioInstances).toHaveLength(0);
  });
});
