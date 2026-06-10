// v43.1.93 Bottom Nav Responsiveness + Full Home Tab List Pass

const CACHE_VERSION = "v43.1.93";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

const CACHE_PREFIXES_TO_PURGE = ["static-v", "dynamic-v", "aineo-", "static-43", "dynamic-43"];

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING" || data.type === "AINEO_FORCE_ACTIVATE") {
    self.skipWaiting();
  }
});

async function notifyClients(type, payload = {}) {
  try {
    const clientList = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
    clientList.forEach((client) => client.postMessage({ type, version: CACHE_VERSION, ...payload }));
  } catch (error) {}
}

// Navigation requests are handled by the browser directly.
// This avoids redirected document responses being served by the service worker.


const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/home.html",
  "/about.html",
  "/mission.html",
  "/install.html",
  "/music.html",
  "/albums.html",
  "/album.html",
  "/artists.html",
  "/artist.html",
  "/feedback.html",
  "/contact.html",
  "/style.css?v=43.1.93",
  "/app.js?v=43.1.93",
  "/nav.js?v=43.1.93",
  "/pwa-init.js?v=43.1.93",
  "/manifest.webmanifest?v=43.1.93",
  "/aineo-album-page.js?v=43.1.93",
  "/aineo-config.js?v=43.1.93",
  "/aineo-data.js?v=43.1.93",
  "/aineo-featured.js?v=43.1.93",
  "/aineo-library.js?v=43.1.93",
  "/aineo-lyrics.js?v=43.1.93",
  "/aineo-media-session.js?v=43.1.93",
  "/aineo-offline.js?v=43.1.93",
  "/aineo-player-sheet.js?v=43.1.93",
  "/aineo-playlists.js?v=43.1.93",
  "/aineo-queue.js?v=43.1.93",
  "/aineo-shared.js?v=43.1.93",
  "/aineo-ui.js?v=43.1.93",
  "/album-page.js?v=43.1.93",
  "/albums-page.js?v=43.1.93",
  "/artist-page.js?v=43.1.93",
  "/artists-page.js?v=43.1.93",
  "/contact.js?v=43.1.93",
  "/images/church-logo.png?v=43.1.93",
  "/images/alpena-first-baptist-church.png?v=43.1.93",
  "/images/new-beginnings-cc.jpg?v=43.1.93",
  "/images/wielders-of-the-word.jpg?v=43.1.93"
];

async function safeWarmStaticCache() {
  const cache = await caches.open(STATIC_CACHE);
  await Promise.all(STATIC_ASSETS.map(async (url) => {
    try {
      const request = new Request(url, { cache: "reload" });
      const response = await fetch(request);
      if (response && response.ok && !response.redirected && response.type !== "opaqueredirect") {
        await cache.put(request, response.clone());
      }
    } catch (error) {}
  }));
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(safeWarmStaticCache());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => {
      const isCurrent = key.includes(CACHE_VERSION);
      const isAineoCache = CACHE_PREFIXES_TO_PURGE.some((prefix) => key.includes(prefix));
      if (!isCurrent && isAineoCache) return caches.delete(key);
      if (!isCurrent && (key.startsWith("static-") || key.startsWith("dynamic-"))) return caches.delete(key);
      return Promise.resolve(false);
    }));
    await self.clients.claim();
    await notifyClients("SW_ACTIVATED", { cacheVersion: CACHE_VERSION });
  })());
});

async function networkFirst(request, cacheName, { cacheRedirects = false } = {}) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok && (!response.redirected || cacheRedirects) && response.type !== "opaqueredirect") {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: false });
    if (cached) return cached;
    throw error;
  }
}


async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: false });
  const fetchPromise = fetch(request).then((response) => {
    if (response && response.ok && !response.redirected && response.type !== "opaqueredirect") {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  return cached || fetchPromise || fetch(request);
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: false });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok && !response.redirected && response.type !== "opaqueredirect") {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return cached || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate" || req.destination === "document") {
    return;
  }

  if (url.pathname.includes("/lyrics/") || url.pathname.endsWith("tracks.json") || url.pathname.endsWith("albums.json") || url.pathname.endsWith("lrc-manifest.json")) {
    event.respondWith(networkFirst(req, DYNAMIC_CACHE));
    return;
  }

  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".css") || url.pathname.endsWith(".webmanifest")) {
    event.respondWith(networkFirst(req, STATIC_CACHE));
    return;
  }

  if (url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico)$/i)) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }
});
