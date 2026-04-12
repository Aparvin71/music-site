Aineo Music — v43.1.1

Included in this package
- Regenerated tracks.json with spectrum_frames
- Updated app.js true-spectrum visualizer path
- Updated make_tracks.py and tools/make_tracks.py
- Quieted web refresh/update prompt behavior
- Synced visible version markers to v43.1.1

Recommended deploy steps
1. Replace your existing site files with this package.
2. Hard refresh the browser (Ctrl+F5).
3. If an older service worker is cached, close all site tabs and reload once.

Notes
- The visualizer now prefers spectrum_frames from tracks.json.
- Playback remains on the safer existing audio path.
