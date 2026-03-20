const CACHE_VERSION = "v9.12";
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
  "./icons/icon-512.png",
  "./images/church-logo.png",
  "./images/aineo-music.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      Promise.all(
        APP_SHELL.map(url => cache.add(url).catch(() => null))
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
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === "CACHE_AUDIO_URLS" && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(AUDIO_CACHE).then(async cache => {
        for (const url of event.data.urls) {
          try {
            const response = await fetch(url, { mode: "cors" });
            if (response && response.ok) {
              await cache.put(url, response.clone());
            }
          } catch (_) {}
        }
      })
    );
  }
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  if (req.headers.has("range")) return;

  const url = new URL(req.url);

  if (req.destination === "audio" || url.pathname.endsWith(".mp3")) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(cache =>
        cache.match(req).then(cached =>
          cached ||
          fetch(req).then(res => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
        )
      )
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached =>
      cached ||
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then(cache => cache.put(req, copy));
        return res;
      })
    )
  );
});
