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

await test("navigation preserves network responses and limits offline app fallback to known paths", async () => {
  /** @type {Map<string, (event: NavigationEvent) => void>} */
  const listeners = new Map();
  const installedHtml = '<script src="/assets/installed-version.js"></script>';
  const onlineHtml = '<script src="/assets/new-version.js"></script>';
  const notFoundHtml = "<h1>404</h1>";
  const robots = "User-agent: *";
  let cachedHtml = new Response(installedHtml);
  let offline = false;
  let onlineStatus = 200;
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
        return Promise.resolve({
          /** @param {string} key */
          match(key) {
            if (name === "henteko-html-__BUILD_ID__") {
              assert.equal(key, "/index.html");
              return Promise.resolve(cachedHtml.clone());
            }
            assert.equal(name, "henteko-static-__BUILD_ID__");
            if (key === "/404.html") {
              return Promise.resolve(
                new Response(notFoundHtml, { headers: { "Content-Type": "text/html" } }),
              );
            }
            return Promise.resolve(key === "/robots.txt" ? new Response(robots) : undefined);
          },
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
        : Promise.resolve(new Response(onlineHtml, { status: onlineStatus })),
    URL,
    Response,
  });
  const handleFetch = listeners.get("fetch");

  /** @param {string} path @param {number} status */
  async function navigate(path = "/", status = 200) {
    /** @type {Promise<Response> | undefined} */
    let response;
    /** @type {Promise<unknown>[]} */
    const pending = [];
    assert.ok(handleFetch);
    handleFetch({
      request: { method: "GET", mode: "navigate", url: `https://example.test${path}` },
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
    assert.equal(result.status, status);
    if (offline && status === 404) {
      assert.equal(result.headers.get("Content-Type"), "text/html");
    }
    return result.text();
  }

  assert.equal(await navigate(), onlineHtml);
  onlineStatus = 404;
  assert.equal(await navigate("/does-not-exist", 404), onlineHtml);
  offline = true;
  for (const path of ["/", "/index.html?debugResult=1", "/words-audio-check?offline=1"]) {
    assert.equal(await navigate(path), installedHtml);
  }
  assert.equal(await navigate("/robots.txt?offline=1"), robots);
  for (const path of ["/does-not-exist/nested?offline=1", "/assets/does-not-exist.js"]) {
    assert.equal(await navigate(path, 404), notFoundHtml);
  }
});
