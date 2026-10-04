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
  if (value.trim().length === 0 || value.includes("#") || (directory && value.includes("?"))) {
    return false;
  }
  try {
    const url = new URL(value, "https://henteko-news.invalid");
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.hash.length === 0 &&
      (!directory || url.search.length === 0)
    );
  } catch {
    return false;
  }
}

export function parseSpeechSettings(value: unknown): SpeechSettings {
  if (value === null || typeof value !== "object") {
    return { ...DEFAULT_SPEECH_SETTINGS };
  }
  const candidateModelBasePath = "modelBasePath" in value ? value.modelBasePath : undefined;
  const candidateVoiceStylePath = "voiceStylePath" in value ? value.voiceStylePath : undefined;
  const modelBasePath =
    typeof candidateModelBasePath === "string" ? candidateModelBasePath.trim() : "";
  const voiceStylePath =
    typeof candidateVoiceStylePath === "string" ? candidateVoiceStylePath.trim() : "";
  return {
    provider: "provider" in value && value.provider === "supertonic" ? "supertonic" : "web-speech",
    modelBasePath: isSpeechAssetPath(modelBasePath, true)
      ? modelBasePath
      : DEFAULT_SPEECH_SETTINGS.modelBasePath,
    voiceStylePath: isSpeechAssetPath(voiceStylePath)
      ? voiceStylePath
      : DEFAULT_SPEECH_SETTINGS.voiceStylePath,
  };
}
