Aineo Music - Clean Production Bundle

Included:
- index.html
- about.html
- contact.html
- style.css
- app.js
- contact.js
- pwa-init.js
- manifest.webmanifest
- service-worker.js
- tracks.json
- favicon.ico
- icons/icon-64.png
- icons/icon-192.png
- icons/icon-512.png
- images/aineo-music.png
- images/church-logo.png

Cleaned and stabilized:
- Restored missing getQueueDisplayTracks() helper to stop queue/playback crashes.
- Kept track loading simple and removed the timestamp cache-buster from tracks.json fetch.
- Added a production-safe service worker:
  - skips Range requests so mobile audio streaming works
  - supports SKIP_WAITING
  - supports CACHE_AUDIO_URLS messages for offline song saving
  - caches icons and local images
- Unified favicon / icon / manifest links across pages.
- Updated About page church logo path to /images/church-logo.png.
- Added a stronger mobile fullscreen player layout so lyrics stay below controls.

Deployment notes:
- Upload the full folder structure exactly as included.
- Serve over HTTPS.
- Keep your audio and cover files on R2 as referenced by tracks.json.
- After upload, hard refresh and unregister any old service worker once so the new worker takes over.
