import * as ort from "onnxruntime-web/wasm";

// Serve the runtime from the same origin. One thread also works without COOP/COEP headers.
ort.env.wasm.wasmPaths = `${import.meta.env.BASE_URL}onnxruntime/`;
ort.env.wasm.numThreads = 1;

type Cfgs = {
  ae: { sample_rate: number; base_chunk_size: number };
  ttl: { chunk_compress_factor: number; latent_dim: number };
};

type VoiceStyle = {
  style_ttl: { dims: number[]; data: number[][][] };
  style_dp: { dims: number[]; data: number[][][] };
};

async function loadJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(path, { signal: controller.signal });
    if (!response.ok) throw new Error(`Failed to load ${path}: HTTP ${response.status}`);
    return await response.json();
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export function preprocessSpeechText(text: string, lang: string) {
  const normalized = text.normalize("NFKD").replace(/\s+/g, " ").trim();
  const punctuated = /[.!?。！？]$/.test(normalized) ? normalized : `${normalized}.`;
  return `<${lang}>${punctuated}</${lang}>`;
}

export type WavData = Float32Array | number[];
export type Style = { ttl: ort.Tensor; dp: ort.Tensor };

export type TextToSpeech = {
  sampleRate: number;
  call: (
    text: string,
    lang: string,
    style: Style,
    totalStep: number,
    speed?: number,
  ) => Promise<{ wav: number[]; duration: number[] }>;
};

export function writeWavFile(samples: WavData, sampleRate: number) {
  const pcm = samples instanceof Float32Array ? samples : Float32Array.from(samples);
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + pcm.length * bytesPerSample);
  const view = new DataView(buffer);
  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + pcm.length * bytesPerSample, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, pcm.length * bytesPerSample, true);
  for (let i = 0; i < pcm.length; i += 1) {
    const value = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(44 + i * 2, value < 0 ? value * 0x8000 : value * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export async function loadVoiceStyle(paths: string[]): Promise<Style> {
  if (paths.length === 0) throw new Error("At least one voice style is required");
  const styles = await Promise.all(paths.map((path) => loadJson<VoiceStyle>(path)));
  const ttlDims = styles[0].style_ttl.dims as number[];
  const dpDims = styles[0].style_dp.dims as number[];
  const ttl = new Float32Array(paths.length * ttlDims[1] * ttlDims[2]);
  const dp = new Float32Array(paths.length * dpDims[1] * dpDims[2]);
  styles.forEach((s, i) => {
    ttl.set(s.style_ttl.data.flat(2), i * ttlDims[1] * ttlDims[2]);
    dp.set(s.style_dp.data.flat(2), i * dpDims[1] * dpDims[2]);
  });
  return {
    ttl: new ort.Tensor("float32", ttl, [paths.length, ttlDims[1], ttlDims[2]]),
    dp: new ort.Tensor("float32", dp, [paths.length, dpDims[1], dpDims[2]]),
  };
}

export async function loadTextToSpeech(onnxDir: string) {
  const [cfgs, indexer] = await Promise.all([
    loadJson<Cfgs>(`${onnxDir}/tts.json`),
    loadJson<number[]>(`${onnxDir}/unicode_indexer.json`),
  ]);
  const sessions: ort.InferenceSession[] = [];
  try {
    for (const name of ["duration_predictor", "text_encoder", "vector_estimator", "vocoder"]) {
      sessions.push(
        await ort.InferenceSession.create(`${onnxDir}/${name}.onnx`, {
          executionProviders: ["wasm"],
        }),
      );
    }
  } catch (error) {
    await Promise.allSettled(sessions.map((session) => session.release()));
    throw error;
  }
  const [dp, enc, vec, vocoder] = sessions;

  const tts: TextToSpeech = {
    sampleRate: cfgs.ae.sample_rate,
    call: async (text, lang, style, totalStep, speed = 1) => {
      if (!Number.isFinite(speed) || speed <= 0) throw new Error("Invalid speech speed");
      const processed = preprocessSpeechText(text, lang);
      const ids = Array.from(processed).map((c) => indexer[c.codePointAt(0) ?? -1] ?? -1);
      const idTensor = new ort.Tensor("int64", new BigInt64Array(ids.map((v) => BigInt(v))), [
        1,
        ids.length,
      ]);
      const maskTensor = new ort.Tensor("float32", new Float32Array(ids.length).fill(1), [
        1,
        1,
        ids.length,
      ]);
      const d = await dp.run({ text_ids: idTensor, style_dp: style.dp, text_mask: maskTensor });
      const duration = Array.from(d.duration.data as Float32Array).map((v) => v / speed);
      if (!duration.length || duration.some((value) => !Number.isFinite(value) || value <= 0)) {
        throw new Error("The speech model returned an invalid duration");
      }
      const encOut = await enc.run({
        text_ids: idTensor,
        style_ttl: style.ttl,
        text_mask: maskTensor,
      });
      const latentLen = Math.max(
        1,
        Math.ceil(
          (duration[0] * cfgs.ae.sample_rate) /
            (cfgs.ae.base_chunk_size * cfgs.ttl.chunk_compress_factor),
        ),
      );
      let xt: Float32Array = Float32Array.from(
        { length: cfgs.ttl.latent_dim * cfgs.ttl.chunk_compress_factor * latentLen },
        // Supertonic expects Gaussian noise (Box-Muller), not a uniform distribution.
        () =>
          Math.sqrt(-2 * Math.log(Math.max(0.0001, Math.random()))) *
          Math.cos(2 * Math.PI * Math.random()),
      );
      const latentMask = new ort.Tensor("float32", new Float32Array(latentLen).fill(1), [
        1,
        1,
        latentLen,
      ]);
      for (let step = 0; step < totalStep; step += 1) {
        const out = await vec.run({
          noisy_latent: new ort.Tensor("float32", xt, [
            1,
            cfgs.ttl.latent_dim * cfgs.ttl.chunk_compress_factor,
            latentLen,
          ]),
          text_emb: encOut.text_emb,
          style_ttl: style.ttl,
          latent_mask: latentMask,
          text_mask: maskTensor,
          current_step: new ort.Tensor("float32", new Float32Array([step]), [1]),
          total_step: new ort.Tensor("float32", new Float32Array([totalStep]), [1]),
        });
        xt = out.denoised_latent.data as Float32Array;
      }
      const wavOut = await vocoder.run({
        latent: new ort.Tensor("float32", xt, [
          1,
          cfgs.ttl.latent_dim * cfgs.ttl.chunk_compress_factor,
          latentLen,
        ]),
      });
      return { wav: Array.from(wavOut.wav_tts.data as Float32Array), duration };
    },
  };
  return { textToSpeech: tts, cfgs };
}
