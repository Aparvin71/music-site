(function () {
  function resetNamedFilters(filters) {
    filters.selectedAlbum = null;
    filters.selectedPlaylist = null;
    filters.selectedTag = null;
  }

  function clearSearch(searchInput, filters) {
    filters.searchTerm = "";
    if (searchInput) searchInput.value = "";
  }

  function applyNamedFilter({ filters, searchInput, type, value, onAfterChange }) {
    resetNamedFilters(filters);

    if (type === "search") {
      filters.searchTerm = String(value || "").trim();
      if (searchInput) searchInput.value = filters.searchTerm;
    } else {
      clearSearch(searchInput, filters);
      if (type === "album") filters.selectedAlbum = value;
      if (type === "playlist") filters.selectedPlaylist = value;
      if (type === "tag") filters.selectedTag = value;
    }

    onAfterChange?.();
  }

  function clearFilters({ filters, searchInput, onAfterChange }) {
    resetNamedFilters(filters);
    clearSearch(searchInput, filters);
    onAfterChange?.();
  }

  function buildSearchHaystack(track) {
    return [
      track.title,
      track.artist,
      track.album,
      track.genre,
      track.lyrics,
      ...(track.tags || []),
      ...(track.playlists || []),
      ...(track.scripture_references || [])
    ]
      .join(" ")
      .toLowerCase();
  }

  function getFilteredTracks({ tracks, filters }) {
    let result = Array.isArray(tracks) ? [...tracks] : [];

    if (filters.selectedAlbum) result = result.filter(track => track.album === filters.selectedAlbum);
    if (filters.selectedPlaylist) result = result.filter(track => (track.playlists || []).includes(filters.selectedPlaylist));
    if (filters.selectedTag) result = result.filter(track => (track.tags || []).includes(filters.selectedTag));
    if (filters.searchTerm) {
      const q = String(filters.searchTerm).toLowerCase();
      result = result.filter(track => buildSearchHaystack(track).includes(q));
    }

    return result;
  }

  function renderPlaylists({ container, trackList, allTracks, filters, hasActiveFilter, onClearAll, onSetPlaylistFilter, escapeHtml, escapeHtmlAttr }) {
    if (!container) return;

    const map = new Map();
    (trackList || []).forEach(track => {
      (track.playlists || []).forEach(playlist => {
        map.set(playlist, (map.get(playlist) || 0) + 1);
      });
    });

    const playlists = [{ name: "All Songs", count: Array.isArray(allTracks) ? allTracks.length : 0 }]
      .concat([...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name)));

    container.innerHTML = playlists.map(playlist => {
      const isAllSongs = playlist.name === "All Songs";
      const active = ((isAllSongs && !hasActiveFilter()) || filters.selectedPlaylist === playlist.name) ? "active" : "";
      return `
        <button class="filter-chip ${active}" data-playlist="${escapeHtmlAttr(playlist.name)}" type="button">
          ${isAllSongs ? "🎵 All Songs" : escapeHtml(playlist.name)}
          <span class="chip-count">(${playlist.count})</span>
        </button>
      `;
    }).join("");

    container.querySelectorAll("[data-playlist]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.playlist === "All Songs") onClearAll?.();
        else onSetPlaylistFilter?.(btn.dataset.playlist);
      });
    });
  }

  function renderTags({ container, trackList, filters, windowWidth, onSetTagFilter, escapeHtml, escapeHtmlAttr, getVisibleTags }) {
    if (!container) return;

    let tags = getVisibleTags(trackList || []);
    if (windowWidth <= 640) tags = tags.sort((a, b) => b.count - a.count).slice(0, 12);

    if (!tags.length) {
      container.innerHTML = `<p class="empty-message">No tags found.</p>`;
      return;
    }

    container.innerHTML = tags.map(tag => {
      const active = filters.selectedTag === tag.name ? "active" : "";
      return `
        <button class="filter-chip ${active}" data-tag="${escapeHtmlAttr(tag.name)}" type="button">
          #${escapeHtml(tag.name)} <span class="chip-count">(${tag.count})</span>
        </button>
      `;
    }).join("");

    container.querySelectorAll("[data-tag]").forEach(btn => {
      btn.addEventListener("click", () => onSetTagFilter?.(btn.dataset.tag));
    });
  }

  window.AineoLibrary = {
    applyNamedFilter,
    clearFilters,
    getFilteredTracks,
    renderPlaylists,
    renderTags
  };
})();
