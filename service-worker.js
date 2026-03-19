// ===== VERSION =====
const CACHE_VERSION = "v9.07";
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
  "/pwa-init.js"
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
          if (
            key !== STATIC_CACHE &&
            key !== RUNTIME_CACHE &&
            key !== AUDIO_CACHE
          ) {
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
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ===== FETCH =====
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== "GET") return;

  // IMPORTANT:
  // Never intercept byte-range requests.
  // Mobile browsers often use Range requests for MP3 streaming.
  if (req.headers.has("range")) {
    return;
  }

  const url = new URL(req.url);

  // ===== AUDIO FILES =====
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

  // ===== NAVIGATION REQUESTS =====
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => {
            return cached || caches.match("/index.html");
          })
        )
    );
    return;
  }

  // ===== STATIC / OTHER ASSETS =====
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached)
    })
  );
});