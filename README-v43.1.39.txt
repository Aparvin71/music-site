Aineo Music v43.1.39 — Navigation Routing Cleanup

Purpose
- Fix hamburger page navigation errors caused by service-worker interception of document requests.
- Keep asset/data caching, but let the browser handle full page navigations directly.

What changed
- Service worker no longer intercepts navigation/document requests.
- Static assets still cache-first.
- Dynamic JSON and lyrics still network-first.
- Analysis files still stale-while-revalidate.
- Cleaned package notes down to the current pass only.
