import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

/** @typedef {{ waitUntil(promise: Promise<unknown>): void }} ActivationEvent */
/** @typedef {ActivationEvent & { request: { method: string, mode: string, url: string }, respondWith(promise: Promise<Response>): void }} NavigationEvent */

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

await test("online navigation preserves install-time HTML for offline fallback", async () => {
  /** @type {Map<string, (event: NavigationEvent) => void>} */
  const listeners = new Map();
  const installedHtml = '<script src="/assets/installed-version.js"></script>';
  const onlineHtml = '<script src="/assets/new-version.js"></script>';
  let cachedHtml = new Response(installedHtml);
  let offline = false;
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  runInNewContext(source, {
    self: {
      /** @param {string} name @param {(event: NavigationEvent) => void} handler */
      addEventListener(name, handler) {
        listeners.set(name, handler);
      },
      location: { origin: "https://example.test" },
    },
    caches: {
      /** @param {string} name */
      open(name) {
        assert.equal(name, "henteko-html-__BUILD_ID__");
        return Promise.resolve({
          match: () => Promise.resolve(cachedHtml.clone()),
          /** @param {string} key @param {Response} response */
          put(key, response) {
            assert.equal(key, "/index.html");
            cachedHtml = response;
            return Promise.resolve();
          },
        });
      },
    },
    fetch: () =>
      offline
        ? Promise.reject(new TypeError("Offline"))
        : Promise.resolve(new Response(onlineHtml)),
    URL,
    Response,
  });
  const handleFetch = listeners.get("fetch");

  async function navigate() {
    /** @type {Promise<Response> | undefined} */
    let response;
    /** @type {Promise<unknown>[]} */
    const pending = [];
    assert.ok(handleFetch);
    handleFetch({
      request: { method: "GET", mode: "navigate", url: "https://example.test/" },
      respondWith: (promise) => {
        response = promise;
      },
      waitUntil: (promise) => {
        pending.push(promise);
      },
    });
    assert.ok(response);
    const result = await response;
    await Promise.all(pending);
    return result.text();
  }

  assert.equal(await navigate(), onlineHtml);
  offline = true;
  assert.equal(await navigate(), installedHtml);
});
