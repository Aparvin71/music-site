document.addEventListener("DOMContentLoaded", initAlbumsPage);

function ensureAlbumsPageMobileNav() {
  const toggle = document.getElementById("mobileNavToggle");
  const nav = document.getElementById("siteNavLinks");
  if (!toggle || !nav) return;
  if (toggle.dataset.navBound === "true") return;
  toggle.dataset.navBound = "true";
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.textContent = open ? "✕" : "☰";
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "☰";
  }));
}

async function initAlbumsPage() {
  window.AineoShared?.initSecondaryPageNav?.();
  ensureAlbumsPageMobileNav();

  const grid = document.getElementById("albumsGrid");
  if (!grid) return;

  const albumsData = await window.AineoShared.fetchJson("./albums.json", []);
  const albums = Array.isArray(albumsData) ? albumsData : [];

  if (!albums.length) {
    grid.innerHTML = `
      <article class="page-card">
        <p class="eyebrow">No albums yet</p>
        <h2>Your album shelf is empty.</h2>
        <p>Upload tracks with album metadata to populate this page.</p>
      </article>
    `;
    return;
  }

  const escapeHtml = window.AineoShared?.escapeHtml || ((value) => String(value || ""));
  const escapeAttr = window.AineoShared?.escapeAttr || escapeHtml;
  const normalizeStringArray = window.AineoShared?.normalizeStringArray || ((value) => Array.isArray(value) ? value : String(value || "").split(",").map(v => v.trim()).filter(Boolean));

  grid.innerHTML = albums
    .slice()
    .sort((a, b) => String(a.title || a.name || "").localeCompare(String(b.title || b.name || "")))
    .map((album) => {
      const title = album.title || album.name || "Untitled Album";
      const artist = album.artist || "Allen Parvin";
      const year = album.year ? ` • ${escapeHtml(String(album.year))}` : "";
      const trackCount = Number(album.track_count || album.song_count || 0) || 0;
      const description = album.description || album.album_description || "Open this album page for the story, theme, tracks, and scripture references.";
      const badges = normalizeStringArray(album.badges || album.album_badges).slice(0, 4);
      const cover = album.cover || "";
      return `
        <a class="catalog-card" href="./album.html?album=${encodeURIComponent(title)}">
          <div class="catalog-card-cover">
            ${cover
              ? `<img src="${escapeAttr(cover)}" alt="${escapeAttr(title)} cover" loading="lazy" decoding="async" />`
              : `<div class="catalog-card-cover-fallback">♪</div>`}
          </div>
          <div class="catalog-card-copy">
            <p class="eyebrow">Album</p>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(artist)}${year}</p>
            <p>${trackCount} song${trackCount === 1 ? "" : "s"}</p>
            <p>${escapeHtml(description)}</p>
            ${badges.length ? `<div class="quick-link-pills">${badges.map((badge) => `<span class="quick-link-pill quick-link-pill--static">${escapeHtml(badge)}</span>`).join("")}</div>` : ""}
          </div>
        </a>
      `;
    })
    .join("");
}
