
(function () {
  function resetNamedFilters(filters) {
    filters.selectedAlbum = null;
    filters.selectedPlaylist = null;
    filters.selectedTag = null;
    filters.selectedSmartPlaylist = null;
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
      if (type === "smart-playlist") filters.selectedSmartPlaylist = value;
    }

    onAfterChange?.();
  }

  function clearFilters({ filters, searchInput, onAfterChange }) {
    resetNamedFilters(filters);
    clearSearch(searchInput, filters);
    onAfterChange?.();
  }

  function buildSearchHaystack(track, scope = "all") {
    const fields = {
      titles: [track.title, track.artist],
      albums: [track.album, track.album_description, track.album_theme, track.album_story],
      lyrics: [track.lyrics],
      scripture: [...(track.scripture_references || [])],
      tags: [...(track.tags || []), ...(track.search_keywords || [])],
      playlists: [...(track.playlists || []), track.collection]
    };

    const allParts = [
      ...fields.titles,
      ...fields.albums,
      ...fields.lyrics,
      ...fields.scripture,
      ...fields.tags,
      ...fields.playlists,
      track.genre,
      track.description
    ];

    const list = scope === "all" ? allParts : (fields[scope] || allParts);
    return list.join(" ").toLowerCase();
  }

  function getTrackDateValue(track) {
    const raw = String(track?.date_added || track?.last_played || "").trim();
    if (!raw) return 0;
    const time = Date.parse(raw);
    if (Number.isFinite(time)) return time;
    const year = Number(raw);
    return Number.isFinite(year) ? Date.parse(`${year}-01-01`) : 0;
  }

  function getSmartPlaylistDefinitions({ tracks, favorites = [], recentlyPlayed = [], downloadedTracks = [], playStats = {} }) {
    const byId = new Map((tracks || []).map(track => [track.id, track]));
    const mapIds = ids => ids.map(id => byId.get(id)).filter(Boolean);
    const uniqueTracks = list => {
      const seen = new Set();
      return list.filter(track => track && !seen.has(track.id) && seen.add(track.id));
    };

    const favoriteTracks = uniqueTracks(mapIds(favorites));
    const recentTracks = uniqueTracks(mapIds(recentlyPlayed));
    const downloaded = uniqueTracks(mapIds(downloadedTracks));
    const mostPlayed = uniqueTracks(
      [...(tracks || [])]
        .map(track => ({ track, score: Number(playStats?.[track.id]?.count || track.play_count || 0) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score || a.track.title.localeCompare(b.track.title))
        .slice(0, 24)
        .map(item => item.track)
    );
    const recentlyAdded = uniqueTracks(
      [...(tracks || [])]
        .filter(track => getTrackDateValue(track) > 0)
        .sort((a, b) => getTrackDateValue(b) - getTrackDateValue(a))
        .slice(0, 24)
    );
    const scriptureSongs = uniqueTracks((tracks || []).filter(track => (track.scripture_references || []).length));
    const worshipSongs = uniqueTracks((tracks || []).filter(track => {
      const haystack = [...(track.tags || []), ...(track.playlists || []), track.genre || "", track.collection || ""].join(' ').toLowerCase();
      return haystack.includes('worship') || haystack.includes('gospel') || haystack.includes('scripture');
    }));

    return [
      { key: 'favorites', name: 'Favorites', icon: '★', tracks: favoriteTracks },
      { key: 'recent', name: 'Recently Played', icon: '🕘', tracks: recentTracks },
      { key: 'downloaded', name: 'Downloaded', icon: '⬇', tracks: downloaded },
      { key: 'most-played', name: 'Most Played', icon: '🔥', tracks: mostPlayed },
      { key: 'recently-added', name: 'Recently Added', icon: '✨', tracks: recentlyAdded },
      { key: 'scripture', name: 'Scripture Songs', icon: '✝', tracks: scriptureSongs },
      { key: 'worship', name: 'Worship', icon: '♪', tracks: worshipSongs }
    ].filter(item => item.tracks.length);
  }

  function getFilteredTracks({ tracks, filters, favorites = [], recentlyPlayed = [], downloadedTracks = [], playStats = {} }) {
    let result = Array.isArray(tracks) ? [...tracks] : [];

    if (filters.selectedAlbum) result = result.filter(track => track.album === filters.selectedAlbum);
    if (filters.selectedPlaylist) result = result.filter(track => (track.playlists || []).includes(filters.selectedPlaylist));
    if (filters.selectedTag) result = result.filter(track => (track.tags || []).includes(filters.selectedTag));
    if (filters.selectedSmartPlaylist) {
      const smart = getSmartPlaylistDefinitions({ tracks: result, favorites, recentlyPlayed, downloadedTracks, playStats })
        .find(item => item.key === filters.selectedSmartPlaylist);
      result = smart ? [...smart.tracks] : [];
    }
    if (filters.searchTerm) {
      const q = String(filters.searchTerm).toLowerCase();
      const scope = filters.searchScope || 'all';
      result = result.filter(track => buildSearchHaystack(track, scope).includes(q));
    }

    return result;
  }

  function renderPlaylists({ container, trackList, allTracks, filters, hasActiveFilter, onClearAll, onSetPlaylistFilter, onSetSmartPlaylistFilter, favorites, recentlyPlayed, downloadedTracks, playStats, escapeHtml, escapeHtmlAttr }) {
    if (!container) return;

    const map = new Map();
    (trackList || []).forEach(track => {
      (track.playlists || []).forEach(playlist => {
        map.set(playlist, (map.get(playlist) || 0) + 1);
      });
    });

    const smartPlaylists = getSmartPlaylistDefinitions({ tracks: allTracks || [], favorites, recentlyPlayed, downloadedTracks, playStats });
    const playlists = [{ name: "All Songs", count: Array.isArray(allTracks) ? allTracks.length : 0 }]
      .concat([...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name)));

    const smartMarkup = smartPlaylists.length ? `
      <div class="playlist-subsection-label">Smart Playlists</div>
      <div class="smart-playlist-list">
        ${smartPlaylists.map(item => `
          <button class="filter-chip smart-playlist-chip ${filters.selectedSmartPlaylist === item.key ? "active" : ""}" data-smart-playlist="${escapeHtmlAttr(item.key)}" type="button">
            <span class="smart-playlist-icon" aria-hidden="true">${item.icon}</span>
            ${escapeHtml(item.name)} <span class="chip-count">(${item.tracks.length})</span>
          </button>
        `).join("")}
      </div>
    ` : '';

    container.innerHTML = smartMarkup + playlists.map(playlist => {
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
    container.querySelectorAll('[data-smart-playlist]').forEach(btn => {
      btn.addEventListener('click', () => onSetSmartPlaylistFilter?.(btn.dataset.smartPlaylist));
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
    renderTags,
    getSmartPlaylistDefinitions
  };
})();
