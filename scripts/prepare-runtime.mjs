import { copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const source = dirname(require.resolve("onnxruntime-web/wasm"));
const target = resolve("public/onnxruntime");
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const name of ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"]) {
  await copyFile(resolve(source, name), resolve(target, name));
}
await copyFile(resolve(source, "../LICENSE"), resolve(target, "LICENSE"));
console.log("ONNX Runtime assets prepared from the installed, locked dependency.");
