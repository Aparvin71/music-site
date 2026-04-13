Aineo Music v43.1.27 — Safe Persistent Update System

Purpose
- Keep installed iPhone updates reliable without wiping song links, cover links, playlists, favorites, or resume state.

What changed
- Versioned persistent storage schema
- Targeted app-shell reset only when needed
- Preserves remote asset links and user library state
- Clears transient update/cache keys instead of clearing all storage
- Service worker reports build version and refreshes app shell safely
- Manifest start_url and shortcuts include the new build version query

Preserved user state
- favorites
- recently played
- resume state
- custom playlists
- downloaded tracks
- play stats
- playback modes
- player state

Not included
- /audio
- /covers
- /lyrics
