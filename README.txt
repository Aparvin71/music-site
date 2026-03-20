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
- icons/
- images/

Cleanup included:
- Restored the missing getQueueDisplayTracks() helper in app.js
- Kept playback stable
- Fixed mobile audio streaming by skipping Range requests in the service worker
- Added offline caching support for CACHE_AUDIO_URLS messages
- Unified favicon, manifest, and Apple touch icon tags across all pages
- Added mobile-web-app-capable plus Apple web app meta tags
- Fixed the About page church logo path
- Added local icons/images to service-worker app-shell caching
- Added a stronger mobile fullscreen player CSS fix so lyrics stay below controls

Deployment:
1. Upload the full folder structure as-is.
2. Keep tracks.json at the site root.
3. Keep audio and cover files on R2.
4. After upload, hard refresh the site.
5. Unregister the old service worker once, then reload.
6. On iPhone, delete any previously installed home-screen app and reinstall so the new icon is used.
