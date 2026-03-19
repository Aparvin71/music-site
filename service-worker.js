
const CACHE_VERSION = "v9.05";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const AUDIO_CACHE = `audio-${CACHE_VERSION}`;
const COVER_CACHE = `covers-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./about.html",
  "./contact.html",
  "./style.css",
  "./app.js",
  "./contact.js",
  "./tracks.json",
  "./manifest.webmanifest",
  "./pwa-init.js",
  "./icons/icon-64.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./images/aineo-music.png",
  "./images/church-logo.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => Promise.all(APP_SHELL.map(url => cache.add(url).catch(() => null))))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => {
      if (![STATIC_CACHE, RUNTIME_CACHE, AUDIO_CACHE, COVER_CACHE].includes(key)) {
        return caches.delete(key);
      }
      return null;
    }));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (data.type === "CACHE_AUDIO_URLS") {
    const urls = Array.isArray(data.urls) ? data.urls : [];
    event.waitUntil(cacheUrls(AUDIO_CACHE, urls));
  }
  if (data.type === "CACHE_COVER_URLS") {
    const urls = Array.isArray(data.urls) ? data.urls : [];
    event.waitUntil(cacheUrls(COVER_CACHE, urls));
  }
});

async function cacheUrls(cacheName, urls) {
  const cache = await caches.open(cacheName);
  await Promise.all(urls.filter(Boolean).map(async url => {
    try {
      const req = new Request(url, { mode: "cors" });
      const res = await fetch(req);
      if (res.ok) await cache.put(req, res.clone());
    } catch (_) {}
  }));
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.headers.has("range")) return;

  const url = new URL(req.url);
  const isAudio = req.destination === "audio" || url.pathname.endsWith(".mp3");
  const isImage = req.destination === "image" || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(url.pathname);
  const isTracksJson = url.pathname.endsWith("/tracks.json") || url.pathname.endsWith("tracks.json");

  if (isAudio) {
    event.respondWith(cacheFirst(req, AUDIO_CACHE));
    return;
  }

  if (isImage) {
    event.respondWith(staleWhileRevalidate(req, COVER_CACHE));
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, RUNTIME_CACHE, "./index.html"));
    return;
  }

  if (isTracksJson) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.ok) await cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkPromise = fetch(req).then(res => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return cached || networkPromise || fetch(req);
}

async function networkFirst(req, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (_) {
    const cached = await cache.match(req);
    return cached || caches.match(fallbackUrl);
  }
}
