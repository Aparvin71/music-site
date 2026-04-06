
(function(){
  const PLAYER_SHEET_TABS = ['lyrics', 'queue'];

  function initGestures({ els, getPlayerSheetTab, setPlayerSheetTab, playNextTrack, playPreviousTrack, closePlayerSheet, openPlayerSheet }) {
    if (!els.playerSheetContent) return;
    const interactiveSelector = 'button, a, input, select, textarea, label, [role="tab"]';
    let gesture = null;
    const reset = () => {
      if (!els.playerSheetContent) return;
      els.playerSheetContent.style.transform = '';
      els.playerSheetContent.style.transition = '';
    };
    els.playerSheetContent.addEventListener('touchstart', event => {
      if (!els.playerSheet || els.playerSheet.classList.contains('hidden')) return;
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      const target = event.target;
      const inNow = Boolean(els.playerSheetNowSection && els.playerSheetNowSection.contains(target));
      const inPanelSection = Boolean(els.playerSheetPanelSection && els.playerSheetPanelSection.contains(target));
      const onCover = Boolean(target.closest('.player-sheet-cover-wrap'));
      const onHeader = Boolean(target.closest('.player-sheet-header'));
      const inScrollablePanel = Boolean(target.closest('.player-tab-panel'));
      const activePanel = document.querySelector('#playerSheet [data-player-panel].active');
      const panelAtTop = !activePanel || activePanel.scrollTop <= 4;
      let mode = null;
      if (onCover && !target.closest(interactiveSelector)) mode = 'track';
      else if (onHeader || (inNow && !target.closest(interactiveSelector))) mode = 'dismiss';
      else if (inPanelSection && !inScrollablePanel && !target.closest(interactiveSelector)) mode = 'tabs';
      else if (inScrollablePanel && panelAtTop && !target.closest(interactiveSelector)) mode = 'dismiss';
      if (!mode) return;
      gesture = { mode, startX: touch.clientX, startY: touch.clientY, dx: 0, dy: 0 };
    }, { passive: true });

    els.playerSheetContent.addEventListener('touchmove', event => {
      if (!gesture || event.touches.length !== 1) return;
      const touch = event.touches[0];
      gesture.dx = touch.clientX - gesture.startX;
      gesture.dy = touch.clientY - gesture.startY;
      if (gesture.mode === 'dismiss' && gesture.dy > 0 && Math.abs(gesture.dy) > Math.abs(gesture.dx)) {
        if (event.cancelable) event.preventDefault();
        els.playerSheetContent.style.transition = 'none';
        els.playerSheetContent.style.transform = `translateY(${Math.min(gesture.dy, 220)}px)`;
      }
    }, { passive: false });

    els.playerSheetContent.addEventListener('touchend', () => {
      if (!gesture) return;
      const { mode, dx, dy } = gesture;
      const absX = Math.abs(dx), absY = Math.abs(dy);
      if (mode === 'dismiss') {
        els.playerSheetContent.style.transition = 'transform 180ms ease';
        if (dy > 110 && absY > absX * 1.15) closePlayerSheet();
        reset();
      }
      if (mode === 'tabs' && absX > 70 && absX > absY * 1.2) {
        const currentIndex = Math.max(0, PLAYER_SHEET_TABS.indexOf(getPlayerSheetTab()));
        const nextIndex = dx < 0 ? Math.min(PLAYER_SHEET_TABS.length - 1, currentIndex + 1) : Math.max(0, currentIndex - 1);
        if (nextIndex !== currentIndex) setPlayerSheetTab(PLAYER_SHEET_TABS[nextIndex]);
      }
      if (mode === 'track' && absX > 80 && absX > absY * 1.2) {
        if (dx < 0) playNextTrack(); else playPreviousTrack();
      }
      gesture = null;
    }, { passive: true });

    els.playerSheetContent.addEventListener('touchcancel', () => { gesture = null; reset(); }, { passive: true });

    const stickyPlayer = els.stickyPlayer || document.querySelector('.sticky-player');
    if (stickyPlayer) {
      const primaryHitAreas = stickyPlayer.querySelectorAll('.sticky-player-left, .sticky-player-center, #nowCover, .now-meta');
      primaryHitAreas.forEach(area => {
        area?.addEventListener('click', event => {
          if (event.target.closest('button, input, a, label')) return;
          openPlayerSheet(area);
        });
      });

      let miniGesture = null;
      const interactiveMini = 'button, input, a, label';
      stickyPlayer.addEventListener('touchstart', event => {
        if (window.matchMedia('(min-width: 1101px)').matches) return;
        if (event.touches.length !== 1) return;
        if (event.target.closest(interactiveMini)) return;
        const touch = event.touches[0];
        miniGesture = { startX: touch.clientX, startY: touch.clientY, dx: 0, dy: 0 };
      }, { passive: true });

      stickyPlayer.addEventListener('touchmove', event => {
        if (!miniGesture || event.touches.length !== 1) return;
        const touch = event.touches[0];
        miniGesture.dx = touch.clientX - miniGesture.startX;
        miniGesture.dy = touch.clientY - miniGesture.startY;
      }, { passive: true });

      const endMiniGesture = () => {
        if (!miniGesture) return;
        const { dx, dy } = miniGesture;
        if (dy < -42 && Math.abs(dy) > Math.abs(dx) * 1.15) {
          openPlayerSheet(stickyPlayer);
        }
        miniGesture = null;
      };
      stickyPlayer.addEventListener('touchend', endMiniGesture, { passive: true });
      stickyPlayer.addEventListener('touchcancel', () => { miniGesture = null; }, { passive: true });
    }

  }

  function open({ els, triggerEl, setLastFocusedElement, lockBodyScroll, updatePlayerSheet }) {
    if (!els.playerSheet) return;
    const sheet = els.playerSheet;
    setLastFocusedElement(triggerEl || document.activeElement || null);
    sheet.classList.remove('hidden');
    sheet.setAttribute('aria-hidden', 'false');
    sheet.classList.remove('is-closing');
    lockBodyScroll(true);
    updatePlayerSheet();
    requestAnimationFrame(() => {
      sheet.classList.add('is-open');
    });
  }

  function close({ els, isAnyModalOpen, lockBodyScroll, restoreFocus }) {
    if (!els.playerSheet) return;
    const sheet = els.playerSheet;
    sheet.classList.remove('is-open');
    sheet.classList.add('is-closing');
    window.setTimeout(() => {
      if (sheet.classList.contains('is-open')) return;
      sheet.classList.add('hidden');
      sheet.classList.remove('is-closing');
      sheet.setAttribute('aria-hidden', 'true');
      if (!isAnyModalOpen()) {
        lockBodyScroll(false);
        restoreFocus();
      }
    }, 220);
  }

  function setTab({ tabName }) {
    if (!PLAYER_SHEET_TABS.includes(tabName)) tabName = 'lyrics';
    document.querySelectorAll('[data-player-tab]').forEach(btn => {
      const active = btn.dataset.playerTab === tabName;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-player-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.playerPanel === tabName));
    return tabName;
  }

  function openLyricsPanel({ els }) {
    const panel = els.playerSheetLyricsPanel;
    if (!panel) return;
    panel.scrollTop = 0;
    if (window.matchMedia('(max-width: 640px)').matches) {
      requestAnimationFrame(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }

  function update({ els, track, audioPlayer, renderScriptureLinks, renderLyricsInto, updateOfflineButtons, updateFavoriteButton, updateProgressUI, getPlayerSheetTab, setPlayerSheetTab }) {
    if (els.playerSheetCover) {
      els.playerSheetCover.src = track?.cover || '';
      els.playerSheetCover.alt = track ? `${track.title} cover` : 'Current song cover';
    }
    if (els.playerSheetTrackTitle) els.playerSheetTrackTitle.textContent = track?.title || 'Select a song';
    if (els.playerSheetTrackArtist) els.playerSheetTrackArtist.textContent = track?.artist || '—';
    if (els.playerSheetTrackAlbum) els.playerSheetTrackAlbum.textContent = track?.album || '—';
    if (els.playerSheetTrackScripture) {
      els.playerSheetTrackScripture.innerHTML = track?.scripture_references?.length ? renderScriptureLinks(track.scripture_references, { compact: true }) : '—';
    }
    if (els.playerSheetLyricsPanel) renderLyricsInto(els.playerSheetLyricsPanel, track, 'No lyrics available.');
    if (els.playerSheetScripturePanel) {
      els.playerSheetScripturePanel.innerHTML = track?.scripture_references?.length ? `<div class="scripture-block scripture-block--links">${renderScriptureLinks(track.scripture_references)}</div>` : `<p class="empty-message">No scripture references available.</p>`;
    }
    if (els.playerSheetPlayBtn && audioPlayer) els.playerSheetPlayBtn.textContent = audioPlayer.paused ? '▶' : '❚❚';
    updateOfflineButtons(track);
    updateFavoriteButton();
    updateProgressUI();
    setPlayerSheetTab(getPlayerSheetTab());
  }

  window.AineoPlayerSheet = { initGestures, open, close, setTab, openLyricsPanel, update };
})();
