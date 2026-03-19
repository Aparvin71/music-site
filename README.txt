
Aineo Music — Next Level Upgrade Bundle
=======================================

This package includes a broad upgrade pass across the music app.

Included upgrades
-----------------
1. Continue listening row with progress memory
2. Real custom playlist UI
3. Queue upgrades: add to queue, play next, drag reorder, remove
4. Downloaded Songs section with counts
5. Persistent mini player + full player handoff
6. Crossfade-style transitions toggle
7. Audio visualizer
8. Lyrics auto-scroll tied to playback progress
9. Tag/collection browsing
10. Scripture chips with one-click BibleGateway links
11. Featured album + collection jumping
12. Lazy-loaded cover images
13. Preload next track
14. Improved caching + offline cover/audio requests
15. Local library backup import/export tools
16. Shareable song links using ?track=slug
17. Media Session API for lock-screen / headset controls

Upload structure
----------------
Upload everything in this folder, including:
- index.html
- about.html
- contact.html
- style.css
- app.js
- service-worker.js
- manifest.webmanifest
- pwa-init.js
- tracks.json
- icons/
- images/

Notes
-----
- Audio and cover URLs still point to your R2 bucket in tracks.json.
- After upload, hard refresh once and, if needed, unregister the old service worker.
