// v43.2.29 foreground page menu + bottom nav fast-tap authority
(function () {
  const MENU_ID = "aineoPageMenuOverlay";

  function getSourceLinks() {
    const nav = document.getElementById("siteNavLinks") || document.querySelector(".nav-menu");
    const links = Array.from(nav?.querySelectorAll("a[href]") || []);
    const seen = new Set();
    return links
      .map(link => ({
        href: link.getAttribute("href") || "#",
        label: (link.textContent || "").trim() || "Page",
        current: link.getAttribute("aria-current") === "page" || link.classList.contains("active")
      }))
      .filter(item => {
        const key = `${item.label}|${item.href}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  function closeNativeNav() {
    const nav = document.getElementById("siteNavLinks") || document.querySelector(".nav-menu");
    const toggle = document.getElementById("mobileNavToggle") || document.querySelector(".hamburger");
    nav?.classList.remove("nav-open", "open");
    document.body.classList.remove("nav-open");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "☰";
    }
  }

  function clearBottomIconState() {
    const row = document.querySelector(".aineo-bottom-icon-row");
    if (!row) return null;
    row.querySelectorAll(".aineo-bottom-icon").forEach(icon => {
      icon.classList.remove("active");
      icon.removeAttribute("data-panel-selected");
      if (icon.getAttribute("aria-current") === "page") icon.removeAttribute("aria-current");
    });
    return row;
  }

  function markBottomIcon(icon) {
    if (!icon) return;
    icon.classList.add("active");
    icon.setAttribute("data-panel-selected", "true");
    icon.setAttribute("aria-current", "page");
  }

  function restoreBottomNavSelection() {
    const row = clearBottomIconState();
    if (!row) return;

    let target = null;
    if (document.body.classList.contains("library-panel-playlists-open")) {
      target = row.querySelector('[data-open-library-panel="playlists"]');
    } else if (document.body.classList.contains("library-panel-filters-open")) {
      target = row.querySelector('[data-open-library-panel="filters"]');
    } else if (location.pathname.endsWith("/music.html") || document.body.classList.contains("library-page-cleanup")) {
      target = row.querySelector('a[href$="/music.html"], a[href="/music.html"]');
    } else {
      target = row.querySelector('a[href$="/index.html"], a[href="/index.html"], a[href="/"]');
    }
    markBottomIcon(target);
  }

  function setMoreBottomNavActive() {
    const row = clearBottomIconState();
    if (!row) return;
    markBottomIcon(row.querySelector("[data-open-nav]"));
  }

  function ensureOverlay() {
    let overlay = document.getElementById(MENU_ID);
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = MENU_ID;
    overlay.className = "aineo-page-menu-overlay hidden";
    overlay.dataset.version = "43.2.29";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="aineo-page-menu-backdrop" data-aineo-page-menu-close></div>
      <section class="aineo-page-menu-card" role="dialog" aria-modal="true" aria-labelledby="aineoPageMenuTitle">
        <div class="aineo-page-menu-header">
          <div>
            <p class="aineo-page-menu-kicker">Aineo Music</p>
            <h2 id="aineoPageMenuTitle">Pages</h2>
          </div>
          <button class="aineo-page-menu-close" type="button" aria-label="Close page menu" data-aineo-page-menu-close>×</button>
        </div>
        <nav class="aineo-page-menu-links" aria-label="All pages"></nav>
      </section>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (event) => {
      if (event.target.closest("[data-aineo-page-menu-close]")) {
        event.preventDefault();
        close();
      }
    });
    return overlay;
  }

  function renderLinks(overlay) {
    const linkMount = overlay.querySelector(".aineo-page-menu-links");
    if (!linkMount) return;
    const links = getSourceLinks();
    linkMount.innerHTML = links.map(item => `
      <a class="aineo-page-menu-link ${item.current ? "is-current" : ""}" href="${escapeAttribute(item.href)}" ${item.current ? 'aria-current="page"' : ""}>
        <span>${escapeHtml(item.label)}</span><strong aria-hidden="true">›</strong>
      </a>
    `).join("");
    linkMount.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => close(), { once: true });
    });
  }

  function open() {
    closeNativeNav();
    const overlay = ensureOverlay();
    renderLinks(overlay);
    overlay.classList.remove("hidden");
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("aineo-page-menu-open");
    setMoreBottomNavActive();
    const toggle = document.getElementById("mobileNavToggle") || document.querySelector(".hamburger");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "true");
      toggle.textContent = "✕";
    }
    requestAnimationFrame(() => overlay.querySelector(".aineo-page-menu-close")?.focus?.());
  }

  function close() {
    const overlay = document.getElementById(MENU_ID);
    if (overlay) {
      overlay.classList.remove("show");
      overlay.classList.add("hidden");
      overlay.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("aineo-page-menu-open");
    closeNativeNav();
    restoreBottomNavSelection();
  }

  function toggle() {
    const overlay = document.getElementById(MENU_ID);
    if (overlay && overlay.classList.contains("show")) close();
    else open();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  document.addEventListener("click", (event) => {
    const menuTrigger = event.target.closest("#mobileNavToggle, .hamburger, [data-open-nav]");
    if (!menuTrigger) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    toggle();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  window.AineoNav = { open, close, toggle };
})();




// v43.2.29 root bottom-nav navigation authority.
// Root fix: v43.2.29 moved real actions onto pointerup and then suppressed the follow-up click.
// On iOS/PWA that made navigation and panel changes feel delayed or fail entirely.
// This restores a single click/tap activation path while keeping pointerdown visual feedback only.
(function () {
  const NAV_ITEM = ".aineo-bottom-icon";
  const PRESS_CLASS = "is-pressed";

  function getRow() {
    return document.querySelector(".aineo-bottom-icon-row");
  }

  function normalizePanel(panel) {
    const value = String(panel || "library").toLowerCase();
    if (value === "quick-filters" || value === "quickfilters") return "filters";
    if (value === "playlists" || value === "filters" || value === "search") return value;
    return "library";
  }

  function clearPressState() {
    getRow()?.querySelectorAll(`${NAV_ITEM}.${PRESS_CLASS}`).forEach(item => item.classList.remove(PRESS_CLASS));
  }

  function clearSelection() {
    const row = getRow();
    if (!row) return null;
    row.querySelectorAll(NAV_ITEM).forEach(icon => {
      icon.classList.remove("active");
      icon.removeAttribute("data-panel-selected");
      if (icon.getAttribute("aria-current") === "page") icon.removeAttribute("aria-current");
    });
    return row;
  }

  function selectItem(item) {
    if (!item) return;
    const row = clearSelection();
    if (!row) return;
    item.classList.add("active");
    item.setAttribute("data-panel-selected", "true");
    item.setAttribute("aria-current", "page");
  }

  function isSamePageUrl(href) {
    if (!href) return false;
    try {
      const url = new URL(href, window.location.href);
      return url.origin === window.location.origin &&
        url.pathname.replace(/\/index\.html$/, "/") === window.location.pathname.replace(/\/index\.html$/, "/") &&
        url.search === window.location.search;
    } catch (error) {
      return false;
    }
  }

  function getPanelFromHref(href) {
    try {
      const url = new URL(href, window.location.href);
      if (!url.pathname.endsWith("/music.html") && url.pathname !== "/music.html") return "";
      return normalizePanel(url.searchParams.get("panel") || "library");
    } catch (error) {
      return "";
    }
  }

  function openPanel(panel) {
    const normalized = normalizePanel(panel);
    if (window.AineoLibraryPanels?.open) {
      window.AineoLibraryPanels.open(normalized);
      return true;
    }
    return false;
  }

  function instantScrollTop() {
    try { window.history.scrollRestoration = "manual"; } catch (error) {}
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  function syncFromLocation() {
    const row = clearSelection();
    if (!row) return;
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const panel = normalizePanel(params.get("panel") || "library");
    let target = null;

    if (document.body.classList.contains("library-panel-playlists-open") || (path.endsWith("/music.html") && panel === "playlists")) {
      target = row.querySelector('[data-open-library-panel="playlists"], a[href*="panel=playlists"]');
    } else if (document.body.classList.contains("library-panel-filters-open") || (path.endsWith("/music.html") && panel === "filters")) {
      target = row.querySelector('[data-open-library-panel="filters"], a[href*="panel=filters"]');
    } else if (path.endsWith("/music.html")) {
      target = row.querySelector('a[href="/music.html"], a[href$="/music.html"]');
    } else {
      target = row.querySelector('a[href="/index.html"], a[href$="/index.html"], a[href="/"]');
    }
    if (target) selectItem(target);
  }

  document.addEventListener("pointerdown", event => {
    const item = event.target.closest(NAV_ITEM);
    const row = getRow();
    if (!item || !row?.contains(item)) return;
    item.classList.add(PRESS_CLASS);
  }, { passive: true, capture: true });

  ["pointerup", "pointercancel", "pointerleave", "touchcancel", "scroll"].forEach(name => {
    document.addEventListener(name, clearPressState, { passive: true, capture: true });
  });

  document.addEventListener("click", event => {
    const item = event.target.closest(NAV_ITEM);
    const row = getRow();
    if (!item || !row?.contains(item)) return;

    item.classList.remove(PRESS_CLASS);

    const panelButton = item.closest("[data-open-library-panel]");
    if (panelButton) {
      event.preventDefault();
      event.stopPropagation();
      selectItem(item);
      const panel = normalizePanel(panelButton.dataset.openLibraryPanel || "library");
      if (!openPanel(panel)) {
        window.location.assign(`/music.html?panel=${encodeURIComponent(panel)}`);
      }
      return;
    }

    if (item.matches("[data-open-nav]")) {
      // The foreground page menu handler above owns this button. This is a safe fallback only.
      selectItem(item);
      window.AineoNav?.toggle?.();
      return;
    }

    if (item instanceof HTMLAnchorElement) {
      const href = item.getAttribute("href") || "";
      const panel = getPanelFromHref(href);
      const currentlyOnLibrary = window.location.pathname.endsWith("/music.html");

      if (currentlyOnLibrary && panel) {
        event.preventDefault();
        event.stopPropagation();
        selectItem(item);
        if (panel === "library") {
          window.AineoLibraryPanels?.close?.();
          window.AineoLibraryPanels?.select?.("library");
          window.AineoLibraryPanels?.scrollToTop?.("library");
        } else if (!openPanel(panel)) {
          window.location.assign(`/music.html?panel=${encodeURIComponent(panel)}`);
        }
        return;
      }

      if (isSamePageUrl(href)) {
        event.preventDefault();
        event.stopPropagation();
        selectItem(item);
        instantScrollTop();
        return;
      }

      try {
        const targetUrl = new URL(href, window.location.href);
        sessionStorage.setItem("aineo_bottom_nav_pending", targetUrl.pathname + targetUrl.search);
      } catch (error) {}
      selectItem(item);
      // Let the anchor's native navigation proceed. This is the most reliable path in iOS PWA mode.
    }
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncFromLocation, { once: true });
  } else {
    syncFromLocation();
  }
  window.addEventListener("pageshow", syncFromLocation, { passive: true });
})();

// v43.2.29 mini player visibility guard for Home/Library bottom-nav screens.
(function () {
  function recoverMiniPlayer() {
    if (!document.body.classList.contains("has-aineo-bottom-nav")) return;
    const player = document.querySelector(".sticky-player");
    if (!player) return;
    player.hidden = false;
    player.classList.remove("hidden");
    player.removeAttribute("aria-hidden");
    player.style.removeProperty("display");
    player.style.removeProperty("visibility");
    player.style.removeProperty("opacity");
    document.body.classList.add("aineo-mini-player-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", recoverMiniPlayer, { once: true });
  } else {
    recoverMiniPlayer();
  }
  window.addEventListener("pageshow", recoverMiniPlayer);
  window.addEventListener("load", recoverMiniPlayer, { once: true });
  window.setTimeout(recoverMiniPlayer, 120);
  window.setTimeout(recoverMiniPlayer, 650);
})();
