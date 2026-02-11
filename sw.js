const CACHE_NAME = "gacha-pwa-v5";
const ASSETS = [
  "index.html",
  "settings.html",
  "manifest.webmanifest",
  "sw.js",
  "a.png",
  "b.png",
  "c.png",
  "d.png",
  "e.png",
  "a_hit.png",
  "b_hit.png",
  "c_hit.png",
  "d_hit.png",
  "e_hit.png",
  "a_miss.png",
  "b_miss.png",
  "c_miss.png",
  "d_miss.png",
  "e_miss.png",
  "roulette.mp3",
  "atari.mp3",
  "hazure.mp3",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png"
];

const toUrl = (path) => new URL(path, self.location).toString();
const ASSET_URLS = ASSETS.map(toUrl);
const INDEX_URL = toUrl("index.html");
const SETTINGS_URL = toUrl("settings.html");

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSET_URLS))
      .catch((err) => console.warn("SW install cache error", err))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((oldKey) => caches.delete(oldKey))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.headers.has("range")) return;

  if (request.mode === "navigate") {
    if (url.pathname.endsWith("/settings.html")) {
      event.respondWith(
        caches.match(SETTINGS_URL).then((cached) => cached || fetch(request))
      );
      return;
    }
    event.respondWith(
      caches.match(INDEX_URL).then((cached) => cached || fetch(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(INDEX_URL));
    })
  );
});
