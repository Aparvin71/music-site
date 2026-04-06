// ===== VERSION =====
const CACHE_VERSION = "v41.1.0-offline-hardening";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const AUDIO_CACHE = `audio-${CACHE_VERSION}`;

// ===== APP SHELL FILES =====
const APP_SHELL = [
  "/",
  "/index.html",
  "/home.html",
  "/music.html",
  "/about.html",
  "/mission.html",
  "/install.html",
  "/contact.html",
  "/feedback.html",
  "/changelog.html",
  "/artists.html",
  "/artist.html",
  "/albums.html",
  "/lyrics-editor.html",
  "/admin-upload.html",
  "/album.html",
  "/style.css",
  "/app.js",
  "/contact.js",
  "/album-page.js",
  "/aineo-album-page.js",
  "/tracks.json",
  "/albums.json",
  "/manifest.webmanifest",
  "/pwa-init.js",
  "/aineo-config.js",
  "/aineo-data.js",
  "/aineo-ui.js",
  "/aineo-lyrics.js",
  "/aineo-media-session.js",
  "/aineo-library.js",
  "/aineo-queue.js",
  "/aineo-featured.js",
  "/aineo-playlists.js",
  "/aineo-player-sheet.js",
  "/aineo-offline.js",
  "/aineo-shared.js",
  "/albums-page.js",
  "/artists-page.js",
  "/artist-page.js",
  "/favicon.ico",
  "/icons/icon-64.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/images/aineo-music.png",
  "/images/church-logo.png",
];

function cacheUrls(cacheName, urls) {
  return caches.open(cacheName).then(async (cache) => {
    await Promise.all(
      urls.filter(Boolean).map(async (url) => {
        try {
          const request = new Request(url, { mode: "cors" });
          const existing = await cache.match(request);
          if (existing) return;
          const response = await fetch(request);
          if (response && response.ok) {
            await cache.put(request, response.clone());
          }
        } catch (error) {
          console.warn("Failed to cache URL:", url, error);
        }
      })
    );
  });
}

function removeUrls(cacheName, urls) {
  return caches.open(cacheName).then(async (cache) => {
    await Promise.all(
      urls.filter(Boolean).map(async (url) => {
        try {
          await cache.delete(new Request(url, { mode: "cors" }));
        } catch (error) {
          console.warn("Failed to remove cached URL:", url, error);
        }
      })
    );
  });
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => console.warn("Failed to cache:", url))))
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (![STATIC_CACHE, RUNTIME_CACHE, AUDIO_CACHE].includes(key)) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (data.type === "CACHE_AUDIO_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(cacheUrls(AUDIO_CACHE, data.urls));
    return;
  }
  if (data.type === "REMOVE_AUDIO_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(removeUrls(AUDIO_CACHE, data.urls));
    return;
  }
  if (data.type === "CACHE_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(cacheUrls(RUNTIME_CACHE, data.urls));
    return;
  }
  if (data.type === "REMOVE_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(removeUrls(RUNTIME_CACHE, data.urls));
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.headers.has("range")) return;

  const url = new URL(req.url);

  if (req.destination === "audio" || url.pathname.endsWith(".mp3")) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) =>
        cache.match(req).then((cached) => cached || fetch(req).then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => cached))
      )
    );
    return;
  }

  if (req.destination === "image") {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        if (res && res.ok) caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, res.clone()));
        return res;
      }).catch(() => cached))
    );
    return;
  }

  if (["/tracks.json", "/albums.json"].includes(url.pathname) || url.pathname.endsWith("/tracks.json") || url.pathname.endsWith("/albums.json")) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, res.clone()));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, res.clone()));
        return res;
      }).catch(() => caches.match(req).then((cached) => cached || caches.match("/index.html") || caches.match("/music.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res && res.ok) caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, res.clone()));
      return res;
    }).catch(() => cached))
  );
});
