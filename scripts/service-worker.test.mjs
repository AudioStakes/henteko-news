import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

test("activating the PWA deletes obsolete app caches and preserves unrelated caches", async () => {
  const listeners = new Map();
  const deleted = [];
  let claimed = false;
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  runInNewContext(source, {
    self: {
      addEventListener: (name, handler) => listeners.set(name, handler),
      clients: { claim: async () => { claimed = true; } },
    },
    caches: {
      keys: async () => ["unrelated-app", "henteko-static-old", "henteko-html-old", "henteko-static-__BUILD_ID__", "henteko-html-__BUILD_ID__"],
      delete: async (name) => { deleted.push(name); },
    },
  });
  let activation;
  listeners.get("activate")({ waitUntil: (promise) => { activation = promise; } });
  await activation;
  assert.deepEqual(deleted.sort(), ["henteko-html-old", "henteko-static-old"]);
  assert.equal(claimed, true);
});
