import {
  isSpeechAssetPath,
  parseSpeechSettings,
  type SpeechSettings,
} from "../utils/speechSettings";

export type { SpeechProvider, SpeechSettings } from "../utils/speechSettings";
export { DEFAULT_SPEECH_SETTINGS } from "../utils/speechSettings";

export type SpeechSettingsErrors = {
  provider?: string;
  modelBasePath: string;
  voiceStylePath: string;
};

export type SaveSettingsResult =
  | { ok: true; settings: SpeechSettings }
  | { ok: false; errors: SpeechSettingsErrors };

export type SpeechSettingsApi = Readonly<{
  settings: SpeechSettings;
  saveSettings: (next: unknown) => SaveSettingsResult;
}>;

export function validateSpeechSettings(next: unknown): SaveSettingsResult {
  const candidate = next !== null && typeof next === "object" && !Array.isArray(next) ? next : {};
  const provider = "provider" in candidate ? candidate.provider : undefined;
  const modelBasePath = "modelBasePath" in candidate ? candidate.modelBasePath : undefined;
  const voiceStylePath = "voiceStylePath" in candidate ? candidate.voiceStylePath : undefined;
  const errors: SpeechSettingsErrors = { modelBasePath: "", voiceStylePath: "" };

  if (provider !== "web-speech" && provider !== "supertonic") {
    errors.provider = "読み上げ方式を選んでください。";
  }
  if (provider === "supertonic") {
    if (typeof modelBasePath !== "string" || !isSpeechAssetPath(modelBasePath.trim(), true)) {
      errors.modelBasePath =
        "モデルのフォルダーをパスまたはHTTP(S) URLで入力してください。?や#は使えません。";
    }
    if (typeof voiceStylePath !== "string" || !isSpeechAssetPath(voiceStylePath.trim())) {
      errors.voiceStylePath =
        "声のJSONファイルをパスまたはHTTP(S) URLで入力してください。#は使えません。";
    }
  }
  if (
    errors.provider !== undefined ||
    errors.modelBasePath.length > 0 ||
    errors.voiceStylePath.length > 0
  ) {
    return { ok: false, errors };
  }
  return { ok: true, settings: parseSpeechSettings(candidate) };
}
