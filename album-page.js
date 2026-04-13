
// v43.1.25 hard reset
const APP_VERSION = "43.1.25";
try {
  const stored = localStorage.getItem("app_version");
  if (stored !== APP_VERSION) {
    localStorage.clear();
    sessionStorage.clear();
    if (window.indexedDB) {
      indexedDB.databases && indexedDB.databases().then(dbs => {
        dbs.forEach(db => indexedDB.deleteDatabase(db.name));
      });
    }
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
    localStorage.setItem("app_version", APP_VERSION);
    window.location.reload(true);
  }
} catch(e) {}
document.addEventListener("DOMContentLoaded", () => {
  window.AineoShared?.initSecondaryPageNav?.();
  window.initBasicMobileNav?.();
  ensureAlbumPageMobileNavFallback();
  window.AineoAlbumPage?.init?.();
});
function ensureAlbumPageMobileNavFallback() {
  const toggle = document.getElementById("mobileNavToggle");
  const nav = document.getElementById("siteNavLinks");
  if (!toggle || !nav) return;
  if (toggle.dataset.navBound === "true") return;
  toggle.dataset.navBound = "true";
  ["pointerdown", "touchstart"].forEach(eventName => {
    toggle.addEventListener(eventName, event => {
      event.stopPropagation();
    }, { passive: true });
  });
  toggle.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    const open = nav.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.textContent = open ? "✕" : "☰";
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "☰";
  }));
}

