// v43.1.84 foreground page menu authority
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

  function ensureOverlay() {
    let overlay = document.getElementById(MENU_ID);
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = MENU_ID;
    overlay.className = "aineo-page-menu-overlay hidden";
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
      <a class="${item.current ? "is-current" : ""}" href="${escapeAttribute(item.href)}" ${item.current ? 'aria-current="page"' : ""}>
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

// v43.1.84 mini player visibility guard for Home/Library bottom-nav screens.
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

