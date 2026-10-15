import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SpeakOptions } from "../hooks/useSpeech";
import { requiredArrayElement } from "../test/requiredArrayElement";
import { WordsAudioCheckScreen } from "./WordsAudioCheckScreen";

const { speak, cancel } = vi.hoisted(() => ({
  speak: vi.fn<(text: string, options: SpeakOptions) => boolean>(),
  cancel: vi.fn<() => void>(),
}));

vi.mock("../hooks/useSpeech", () => ({
  useSpeech: () => ({ speak, cancel, isSupported: true, settingsKey: "web-speech" }),
}));

describe("WordsAudioCheckScreen", () => {
  beforeEach(() => {
    speak.mockReset().mockReturnValue(true);
    cancel.mockClear();
  });

  it.each(["error", "stop"])("resumes the interrupted word after %s", (interruption) => {
    render(<WordsAudioCheckScreen />);
    fireEvent.click(screen.getByRole("button", { name: "さいしょから かいし" }));
    act(() => {
      requiredArrayElement(speak.mock.calls, 0)[1].onEnd?.();
    });
    act(() => {
      requiredArrayElement(speak.mock.calls, 1)[1].onEnd?.();
    });
    const interruptedWord = requiredArrayElement(speak.mock.calls, 2)[0];

    if (interruption === "error") {
      act(() => {
        requiredArrayElement(speak.mock.calls, 2)[1].onError?.("error");
      });
    } else {
      fireEvent.click(screen.getByRole("button", { name: "ていし" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "とまったところから さいかい" }));

    expect(speak).toHaveBeenCalledTimes(4);
    expect(requiredArrayElement(speak.mock.calls, 3)[0]).toBe(interruptedWord);
  });
});
