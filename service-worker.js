// ===== VERSION =====
const CACHE_VERSION = "v15.03";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const AUDIO_CACHE = `audio-${CACHE_VERSION}`;
const SCOPE = new URL(self.registration.scope);

function scopedUrl(path = "") {
  return new URL(path, SCOPE).toString();
}

const APP_SHELL = [
  scopedUrl("./"),
  scopedUrl("./index.html"),
  scopedUrl("./about.html"),
  scopedUrl("./contact.html"),
  scopedUrl("./album.html"),
  scopedUrl("./style.css"),
  scopedUrl("./app.js"),
  scopedUrl("./contact.js"),
  scopedUrl("./album-page.js"),
  scopedUrl("./tracks.json"),
  scopedUrl("./manifest.webmanifest"),
  scopedUrl("./pwa-init.js"),
  scopedUrl("./favicon.ico"),
  scopedUrl("./icons/icon-64.png"),
  scopedUrl("./icons/icon-192.png"),
  scopedUrl("./icons/icon-512.png"),
  scopedUrl("./icons/apple-touch-icon.png"),
  scopedUrl("./images/aineo-music.png"),
  scopedUrl("./images/church-logo.png")
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => undefined)))
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (![STATIC_CACHE, RUNTIME_CACHE, AUDIO_CACHE].includes(key)) {
            return caches.delete(key);
          }
          return undefined;
        })
      )
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
    event.waitUntil(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        await Promise.all(
          data.urls.filter(Boolean).map(async (url) => {
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

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.headers.has("range")) return;

  const url = new URL(req.url);

  if (req.destination === "audio" || url.pathname.endsWith(".mp3")) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) =>
        cache.match(req).then((cached) =>
          cached || fetch(req).then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => cached)
        )
      )
    );
    return;
  }

  if (url.pathname.endsWith("/tracks.json") || url.pathname.endsWith("tracks.json")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match(scopedUrl("./tracks.json"))))
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, res.clone()));
          }
          return res;
        })
        .catch(async () => {
          return (await caches.match(req))
            || (await caches.match(url.href))
            || (await caches.match(scopedUrl("./index.html")));
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.ok) {
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, res.clone()));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
