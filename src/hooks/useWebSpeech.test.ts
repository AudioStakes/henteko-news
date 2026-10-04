import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWebSpeech, WEB_SPEECH_START_TIMEOUT_MS } from "./useWebSpeech";

describe("useWebSpeech", () => {
  const utterances: SpeechSynthesisUtterance[] = [];
  const speak = vi.fn();
  const cancel = vi.fn();
  const getVoices = vi.fn<() => SpeechSynthesisVoice[]>();
  let synthesis: EventTarget;
  const voice = (lang: string, isDefault = false) =>
    ({ lang, default: isDefault, name: lang }) as SpeechSynthesisVoice;

  beforeEach(() => {
    utterances.length = 0;
    speak.mockReset();
    cancel.mockReset();
    getVoices.mockReset().mockReturnValue([]);
    synthesis = Object.assign(new EventTarget(), { speak, cancel, getVoices });
    vi.stubGlobal("speechSynthesis", synthesis);
    vi.stubGlobal("SpeechSynthesisUtterance", function MockUtterance(text: string) {
      const utterance = { text, voice: null } as SpeechSynthesisUtterance;
      utterances.push(utterance);
      return utterance;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("uses a Japanese voice with the configured rate and pitch", () => {
    const japanese = voice("ja-JP");
    getVoices.mockReturnValue([voice("en-US", true), japanese]);
    const { result } = renderHook(() => useWebSpeech());
    act(() => {
      expect(result.current.speak("こんにちは", { rate: 0.8, pitch: 1.2 })).toBe(true);
    });
    expect(utterances[0]).toMatchObject({
      text: "こんにちは",
      lang: "ja-JP",
      voice: japanese,
      rate: 0.8,
      pitch: 1.2,
    });
    expect(speak).toHaveBeenCalledWith(utterances[0]);
  });

  it("warms up asynchronously loaded voices and falls back to the browser voice", () => {
    const { result } = renderHook(() => useWebSpeech());
    act(() => result.current.warmup());
    act(() => result.current.speak("こんにちは", { rate: 1, pitch: 1 }));
    expect(utterances[0].voice).toBeNull();
    act(() => result.current.cancel());
    const japanese = voice("ja");
    getVoices.mockReturnValue([japanese]);
    act(() => synthesis.dispatchEvent(new Event("voiceschanged")));
    act(() => result.current.speak("にどめ", { rate: 1, pitch: 1 }));
    expect(utterances[1].voice).toBe(japanese);
  });

  it("rejects empty or busy requests synchronously", () => {
    const { result } = renderHook(() => useWebSpeech());
    act(() => {
      expect(result.current.speak("   ", { rate: 1, pitch: 1 })).toBe(false);
      expect(result.current.speak("こんにちは", { rate: 1, pitch: 1 })).toBe(true);
      expect(result.current.speak("にどめ", { rate: 1, pitch: 1 })).toBe(false);
    });
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it("reports unsupported browsers without requesting speech", () => {
    vi.stubGlobal("speechSynthesis", undefined);
    const { result } = renderHook(() => useWebSpeech());
    expect(result.current.isSupported).toBe(false);
    expect(result.current.speak("こんにちは", { rate: 1, pitch: 1 })).toBe(false);
  });

  it("finishes once and permits the next utterance", () => {
    const onEnd = vi.fn();
    const { result } = renderHook(() => useWebSpeech());
    act(() => result.current.speak("こんにちは", { rate: 1, pitch: 1, onEnd }));
    const ended = utterances[0].onend;
    act(() => ended?.call(utterances[0], new Event("end") as SpeechSynthesisEvent));
    act(() => ended?.call(utterances[0], new Event("end") as SpeechSynthesisEvent));
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(result.current.isSpeaking).toBe(false);
    act(() => expect(result.current.speak("つぎ", { rate: 1, pitch: 1 })).toBe(true));
  });

  it("cancels playback and suppresses callbacks saved before cancellation", () => {
    const onEnd = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() => useWebSpeech());
    act(() => result.current.speak("こんにちは", { rate: 1, pitch: 1, onEnd, onError }));
    const ended = utterances[0].onend;
    const errored = utterances[0].onerror;
    act(() => result.current.cancel());
    act(() => {
      ended?.call(utterances[0], new Event("end") as SpeechSynthesisEvent);
      errored?.call(utterances[0], new Event("error") as SpeechSynthesisErrorEvent);
    });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(result.current.isSpeaking).toBe(false);
    expect(onEnd).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("times out when playback does not start and ignores a late start/end", () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const onEnd = vi.fn();
    const { result } = renderHook(() => useWebSpeech());
    act(() => result.current.speak("こんにちは", { rate: 1, pitch: 1, onError, onEnd }));
    const started = utterances[0].onstart;
    const ended = utterances[0].onend;
    act(() => vi.advanceTimersByTime(WEB_SPEECH_START_TIMEOUT_MS));
    act(() => {
      started?.call(utterances[0], new Event("start") as SpeechSynthesisEvent);
      ended?.call(utterances[0], new Event("end") as SpeechSynthesisEvent);
    });
    expect(onError).toHaveBeenCalledExactlyOnceWith("timeout");
    expect(onEnd).not.toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("bounds playback after start when no end event arrives", () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const { result } = renderHook(() => useWebSpeech());
    act(() => result.current.speak("こんにちは", { rate: 1, pitch: 1, onError }));
    act(() =>
      utterances[0].onstart?.call(utterances[0], new Event("start") as SpeechSynthesisEvent),
    );
    act(() => vi.advanceTimersByTime(12_000));
    expect(onError).toHaveBeenCalledExactlyOnceWith("timeout");
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("clears playback after browser errors and synchronous failures", () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useWebSpeech());
    act(() => result.current.speak("こんにちは", { rate: 1, pitch: 1, onError }));
    act(() =>
      utterances[0].onerror?.call(utterances[0], new Event("error") as SpeechSynthesisErrorEvent),
    );
    expect(onError).toHaveBeenCalledExactlyOnceWith("error");
    expect(result.current.isSpeaking).toBe(false);
    speak.mockImplementationOnce(() => {
      throw new Error("unavailable");
    });
    act(() => expect(result.current.speak("つぎ", { rate: 1, pitch: 1 })).toBe(false));
    expect(result.current.isSpeaking).toBe(false);
  });

  it("cleans up active speech and voice listeners on unmount", () => {
    vi.useFakeTimers();
    const onEnd = vi.fn();
    const remove = vi.spyOn(synthesis, "removeEventListener");
    const { result, unmount } = renderHook(() => useWebSpeech());
    act(() => result.current.speak("こんにちは", { rate: 1, pitch: 1, onEnd }));
    const ended = utterances[0].onend;
    unmount();
    ended?.call(utterances[0], new Event("end") as SpeechSynthesisEvent);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith("voiceschanged", expect.any(Function));
    expect(onEnd).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
