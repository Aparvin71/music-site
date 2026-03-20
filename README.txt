Allen Parvin Music - Standalone PWA Bundle

Files included:
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
- images/Blue-and-White-with-black.PNG
- icons/icon-192.png
- icons/icon-512.png

What was updated:
- Added PWA manifest and install metadata.
- Added service worker for app shell caching.
- Added audio caching for remote audio files.
- Fixed contact.html to load contact.js from the correct path.
- Fixed about.html structure and added footer/closing tags.
- Added standalone service worker registration for About and Contact pages.
- Added app icon files from the uploaded logo.

Deployment notes:
- Serve over HTTPS (or localhost for testing).
- Keep all files in the same folder structure as provided here.
- Audio and cover URLs can stay in your R2 bucket.
- For best cross-origin media caching behavior, make sure your R2 bucket allows browser access to the audio and cover files.
- If you update app shell files later, bump CACHE_VERSION inside service-worker.js.


March 2026 hotfixes:
- Fixed mobile full-screen player lyrics overlap by making the lower panel the only scrollable area.
- Restored app icon loading on the home page by adding manifest and icon links to index.html.
- Updated manifest paths to relative icon URLs and added maskable icon purposes.
- Cached icon/image assets in the service worker.
