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

