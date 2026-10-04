import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { readTsConstArray, readTsStringArray, readTsWordOptions } from "./words-utils.mjs";

await test("word readers validate literal data before exposing typed words", async () => {
  const root = await mkdtemp(join(tmpdir(), "henteko-words-"));
  const file = join(root, "words.ts");
  try {
    await writeFile(
      file,
      'export const WORDS = ["あ", "い"] as const satisfies readonly string[];',
    );
    assert.deepEqual(await readTsStringArray(file, "WORDS"), ["あ", "い"]);
    await assert.rejects(readTsWordOptions(file, "WORDS"), /invalid word option/);

    await writeFile(
      file,
      'export const WORDS = [{ display: "走った", speech: "走りました" }] as const;',
    );
    assert.deepEqual(await readTsWordOptions(file, "WORDS"), [
      { display: "走った", speech: "走りました" },
    ]);
    await assert.rejects(readTsStringArray(file, "WORDS"), /non-string word/);

    await writeFile(file, 'export const WORDS = [{ display: "走った", speech: 1 }] as const;');
    await assert.rejects(readTsWordOptions(file, "WORDS"), /invalid word option/);
    await writeFile(file, "export const WORDS = [null, false, -1, [2]] as const;");
    assert.deepEqual(await readTsConstArray(file, "WORDS"), [null, false, -1, [2]]);

    await writeFile(file, 'export const WORDS = [...["あ"]] as const;');
    await assert.rejects(readTsStringArray(file, "WORDS"), /Unsupported spread element/);
    await writeFile(file, 'export const WORDS = [(() => "あ")()] as const;');
    await assert.rejects(readTsStringArray(file, "WORDS"), /unsupported non-literal syntax/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
