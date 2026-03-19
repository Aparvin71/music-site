const CACHE_VERSION = 'v9.04';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const AUDIO_CACHE = `audio-${CACHE_VERSION}`;
const MEDIA_CACHE = `media-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './about.html',
  './contact.html',
  './style.css',
  './app.js',
  './contact.js',
  './tracks.json',
  './manifest.webmanifest',
  './pwa-init.js',
  './icons/icon-64.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './images/aineo-music.png',
  './images/church-logo.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await Promise.all(
        APP_SHELL.map(async (url) => {
          try {
            await cache.add(url);
          } catch (error) {
            console.warn('Failed to cache app shell asset:', url, error);
          }
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((key) => {
        if (![STATIC_CACHE, RUNTIME_CACHE, AUDIO_CACHE, MEDIA_CACHE].includes(key)) {
          return caches.delete(key);
        }
        return Promise.resolve();
      })
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (data.type === 'CACHE_AUDIO_URLS') {
    const urls = Array.isArray(data.urls) ? data.urls.filter(Boolean) : [];
    event.waitUntil(cacheUrls(urls, AUDIO_CACHE));
    return;
  }

  if (data.type === 'CACHE_MEDIA_URLS') {
    const urls = Array.isArray(data.urls) ? data.urls.filter(Boolean) : [];
    event.waitUntil(cacheUrls(urls, MEDIA_CACHE));
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const pathname = url.pathname.toLowerCase();
  const isRemoteR2 = url.origin !== self.location.origin && url.hostname.endsWith('r2.dev');
  const isAudio = req.destination === 'audio' || pathname.endsWith('.mp3');
  const isTrackList = url.origin === self.location.origin && pathname.endsWith('/tracks.json');
  const isImage = req.destination === 'image' || /\.(png|jpg|jpeg|webp|gif|svg)$/.test(pathname);
  const isRemoteMedia = isRemoteR2 && (isAudio || isImage || pathname.includes('/covers/'));

  if (isTrackList) {
    event.respondWith(networkFirst(req, RUNTIME_CACHE));
    return;
  }

  if (isAudio) {
    event.respondWith(cacheFirst(req, AUDIO_CACHE));
    return;
  }

  if (isRemoteMedia) {
    event.respondWith(cacheFirst(req, MEDIA_CACHE));
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (error) {
        const cached = await caches.match(req);
        return cached || caches.match('./index.html');
      }
    })());
    return;
  }

  if (isImage) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
});

async function cacheUrls(urls, cacheName) {
  const cache = await caches.open(cacheName);

  await Promise.all(
    urls.map(async (url) => {
      try {
        const request = new Request(url, { mode: 'no-cors' });
        const existing = await cache.match(request);
        if (existing) return;

        const response = await fetch(request);
        if (response && (response.ok || response.type === 'opaque')) {
          await cache.put(request, response.clone());
        }
      } catch (error) {
        console.warn('Failed to pre-cache remote asset:', url, error);
      }
    })
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkPromise;
}
