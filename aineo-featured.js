
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
      const isActive = filters.selectedAlbum === album.name ? "active" : "";
      return `
        <button class="album-card ${isActive}" data-album="${escapeHtmlAttr(album.name)}" type="button">
          <div class="album-card-cover-wrap">
            ${album.cover ? `<img class="album-card-cover" src="${escapeHtmlAttr(album.cover)}" alt="${escapeHtmlAttr(album.name)} cover" />` : `<div class="album-card-cover album-card-placeholder">No Cover</div>`}
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
    if (!collection) {
      if (els.featuredAlbumTitle) els.featuredAlbumTitle.textContent = "No songs found";
      if (els.featuredAlbumArtist) els.featuredAlbumArtist.textContent = "—";
      if (els.featuredAlbumCount) els.featuredAlbumCount.textContent = "0 songs";
      if (els.featuredAlbumCover) {
        els.featuredAlbumCover.src = "";
        els.featuredAlbumCover.alt = "No collection cover";
      }
      if (els.downloadAlbumBtn) els.downloadAlbumBtn.style.display = "none";
      if (els.openAlbumBtn) {
        els.openAlbumBtn.textContent = "Open Collection";
        els.openAlbumBtn.disabled = true;
      }
      return;
    }
    if (els.featuredAlbumCover) {
      els.featuredAlbumCover.src = collection.cover || "";
      els.featuredAlbumCover.alt = `${collection.name} cover`;
    }
    if (els.featuredAlbumTitle) els.featuredAlbumTitle.textContent = collection.name;
    if (els.featuredAlbumArtist) els.featuredAlbumArtist.textContent = collection.subtitle || "Allen Parvin";
    if (els.featuredAlbumCount) els.featuredAlbumCount.textContent = `${collection.tracks.length} song${collection.tracks.length === 1 ? "" : "s"}`;
    if (els.downloadAlbumBtn) els.downloadAlbumBtn.style.display = collection.album_zip ? "inline-flex" : "none";
    if (els.openAlbumBtn) {
      els.openAlbumBtn.textContent = collection.openMode === "album" ? "Open Album" : "Open Collection";
      els.openAlbumBtn.disabled = false;
    }
  }

  function getFeaturedTrackPlayState({ track, getCurrentTrack, audioPlayer }) {
    const isCurrentTrack = getCurrentTrack()?.id === track?.id;
    const isPlaying = Boolean(isCurrentTrack && audioPlayer && !audioPlayer.paused && audioPlayer.src);
    return { isCurrentTrack, isPlaying, label: isPlaying ? '❚❚' : '▶', action: isPlaying ? 'Pause' : 'Play' };
  }

  function renderFeaturedTrackList(ctx) {
    const { els, getFeaturedCollection, getFeaturedTrackPlayState, isFavorite, isDownloaded, escapeHtml, escapeHtmlAttr, getCurrentTrack, audioPlayer, togglePlayPause, syncQueueToCurrentCollection, getCurrentCollectionTracks, setQueue, playFromQueueIndex, toggleFavorite, openLyricsModalForTrack, openPlaylistModalForTrack, saveTrackOffline, triggerDownload, safeFileName } = ctx;
    if (!els.featuredTrackList || !els.featuredTrackListTitle) return;
    const album = getFeaturedCollection();
    if (!album) {
      els.featuredTrackListTitle.textContent = 'Collection Tracks';
      els.featuredTrackList.innerHTML = `<p class="empty-message">No tracks available.</p>`;
      return;
    }
    els.featuredTrackListTitle.textContent = `${album.name} Tracks`;
    els.featuredTrackList.innerHTML = album.tracks.map((track, index) => {
      const playState = getFeaturedTrackPlayState(track);
      const isPlaying = playState.isCurrentTrack ? 'playing' : '';
      const isFav = isFavorite(track) ? 'favorited' : '';
      return `
      <div class="featured-track-row ${isPlaying}" data-track-id="${escapeHtmlAttr(track.id)}">
        <button class="featured-track-play ${playState.isPlaying ? 'is-playing' : ''}" data-featured-index="${index}" data-track-id="${escapeHtmlAttr(track.id)}" data-track-title="${escapeHtmlAttr(track.title)}" type="button" aria-label="${playState.action} ${escapeHtmlAttr(track.title)}" aria-pressed="${playState.isPlaying ? 'true' : 'false'}">${playState.label}</button>
        <div class="featured-track-main">
          <div class="featured-track-title-line"><strong>${index + 1}. ${escapeHtml(track.title)}</strong>${track.duration ? `<span class="featured-track-duration">${escapeHtml(track.duration)}</span>` : ''}</div>
        </div>
        <div class="featured-track-actions">
          <button class="mini-action-btn ${isFav}" data-favorite-track="${escapeHtmlAttr(track.id)}" type="button">${isFavorite(track) ? '★' : '☆'}</button>
          <button class="mini-action-btn" data-lyrics-track="${escapeHtmlAttr(track.id)}" type="button">Lyrics</button>
          <button class="mini-action-btn" data-add-playlist-track="${escapeHtmlAttr(track.id)}" type="button">+ Playlist</button>
          <button class="mini-action-btn" data-save-offline-track="${escapeHtmlAttr(track.id)}" type="button">${isDownloaded(track) ? 'Saved' : 'Offline'}</button>
          <button class="mini-action-btn" data-download-track="${escapeHtmlAttr(track.id)}" type="button">Download</button>
        </div>
      </div>`;
    }).join('');

    els.featuredTrackList.querySelectorAll('[data-featured-index]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.featuredIndex);
        const track = album.tracks[idx];
        if (!track) return;
        if (getCurrentTrack()?.id === track.id && audioPlayer?.src) { togglePlayPause(); return; }
        syncQueueToCurrentCollection(true);
        if (getCurrentCollectionTracks()[idx]?.id !== track.id) setQueue(album.tracks, false);
        playFromQueueIndex(idx);
      });
    });
    els.featuredTrackList.querySelectorAll('[data-favorite-track]').forEach(btn => btn.addEventListener('click', () => {
      const track = album.tracks.find(t => t.id === btn.dataset.favoriteTrack);
      if (!track) return;
      toggleFavorite(track);
      renderFeaturedTrackList(ctx);
    }));
    els.featuredTrackList.querySelectorAll('[data-lyrics-track]').forEach(btn => btn.addEventListener('click', e => {
      const track = album.tracks.find(t => t.id === btn.dataset.lyricsTrack); if (track) openLyricsModalForTrack(track, e.currentTarget);
    }));
    els.featuredTrackList.querySelectorAll('[data-add-playlist-track]').forEach(btn => btn.addEventListener('click', e => {
      const track = album.tracks.find(t => t.id === btn.dataset.addPlaylistTrack); if (track) openPlaylistModalForTrack(track, e.currentTarget);
    }));
    els.featuredTrackList.querySelectorAll('[data-save-offline-track]').forEach(btn => btn.addEventListener('click', () => {
      const track = album.tracks.find(t => t.id === btn.dataset.saveOfflineTrack); if (track) saveTrackOffline(track);
    }));
    els.featuredTrackList.querySelectorAll('[data-download-track]').forEach(btn => btn.addEventListener('click', () => {
      const track = album.tracks.find(t => t.id === btn.dataset.downloadTrack); if (track?.src) triggerDownload(track.src, `${safeFileName(track.title)}.mp3`);
    }));
  }

  window.AineoFeatured = { getVisibleAlbums, renderAlbums, renderFeaturedAlbum, getFeaturedTrackPlayState, renderFeaturedTrackList };
})();
