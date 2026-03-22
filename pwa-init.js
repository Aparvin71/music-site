async function registerStandaloneServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const swUrl = new URL("./service-worker.js", window.location.href).pathname;
    const registration = await navigator.serviceWorker.register(swUrl);

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

function initBasicMobileNav() {
  if (window.__AINEO_APP_JS_NAV__) return;

  const toggle = document.getElementById("mobileNavToggle");
  const nav = document.getElementById("siteNavLinks");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    toggle.textContent = isOpen ? "✕" : "☰";
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileNav(toggle, nav);
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 640) {
      closeMobileNav(toggle, nav);
    }
  });
}

window.addEventListener("load", registerStandaloneServiceWorker);
document.addEventListener("DOMContentLoaded", initBasicMobileNav);
