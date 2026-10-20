import { act, renderHook } from "@testing-library/react";
import { createElement, StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CATEGORIES } from "../data/words";
import type { SpeakOptions } from "../hooks/useSpeech";
import { requiredArrayElement } from "../test/requiredArrayElement";
import { toWordOption } from "../utils/wordOption";
import { useWordsAudioCheck } from "./useWordsAudioCheck";

const { speak, cancel, speech } = vi.hoisted(() => {
  const speak = vi.fn<(text: string, options: SpeakOptions) => boolean>();
  const cancel = vi.fn<() => void>();
  return {
    speak,
    cancel,
    speech: { isSupported: true, settingsKey: "web-speech", speak, cancel },
  };
});

vi.mock("../hooks/useSpeech", () => ({
  useSpeech: () => ({ ...speech }),
}));

describe("useWordsAudioCheck", () => {
  beforeEach(() => {
    speak.mockReset().mockReturnValue(true);
    cancel.mockReset();
    speech.isSupported = true;
    speech.settingsKey = "web-speech";
    speech.speak = speak;
    speech.cancel = cancel;
  });

  it("publishes all words in catalog order and starts synchronously with their speech text", () => {
    const { result } = renderHook(useWordsAudioCheck);
    const expectedItems = CATEGORIES.flatMap((category) => category.words.map(toWordOption));

    expect(result.current.state.queue.map((item) => item.displayText)).toStrictEqual(
      expectedItems.map((item) => item.display),
    );
    expect(result.current.state.queue.map((item) => item.speechText)).toStrictEqual(
      expectedItems.map((item) => item.speech ?? item.display),
    );
    expect(result.current.state.currentItem).toBeNull();
    expect(result.current.state.currentIndex).toBe(-1);
    expect(result.current.state.isPlaying).toBe(false);
    expect(result.current.state.error).toBe("");
    expect(Object.isFrozen(result.current.state.queue)).toBe(true);
    expect(Object.isFrozen(result.current.state.queue[0])).toBe(true);
    expect(Object.isFrozen(result.current.state.categoryStarts)).toBe(true);
    expect(Object.isFrozen(result.current.state.categoryStarts[0])).toBe(true);

    act(() => {
      expect(result.current.commands.start()).toBe(true);
      expect(speak).toHaveBeenCalledTimes(1);
    });

    expect(result.current.state.currentItem).toStrictEqual(result.current.state.queue[0]);
    expect(result.current.state.isPlaying).toBe(true);
    expect(requiredArrayElement(speak.mock.calls, 0)[0]).toBe(
      requiredArrayElement(result.current.state.queue, 0).speechText,
    );
  });

  it.each(CATEGORIES.map((category) => category.key))(
    "starts category %s at its first word",
    (key) => {
      const { result } = renderHook(useWordsAudioCheck);
      const category = result.current.state.categoryStarts.find((item) => item.key === key);
      expect(category).toBeDefined();

      act(() => {
        expect(result.current.commands.startCategory(key)).toBe(true);
      });

      expect(result.current.state.currentIndex).toBe(category?.startIndex);
      expect(result.current.state.currentItem?.categoryKey).toBe(key);
      expect(requiredArrayElement(speak.mock.calls, 0)[0]).toBe(
        result.current.state.currentItem?.speechText,
      );
    },
  );

  it.each(["error", "stop"])("resumes the interrupted word after %s", (interruption) => {
    const { result } = renderHook(useWordsAudioCheck);
    act(() => {
      result.current.commands.start();
    });
    act(() => {
      requiredArrayElement(speak.mock.calls, 0)[1].onEnd?.();
      requiredArrayElement(speak.mock.calls, 1)[1].onEnd?.();
      if (interruption === "error") {
        requiredArrayElement(speak.mock.calls, 2)[1].onError?.("error");
      } else {
        result.current.commands.stop();
      }
      expect(result.current.commands.resume()).toBe(true);
    });

    expect(speak).toHaveBeenCalledTimes(4);
    expect(requiredArrayElement(speak.mock.calls, 3)[0]).toBe(
      requiredArrayElement(speak.mock.calls, 2)[0],
    );
    expect(result.current.state.error).toBe("");
    expect(result.current.state.currentIndex).toBe(2);
  });

  it("restarts from the first word after the complete catalog finishes", () => {
    const { result } = renderHook(useWordsAudioCheck);
    act(() => {
      result.current.commands.start();
    });
    const length = result.current.state.queue.length;
    act(() => {
      for (let index = 0; index < length; index += 1) {
        requiredArrayElement(speak.mock.calls, index)[1].onEnd?.();
      }
    });

    expect(result.current.state.isPlaying).toBe(false);
    expect(result.current.state.currentIndex).toBe(length - 1);
    expect(speak).toHaveBeenCalledTimes(length);

    act(() => {
      result.current.commands.resume();
    });

    expect(requiredArrayElement(speak.mock.calls, length)[0]).toBe(
      requiredArrayElement(speak.mock.calls, 0)[0],
    );
    expect(result.current.state.currentIndex).toBe(0);
  });

  it("rejects repeated start, resume, and category actions while a word is playing", () => {
    const { result } = renderHook(useWordsAudioCheck);
    act(() => {
      expect(result.current.commands.start()).toBe(true);
      expect(result.current.commands.start()).toBe(false);
      expect(result.current.commands.resume()).toBe(false);
      expect(result.current.commands.startCategory("action")).toBe(false);
    });

    expect(speak).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(result.current.state.currentIndex).toBe(0);
  });

  it("reports unsupported speech without beginning playback and recovers when it is available", () => {
    speech.isSupported = false;
    const { result, rerender } = renderHook(useWordsAudioCheck);
    act(() => {
      expect(result.current.commands.start()).toBe(false);
    });

    expect(result.current.state.error).toContain("つかえません");
    expect(result.current.state.isPlaying).toBe(false);
    expect(speak).not.toHaveBeenCalled();

    speech.isSupported = true;
    rerender();
    act(() => {
      expect(result.current.commands.resume()).toBe(true);
    });

    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.state.error).toBe("");
  });

  it("resets progress after settings change and ignores callbacks from the previous queue", () => {
    const { result, rerender } = renderHook(useWordsAudioCheck);
    act(() => {
      result.current.commands.startCategory("action");
    });
    const previousOptions = requiredArrayElement(speak.mock.calls, 0)[1];
    speech.settingsKey = "supertonic";
    rerender();

    expect(result.current.state.currentIndex).toBe(-1);
    expect(result.current.state.currentItem).toBeNull();
    expect(result.current.state.isPlaying).toBe(false);
    expect(result.current.state.error).toBe("");

    act(() => {
      result.current.commands.resume();
      previousOptions.onEnd?.();
      previousOptions.onError?.("error");
    });

    expect(speak).toHaveBeenCalledTimes(2);
    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.state.error).toBe("");
  });

  it("keeps registered commands stable and uses the latest speech provider after settings change", () => {
    const { result, rerender } = renderHook(useWordsAudioCheck);
    const registered = result.current.commands;
    act(() => {
      registered.startCategory("action");
      registered.stop();
    });
    const nextSpeak = vi
      .fn<(text: string, options: SpeakOptions) => boolean>()
      .mockReturnValue(true);
    const nextCancel = vi.fn<() => void>();
    speech.settingsKey = "supertonic";
    speech.speak = nextSpeak;
    speech.cancel = nextCancel;
    rerender();
    speak.mockClear();
    cancel.mockClear();

    expect(result.current.commands).toBe(registered);
    act(() => {
      expect(registered.start()).toBe(true);
      registered.stop();
      expect(registered.resume()).toBe(true);
      registered.stop();
      expect(registered.startCategory("action")).toBe(true);
    });

    expect(result.current.commands).toBe(registered);
    expect(speak).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
    expect(nextSpeak).toHaveBeenCalledTimes(3);
    expect(nextCancel).toHaveBeenCalledTimes(5);
    expect(requiredArrayElement(nextSpeak.mock.calls, 0)[0]).toBe(
      requiredArrayElement(result.current.state.queue, 0).speechText,
    );
    expect(requiredArrayElement(nextSpeak.mock.calls, 1)[0]).toBe(
      requiredArrayElement(result.current.state.queue, 0).speechText,
    );
    expect(result.current.state.currentItem?.categoryKey).toBe("action");
  });

  it("keeps commands active after StrictMode repeats effect setup", () => {
    const { result } = renderHook(useWordsAudioCheck, {
      wrapper: ({ children }) => createElement(StrictMode, null, children),
    });
    const registered = result.current.commands;
    act(() => {
      expect(registered.start()).toBe(true);
      registered.stop();
      expect(registered.resume()).toBe(true);
    });

    expect(result.current.commands).toBe(registered);
    expect(result.current.state.isPlaying).toBe(true);
    expect(speak).toHaveBeenCalledTimes(2);
  });

  it("stops playback on unmount and ignores late completion", () => {
    const { result, unmount } = renderHook(useWordsAudioCheck);
    const registered = result.current.commands;
    act(() => {
      result.current.commands.start();
    });
    const options = requiredArrayElement(speak.mock.calls, 0)[1];
    cancel.mockClear();
    unmount();

    expect(cancel).toHaveBeenCalledExactlyOnceWith();
    act(() => {
      options.onEnd?.();
      options.onError?.("error");
      expect(registered.start()).toBe(false);
      expect(registered.resume()).toBe(false);
      expect(registered.startCategory("action")).toBe(false);
      registered.stop();
    });
    expect(speak).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledExactlyOnceWith();
  });
});
