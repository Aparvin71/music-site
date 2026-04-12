v43.1.6

True Spectrum Data Sync Repair

Included:
- fixed mixed version markers so pages, runtime shell, and changelog all report v43.1.6
- preserved the repaired audio/art path from v43.1.3+
- densified tracks.json spectrum timing from the regenerated JSON so movement is not stuck in slow multi-second steps
- updated app.js to prefer true spectrum data and use waveform energy only as detail modulation, not generic idle motion
- updated make_tracks.py defaults to generate denser spectrum timing going forward

After installing:
1. close all tabs for the site
2. reopen the site
3. hard refresh with Ctrl + F5
4. if needed, clear site storage/cache once
