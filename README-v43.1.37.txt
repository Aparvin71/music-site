Aineo Music v43.1.38 — Ultra Smooth Playback

What changed
- Smart playback neighborhood warming for current, next, previous, and predictive next tracks
- Background warm-up queue for upcoming tracks
- Optional instant play mode retained and exposed via window.AineoPlayback
- Smooth crossfade-style transition between tracks using controlled fade-out/fade-in
- Cleaned service worker strategies:
  - static assets: cache-first
  - library/lyrics JSON: network-first
  - per-track analysis: stale-while-revalidate

Not included
- /audio
- /covers

Notes
- This build keeps the split analysis architecture from v43.1.29+
- The service worker no longer uses addAll, so install failures from missing assets are avoided
