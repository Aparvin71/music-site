Aineo Music - StaticForms Request Page Update

Updated files:
- contact.html
- contact.js
- service-worker.js

What changed:
- Connected Request a Song form to StaticForms
- Added access key to contact.html
- Contact form now sends real submissions to your email
- Added sending / success / error states
- Bumped service worker cache version so updated contact.js refreshes faster

Important:
- Upload all 3 files
- Hard refresh after upload
- If the old form behavior still appears, unregister the service worker once and reload
