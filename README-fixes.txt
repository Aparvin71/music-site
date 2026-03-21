Aineo Music targeted fixes

Replace these files on the site root:
- app.js
- style.css
- service-worker.js

Included fixes:
- Fullscreen player play/pause button now stays synced with the main player button
- Smooth lyric/panel scrolling changed to manual scrolling
- Mobile fullscreen player keeps the lyrics/scripture/queue panel as the scrollable region
- Service worker cache version bumped so the new files load cleanly after refresh

After upload:
1. Replace the files above
2. Hard refresh the site
3. If needed, unregister the old service worker once and reload
