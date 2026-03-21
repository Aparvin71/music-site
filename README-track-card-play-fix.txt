Aineo Music Track Card Play Button Fix

Included files:
- app.js
- service-worker.js

What changed:
- The track card play button now mirrors the mini player behavior.
- If you tap the currently selected song's track-card play button, it toggles play/pause instead of restarting the song.
- The track card button icon now updates between ▶ and ❚❚ based on playback state.
- The currently selected track row stays highlighted.
- Service worker cache version was bumped so the new JS is more likely to refresh cleanly.

After upload:
1. Replace app.js and service-worker.js
2. Hard refresh the site
3. If the old JS still shows, unregister the old service worker once and reload
