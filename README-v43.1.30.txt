
Aineo Music v43.1.37 — Generator Polish Pass

What this pass does
- Keeps split visualizer data in /analysis/*.json
- Makes make_tracks.py a clean CLI-style incremental generator
- Adds cleaner terminal reporting for new vs changed vs reused tracks
- Adds analysis reporting for generated vs reused analysis files
- Supports on-demand analysis modes:
  - --analysis-mode changed (default)
  - --analysis-mode missing
  - --analysis-mode all
- Optionally writes track-build-report.json with --report-json

Recommended usage
- Add new audio files locally
- Run: python make_tracks.py --analysis-mode changed --report-json
- For a light backfill of only missing analysis files:
  python make_tracks.py --analysis-mode missing --report-json
- For a full visualizer regeneration pass:
  python make_tracks.py --analysis-mode all --report-json

Notes
- waveform_ring_preview remains removed
- tracks.json stays lightweight
- audio and covers are still decoupled from the core package
