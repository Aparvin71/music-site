window.AineoOffline = (() => {
  function isDownloaded({ track, downloadedTracks }) {
    return Boolean(track && Array.isArray(downloadedTracks) && downloadedTracks.includes(track.id));
  }

  function updateButtons({ track, downloadedTracks, els }) {
    const downloaded = isDownloaded({ track, downloadedTracks });
    const label = downloaded ? 'Remove Offline' : 'Save Offline';
    if (els.saveOfflineBtn) els.saveOfflineBtn.textContent = label;
    if (els.playerSheetSaveOfflineBtn) els.playerSheetSaveOfflineBtn.textContent = label;
  }

  function postServiceWorkerMessage(message) {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) return;
    navigator.serviceWorker.controller.postMessage(message);
  }

  function saveTrackOffline({
    track,
    downloadedTracks,
    setDownloadedTracks,
    saveDownloadedTracks,
    els,
    renderDownloadedSongs,
    renderFeaturedTrackList,
    updateButtons,
    flashButtonText
  }) {
    if (!track?.src) return false;

    if (!downloadedTracks.includes(track.id)) {
      setDownloadedTracks([track.id, ...downloadedTracks]);
      saveDownloadedTracks();
    }

    postServiceWorkerMessage({ type: 'CACHE_AUDIO_URLS', urls: [track.src] });

    updateButtons(track);
    renderDownloadedSongs();
    renderFeaturedTrackList();
    if (flashButtonText && els?.saveOfflineBtn && !document.hidden) {
      flashButtonText(els.saveOfflineBtn, 'Saved');
    }
    return true;
  }

  function removeTrackOffline({
    track,
    downloadedTracks,
    setDownloadedTracks,
    saveDownloadedTracks,
    renderDownloadedSongs,
    renderFeaturedTrackList,
    updateButtons,
    els,
    flashButtonText
  }) {
    if (!track) return false;

    setDownloadedTracks(downloadedTracks.filter(id => id !== track.id));
    saveDownloadedTracks();
    postServiceWorkerMessage({ type: 'REMOVE_AUDIO_URLS', urls: [track.src].filter(Boolean) });

    updateButtons(track);
    renderDownloadedSongs();
    renderFeaturedTrackList();
    if (flashButtonText && els?.saveOfflineBtn && !document.hidden) {
      flashButtonText(els.saveOfflineBtn, 'Removed');
    }
    return true;
  }

  function toggleTrackOffline(args) {
    const downloaded = isDownloaded({ track: args.track, downloadedTracks: args.downloadedTracks });
    if (downloaded) {
      return removeTrackOffline(args);
    }
    return saveTrackOffline(args);
  }

  function renderDownloadedSongs({
    els,
    downloadedTracks,
    tracks,
    escapeHtml,
    escapeHtmlAttr,
    startPlaybackFromList,
    removeTrackOffline,
    getCurrentTrack
  }) {
    if (!els.downloadedList) return;

    const savedTracks = downloadedTracks
      .map(id => tracks.find(track => track.id === id))
      .filter(Boolean)
      .slice(0, 12);

    if (!savedTracks.length) {
      els.downloadedList.innerHTML = `<p class="empty-message">No offline songs saved yet.</p>`;
      return;
    }

    const currentTrack = getCurrentTrack?.();

    els.downloadedList.innerHTML = savedTracks.map((track, index) => `
      <article class="offline-card${currentTrack?.id === track.id ? ' is-current' : ''}" data-offline-index="${index}">
        <button class="offline-card-main" data-offline-play="${index}" type="button">
          ${track.cover
            ? `<img src="${escapeHtmlAttr(track.cover)}" alt="${escapeHtmlAttr(track.title)} cover" class="offline-card-cover" loading="lazy" />`
            : `<div class="offline-card-cover offline-card-placeholder">No Cover</div>`}
          <div class="offline-card-meta">
            <strong>${escapeHtml(track.title)}</strong>
            <span>${escapeHtml(track.album)}</span>
          </div>
        </button>
        <div class="offline-card-actions">
          <button class="mini-action-btn" data-offline-remove="${index}" type="button">Remove</button>
        </div>
      </article>
    `).join('');

    els.downloadedList.querySelectorAll('[data-offline-play]').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = Number(btn.dataset.offlinePlay);
        const track = savedTracks[index];
        if (!track) return;
        startPlaybackFromList([track], false, 0);
      });
    });

    els.downloadedList.querySelectorAll('[data-offline-remove]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const index = Number(btn.dataset.offlineRemove);
        const track = savedTracks[index];
        if (!track) return;
        removeTrackOffline(track);
      });
    });
  }

  return {
    isDownloaded,
    updateButtons,
    saveTrackOffline,
    removeTrackOffline,
    toggleTrackOffline,
    renderDownloadedSongs
  };
})();
