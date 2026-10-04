import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { pwaBuildPlugin } from "./pwa-build.mjs";

await test("a build precaches its chunks and updates only its own content-derived version", async () => {
  const root = await mkdtemp(join(tmpdir(), "henteko-pwa-"));
  try {
    await mkdir(join(root, "public/supertonic"), { recursive: true });
    await mkdir(join(root, "dist"));
    await writeFile(
      join(root, "public/sw.js"),
      'const VERSION = "__BUILD_ID__";\nconst PRECACHE_ASSETS = [];',
    );
    await writeFile(join(root, "public/logo.svg"), "original-logo");
    await writeFile(join(root, "public/supertonic/large.onnx"), "model");
    const plugin = pwaBuildPlugin();
    plugin.configResolved({ root, build: { outDir: "dist" } });
    const bundle = /** @satisfies {import("./pwa-build.mjs").PwaBuildBundle} */ ({
      "assets/app-hash.js": { type: "chunk", code: "original-code" },
      "assets/ort-hash.wasm": { type: "asset", source: new Uint8Array([1, 2, 3]) },
    });
    plugin.writeBundle({}, bundle);
    const first = await readFile(join(root, "dist/sw.js"), "utf8");
    assert.match(first, /\/assets\/app-hash.js/);
    assert.match(first, /\/logo.svg/);
    assert.doesNotMatch(first, /large.onnx|ort-hash.wasm|__BUILD_ID__/);
    plugin.writeBundle({}, bundle);
    assert.equal(await readFile(join(root, "dist/sw.js"), "utf8"), first);
    bundle["assets/app-hash.js"].code = "changed-code";
    plugin.writeBundle({}, bundle);
    const second = await readFile(join(root, "dist/sw.js"), "utf8");
    assert.notEqual(second, first);
    await writeFile(join(root, "public/logo.svg"), "changed-logo");
    plugin.writeBundle({}, bundle);
    assert.notEqual(await readFile(join(root, "dist/sw.js"), "utf8"), second);
    await writeFile(join(root, "public/sw.js"), "missing placeholders");
    assert.throws(() => {
      plugin.writeBundle({}, bundle);
    }, /placeholders/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
