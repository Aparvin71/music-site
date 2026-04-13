Aineo Music v43.1.28 — Lyrics System Fix Pass

Purpose
- Fix stale lyrics library data and make the app read from the current uploaded lyrics set.
- Preserve the safer iPhone update flow without wiping user listening state.

What changed
- Added the current /lyrics library back into the package
- Rebuilt lyrics file references in tracks.json to match the uploaded .lrc filenames
- Added lyrics/lrc-manifest.json for stable lookup and future generator runs
- Added versioned lyrics-library invalidation so old cached lyrics metadata is cleared once
- Service worker now treats .lrc files as live assets and refreshes them network-first
- Lyrics fetches use an explicit version query and no-store behavior

Included
- /lyrics
- lyrics/lrc-manifest.json
- updated tracks.json
- updated make_tracks.py

Not included
- /audio
- /covers
