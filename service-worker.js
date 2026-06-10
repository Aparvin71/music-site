// v43.1.99 Bottom Nav Responsiveness + Full Home Tab List Pass

const CACHE_VERSION = "v43.1.99";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const USER_AUDIO_CACHE = "aineo-user-offline-audio";
const USER_ASSET_CACHE = "aineo-user-offline-assets";
const EXTERNAL_MEDIA_HOSTS = ["pub-de889868274142c4924a1b81e51a1d94.r2.dev"];

const CACHE_PREFIXES_TO_PURGE = ["static-v", "dynamic-v", "aineo-", "static-43", "dynamic-43"];

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING" || data.type === "AINEO_FORCE_ACTIVATE") {
    self.skipWaiting();
    return;
  }
  if (data.type === "CACHE_AUDIO_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(cacheUrlList(USER_AUDIO_CACHE, data.urls));
    return;
  }
  if (data.type === "CACHE_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(cacheUrlList(USER_ASSET_CACHE, data.urls));
    return;
  }
  if (data.type === "REMOVE_AUDIO_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(removeUrlList(USER_AUDIO_CACHE, data.urls));
    return;
  }
  if (data.type === "REMOVE_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(removeUrlList(USER_ASSET_CACHE, data.urls));
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
  "/style.css?v=43.1.99",
  "/app.js?v=43.1.99",
  "/nav.js?v=43.1.99",
  "/pwa-init.js?v=43.1.99",
  "/manifest.webmanifest?v=43.1.99",
  "/aineo-album-page.js?v=43.1.99",
  "/aineo-config.js?v=43.1.99",
  "/aineo-data.js?v=43.1.99",
  "/aineo-featured.js?v=43.1.99",
  "/aineo-library.js?v=43.1.99",
  "/aineo-lyrics.js?v=43.1.99",
  "/aineo-media-session.js?v=43.1.99",
  "/aineo-offline.js?v=43.1.99",
  "/aineo-player-sheet.js?v=43.1.99",
  "/aineo-playlists.js?v=43.1.99",
  "/aineo-queue.js?v=43.1.99",
  "/aineo-shared.js?v=43.1.99",
  "/aineo-ui.js?v=43.1.99",
  "/album-page.js?v=43.1.99",
  "/albums-page.js?v=43.1.99",
  "/artist-page.js?v=43.1.99",
  "/artists-page.js?v=43.1.99",
  "/contact.js?v=43.1.99",
  "/images/church-logo.png?v=43.1.99",
  "/images/alpena-first-baptist-church.png?v=43.1.99",
  "/images/new-beginnings-cc.jpg?v=43.1.99",
  "/images/wielders-of-the-word.jpg?v=43.1.99"
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

async function cacheUrlList(cacheName, urls = []) {
  const cache = await caches.open(cacheName);
  await Promise.all([...new Set(urls.filter(Boolean))].map(async (url) => {
    try {
      const response = await fetch(new Request(url, { mode: "cors", credentials: "omit", cache: "no-cache" }));
      if (response && (response.ok || response.type === "opaque")) await cache.put(url, response.clone());
    } catch (error) {
      try {
        const response = await fetch(new Request(url, { mode: "no-cors", credentials: "omit", cache: "no-cache" }));
        if (response && (response.ok || response.type === "opaque")) await cache.put(url, response.clone());
      } catch (innerError) {}
    }
  }));
}

async function removeUrlList(cacheName, urls = []) {
  const cache = await caches.open(cacheName);
  await Promise.all([...new Set(urls.filter(Boolean))].map((url) => cache.delete(url, { ignoreSearch: true })));
}

async function trimCache(cacheName, maxEntries = 40) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    await Promise.all(keys.slice(0, keys.length - maxEntries).map((request) => cache.delete(request)));
  } catch (error) {}
}

function parseRangeHeader(rangeHeader, size) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader || "");
  if (!match || !Number.isFinite(size) || size <= 0) return null;
  let start = match[1] === "" ? null : Number(match[1]);
  let end = match[2] === "" ? null : Number(match[2]);
  if (start === null && end === null) return null;
  if (start === null) {
    const suffixLength = Math.max(0, end || 0);
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else if (end === null || end >= size) {
    end = size - 1;
  }
  if (start < 0 || end < start || start >= size) return null;
  return { start, end };
}

async function buildRangeResponse(response, rangeHeader) {
  if (!response || response.type === "opaque") return response;
  const blob = await response.blob();
  const range = parseRangeHeader(rangeHeader, blob.size);
  if (!range) return response;
  const sliced = blob.slice(range.start, range.end + 1);
  const headers = new Headers(response.headers);
  headers.set("Content-Range", `bytes ${range.start}-${range.end}/${blob.size}`);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Length", String(sliced.size));
  headers.set("Content-Type", response.headers.get("Content-Type") || "audio/mpeg");
  return new Response(sliced, { status: 206, statusText: "Partial Content", headers });
}

async function cacheFirstExternal(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: true });
  const rangeHeader = request.headers.get("range");

  if (cached) {
    if (rangeHeader) return buildRangeResponse(cached, rangeHeader);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (!rangeHeader && response && (response.status === 200 || response.type === "opaque")) {
      await cache.put(request, response.clone());
      trimCache(cacheName, maxEntries);
    }
    return response;
  } catch (error) {
    if (cached) return rangeHeader ? buildRangeResponse(cached, rangeHeader) : cached;
    return Response.error();
  }
}

async function documentNetworkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const url = new URL(request.url);
  const pathKey = url.pathname === "/" ? "/index.html" : url.pathname;
  try {
    const response = await fetch(request);
    if (response && response.ok && !response.redirected && response.type !== "opaqueredirect") {
      await cache.put(pathKey, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: false }) ||
      await cache.match(pathKey, { ignoreSearch: true }) ||
      await cache.match("/index.html", { ignoreSearch: true });
    return cached || Response.error();
  }
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

  if (EXTERNAL_MEDIA_HOSTS.includes(url.hostname)) {
    if (url.pathname.includes("/audio/") || req.destination === "audio") {
      event.respondWith(cacheFirstExternal(req, USER_AUDIO_CACHE, 32));
      return;
    }
    if (url.pathname.includes("/covers/") || req.destination === "image") {
      event.respondWith(cacheFirstExternal(req, USER_ASSET_CACHE, 96));
      return;
    }
  }

  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(documentNetworkFirst(req));
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
