Aineo Music v43.1.38 — Navigation Redirect Fix

This pass fixes page navigation errors caused by redirected document responses being served through the service worker.

What changed
- Service worker now handles page navigations separately from asset requests
- Redirected document responses are no longer cached
- Internal page links were normalized to final absolute URLs
- Static, dynamic, and analysis cache strategies were preserved and cleaned up

Recommended deploy step
- Deploy this build
- Open the site once in Safari
- Let it finish loading
- Close Safari
- Reopen the Home Screen app
