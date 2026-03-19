```javascript
// ===== CONFIG =====
const TRACKS_URL = "tracks.json";

// ===== STATE =====
let tracks = [];
let filteredTracks = [];
let currentQueue = [];
let currentQueueIndex = -1;
let audio = new Audio();

let customPlaylists = {};
let downloadedTracks = [];
let recentlyPlayed = [];
let resumeTrack = null;

// ===== STORAGE =====
const STORAGE_KEYS = {
  playlists: "aineo_playlists",
  downloaded: "aineo_downloaded",
  recent: "aineo_recent",
  resume: "aineo_resume",
  queue: "aineo_queue"
};

// ===== ELEMENTS =====
const els = {
  trackList: document.getElementById("trackList"),
  queueList: document.getElementById("queueList"),
  nowPlaying: document.getElementById("nowPlaying"),
  searchInput: document.getElementById("searchInput"),

  playlistModal: document.getElementById("playlistModal"),
  playlistSelect: document.getElementById("playlistSelect"),
  newPlaylistName: document.getElementById("newPlaylistName"),
  saveToPlaylistBtn: document.getElementById("saveToPlaylistBtn"),

  downloadedList: document.getElementById("downloadedList"),
  myPlaylistList: document.getElementById("myPlaylistList")
};

let selectedTrackForPlaylist = null;

// ===== INIT =====
init();

async function init() {
  loadStorage();
  await loadTracks();
  renderTracks();
  renderQueue();
  renderPlaylists();
  renderDownloaded();

  restoreResume();
}

// ===== LOAD TRACKS (NO CACHE) =====
async function loadTracks() {
  const res = await fetch(`${TRACKS_URL}?v=${Date.now()}`, {
    cache: "no-store"
  });
  tracks = await res.json();
  filteredTracks = [...tracks];
}

// ===== STORAGE =====
function loadStorage() {
  customPlaylists = JSON.parse(localStorage.getItem(STORAGE_KEYS.playlists) || "{}");
  downloadedTracks = JSON.parse(localStorage.getItem(STORAGE_KEYS.downloaded) || "[]");
  recentlyPlayed = JSON.parse(localStorage.getItem(STORAGE_KEYS.recent) || "[]");
  resumeTrack = JSON.parse(localStorage.getItem(STORAGE_KEYS.resume) || "null");
}

function saveStorage() {
  localStorage.setItem(STORAGE_KEYS.playlists, JSON.stringify(customPlaylists));
  localStorage.setItem(STORAGE_KEYS.downloaded, JSON.stringify(downloadedTracks));
  localStorage.setItem(STORAGE_KEYS.recent, JSON.stringify(recentlyPlayed));
  localStorage.setItem(STORAGE_KEYS.resume, JSON.stringify(resumeTrack));
}

// ===== PLAY =====
function playTrack(index, list = filteredTracks) {
  const track = list[index];
  if (!track) return;

  currentQueue = list;
  currentQueueIndex = index;

  audio.src = track.src;
  audio.play();

  els.nowPlaying.textContent = `${track.title} - ${track.artist}`;

  // recent
  recentlyPlayed = [track.id, ...recentlyPlayed.filter(id => id !== track.id)].slice(0, 20);

  // resume
  resumeTrack = {
    id: track.id,
    time: 0
  };

  saveStorage();
  renderQueue();
}

audio.addEventListener("timeupdate", () => {
  if (resumeTrack) {
    resumeTrack.time = audio.currentTime;
    saveStorage();
  }
});

// ===== RESUME =====
function restoreResume() {
  if (!resumeTrack) return;

  const track = tracks.find(t => t.id === resumeTrack.id);
  if (!track) return;

  audio.src = track.src;
  audio.currentTime = resumeTrack.time || 0;
}

// ===== RENDER TRACKS =====
function renderTracks() {
  els.trackList.innerHTML = filteredTracks.map((t, i) => `
    <div class="track">
      <div>
        <strong>${t.title}</strong><br>
        <span>${t.artist}</span>
      </div>

      <div class="actions">
        <button onclick="playTrack(${i})">▶</button>
        <button onclick="openPlaylistModal('${t.id}')">+ Playlist</button>
        <button onclick="saveOffline('${t.id}')">
          ${downloadedTracks.includes(t.id) ? "Saved" : "Offline"}
        </button>
      </div>
    </div>
  `).join("");
}

// ===== PLAYLIST UI =====
function openPlaylistModal(trackId) {
  selectedTrackForPlaylist = trackId;

  const names = Object.keys(customPlaylists);
  els.playlistSelect.innerHTML = names.map(n => `<option>${n}</option>`).join("");

  els.playlistModal.style.display = "block";
}

function saveToPlaylist() {
  const name =
    els.newPlaylistName.value.trim() ||
    els.playlistSelect.value;

  if (!name) return;

  if (!customPlaylists[name]) customPlaylists[name] = [];

  if (!customPlaylists[name].includes(selectedTrackForPlaylist)) {
    customPlaylists[name].push(selectedTrackForPlaylist);
  }

  saveStorage();
  renderPlaylists();
  els.playlistModal.style.display = "none";
}

// ===== PLAYLIST RENDER =====
function renderPlaylists() {
  const names = Object.keys(customPlaylists);

  els.myPlaylistList.innerHTML = names.map(n => `
    <div class="playlist">
      <button onclick="openPlaylist('${n}')">${n}</button>
    </div>
  `).join("");
}

function openPlaylist(name) {
  const ids = customPlaylists[name];
  filteredTracks = tracks.filter(t => ids.includes(t.id));
  renderTracks();
}

// ===== DOWNLOAD =====
function saveOffline(id) {
  if (!downloadedTracks.includes(id)) {
    downloadedTracks.push(id);
    saveStorage();
    renderTracks();
    renderDownloaded();
  }
}

function renderDownloaded() {
  const list = downloadedTracks
    .map(id => tracks.find(t => t.id === id))
    .filter(Boolean);

  els.downloadedList.innerHTML = list.map((t, i) => `
    <div class="track" onclick="playTrack(${i}, ${JSON.stringify(list)})">
      ${t.title}
    </div>
  `).join("");
}

// ===== QUEUE =====
function renderQueue() {
  els.queueList.innerHTML = currentQueue.map((t, i) => `
    <div class="queue-item" draggable="true" data-i="${i}">
      ${t.title}
    </div>
  `).join("");

  enableDrag();
}

function enableDrag() {
  let dragIndex;

  document.querySelectorAll(".queue-item").forEach(el => {
    el.ondragstart = () => dragIndex = +el.dataset.i;

    el.ondrop = e => {
      const dropIndex = +el.dataset.i;

      const item = currentQueue.splice(dragIndex, 1)[0];
      currentQueue.splice(dropIndex, 0, item);

      renderQueue();
    };

    el.ondragover = e => e.preventDefault();
  });
}

// ===== SEARCH =====
els.searchInput?.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  filteredTracks = tracks.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.artist.toLowerCase().includes(q)
  );
  renderTracks();
});

// ===== EVENTS =====
els.saveToPlaylistBtn?.addEventListener("click", saveToPlaylist);
```
