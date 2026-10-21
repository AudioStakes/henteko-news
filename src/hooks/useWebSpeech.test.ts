import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requiredArrayElement } from "../test/requiredArrayElement";
import {
  MockSpeechSynthesisErrorEvent,
  MockSpeechSynthesisEvent,
  MockSpeechSynthesisUtterance,
} from "../test/speechMocks";
import { useWebSpeech, WEB_SPEECH_START_TIMEOUT_MS } from "./useWebSpeech";

describe("useWebSpeech", () => {
  const utterances: SpeechSynthesisUtterance[] = [];
  const speak = vi.fn<SpeechSynthesis["speak"]>();
  const cancel = vi.fn<SpeechSynthesis["cancel"]>();
  const getVoices = vi.fn<() => SpeechSynthesisVoice[]>();
  let synthesis: EventTarget;
  const voice = (lang: string, isDefault = false, name = lang): SpeechSynthesisVoice => ({
    lang,
    default: isDefault,
    name,
    voiceURI: name,
    localService: true,
  });

  beforeEach(() => {
    utterances.length = 0;
    speak.mockReset();
    cancel.mockReset();
    getVoices.mockReset().mockReturnValue([]);
    synthesis = Object.assign(new EventTarget(), { speak, cancel, getVoices });
    vi.stubGlobal("speechSynthesis", synthesis);
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class extends MockSpeechSynthesisUtterance {
        constructor(text: string) {
          super(text);
          utterances.push(this);
        }
      },
    );
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
    expect(requiredArrayElement(utterances, 0)).toMatchObject({
      text: "こんにちは",
      lang: "ja-JP",
      voice: japanese,
      rate: 0.8,
      pitch: 1.2,
    });
    expect(speak).toHaveBeenCalledWith(requiredArrayElement(utterances, 0));
  });

  it("prefers Kyoko over an alphabetically first Japanese voice without a default", () => {
    const eddy = voice("ja-JP", false, "Eddy (Japanese (Japan))");
    const kyoko = voice("ja-JP", false, "Kyoko (Japanese (Japan))");
    getVoices.mockReturnValue([
      eddy,
      voice("ja-JP", false, "Flo (Japanese (Japan))"),
      voice("ja-JP", false, "Grandma (Japanese (Japan))"),
      voice("ja-JP", false, "Grandpa (Japanese (Japan))"),
      kyoko,
    ]);
    const { result } = renderHook(() => useWebSpeech());
    act(() => {
      result.current.speak("モンスターがおやつをたべたあと", { rate: 0.75, pitch: 1.25 });
    });
    expect(requiredArrayElement(utterances, 0).voice).toBe(kyoko);
  });

  it("keeps the Japanese default voice ahead of Kyoko", () => {
    const defaultVoice = voice("ja-JP", true, "Preferred Japanese voice");
    getVoices.mockReturnValue([voice("ja-JP", false, "Kyoko"), defaultVoice]);
    const { result } = renderHook(() => useWebSpeech());
    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1 });
    });
    expect(requiredArrayElement(utterances, 0).voice).toBe(defaultVoice);
  });

  it("warms up asynchronously loaded voices and falls back to the browser voice", () => {
    const { result } = renderHook(() => useWebSpeech());
    act(() => {
      result.current.warmup();
    });
    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1 });
    });
    expect(requiredArrayElement(utterances, 0).voice).toBeNull();
    act(() => {
      result.current.cancel();
    });
    const japanese = voice("ja");
    getVoices.mockReturnValue([japanese]);
    act(() => {
      synthesis.dispatchEvent(new Event("voiceschanged"));
    });
    act(() => {
      result.current.speak("にどめ", { rate: 1, pitch: 1 });
    });
    expect(requiredArrayElement(utterances, 1).voice).toBe(japanese);
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
    expect(result.current.phase).toBe("idle");
    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1, onEnd });
    });
    expect(result.current.phase).toBe("preparing");
    expect(result.current.isSpeaking).toBe(true);
    act(() => {
      requiredArrayElement(utterances, 0).onstart?.call(
        requiredArrayElement(utterances, 0),
        new MockSpeechSynthesisEvent("start", requiredArrayElement(utterances, 0)),
      );
    });
    expect(result.current.phase).toBe("speaking");
    const ended = requiredArrayElement(utterances, 0).onend;
    act(() => {
      ended?.call(
        requiredArrayElement(utterances, 0),
        new MockSpeechSynthesisEvent("end", requiredArrayElement(utterances, 0)),
      );
    });
    act(() => {
      ended?.call(
        requiredArrayElement(utterances, 0),
        new MockSpeechSynthesisEvent("end", requiredArrayElement(utterances, 0)),
      );
    });
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.phase).toBe("idle");
    act(() => {
      expect(result.current.speak("つぎ", { rate: 1, pitch: 1 })).toBe(true);
    });
  });

  it("cancels playback and suppresses callbacks saved before cancellation", () => {
    const onEnd = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() => useWebSpeech());
    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1, onEnd, onError });
    });
    const ended = requiredArrayElement(utterances, 0).onend;
    const errored = requiredArrayElement(utterances, 0).onerror;
    const started = requiredArrayElement(utterances, 0).onstart;
    act(() => {
      result.current.cancel();
    });
    expect(result.current.phase).toBe("idle");
    act(() => {
      result.current.speak("つぎ", { rate: 1, pitch: 1 });
    });
    act(() => {
      started?.call(
        requiredArrayElement(utterances, 0),
        new MockSpeechSynthesisEvent("start", requiredArrayElement(utterances, 0)),
      );
      ended?.call(
        requiredArrayElement(utterances, 0),
        new MockSpeechSynthesisEvent("end", requiredArrayElement(utterances, 0)),
      );
      errored?.call(
        requiredArrayElement(utterances, 0),
        new MockSpeechSynthesisErrorEvent("error", requiredArrayElement(utterances, 0)),
      );
    });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(result.current.isSpeaking).toBe(true);
    expect(result.current.phase).toBe("preparing");
    expect(onEnd).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("times out when playback does not start and ignores a late start/end", () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const onEnd = vi.fn();
    const { result } = renderHook(() => useWebSpeech());
    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1, onError, onEnd });
    });
    const started = requiredArrayElement(utterances, 0).onstart;
    const ended = requiredArrayElement(utterances, 0).onend;
    act(() => {
      vi.advanceTimersByTime(WEB_SPEECH_START_TIMEOUT_MS);
    });
    act(() => {
      started?.call(
        requiredArrayElement(utterances, 0),
        new MockSpeechSynthesisEvent("start", requiredArrayElement(utterances, 0)),
      );
      ended?.call(
        requiredArrayElement(utterances, 0),
        new MockSpeechSynthesisEvent("end", requiredArrayElement(utterances, 0)),
      );
    });
    expect(onError).toHaveBeenCalledExactlyOnceWith("timeout");
    expect(onEnd).not.toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.phase).toBe("idle");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("bounds playback after start when no end event arrives", () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const { result } = renderHook(() => useWebSpeech());
    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1, onError });
    });
    act(() => {
      requiredArrayElement(utterances, 0).onstart?.call(
        requiredArrayElement(utterances, 0),
        new MockSpeechSynthesisEvent("start", requiredArrayElement(utterances, 0)),
      );
    });
    act(() => {
      vi.advanceTimersByTime(12_000);
    });
    expect(onError).toHaveBeenCalledExactlyOnceWith("timeout");
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("clears playback after browser errors and synchronous failures", () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useWebSpeech());
    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1, onError });
    });
    act(() => {
      requiredArrayElement(utterances, 0).onerror?.call(
        requiredArrayElement(utterances, 0),
        new MockSpeechSynthesisErrorEvent("error", requiredArrayElement(utterances, 0)),
      );
    });
    expect(onError).toHaveBeenCalledExactlyOnceWith("error");
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.phase).toBe("idle");
    speak.mockImplementationOnce(() => {
      throw new Error("unavailable");
    });
    act(() => {
      expect(result.current.speak("つぎ", { rate: 1, pitch: 1 })).toBe(false);
    });
    expect(result.current.isSpeaking).toBe(false);
  });

  it("cleans up active speech and voice listeners on unmount", () => {
    vi.useFakeTimers();
    const onEnd = vi.fn();
    const remove = vi.spyOn(synthesis, "removeEventListener");
    const { result, unmount } = renderHook(() => useWebSpeech());
    act(() => {
      result.current.speak("こんにちは", { rate: 1, pitch: 1, onEnd });
    });
    const ended = requiredArrayElement(utterances, 0).onend;
    unmount();
    ended?.call(
      requiredArrayElement(utterances, 0),
      new MockSpeechSynthesisEvent("end", requiredArrayElement(utterances, 0)),
    );
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith("voiceschanged", expect.any(Function));
    expect(onEnd).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
