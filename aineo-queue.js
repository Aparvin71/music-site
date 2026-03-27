(function () {
  function getDisplayTracks({ currentQueue, filteredTracks, tracks }) {
    if (Array.isArray(currentQueue) && currentQueue.length) return currentQueue;
    if (Array.isArray(filteredTracks) && filteredTracks.length) return filteredTracks;
    return Array.isArray(tracks) ? tracks : [];
  }

  function buildQueueHtml({ displayTracks, currentQueue, currentQueueIndex, currentTrack, audioPlayer, escapeHtml, escapeHtmlAttr }) {
    const currentTrackId = currentTrack?.id || "";
    const currentTrackPlaying = Boolean(currentTrack && audioPlayer && !audioPlayer.paused && audioPlayer.src);

    return displayTracks.map((track, index) => {
      const activeIndex = currentQueue.length ? currentQueueIndex : displayTracks.findIndex(t => t.id === currentTrackId);
      const isCurrentTrack = Boolean(currentTrackId && track.id === currentTrackId);
      const isPlayingTrack = isCurrentTrack && currentTrackPlaying;
      const active = index === activeIndex || isCurrentTrack ? "active is-current" : "";
      const stateClass = isPlayingTrack ? "is-playing" : isCurrentTrack ? "is-paused" : "";
      const playLabel = isPlayingTrack ? "Pause" : "Play";
      const playIcon = isPlayingTrack ? "❚❚" : "▶";

      return `
        <div class="queue-row ${active} ${stateClass}" draggable="true" data-queue-index="${index}" data-track-id="${escapeHtmlAttr(track.id)}">
          <button class="queue-play-btn ${stateClass} ${isCurrentTrack ? "is-current" : ""}" data-queue-play="${index}" type="button" aria-label="${playLabel} ${escapeHtmlAttr(track.title)}" aria-pressed="${isPlayingTrack ? "true" : "false"}">${playIcon}</button>
          ${track.cover ? `<img class="queue-cover" src="${escapeHtmlAttr(track.cover)}" alt="${escapeHtmlAttr(track.title)} cover" />` : `<div class="queue-cover"></div>`}
          <div class="queue-main">
            <div class="queue-title-row">
              <h3>${escapeHtml(track.title)}</h3>
              <span class="queue-duration">${escapeHtml(track.duration || "")}</span>
            </div>
            <p class="queue-artist">${escapeHtml(track.artist)}</p>
            <div class="queue-meta-row">
              <span>${escapeHtml(track.album)}</span>
              ${track.year ? `<span>${escapeHtml(String(track.year))}</span>` : ""}
            </div>
            ${track.tags.length ? `<div class="queue-tags">${escapeHtml(track.tags.join(" • "))}</div>` : ""}
          </div>
          <div class="queue-actions">
            <button class="mini-action-btn" data-queue-play-next="${index}" type="button">Play Next</button>
            <button class="mini-action-btn" data-queue-remove="${index}" type="button">Remove</button>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderQueue({ currentQueue, currentQueueIndex, filteredTracks, tracks, queueListEl, queueCountEl, playerSheetQueuePanelEl, audioPlayer, getCurrentTrack, escapeHtml, escapeHtmlAttr, bindInteractions }) {
    const displayTracks = getDisplayTracks({ currentQueue, filteredTracks, tracks });
    if (queueCountEl) queueCountEl.textContent = `${displayTracks.length} song${displayTracks.length === 1 ? "" : "s"}`;
    if (!queueListEl) return;

    if (!displayTracks.length) {
      queueListEl.innerHTML = `<p class="empty-message">Queue is empty.</p>`;
      if (playerSheetQueuePanelEl) playerSheetQueuePanelEl.innerHTML = `<p class="empty-message">Queue is empty.</p>`;
      return;
    }

    const queueHtml = buildQueueHtml({
      displayTracks,
      currentQueue,
      currentQueueIndex,
      currentTrack: getCurrentTrack?.(),
      audioPlayer,
      escapeHtml,
      escapeHtmlAttr
    });

    queueListEl.innerHTML = queueHtml;
    if (playerSheetQueuePanelEl) playerSheetQueuePanelEl.innerHTML = `<div class="player-sheet-queue-list">${queueHtml}</div>`;
    bindInteractions?.(queueListEl, displayTracks);
    if (playerSheetQueuePanelEl) bindInteractions?.(playerSheetQueuePanelEl, displayTracks);
  }

  function bindInteractions({ container, displayTracks, currentQueue, setCurrentQueue, getCurrentQueueIndex, setCurrentQueueIndex, getCurrentTrack, togglePlayPause, setQueue, playFromQueueIndex, saveQueueState, renderQueue, syncQueuePlaybackUI, openAndScrollQueueToCurrentTrack, setQueueDragIndex, getQueueDragIndex }) {
    container.querySelectorAll("[data-queue-play]").forEach(btn => {
      btn.addEventListener("click", event => {
        event.stopPropagation();
        const index = Number(btn.dataset.queuePlay);
        const baseQueue = currentQueue.length ? currentQueue : displayTracks;
        const targetTrack = baseQueue[index];
        const currentTrack = getCurrentTrack?.();
        if (!targetTrack) return;
        if (!currentQueue.length) setQueue?.(displayTracks, false);

        if (currentTrack && currentTrack.id === targetTrack.id) {
          togglePlayPause?.();
          syncQueuePlaybackUI?.();
        } else {
          playFromQueueIndex?.(index);
        }

        if (openAndScrollQueueToCurrentTrack && container.id === "queueList") openAndScrollQueueToCurrentTrack();
      });
    });

    container.querySelectorAll("[data-queue-remove]").forEach(btn => {
      btn.addEventListener("click", event => {
        event.stopPropagation();
        const index = Number(btn.dataset.queueRemove);
        const baseQueue = currentQueue.length ? [...currentQueue] : [...displayTracks];
        if (index < 0 || index >= baseQueue.length) return;
        const [removed] = baseQueue.splice(index, 1);
        setCurrentQueue(baseQueue);
        if (!baseQueue.length) setCurrentQueueIndex(-1);
        else if (removed?.id === getCurrentTrack?.()?.id) setCurrentQueueIndex(Math.min(index, baseQueue.length - 1));
        else setCurrentQueueIndex(baseQueue.findIndex(track => track.id === getCurrentTrack?.()?.id));
        saveQueueState?.();
        renderQueue?.();
      });
    });

    container.querySelectorAll("[data-queue-play-next]").forEach(btn => {
      btn.addEventListener("click", event => {
        event.stopPropagation();
        const index = Number(btn.dataset.queuePlayNext);
        const baseQueue = currentQueue.length ? [...currentQueue] : [...displayTracks];
        if (index < 0 || index >= baseQueue.length) return;
        const current = getCurrentTrack?.();
        if (!current) {
          setQueue?.(baseQueue, false);
          playFromQueueIndex?.(index);
          return;
        }
        const currentIndex = baseQueue.findIndex(track => track.id === current.id);
        const [moved] = baseQueue.splice(index, 1);
        baseQueue.splice(Math.max(currentIndex + 1, 0), 0, moved);
        setCurrentQueue(baseQueue);
        setCurrentQueueIndex(baseQueue.findIndex(track => track.id === current.id));
        saveQueueState?.();
        renderQueue?.();
      });
    });

    container.querySelectorAll(".queue-row").forEach(row => {
      row.addEventListener("click", () => {
        const index = Number(row.dataset.queueIndex);
        if (!currentQueue.length) setQueue?.(displayTracks, false);
        playFromQueueIndex?.(index);
        openAndScrollQueueToCurrentTrack?.();
      });

      row.addEventListener("dragstart", () => {
        setQueueDragIndex?.(Number(row.dataset.queueIndex));
        row.classList.add("dragging");
      });

      row.addEventListener("dragend", () => {
        row.classList.remove("dragging");
      });

      row.addEventListener("dragover", event => {
        event.preventDefault();
      });

      row.addEventListener("drop", event => {
        event.preventDefault();
        const dropIndex = Number(row.dataset.queueIndex);
        const dragIndex = getQueueDragIndex?.();
        if (dragIndex === null || dragIndex === dropIndex) return;

        const baseQueue = currentQueue.length ? [...currentQueue] : [...displayTracks];
        const moved = baseQueue.splice(dragIndex, 1)[0];
        baseQueue.splice(dropIndex, 0, moved);
        const current = getCurrentTrack?.();
        setCurrentQueue(baseQueue);
        setCurrentQueueIndex(current ? baseQueue.findIndex(track => track.id === current.id) : 0);
        saveQueueState?.();
        renderQueue?.();
        setQueueDragIndex?.(null);
      });
    });
  }

  window.AineoQueue = {
    getDisplayTracks,
    renderQueue,
    bindInteractions
  };
})();
