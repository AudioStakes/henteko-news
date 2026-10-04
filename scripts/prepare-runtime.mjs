import { copyFile, cp, mkdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const source = dirname(require.resolve("onnxruntime-web/wasm"));
const target = resolve("public/onnxruntime");
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const name of ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"]) {
  await copyFile(resolve(source, name), resolve(target, name));
}
await copyFile(resolve("LICENSES/ONNX-Runtime-MIT.txt"), resolve(target, "LICENSE"));
const notices = resolve("public/licenses");
await rm(notices, { recursive: true, force: true });
await cp(resolve("LICENSES"), notices, { recursive: true });
console.log("ONNX Runtime assets and third-party license notices prepared.");
