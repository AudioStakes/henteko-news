import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

/** @typedef {{ waitUntil(promise: Promise<unknown>): void }} ActivationEvent */

await test("activating the PWA deletes obsolete app caches and preserves unrelated caches", async () => {
  /** @type {Map<string, (event: ActivationEvent) => void>} */
  const listeners = new Map();
  /** @type {string[]} */
  const deleted = [];
  let claimed = false;
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  runInNewContext(source, {
    self: {
      /** @param {string} name @param {(event: ActivationEvent) => void} handler */
      addEventListener(name, handler) {
        listeners.set(name, handler);
      },
      clients: {
        claim: () => {
          claimed = true;
          return Promise.resolve();
        },
      },
    },
    caches: {
      keys: () =>
        Promise.resolve([
          "unrelated-app",
          "henteko-static-old",
          "henteko-html-old",
          "henteko-static-__BUILD_ID__",
          "henteko-html-__BUILD_ID__",
        ]),
      /** @param {string} name */
      delete(name) {
        deleted.push(name);
        return Promise.resolve(true);
      },
    },
  });
  /** @type {Promise<unknown> | undefined} */
  let activation;
  const activate = listeners.get("activate");
  assert.ok(activate);
  activate({
    waitUntil: (promise) => {
      activation = promise;
    },
  });
  assert.ok(activation);
  await activation;
  assert.deepEqual(deleted.sort(), ["henteko-html-old", "henteko-static-old"]);
  assert.equal(claimed, true);
});
