Aineo Music - Mobile/PWA Navigation Fix Bundle

Files replaced:
- index.html
- about.html
- contact.html
- album.html
- manifest.webmanifest
- pwa-init.js
- service-worker.js

What was cleaned up:
- Unified all internal page links to portable relative paths (./index.html, ./about.html, ./contact.html)
- Fixed album page nav/back links to use the same path strategy
- Removed forced JavaScript navigation interception from pwa-init.js
- Kept mobile nav open/close behavior, but let normal anchor navigation handle page changes
- Made the service worker scope-aware so it works better whether the site is hosted at the domain root or inside a subfolder
- Added album.html and album-page.js to app-shell caching
- Updated manifest start_url and scope to portable relative values
- Bumped service-worker cache version to v15.03

Why this fix was needed:
- Your files were mixing root-relative links, document-relative links, and forced JavaScript navigation.
- album.html was still using older relative nav links while the other pages had already changed.
- The manifest and service worker were still locked to root paths, which can break installed PWA navigation if the site is not deployed at the domain root.

After upload:
1. Replace these files on the server.
2. Hard refresh the site in the browser.
3. Unregister the old service worker once.
4. Delete the previously installed home-screen app.
5. Reinstall the PWA so the new manifest scope/start_url are used.
