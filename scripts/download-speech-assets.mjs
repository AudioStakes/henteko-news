import { createWriteStream } from "node:fs";
import { access, mkdir, rename, rm, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

// The revision is pinned in the upstream archive's setup guide.
const revision = "aafc6e32416a594460b32413efc49d7fe4ce6d46";
const baseUrl = `https://huggingface.co/supertone-oss-archive/supertonic-3/resolve/${revision}`;
const target = resolve("public/supertonic");
const files = [
  "onnx/tts.json",
  "onnx/unicode_indexer.json",
  "onnx/duration_predictor.onnx",
  "onnx/text_encoder.onnx",
  "onnx/vector_estimator.onnx",
  "onnx/vocoder.onnx",
  "voice_styles/M1.json",
];

async function checkAssets() {
  const missing = [];
  for (const file of files) {
    try {
      await access(resolve(target, file));
      if ((await stat(resolve(target, file))).size === 0) missing.push(file);
    } catch {
      missing.push(file);
    }
  }
  if (missing.length) {
    throw new Error(`Missing speech assets: ${missing.join(", ")}. Run npm run setup:speech.`);
  }
  console.log("All required Supertonic speech assets are present.");
}

if (process.argv.includes("--check")) {
  await checkAssets();
} else {
  console.log(`Downloading Supertonic 3 (${revision}). This downloads large model files.`);
  console.log("Model terms: https://huggingface.co/supertone-oss-archive/supertonic-3");
  // Stream to a temporary file; never leave a partial model at its final path.
  for (const file of files) {
    const output = resolve(target, file);
    const temporary = `${output}.download`;
    await mkdir(dirname(output), { recursive: true });
    try {
      const response = await fetch(`${baseUrl}/${file}`, {
        signal: AbortSignal.timeout(300_000),
      });
      if (!response.ok || !response.body) {
        throw new Error(`Failed to download ${file}: HTTP ${response.status}`);
      }
      await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary));
      if ((await stat(temporary)).size === 0) throw new Error(`Empty model file: ${file}`);
      await rename(temporary, output);
      console.log(`Downloaded ${file}`);
    } finally {
      await rm(temporary, { force: true });
    }
  }
  await checkAssets();
}
