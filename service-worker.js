// ===== VERSION =====
const CACHE_VERSION = "v17.10";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const AUDIO_CACHE = `audio-${CACHE_VERSION}`;

// ===== APP SHELL FILES =====
const APP_SHELL = [
  "/",
  "/index.html",
  "/about.html",
  "/contact.html",
  "/style.css",
  "/app.js",
  "/contact.js",
  "/tracks.json",
  "/manifest.webmanifest",
  "/pwa-init.js",
  "/favicon.ico",
  "/icons/icon-64.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/images/aineo-music.png",
  "/images/church-logo.png"
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
  if (req.headers.has("range")) return;

  const url = new URL(req.url);

  const cacheNetworkResponse = (cacheName, request, response) => {
    if (!response || !response.ok) return;
    const copy = response.clone();
    event.waitUntil(
      caches.open(cacheName)
        .then((cache) => cache.put(request, copy))
        .catch((error) => console.warn("Cache put failed:", error))
    );
  };

  if (req.destination === "audio" || url.pathname.endsWith(".mp3")) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;

        try {
          const networkResponse = await fetch(req);
          cacheNetworkResponse(AUDIO_CACHE, req, networkResponse);
          return networkResponse;
        } catch (error) {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  if (url.pathname.endsWith("/tracks.json") || url.pathname === "/tracks.json") {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          cacheNetworkResponse(RUNTIME_CACHE, req, networkResponse);
          return networkResponse;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          cacheNetworkResponse(RUNTIME_CACHE, req, networkResponse);
          return networkResponse;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("/index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((networkResponse) => {
          cacheNetworkResponse(RUNTIME_CACHE, req, networkResponse);
          return networkResponse;
        })
        .catch(() => cached || Response.error());
    })
  );
});
