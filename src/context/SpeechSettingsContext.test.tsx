import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SPEECH_SETTINGS,
  SPEECH_SETTINGS_STORAGE_KEY,
  type SpeechSettings,
} from "../utils/speechSettings";
import { SpeechSettingsProvider, useSpeechSettings } from "./SpeechSettingsContext";

const modelSettings: SpeechSettings = {
  provider: "supertonic",
  modelBasePath: "https://models.example.com/onnx",
  voiceStylePath: "/voices/F1.json",
};

describe("SpeechSettingsProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to browser speech and safely supports hooks outside the provider", () => {
    const { result } = renderHook(useSpeechSettings);

    expect(result.current.settings).toEqual(DEFAULT_SPEECH_SETTINGS);
    expect(() => result.current.updateSettings(modelSettings)).not.toThrow();
  });

  it("persists the shared choice and restores it when the app mounts again", () => {
    const first = renderHook(useSpeechSettings, { wrapper: SpeechSettingsProvider });
    expect(first.result.current.settings).toEqual(DEFAULT_SPEECH_SETTINGS);

    act(() => first.result.current.updateSettings(modelSettings));
    expect(JSON.parse(window.localStorage.getItem(SPEECH_SETTINGS_STORAGE_KEY) ?? "null")).toEqual(
      modelSettings,
    );
    first.unmount();

    const second = renderHook(useSpeechSettings, { wrapper: SpeechSettingsProvider });
    expect(second.result.current.settings).toEqual(modelSettings);
  });

  it("recovers from corrupt stored JSON with browser defaults", () => {
    window.localStorage.setItem(SPEECH_SETTINGS_STORAGE_KEY, "{broken");

    const { result } = renderHook(useSpeechSettings, { wrapper: SpeechSettingsProvider });

    expect(result.current.settings).toEqual(DEFAULT_SPEECH_SETTINGS);
    expect(JSON.parse(window.localStorage.getItem(SPEECH_SETTINGS_STORAGE_KEY) ?? "null")).toEqual(
      DEFAULT_SPEECH_SETTINGS,
    );
  });

  it("keeps settings usable for this session when storage access is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(useSpeechSettings, { wrapper: SpeechSettingsProvider });
    expect(result.current.settings).toEqual(DEFAULT_SPEECH_SETTINGS);

    act(() => result.current.updateSettings(modelSettings));

    expect(result.current.settings).toEqual(modelSettings);
  });
});
