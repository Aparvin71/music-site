Aineo Music — v43.1.61

Overview
- Static music site/PWA with audio served from Cloudflare R2.
- Covers served from Cloudflare R2.
- Lyrics served locally from /lyrics.
- Media Session metadata is enabled for lock screen / external media controls where the browser supports it.

Asset paths
- Audio base: https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/audio
- Cover base: https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/covers
- Lyrics path: /lyrics

What was cleaned in this package
- Removed legacy patch reports and replaced them with this single README.
- Sanity-checked JS syntax across shipped scripts.
- Kept the package R2-only with no bundled audio files.
- Tightened Media Session metadata fallback behavior for artwork and album values.
- Updated document title during playback for clearer external media context.

Car/lock-screen note
- This web build can publish now playing metadata through the Media Session API.
- Full native CarPlay app integration requires Apple-native app entitlements and frameworks, which are outside the scope of a website-only build.
