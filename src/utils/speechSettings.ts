export type SpeechProvider = "web-speech" | "supertonic";

export type SpeechSettings = {
  provider: SpeechProvider;
  modelBasePath: string;
  voiceStylePath: string;
};

export const SPEECH_SETTINGS_STORAGE_KEY = "henteko-news:speech-settings";

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  provider: "web-speech",
  modelBasePath: "/supertonic/onnx",
  voiceStylePath: "/supertonic/voice_styles/M1.json",
};

export function isSpeechAssetPath(value: string, directory = false) {
  if (!value.trim()) return false;
  try {
    const url = new URL(value, "https://henteko-news.invalid");
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      !url.hash &&
      (!directory || !url.search)
    );
  } catch {
    return false;
  }
}

export function parseSpeechSettings(value: unknown): SpeechSettings {
  if (!value || typeof value !== "object") return { ...DEFAULT_SPEECH_SETTINGS };
  const candidate = value as Record<string, unknown>;
  const modelBasePath =
    typeof candidate.modelBasePath === "string" ? candidate.modelBasePath.trim() : "";
  const voiceStylePath =
    typeof candidate.voiceStylePath === "string" ? candidate.voiceStylePath.trim() : "";
  return {
    provider: candidate.provider === "supertonic" ? "supertonic" : "web-speech",
    modelBasePath: isSpeechAssetPath(modelBasePath, true)
      ? modelBasePath
      : DEFAULT_SPEECH_SETTINGS.modelBasePath,
    voiceStylePath: isSpeechAssetPath(voiceStylePath)
      ? voiceStylePath
      : DEFAULT_SPEECH_SETTINGS.voiceStylePath,
  };
}
