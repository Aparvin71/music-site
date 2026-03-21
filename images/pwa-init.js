async function registerStandaloneServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register("/service-worker.js");

    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;

      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          worker.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });
  } catch (error) {
    console.warn("Service worker registration failed:", error);
  }
}

function closeMobileNav(toggle, nav) {
  if (!toggle || !nav) return;
  nav.classList.remove("nav-open");
  toggle.setAttribute("aria-expanded", "false");
  toggle.textContent = "☰";
}

function navigateToLink(link) {
  const href = link?.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

  const url = new URL(href, window.location.origin);
  if (url.origin !== window.location.origin) {
    window.location.href = url.toString();
    return;
  }

  // Force navigation in installed PWA mode where default anchor behavior can be flaky.
  window.location.assign(url.pathname + url.search + url.hash);
}

function initBasicMobileNav() {
  const toggle = document.getElementById("mobileNavToggle");
  const nav = document.getElementById("siteNavLinks");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    toggle.textContent = isOpen ? "✕" : "☰";
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      closeMobileNav(toggle, nav);
      requestAnimationFrame(() => navigateToLink(link));
    });
  });
}

window.addEventListener("load", registerStandaloneServiceWorker);
document.addEventListener("DOMContentLoaded", initBasicMobileNav);
