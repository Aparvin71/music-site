(function () {
  const LYRICS_FALLBACK_MIN_LINE_SECONDS = 2.4;
  const LYRICS_FALLBACK_MAX_LINE_SECONDS = 6;

  function getTrackDurationSeconds(track) {
    if (!track) return 0;
    if (Number.isFinite(track.duration_seconds) && track.duration_seconds > 0) return Number(track.duration_seconds);

    const durationLabel = String(track.duration || "").trim();
    const match = durationLabel.match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
    if (!match) return 0;

    if (match[3] != null) {
      return (Number(match[1]) * 3600) + (Number(match[2]) * 60) + Number(match[3]);
    }

    return (Number(match[1]) * 60) + Number(match[2]);
  }

  function getPlainLyricsLines(track) {
    return String(track?.lyrics || "")
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);
  }

  function buildEstimatedLyricsFromPlainText(track) {
    if (!track) return [];
    const lines = getPlainLyricsLines(track);
    if (!lines.length) return [];

    if (Array.isArray(track.estimatedSyncedLyrics) && track.estimatedSyncedLyrics.length) {
      return track.estimatedSyncedLyrics;
    }

    const duration = getTrackDurationSeconds(track);
    const safeDuration = duration > 0
      ? duration
      : Math.min(lines.length * LYRICS_FALLBACK_MAX_LINE_SECONDS, Math.max(lines.length * LYRICS_FALLBACK_MIN_LINE_SECONDS, 180));

    const step = lines.length > 1
      ? Math.max(LYRICS_FALLBACK_MIN_LINE_SECONDS, Math.min(LYRICS_FALLBACK_MAX_LINE_SECONDS, safeDuration / Math.max(lines.length, 1)))
      : safeDuration;

    track.estimatedSyncedLyrics = lines.map((line, index) => ({
      time: Number((index * step).toFixed(3)),
      text: line
    }));

    return track.estimatedSyncedLyrics;
  }

  function getRenderableLyricsLines(track) {
    if (Array.isArray(track?.syncedLyrics) && track.syncedLyrics.length) {
      return track.syncedLyrics;
    }

    return buildEstimatedLyricsFromPlainText(track);
  }

  function getTrackLyricsOffset(track) {
    const offset = Number(track?.lyrics_offset ?? track?.lyricsOffset ?? 0);
    return Number.isFinite(offset) ? offset : 0;
  }

  function parseLrcText(lrcText, track = null) {
    let fileOffsetSeconds = 0;
    const parsedLines = [];

    String(lrcText || "")
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .forEach(rawLine => {
        const line = rawLine.trim();
        if (!line) return;

        const offsetMatch = line.match(/^\[offset:([+-]?\d+)\]$/i);
        if (offsetMatch) {
          fileOffsetSeconds = (Number(offsetMatch[1]) || 0) / 1000;
          return;
        }

        const timeMatches = [...line.matchAll(/\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]/g)];
        if (!timeMatches.length) return;

        const textOnly = line.replace(/\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]/g, "").trim();
        if (!textOnly) return;

        timeMatches.forEach(match => {
          const minutes = Number(match[1]);
          const seconds = Number(match[2]);
          const baseTime = (minutes * 60) + seconds;
          const finalTime = Math.max(0, baseTime + fileOffsetSeconds);
          if (Number.isFinite(finalTime)) {
            parsedLines.push({
              time: Number(finalTime.toFixed(3)),
              text: textOnly
            });
          }
        });
      });

    return parsedLines.sort((a, b) => a.time - b.time);
  }

  function findActiveLyricIndex(lines, currentTime) {
    if (!Array.isArray(lines) || !lines.length) return -1;

    for (let i = lines.length - 1; i >= 0; i -= 1) {
      if (currentTime >= lines[i].time) return i;
    }

    return -1;
  }

  function buildLyricsMarkup(track, emptyMessage = "No lyrics available.", helpers = {}) {
    const { escapeHtml = String, escapeHtmlAttr = String, nl2br = String } = helpers;
    if (!track) {
      return `<p class="empty-message">${escapeHtml(emptyMessage)}</p>`;
    }

    const lyricsLines = getRenderableLyricsLines(track);
    if (lyricsLines.length) {
      return `
        <div class="synced-lyrics" data-track-id="${escapeHtmlAttr(track.id)}">
          ${lyricsLines.map((line, index) => `
            <div class="lyric-line" data-lyric-index="${index}" data-track-id="${escapeHtmlAttr(track.id)}">${escapeHtml(line.text)}</div>
          `).join("")}
        </div>
      `;
    }

    if (track.lyrics) {
      return `<div class="lyrics-block">${nl2br(escapeHtml(track.lyrics))}</div>`;
    }

    return `<p class="empty-message">${escapeHtml(emptyMessage)}</p>`;
  }

  function getLyricsScrollContainer(container) {
    if (!container) return null;

    return container.closest(".lyrics-content, .lyrics-modal-body, .player-tab-panel, .modal-body")
      || container.parentElement
      || container;
  }

  function scrollActiveLyricIntoView(container, activeLine, autoScrollEnabled) {
    const scrollContainer = getLyricsScrollContainer(container);
    if (!scrollContainer || !activeLine || scrollContainer.offsetParent === null) return;

    const containerRect = scrollContainer.getBoundingClientRect();
    const lineRect = activeLine.getBoundingClientRect();
    const lineTop = lineRect.top - containerRect.top + scrollContainer.scrollTop;
    const targetScrollTop = Math.max(0, lineTop - (scrollContainer.clientHeight * 0.42) + (activeLine.clientHeight / 2));

    scrollContainer.scrollTo({
      top: targetScrollTop,
      behavior: autoScrollEnabled ? "smooth" : "auto"
    });
  }

  function renderLyricsInto({ container, track, emptyMessage, requestToken, onRendered, escapeHtml, escapeHtmlAttr, nl2br }) {
    if (!container) return;

    container.dataset.trackId = track?.id || "";
    container.innerHTML = buildLyricsMarkup(track, emptyMessage, { escapeHtml, escapeHtmlAttr, nl2br });
    onRendered?.();

    if (!track?.lyrics_file || track._syncedLyricsLoaded || track._syncedLyricsLoading) return;

    track._syncedLyricsLoading = true;
    const lyricsAssetVersion = window.AineoConfig?.app?.assetVersion || window.AineoConfig?.app?.version || "1";
    fetch(`${track.lyrics_file}?v=${encodeURIComponent(lyricsAssetVersion)}`, { cache: "no-store" })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(text => {
        track.syncedLyrics = parseLrcText(text, track);
        track._syncedLyricsLoaded = true;
      })
      .catch(error => {
        console.warn(`Could not load synced lyrics for ${track.title}:`, error);
        track.syncedLyrics = [];
        track._syncedLyricsLoaded = true;
      })
      .finally(() => {
        track._syncedLyricsLoading = false;
        if (container.dataset.trackId === track.id) {
          container.innerHTML = buildLyricsMarkup(track, emptyMessage, { escapeHtml, escapeHtmlAttr, nl2br });
          onRendered?.(requestToken);
        }
      });
  }

  function updateProgress({ track, currentTime, autoScrollEnabled }) {
    const activeIndex = findActiveLyricIndex(getRenderableLyricsLines(track), currentTime);

    document.querySelectorAll(".synced-lyrics").forEach(container => {
      const isCurrentTrack = Boolean(track && container.dataset.trackId === track.id);
      const lineEls = container.querySelectorAll(".lyric-line");

      if (!isCurrentTrack || activeIndex < 0) {
        container.dataset.activeIndex = "";
        lineEls.forEach(lineEl => lineEl.classList.remove("active", "is-past", "is-upcoming"));
        return;
      }

      lineEls.forEach((lineEl, index) => {
        lineEl.classList.toggle("active", index === activeIndex);
        lineEl.classList.toggle("is-past", index < activeIndex);
        lineEl.classList.toggle("is-upcoming", index > activeIndex);
      });

      const activeLine = lineEls[activeIndex];
      if (!activeLine) return;
      if (container.dataset.activeIndex === String(activeIndex)) return;

      container.dataset.activeIndex = String(activeIndex);

      if (autoScrollEnabled) {
        scrollActiveLyricIntoView(container, activeLine, autoScrollEnabled);
      }
    });
  }

  window.AineoLyricsEngine = {
    parseLrcText,
    findActiveLyricIndex,
    getRenderableLyricsLines,
    buildLyricsMarkup,
    renderLyricsInto,
    updateProgress
  };
})();
