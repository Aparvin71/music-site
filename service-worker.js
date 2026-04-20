// v43.1.64 Runtime Cleanup + Service Worker Cache Refresh

const CACHE_VERSION = "v43.1.64";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

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
  "/style.css?v=43.1.64",
  "/app.js?v=43.1.64",
  "/nav.js?v=43.1.64",
  "/pwa-init.js?v=43.1.64",
  "/manifest.webmanifest?v=43.1.64",
  "/aineo-album-page.js?v=43.1.64",
  "/aineo-config.js?v=43.1.64",
  "/aineo-data.js?v=43.1.64",
  "/aineo-featured.js?v=43.1.64",
  "/aineo-library.js?v=43.1.64",
  "/aineo-lyrics.js?v=43.1.64",
  "/aineo-media-session.js?v=43.1.64",
  "/aineo-offline.js?v=43.1.64",
  "/aineo-player-sheet.js?v=43.1.64",
  "/aineo-playlists.js?v=43.1.64",
  "/aineo-queue.js?v=43.1.64",
  "/aineo-shared.js?v=43.1.64",
  "/aineo-ui.js?v=43.1.64",
  "/album-page.js?v=43.1.64",
  "/albums-page.js?v=43.1.64",
  "/artist-page.js?v=43.1.64",
  "/artists-page.js?v=43.1.64",
  "/contact.js?v=43.1.64"
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
      if (!key.includes(CACHE_VERSION)) {
        return caches.delete(key);
      }
      return Promise.resolve(false);
    }));
    await self.clients.claim();
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

  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".css") || url.pathname === "/" || url.pathname.endsWith(".webmanifest") || url.pathname.endsWith(".png") || url.pathname.endsWith(".ico")) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }
});
