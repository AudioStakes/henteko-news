import { describe, expect, it } from "vitest";
import { DEFAULT_SPEECH_SETTINGS, validateSpeechSettings } from "./speechSettings";

const modelSettings = {
  provider: "supertonic",
  modelBasePath: "/models/onnx",
  voiceStylePath: "/voices/M1.json",
};

describe("speech settings API validation", () => {
  it("prevents callers from mutating validated settings or browser defaults", () => {
    const result = validateSpeechSettings(modelSettings);
    if (!result.ok) {
      throw new Error("Expected valid model settings");
    }

    expect(Object.isFrozen(result.settings)).toBe(true);
    expect(Reflect.set(result.settings, "provider", "unknown")).toBe(false);
    expect(result.settings.provider).toBe("supertonic");
    expect(Object.isFrozen(DEFAULT_SPEECH_SETTINGS)).toBe(true);
    expect(Reflect.set(DEFAULT_SPEECH_SETTINGS, "provider", "supertonic")).toBe(false);
  });
  it("normalizes valid model paths without changing display input", () => {
    const input = {
      ...modelSettings,
      modelBasePath: "  https://models.example.com/onnx/  ",
      voiceStylePath: "  voices/F1.json?version=2  ",
    };

    expect(validateSpeechSettings(input)).toStrictEqual({
      ok: true,
      settings: {
        provider: "supertonic",
        modelBasePath: "https://models.example.com/onnx/",
        voiceStylePath: "voices/F1.json?version=2",
      },
    });
    expect(input.modelBasePath).toBe("  https://models.example.com/onnx/  ");
  });

  it.each([
    { input: null },
    { input: undefined },
    { input: true },
    { input: 1 },
    { input: "supertonic" },
    { input: [] },
    { input: {} },
    { input: { provider: "unknown" } },
  ])("rejects malformed settings without choosing a fallback provider: $input", ({ input }) => {
    const result = validateSpeechSettings(input);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected invalid settings");
    }
    expect(result.errors.provider).toBeTruthy();
  });

  it.each([
    undefined,
    null,
    1,
    "",
    "   ",
    "javascript:alert(1)",
    "file:///models/onnx",
    "data:text/plain,model",
    "/models?",
    "/models?version=1",
    "/models#",
    "/models#voice",
  ])("rejects an invalid model folder instead of silently replacing it: %j", (modelBasePath) => {
    const result = validateSpeechSettings({ ...modelSettings, modelBasePath });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected invalid model folder");
    }
    expect(result.errors.modelBasePath).toBeTruthy();
    expect(result.errors.voiceStylePath).toBe("");
  });

  it.each([undefined, null, 1, "", "   ", "file:///voice.json", "/voices/M1.json#"])(
    "rejects an invalid voice path instead of silently replacing it: %j",
    (voiceStylePath) => {
      const result = validateSpeechSettings({ ...modelSettings, voiceStylePath });

      expect(result.ok).toBe(false);
      if (result.ok) {
        throw new Error("Expected invalid voice path");
      }
      expect(result.errors.modelBasePath).toBe("");
      expect(result.errors.voiceStylePath).toBeTruthy();
    },
  );

  it("returns both invalid field errors in one response", () => {
    const result = validateSpeechSettings({ provider: "supertonic" });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected missing model settings");
    }
    expect(result.errors.modelBasePath).toBeTruthy();
    expect(result.errors.voiceStylePath).toBeTruthy();
  });

  it("saves browser defaults and permits browser speech without model paths", () => {
    expect(validateSpeechSettings(DEFAULT_SPEECH_SETTINGS)).toStrictEqual({
      ok: true,
      settings: DEFAULT_SPEECH_SETTINGS,
    });
    expect(validateSpeechSettings({ provider: "web-speech" })).toStrictEqual({
      ok: true,
      settings: DEFAULT_SPEECH_SETTINGS,
    });
    expect(
      validateSpeechSettings({
        provider: "web-speech",
        modelBasePath: "file:///models",
        voiceStylePath: "",
      }),
    ).toStrictEqual({ ok: true, settings: DEFAULT_SPEECH_SETTINGS });
  });
});
