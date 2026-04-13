Aineo Music v43.1.25 core package

This package is the core app only.
It does not include audio, covers, or lyrics assets.

What is new in v43.1.25
- Stronger iPhone installed web-app update behavior
- Better service-worker takeover and cache cleanup
- Network-first refresh for app shell files and JSON data

Best path forward
1. Deploy this package.
2. Open the site once in Safari after deploy.
3. Reopen the installed home-screen app.
4. If an older install is still stuck, remove it once and add it back from Safari.

Generator notes
- Existing track metadata is preserved when already present in tracks.json.
- New or changed tracks can be generated incrementally.
