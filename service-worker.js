// ===== VERSION =====
const CACHE_VERSION = "v10.0";
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
          if (key !== STATIC_CACHE && key !== RUNTIME_CACHE && key !== AUDIO_CACHE) {
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
    return;
  }

  if (event.data?.type === "CACHE_AUDIO_URLS" && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        for (const url of event.data.urls.filter(Boolean)) {
          try {
            const req = new Request(url, { mode: "cors" });
            const res = await fetch(req);
            if (res && res.ok) {
              await cache.put(req, res.clone());
            }
          } catch (error) {
            console.warn("Failed to cache media URL:", url, error);
          }
        }
      })
    );
  }
});

// ===== FETCH =====
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  // Never intercept byte-range requests. Mobile browsers commonly use these for audio.
  if (req.headers.has("range")) {
    return;
  }

  const url = new URL(req.url);

  // ===== AUDIO FILES (R2 or external) =====
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

  // ===== NAVIGATION (HTML pages) =====
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

  // ===== STATIC ASSETS =====
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
