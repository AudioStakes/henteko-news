import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { ESLint } from "eslint";
import { getFileInfo } from "prettier";

const eslint = new ESLint();
const probes = [
  {
    name: "unhandled promises fail even when prefixed with void",
    filePath: "src/utils/speechSettings.ts",
    source: "void Promise.reject(new Error('probe'));\n",
    rule: "@typescript-eslint/no-floating-promises",
  },
  {
    name: "unvalidated JSON cannot cross a typed boundary",
    filePath: "src/utils/speechSettings.ts",
    source: "const value = JSON.parse('{}'); console.log(value.field);\n",
    rule: "@typescript-eslint/no-unsafe-assignment",
  },
  {
    name: "focused unit tests fail",
    filePath: "src/utils/speechSettings.test.ts",
    source:
      "import { expect, it } from 'vitest'; it.only('probe', () => { expect(1).toBe(1); });\n",
    rule: "vitest/no-focused-tests",
  },
  ...["ts-nocheck", "ts-ignore", "ts-expect-error"].map((directive) => ({
    name: `${directive} cannot suppress type safety`,
    filePath: "src/utils/speechSettings.ts",
    source: `// @${directive}\nexport const value: number = 'invalid';\n`,
    rule: "@typescript-eslint/ban-ts-comment",
  })),
  {
    name: "JavaScript build implementation is checked alongside its types",
    filePath: "scripts/pwa-build.mjs",
    source: "const value = JSON.parse('{}'); console.log(value.field);\n",
    rule: "@typescript-eslint/no-unsafe-assignment",
  },
  {
    name: "lint configuration itself receives typed checks",
    filePath: "eslint.config.mjs",
    source: "const value = JSON.parse('{}'); console.log(value.field);\n",
    rule: "@typescript-eslint/no-unsafe-assignment",
  },
  {
    name: "browser assertions must be awaited",
    filePath: "tests/game.spec.ts",
    source:
      "import { test, expect } from '@playwright/test'; test('probe', async ({ page }) => { expect(page.getByRole('button')).toBeVisible(); });\n",
    rule: "playwright/missing-playwright-await",
  },
  {
    name: "focused Node test options fail",
    filePath: "scripts/pwa-build.test.mjs",
    source: "import { test } from 'node:test'; await test('probe', { only: true }, () => {});\n",
    rule: "no-restricted-syntax",
  },
  {
    name: "conditional browser test skips fail outside model smoke tests",
    filePath: "tests/game.spec.ts",
    source: "import { test } from '@playwright/test'; test.skip(true, 'disabled');\n",
    rule: "playwright/no-skipped-test",
  },
  {
    name: "model smoke tests cannot be permanently skipped",
    filePath: "tests/speech.spec.ts",
    source: "import { test } from '@playwright/test'; test.skip(true, 'disabled');\n",
    rule: "playwright/no-skipped-test",
  },
  {
    name: "string-key Node test skips fail",
    filePath: "scripts/pwa-build.test.mjs",
    source: "import { test } from 'node:test'; await test('probe', { 'skip': true }, () => {});\n",
    rule: "no-restricted-syntax",
  },
  {
    name: "aliased Node test selection cannot escape the gate",
    filePath: "scripts/pwa-build.test.mjs",
    source:
      "import { test as nodeTest } from 'node:test'; await nodeTest.skip('probe', () => {});\n",
    rule: "no-restricted-syntax",
  },
  {
    name: "Node suite aliases cannot hide skipped tests",
    filePath: "scripts/pwa-build.test.mjs",
    source: "import { suite as group } from 'node:test'; await group.skip('probe', () => {});\n",
    rule: "no-restricted-syntax",
  },
  {
    name: "Node test context cannot skip its test",
    filePath: "scripts/pwa-build.test.mjs",
    source:
      "import { test } from 'node:test'; await test('probe', (context) => { context.skip('disabled'); });\n",
    rule: "no-restricted-syntax",
  },
  {
    name: "Node subtest options cannot hide skipped tests",
    filePath: "scripts/pwa-build.test.mjs",
    source:
      "import { test } from 'node:test'; await test('probe', async (context) => { await context.test('child', { skip: true }, () => {}); });\n",
    rule: "no-restricted-syntax",
  },
  {
    name: "computed Node test skips fail",
    filePath: "scripts/pwa-build.test.mjs",
    source: "import { test } from 'node:test'; await test['skip']('probe', () => {});\n",
    rule: "no-restricted-syntax",
  },
];

for (const { name, filePath, source, rule } of probes) {
  await test(name, async () => {
    const results = await eslint.lintText(source, { filePath });
    const result = results[0];
    assert(result);
    assert(
      result.messages.some((message) => message.ruleId === rule && message.severity === 2),
      `${rule} was not reported: ${JSON.stringify(result.messages)}`,
    );
  });
}

await test("Biome rejects explicit any", () => {
  const directory = mkdtempSync(resolve("src/quality-probe-"));
  const path = join(directory, "probe.ts");
  try {
    writeFileSync(path, "export const value: any = 1;\n");
    const result = spawnSync(
      process.execPath,
      [resolve("node_modules/@biomejs/biome/bin/biome"), "lint", path],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout + result.stderr, /lint\/suspicious\/noExplicitAny/u);
    writeFileSync(path, "export const value: number = 1;\n");
    const valid = spawnSync(
      process.execPath,
      [resolve("node_modules/@biomejs/biome/bin/biome"), "lint", path],
      { encoding: "utf8" },
    );
    assert.equal(valid.status, 0, valid.stderr);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

await test("generated dependencies are excluded and owned declarations are checked", async () => {
  assert.equal(await eslint.isPathIgnored("src/vite-env.d.ts"), false);
  assert.equal(await eslint.isPathIgnored("scripts/word-types.d.mts"), false);
  for (const file of [
    "dist/assets/index.js",
    "public/onnxruntime/ort.min.js",
    "vite.config.d.ts",
  ]) {
    assert.equal(await eslint.isPathIgnored(file), true);
  }
});

await test("Prettier owns documentation and YAML, while Biome owns code", async () => {
  for (const file of ["README.md", "docs/agents/domain.md", ".github/workflows/ci.yml"]) {
    const info = await getFileInfo(file, { ignorePath: ".prettierignore" });
    assert.equal(info.ignored, false, `${file} must be formatted`);
  }
  for (const file of ["src/App.tsx", "src/styles/global.css", "biome.json", "index.html"]) {
    const info = await getFileInfo(file, { ignorePath: ".prettierignore" });
    assert.equal(info.ignored, true, `${file} must have one formatter`);
  }
});

for (const enabled of [false, true]) {
  await test(`model smoke test selection follows RUN_SPEECH_SMOKE=${enabled ? 1 : 0}`, () => {
    const result = spawnSync(
      process.execPath,
      [resolve("node_modules/@playwright/test/cli.js"), "test", "--list"],
      {
        encoding: "utf8",
        env: { ...process.env, RUN_SPEECH_SMOKE: enabled ? "1" : "0" },
      },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.includes("speech.spec.ts:"), enabled, result.stdout);
  });
}
