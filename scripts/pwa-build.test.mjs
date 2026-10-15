import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "vite";
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

await test("Vite commands explicitly select the checked TypeScript configuration", async () => {
  const manifest = /** @type {unknown} */ (
    JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"))
  );
  assert.ok(typeof manifest === "object" && manifest !== null && "scripts" in manifest);
  const scripts = manifest.scripts;
  assert.ok(typeof scripts === "object" && scripts !== null);
  assert.ok("dev" in scripts && "build" in scripts && "preview" in scripts && "test" in scripts);
  for (const command of [scripts.dev, scripts.build, scripts.preview, scripts.test]) {
    assert.ok(typeof command === "string");
    assert.match(command, /(?:^|\s)--config vite\.config\.ts(?:\s|$)/);
  }
});

await test("a Vite build ignores stale JS configuration and precaches its actual JS and CSS", async () => {
  const root = await mkdtemp(join(tmpdir(), "henteko-pwa-vite-"));
  try {
    await mkdir(join(root, "public"));
    await writeFile(
      join(root, "public/sw.js"),
      'const VERSION = "__BUILD_ID__";\nconst PRECACHE_ASSETS = [];',
    );
    await writeFile(
      join(root, "index.html"),
      '<!doctype html><html><body><script type="module" src="/main.js"></script></body></html>',
    );
    await writeFile(
      join(root, "main.js"),
      'import "./style.css"; document.body.dataset["ready"] = "true";',
    );
    await writeFile(join(root, "style.css"), "body { color: #123; }");
    await writeFile(join(root, "vite.config.js"), "export default {};");
    const pluginPath = fileURLToPath(new URL("./pwa-build.mjs", import.meta.url));
    await writeFile(
      join(root, "vite.config.ts"),
      `import { pwaBuildPlugin } from ${JSON.stringify(pluginPath)}; export default { plugins: [pwaBuildPlugin()] };`,
    );

    await build({ root, configFile: join(root, "vite.config.ts"), logLevel: "silent" });

    const worker = await readFile(join(root, "dist/sw.js"), "utf8");
    const html = await readFile(join(root, "dist/index.html"), "utf8");
    assert.doesNotMatch(worker, /__BUILD_ID__|PRECACHE_ASSETS = \[\]/);
    const assets = Array.from(
      html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g),
      (match) => match[1],
    );
    assert.equal(assets.length, 2);
    for (const asset of assets) {
      assert.ok(asset !== undefined);
      assert.ok(worker.includes(JSON.stringify(asset)), `Missing precached asset: ${asset}`);
      assert.ok((await readFile(join(root, "dist", asset))).length > 0);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
