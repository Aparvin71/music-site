window.AineoOffline = (() => {
  const DIRECT_AUDIO_CACHE = 'aineo-user-offline-audio';
  const DIRECT_ASSET_CACHE = 'aineo-user-offline-assets';

  function uniq(values) {
    return [...new Set((values || []).filter(Boolean))];
  }

  function isDownloaded({ track, downloadedTracks }) {
    return Boolean(track && Array.isArray(downloadedTracks) && downloadedTracks.includes(track.id));
  }

  function isCollectionDownloaded({ tracks, downloadedTracks }) {
    const list = Array.isArray(tracks) ? tracks.filter(Boolean) : [];
    if (!list.length) return false;
    return list.every(track => downloadedTracks.includes(track.id));
  }

  function getTrackOfflineUiState({ track, downloadedTracks }) {
    const downloaded = isDownloaded({ track, downloadedTracks });
    const offline = navigator.onLine === false;
    return {
      downloaded,
      offline,
      canSaveNow: !offline,
      canPlayNow: !offline || downloaded,
      buttonLabel: downloaded
        ? 'Saved Offline ✓'
        : (offline ? 'Needs Internet' : 'Save Offline ⬇'),
      actionLabel: downloaded ? 'Remove Offline' : (offline ? 'Needs Internet' : 'Save Offline'),
      disabled: !downloaded && offline
    };
  }

  function applyOfflineButtonState(button, state) {
    if (!button) return;
    button.textContent = state.buttonLabel;
    button.disabled = Boolean(state.disabled);
    button.dataset.offlineState = state.downloaded ? 'saved' : (state.offline ? 'offline-unavailable' : 'ready');
    button.classList.toggle('is-saved-offline', state.downloaded);
    button.classList.toggle('is-offline-disabled', state.disabled);
    button.title = state.downloaded
      ? 'This song is saved and can play offline.'
      : (state.disabled ? 'Reconnect to save this song for offline playback.' : 'Save this song for offline playback.');
    button.setAttribute('aria-disabled', state.disabled ? 'true' : 'false');
  }

  function updateButtons({ track, downloadedTracks, els }) {
    const state = getTrackOfflineUiState({ track, downloadedTracks });
    applyOfflineButtonState(els.saveOfflineBtn, state);
    applyOfflineButtonState(els.playerSheetSaveOfflineBtn, state);
  }

  function postServiceWorkerMessage(message) {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) return;
    navigator.serviceWorker.controller.postMessage(message);
  }

  function buildCacheRequest(url, preferNoCors = false) {
    return new Request(url, {
      method: 'GET',
      mode: preferNoCors ? 'no-cors' : 'cors',
      credentials: 'omit',
      cache: 'no-cache'
    });
  }

  function responseCanBeCached(response) {
    return Boolean(response && (response.ok || response.type === 'opaque'));
  }

  async function cacheUrlsDirect(cacheName, urls) {
    if (!('caches' in window)) return { cached: [], failed: urls || [] };
    const cache = await caches.open(cacheName);
    const cached = [];
    const failed = [];
    for (const url of uniq(urls)) {
      try {
        const existing = await cache.match(url, { ignoreSearch: true });
        if (existing) {
          cached.push(url);
          continue;
        }

        let response = null;
        try {
          response = await fetch(buildCacheRequest(url, false));
        } catch (error) {
          response = null;
        }

        if (!responseCanBeCached(response)) {
          response = await fetch(buildCacheRequest(url, true));
        }

        if (!responseCanBeCached(response)) {
          throw new Error(`HTTP ${response?.status || 'fetch-failed'}`);
        }

        await cache.put(url, response.clone());
        cached.push(url);
      } catch (error) {
        failed.push(url);
      }
    }
    return { cached, failed };
  }

  async function removeUrlsDirect(cacheName, urls) {
    if (!('caches' in window)) return;
    const cache = await caches.open(cacheName);
    await Promise.all(uniq(urls).map(url => cache.delete(url, { ignoreSearch: true })));
  }

  function getTrackAssetUrls(track) {
    return {
      audio: [track?.src].filter(Boolean),
      assets: [track?.cover, track?.lyrics_file].filter(Boolean)
    };
  }

  async function cacheTrackAssets(track) {
    const { audio, assets } = getTrackAssetUrls(track);
    const audioResult = await cacheUrlsDirect(DIRECT_AUDIO_CACHE, audio);
    const assetResult = await cacheUrlsDirect(DIRECT_ASSET_CACHE, assets);
    postServiceWorkerMessage({ type: 'CACHE_AUDIO_URLS', urls: audio });
    postServiceWorkerMessage({ type: 'CACHE_URLS', urls: assets });
    return {
      ok: audio.length ? audioResult.cached.length === audio.length : true,
      audio: audioResult,
      assets: assetResult
    };
  }

  async function saveTrackOffline({
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

    const cacheResult = await cacheTrackAssets(track);
    if (!cacheResult.ok) {
      if (flashButtonText && els?.saveOfflineBtn && !document.hidden) flashButtonText(els.saveOfflineBtn, 'Offline Failed');
      return false;
    }

    if (!downloadedTracks.includes(track.id)) {
      setDownloadedTracks([track.id, ...downloadedTracks]);
      saveDownloadedTracks();
    }

    updateButtons(track);
    renderDownloadedSongs();
    renderFeaturedTrackList();
    if (flashButtonText && els?.saveOfflineBtn && !document.hidden) {
      flashButtonText(els.saveOfflineBtn, 'Saved');
    }
    return true;
  }

  async function removeTrackOffline({
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
    const { audio, assets } = getTrackAssetUrls(track);
    postServiceWorkerMessage({ type: 'REMOVE_AUDIO_URLS', urls: audio });
    postServiceWorkerMessage({ type: 'REMOVE_URLS', urls: assets });
    await removeUrlsDirect(DIRECT_AUDIO_CACHE, audio);
    await removeUrlsDirect(DIRECT_ASSET_CACHE, assets);

    updateButtons(track);
    renderDownloadedSongs();
    renderFeaturedTrackList();
    if (flashButtonText && els?.saveOfflineBtn && !document.hidden) {
      flashButtonText(els.saveOfflineBtn, 'Removed');
    }
    return true;
  }

  async function toggleTrackOffline(args) {
    const downloaded = isDownloaded({ track: args.track, downloadedTracks: args.downloadedTracks });
    if (downloaded) return removeTrackOffline(args);
    return saveTrackOffline(args);
  }

  async function saveCollectionOffline(args) {
    const tracks = (args.tracks || []).filter(track => track?.src);
    let successCount = 0;
    for (const track of tracks) {
      const ok = await saveTrackOffline({ ...args, track });
      if (ok) successCount += 1;
      args.downloadedTracks = JSON.parse(localStorage.getItem('aineo_downloaded_tracks') || '[]');
    }
    return successCount;
  }

  async function removeCollectionOffline(args) {
    const tracks = (args.tracks || []).filter(Boolean);
    let removedCount = 0;
    for (const track of tracks) {
      const ok = await removeTrackOffline({ ...args, track });
      if (ok) removedCount += 1;
      args.downloadedTracks = JSON.parse(localStorage.getItem('aineo_downloaded_tracks') || '[]');
    }
    return removedCount;
  }

  async function toggleCollectionOffline(args) {
    const allSaved = isCollectionDownloaded({ tracks: args.tracks || [], downloadedTracks: args.downloadedTracks || [] });
    if (allSaved) return removeCollectionOffline(args);
    return saveCollectionOffline(args);
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
            ? `<img src="${escapeHtmlAttr(track.cover)}" alt="${escapeHtmlAttr(track.title)} cover" class="offline-card-cover" loading="lazy" decoding="async" fetchpriority="low" />`
            : `<div class="offline-card-cover offline-card-placeholder">No Cover</div>`}
          <div class="offline-card-meta">
            <strong>${escapeHtml(track.title)}</strong>
            <span>${escapeHtml(track.album)}</span>
            <small class="offline-card-status">Saved offline ✓</small>
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
    isCollectionDownloaded,
    getTrackOfflineUiState,
    updateButtons,
    saveTrackOffline,
    removeTrackOffline,
    toggleTrackOffline,
    saveCollectionOffline,
    removeCollectionOffline,
    toggleCollectionOffline,
    renderDownloadedSongs
  };
})();
