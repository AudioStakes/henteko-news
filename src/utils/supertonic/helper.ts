type TensorDType = "float32" | "int64";
type Session = { run: (feeds: Record<string, unknown>) => Promise<Record<string, OrtTensor>> };
type SessionOptions = Record<string, unknown>;
type OrtTensor = { data: unknown; dims: number[] };

type OrtNamespace = {
  Tensor: new (dtype: TensorDType, data: Float32Array | BigInt64Array, dims: number[]) => OrtTensor;
  InferenceSession: { create: (path: string, options?: SessionOptions) => Promise<Session> };
};

type Cfgs = {
  ae: { sample_rate: number; base_chunk_size: number };
  ttl: { chunk_compress_factor: number; latent_dim: number };
};

function getOrt(): OrtNamespace {
  const ort = (window as unknown as { ort?: OrtNamespace }).ort;
  if (!ort) throw new Error("onnxruntime-web is not loaded");
  return ort;
}

export type WavData = Float32Array | number[];
export type Style = { ttl: OrtTensor; dp: OrtTensor };

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
  const ort = getOrt();
  const styles = await Promise.all(paths.map((p) => fetch(p).then((r) => r.json())));
  const ttlDims = styles[0].style_ttl.dims as number[];
  const dpDims = styles[0].style_dp.dims as number[];
  const ttl = new Float32Array(paths.length * ttlDims[1] * ttlDims[2]);
  const dp = new Float32Array(paths.length * dpDims[1] * dpDims[2]);
  styles.forEach((s, i) => {
    ttl.set(s.style_ttl.data.flat(Infinity), i * ttlDims[1] * ttlDims[2]);
    dp.set(s.style_dp.data.flat(Infinity), i * dpDims[1] * dpDims[2]);
  });
  return {
    ttl: new ort.Tensor("float32", ttl, [paths.length, ttlDims[1], ttlDims[2]]),
    dp: new ort.Tensor("float32", dp, [paths.length, dpDims[1], dpDims[2]]),
  };
}

export async function loadTextToSpeech(onnxDir: string) {
  const ort = getOrt();
  const cfgs = (await fetch(`${onnxDir}/tts.json`).then((r) => r.json())) as Cfgs;
  const indexer = await fetch(`${onnxDir}/unicode_indexer.json`).then((r) => r.json());
  const options: SessionOptions = { executionProviders: ["webgpu", "wasm"] };
  const [dp, enc, vec, vocoder] = await Promise.all([
    ort.InferenceSession.create(`${onnxDir}/duration_predictor.onnx`, options),
    ort.InferenceSession.create(`${onnxDir}/text_encoder.onnx`, options),
    ort.InferenceSession.create(`${onnxDir}/vector_estimator.onnx`, options),
    ort.InferenceSession.create(`${onnxDir}/vocoder.onnx`, options),
  ]);

  const tts: TextToSpeech = {
    sampleRate: cfgs.ae.sample_rate,
    call: async (text, lang, style, totalStep, speed = 1) => {
      const processed = `<${lang}>${text.normalize("NFKD")}`;
      const ids = Array.from(processed).map(
        (c) => (indexer[String(c.codePointAt(0) ?? -1)] ?? -1) as number,
      );
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
        () => Math.random() * 2 - 1,
      ) as unknown as Float32Array;
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
        xt = out.denoised_latent.data as unknown as Float32Array;
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
