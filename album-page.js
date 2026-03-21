const albumPageEls = {
  root: document.getElementById("albumPageRoot"),
  mobileNavToggle: document.getElementById("mobileNavToggle"),
  siteNavLinks: document.getElementById("siteNavLinks"),
  lyricsModal: document.getElementById("lyricsModal"),
  lyricsModalBackdrop: document.getElementById("lyricsModalBackdrop"),
  lyricsModalBody: document.getElementById("lyricsModalBody"),
  lyricsModalTitle: document.getElementById("lyricsModalTitle"),
  closeLyricsBtn: document.getElementById("closeLyricsBtn"),
  audioPlayer: document.getElementById("audioPlayer"),
  nowCover: document.getElementById("nowCover"),
  nowTitle: document.getElementById("nowTitle"),
  nowArtist: document.getElementById("nowArtist"),
  nowAlbum: document.getElementById("nowAlbum"),
  nowScripture: document.getElementById("nowScripture"),
  prevBtn: document.getElementById("prevBtn"),
  playBtn: document.getElementById("playBtn"),
  nextBtn: document.getElementById("nextBtn"),
  currentTime: document.getElementById("currentTime"),
  seekBar: document.getElementById("seekBar"),
  duration: document.getElementById("duration")
};

let allTracks = [];
let albumTracks = [];
let currentQueue = [];
let currentQueueIndex = -1;
let toastTimer = null;
let albumQueueDragIndex = null;
let activeAlbumQueueTouchDrag = null;

const params = new URLSearchParams(window.location.search);
const albumParam = params.get("album") || "";

document.addEventListener("DOMContentLoaded", initAlbumPage);

async function initAlbumPage() {
  initMobileNav();
  bindPlayer();
  bindModal();
  await loadTracks();
  renderAlbumPage();
}

function initMobileNav() {
  const toggle = albumPageEls.mobileNavToggle;
  const nav = albumPageEls.siteNavLinks;
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.textContent = open ? "✕" : "☰";
  });
}

function bindPlayer() {
  const audio = albumPageEls.audioPlayer;
  if (!audio) return;

  albumPageEls.playBtn?.addEventListener("click", togglePlayPause);
  albumPageEls.prevBtn?.addEventListener("click", playPrevious);
  albumPageEls.nextBtn?.addEventListener("click", playNext);
  albumPageEls.seekBar?.addEventListener("input", () => {
    if (!isFinite(audio.duration)) return;
    audio.currentTime = (Number(albumPageEls.seekBar.value) / 100) * audio.duration;
  });

  audio.addEventListener("timeupdate", updateProgressUI);
  audio.addEventListener("loadedmetadata", updateProgressUI);
  audio.addEventListener("play", updatePlayButton);
  audio.addEventListener("pause", updatePlayButton);
  audio.addEventListener("ended", handleTrackEnded);
}

function bindModal() {
  albumPageEls.closeLyricsBtn?.addEventListener("click", closeLyricsModal);
  albumPageEls.lyricsModalBackdrop?.addEventListener("click", closeLyricsModal);
}

async function loadTracks() {
  const res = await fetch(`tracks.json?v=${Date.now()}`, { cache: "no-store" });
  const data = await res.json();
  allTracks = Array.isArray(data) ? data.map(normalizeTrack) : [];
  albumTracks = allTracks.filter(track => track.album.toLowerCase() === albumParam.toLowerCase());
}

function normalizeTrack(track) {
  const toArray = value => Array.isArray(value) ? value : String(value || "").split(",").map(v => v.trim()).filter(Boolean);
  return {
    id: track.id || `${track.title}-${track.album}`,
    title: track.title || "Untitled",
    artist: track.artist || "Allen Parvin",
    album: track.album || "Singles",
    year: track.year || "",
    duration: track.duration || "",
    src: track.src || track.audio || track.url || "",
    cover: track.cover || "",
    lyrics: track.lyrics || "",
    scripture_references: toArray(track.scripture_references || track.scriptureReferences || track.scripture),
    tags: toArray(track.tags),
    album_zip: track.album_zip || "",
    album_description: track.album_description || "",
    album_theme: track.album_theme || "",
    album_story: track.album_story || "",
    album_badges: toArray(track.album_badges),
    has_lyrics: Boolean(track.has_lyrics || track.lyrics),
    has_scripture_refs: Boolean(track.has_scripture_refs || toArray(track.scripture_references || track.scriptureReferences || track.scripture).length)
  };
}

function renderAlbumPage() {
  if (!albumPageEls.root) return;
  if (!albumTracks.length) {
    document.title = "Album Not Found - Aineo Music";
    albumPageEls.root.innerHTML = `
      <section class="page-card album-page-empty">
        <p class="eyebrow">Album Page</p>
        <h2>Album not found</h2>
        <p>We couldn't find that album. Head back to the library and pick another one.</p>
      </section>
    `;
    return;
  }

  const album = {
    name: albumTracks[0].album,
    artist: albumTracks[0].artist,
    cover: albumTracks.find(track => track.cover)?.cover || "",
    album_zip: albumTracks.find(track => track.album_zip)?.album_zip || "",
    description: albumTracks.find(track => track.album_description)?.album_description || "",
    theme: albumTracks.find(track => track.album_theme)?.album_theme || "",
    story: albumTracks.find(track => track.album_story)?.album_story || "",
    badges: [...new Set(albumTracks.flatMap(track => track.album_badges || []))].slice(0, 8)
  };

  const scriptureSummary = getAlbumScriptureSummary(albumTracks);
  const tagSummary = [...new Set(albumTracks.flatMap(track => track.tags || []))].slice(0, 6);
  const totalDuration = formatDurationLabel(albumTracks);
  const relatedSongs = getAlbumRelatedSongs(albumTracks).slice(0, 6);
  const trackCountWithLyrics = albumTracks.filter(track => track.has_lyrics).length;
  const trackCountWithScripture = albumTracks.filter(track => track.has_scripture_refs).length;

  document.title = `${album.name} - Aineo Music`;

  albumPageEls.root.innerHTML = `
    <section class="featured-album-card album-page-hero-card">
      <div class="album-page-hero-backdrop"${album.cover ? ` style="background-image:url('${escapeHtmlAttr(album.cover)}')"` : ""}></div>
      <div class="album-page-hero-layout">
        <div class="featured-cover-wrap album-page-hero-cover-wrap">
          ${album.cover ? `<img class="featured-cover album-page-hero-cover" src="${escapeHtmlAttr(album.cover)}" alt="${escapeHtmlAttr(album.name)} cover" />` : `<div class="featured-cover album-page-hero-cover"></div>`}
        </div>
        <div class="featured-meta album-page-hero-copy">
          <p class="eyebrow">Album Page</p>
          <h1 class="album-page-title">${escapeHtml(album.name)}</h1>
          <p class="album-page-subtitle">${escapeHtml(album.artist)}</p>
          <div class="album-page-stat-row">
            <span class="album-stat-pill">${albumTracks.length} song${albumTracks.length === 1 ? "" : "s"}</span>
            ${totalDuration ? `<span class="album-stat-pill">${escapeHtml(totalDuration)}</span>` : ""}
            ${albumTracks[0].year ? `<span class="album-stat-pill">${escapeHtml(String(albumTracks[0].year))}</span>` : ""}
            <span class="album-stat-pill">${trackCountWithLyrics} with lyrics</span>
          </div>
          ${album.theme ? `<p class="album-page-theme-line">${escapeHtml(album.theme)}</p>` : ""}
          ${album.description ? `<p class="album-page-description">${escapeHtml(album.description)}</p>` : ""}
          ${album.badges.length ? `<div class="album-page-badge-row">${album.badges.map(badge => `<span class="album-inline-chip album-badge-chip">${escapeHtml(badge)}</span>`).join("")}</div>` : ""}
          ${tagSummary.length ? `<div class="album-page-tag-row">${tagSummary.map(tag => `<span class="album-inline-chip">#${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
          <div class="featured-actions album-page-hero-actions">
            <button id="albumPagePlayBtn" class="action-btn" type="button">Play Album</button>
            <button id="albumPageShuffleBtn" class="action-btn secondary-btn" type="button">Shuffle Album</button>
            ${album.album_zip ? `<button id="albumPageDownloadBtn" class="action-btn secondary-btn" type="button">Download Album</button>` : ""}
          </div>
        </div>
      </div>
    </section>

    <div class="album-page-grid polished-album-page-grid">
      <section class="library-panel featured-tracklist-panel album-page-main-panel">
        <div class="section-header album-page-section-header">
          <div>
            <p class="eyebrow">Track List</p>
            <h2>${escapeHtml(album.name)}</h2>
          </div>
          <p class="hero-text">Tap any track to start playback, queue songs, or jump into lyrics.</p>
        </div>
        <div class="featured-track-list album-page-track-list">
          ${albumTracks.map((track, index) => `
            <div class="featured-track-row album-page-track-row ${getCurrentTrack()?.id === track.id ? "playing" : ""}">
              <button class="featured-track-play" type="button" data-play-index="${index}" aria-label="Play ${escapeHtmlAttr(track.title)}">▶</button>
              <div class="featured-track-main">
                <div class="featured-track-title-line">
                  <strong>${index + 1}. ${escapeHtml(track.title)}</strong>
                  ${track.duration ? `<span class="featured-track-duration">${escapeHtml(track.duration)}</span>` : ""}
                </div>
                <div class="featured-track-meta-line">
                  <span>${escapeHtml(track.artist)}</span>
                  ${track.scripture_references.length ? `<span>• ${escapeHtml(track.scripture_references.join(" • "))}</span>` : ""}
                </div>
              </div>
              <div class="featured-track-actions album-page-track-actions">
                <button class="mini-action-btn" type="button" data-play-next="${index}">Play Next</button>
                <button class="mini-action-btn" type="button" data-add-queue="${index}">Add Queue</button>
                <button class="mini-action-btn" type="button" data-lyrics-index="${index}">Lyrics</button>
              </div>
            </div>
          `).join("")}
        </div>
      </section>

      <aside class="album-page-side polished-album-page-side">
        <section class="queue-panel album-page-info-card album-page-highlight-card">
          <div class="queue-header">
            <div>
              <h2>Album highlights</h2>
              <p>At-a-glance details</p>
            </div>
          </div>
          <div class="album-highlight-grid">
            <div class="album-highlight-pill"><strong>${albumTracks.length}</strong><span>Tracks</span></div>
            <div class="album-highlight-pill"><strong>${escapeHtml(totalDuration || '—')}</strong><span>Runtime</span></div>
            <div class="album-highlight-pill"><strong>${trackCountWithScripture}</strong><span>Scripture songs</span></div>
            <div class="album-highlight-pill"><strong>${tagSummary.length}</strong><span>Theme tags</span></div>
          </div>
          ${album.story ? `<p class="album-page-story">${escapeHtml(album.story)}</p>` : `<p class="album-page-story muted">Add an album story in <code>ALBUM_METADATA</code> to enrich this page even more.</p>`}
        </section>

        <section class="queue-panel album-page-info-card">
          <div class="queue-header">
            <div>
              <h2>Scripture in this album</h2>
              <p>${scriptureSummary.totalReferences} reference${scriptureSummary.totalReferences === 1 ? "" : "s"}</p>
            </div>
          </div>
          <div class="album-page-scripture-summary ${scriptureSummary.books.length ? "" : "empty"}">
            ${scriptureSummary.books.length
              ? scriptureSummary.books.map(book => `<button class="scripture-summary-chip" type="button" data-jump-scripture="${escapeHtmlAttr(book.name)}">${escapeHtml(book.name)} <span>${book.count}</span></button>`).join("")
              : `<p class="empty-message">No scripture references listed for this album.</p>`}
          </div>
        </section>

        <section class="queue-panel album-page-info-card">
          <div class="queue-header">
            <div>
              <h2>Queue</h2>
              <p>${album.name}</p>
            </div>
          </div>
          <div id="albumPageQueueList" class="queue-list"></div>
        </section>

        <section class="queue-panel album-page-info-card">
          <div class="queue-header">
            <div>
              <h2>Related songs</h2>
              <p>Similar themes and tags</p>
            </div>
          </div>
          <div class="album-page-related-list">
            ${relatedSongs.length ? relatedSongs.map((track, index) => `
              <button class="album-related-card" type="button" data-related-index="${index}">
                ${track.cover ? `<img src="${escapeHtmlAttr(track.cover)}" alt="${escapeHtmlAttr(track.title)} cover" class="album-related-cover" />` : `<div class="album-related-cover"></div>`}
                <span class="album-related-copy">
                  <strong>${escapeHtml(track.title)}</strong>
                  <span>${escapeHtml(track.album)}</span>
                </span>
              </button>
            `).join("") : `<p class="empty-message">No related songs found yet.</p>`}
          </div>
        </section>
      </aside>
    </div>
  `;

  document.getElementById("albumPagePlayBtn")?.addEventListener("click", () => startPlaybackFromList(albumTracks, false, 0));
  document.getElementById("albumPageShuffleBtn")?.addEventListener("click", () => startPlaybackFromList(albumTracks, true, 0));
  document.getElementById("albumPageDownloadBtn")?.addEventListener("click", () => triggerDownload(album.album_zip, `${safeFileName(album.name)}.zip`));

  albumPageEls.root.querySelectorAll("[data-play-index]").forEach(btn => {
    btn.addEventListener("click", () => startPlaybackFromList(albumTracks, false, Number(btn.dataset.playIndex)));
  });
  albumPageEls.root.querySelectorAll("[data-play-next]").forEach(btn => {
    btn.addEventListener("click", () => addTrackToQueue(albumTracks[Number(btn.dataset.playNext)], { playNext: true }));
  });
  albumPageEls.root.querySelectorAll("[data-add-queue]").forEach(btn => {
    btn.addEventListener("click", () => addTrackToQueue(albumTracks[Number(btn.dataset.addQueue)]));
  });
  albumPageEls.root.querySelectorAll("[data-lyrics-index]").forEach(btn => {
    btn.addEventListener("click", () => openLyricsModal(albumTracks[Number(btn.dataset.lyricsIndex)]));
  });
  albumPageEls.root.querySelectorAll("[data-jump-scripture]").forEach(btn => {
    btn.addEventListener("click", () => {
      window.location.href = `index.html?scripture=${encodeURIComponent(btn.dataset.jumpScripture)}`;
    });
  });
  albumPageEls.root.querySelectorAll("[data-related-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      const track = relatedSongs[Number(btn.dataset.relatedIndex)];
      if (track) addTrackToQueue(track, { playNext: true });
    });
  });

  renderQueue();
}

function startPlaybackFromList(trackList, shuffle = false, startIndex = 0) {
  currentQueue = shuffle ? shuffleArray([...trackList]) : [...trackList];
  currentQueueIndex = Math.max(0, Math.min(startIndex, currentQueue.length - 1));
  playTrack(currentQueue[currentQueueIndex]);
  renderQueue();
}

function addTrackToQueue(track, options = {}) {
  if (!track) return;
  const playNext = Boolean(options.playNext);
  const current = getCurrentTrack();

  if (!current) {
    currentQueue = [track];
    currentQueueIndex = 0;
    playTrack(track);
    renderQueue();
    showToast(playNext ? `Playing next: ${track.title}` : `Added and playing: ${track.title}`);
    return;
  }

  const queue = currentQueue.length ? [...currentQueue] : [current];
  const existing = queue.findIndex(item => item.id === track.id);
  if (existing >= 0) queue.splice(existing, 1);
  const currentIndex = Math.max(queue.findIndex(item => item.id === current.id), 0);
  queue.splice(playNext ? currentIndex + 1 : queue.length, 0, track);
  currentQueue = queue;
  currentQueueIndex = currentQueue.findIndex(item => item.id === current.id);
  renderQueue();
  showToast(playNext ? `Play next set: ${track.title}` : `Added to queue: ${track.title}`);
}

function renderQueue() {
  const wrap = document.getElementById("albumPageQueueList");
  if (!wrap) return;
  if (!currentQueue.length) {
    wrap.innerHTML = `<p class="empty-message">Queue is empty.</p>`;
    return;
  }

  wrap.innerHTML = currentQueue.map((track, index) => `
    <div class="queue-row ${index === currentQueueIndex ? "active" : ""}" draggable="true" data-queue-index="${index}">
      <button class="queue-drag-handle" data-queue-drag-handle="${index}" type="button" aria-label="Drag to reorder ${escapeHtmlAttr(track.title)}">↕</button>
      ${track.cover ? `<img class="queue-cover" src="${escapeHtmlAttr(track.cover)}" alt="${escapeHtmlAttr(track.title)} cover" />` : `<div class="queue-cover"></div>`}
      <div class="queue-main">
        <div class="queue-title-row">
          <h3>${escapeHtml(track.title)}</h3>
          <span class="queue-duration">${escapeHtml(track.duration || "")}</span>
        </div>
        <p class="queue-artist">${escapeHtml(track.artist)}</p>
        <div class="queue-actions">
          <button class="mini-action-btn" type="button" data-queue-play="${index}">Play</button>
          <button class="mini-action-btn" type="button" data-queue-remove="${index}">Remove</button>
        </div>
      </div>
    </div>
  `).join("");

  wrap.querySelectorAll("[data-queue-play]").forEach(btn => btn.addEventListener("click", () => playFromQueueIndex(Number(btn.dataset.queuePlay))));
  wrap.querySelectorAll("[data-queue-remove]").forEach(btn => btn.addEventListener("click", () => {
    const index = Number(btn.dataset.queueRemove);
    currentQueue.splice(index, 1);
    if (!currentQueue.length) {
      currentQueueIndex = -1;
      albumPageEls.audioPlayer.pause();
    } else if (index <= currentQueueIndex) {
      currentQueueIndex = Math.max(0, currentQueueIndex - 1);
    }
    renderQueue();
  }));

  wrap.querySelectorAll(".queue-row").forEach(row => {
    row.addEventListener("dragstart", event => {
      if (event.target && !event.target.closest(".queue-drag-handle")) {
        event.preventDefault();
        return;
      }
      albumQueueDragIndex = Number(row.dataset.queueIndex);
      row.classList.add("dragging");
    });
    row.addEventListener("dragend", () => row.classList.remove("dragging"));
    row.addEventListener("dragover", event => event.preventDefault());
    row.addEventListener("drop", event => {
      event.preventDefault();
      const targetIndex = Number(row.dataset.queueIndex);
      if (albumQueueDragIndex === null || albumQueueDragIndex === targetIndex) return;
      const current = getCurrentTrack();
      const moved = currentQueue.splice(albumQueueDragIndex, 1)[0];
      currentQueue.splice(targetIndex, 0, moved);
      currentQueueIndex = current ? currentQueue.findIndex(track => track.id === current.id) : 0;
      renderQueue();
      albumQueueDragIndex = null;
    });
  });

  wrap.querySelectorAll("[data-queue-drag-handle]").forEach(handle => {
    handle.addEventListener("touchstart", startAlbumQueueTouchDrag, { passive: true });
    handle.addEventListener("touchmove", updateAlbumQueueTouchDrag, { passive: false });
    handle.addEventListener("touchend", finishAlbumQueueTouchDrag);
    handle.addEventListener("touchcancel", cancelAlbumQueueTouchDrag);
  });
}

function startAlbumQueueTouchDrag(event) {
  const touch = event.touches?.[0];
  const row = event.currentTarget.closest(".queue-row");
  if (!touch || !row) return;
  activeAlbumQueueTouchDrag = {
    sourceIndex: Number(row.dataset.queueIndex),
    targetIndex: Number(row.dataset.queueIndex)
  };
  document.querySelectorAll("#albumPageQueueList .queue-row").forEach(item => item.classList.remove("drag-target", "dragging"));
  row.classList.add("dragging");
}

function updateAlbumQueueTouchDrag(event) {
  if (!activeAlbumQueueTouchDrag) return;
  const touch = event.touches?.[0];
  if (!touch) return;
  event.preventDefault();
  const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest("#albumPageQueueList .queue-row");
  if (!target) return;
  activeAlbumQueueTouchDrag.targetIndex = Number(target.dataset.queueIndex);
  document.querySelectorAll("#albumPageQueueList .queue-row").forEach(item => item.classList.remove("drag-target"));
  target.classList.add("drag-target");
}

function finishAlbumQueueTouchDrag() {
  if (!activeAlbumQueueTouchDrag) return;
  const { sourceIndex, targetIndex } = activeAlbumQueueTouchDrag;
  document.querySelectorAll("#albumPageQueueList .queue-row").forEach(item => item.classList.remove("drag-target", "dragging"));
  if (Number.isInteger(sourceIndex) && Number.isInteger(targetIndex) && sourceIndex !== targetIndex) {
    const current = getCurrentTrack();
    const moved = currentQueue.splice(sourceIndex, 1)[0];
    if (moved) {
      currentQueue.splice(targetIndex, 0, moved);
      currentQueueIndex = current ? currentQueue.findIndex(track => track.id === current.id) : 0;
      renderQueue();
      showToast(`Moved: ${moved.title}`);
    }
  }
  activeAlbumQueueTouchDrag = null;
}

function cancelAlbumQueueTouchDrag() {
  document.querySelectorAll("#albumPageQueueList .queue-row").forEach(item => item.classList.remove("drag-target", "dragging"));
  activeAlbumQueueTouchDrag = null;
}

function playTrack(track) {
  if (!track || !track.src || !albumPageEls.audioPlayer) return;
  albumPageEls.audioPlayer.src = track.src;
  albumPageEls.audioPlayer.play().catch(() => {});
  updateNowPlaying(track);
  updatePlayButton();
  updateProgressUI();
  renderAlbumPage();
}

function playFromQueueIndex(index) {
  if (index < 0 || index >= currentQueue.length) return;
  currentQueueIndex = index;
  playTrack(currentQueue[currentQueueIndex]);
}

function playNext() {
  if (!currentQueue.length) return;
  currentQueueIndex = (currentQueueIndex + 1) % currentQueue.length;
  playTrack(currentQueue[currentQueueIndex]);
}

function handleTrackEnded() {
  const current = getCurrentTrack();
  if (!current) return;

  if (currentQueueIndex >= currentQueue.length - 1) {
    const radioTracks = getRelatedTracks(current, { limit: 8, excludeIds: currentQueue.map(track => track.id) });
    if (radioTracks.length) {
      currentQueue = [...currentQueue, ...radioTracks];
      renderQueue();
      showToast(`Radio mode added ${radioTracks.length} related song${radioTracks.length === 1 ? "" : "s"}.`);
    }
  }

  playNext();
}

function playPrevious() {
  if (!currentQueue.length) return;
  currentQueueIndex = (currentQueueIndex - 1 + currentQueue.length) % currentQueue.length;
  playTrack(currentQueue[currentQueueIndex]);
}

function togglePlayPause() {
  if (!albumPageEls.audioPlayer.src && albumTracks.length) {
    startPlaybackFromList(albumTracks, false, 0);
    return;
  }
  if (albumPageEls.audioPlayer.paused) albumPageEls.audioPlayer.play();
  else albumPageEls.audioPlayer.pause();
}

function updateNowPlaying(track) {
  albumPageEls.nowCover.src = track.cover || "";
  albumPageEls.nowTitle.textContent = track.title || "Select a song";
  albumPageEls.nowArtist.textContent = track.artist || "—";
  albumPageEls.nowAlbum.textContent = track.album || "—";
  albumPageEls.nowScripture.textContent = track.scripture_references.length ? track.scripture_references.join(" • ") : "—";
}

function updatePlayButton() {
  if (albumPageEls.playBtn) albumPageEls.playBtn.textContent = albumPageEls.audioPlayer?.paused ? "▶" : "❚❚";
}

function updateProgressUI() {
  const audio = albumPageEls.audioPlayer;
  if (!audio) return;
  const duration = isFinite(audio.duration) ? audio.duration : 0;
  const current = audio.currentTime || 0;
  if (albumPageEls.seekBar) albumPageEls.seekBar.value = duration ? ((current / duration) * 100).toFixed(3) : 0;
  if (albumPageEls.currentTime) albumPageEls.currentTime.textContent = formatTime(current);
  if (albumPageEls.duration) albumPageEls.duration.textContent = formatTime(duration);
}

function openLyricsModal(track) {
  if (!track || !albumPageEls.lyricsModal) return;
  albumPageEls.lyricsModalTitle.textContent = `${track.title} Lyrics`;
  albumPageEls.lyricsModalBody.innerHTML = track.lyrics ? `<div class="lyrics-block">${nl2br(escapeHtml(track.lyrics))}</div>` : `<p class="empty-message">No lyrics available.</p>`;
  albumPageEls.lyricsModal.classList.remove("hidden");
  albumPageEls.lyricsModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLyricsModal() {
  albumPageEls.lyricsModal?.classList.add("hidden");
  albumPageEls.lyricsModal?.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function getCurrentTrack() {
  return currentQueue[currentQueueIndex] || null;
}

function getAlbumRelatedSongs(trackList) {
  const excludeIds = new Set(trackList.map(track => track.id));
  const albumTags = new Set(trackList.flatMap(track => track.tags || []).map(tag => String(tag).toLowerCase()));
  const albumBooks = new Set(trackList.flatMap(track => (track.scripture_references || []).map(ref => getScriptureBook(ref).toLowerCase())));
  const albumArtist = String(trackList[0]?.artist || "").toLowerCase();

  return allTracks
    .filter(track => track?.src && !excludeIds.has(track.id))
    .map(track => {
      let score = 0;
      if (String(track.artist || "").toLowerCase() === albumArtist) score += 4;
      (track.tags || []).forEach(tag => {
        if (albumTags.has(String(tag).toLowerCase())) score += 3;
      });
      (track.scripture_references || []).forEach(ref => {
        if (albumBooks.has(getScriptureBook(ref).toLowerCase())) score += 3;
      });
      return { track, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.track.title.localeCompare(b.track.title))
    .map(item => item.track);
}

function getRelatedTracks(track, options = {}) {
  if (!track) return [];
  const excludeIds = new Set(options.excludeIds || []);
  excludeIds.add(track.id);

  const currentTags = new Set((track.tags || []).map(tag => String(tag).toLowerCase()));
  const currentBooks = new Set((track.scripture_references || []).map(ref => getScriptureBook(ref).toLowerCase()));
  const currentArtist = String(track.artist || "").toLowerCase();

  return allTracks
    .filter(candidate => candidate?.src && !excludeIds.has(candidate.id))
    .map(candidate => {
      let score = 0;
      if (String(candidate.artist || "").toLowerCase() === currentArtist) score += 4;
      (candidate.tags || []).forEach(tag => {
        if (currentTags.has(String(tag).toLowerCase())) score += 3;
      });
      (candidate.scripture_references || []).forEach(ref => {
        if (currentBooks.has(getScriptureBook(ref).toLowerCase())) score += 3;
      });
      return { candidate, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title))
    .slice(0, options.limit || 8)
    .map(item => item.candidate);
}

function getAlbumScriptureSummary(trackList) {
  const map = new Map();
  let totalReferences = 0;

  trackList.forEach(track => {
    (track.scripture_references || []).forEach(ref => {
      const book = getScriptureBook(ref);
      if (!book) return;
      totalReferences += 1;
      if (!map.has(book)) map.set(book, { name: book, count: 0 });
      map.get(book).count += 1;
    });
  });

  return {
    totalReferences,
    books: [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 10)
  };
}

function getScriptureBook(reference) {
  const text = String(reference || "").trim();
  if (!text) return "";
  const cleaned = text.replace(/[–-].*$/, "").trim();
  const match = cleaned.match(/^((?:[1-3]\s+)?[A-Za-z]+(?:\s+[A-Za-z]+)*?)(?=\s+\d|$)/);
  return match ? match[1].trim() : cleaned;
}

function formatDurationLabel(trackList) {
  const totalSeconds = trackList.reduce((sum, track) => {
    const parts = String(track.duration || "").split(":").map(Number);
    if (parts.some(Number.isNaN)) return sum;
    if (parts.length === 2) return sum + parts[0] * 60 + parts[1];
    if (parts.length === 3) return sum + parts[0] * 3600 + parts[1] * 60 + parts[2];
    return sum;
  }, 0);

  if (!totalSeconds) return "";
  const minutes = Math.round(totalSeconds / 60);
  return `${minutes} min total`;
}

function showToast(message) {
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "app-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function triggerDownload(url, filename) {
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function safeFileName(value) {
  return String(value || "download").replace(/[\\/:*?"<>|]+/g, "-").trim();
}

function nl2br(text) {
  return String(text || "").replace(/\n/g, "<br>");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeHtmlAttr(value) {
  return escapeHtml(value);
}
