const CACHE_VERSION = 'ap-music-v2';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const AUDIO_CACHE = `${CACHE_VERSION}-audio`;
const APP_SHELL_FILES = [
  './',
  './index.html',
  './about.html',
  './contact.html',
  './style.css',
  './app.js',
  './contact.js',
  './pwa-init.js',
  './tracks.json',
  './manifest.webmanifest',
  './images/Blue-and-White-with-black.PNG',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(APP_SHELL_FILES)).catch(() => Promise.resolve())
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => ![SHELL_CACHE, AUDIO_CACHE].includes(key)).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (data.type === 'CACHE_AUDIO_URLS' && Array.isArray(data.urls)) {
    event.waitUntil(warmAudioCache(data.urls));
  }
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isAudio = request.destination === 'audio' || /\.(mp3|m4a|aac|wav|ogg|flac)(\?.*)?$/i.test(url.pathname);
  const isShellAsset = isSameOrigin && (
    url.pathname.endsWith('/') ||
    /\/(index|about|contact)\.html$/i.test(url.pathname) ||
    /\/(style|app|contact|pwa-init)\.js$/i.test(url.pathname) ||
    url.pathname.endsWith('/style.css') ||
    url.pathname.endsWith('/tracks.json') ||
    url.pathname.endsWith('/manifest.webmanifest') ||
    url.pathname.includes('/icons/') ||
    url.pathname.includes('/images/')
  );

  if (isAudio) {
    event.respondWith(cacheFirstAudio(request));
    return;
  }

  if (isShellAsset) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
  }
});

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then(response => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached || caches.match('./index.html'));
  return cached || networkFetch;
}

async function cacheFirstAudio(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(request, { ignoreVary: true, ignoreSearch: false });
  if (cached) return cached;

  try {
    const response = await fetch(request, { mode: 'no-cors' });
    if (response && (response.ok || response.type === 'opaque')) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const fallback = await cache.match(request, { ignoreVary: true, ignoreSearch: false });
    if (fallback) return fallback;
    throw error;
  }
}

async function warmAudioCache(urls) {
  const uniqueUrls = [...new Set(urls.filter(Boolean))].slice(0, 200);
  const cache = await caches.open(AUDIO_CACHE);
  for (const url of uniqueUrls) {
    try {
      const request = new Request(url, { mode: 'no-cors' });
      const existing = await cache.match(request, { ignoreVary: true, ignoreSearch: false });
      if (existing) continue;
      const response = await fetch(request);
      if (response && (response.ok || response.type === 'opaque')) {
        await cache.put(request, response.clone());
      }
    } catch (error) {
      // Ignore individual caching failures.
    }
  }
}
