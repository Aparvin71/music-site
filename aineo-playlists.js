
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

  function ensureWorkspace({ els, createPlaylistBtn, onCreatePlaylist }) {
    if (document.getElementById('playlistWorkspace')) return document.getElementById('playlistWorkspace');
    const host = els.myPlaylistList?.parentElement;
    if (!host) return null;
    const workspace = document.createElement('section');
    workspace.id = 'playlistWorkspace';
    workspace.className = 'page-card playlist-workspace-card playlist-workspace-card--compact';
    workspace.innerHTML = `<div class="playlist-workspace-head"><div><p class="eyebrow">Custom Playlists</p><h3 id="playlistWorkspaceTitle">Playlist</h3><p id="playlistWorkspaceMeta" class="page-lead playlist-workspace-meta">Create or pick a playlist to manage it here.</p></div><div class="playlist-workspace-actions"><button id="playlistWorkspaceNewBtn" class="action-btn secondary-btn small-action-btn" type="button">+ New</button></div></div><div id="playlistWorkspaceBody"></div>`;
    host.insertAdjacentElement('afterend', workspace);
    const newBtn = document.getElementById('playlistWorkspaceNewBtn');
    if (newBtn && onCreatePlaylist) newBtn.addEventListener('click', onCreatePlaylist);
    return workspace;
  }

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

  function renderWorkspace(ctx) {
    const { activeCustomPlaylistName, getCustomPlaylistTracks, startPlaybackFromList, applyCustomPlaylistFilter, escapeHtml, escapeHtmlAttr, isFavorite, isDownloaded, getCurrentTrack, audioPlayer, togglePlayPause, toggleFavorite, openLyricsModalForTrack, openPlaylistModalForTrack, saveTrackOffline, triggerDownload, safeFileName, customPlaylists, saveCustomPlaylists, renderMyPlaylists, onPlaylistChanged } = ctx;
    const body = document.getElementById('playlistWorkspaceBody');
    const title = document.getElementById('playlistWorkspaceTitle');
    const meta = document.getElementById('playlistWorkspaceMeta');
    if (!body || !title || !meta) return;
    if (!activeCustomPlaylistName) {
      title.textContent = 'Custom Playlist';
      meta.textContent = 'Select or create a playlist to manage it here.';
      body.innerHTML = `<p class="empty-message">No playlist selected.</p>`;
      return;
    }
    const list = getCustomPlaylistTracks(activeCustomPlaylistName);
    title.textContent = activeCustomPlaylistName;
    meta.textContent = `${list.length} song${list.length === 1 ? '' : 's'} in this playlist.`;
    if (!list.length) {
      body.innerHTML = `<div class="playlist-workspace-toolbar"><button class="action-btn secondary-btn small-action-btn" type="button" data-playlist-workspace-library>Show in Library</button></div><p class="empty-message">This playlist is empty. Add songs from the library.</p>`;
      body.querySelector('[data-playlist-workspace-library]')?.addEventListener('click', () => applyCustomPlaylistFilter(activeCustomPlaylistName));
      return;
    }
    body.innerHTML = `<div class="playlist-workspace-toolbar"><button class="action-btn small-action-btn" type="button" data-playlist-workspace-play>Play</button><button class="action-btn secondary-btn small-action-btn" type="button" data-playlist-workspace-shuffle>Shuffle</button><button class="action-btn secondary-btn small-action-btn" type="button" data-playlist-workspace-library>Show in Library</button></div><div class="playlist-workspace-tracks"></div>`;
    body.querySelector('[data-playlist-workspace-play]')?.addEventListener('click', () => startPlaybackFromList(list, false, 0));
    body.querySelector('[data-playlist-workspace-shuffle]')?.addEventListener('click', () => startPlaybackFromList(list, true, 0));
    body.querySelector('[data-playlist-workspace-library]')?.addEventListener('click', () => applyCustomPlaylistFilter(activeCustomPlaylistName));
    const wrap = body.querySelector('.playlist-workspace-tracks');
    let playlistItemDragIndex = null;
    wrap.innerHTML = list.map((track, index) => {
      const current = getCurrentTrack()?.id === track.id;
      const playIcon = current && audioPlayer && !audioPlayer.paused && audioPlayer.src ? '❚❚' : '▶';
      const offlineState = window.AineoOffline?.getTrackOfflineUiState
        ? window.AineoOffline.getTrackOfflineUiState({ track, downloadedTracks: (window.downloadedTracks || []) })
        : { buttonLabel: isDownloaded(track) ? 'Saved Offline ✓' : 'Save Offline ⬇', disabled: false };
      return `<div class="playlist-track-row ${current ? 'playing' : ''}" draggable="true" data-playlist-track-index="${index}" data-track-id="${escapeHtmlAttr(track.id)}"><button class="featured-track-play" data-playlist-track-play="${index}" type="button">${playIcon}</button><div class="playlist-track-main"><strong>${escapeHtml(track.title)}</strong><span>${escapeHtml(track.artist)} • ${escapeHtml(track.album)}</span></div><div class="featured-track-actions"><button class="mini-action-btn ${isFavorite(track) ? 'favorited' : ''}" data-playlist-track-favorite="${escapeHtmlAttr(track.id)}" type="button">${isFavorite(track) ? '★' : '☆'}</button><button class="mini-action-btn" data-playlist-track-lyrics="${escapeHtmlAttr(track.id)}" type="button">Lyrics</button><button class="mini-action-btn" data-playlist-track-add="${escapeHtmlAttr(track.id)}" type="button">+ Playlist</button><button class="mini-action-btn ${offlineState.disabled ? 'is-offline-disabled' : ''} ${isDownloaded(track) ? 'is-saved-offline' : ''}" data-playlist-track-offline="${escapeHtmlAttr(track.id)}" type="button" ${offlineState.disabled ? 'disabled aria-disabled="true"' : ''}>${escapeHtml(offlineState.buttonLabel)}</button><button class="mini-action-btn" data-playlist-track-download="${escapeHtmlAttr(track.id)}" type="button">Download</button><button class="mini-action-btn danger-btn" data-playlist-track-remove="${escapeHtmlAttr(track.id)}" type="button">Remove</button></div></div>`;
    }).join('');

    wrap.querySelectorAll('[data-playlist-track-play]').forEach(btn => btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.playlistTrackPlay);
      const track = list[idx]; if (!track) return;
      if (getCurrentTrack()?.id === track.id && audioPlayer?.src) return togglePlayPause();
      startPlaybackFromList(list, false, idx);
    }));
    wrap.querySelectorAll('[data-playlist-track-favorite]').forEach(btn => btn.addEventListener('click', () => {
      const track = list.find(t => t.id === btn.dataset.playlistTrackFavorite); if (!track) return; toggleFavorite(track); renderWorkspace(ctx);
    }));
    wrap.querySelectorAll('[data-playlist-track-lyrics]').forEach(btn => btn.addEventListener('click', e => {
      const track = list.find(t => t.id === btn.dataset.playlistTrackLyrics); if (track) openLyricsModalForTrack(track, e.currentTarget);
    }));
    wrap.querySelectorAll('[data-playlist-track-add]').forEach(btn => btn.addEventListener('click', e => {
      const track = list.find(t => t.id === btn.dataset.playlistTrackAdd); if (track) openPlaylistModalForTrack(track, e.currentTarget);
    }));
    wrap.querySelectorAll('[data-playlist-track-offline]').forEach(btn => btn.addEventListener('click', () => {
      const track = list.find(t => t.id === btn.dataset.playlistTrackOffline); if (track) saveTrackOffline(track);
    }));
    wrap.querySelectorAll('[data-playlist-track-download]').forEach(btn => btn.addEventListener('click', () => {
      const track = list.find(t => t.id === btn.dataset.playlistTrackDownload); if (track?.src) triggerDownload(track.src, `${safeFileName(track.title)}.mp3`);
    }));
    wrap.querySelectorAll('[data-playlist-track-remove]').forEach(btn => btn.addEventListener('click', () => {
      const id = btn.dataset.playlistTrackRemove;
      customPlaylists[activeCustomPlaylistName] = (customPlaylists[activeCustomPlaylistName] || []).filter(trackId => trackId !== id);
      saveCustomPlaylists();
      renderMyPlaylists();
      renderWorkspace(ctx);
      onPlaylistChanged?.(activeCustomPlaylistName);
    }));

    wrap.querySelectorAll('.playlist-track-row[draggable="true"]').forEach(row => {
      row.addEventListener('dragstart', () => { playlistItemDragIndex = Number(row.dataset.playlistTrackIndex); row.classList.add('dragging'); });
      row.addEventListener('dragover', event => { event.preventDefault(); row.classList.add('drag-target'); });
      row.addEventListener('dragleave', () => row.classList.remove('drag-target'));
      row.addEventListener('dragend', () => { playlistItemDragIndex = null; wrap.querySelectorAll('.playlist-track-row').forEach(item => item.classList.remove('drag-target','dragging')); });
      row.addEventListener('drop', event => {
        event.preventDefault();
        const dropIndex = Number(row.dataset.playlistTrackIndex);
        wrap.querySelectorAll('.playlist-track-row').forEach(item => item.classList.remove('drag-target','dragging'));
        if (playlistItemDragIndex === null || playlistItemDragIndex === dropIndex) { playlistItemDragIndex = null; return; }
        const ids = [...(customPlaylists[activeCustomPlaylistName] || [])];
        const [moved] = ids.splice(playlistItemDragIndex, 1); ids.splice(dropIndex, 0, moved);
        customPlaylists[activeCustomPlaylistName] = ids; saveCustomPlaylists(); playlistItemDragIndex = null; renderMyPlaylists(); renderWorkspace(ctx); onPlaylistChanged?.(activeCustomPlaylistName);
      });
    });
  }

  function renderMyPlaylists({ els, customPlaylists, activeCustomPlaylistName, getCustomPlaylistTracks, setActiveCustomPlaylist, startPlaybackFromList, applyCustomPlaylistFilter, saveCustomPlaylists, onDelete, renderPlaylistWorkspace, escapeHtml, escapeHtmlAttr }) {
    if (!els.myPlaylistList) return;
    const names = Object.keys(customPlaylists).sort((a,b) => a.localeCompare(b));
    if (!names.length) {
      els.myPlaylistList.classList.remove('playlist-v2-grid');
      els.myPlaylistList.classList.add('playlist-v2-list');
      els.myPlaylistList.innerHTML = `<p class="empty-message">No custom playlists yet.</p>`;
      renderPlaylistWorkspace();
      return;
    }
    els.myPlaylistList.classList.remove('playlist-v2-grid');
    els.myPlaylistList.classList.add('playlist-v2-list');
    els.myPlaylistList.innerHTML = names.map(name => {
      const list = getCustomPlaylistTracks(name);
      const active = name === activeCustomPlaylistName ? 'active' : '';
      return `<article class="playlist-list-item playlist-list-item--compact ${active}" data-playlist-card="${escapeHtmlAttr(name)}"><button class="playlist-list-item-title" data-open-custom-playlist="${escapeHtmlAttr(name)}" type="button"><strong>${escapeHtml(name)}</strong><span>${list.length} song${list.length === 1 ? '' : 's'}</span></button><div class="playlist-list-item-actions"><button class="mini-action-btn" data-custom-playlist-play="${escapeHtmlAttr(name)}" type="button" title="Play ${escapeHtmlAttr(name)}">▶</button><button class="mini-action-btn" data-custom-playlist-shuffle="${escapeHtmlAttr(name)}" type="button" title="Shuffle ${escapeHtmlAttr(name)}">⤮</button><button class="mini-action-btn" data-custom-playlist-focus="${escapeHtmlAttr(name)}" type="button" title="Show ${escapeHtmlAttr(name)} in Library">⌕</button><button class="mini-action-btn danger-btn" data-delete-custom-playlist="${escapeHtmlAttr(name)}" type="button" title="Delete ${escapeHtmlAttr(name)}">✕</button></div></article>`;
    }).join('');
    els.myPlaylistList.querySelectorAll('[data-open-custom-playlist]').forEach(btn => btn.addEventListener('click', () => setActiveCustomPlaylist(btn.dataset.openCustomPlaylist)));
    els.myPlaylistList.querySelectorAll('[data-custom-playlist-play]').forEach(btn => btn.addEventListener('click', () => { const name = btn.dataset.customPlaylistPlay; const list = getCustomPlaylistTracks(name); if (list.length) { setActiveCustomPlaylist(name); startPlaybackFromList(list, false, 0); } }));
    els.myPlaylistList.querySelectorAll('[data-custom-playlist-shuffle]').forEach(btn => btn.addEventListener('click', () => { const name = btn.dataset.customPlaylistShuffle; const list = getCustomPlaylistTracks(name); if (list.length) { setActiveCustomPlaylist(name); startPlaybackFromList(list, true, 0); } }));
    els.myPlaylistList.querySelectorAll('[data-custom-playlist-focus]').forEach(btn => btn.addEventListener('click', () => { const name = btn.dataset.customPlaylistFocus; setActiveCustomPlaylist(name); applyCustomPlaylistFilter(name); }));
    els.myPlaylistList.querySelectorAll('[data-delete-custom-playlist]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); onDelete(btn.dataset.deleteCustomPlaylist); saveCustomPlaylists(); renderMyPlaylists({ els, customPlaylists, activeCustomPlaylistName: normalizeState({ customPlaylists, activeCustomPlaylistName: null }), getCustomPlaylistTracks, setActiveCustomPlaylist, startPlaybackFromList, applyCustomPlaylistFilter, saveCustomPlaylists, onDelete, renderPlaylistWorkspace, escapeHtml, escapeHtmlAttr }); renderPlaylistWorkspace(); }));
    renderPlaylistWorkspace();
  }

  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function escapeHtmlAttr(value) { return escapeHtml(value); }

  window.AineoPlaylists = { normalizeState, getCustomPlaylistTracks, ensureWorkspace, openPlaylistModal, closePlaylistModal, saveTrackToPlaylistFromModal, applyCustomPlaylistFilter, setActiveCustomPlaylist, renderWorkspace, renderMyPlaylists };
})();
