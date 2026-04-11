const AINEO_APP_VERSION = "v42.5.1";
const INSTALL_DISMISSED_KEY = "aineo_install_dismissed";
const INSTALL_SESSION_SEEN_KEY = "aineo_install_seen_session";
const OFFLINE_HINT_DISMISSED_KEY = "aineo_offline_hint_dismissed";
const OFFLINE_HINT_SESSION_SEEN_KEY = "aineo_offline_hint_seen_session";
let deferredInstallPrompt = null;

const APP_FEEL_SETTINGS_KEY = "aineo_app_feel_settings";
const APP_FEEL_DEFAULTS = {
  reducedMotionUi: false,
  showInstallTips: false,
  downloadHints: false
};

function loadAppFeelSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(APP_FEEL_SETTINGS_KEY) || "{}");
    return { ...APP_FEEL_DEFAULTS, ...parsed };
  } catch (error) {
    return { ...APP_FEEL_DEFAULTS };
  }
}

function saveAppFeelSettings(nextSettings) {
  try {
    localStorage.setItem(APP_FEEL_SETTINGS_KEY, JSON.stringify(nextSettings));
  } catch (error) {}
}

function applyAppFeelSettings() {
  const settings = loadAppFeelSettings();
  document.body.classList.toggle("ui-reduced-motion", Boolean(settings.reducedMotionUi));
  document.documentElement.classList.toggle("ui-reduced-motion", Boolean(settings.reducedMotionUi));
}

function ensureSettingsSurface() {
  let surface = document.getElementById("appFeelSurface");
  if (surface) return surface;
  surface = document.createElement("div");
  surface.id = "appFeelSurface";
  surface.className = "app-feel-surface hidden";
  surface.setAttribute("aria-hidden", "true");
  surface.innerHTML = `
    <div class="app-feel-surface-backdrop" data-close-app-feel></div>
    <div class="app-feel-surface-panel" role="dialog" aria-modal="true" aria-labelledby="appFeelSurfaceTitle">
      <div class="app-feel-surface-header">
        <div>
          <p class="eyebrow">Aineo Music</p>
          <h2 id="appFeelSurfaceTitle">Settings &amp; About</h2>
        </div>
        <button type="button" class="control-btn" data-close-app-feel aria-label="Close settings">✕</button>
      </div>
      <div class="app-feel-surface-body">
        <section class="app-feel-group">
          <h3>App Feel</h3>
          <label class="app-feel-toggle">
            <span>Reduce interface motion</span>
            <input type="checkbox" id="settingReducedMotionUi" />
          </label>
          <label class="app-feel-toggle">
            <span>Auto-show install tips</span>
            <input type="checkbox" id="settingShowInstallTips" />
          </label>
          <label class="app-feel-toggle">
            <span>Auto-show offline download hints</span>
            <input type="checkbox" id="settingDownloadHints" />
          </label>
        </section>
        <section class="app-feel-group">
          <h3>Quick Links</h3>
          <div class="card-actions">
            <a class="action-btn secondary-btn" href="./install.html">Install Guide</a>
            <a class="action-btn secondary-btn" href="./about.html">About</a>
            <a class="action-btn secondary-btn" href="./changelog.html">What’s New</a>
          </div>
        </section>
        <section class="app-feel-group">
          <h3>About this build</h3>
          <p class="page-lead compact-lead">Version <span class="app-version">v42.5.1</span></p>
          <p class="mission-statement mission-statement--summary">This build keeps install and offline help tucked inside Settings &amp; About by default, and upgrades the player visualizer into one continuous flowing bar wave behind the artwork.</p>
        </section>
      </div>
    </div>
  `;
  document.body.appendChild(surface);

  surface.querySelectorAll("[data-close-app-feel]").forEach((btn) => {
    btn.addEventListener("click", closeSettingsSurface);
  });

  const bindToggle = (id, key) => {
    const input = surface.querySelector(id);
    if (!input) return;
    const settings = loadAppFeelSettings();
    input.checked = Boolean(settings[key]);
    input.addEventListener("change", () => {
      const next = loadAppFeelSettings();
      next[key] = Boolean(input.checked);
      saveAppFeelSettings(next);
      applyAppFeelSettings();
      renderInstallUi?.();
      renderOfflineHintCard?.();
    });
  };

  bindToggle("#settingReducedMotionUi", "reducedMotionUi");
  bindToggle("#settingShowInstallTips", "showInstallTips");
  bindToggle("#settingDownloadHints", "downloadHints");
  return surface;
}

function openSettingsSurface() {
  const surface = ensureSettingsSurface();
  surface.classList.remove("hidden");
  surface.classList.add("show");
  surface.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeSettingsSurface() {
  const surface = document.getElementById("appFeelSurface");
  if (!surface) return;
  surface.classList.remove("show");
  surface.classList.add("hidden");
  surface.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function ensureFloatingSettingsButton() {
  if (!isStandalone()) return;
  let btn = document.getElementById("floatingSettingsButton");
  if (btn) return btn;
  btn = document.createElement("button");
  btn.id = "floatingSettingsButton";
  btn.type = "button";
  btn.className = "floating-settings-btn";
  btn.setAttribute("aria-label", "Open settings and about");
  btn.textContent = "⋯";
  btn.addEventListener("click", openSettingsSurface);
  document.body.appendChild(btn);
  return btn;
}

function shouldShowInstallUi() {
  const settings = loadAppFeelSettings();
  if (!settings.showInstallTips) return false;
  if (isStandalone()) return false;
  if (!isPrimaryLandingPage()) return false;
  if (localStorage.getItem(INSTALL_DISMISSED_KEY) === AINEO_APP_VERSION) return false;
  if (hasSessionSeen(INSTALL_SESSION_SEEN_KEY)) return false;
  return Boolean(deferredInstallPrompt || isIosSafari());
}

function renderOfflineHintCard() {
  const settings = loadAppFeelSettings();
  let card = document.getElementById("offlineHintCard");
  if (!settings.downloadHints) {
    card?.remove();
    return;
  }
  if (!card) {
    card = document.createElement("div");
    card.id = "offlineHintCard";
    card.className = "offline-hint-card hidden";
    card.innerHTML = `
      <div class="offline-hint-card-copy">
        <strong>Offline listening tip</strong>
        <p>Save favorite tracks for faster repeat listening and a more app-like experience when your connection is weak.</p>
      </div>
      <button type="button" class="control-btn" data-dismiss-offline-hint aria-label="Dismiss offline tip">✕</button>
    `;
    document.body.appendChild(card);
    card.querySelector("[data-dismiss-offline-hint]")?.addEventListener("click", () => {
      try { localStorage.setItem(OFFLINE_HINT_DISMISSED_KEY, AINEO_APP_VERSION); } catch (error) {}
      markSessionSeen(OFFLINE_HINT_SESSION_SEEN_KEY);
      card.classList.add("hidden");
    });
  }
  const standalonePreferred = isStandalone() || isIosSafari();
  const wasDismissed = localStorage.getItem(OFFLINE_HINT_DISMISSED_KEY) === AINEO_APP_VERSION;
  const seenThisSession = hasSessionSeen(OFFLINE_HINT_SESSION_SEEN_KEY);
  const shouldShow = settings.downloadHints && standalonePreferred && isPrimaryLandingPage() && !wasDismissed && !seenThisSession;
  card.classList.toggle("hidden", !shouldShow);
  if (shouldShow) markSessionSeen(OFFLINE_HINT_SESSION_SEEN_KEY);
}

function initPageMotionHooks() {
  const pageShell = document.querySelector("main, #mainContent, .page-shell");
  if (pageShell) {
    pageShell.classList.add("page-enter");
    requestAnimationFrame(() => pageShell.classList.add("page-enter-active"));
  }
}

function initAppFeelPolish() {
  applyAppFeelSettings();
  ensureFloatingSettingsButton();
  ensureSettingsSurface();
  renderOfflineHintCard();
  initPageMotionHooks();
}


const STANDALONE_WELCOME_DISMISSED_KEY = "aineo_standalone_welcome_dismissed";

function ensureStandaloneLaunchScreen() {
  let splash = document.getElementById("standaloneLaunchScreen");
  if (splash) return splash;
  splash = document.createElement("div");
  splash.id = "standaloneLaunchScreen";
  splash.className = "standalone-launch-screen hidden";
  splash.setAttribute("aria-hidden", "true");
  splash.innerHTML = `
    <div class="standalone-launch-screen-inner">
      <div class="standalone-launch-logo-wrap">
        <img src="./icons/apple-touch-icon.png" alt="Aineo Music icon" class="standalone-launch-logo" />
      </div>
      <p class="standalone-launch-kicker">Aineo Music</p>
      <h1 class="standalone-launch-title">Opening Aineo Music</h1>
    </div>
  `;
  document.body.appendChild(splash);
  return splash;
}

function showStandaloneLaunchScreen() {
  if (!isStandalone()) return;
  const splash = ensureStandaloneLaunchScreen();
  splash.classList.remove("hidden");
  splash.classList.add("show");
  splash.setAttribute("aria-hidden", "false");
  document.body.classList.add("standalone-launch-active");
  window.setTimeout(() => {
    splash.classList.remove("show");
    splash.classList.add("is-hiding");
    splash.setAttribute("aria-hidden", "true");
    document.body.classList.remove("standalone-launch-active");
    window.setTimeout(() => {
      splash.classList.add("hidden");
      splash.classList.remove("is-hiding");
    }, 260);
  }, 850);
}

function ensureStandaloneWelcomeCard() {
  let card = document.getElementById("standaloneWelcomeCard");
  if (card) return card;
  card = document.createElement("div");
  card.id = "standaloneWelcomeCard";
  card.className = "standalone-welcome hidden";
  card.setAttribute("aria-hidden", "true");
  card.innerHTML = `
    <div class="standalone-welcome-backdrop" data-close-standalone-welcome></div>
    <div class="standalone-welcome-card" role="dialog" aria-modal="true" aria-labelledby="standaloneWelcomeTitle">
      <div class="standalone-welcome-grabber" aria-hidden="true"></div>
      <p class="eyebrow">Home Screen app mode</p>
      <h2 id="standaloneWelcomeTitle">A cleaner iPhone Home Screen experience</h2>
      <ul class="utility-list standalone-welcome-list">
        <li>Launch Aineo Music from your Home Screen for the cleanest app-style view.</li>
        <li>Swipe <strong>up</strong> on the mini player to open the full player.</li>
        <li>The player and overlays are tuned to sit more comfortably around the iPhone safe areas.</li>
      </ul>
      <div class="card-actions">
        <button type="button" class="action-btn" data-dismiss-standalone-welcome>Continue</button>
      </div>
    </div>
  `;
  document.body.appendChild(card);
  card.querySelectorAll("[data-close-standalone-welcome], [data-dismiss-standalone-welcome]").forEach(btn => {
    btn.addEventListener("click", dismissStandaloneWelcome);
  });
  return card;
}

function openStandaloneWelcome() {
  const card = ensureStandaloneWelcomeCard();
  card.classList.remove("hidden");
  card.classList.add("show");
  card.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function dismissStandaloneWelcome() {
  const card = document.getElementById("standaloneWelcomeCard");
  if (!card) return;
  localStorage.setItem(STANDALONE_WELCOME_DISMISSED_KEY, AINEO_APP_VERSION);
  card.classList.remove("show");
  card.classList.add("hidden");
  card.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function maybeShowStandaloneWelcome() {
  if (!isStandalone() || !isIosSafari() && !/iPad|iPhone|iPod/.test(navigator.userAgent || "")) return;
  if (localStorage.getItem(STANDALONE_WELCOME_DISMISSED_KEY) === AINEO_APP_VERSION) return;
  window.setTimeout(openStandaloneWelcome, 1100);
}


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

const TRACKS_UPDATE_SIGNATURE_KEY = "aineo_tracks_signature";
const APP_UPDATE_ANNOUNCED_VERSION_KEY = "aineo_app_update_announced_version";
const APP_UPDATE_SESSION_FLAG_KEY = "aineo_app_update_session_flag";
const APP_RUNTIME_VERSION = "v42.5.1";
const TRACKS_UPDATE_CHECK_INTERVAL = 4 * 60 * 1000;
let tracksUpdateTimer = null;
let lastKnownTracksSignature = null;
let lastKnownTracksUrl = null;
let appRefreshPending = false;
let appRefreshReason = "";

function getCurrentAudioPlayer() {
  return document.getElementById("audioPlayer");
}

function isPlaybackActive() {
  const audio = getCurrentAudioPlayer();
  return Boolean(audio && !audio.paused && !audio.ended && audio.readyState > 2);
}

function canAutoRefreshNow() {
  return document.visibilityState === "visible" && navigator.onLine !== false && !isPlaybackActive();
}

function simpleStringHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return String(hash >>> 0);
}

function ensureAppUpdateToast() {
  let mount = document.getElementById("appUpdateToast");
  if (mount) return mount;

  mount = document.createElement("section");
  mount.id = "appUpdateToast";
  mount.className = "app-update-toast hidden";
  mount.setAttribute("aria-live", "polite");
  mount.innerHTML = `
    <div class="app-update-toast__card">
      <div class="app-update-toast__copy">
        <p class="eyebrow app-update-toast__eyebrow">Update Ready</p>
        <h2 id="appUpdateToastTitle">Fresh music is available</h2>
        <p id="appUpdateToastBody">The library changed in the background. Refresh to pull in the latest songs and updates.</p>
      </div>
      <div class="app-update-toast__actions">
        <button type="button" class="action-btn primary-btn small-action-btn" data-app-update-refresh>Refresh now</button>
        <button type="button" class="action-btn secondary-btn small-action-btn" data-app-update-dismiss>Later</button>
      </div>
    </div>
  `;
  document.body.appendChild(mount);

  mount.querySelector("[data-app-update-refresh]")?.addEventListener("click", () => {
    performAppRefresh({ immediate: true });
  });

  mount.querySelector("[data-app-update-dismiss]")?.addEventListener("click", () => {
    appRefreshPending = false;
    mount.classList.add("hidden");
  });

  return mount;
}

function showAppUpdateToast({ title, body, primaryLabel = "Refresh now", secondaryLabel = "Later" } = {}) {
  const mount = ensureAppUpdateToast();
  const titleEl = mount.querySelector("#appUpdateToastTitle");
  const bodyEl = mount.querySelector("#appUpdateToastBody");
  const primary = mount.querySelector("[data-app-update-refresh]");
  const secondary = mount.querySelector("[data-app-update-dismiss]");

  if (titleEl && title) titleEl.textContent = title;
  if (bodyEl && body) bodyEl.textContent = body;
  if (primary) primary.textContent = primaryLabel;
  if (secondary) secondary.textContent = secondaryLabel;
  mount.classList.remove("hidden");
}

function hideAppUpdateToast() {
  const mount = document.getElementById("appUpdateToast");
  if (mount) mount.classList.add("hidden");
}

function rememberTracksSignature(signature, url = "./tracks.json") {
  if (!signature) return;
  lastKnownTracksSignature = signature;
  lastKnownTracksUrl = url;
  try {
    localStorage.setItem(TRACKS_UPDATE_SIGNATURE_KEY, signature);
  } catch (error) {}
}

async function computeTracksSignature(url = "./tracks.json") {
  const requestUrl = new URL(url, window.location.href);
  requestUrl.searchParams.set("updateCheck", String(Date.now()));
  const response = await fetch(requestUrl.toString(), { cache: "no-store", headers: { "cache-control": "no-cache" } });
  if (!response.ok) throw new Error(`tracks.json check failed: ${response.status}`);
  const text = await response.text();
  try {
    return simpleStringHash(JSON.stringify(JSON.parse(text)));
  } catch (error) {
    return simpleStringHash(text);
  }
}


function shouldAllowAutomaticRefresh() {
  return false;
}

function notePendingRefreshSession(reason = "") {
  try {
    sessionStorage.setItem("aineo_pending_refresh_reason", String(reason || "updates"));
    sessionStorage.setItem("aineo_pending_refresh_at", String(Date.now()));
  } catch (error) {}
}

function hasRecentManualRefresh() {
  try {
    const raw = sessionStorage.getItem("aineo_manual_refresh_at");
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return (Date.now() - at) < 15000;
  } catch (error) {
    return false;
  }
}

function rememberManualRefresh() {
  try {
    sessionStorage.setItem("aineo_manual_refresh_at", String(Date.now()));
  } catch (error) {}
}

function getLastAnnouncedAppVersion() {
  try {
    return localStorage.getItem(APP_UPDATE_ANNOUNCED_VERSION_KEY) || "";
  } catch (error) {
    return "";
  }
}

function rememberAnnouncedAppVersion(version = APP_RUNTIME_VERSION) {
  try {
    localStorage.setItem(APP_UPDATE_ANNOUNCED_VERSION_KEY, String(version || APP_RUNTIME_VERSION));
  } catch (error) {}
}

function shouldAnnounceAppUpdate() {
  return getLastAnnouncedAppVersion() !== APP_RUNTIME_VERSION;
}

function markAppUpdateDetectedThisSession() {
  try {
    sessionStorage.setItem(APP_UPDATE_SESSION_FLAG_KEY, APP_RUNTIME_VERSION);
  } catch (error) {}
}

function hasAppUpdateDetectedThisSession() {
  try {
    return sessionStorage.getItem(APP_UPDATE_SESSION_FLAG_KEY) === APP_RUNTIME_VERSION;
  } catch (error) {
    return false;
  }
}

function clearAppUpdateDetectedThisSession() {
  try {
    sessionStorage.removeItem(APP_UPDATE_SESSION_FLAG_KEY);
  } catch (error) {}
}

function markBackgroundUpdateAvailable(reason = "music library updates") {
  appRefreshPending = true;
  appRefreshReason = reason;
  notePendingRefreshSession(reason);

  if (shouldAllowAutomaticRefresh() && canAutoRefreshNow() && !hasRecentManualRefresh()) {
    showAppUpdateToast({
      title: "Refreshing for new music",
      body: `Aineo detected ${reason} in the background and is pulling them in now.`
    });
    window.setTimeout(() => performAppRefresh({ immediate: true, source: "auto-background-detection" }), 900);
    return;
  }

  showAppUpdateToast({
    title: "New songs or updates are ready",
    body: isPlaybackActive()
      ? "Aineo found fresh music in the background. Finish this song, then tap Refresh now to load the latest library."
      : "Aineo found fresh music in the background. Refresh to load the latest library and app updates."
  });
}

function performAppRefresh({ immediate = false, source = "manual" } = {}) {
  if (!immediate && !canAutoRefreshNow()) return;
  if (source === "manual") rememberManualRefresh();
  rememberAnnouncedAppVersion(APP_RUNTIME_VERSION);
  clearAppUpdateDetectedThisSession();
  appRefreshPending = false;
  hideAppUpdateToast();
  window.location.reload();
}

async function maybeAutoRefreshPendingUpdate() {
  if (!appRefreshPending) return;
  if (!shouldAllowAutomaticRefresh()) {
    showAppUpdateToast({
      title: "New songs or updates are ready",
      body: "Aineo found fresh music in the background. Tap Refresh now when you want to load the latest library."
    });
    return;
  }
  if (!canAutoRefreshNow()) return;
  if (hasRecentManualRefresh()) return;
  showAppUpdateToast({
    title: "Refreshing for the newest music",
    body: `Aineo is loading the latest ${appRefreshReason || "updates"} now.`
  });
  window.setTimeout(() => performAppRefresh({ immediate: true, source: "auto-pending" }), 700);
}

async function checkForTracksJsonUpdate({ force = false } = {}) {
  if (navigator.onLine === false) return;
  if (!force && document.visibilityState === "hidden") return;

  try {
    const nextSignature = await computeTracksSignature(lastKnownTracksUrl || "./tracks.json");
    if (!lastKnownTracksSignature) {
      const stored = localStorage.getItem(TRACKS_UPDATE_SIGNATURE_KEY);
      lastKnownTracksSignature = stored || nextSignature;
      if (!stored) rememberTracksSignature(nextSignature, "./tracks.json");
      return;
    }
    if (nextSignature !== lastKnownTracksSignature) {
      rememberTracksSignature(nextSignature, "./tracks.json");
      markBackgroundUpdateAvailable("music library updates");
    }
  } catch (error) {
    console.warn("Could not check for tracks.json updates:", error);
  }
}

function initBackgroundUpdateDetection() {
  const currentPageLooksLikeApp = Boolean(document.querySelector('script[src*="app.js"], script[src*="album-page.js"], script[src*="aineo-album-page.js"]') || document.getElementById("audioPlayer"));
  if (!currentPageLooksLikeApp) return;

  const stored = (() => {
    try { return localStorage.getItem(TRACKS_UPDATE_SIGNATURE_KEY) || ""; } catch (error) { return ""; }
  })();
  if (stored) lastKnownTracksSignature = stored;

  if (!getLastAnnouncedAppVersion()) {
    rememberAnnouncedAppVersion(APP_RUNTIME_VERSION);
  }

  checkForTracksJsonUpdate({ force: true });
  if (tracksUpdateTimer) window.clearInterval(tracksUpdateTimer);
  tracksUpdateTimer = window.setInterval(() => checkForTracksJsonUpdate(), TRACKS_UPDATE_CHECK_INTERVAL);

  window.addEventListener("online", () => checkForTracksJsonUpdate({ force: true }));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkForTracksJsonUpdate({ force: true });
      maybeAutoRefreshPendingUpdate();
    }
  });

  const audio = getCurrentAudioPlayer();
  if (audio && !audio.dataset.appRefreshBound) {
    audio.dataset.appRefreshBound = "true";
    audio.addEventListener("pause", () => { window.setTimeout(maybeAutoRefreshPendingUpdate, 250); });
    audio.addEventListener("ended", () => { window.setTimeout(maybeAutoRefreshPendingUpdate, 250); });
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hasAppUpdateDetectedThisSession() || !shouldAnnounceAppUpdate()) return;
      appRefreshPending = true;
      appRefreshReason = "app updates";
      notePendingRefreshSession("app updates");
      rememberAnnouncedAppVersion(APP_RUNTIME_VERSION);
      clearAppUpdateDetectedThisSession();
      showAppUpdateToast({
        title: "App update is ready",
        body: "Aineo updated in the background. Tap Refresh now when you want to apply the newest app version."
      });
    });
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller && shouldAnnounceAppUpdate()) {
            markAppUpdateDetectedThisSession();
          }
        });
      });
    }).catch(() => {});
  }
}

window.AineoAppUpdates = {
  rememberTracksSignature,
  checkForTracksJsonUpdate,
  markBackgroundUpdateAvailable
};

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
function getCurrentPageName() {
  const path = (window.location.pathname || "").split("/").pop() || "index.html";
  return path || "index.html";
}
function isPrimaryLandingPage() {
  const page = getCurrentPageName();
  return page === "" || page === "index.html" || page === "home.html";
}
function markSessionSeen(key) {
  try { sessionStorage.setItem(key, "1"); } catch (error) {}
}
function hasSessionSeen(key) {
  try { return sessionStorage.getItem(key) === "1"; } catch (error) { return false; }
}
function shouldShowInstallUi() {
  const settings = loadAppFeelSettings();
  if (!settings.showInstallTips) return false;
  if (isStandalone()) return false;
  if (!isPrimaryLandingPage()) return false;
  if (localStorage.getItem(INSTALL_DISMISSED_KEY) === AINEO_APP_VERSION) return false;
  if (hasSessionSeen(INSTALL_SESSION_SEEN_KEY)) return false;
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
  const shouldShow = shouldShowInstallUi();
  if (banner) banner.classList.toggle("hidden", !shouldShow);
  if (shouldShow) markSessionSeen(INSTALL_SESSION_SEEN_KEY);
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


function updateAppChromeMetrics() {
  const header = document.querySelector(".site-header");
  const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 72;
  document.documentElement.style.setProperty("--app-header-height", `${headerHeight}px`);

  const vv = window.visualViewport;
  const visibleHeight = vv ? Math.round(vv.height) : window.innerHeight;
  const topInset = vv ? Math.max(0, Math.round(vv.offsetTop)) : 0;
  const bottomInset = vv ? Math.max(0, Math.round(window.innerHeight - (vv.height + vv.offsetTop))) : 0;
  document.documentElement.style.setProperty("--app-visible-height", `${visibleHeight}px`);
  document.documentElement.style.setProperty("--app-safe-top-visual", `${topInset}px`);
  document.documentElement.style.setProperty("--app-safe-bottom-visual", `${bottomInset}px`);
}

function initIosWebAppPolish() {
  const ua = navigator.userAgent || "";
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const standalone = isStandalone();
  document.documentElement.classList.toggle("ios-device", isIos);
  document.documentElement.classList.toggle("ios-standalone", standalone);
  document.body.classList.toggle("ios-device", isIos);
  document.body.classList.toggle("ios-standalone", standalone);
  if (isIos) {
    document.body.classList.add("touch-optimized");
  }
  updateAppChromeMetrics();
  window.addEventListener("resize", updateAppChromeMetrics, { passive: true });
  window.addEventListener("orientationchange", updateAppChromeMetrics, { passive: true });
  window.addEventListener("pageshow", updateAppChromeMetrics, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateAppChromeMetrics, { passive: true });
    window.visualViewport.addEventListener("scroll", updateAppChromeMetrics, { passive: true });
  }
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
document.addEventListener("DOMContentLoaded", () => { initIosWebAppPolish(); initBasicMobileNav(); initPortraitLock(); initInstallExperience(); injectVersionText(); initInteractionPolish(); initAppFeelPolish(); initBackgroundUpdateDetection(); if (isStandalone()) showStandaloneLaunchScreen(); maybeShowStandaloneWelcome(); document.body.classList.add("motion-enabled"); window.requestAnimationFrame(() => document.body.classList.add("motion-ready")); });
