
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

(function(){
  function normalizeState({ customPlaylists, activeCustomPlaylistName }) {
    const names = Object.keys(customPlaylists || {}).sort((a,b) => a.localeCompare(b));
    if (!names.length) return null;
    if (!activeCustomPlaylistName || !customPlaylists[activeCustomPlaylistName]) return null;
    return activeCustomPlaylistName;
  }

  function getCustomPlaylistTracks({ name, customPlaylists, tracks }) {
    const ids = customPlaylists?.[name] || [];
    return ids.map(id => tracks.find(track => track.id === id)).filter(Boolean);
  }

  function ensureWorkspace() { return null; }

  function openPlaylistModal({ els, customPlaylists, track, triggerEl, setLastFocusedElement, setPlaylistPickerTrackId, lockBodyScroll }) {
    if (!els.playlistModal) return;
    setLastFocusedElement(triggerEl || document.activeElement || null);
    const names = Object.keys(customPlaylists).sort((a,b) => a.localeCompare(b));
    if (els.playlistSelect) {
      els.playlistSelect.innerHTML = `<option value="">Choose a playlist</option>` + names.map(name => `<option value="${escapeHtmlAttr(name)}">${escapeHtml(name)}</option>`).join('');
    }
    if (els.newPlaylistName) els.newPlaylistName.value = '';
    setPlaylistPickerTrackId(track?.id || null);
    els.playlistModal.classList.remove('hidden');
    els.playlistModal.setAttribute('aria-hidden', 'false');
    lockBodyScroll(true);
  }

  function closePlaylistModal({ els, isAnyModalOpen, lockBodyScroll, restoreFocus, onClosed }) {
    if (!els.playlistModal) return;
    els.playlistModal.classList.add('hidden');
    els.playlistModal.setAttribute('aria-hidden', 'true');
    onClosed?.();
    if (!isAnyModalOpen()) {
      lockBodyScroll(false);
      restoreFocus();
    }
  }

  function saveTrackToPlaylistFromModal({ els, customPlaylists, playlistPickerTrackId }) {
    const typedName = els.newPlaylistName?.value?.trim();
    const selectedName = els.playlistSelect?.value?.trim();
    const playlistName = typedName || selectedName;
    if (!playlistName) return { saved: false };
    if (!customPlaylists[playlistName]) customPlaylists[playlistName] = [];
    if (playlistPickerTrackId && !customPlaylists[playlistName].includes(playlistPickerTrackId)) {
      customPlaylists[playlistName].push(playlistPickerTrackId);
    }
    return { saved: true, playlistName };
  }

  function applyCustomPlaylistFilter({ name, customPlaylists, filters, searchInput, onAfterChange }) {
    if (!name || !customPlaylists?.[name]) return { applied: false };
    filters.selectedAlbum = null;
    filters.selectedPlaylist = null;
    filters.selectedTag = null;
    filters.selectedSmartPlaylist = null;
    filters.selectedCustomPlaylist = name;
    filters.searchTerm = '';
    if (searchInput) searchInput.value = '';
    onAfterChange?.();
    return { applied: true, name };
  }

  function setActiveCustomPlaylist({ name, customPlaylists, currentActiveName }) {
    if (!name || !customPlaylists[name]) return { activeName: currentActiveName, changed: false };
    return { activeName: name, changed: name !== currentActiveName };
  }

  function renderWorkspace() { return null; }

  function renderMyPlaylists({ els, customPlaylists, activeCustomPlaylistName, filters, getCustomPlaylistTracks, setActiveCustomPlaylist, startPlaybackFromList, applyCustomPlaylistFilter, saveCustomPlaylists, onDelete, renderPlaylistWorkspace, escapeHtml, escapeHtmlAttr }) {
    if (!els.myPlaylistList) return;
    const names = Object.keys(customPlaylists).sort((a,b) => a.localeCompare(b));

    if (!names.length) {
      els.myPlaylistList.className = 'playlist-list playlist-list--custom playlist-pill-grid playlist-pill-grid--custom playlist-list--custom-standalone';
      els.myPlaylistList.innerHTML = `<p class="empty-message playlist-empty-message">No custom playlists yet.</p>`;
      return;
    }

    const activeName = normalizeState({ customPlaylists, activeCustomPlaylistName });
    const hasSelectionFocus = Boolean(filters?.selectedPlaylist || filters?.selectedSmartPlaylist || filters?.selectedCustomPlaylist);
    const visibleNames = activeName
      ? names.filter(name => name === activeName)
      : (hasSelectionFocus ? [] : names);

    els.myPlaylistList.className = 'playlist-list playlist-list--custom playlist-pill-grid playlist-pill-grid--custom playlist-list--custom-standalone';

    const gridMarkup = visibleNames.map(name => {
      const list = getCustomPlaylistTracks(name);
      const active = name === activeName ? 'active' : '';
      const countLabel = `${list.length} song${list.length === 1 ? '' : 's'}`;
      return `
        <button class="filter-chip playlist-card-pill playlist-card-pill--custom-compact ${active}" data-open-custom-playlist="${escapeHtmlAttr(name)}" type="button" title="${escapeHtmlAttr(name)} — ${escapeHtmlAttr(countLabel)}" aria-label="${escapeHtmlAttr(name)} — ${escapeHtmlAttr(countLabel)}">
          <span class="playlist-card-pill__title">${escapeHtml(name)}</span>
        </button>
      `;
    }).join('');

    const trayMarkup = activeName ? `
      <div class="custom-playlist-action-tray" data-custom-playlist-tray="${escapeHtmlAttr(activeName)}">
        <div class="custom-playlist-action-tray__label">Selected: ${escapeHtml(activeName)} · ${escapeHtml(getCustomPlaylistTracks(activeName).length)} song${getCustomPlaylistTracks(activeName).length === 1 ? '' : 's'}</div>
        <div class="playlist-card-actions playlist-card-actions--selected-tray">
          <button class="mini-action-btn" data-custom-playlist-play="${escapeHtmlAttr(activeName)}" type="button" title="Play ${escapeHtmlAttr(activeName)}">Play</button>
          <button class="mini-action-btn" data-custom-playlist-shuffle="${escapeHtmlAttr(activeName)}" type="button" title="Shuffle ${escapeHtmlAttr(activeName)}">Shuffle</button>
          <button class="mini-action-btn danger-btn" data-delete-custom-playlist="${escapeHtmlAttr(activeName)}" type="button" title="Delete ${escapeHtmlAttr(activeName)}">Delete</button>
        </div>
      </div>
    ` : '';

    els.myPlaylistList.innerHTML = `${gridMarkup}${trayMarkup}`;

    els.myPlaylistList.querySelectorAll('[data-open-custom-playlist]').forEach(btn => btn.addEventListener('click', () => {
      const name = btn.dataset.openCustomPlaylist;
      setActiveCustomPlaylist(name);
      applyCustomPlaylistFilter(name);
    }));

    els.myPlaylistList.querySelectorAll('[data-custom-playlist-play]').forEach(btn => btn.addEventListener('click', () => {
      const name = btn.dataset.customPlaylistPlay;
      const list = getCustomPlaylistTracks(name);
      if (list.length) {
        setActiveCustomPlaylist(name);
        startPlaybackFromList(list, false, 0);
      }
    }));

    els.myPlaylistList.querySelectorAll('[data-custom-playlist-shuffle]').forEach(btn => btn.addEventListener('click', () => {
      const name = btn.dataset.customPlaylistShuffle;
      const list = getCustomPlaylistTracks(name);
      if (list.length) {
        setActiveCustomPlaylist(name);
        startPlaybackFromList(list, true, 0);
      }
    }));

    els.myPlaylistList.querySelectorAll('[data-delete-custom-playlist]').forEach(btn => btn.addEventListener('click', e => {
      e.stopPropagation();
      onDelete(btn.dataset.deleteCustomPlaylist);
      saveCustomPlaylists();
      renderMyPlaylists({ els, customPlaylists, activeCustomPlaylistName: normalizeState({ customPlaylists, activeCustomPlaylistName: null }), filters, getCustomPlaylistTracks, setActiveCustomPlaylist, startPlaybackFromList, applyCustomPlaylistFilter, saveCustomPlaylists, onDelete, renderPlaylistWorkspace, escapeHtml, escapeHtmlAttr });
    }));
  }

  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function escapeHtmlAttr(value) { return escapeHtml(value); }

  window.AineoPlaylists = { normalizeState, getCustomPlaylistTracks, ensureWorkspace, openPlaylistModal, closePlaylistModal, saveTrackToPlaylistFromModal, applyCustomPlaylistFilter, setActiveCustomPlaylist, renderWorkspace, renderMyPlaylists };
})();
