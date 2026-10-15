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

function disposeModel(entry: ModelEntry) {
  void entry.promise.then((tts) => tts.dispose()).catch(() => undefined);
}

function trimModelCache() {
  for (const [path, entry] of modelCache) {
    if (modelCache.size <= MAX_CACHED_MODELS) {
      break;
    }
    // A pending or in-flight synthesis still owns these sessions.
    if (!entry.loaded || entry.users > 0) {
      continue;
    }
    modelCache.delete(path);
    disposeModel(entry);
  }
}

async function withModel<T>(
  modelBasePath: string,
  run: (tts: TextToSpeech, ensureCurrent: () => void) => Promise<T>,
) {
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
        .catch((error: unknown) => {
          if (modelCache.get(path) === next) {
            modelCache.delete(path);
          }
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
  const ensureCurrent = () => {
    if (modelCache.get(path) !== entry) {
      throw new Error("The speech model request was cancelled");
    }
  };
  try {
    const tts = await entry.promise;
    ensureCurrent();
    return await run(tts, ensureCurrent);
  } finally {
    entry.users -= 1;
    if (entry.users === 0 && modelCache.get(path) !== entry) {
      disposeModel(entry);
    }
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
    .catch((error: unknown) => {
      if (styleCache.get(path) === next) {
        styleCache.delete(path);
      }
      throw error;
    });
  styleCache.set(path, next);
  if (styleCache.size > MAX_CACHED_STYLES) {
    const oldestPath = styleCache.keys().next().value;
    if (oldestPath !== undefined && oldestPath !== "") {
      styleCache.delete(oldestPath);
    }
  }
  return next;
}

export function invalidateSupertonic(settings: ModelSettings = DEFAULT_SPEECH_SETTINGS) {
  const path = settings.modelBasePath.replace(/\/+$/, "");
  const entry = modelCache.get(path);
  modelCache.delete(path);
  styleCache.delete(settings.voiceStylePath);
  // Session creation and inference cannot be interrupted by this client. Keep
  // their sessions alive until their owners settle, then release stale results.
  if (entry && entry.users === 0) {
    disposeModel(entry);
  }
}

export async function preloadSupertonic(settings: ModelSettings = DEFAULT_SPEECH_SETTINGS) {
  await Promise.all([
    withModel(settings.modelBasePath, () => Promise.resolve(undefined)),
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
  if (text.trim() === "") {
    throw new Error("text is empty");
  }
  return withModel(modelBasePath, async (tts, ensureCurrent) => {
    const [style, { writeWavFile }] = await Promise.all([
      getStyle(voiceStylePath),
      import("./helper"),
    ]);
    ensureCurrent();
    const result = await tts.call(text, lang, style, totalStep, speed);
    ensureCurrent();
    const durationSec = result.duration[0] ?? 0;
    const sampleCount = Math.max(1, Math.floor(tts.sampleRate * durationSec));
    const wav = result.wav.slice(0, sampleCount);

    const blob = writeWavFile(wav, tts.sampleRate);
    const url = URL.createObjectURL(blob);
    return {
      url,
      durationSec,
      revoke: () => {
        URL.revokeObjectURL(url);
      },
    };
  });
}
