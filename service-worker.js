// ===== VERSION =====
const CACHE_VERSION = "v42.3.19-full-package";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const AUDIO_CACHE = `audio-${CACHE_VERSION}`;

// ===== APP SHELL FILES =====
const APP_SHELL = [
  "/",
  "/index.html",
  "/home.html",
  "/music.html",
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
  "/aineo-album-page.js",
  "/tracks.json",
  "/albums.json",
  "/manifest.webmanifest",
  "/pwa-init.js",
  "/aineo-config.js",
  "/aineo-data.js",
  "/aineo-ui.js",
  "/aineo-lyrics.js",
  "/aineo-media-session.js",
  "/aineo-library.js",
  "/aineo-queue.js",
  "/aineo-featured.js",
  "/aineo-playlists.js",
  "/aineo-player-sheet.js",
  "/aineo-offline.js",
  "/aineo-shared.js",
  "/albums-page.js",
  "/artists-page.js",
  "/artist-page.js",
  "/favicon.ico",
  "/icons/icon-64.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/images/aineo-music.png",
  "/images/church-logo.png",
];

function normalizeRequest(input) {
  const request = input instanceof Request ? input : new Request(input, { mode: 'cors' });
  const url = new URL(request.url);
  url.search = '';
  const sameOrigin = url.origin === self.location.origin;
  return new Request(url.toString(), {
    method: 'GET',
    mode: request.mode === 'navigate' ? 'same-origin' : (sameOrigin ? 'same-origin' : 'no-cors'),
    credentials: 'omit'
  });
}

async function findCachedResponse(request) {
  return (await caches.match(request, { ignoreSearch: true })) || (await caches.match(normalizeRequest(request), { ignoreSearch: true }));
}

function responseCanBeCached(response) {
  return Boolean(response && (response.ok || response.type === 'opaque'));
}

async function fetchForCache(url) {
  const normalized = normalizeRequest(url);
  try {
    const response = await fetch(normalized);
    if (responseCanBeCached(response)) return { request: normalized, response };
  } catch (error) {}

  const noCorsRequest = new Request(new URL(url, self.location.origin).toString(), {
    method: 'GET',
    mode: 'no-cors',
    credentials: 'omit'
  });
  const response = await fetch(noCorsRequest);
  return { request: normalizeRequest(noCorsRequest), response };
}

async function cacheUrls(cacheName, urls) {
  const cache = await caches.open(cacheName);
  await Promise.all(
    urls.filter(Boolean).map(async (url) => {
      try {
        const request = normalizeRequest(url);
        const existing = await cache.match(request, { ignoreSearch: true });
        if (existing) return;
        const fetched = await fetchForCache(url);
        if (responseCanBeCached(fetched.response)) {
          await cache.put(request, fetched.response.clone());
        }
      } catch (error) {
        console.warn('Failed to cache URL:', url, error);
      }
    })
  );
}

async function removeUrls(cacheName, urls) {
  const cache = await caches.open(cacheName);
  await Promise.all(
    urls.filter(Boolean).map(async (url) => {
      try {
        await cache.delete(normalizeRequest(url), { ignoreSearch: true });
      } catch (error) {
        console.warn('Failed to remove cached URL:', url, error);
      }
    })
  );
}

function createPartialResponse(response, rangeHeader) {
  return response.arrayBuffer().then((buffer) => {
    const size = buffer.byteLength;
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader || '');
    if (!match) {
      return new Response(buffer, {
        status: 200,
        headers: response.headers
      });
    }
    let start = match[1] ? Number(match[1]) : 0;
    let end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isFinite(start) || start < 0) start = 0;
    if (!Number.isFinite(end) || end >= size) end = size - 1;
    if (start > end || start >= size) {
      return new Response(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${size}` }
      });
    }
    const sliced = buffer.slice(start, end + 1);
    const headers = new Headers(response.headers);
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Length', String(sliced.byteLength));
    headers.set('Accept-Ranges', 'bytes');
    return new Response(sliced, {
      status: 206,
      statusText: 'Partial Content',
      headers
    });
  });
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => console.warn('Failed to cache:', url))))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => {
    if (![STATIC_CACHE, RUNTIME_CACHE, AUDIO_CACHE, 'aineo-user-offline-audio', 'aineo-user-offline-assets'].includes(key)) return caches.delete(key);
    return undefined;
  }))));
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') { self.skipWaiting(); return; }
  if (data.type === 'CACHE_AUDIO_URLS' && Array.isArray(data.urls)) { event.waitUntil(cacheUrls(AUDIO_CACHE, data.urls)); return; }
  if (data.type === 'REMOVE_AUDIO_URLS' && Array.isArray(data.urls)) { event.waitUntil(removeUrls(AUDIO_CACHE, data.urls)); return; }
  if (data.type === 'CACHE_URLS' && Array.isArray(data.urls)) { event.waitUntil(cacheUrls(RUNTIME_CACHE, data.urls)); return; }
  if (data.type === 'REMOVE_URLS' && Array.isArray(data.urls)) { event.waitUntil(removeUrls(RUNTIME_CACHE, data.urls)); }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (req.headers.has('range') && (req.destination === 'audio' || url.pathname.endsWith('.mp3'))) {
    event.respondWith((async () => {
      const cached = await findCachedResponse(req);
      if (cached) return createPartialResponse(cached, req.headers.get('range'));
      try {
        return await fetch(req);
      } catch (error) {
        return new Response(null, { status: 504, statusText: 'Offline and audio not cached' });
      }
    })());
    return;
  }

  if (req.destination === 'audio' || url.pathname.endsWith('.mp3')) {
    event.respondWith((async () => {
      const cached = await findCachedResponse(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.ok) caches.open(AUDIO_CACHE).then((cache) => cache.put(normalizeRequest(req), res.clone()));
        return res;
      } catch (error) {
        return cached;
      }
    })());
    return;
  }

  if (req.destination === 'image') {
    event.respondWith((async () => {
      const cached = await findCachedResponse(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.ok) caches.open(RUNTIME_CACHE).then((cache) => cache.put(normalizeRequest(req), res.clone()));
        return res;
      } catch (error) {
        return cached;
      }
    })());
    return;
  }

  if (['/tracks.json', '/albums.json'].includes(url.pathname) || url.pathname.endsWith('/tracks.json') || url.pathname.endsWith('/albums.json')) {
    event.respondWith((async () => {
      const cached = await findCachedResponse(req);
      const networkFetch = fetch(req).then((res) => {
        if (res && res.ok) caches.open(RUNTIME_CACHE).then((cache) => cache.put(normalizeRequest(req), res.clone()));
        return res;
      }).catch(() => cached);
      return cached || networkFetch;
    })());
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then((res) => {
      if (res && res.ok) caches.open(RUNTIME_CACHE).then((cache) => cache.put(normalizeRequest(req), res.clone()));
      return res;
    }).catch(() => findCachedResponse(req).then((cached) => cached || caches.match('/index.html') || caches.match('/music.html'))));
    return;
  }

  event.respondWith(findCachedResponse(req).then((cached) => cached || fetch(req).then((res) => {
    if (res && res.ok) caches.open(RUNTIME_CACHE).then((cache) => cache.put(normalizeRequest(req), res.clone()));
    return res;
  }).catch(() => cached)));
});
