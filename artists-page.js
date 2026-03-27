document.addEventListener("DOMContentLoaded", initArtistsPage);

async function initArtistsPage() {
  window.AineoShared?.initSecondaryPageNav?.();
  const grid = document.getElementById("artistsGrid");
  if (!grid) return;

  const tracksData = await window.AineoShared.fetchJson("./tracks.json", []);
  const tracks = Array.isArray(tracksData) ? tracksData : [];
  const artists = window.AineoShared.groupTracksByArtist(tracks)
    .map(({ artist, tracks: artistTracks }) => ({
      artist,
      count: artistTracks.length,
      cover: artistTracks.find(track => track.cover)?.cover || "",
      albums: [...new Set(artistTracks.map(track => track.album).filter(Boolean))].length,
      tags: [...new Set(artistTracks.flatMap(track => window.AineoShared.normalizeStringArray(track.tags)).filter(Boolean))].slice(0, 4)
    }))
    .sort((a, b) => a.artist.localeCompare(b.artist));

  if (!artists.length) {
    grid.innerHTML = `
      <article class="page-card">
        <p class="eyebrow">No artists yet</p>
        <h2>Your artist library is empty.</h2>
        <p>Upload tracks with artist metadata to populate this page.</p>
      </article>
    `;
    return;
  }

  grid.innerHTML = artists.map(item => `
    <a class="catalog-card" href="./artist.html?artist=${encodeURIComponent(item.artist)}">
      <div class="catalog-card-cover">${item.cover ? `<img src="${window.AineoShared.escapeAttr(item.cover)}" alt="${window.AineoShared.escapeAttr(item.artist)} artwork" loading="lazy" />` : `<div class="catalog-card-cover-fallback">♪</div>`}</div>
      <div class="catalog-card-copy">
        <p class="eyebrow">Artist</p>
        <h2>${window.AineoShared.escapeHtml(item.artist)}</h2>
        <p>${item.count} song${item.count === 1 ? "" : "s"} • ${item.albums} album${item.albums === 1 ? "" : "s"}</p>
        ${item.tags.length ? `<div class="quick-link-pills">${item.tags.map(tag => `<span class="quick-link-pill quick-link-pill--static">#${window.AineoShared.escapeHtml(tag)}</span>`).join("")}</div>` : ""}
      </div>
    </a>
  `).join("");
}
