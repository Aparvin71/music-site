Aineo Music — v43.1.2

Repair package built from v43.1.1 with cache/version alignment and stable track ID restoration.

Included:
- latest regenerated tracks.json with spectrum_frames
- latest track-build-cache.json
- asset/cache query versions bumped to 43.1.2 across pages
- AineoConfig assetVersion aligned to 43.1.2
- service worker cache version bumped to v43.1.2
- stable track IDs restored from v42.4.5 where title+src matched
- old package notes removed and replaced with this clean repair readme

After upload:
1. Close site tabs
2. Hard refresh (Ctrl+F5)
3. If needed, clear site storage once so the new cache and track IDs take over cleanly
