import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SPEECH_SETTINGS, type SpeechSettings } from "../utils/speechSettings";
import { useNewsSpeech } from "./useNewsSpeech";
import { useSpeech } from "./useSpeech";
import { useSpeechQueue } from "./useSpeechQueue";

const { preload, synthesize } = vi.hoisted(() => ({ preload: vi.fn(), synthesize: vi.fn() }));
let settings: SpeechSettings = { ...DEFAULT_SPEECH_SETTINGS };
vi.mock("../context/SpeechSettingsContext", () => ({
  useSpeechSettings: () => ({ settings }),
}));
vi.mock("../utils/supertonic/supertonicClient", () => ({
  preloadSupertonic: preload,
  synthesizeSupertonicSpeech: synthesize,
}));

describe("speech provider selection", () => {
  const utterances: SpeechSynthesisUtterance[] = [];
  const audioInstances: Array<{
    onended: (() => void) | null;
    onerror: (() => void) | null;
    onplaying: (() => void) | null;
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
  }> = [];
  const cancelBrowser = vi.fn();

  beforeEach(() => {
    settings = { ...DEFAULT_SPEECH_SETTINGS };
    utterances.length = 0;
    audioInstances.length = 0;
    cancelBrowser.mockReset();
    preload.mockReset().mockResolvedValue(undefined);
    synthesize.mockReset().mockReturnValue(new Promise(() => {}));
    vi.stubGlobal("Audio", function MockAudio() {
      const audio = {
        onended: null,
        onerror: null,
        onplaying: null,
        play: vi.fn(async () => {}),
        pause: vi.fn(),
      };
      audioInstances.push(audio);
      return audio;
    });
    vi.stubGlobal(
      "speechSynthesis",
      Object.assign(new EventTarget(), {
        cancel: cancelBrowser,
        speak: vi.fn(),
        getVoices: () => [],
      }),
    );
    vi.stubGlobal("SpeechSynthesisUtterance", function Utterance() {
      const utterance = {} as SpeechSynthesisUtterance;
      utterances.push(utterance);
      return utterance;
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("uses browser speech by default and never preloads or synthesizes a model", () => {
    const { result } = renderHook(() => useSpeech());
    act(() => {
      result.current.warmup();
      result.current.speak("こんにちは", { rate: 1, pitch: 1 });
    });
    expect(utterances).toHaveLength(1);
    expect(preload).not.toHaveBeenCalled();
    expect(synthesize).not.toHaveBeenCalled();
  });

  it("uses the same configured paths for model warmup and synthesis", () => {
    settings = {
      provider: "supertonic",
      modelBasePath: "https://models.example/compatible/onnx",
      voiceStylePath: "/voices/F2.json",
    };
    const { result } = renderHook(() => useSpeech());
    act(() => {
      result.current.warmup();
      result.current.speak("こんにちは", { rate: 0.8, pitch: 1 });
    });
    expect(preload).toHaveBeenCalledWith({
      modelBasePath: settings.modelBasePath,
      voiceStylePath: settings.voiceStylePath,
    });
    expect(synthesize).toHaveBeenCalledWith({
      text: "こんにちは",
      speed: 0.8,
      modelBasePath: settings.modelBasePath,
      voiceStylePath: settings.voiceStylePath,
    });
  });

  it("cancels an active word queue on provider changes and ignores stale completion", () => {
    const { result, rerender } = renderHook(() => useSpeechQueue(["ひとつ", "ふたつ"]));
    act(() => result.current.start(0));
    const ended = utterances[0].onend;
    settings = { ...settings, provider: "supertonic" };
    rerender();
    expect(cancelBrowser).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentIndex).toBe(-1);
    act(() => ended?.call(utterances[0], new Event("end") as SpeechSynthesisEvent));
    expect(synthesize).not.toHaveBeenCalled();
    act(() => result.current.start(0));
    expect(synthesize).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(true);
  });

  it("reports one queue error when browser speech throws synchronously and allows retry", () => {
    vi.mocked(window.speechSynthesis.speak).mockImplementationOnce(() => {
      throw new Error("speech unavailable");
    });
    const onError = vi.fn();
    const { result } = renderHook(() => useSpeechQueue(["ひとつ"], { onError }));
    act(() => result.current.start(0));
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.error).toContain("とちゅうで");
    expect(onError).toHaveBeenCalledExactlyOnceWith(result.current.error);
    act(() => result.current.start(0));
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.error).toBe("");
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("cancels pending model speech when paths change and revokes its late result", async () => {
    settings = { ...settings, provider: "supertonic" };
    let finish!: (value: { url: string; durationSec: number; revoke: () => void }) => void;
    synthesize.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const revoke = vi.fn();
    const onEnd = vi.fn();
    const { result, rerender } = renderHook(() => useSpeech());
    act(() => result.current.speak("こんにちは", { rate: 1, pitch: 1, onEnd }));
    settings = { ...settings, modelBasePath: "/other/onnx" };
    rerender();
    expect(result.current.isSpeaking).toBe(false);
    await act(async () => finish({ url: "blob:late", durationSec: 1, revoke }));
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(onEnd).not.toHaveBeenCalled();
    await act(async () => result.current.speak("つぎ", { rate: 1, pitch: 1 }));
    expect(synthesize.mock.lastCall?.[0].modelBasePath).toBe("/other/onnx");
    expect(audioInstances[0].play).toHaveBeenCalledTimes(1);
  });

  it("stops active model playback and its queue when switching to browser speech", async () => {
    settings = { ...settings, provider: "supertonic" };
    const revoke = vi.fn();
    synthesize.mockResolvedValue({ url: "blob:model", durationSec: 1, revoke });
    const { result, rerender } = renderHook(() => useSpeechQueue(["ひとつ", "ふたつ"]));
    await act(async () => result.current.start(0));
    const ended = audioInstances[0].onended;
    expect(audioInstances[0].play).toHaveBeenCalledTimes(1);
    rerender();
    expect(audioInstances[0].pause).not.toHaveBeenCalled();
    settings = { ...settings, provider: "web-speech" };
    rerender();
    expect(audioInstances[0].pause).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(false);
    act(() => ended?.());
    expect(synthesize).toHaveBeenCalledTimes(1);
    act(() => result.current.start(0));
    expect(utterances).toHaveLength(1);
  });

  it("preserves news errors on ordinary rerenders and clears them after settings change", () => {
    const { result, rerender } = renderHook(() => useNewsSpeech());
    act(() => result.current.setSpeechError("以前のエラー"));
    rerender();
    expect(result.current.speechError).toBe("以前のエラー");
    settings = { ...settings, voiceStylePath: "/voice/F1.json" };
    rerender();
    expect(result.current.speechError).toBe("");
  });
});
