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

  it("defaults to browser speech outside the provider and reports unavailable saves", () => {
    const { result } = renderHook(useSpeechSettings);

    expect(result.current.settings).toStrictEqual(DEFAULT_SPEECH_SETTINGS);
    expect(result.current.saveSettings(modelSettings)).toStrictEqual({
      ok: false,
      errors: {
        provider: "音声設定を利用できません。",
        modelBasePath: "",
        voiceStylePath: "",
      },
    });
  });

  it("persists the shared choice and restores it when the app mounts again", () => {
    const first = renderHook(useSpeechSettings, { wrapper: SpeechSettingsProvider });
    expect(first.result.current.settings).toStrictEqual(DEFAULT_SPEECH_SETTINGS);

    act(() => {
      expect(first.result.current.saveSettings(modelSettings)).toStrictEqual({
        ok: true,
        settings: modelSettings,
      });
    });
    expect(
      JSON.parse(window.localStorage.getItem(SPEECH_SETTINGS_STORAGE_KEY) ?? "null"),
    ).toStrictEqual(modelSettings);
    first.unmount();

    const second = renderHook(useSpeechSettings, { wrapper: SpeechSettingsProvider });
    expect(second.result.current.settings).toStrictEqual(modelSettings);
  });

  it("requires the save command to replace or change shared settings", () => {
    const { result } = renderHook(useSpeechSettings, { wrapper: SpeechSettingsProvider });

    expect(Reflect.set(result.current, "settings", modelSettings)).toBe(false);
    expect(Reflect.set(result.current.settings, "provider", "supertonic")).toBe(false);
    expect(result.current.settings).toBe(DEFAULT_SPEECH_SETTINGS);
    expect(
      JSON.parse(window.localStorage.getItem(SPEECH_SETTINGS_STORAGE_KEY) ?? "null"),
    ).toStrictEqual(DEFAULT_SPEECH_SETTINGS);
  });

  it("recovers from corrupt stored JSON with browser defaults", () => {
    window.localStorage.setItem(SPEECH_SETTINGS_STORAGE_KEY, "{broken");

    const { result } = renderHook(useSpeechSettings, { wrapper: SpeechSettingsProvider });

    expect(result.current.settings).toStrictEqual(DEFAULT_SPEECH_SETTINGS);
    expect(
      JSON.parse(window.localStorage.getItem(SPEECH_SETTINGS_STORAGE_KEY) ?? "null"),
    ).toStrictEqual(DEFAULT_SPEECH_SETTINGS);
  });

  it("keeps settings usable for this session when storage access is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(useSpeechSettings, { wrapper: SpeechSettingsProvider });
    expect(result.current.settings).toStrictEqual(DEFAULT_SPEECH_SETTINGS);

    act(() => {
      expect(result.current.saveSettings(modelSettings)).toStrictEqual({
        ok: true,
        settings: modelSettings,
      });
    });

    expect(result.current.settings).toStrictEqual(modelSettings);
  });

  it("leaves shared settings and storage unchanged when a save fails validation", () => {
    window.localStorage.setItem(SPEECH_SETTINGS_STORAGE_KEY, JSON.stringify(modelSettings));
    const { result } = renderHook(useSpeechSettings, { wrapper: SpeechSettingsProvider });

    act(() => {
      expect(
        result.current.saveSettings({ ...modelSettings, modelBasePath: "file:///models" }).ok,
      ).toBe(false);
      expect(result.current.saveSettings({ provider: "unknown" }).ok).toBe(false);
    });

    expect(result.current.settings).toStrictEqual(modelSettings);
    expect(
      JSON.parse(window.localStorage.getItem(SPEECH_SETTINGS_STORAGE_KEY) ?? "null"),
    ).toStrictEqual(modelSettings);
  });

  it("applies settings for the session when persisted settings cannot be overwritten", () => {
    window.localStorage.setItem(SPEECH_SETTINGS_STORAGE_KEY, JSON.stringify(modelSettings));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    const { result } = renderHook(useSpeechSettings, { wrapper: SpeechSettingsProvider });

    act(() => {
      expect(result.current.saveSettings(DEFAULT_SPEECH_SETTINGS)).toStrictEqual({
        ok: true,
        settings: DEFAULT_SPEECH_SETTINGS,
      });
    });

    expect(result.current.settings).toStrictEqual(DEFAULT_SPEECH_SETTINGS);
    expect(
      JSON.parse(window.localStorage.getItem(SPEECH_SETTINGS_STORAGE_KEY) ?? "null"),
    ).toStrictEqual(modelSettings);
  });

  it("shares normalized saves immediately with every consumer and supports reset", () => {
    const { result } = renderHook(
      () => ({ first: useSpeechSettings(), second: useSpeechSettings() }),
      { wrapper: SpeechSettingsProvider },
    );

    act(() => {
      result.current.first.saveSettings({
        ...modelSettings,
        modelBasePath: `  ${modelSettings.modelBasePath}  `,
      });
    });
    expect(result.current.first.settings).toStrictEqual(modelSettings);
    expect(result.current.second.settings).toStrictEqual(modelSettings);

    act(() => {
      result.current.second.saveSettings(DEFAULT_SPEECH_SETTINGS);
    });
    expect(result.current.first.settings).toStrictEqual(DEFAULT_SPEECH_SETTINGS);
    expect(result.current.second.settings).toStrictEqual(DEFAULT_SPEECH_SETTINGS);
    expect(
      JSON.parse(window.localStorage.getItem(SPEECH_SETTINGS_STORAGE_KEY) ?? "null"),
    ).toStrictEqual(DEFAULT_SPEECH_SETTINGS);
  });
});
