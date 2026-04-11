Aineo Music Build v42.3.86

What changed
- Upgraded the full-screen player visualizer from a synthetic bar loop to a real audio-reactive visualizer when Web Audio analysis is available.
- Added a premium circular waveform/ring effect behind the album art for a more polished full-player feel.
- Kept the original bar layer as a supporting accent so the player still feels alive and rich.
- Added a safe fallback animation if browser or CORS restrictions prevent direct audio analysis.
- Set the main audio element to anonymous cross-origin mode to improve analyzer compatibility with hosted audio.

Notes
- Best result: audio host returns CORS headers that allow Web Audio analysis.
- Fallback remains active automatically if real waveform analysis is blocked, so playback should not regress.
