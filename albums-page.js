document.addEventListener("DOMContentLoaded", initAlbumsPage);

async function initAlbumsPage() {
  window.AineoShared?.initSecondaryPageNav?.();
  const grid = document.getElementById("albumsGrid");
  if (!grid) return;

  const [albumsData, tracksData] = await Promise.all([
    window.AineoShared.fetchJson("./albums.json", []),
    window.AineoShared.fetchJson("./tracks.json", [])
  ]);

  const albums = Array.isArray(albumsData) ? albumsData : [];
  const tracks = Array.isArray(tracksData) ? tracksData : [];
  const trackCounts = window.AineoShared.getTrackCounts(tracks);

  if (!albums.length) {
    grid.innerHTML = `
      <article class="page-card">
        <p class="eyebrow">No albums yet</p>
        <h2>Your album library is empty.</h2>
        <p>Add entries to <code>albums.json</code> to populate this page.</p>
      </article>
    `;
    return;
  }

  grid.innerHTML = albums.map(album => {
    const title = window.AineoShared.escapeHtml(album.title || album.name || "Untitled Album");
    const albumName = album.title || album.name || "";
    const slug = encodeURIComponent(albumName);
    const cover = album.cover
      ? `<img src="${window.AineoShared.escapeAttr(album.cover)}" alt="${window.AineoShared.escapeAttr(title)} artwork" loading="lazy" />`
      : `<div class="catalog-card-cover-fallback">♪</div>`;
    const badges = (Array.isArray(album.badges) ? album.badges : []).slice(0, 3);
    const pills = badges.length
      ? `<div class="quick-link-pills">${badges.map(badge => `<span class="quick-link-pill quick-link-pill--static">#${window.AineoShared.escapeHtml(badge)}</span>`).join("")}</div>`
      : "";
    const count = trackCounts[String(albumName).toLowerCase()] || Number(album.track_count || album.song_count || 0) || 0;
    const description = album.description ? `<p>${window.AineoShared.escapeHtml(album.description)}</p>` : "";

    return `
      <a class="catalog-card" href="./album.html?album=${slug}">
        <div class="catalog-card-cover">${cover}</div>
        <div class="catalog-card-copy">
          <p class="eyebrow">Album</p>
          <h2>${title}</h2>
          <p>${count} song${count === 1 ? "" : "s"}</p>
          ${description}
          ${pills}
        </div>
      </a>
    `;
  }).join("");
}
