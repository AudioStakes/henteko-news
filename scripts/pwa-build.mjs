import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * @typedef {{root: string, build: {outDir: string}}} PwaBuildConfig
 * @typedef {Record<string, {type: "chunk", code: string} | {type: "asset", source: string | Uint8Array}>} PwaBuildBundle
 * @typedef {{name: string, apply: "build", configResolved(config: PwaBuildConfig): void, writeBundle(options: unknown, bundle: PwaBuildBundle): void}} PwaBuildPlugin
 */

/** @param {string} directory @param {string} prefix @returns {string[]} */
function listPublicAssets(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (
      entry.name.startsWith(".") ||
      ["supertonic", "onnxruntime", "licenses", "sw.js", "_headers"].includes(entry.name)
    ) {
      return [];
    }
    const path = `${prefix}${entry.name}`;
    return entry.isDirectory()
      ? listPublicAssets(resolve(directory, entry.name), `${path}/`)
      : [path];
  });
}

/** @returns {PwaBuildPlugin} */
export function pwaBuildPlugin() {
  /** @type {string | undefined} */
  let root;
  /** @type {string | undefined} */
  let outDir;
  return {
    name: "henteko-pwa-build",
    apply: "build",
    configResolved(config) {
      root = config.root;
      outDir = resolve(root, config.build.outDir);
    },
    writeBundle(_options, bundle) {
      if (root === undefined || outDir === undefined) {
        throw new Error("Service Worker build configuration has not been resolved");
      }
      const template = readFileSync(resolve(root, "public/sw.js"), "utf8");
      const hash = createHash("sha256").update(template);
      const publicFiles = listPublicAssets(resolve(root, "public")).sort();
      for (const file of publicFiles) {
        hash.update(file).update(readFileSync(resolve(root, "public", file)));
      }
      const generatedFiles = Object.keys(bundle).sort();
      for (const file of generatedFiles) {
        const output = bundle[file];
        if (!output) {
          throw new Error(`Missing generated build asset: ${file}`);
        }
        hash.update(file).update(output.type === "chunk" ? output.code : output.source);
      }
      const version = hash.digest("hex").slice(0, 20);
      // Vite can also emit the large WASM asset referenced by ONNX Runtime.
      // Text-only offline use should not download it during worker installation.
      const precache = [
        ...publicFiles,
        ...generatedFiles.filter((file) => !file.endsWith(".wasm")),
      ].map((file) => `/${file}`);
      if (
        !(
          template.includes('const VERSION = "__BUILD_ID__";') &&
          template.includes("const PRECACHE_ASSETS = [];")
        )
      ) {
        throw new Error("Service Worker build placeholders are missing");
      }
      const worker = template
        .replace('const VERSION = "__BUILD_ID__";', `const VERSION = "${version}";`)
        .replace(
          "const PRECACHE_ASSETS = [];",
          `const PRECACHE_ASSETS = ${JSON.stringify(precache)};`,
        );
      writeFileSync(resolve(outDir, "sw.js"), worker);
    },
  };
}
