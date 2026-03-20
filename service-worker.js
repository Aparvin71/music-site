// ===== VERSION =====
const CACHE_VERSION = "v8";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const AUDIO_CACHE = `audio-${CACHE_VERSION}`;

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
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      Promise.all(
        APP_SHELL.map(url =>
          cache.add(url).catch(() => {
            console.warn("Failed to cache:", url);
          })
        )
      )
    )
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (![STATIC_CACHE, RUNTIME_CACHE, AUDIO_CACHE].includes(key)) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === "CACHE_AUDIO_URLS" && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(AUDIO_CACHE).then(cache =>
        Promise.all(
          event.data.urls
            .filter(Boolean)
            .map(url =>
              fetch(url, { mode: "cors" })
                .then(response => {
                  if (response?.ok) {
                    return cache.put(url, response.clone());
                  }
                })
                .catch(error => {
                  console.warn("Could not cache media URL:", url, error);
                })
            )
        )
      )
    );
  }
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  if (req.headers.has("range")) {
    return;
  }

  const url = new URL(req.url);

  if (req.destination === "audio" || url.pathname.endsWith(".mp3") || url.pathname.match(/\.(png|jpg|jpeg|webp)$/i) && url.hostname.includes("r2.dev")) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(cache =>
        cache.match(req).then(cached => {
          if (cached) return cached;

          return fetch(req)
            .then(response => {
              if (response?.ok) {
                cache.put(req, response.clone());
              }
              return response;
            })
            .catch(() => cached)
        })
      )
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(response => {
          caches.open(RUNTIME_CACHE).then(cache => cache.put(req, response.clone()));
          return response;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match("./index.html")))
    );
    return;
  }

  if (url.pathname.endsWith("/tracks.json") || url.pathname.endsWith("tracks.json")) {
    event.respondWith(
      fetch(req)
        .then(response => {
          caches.open(RUNTIME_CACHE).then(cache => cache.put(req, response.clone()));
          return response;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req)
        .then(response => {
          caches.open(RUNTIME_CACHE).then(cache => cache.put(req, response.clone()));
          return response;
        })
        .catch(() => cached);
    })
  );
});
