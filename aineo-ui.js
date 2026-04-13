
// v43.1.25 hard reset
const APP_VERSION = "43.1.25";
try {
  const stored = localStorage.getItem("app_version");
  if (stored !== APP_VERSION) {
    localStorage.clear();
    sessionStorage.clear();
    if (window.indexedDB) {
      indexedDB.databases && indexedDB.databases().then(dbs => {
        dbs.forEach(db => indexedDB.deleteDatabase(db.name));
      });
    }
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
    localStorage.setItem("app_version", APP_VERSION);
    window.location.reload(true);
  }
} catch(e) {}
(function () {
  function renderEmptyMessage(message) {
    return `<p class="empty-message">${String(message || "Nothing here yet.")}</p>`;
  }

  function renderMiniCard({ track, index, escapeHtml, escapeAttr }) {
    return `
      <button class="mini-card" data-mini-index="${index}" data-track-id="${escapeAttr(track.id)}" type="button">
        ${track.cover ? `<img src="${escapeAttr(track.cover)}" alt="${escapeAttr(track.title)} cover" class="mini-card-cover" loading="lazy" decoding="async" fetchpriority="low" />` : `<div class="mini-card-cover mini-card-placeholder">No Cover</div>`}
        <div class="mini-card-meta">
          <strong>${escapeHtml(track.title)}</strong>
          <span>${escapeHtml(track.album)}</span>
        </div>
      </button>
    `;
  }

  function renderAlbumCard({ album, isActive, escapeHtml, escapeAttr }) {
    return `
      <button class="album-card ${isActive ? "active" : ""}" data-album="${escapeAttr(album.name)}" type="button">
        <div class="album-card-cover-wrap">
          ${album.cover ? `<img class="album-card-cover" src="${escapeAttr(album.cover)}" alt="${escapeAttr(album.name)} cover" loading="lazy" decoding="async" fetchpriority="low" />` : `<div class="album-card-cover album-card-placeholder">No Cover</div>`}
        </div>
        <div class="album-card-meta">
          <h3>${escapeHtml(album.name)}</h3>
          <p>${album.tracks.length} song${album.tracks.length === 1 ? "" : "s"}</p>
        </div>
      </button>`;
  }

  function renderPlaylistChipRow({ name, count, escapeHtml, escapeAttr }) {
    return `
      <div class="playlist-chip-row">
        <button class="filter-chip" data-custom-playlist="${escapeAttr(name)}" type="button">
          ${escapeHtml(name)} <span class="chip-count">(${count})</span>
        </button>
        <button class="mini-action-btn" data-delete-custom-playlist="${escapeAttr(name)}" type="button">✕</button>
      </div>
    `;
  }



  function renderSearchScopeChip({ key, label, active, escapeHtml, escapeAttr }) {
    return `
      <button class="search-scope-chip ${active ? "active" : ""}" data-search-scope="${escapeAttr(key)}" type="button">
        ${escapeHtml(label)}
      </button>
    `;
  }

  window.AineoUI = { renderEmptyMessage, renderMiniCard, renderAlbumCard, renderPlaylistChipRow, renderSearchScopeChip };
})();
