const AINEO_APP_VERSION = "v42.3.24";
const INSTALL_DISMISSED_KEY = "aineo_install_dismissed";
let deferredInstallPrompt = null;

async function registerStandaloneServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const swUrl = new URL("./service-worker.js", window.location.href).pathname;
    const registration = await navigator.serviceWorker.register(swUrl);
    if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) worker.postMessage({ type: "SKIP_WAITING" });
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
  if (!toggle || !nav || toggle.dataset.navBound === "true") return;
  toggle.dataset.navBound = "true";
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    toggle.textContent = isOpen ? "✕" : "☰";
  });
  nav.querySelectorAll("a").forEach((link) => {
    if (link.dataset.navCloseBound === "true") return;
    link.dataset.navCloseBound = "true";
    link.addEventListener("click", () => closeMobileNav(toggle, nav));
  });
  if (!window.__AINEO_APP_JS_NAV_RESIZE__) {
    window.__AINEO_APP_JS_NAV_RESIZE__ = true;
    window.addEventListener("resize", () => {
      if (window.innerWidth > 640) closeMobileNav(toggle, nav);
    });
  }
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
  guard.innerHTML = `<div class="orientation-guard-card"><div class="orientation-guard-icon" aria-hidden="true">📱</div><p class="orientation-guard-eyebrow">Portrait Mode</p><h2>Rotate back upright</h2><p>Aineo Music is optimized for portrait on phones and tablets.</p></div>`;
  document.body.appendChild(guard);
  return guard;
}
async function tryLockPortrait() {
  try { if (screen.orientation && typeof screen.orientation.lock === "function") { await screen.orientation.lock("portrait-primary"); return true; } } catch (error) {}
  return false;
}
function updateOrientationGuard() {
  const guard = ensureOrientationGuard();
  const shouldGuard = isSmallTouchScreen() && window.innerWidth > window.innerHeight;
  document.body.classList.toggle("orientation-guard-active", shouldGuard);
  guard.classList.toggle("show", shouldGuard);
  guard.setAttribute("aria-hidden", shouldGuard ? "false" : "true");
}
function initPortraitLock() {
  if (!isSmallTouchScreen()) return;
  const lockAndUpdate = async () => { await tryLockPortrait(); updateOrientationGuard(); };
  lockAndUpdate();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) lockAndUpdate(); });
  window.addEventListener("resize", updateOrientationGuard, { passive: true });
  window.addEventListener("orientationchange", lockAndUpdate, { passive: true });
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
function isIosSafari() {
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}
function shouldShowInstallUi() {
  if (isStandalone()) return false;
  if (localStorage.getItem(INSTALL_DISMISSED_KEY) === AINEO_APP_VERSION) return false;
  return Boolean(deferredInstallPrompt || isIosSafari());
}
function ensureInstallUi() {
  let banner = document.getElementById("installBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "installBanner";
    banner.className = "install-banner hidden";
    banner.innerHTML = `<div class="install-banner-copy"><strong>Install Aineo Music</strong><p>Open it like an app with faster launching and better offline support.</p></div><div class="install-banner-actions"><button type="button" class="action-btn small-action-btn" data-open-install-modal>Install</button><button type="button" class="action-btn secondary-btn small-action-btn" data-dismiss-install>Later</button></div>`;
    document.body.appendChild(banner);
  }
  let modal = document.getElementById("installModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "installModal";
    modal.className = "install-modal hidden";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `<div class="install-modal-backdrop" data-close-install-modal></div><div class="install-modal-content" role="dialog" aria-modal="true" aria-labelledby="installModalTitle"><div class="install-modal-header"><div><p class="eyebrow">Install</p><h2 id="installModalTitle">Get the Aineo Music App</h2></div><button type="button" class="control-btn" data-close-install-modal aria-label="Close install dialog">✕</button></div><div class="install-modal-body"><p class="page-lead">Install Aineo Music for a cleaner, app-like experience.</p><div id="installModalSteps" class="install-steps"></div><div class="card-actions"><button id="confirmInstallBtn" type="button" class="action-btn">Install App</button><a class="action-btn secondary-btn" href="./install.html">Install Guide</a></div></div></div>`;
    document.body.appendChild(modal);
  }
  const openBtn = banner.querySelector("[data-open-install-modal]");
  if (openBtn && openBtn.dataset.installBound !== "true") {
    openBtn.dataset.installBound = "true";
    openBtn.addEventListener("click", openInstallModal);
  }
  const dismissBtn = banner.querySelector("[data-dismiss-install]");
  if (dismissBtn && dismissBtn.dataset.installBound !== "true") {
    dismissBtn.dataset.installBound = "true";
    dismissBtn.addEventListener("click", dismissInstallUi);
  }
  modal.querySelectorAll("[data-close-install-modal]").forEach(btn => {
    if (btn.dataset.installBound === "true") return;
    btn.dataset.installBound = "true";
    btn.addEventListener("click", closeInstallModal);
  });
  const confirmBtn = modal.querySelector("#confirmInstallBtn");
  if (confirmBtn && confirmBtn.dataset.installBound !== "true") {
    confirmBtn.dataset.installBound = "true";
    confirmBtn.addEventListener("click", triggerInstallPrompt);
  }
}
function installStepsMarkup() {
  if (deferredInstallPrompt) return `<ol class="utility-list"><li>Tap <strong>Install App</strong> below.</li><li>Confirm the browser prompt.</li><li>Launch Aineo Music from your home screen or apps list.</li></ol>`;
  if (isIosSafari()) return `<ol class="utility-list"><li>Tap the <strong>Share</strong> button in Safari.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>.</li></ol>`;
  return `<ol class="utility-list"><li>Open Aineo Music in Chrome, Edge, or another supported browser.</li><li>Look for <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</li><li>Follow the browser prompt to finish installing.</li></ol>`;
}
function renderInstallUi() {
  ensureInstallUi();
  const banner = document.getElementById("installBanner");
  const steps = document.getElementById("installModalSteps");
  if (steps) steps.innerHTML = installStepsMarkup();
  if (banner) banner.classList.toggle("hidden", !shouldShowInstallUi());
  const confirmBtn = document.getElementById("confirmInstallBtn");
  if (confirmBtn) confirmBtn.textContent = deferredInstallPrompt ? "Install App" : (isIosSafari() ? "How to Install" : "Open Install Guide");
}
function openInstallModal() {
  renderInstallUi();
  const modal = document.getElementById("installModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}
function closeInstallModal() {
  const modal = document.getElementById("installModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}
function dismissInstallUi() {
  localStorage.setItem(INSTALL_DISMISSED_KEY, AINEO_APP_VERSION);
  renderInstallUi();
  closeInstallModal();
}
async function triggerInstallPrompt() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    try { await deferredInstallPrompt.userChoice; } catch (error) {}
    deferredInstallPrompt = null;
    dismissInstallUi();
    return;
  }
  if (isIosSafari()) return;
  window.location.href = "./install.html";
}
function initInstallExperience() {
  ensureInstallUi();
  renderInstallUi();
  window.addEventListener("beforeinstallprompt", (event) => { deferredInstallPrompt = event; renderInstallUi(); });
  window.addEventListener("appinstalled", () => { deferredInstallPrompt = null; dismissInstallUi(); });
  document.querySelectorAll("[data-open-install-modal]").forEach(btn => btn.addEventListener("click", openInstallModal));
}

function initInteractionPolish() {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const rippleSelectors = [
    ".action-btn", ".mini-action-btn", ".control-btn", ".playlist-btn", ".tag-chip", ".filter-chip",
    ".search-scope-chip", ".section-toggle", ".library-quick-link", ".browse-shelf-link", ".control-link"
  ];

  const rippleTargets = document.querySelectorAll(rippleSelectors.join(","));
  rippleTargets.forEach((el) => {
    if (el.dataset.rippleBound === "true") return;
    el.dataset.rippleBound = "true";
    el.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "tap-ripple";
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      el.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 700);
    });
  });

  const actionableRows = document.querySelectorAll('.featured-track-row, .album-track-row, .queue-row, .mini-card, .album-card, .catalog-card');
  actionableRows.forEach((row) => {
    if (row.dataset.pressBound === "true") return;
    row.dataset.pressBound = "true";
    row.addEventListener('pointerdown', () => row.classList.add('is-pressed'), { passive: true });
    const clear = () => row.classList.remove('is-pressed');
    row.addEventListener('pointerup', clear, { passive: true });
    row.addEventListener('pointercancel', clear, { passive: true });
    row.addEventListener('pointerleave', clear, { passive: true });
  });
}
function injectVersionText() {
  document.querySelectorAll(".app-version").forEach(el => { el.textContent = AINEO_APP_VERSION; });
}
window.addEventListener("load", registerStandaloneServiceWorker);
document.addEventListener("DOMContentLoaded", () => { initBasicMobileNav(); initPortraitLock(); initInstallExperience(); injectVersionText(); initInteractionPolish(); document.body.classList.add("motion-enabled"); window.requestAnimationFrame(() => document.body.classList.add("motion-ready")); });
