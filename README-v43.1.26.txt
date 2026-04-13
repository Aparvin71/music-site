Aineo Music v43.1.26 — Targeted iPhone Reset Pass

Purpose
- Fix stale iPhone installed web-app shells without wiping song/cover links or user library state.

What changed
- Preserves remote audio and remote cover URLs already present in tracks.json
- Preserves favorites, recently played, resume state, custom playlists, downloads, and play stats
- Clears only app-shell update keys and stale runtime caches
- Unregisters stale service workers once, then reloads and registers the fresh worker
- Keeps offline user caches intact where possible

Not included
- /audio
- /covers
- /lyrics

Recommended deploy step
- Deploy this build, then open the site once in Safari on iPhone before reopening the Home Screen app.
