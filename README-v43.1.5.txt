v43.1.5

Root-cause spectrum repair release.

What changed:
- preserve spectrum_frames, waveform_envelope, and waveform_ring_preview during track normalization
- keep apostrophe/quote asset URL repairs from v43.1.3
- keep regenerated tracks.json with precomputed spectrum data
- package-wide version bump to v43.1.5

After deploying:
1. Close all tabs for the site
2. Reopen the site
3. Hard refresh with Ctrl+F5
4. Clear site storage once if an old service worker is still serving stale JS
