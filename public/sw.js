const SERVICE_WORKER_URL = new URL(self.location.href);
const VERSION =
  SERVICE_WORKER_URL.searchParams.get("v") ||
  SERVICE_WORKER_URL.searchParams.get("version") ||
  SERVICE_WORKER_URL.href;
const STATIC_CACHE = `henteko-static-${VERSION}`;
const HTML_CACHE = `henteko-html-${VERSION}`;
const STATIC_ASSETS = [
  "/assets/bg-studio.webp",
  "/assets/header-logo.webp",
  "/robots.txt",
  "/sitemap.xml",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => ![STATIC_CACHE, HTML_CACHE].includes(k)).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!["http:", "https:"].includes(url.protocol)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res?.ok) {
            event.waitUntil(caches.open(HTML_CACHE).then((c) => c.put("/index.html", res.clone())));
          }
          return res;
        })
        .catch(async () => (await caches.match("/index.html")) || Response.error()),
    );
    return;
  }
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cacheKey = url.pathname;
        const cached = await cache.match(cacheKey, { ignoreVary: true });
        if (cached) return cached;

        const res = await fetch(request);
        if (res?.ok) {
          event.waitUntil(cache.put(cacheKey, res.clone()));
        }
        return res;
      })(),
    );
  }
});
