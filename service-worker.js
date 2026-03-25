// ===== VERSION =====
const CACHE_VERSION = "v39.6.13";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const AUDIO_CACHE = `audio-${CACHE_VERSION}`;

// ===== APP SHELL FILES =====
const APP_SHELL = [
  "/",
  "/index.html",
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
  "/tracks.json",
  "/manifest.webmanifest",
  "/pwa-init.js",
  "/favicon.ico",
  "/icons/icon-64.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/images/aineo-music.png",
  "/images/church-logo.png",
];

// ===== INSTALL =====
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch(() => {
            console.warn("Failed to cache:", url);
          })
        )
      )
    )
  );
});

// ===== ACTIVATE =====
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (![STATIC_CACHE, RUNTIME_CACHE, AUDIO_CACHE].includes(key)) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// ===== MESSAGES =====
self.addEventListener("message", (event) => {
  const data = event.data || {};

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type === "CACHE_AUDIO_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        await Promise.all(
          data.urls
            .filter(Boolean)
            .map(async (url) => {
              try {
                const request = new Request(url, { mode: "cors" });
                const existing = await cache.match(request);
                if (existing) return;
                const response = await fetch(request);
                if (response && response.ok) {
                  await cache.put(request, response.clone());
                }
              } catch (error) {
                console.warn("Failed to cache audio URL:", url, error);
              }
            })
        );
      })
    );
  }
});

// ===== FETCH =====
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  // Never intercept byte-range requests used by mobile audio streaming.
  if (req.headers.has("range")) {
    return;
  }

  const url = new URL(req.url);

  // Audio files (R2 or external)
  if (req.destination === "audio" || url.pathname.endsWith(".mp3")) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          if (cached) return cached;

          return fetch(req)
            .then((res) => {
              if (res && res.ok) {
                cache.put(req, res.clone());
              }
              return res;
            })
            .catch(() => cached)
        })
      )
    );
    return;
  }

  // tracks.json: network first so updates appear quickly
  if (url.pathname.endsWith("/tracks.json") || url.pathname === "/tracks.json") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // HTML pages: network first
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("/index.html")))
    );
    return;
  }

  // Static assets: cache first, then network
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached)
    })
  );
});
