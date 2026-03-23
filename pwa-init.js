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

function isTouchDevice() {
  return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
}

function isSmallTouchScreen() {
  return isTouchDevice() && Math.max(window.innerWidth, window.innerHeight) <= 1366;
}

function ensureOrientationGuard() {
  let guard = document.getElementById("orientationGuard");
  if (guard) return guard;

  guard = document.createElement("div");
  guard.id = "orientationGuard";
  guard.className = "orientation-guard";
  guard.setAttribute("aria-hidden", "true");
  guard.innerHTML = `
    <div class="orientation-guard-card">
      <div class="orientation-guard-icon" aria-hidden="true">📱</div>
      <p class="orientation-guard-eyebrow">Portrait Mode</p>
      <h2>Rotate back upright</h2>
      <p>Aineo Music is optimized for portrait on phones and tablets.</p>
    </div>
  `;

  document.body.appendChild(guard);
  return guard;
}

async function tryLockPortrait() {
  try {
    if (screen.orientation && typeof screen.orientation.lock === "function") {
      await screen.orientation.lock("portrait-primary");
      return true;
    }
  } catch (error) {
    // Ignore unsupported-browser and permission/fullscreen errors.
  }
  return false;
}

function updateOrientationGuard() {
  const guard = ensureOrientationGuard();
  const isLandscape = window.innerWidth > window.innerHeight;
  const shouldGuard = isSmallTouchScreen() && isLandscape;

  document.body.classList.toggle("orientation-guard-active", shouldGuard);
  guard.classList.toggle("show", shouldGuard);
  guard.setAttribute("aria-hidden", shouldGuard ? "false" : "true");
}

function initPortraitLock() {
  if (!isSmallTouchScreen()) return;

  const lockAndUpdate = async () => {
    await tryLockPortrait();
    updateOrientationGuard();
  };

  lockAndUpdate();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) lockAndUpdate();
  });
  window.addEventListener("resize", updateOrientationGuard, { passive: true });
  window.addEventListener("orientationchange", lockAndUpdate, { passive: true });
}

window.addEventListener("load", registerStandaloneServiceWorker);
document.addEventListener("DOMContentLoaded", () => {
  initBasicMobileNav();
  initPortraitLock();
});
