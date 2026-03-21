Aineo Music - Scripture Links + Cleanup Bundle

Included updates:
- Scripture references on the site now open the passage on BibleGateway for reading.
- Clickable scripture links were added to:
  - sticky player now playing area
  - fullscreen player scripture area
  - library featured track metadata
  - album modal / album track lists
  - album page now playing area
  - album page featured track metadata
- Album page navigation links were cleaned up to use root-relative paths.
- Service worker cache version bumped and album assets added to the app shell.
- Service worker response caching was made safer to reduce clone/body-used issues.

Files most important to replace:
- app.js
- album-page.js
- album.html
- style.css
- service-worker.js

Recommended after upload:
1. Hard refresh the site.
2. Unregister the old service worker once.
3. Reopen or reinstall the PWA if needed so the new cache version is used.
