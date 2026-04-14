
// v43.1.36 Service Worker Strategy Cleanup

const CACHE_VERSION = "v43.1.36";
const STATIC_CACHE = `static-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/nav.js"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => 
Promise.all(STATIC_ASSETS.map(url =>
  fetch(url).then(res => {
    if(res.ok){
      return cache.put(url, res.clone());
    }
  }).catch(()=>{})
))
)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (!key.includes(CACHE_VERSION)) {
          return caches.delete(key);
        }
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Network-first for dynamic data
  if (url.pathname.includes("/lyrics") || url.pathname.includes("tracks.json") || url.pathname.includes("/analysis")) {
    event.respondWith(
      fetch(req)
        .then(res => {
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first for static UI
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req).then(res => {
        if (!res || res.status !== 200) return res;
        const clone = res.clone();
        caches.open(STATIC_CACHE).then(cache => cache.put(req, clone));
        return res;
      });
    })
  );
});
