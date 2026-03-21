Aineo Music all-fixes package

Included:
- app.js
- pwa-init.js
- service-worker.js

Fixes included:
- Track card play button now toggles ▶ / ❚❚ like the mini player
- Current track card still highlights while playing
- Mobile nav double-binding fixed (home page app.js + pwa-init.js conflict removed)
- About/Request mobile nav still works on pages without app.js
- Service worker cache helper updated to avoid Response body already used errors
- Cache version bumped to v15.05

Deployment:
1. Replace these files on your site.
2. Hard refresh.
3. Unregister the old service worker once.
4. Delete and reinstall the PWA if mobile still shows stale behavior.
