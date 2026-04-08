
(function(){
  function normalizeState({ customPlaylists, activeCustomPlaylistName }) {
    const names = Object.keys(customPlaylists || {}).sort((a,b) => a.localeCompare(b));
    if (!names.length) return null;
    if (!activeCustomPlaylistName || !customPlaylists[activeCustomPlaylistName]) return names[0];
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

  function applyCustomPlaylistFilter({ name, customPlaylists, tracks, els, filters, setCurrentCollectionKey }) {
    const ids = customPlaylists[name] || [];
    const filteredTracks = ids.map(id => tracks.find(track => track.id === id)).filter(Boolean);
    filters.selectedAlbum = null;
    filters.selectedPlaylist = null;
    filters.selectedTag = null;
    filters.searchTerm = '';
    if (els.searchInput) els.searchInput.value = '';
    if (els.activeFilterLabel) els.activeFilterLabel.textContent = `My Playlist: ${name}`;
    if (els.stickyFilterBar) els.stickyFilterBar.classList.remove('hidden');
    if (els.filterTypeBadge) {
      els.filterTypeBadge.textContent = 'My Playlist';
      els.filterTypeBadge.className = 'filter-type-badge playlist';
      els.filterTypeBadge.style.display = 'inline-flex';
    }
    setCurrentCollectionKey(`custom-playlist:${name}`);
    return { filteredTracks };
  }

  function setActiveCustomPlaylist({ name, customPlaylists, currentActiveName }) {
    if (!name || !customPlaylists[name]) return { activeName: currentActiveName, changed: false };
    return { activeName: name, changed: name !== currentActiveName };
  }

  function renderWorkspace() { return null; }

  function renderMyPlaylists({ els, customPlaylists, activeCustomPlaylistName, getCustomPlaylistTracks, setActiveCustomPlaylist, startPlaybackFromList, applyCustomPlaylistFilter, saveCustomPlaylists, onDelete, renderPlaylistWorkspace, escapeHtml, escapeHtmlAttr }) {
    if (!els.myPlaylistList) return;
    const names = Object.keys(customPlaylists).sort((a,b) => a.localeCompare(b));
    if (!names.length) {
      els.myPlaylistList.classList.remove('playlist-v2-grid');
      els.myPlaylistList.classList.add('playlist-v2-list', 'playlist-list--custom-chips');
      els.myPlaylistList.innerHTML = `<p class="empty-message">No custom playlists yet.</p>`;
      return;
    }

    els.myPlaylistList.classList.remove('playlist-v2-grid');
    els.myPlaylistList.classList.add('playlist-v2-list', 'playlist-list--custom-chips');
    els.myPlaylistList.innerHTML = names.map(name => {
      const list = getCustomPlaylistTracks(name);
      const active = name === activeCustomPlaylistName ? 'active' : '';
      return `<div class="playlist-chip-row ${active}" data-playlist-card="${escapeHtmlAttr(name)}"><button class="filter-chip ${active}" data-open-custom-playlist="${escapeHtmlAttr(name)}" type="button">${escapeHtml(name)} <span class="chip-count">(${list.length})</span></button><button class="mini-action-btn" data-custom-playlist-play="${escapeHtmlAttr(name)}" type="button" title="Play ${escapeHtmlAttr(name)}">▶</button><button class="mini-action-btn" data-custom-playlist-shuffle="${escapeHtmlAttr(name)}" type="button" title="Shuffle ${escapeHtmlAttr(name)}">⤮</button><button class="mini-action-btn danger-btn" data-delete-custom-playlist="${escapeHtmlAttr(name)}" type="button" title="Delete ${escapeHtmlAttr(name)}">✕</button></div>`;
    }).join('');

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
      renderMyPlaylists({ els, customPlaylists, activeCustomPlaylistName: normalizeState({ customPlaylists, activeCustomPlaylistName: null }), getCustomPlaylistTracks, setActiveCustomPlaylist, startPlaybackFromList, applyCustomPlaylistFilter, saveCustomPlaylists, onDelete, renderPlaylistWorkspace, escapeHtml, escapeHtmlAttr });
    }));
  }

  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function escapeHtmlAttr(value) { return escapeHtml(value); }

  window.AineoPlaylists = { normalizeState, getCustomPlaylistTracks, ensureWorkspace, openPlaylistModal, closePlaylistModal, saveTrackToPlaylistFromModal, applyCustomPlaylistFilter, setActiveCustomPlaylist, renderWorkspace, renderMyPlaylists };
})();
