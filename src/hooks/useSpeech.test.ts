import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSpeech } from "./useSpeech";

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
    mockPreload.mockReset();
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
});
