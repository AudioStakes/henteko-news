import { describe, expect, it } from "vitest";
import { DEFAULT_SPEECH_SETTINGS, isSpeechAssetPath, parseSpeechSettings } from "./speechSettings";

describe("speech settings", () => {
  it("defaults to browser speech for missing or corrupt saved settings", () => {
    for (const value of [null, undefined, "supertonic", [], { provider: "unknown" }]) {
      expect(parseSpeechSettings(value)).toEqual(DEFAULT_SPEECH_SETTINGS);
    }
  });

  it("keeps explicitly selected compatible model paths", () => {
    expect(
      parseSpeechSettings({
        provider: "supertonic",
        modelBasePath: " https://models.example.com/custom/onnx/ ",
        voiceStylePath: " /voices/F1.json ",
      }),
    ).toEqual({
      provider: "supertonic",
      modelBasePath: "https://models.example.com/custom/onnx/",
      voiceStylePath: "/voices/F1.json",
    });
  });

  it("rejects unsupported URLs and invalid model folders", () => {
    for (const path of ["", "javascript:alert(1)", "file:///tmp/model", "data:text/plain,model"]) {
      expect(isSpeechAssetPath(path)).toBe(false);
    }
    expect(isSpeechAssetPath("/models?token=abc", true)).toBe(false);
    expect(isSpeechAssetPath("/models#voice", true)).toBe(false);
    expect(isSpeechAssetPath("https://models.example.com/onnx", true)).toBe(true);
    expect(isSpeechAssetPath("/voices/M1.json?version=2")).toBe(true);
    expect(
      parseSpeechSettings({ provider: "supertonic", modelBasePath: "file:///models" }),
    ).toEqual({ ...DEFAULT_SPEECH_SETTINGS, provider: "supertonic" });
  });

  it("rejects empty query and fragment delimiters before appending model filenames", () => {
    for (const modelBasePath of [
      "/models?",
      "/models#",
      "https://models.example.com/onnx?",
      "https://models.example.com/onnx#",
    ]) {
      expect(isSpeechAssetPath(modelBasePath, true)).toBe(false);
      expect(parseSpeechSettings({ provider: "supertonic", modelBasePath }).modelBasePath).toBe(
        DEFAULT_SPEECH_SETTINGS.modelBasePath,
      );
    }
    expect(isSpeechAssetPath("/voices/M1.json#")).toBe(false);
    expect(parseSpeechSettings({ voiceStylePath: "/voices/M1.json#" }).voiceStylePath).toBe(
      DEFAULT_SPEECH_SETTINGS.voiceStylePath,
    );
  });
});
