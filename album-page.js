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
  audio.addEventListener("ended", playNext);
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
    album_zip: track.album_zip || ""
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
    album_zip: albumTracks.find(track => track.album_zip)?.album_zip || ""
  };

  document.title = `${album.name} - Aineo Music`;

  albumPageEls.root.innerHTML = `
    <div class="album-page-grid">
      <section class="library-panel featured-tracklist-panel">
        <div class="section-header">
          <h2>${escapeHtml(album.name)}</h2>
          <p class="hero-text">${albumTracks.length} song${albumTracks.length === 1 ? "" : "s"} • ${escapeHtml(album.artist)}</p>
        </div>
        <div class="featured-track-list">
          ${albumTracks.map((track, index) => `
            <div class="featured-track-row ${getCurrentTrack()?.id === track.id ? "playing" : ""}">
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
              <div class="featured-track-actions">
                <button class="mini-action-btn" type="button" data-play-next="${index}">Play Next</button>
                <button class="mini-action-btn" type="button" data-add-queue="${index}">Add Queue</button>
                <button class="mini-action-btn" type="button" data-lyrics-index="${index}">Lyrics</button>
              </div>
            </div>
          `).join("")}
        </div>
      </section>

      <aside class="album-page-side">
        <section class="featured-album-card">
          <div class="featured-cover-wrap">
            ${album.cover ? `<img class="featured-cover" src="${escapeHtmlAttr(album.cover)}" alt="${escapeHtmlAttr(album.name)} cover" />` : `<div class="featured-cover"></div>`}
          </div>
          <div class="featured-meta">
            <p class="eyebrow">Album Page</p>
            <h2>${escapeHtml(album.name)}</h2>
            <p>${escapeHtml(album.artist)}</p>
            <p>${albumTracks.length} song${albumTracks.length === 1 ? "" : "s"}</p>
            <div class="featured-actions">
              <button id="albumPagePlayBtn" class="action-btn" type="button">Play Album</button>
              <button id="albumPageShuffleBtn" class="action-btn secondary-btn" type="button">Shuffle Album</button>
              ${album.album_zip ? `<button id="albumPageDownloadBtn" class="action-btn secondary-btn" type="button">Download Album</button>` : ""}
            </div>
          </div>
        </section>

        <section class="queue-panel">
          <div class="queue-header">
            <div>
              <h2>Queue</h2>
              <p>${album.name}</p>
            </div>
          </div>
          <div id="albumPageQueueList" class="queue-list"></div>
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
    <div class="queue-row ${index === currentQueueIndex ? "active" : ""}">
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
