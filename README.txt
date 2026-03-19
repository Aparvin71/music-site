Aineo Music - Clean Upload Bundle

Upload this folder exactly as-is.

Required structure:
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
- /icons/icon-64.png
- /icons/icon-192.png
- /icons/icon-512.png
- /images/aineo-music.png
- /images/church-logo.png

Notes:
- Keep the covers and mp3 files on your R2 bucket exactly as referenced in tracks.json.
- Keep the icons and local images on the SAME site/domain as the HTML files. That is the most reliable setup for PWA install icons.
- If you ever update app shell files again, bump CACHE_VERSION in service-worker.js.
- tracks.json now updates with a network-first service worker strategy, so you do not need the Date.now cache buster anymore.
