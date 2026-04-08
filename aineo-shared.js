(function () {
  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function getJsonCacheKey(url) {
    return `aineo_json_cache:${String(url).replace(/[^a-z0-9._-]+/gi, "_")}`;
  }

  async function fetchJson(url, fallback) {
    const version = window.AineoConfig?.assetVersion || window.AineoConfig?.version || "1";
    const requestUrl = `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}`;
    const cacheKey = getJsonCacheKey(url);
    try {
      const response = await fetch(requestUrl, { cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch (_) {}
      return data;
    } catch (error) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (_) {}
      console.warn(`Could not load ${url}:`, error);
      return fallback;
    }
  }

  function normalizeStringArray(value) {
    if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
    if (typeof value === "string") return value.split(",").map(v => v.trim()).filter(Boolean);
    return [];
  }

  function getTrackCounts(tracks) {
    return tracks.reduce((map, track) => {
      const album = String(track.album || "").trim().toLowerCase();
      if (!album) return map;
      map[album] = (map[album] || 0) + 1;
      return map;
    }, {});
  }

  function groupTracksByArtist(tracks) {
    const map = new Map();
    tracks.forEach(track => {
      const artist = String(track.artist || "").trim();
      if (!artist) return;
      if (!map.has(artist)) map.set(artist, []);
      map.get(artist).push(track);
    });
    return [...map.entries()].map(([artist, artistTracks]) => ({ artist, tracks: artistTracks }));
  }

  function initSecondaryPageNav() {
    if (typeof window.initBasicMobileNav === "function") {
      window.initBasicMobileNav();
      return;
    }
    const toggle = document.getElementById("mobileNavToggle");
    const nav = document.getElementById("siteNavLinks");
    if (!toggle || !nav) return;
    if (toggle.dataset.navBound === "true") return;
    toggle.dataset.navBound = "true";
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggle.textContent = isOpen ? "✕" : "☰";
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "☰";
    }));
  }

  function renderScriptureLinks(refs, options = {}) {
    const list = Array.isArray(refs)
      ? refs.map(ref => String(ref).trim()).filter(Boolean)
      : normalizeStringArray(refs);
    if (!list.length) return "";
    const compactClass = options.compact ? " scripture-link--compact" : "";
    return list.map(ref => {
      const url = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}`;
      return `<a class="scripture-link${compactClass}" href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(ref)}</a>`;
    }).join("");
  }

  window.AineoShared = {
    escapeHtml,
    escapeAttr,
    fetchJson,
    normalizeStringArray,
    getTrackCounts,
    groupTracksByArtist,
    initSecondaryPageNav,
    renderScriptureLinks
  };
})();
