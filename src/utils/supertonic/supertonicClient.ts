import { DEFAULT_SPEECH_SETTINGS, type SpeechSettings } from "../speechSettings";
import type { Style, TextToSpeech } from "./helper";

type ModelSettings = Pick<SpeechSettings, "modelBasePath" | "voiceStylePath">;

type SupertonicInput = {
  text: string;
  lang?: string;
  modelBasePath?: string;
  voiceStylePath?: string;
  totalStep?: number;
  speed?: number;
};

type SynthesisResult = {
  url: string;
  revoke: () => void;
  durationSec: number;
};

const MAX_CACHED_MODELS = 2;
const MAX_CACHED_STYLES = 4;
type ModelEntry = {
  promise: Promise<TextToSpeech>;
  users: number;
  loaded: boolean;
};
const modelCache = new Map<string, ModelEntry>();
const styleCache = new Map<string, Promise<Style>>();

function trimModelCache() {
  for (const [path, entry] of modelCache) {
    if (modelCache.size <= MAX_CACHED_MODELS) break;
    // A pending or in-flight synthesis still owns these sessions.
    if (!entry.loaded || entry.users > 0) continue;
    modelCache.delete(path);
    void entry.promise.then((tts) => tts.dispose()).catch(() => undefined);
  }
}

async function withModel<T>(modelBasePath: string, use: (tts: TextToSpeech) => Promise<T>) {
  const path = modelBasePath.replace(/\/+$/, "");
  let entry = modelCache.get(path);
  if (!entry) {
    const next: ModelEntry = {
      promise: import("./helper")
        .then(({ loadTextToSpeech }) => loadTextToSpeech(path))
        .then((loaded) => {
          next.loaded = true;
          return loaded.textToSpeech;
        })
        .catch((error) => {
          if (modelCache.get(path) === next) modelCache.delete(path);
          throw error;
        }),
      users: 0,
      loaded: false,
    };
    entry = next;
  }
  // Move the requested model to the most recently used end of the cache.
  modelCache.delete(path);
  modelCache.set(path, entry);
  entry.users += 1;
  try {
    return await use(await entry.promise);
  } finally {
    entry.users -= 1;
    trimModelCache();
  }
}

function getStyle(path: string) {
  const cached = styleCache.get(path);
  if (cached) {
    styleCache.delete(path);
    styleCache.set(path, cached);
    return cached;
  }
  const next = import("./helper")
    .then(({ loadVoiceStyle }) => loadVoiceStyle([path]))
    .catch((error) => {
      if (styleCache.get(path) === next) styleCache.delete(path);
      throw error;
    });
  styleCache.set(path, next);
  if (styleCache.size > MAX_CACHED_STYLES) {
    const oldestPath = styleCache.keys().next().value;
    if (oldestPath) styleCache.delete(oldestPath);
  }
  return next;
}

export async function preloadSupertonic(settings: ModelSettings = DEFAULT_SPEECH_SETTINGS) {
  await Promise.all([
    withModel(settings.modelBasePath, async () => undefined),
    getStyle(settings.voiceStylePath),
  ]);
}

export async function synthesizeSupertonicSpeech({
  text,
  lang = "ja",
  modelBasePath = DEFAULT_SPEECH_SETTINGS.modelBasePath,
  voiceStylePath = DEFAULT_SPEECH_SETTINGS.voiceStylePath,
  totalStep = 8,
  speed = 1,
}: SupertonicInput): Promise<SynthesisResult> {
  if (!text.trim()) throw new Error("text is empty");
  return withModel(modelBasePath, async (tts) => {
    const [style, { writeWavFile }] = await Promise.all([
      getStyle(voiceStylePath),
      import("./helper"),
    ]);
    const result = await tts.call(text, lang, style, totalStep, speed);
    const durationSec = result.duration[0] ?? 0;
    const sampleCount = Math.max(1, Math.floor(tts.sampleRate * durationSec));
    const wav = result.wav.slice(0, sampleCount);

    const blob = writeWavFile(wav, tts.sampleRate);
    const url = URL.createObjectURL(blob);
    return {
      url,
      durationSec,
      revoke: () => URL.revokeObjectURL(url),
    };
  });
}
