Aineo Music - Featured Album Fix

Included:
- app.js
- make_tracks.py
- service-worker.js

What changed:
- Removed the hard-coded "Testimony" featured album fallback from app.js.
- Homepage featured album now:
  1. uses the currently selected album if one is filtered
  2. otherwise prefers any album with album_featured: true in tracks.json
  3. otherwise falls back to the first visible album
- Added featured album support to make_tracks.py via ALBUM_METADATA.

How to mark a featured album:
Add this in ALBUM_METADATA inside make_tracks.py, for example:

ALBUM_METADATA = {
    "Who He Is": {
        "featured": True,
        "album_zip": "who-he-is.zip"
    }
}

Then run make_tracks.py again to regenerate tracks.json.

Deployment:
1. Upload app.js, make_tracks.py, and service-worker.js.
2. If you update make_tracks.py and want the new featured album behavior to appear, regenerate and upload tracks.json too.
3. Hard refresh the site.
4. Unregister the old service worker once if the old featured album still appears.
