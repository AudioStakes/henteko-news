import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

function stubAudioContext(state: AudioContextState = "running") {
  let onended: (() => void) | null = null;
  const oscillator = {
    type: "sine",
    frequency: {
      setValueAtTime: vi.fn<AudioParam["setValueAtTime"]>(),
      exponentialRampToValueAtTime: vi.fn<AudioParam["exponentialRampToValueAtTime"]>(),
    },
    connect: vi.fn<AudioNode["connect"]>(),
    disconnect: vi.fn<AudioNode["disconnect"]>(),
    start: vi.fn<OscillatorNode["start"]>(),
    stop: vi.fn<OscillatorNode["stop"]>(),
    get onended() {
      return onended;
    },
    set onended(callback: (() => void) | null) {
      onended = callback;
    },
  };
  const gain = {
    gain: {
      setValueAtTime: vi.fn<AudioParam["setValueAtTime"]>(),
      exponentialRampToValueAtTime: vi.fn<AudioParam["exponentialRampToValueAtTime"]>(),
    },
    connect: vi.fn<AudioNode["connect"]>(),
    disconnect: vi.fn<AudioNode["disconnect"]>(),
  };
  const context = {
    state,
    currentTime: 2,
    destination: {},
    resume: vi.fn<AudioContext["resume"]>().mockResolvedValue(undefined),
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gain),
  };
  const AudioContextClass = vi.fn(function mockAudioContext() {
    return context;
  });
  vi.stubGlobal("AudioContext", AudioContextClass);
  return { AudioContextClass, context, oscillator, gain };
}

describe("playChoiceSoundFromUserGesture", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("DEV", true);
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", undefined);
    vi.spyOn(performance, "now").mockReturnValue(1000);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  test("does not throw when Web Audio is unavailable", async () => {
    const { playChoiceSoundFromUserGesture } = await import("./soundEffects");

    expect(() => {
      playChoiceSoundFromUserGesture();
    }).not.toThrow();
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("resumes WebKit audio and schedules playback synchronously inside the gesture", async () => {
    const audio = stubAudioContext("suspended");
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", audio.AudioContextClass);
    const calls: string[] = [];
    audio.context.resume.mockImplementation(() => {
      calls.push("resume");
      return Promise.resolve();
    });
    audio.oscillator.start.mockImplementation(() => calls.push("start"));
    const { playChoiceSoundFromUserGesture } = await import("./soundEffects");

    playChoiceSoundFromUserGesture();

    expect(calls).toStrictEqual(["resume", "start"]);
    expect(audio.oscillator.start).toHaveBeenCalledWith(2);
    expect(audio.oscillator.stop).toHaveBeenCalledWith(2.24);
    expect(audio.oscillator.connect).toHaveBeenCalledWith(audio.gain);
    expect(audio.gain.connect).toHaveBeenCalledWith(audio.context.destination);
  });

  test("debounces repeated gestures for 70ms and reuses the existing audio context", async () => {
    const audio = stubAudioContext();
    const { playChoiceSoundFromUserGesture } = await import("./soundEffects");

    playChoiceSoundFromUserGesture();
    vi.mocked(performance.now).mockReturnValue(1069);
    playChoiceSoundFromUserGesture();
    expect(audio.oscillator.start).toHaveBeenCalledTimes(1);
    vi.mocked(performance.now).mockReturnValue(1070);
    playChoiceSoundFromUserGesture();

    expect(audio.oscillator.start).toHaveBeenCalledTimes(2);
    expect(audio.context.createOscillator).toHaveBeenCalledTimes(2);
    expect(audio.AudioContextClass).toHaveBeenCalledTimes(1);
  });

  test("disconnects both nodes once even if the ended event is delivered twice", async () => {
    const audio = stubAudioContext();
    const { playChoiceSoundFromUserGesture } = await import("./soundEffects");
    playChoiceSoundFromUserGesture();

    audio.oscillator.onended?.();
    audio.oscillator.onended?.();

    expect(audio.oscillator.disconnect).toHaveBeenCalledTimes(1);
    expect(audio.gain.disconnect).toHaveBeenCalledTimes(1);
  });

  test("contains audio context construction failures and reports the cause", async () => {
    const audio = stubAudioContext();
    const failure = new Error("Audio output is unavailable");
    audio.AudioContextClass.mockImplementation(function mockUnavailableAudioContext() {
      throw failure;
    });
    const { playChoiceSoundFromUserGesture } = await import("./soundEffects");

    expect(() => {
      playChoiceSoundFromUserGesture();
    }).not.toThrow();
    expect(audio.context.createOscillator).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith("Failed to play button sound.", failure);
  });

  test("contains a rejected resume without delaying playback or leaking ended nodes", async () => {
    const audio = stubAudioContext("suspended");
    const failure = new Error("Audio activation was rejected");
    audio.context.resume.mockRejectedValue(failure);
    const { playChoiceSoundFromUserGesture } = await import("./soundEffects");

    expect(() => {
      playChoiceSoundFromUserGesture();
    }).not.toThrow();
    expect(audio.oscillator.start).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(console.warn).toHaveBeenCalledWith(
      "Failed to resume AudioContext for button sound.",
      failure,
    );
    audio.oscillator.onended?.();
    expect(audio.oscillator.disconnect).toHaveBeenCalledTimes(1);
    expect(audio.gain.disconnect).toHaveBeenCalledTimes(1);
  });

  test("cleans up a failed start even when one node refuses to disconnect", async () => {
    const audio = stubAudioContext();
    const failure = new Error("Cannot start the oscillator");
    audio.oscillator.start.mockImplementation(() => {
      throw failure;
    });
    audio.oscillator.disconnect.mockImplementation(() => {
      throw new Error("Already disconnected");
    });
    const { playChoiceSoundFromUserGesture } = await import("./soundEffects");

    expect(() => {
      playChoiceSoundFromUserGesture();
    }).not.toThrow();
    audio.oscillator.onended?.();
    expect(audio.oscillator.disconnect).toHaveBeenCalledTimes(1);
    expect(audio.gain.disconnect).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith("Failed to play button sound.", failure);
  });

  test("disconnects an oscillator when gain creation fails", async () => {
    const audio = stubAudioContext();
    const failure = new Error("Cannot create the gain node");
    audio.context.createGain.mockImplementation(() => {
      throw failure;
    });
    const { playChoiceSoundFromUserGesture } = await import("./soundEffects");

    expect(() => {
      playChoiceSoundFromUserGesture();
    }).not.toThrow();
    expect(audio.oscillator.disconnect).toHaveBeenCalledTimes(1);
    expect(audio.gain.disconnect).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith("Failed to play button sound.", failure);
  });
});
