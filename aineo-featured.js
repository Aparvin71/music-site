/* v42.3.76 featured track state sync fix */
(function(){
  function getVisibleAlbums(trackList) {
    const map = new Map();
    (trackList || []).forEach(track => {
      const albumName = track.album || "Singles";
      if (!map.has(albumName)) {
        map.set(albumName, {
          name: albumName,
          cover: track.cover || "",
          artist: track.artist || "Allen Parvin",
          year: track.year || "",
          tracks: [],
          album_zip: track.album_zip || ""
        });
      }
      const album = map.get(albumName);
      album.tracks.push(track);
      if (!album.cover && track.cover) album.cover = track.cover;
      if (!album.album_zip && track.album_zip) album.album_zip = track.album_zip;
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  function renderAlbums({ els, trackList, filters, getVisibleAlbums, escapeHtml, escapeHtmlAttr, setAlbumFilter }) {
    if (!els.albumGrid) return;
    const albums = getVisibleAlbums(trackList);
    if (!albums.length) {
      els.albumGrid.innerHTML = `<p class="empty-message">No albums found.</p>`;
      return;
    }
    els.albumGrid.innerHTML = albums.map(album => {
      const isActive = filters.selectedAlbum === album.name;
      if (window.AineoUI?.renderAlbumCard) {
        return window.AineoUI.renderAlbumCard({ album, isActive, escapeHtml, escapeAttr: escapeHtmlAttr });
      }
      return `
        <button class="album-card ${isActive ? "active" : ""}" data-album="${escapeHtmlAttr(album.name)}" type="button">
          <div class="album-card-cover-wrap">
            ${album.cover ? `<img class="album-card-cover" src="${escapeHtmlAttr(album.cover)}" alt="${escapeHtmlAttr(album.name)} cover" loading="lazy" decoding="async" fetchpriority="low" />` : `<div class="album-card-cover album-card-placeholder">No Cover</div>`}
          </div>
          <div class="album-card-meta">
            <h3>${escapeHtml(album.name)}</h3>
            <p>${album.tracks.length} song${album.tracks.length === 1 ? "" : "s"}</p>
          </div>
        </button>`;
    }).join("");
    els.albumGrid.querySelectorAll('[data-album]').forEach(btn => {
      btn.addEventListener('click', () => setAlbumFilter(btn.dataset.album));
    });
  }

  function renderFeaturedAlbum({ els, getFeaturedCollection }) {
    const collection = getFeaturedCollection();
    const formatDuration = (tracks) => {
      const secs = (tracks || []).reduce((sum, track) => sum + (Number(track.duration_seconds) || 0), 0);
      if (!secs) return "";
      const hours = Math.floor(secs / 3600);
      const mins = Math.floor((secs % 3600) / 60);
      return hours ? `${hours} hr ${mins} min` : `${mins} min`;
    };
    if (!collection) {
      if (els.featuredAlbumTitle) els.featuredAlbumTitle.textContent = "No songs found";
      if (els.featuredAlbumArtist) els.featuredAlbumArtist.textContent = "—";
      if (els.featuredAlbumCount) els.featuredAlbumCount.textContent = "0 songs";
      if (els.downloadAlbumBtn) els.downloadAlbumBtn.style.display = "none";
      if (els.playAlbumBtn) els.playAlbumBtn.disabled = true;
      if (els.shuffleAlbumBtn) els.shuffleAlbumBtn.disabled = true;
      return;
    }
    if (els.featuredAlbumCover) {
      els.featuredAlbumCover.src = collection.cover || "";
      els.featuredAlbumCover.alt = `${collection.name} cover`;
    }
    if (els.featuredAlbumTitle) els.featuredAlbumTitle.textContent = collection.name || 'All Songs';
    if (els.featuredAlbumArtist) els.featuredAlbumArtist.textContent = collection.subtitle || 'Entire music library';
    if (els.featuredAlbumCount) els.featuredAlbumCount.textContent = `${collection.tracks.length} song${collection.tracks.length === 1 ? '' : 's'}`;
    if (els.featuredCollectionStats) {
      const duration = formatDuration(collection.tracks);
      const type = `<span class="featured-stat-pill">${collection.openMode === "album" ? "Album" : "Collection"}</span>`;
      const durationPill = duration ? `<span class="featured-stat-pill">${duration}</span>` : "";
      els.featuredCollectionStats.innerHTML = `${type}${durationPill}`;
    }
    if (els.featuredCollectionLead) {
      els.featuredCollectionLead.textContent = collection.name === 'All Songs'
        ? 'Start here with the full music library. Play or shuffle the whole library, or filter down to a smaller collection.'
        : `Start here with Play or Shuffle for ${collection.name}.`;
    }
    if (els.downloadAlbumBtn) els.downloadAlbumBtn.style.display = collection.album_zip ? 'inline-flex' : 'none';
    if (els.playAlbumBtn) els.playAlbumBtn.disabled = false;
    if (els.shuffleAlbumBtn) els.shuffleAlbumBtn.disabled = false;
  }

  function getFeaturedTrackPlayState({ track, getCurrentTrack, audioPlayer }) {
    const isCurrentTrack = getCurrentTrack()?.id === track?.id;
    const isPlaying = Boolean(isCurrentTrack && audioPlayer && !audioPlayer.paused && audioPlayer.src);
    return { isCurrentTrack, isPlaying, label: isPlaying ? '❚❚' : '▶', action: isPlaying ? 'Pause' : 'Play' };
  }

  function renderFeaturedTrackList(ctx) {
    const { els, getFeaturedCollection, getFeaturedTrackPlayState, isFavorite, isDownloaded, escapeHtml, escapeHtmlAttr, getCurrentTrack, audioPlayer, togglePlayPause, syncQueueToCurrentCollection, getCurrentCollectionTracks, setQueue, playFromQueueIndex, toggleFavorite, openLyricsModalForTrack, saveTrackOffline, removeTrackOffline, openTrackActionSheet } = ctx;
    if (!els.featuredTrackList || !els.featuredTrackListTitle) return;
    const collection = getFeaturedCollection();
    if (!collection) {
      els.featuredTrackListTitle.textContent = 'All Songs';
      els.featuredTrackList.innerHTML = `<p class="empty-message">No tracks available.</p>`;
      return;
    }
    els.featuredTrackListTitle.textContent = collection.name === 'All Songs' ? 'All Songs' : `${collection.name} Tracks`;
    els.featuredTrackList.innerHTML = collection.tracks.map((track, index) => {
      const playState = getFeaturedTrackPlayState({ track, getCurrentTrack, audioPlayer });
      const rowStateClass = playState.isCurrentTrack ? (playState.isPlaying ? 'is-current is-playing playing' : 'is-current playing') : '';
      const isFav = isFavorite(track) ? 'favorited' : '';
      const offlineSaved = isDownloaded ? isDownloaded(track) : false;
      return `
      <div class="featured-track-row ${rowStateClass}" data-track-id="${escapeHtmlAttr(track.id)}" data-preview-track-id="${escapeHtmlAttr(track.id)}">
        <button class="featured-track-play ${playState.isPlaying ? 'is-playing' : ''}" data-featured-index="${index}" data-track-id="${escapeHtmlAttr(track.id)}" type="button" aria-label="${playState.action} ${escapeHtmlAttr(track.title)}" aria-pressed="${playState.isPlaying ? 'true' : 'false'}">${playState.label}</button>
        <div class="featured-track-main">
          <div class="featured-track-title-line">
            <strong class="featured-track-title" title="${escapeHtmlAttr(track.title)}">${escapeHtml(track.title)}</strong>
            ${track.duration ? `<span class="featured-track-duration" title="${escapeHtmlAttr(track.duration)}">${escapeHtml(track.duration)}</span>` : ''}
          </div>
          <div class="featured-track-meta-line">
            <span class="featured-track-album" title="${escapeHtmlAttr(track.album || '')}">${escapeHtml(track.album || '')}</span>
          </div>
        </div>
        <div class="featured-track-actions">
          <button class="mini-action-btn mini-action-btn--icon ${isFav}" data-favorite-track="${escapeHtmlAttr(track.id)}" type="button" aria-label="${isFavorite(track) ? 'Remove favorite' : 'Add favorite'}"></button>
          <button class="mini-action-btn mini-action-btn--icon" data-lyrics-track="${escapeHtmlAttr(track.id)}" type="button" aria-label="Lyrics"></button>
          <button class="mini-action-btn mini-action-btn--icon ${offlineSaved ? 'is-saved-offline' : ''}" data-offline-track="${escapeHtmlAttr(track.id)}" type="button" aria-label="${offlineSaved ? 'Remove offline save' : 'Save offline'}"></button>
          <button class="mini-action-btn mini-action-btn--icon" data-track-more="${escapeHtmlAttr(track.id)}" type="button" aria-label="More actions"></button>
        </div>
      </div>`;
    }).join('');

    els.featuredTrackList.querySelectorAll('[data-featured-index]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (Date.now && Date.now() < (window.__AINEO_SUPPRESS_PREVIEW_CLICK_UNTIL__ || 0)) return;
        const idx = Number(btn.dataset.featuredIndex);
        const track = collection.tracks[idx];
        if (!track) return;
        if (getCurrentTrack()?.id === track.id && audioPlayer?.src) {
          togglePlayPause();
          return;
        }
        syncQueueToCurrentCollection(true);
        if (getCurrentCollectionTracks()[idx]?.id !== track.id) setQueue(collection.tracks, false);
        playFromQueueIndex(idx);
      });
    });

    els.featuredTrackList.querySelectorAll('[data-favorite-track]').forEach(btn => btn.addEventListener('click', () => {
      const track = collection.tracks.find(t => t.id === btn.dataset.favoriteTrack);
      if (!track) return;
      toggleFavorite(track);
      renderFeaturedTrackList(ctx);
    }));

    els.featuredTrackList.querySelectorAll('[data-lyrics-track]').forEach(btn => btn.addEventListener('click', e => {
      const track = collection.tracks.find(t => t.id === btn.dataset.lyricsTrack);
      if (track) openLyricsModalForTrack(track, e.currentTarget);
    }));

    els.featuredTrackList.querySelectorAll('[data-offline-track]').forEach(btn => btn.addEventListener('click', async e => {
      const track = collection.tracks.find(t => t.id === btn.dataset.offlineTrack);
      if (!track) return;
      e.currentTarget.disabled = true;
      try {
        const currentlySaved = isDownloaded ? isDownloaded(track) : false;
        if (currentlySaved && removeTrackOffline) await removeTrackOffline(track);
        else if (saveTrackOffline) await saveTrackOffline(track);
      } finally {
        renderFeaturedTrackList(ctx);
      }
    }));

    els.featuredTrackList.querySelectorAll('[data-track-more]').forEach(btn => btn.addEventListener('click', e => {
      const track = collection.tracks.find(t => t.id === btn.dataset.trackMore);
      if (track) openTrackActionSheet?.(track, e.currentTarget);
    }));
  }

  window.AineoFeatured = { getVisibleAlbums, renderAlbums, renderFeaturedAlbum, getFeaturedTrackPlayState, renderFeaturedTrackList };
})();
