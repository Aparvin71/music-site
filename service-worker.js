// v43.1.37 Service Worker Strategy Cleanup

const CACHE_VERSION = "v43.1.37";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const ANALYSIS_CACHE = `analysis-${CACHE_VERSION}`;

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
  "/style.css",
  "/app.js",
  "/nav.js",
  "/pwa-init.js",
  "/manifest.webmanifest",
  "/aineo-album-page.js",
  "/aineo-config.js",
  "/aineo-data.js",
  "/aineo-featured.js",
  "/aineo-library.js",
  "/aineo-lyrics.js",
  "/aineo-media-session.js",
  "/aineo-offline.js",
  "/aineo-player-sheet.js",
  "/aineo-playlists.js",
  "/aineo-queue.js",
  "/aineo-shared.js",
  "/aineo-ui.js",
  "/album-page.js",
  "/albums-page.js",
  "/artist-page.js",
  "/artists-page.js",
  "/contact.js"
];

async function safeWarmStaticCache() {
  const cache = await caches.open(STATIC_CACHE);
  await Promise.all(STATIC_ASSETS.map(async (url) => {
    try {
      const response = await fetch(url, { cache: "no-cache" });
      if (response && response.ok) {
        await cache.put(url, response.clone());
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
      if (!key.includes(CACHE_VERSION)) {
        return caches.delete(key);
      }
      return Promise.resolve(false);
    }));
    await self.clients.claim();
  })());
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  return cached || fetchPromise || fetch(request);
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  if (url.pathname.includes("/lyrics/") || url.pathname.endsWith("tracks.json") || url.pathname.endsWith("albums.json")) {
    event.respondWith(networkFirst(req, DYNAMIC_CACHE));
    return;
  }

  if (url.pathname.includes("/analysis/")) {
    event.respondWith(staleWhileRevalidate(req, ANALYSIS_CACHE));
    return;
  }

  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".css") || url.pathname.endsWith(".html") || url.pathname === "/" || url.pathname.endsWith(".webmanifest")) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }
});
