import type { Style, TextToSpeech } from "./helper";

type SupertonicInput = {
  text: string;
  lang?: string;
  voiceStylePath?: string;
  totalStep?: number;
  speed?: number;
};

type SynthesisResult = {
  url: string;
  revoke: () => void;
  durationSec: number;
};

const DEFAULT_VOICE_STYLE_PATH = "/supertonic/voice_styles/M1.json";
const DEFAULT_LANG = "ja";
const DEFAULT_TOTAL_STEP = 8;
const DEFAULT_SPEED = 1;
const ONNX_DIR = "/supertonic/onnx";

let preloadPromise: Promise<void> | null = null;
let ttsPromise: Promise<TextToSpeech> | null = null;
const styleCache = new Map<string, Promise<Style>>();

async function getTts() {
  if (!ttsPromise) {
    ttsPromise = import("./helper")
      .then(({ loadTextToSpeech }) => loadTextToSpeech(ONNX_DIR))
      .then((loaded) => loaded.textToSpeech)
      .catch((error) => {
        ttsPromise = null;
        throw error;
      });
  }
  return ttsPromise;
}

function getStyle(path: string) {
  const cached = styleCache.get(path);
  if (cached) return cached;
  const next = import("./helper")
    .then(({ loadVoiceStyle }) => loadVoiceStyle([path]))
    .catch((error) => {
      styleCache.delete(path);
      throw error;
    });
  styleCache.set(path, next);
  return next;
}

export async function preloadSupertonic() {
  if (!preloadPromise) {
    preloadPromise = Promise.all([getTts(), getStyle(DEFAULT_VOICE_STYLE_PATH)]).then(
      () => undefined,
    ).catch((error) => {
      preloadPromise = null;
      throw error;
    });
  }
  return preloadPromise;
}

export async function synthesizeSupertonicSpeech({
  text,
  lang = DEFAULT_LANG,
  voiceStylePath = DEFAULT_VOICE_STYLE_PATH,
  totalStep = DEFAULT_TOTAL_STEP,
  speed = DEFAULT_SPEED,
}: SupertonicInput): Promise<SynthesisResult> {
  if (!text.trim()) throw new Error("text is empty");
  const [tts, style, { writeWavFile }] = await Promise.all([
    getTts(),
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
}
