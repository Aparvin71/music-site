Aineo Music v43.1.51 — R2 Asset Wiring Fix

Purpose
- Make the core-only package point music and cover artwork to the correct R2 bucket.

Configured bucket
- https://pub-de889868274142c4924a1b81e51a1d94.r2.dev

What changed
- tracks.json src/audio paths rewritten to https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/audio
- tracks.json cover paths rewritten to https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/covers
- albums.json cover paths normalized to https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/covers
- aineo-config.js audioBaseUrl and coverBaseUrl updated to the same bucket paths
