document.addEventListener("DOMContentLoaded", initArtistPage);

async function initArtistPage() {
  window.AineoShared?.initSecondaryPageNav?.();
  const root = document.getElementById("artistPageRoot");
  if (!root) return;

  const artistParam = new URLSearchParams(window.location.search).get("artist") || "";
  const tracksData = await window.AineoShared.fetchJson("./tracks.json", []);
  const tracks = Array.isArray(tracksData) ? tracksData : [];
  const artistTracks = tracks.filter(track => String(track.artist || "").toLowerCase() === artistParam.toLowerCase());

  if (!artistTracks.length) {
    root.innerHTML = `<section class="page-card page-hero-card"><p class="eyebrow">Artist</p><h1>Artist not found</h1><p class="page-lead">Head back to the library and choose another artist.</p></section>`;
    return;
  }

  const artist = artistTracks[0].artist || "Artist";
  const albums = [...new Set(artistTracks.map(track => track.album).filter(Boolean))];
  const tags = [...new Set(artistTracks.flatMap(track => window.AineoShared.normalizeStringArray(track.tags)).filter(Boolean))].slice(0, 10);
  const cover = artistTracks.find(track => track.cover)?.cover || "";
  const scriptureRefs = [...new Set(artistTracks.flatMap(track => window.AineoShared.normalizeStringArray(track.scripture_references || track.scripture)))].slice(0, 8);

  root.innerHTML = `
    <section class="page-card page-hero-card artist-hero-card">
      <div class="artist-hero-layout">
        <div class="catalog-card-cover catalog-card-cover--hero">${cover ? `<img src="${window.AineoShared.escapeAttr(cover)}" alt="${window.AineoShared.escapeAttr(artist)} artwork" />` : `<div class="catalog-card-cover-fill"></div>`}</div>
        <div>
          <p class="eyebrow">Artist</p>
          <h1>${window.AineoShared.escapeHtml(artist)}</h1>
          <p class="page-lead">${artistTracks.length} songs across ${albums.length} album${albums.length === 1 ? "" : "s"}.</p>
          <div class="quick-link-pills">${albums.map(album => `<a class="quick-link-pill" href="./album.html?album=${encodeURIComponent(album)}">${window.AineoShared.escapeHtml(album)}</a>`).join("")}</div>
          ${tags.length ? `<div class="quick-link-pills">${tags.map(tag => `<span class="quick-link-pill quick-link-pill--static">#${window.AineoShared.escapeHtml(tag)}</span>`).join("")}</div>` : ""}
          ${scriptureRefs.length ? `<div class="scripture-pill-row" aria-label="Artist scripture references">${window.AineoShared.renderScriptureLinks(scriptureRefs, { compact: true })}</div>` : ""}
        </div>
      </div>
    </section>
    <section class="page-card utility-card">
      <div class="catalog-list">${artistTracks.map(track => `
        <div class="catalog-list-row">
          <div>
            <h2>${window.AineoShared.escapeHtml(track.title || "Untitled")}</h2>
            <p>${window.AineoShared.escapeHtml(track.album || "Singles")}${track.duration ? ` • ${window.AineoShared.escapeHtml(track.duration)}` : ""}</p>
            ${window.AineoShared.normalizeStringArray(track.scripture_references || track.scripture).length ? `<div class="scripture-pill-row">${window.AineoShared.renderScriptureLinks(track.scripture_references || track.scripture, { compact: true })}</div>` : ""}
          </div>
          <div class="card-actions"><a class="action-btn secondary-btn" href="./index.html?song=${encodeURIComponent(track.title || "")}">Open in Player</a><a class="action-btn secondary-btn" href="./album.html?album=${encodeURIComponent(track.album || "")}">Album Page</a></div>
        </div>
      `).join("")}</div>
    </section>`;

  document.title = `${artist} - Aineo Music`;
}
