// ===== CONFIG =====
const TRACKS_URL = "tracks.json";

// ===== STATE =====
let tracks = [];
let filteredTracks = [];
let currentQueue = [];
let currentQueueIndex = -1;
let audio = new Audio();

// ===== LOCAL STORAGE KEYS =====
const PLAYLIST_KEY = "aineo_custom_playlists";

// ===== ELEMENTS =====
const els = {
  trackList: document.getElementById("trackList"),
  featuredTrackList: document.getElementById("featuredTrackList"),
  queueList: document.getElementById("queueList"),
  nowPlaying: document.getElementById("nowPlaying"),
  playPauseBtn: document.getElementById("playPauseBtn"),
  searchInput: document.getElementById("searchInput"),
  playlistContainer: document.getElementById("customPlaylists"),
  newPlaylistBtn: document.getElementById("newPlaylistBtn")
};

// ===== INIT =====
init();

async function init() {
  await loadTracks();
  renderTracks();
  renderPlaylists();
}

// ===== LOAD TRACKS (NO CACHE) =====
async function loadTracks() {
  try {
    const res = await fetch(`${TRACKS_URL}?v=${Date.now()}`, {
      cache: "no-store"
    });
    tracks = await res.json();
    filteredTracks = [...tracks];
  } catch (err) {
    console.error("Failed to load tracks:", err);
  }
}

// ===== PLAYBACK =====
function playTrack(index, list = filteredTracks) {
  const track = list[index];
  if (!track) return;

  currentQueue = list;
  currentQueueIndex = index;

  audio.src = track.src;
  audio.play();

  if (els.nowPlaying) {
    els.nowPlaying.textContent = `${track.title} - ${track.artist}`;
  }
}

// ===== RENDER TRACKS =====
function renderTracks(list = filteredTracks) {
  if (!els.featuredTrackList) return;

  els.featuredTrackList.innerHTML = list
    .map((track, i) => {
      return `
        <div class="track-row">
          <div class="track-info">
            <strong>${track.title}</strong>
            <span>${track.artist}</span>
          </div>

          <div class="track-actions">
            <button onclick="playTrack(${i})">▶</button>
            <button onclick="addTrackToPlaylist('${track.id}')">+ Playlist</button>
          </div>
        </div>
      `;
    })
    .join("");
}

// ===== SEARCH =====
if (els.searchInput) {
  els.searchInput.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();

    filteredTracks = tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q)
    );

    renderTracks();
  });
}

// ===== PLAYLIST STORAGE =====
function getPlaylists() {
  return JSON.parse(localStorage.getItem(PLAYLIST_KEY) || "{}");
}

function savePlaylists(data) {
  localStorage.setItem(PLAYLIST_KEY, JSON.stringify(data));
}

// ===== CREATE PLAYLIST =====
function createPlaylist() {
  const name = prompt("Enter playlist name:");
  if (!name) return;

  const playlists = getPlaylists();
  if (!playlists[name]) {
    playlists[name] = [];
    savePlaylists(playlists);
    renderPlaylists();
  }
}

// ===== ADD TRACK TO PLAYLIST =====
function addTrackToPlaylist(trackId) {
  const playlists = getPlaylists();
  const names = Object.keys(playlists);

  if (!names.length) {
    alert("Create a playlist first.");
    return;
  }

  const name = prompt(`Add to playlist:\n${names.join("\n")}`);
  if (!name || !playlists[name]) return;

  if (!playlists[name].includes(trackId)) {
    playlists[name].push(trackId);
    savePlaylists(playlists);
  }
}

// ===== RENDER PLAYLISTS =====
function renderPlaylists() {
  if (!els.playlistContainer) return;

  const playlists = getPlaylists();
  const names = Object.keys(playlists);

  if (!names.length) {
    els.playlistContainer.innerHTML = `<p>No playlists yet</p>`;
    return;
  }

  els.playlistContainer.innerHTML = names
    .map(
      (name) => `
      <div class="playlist-row">
        <button onclick="openPlaylist('${name}')">${name}</button>
        <button onclick="deletePlaylist('${name}')">✕</button>
      </div>
    `
    )
    .join("");
}

// ===== OPEN PLAYLIST =====
function openPlaylist(name) {
  const playlists = getPlaylists();
  const ids = playlists[name] || [];

  filteredTracks = tracks.filter((t) => ids.includes(t.id));
  renderTracks(filteredTracks);
}

// ===== DELETE PLAYLIST =====
function deletePlaylist(name) {
  if (!confirm("Delete playlist?")) return;

  const playlists = getPlaylists();
  delete playlists[name];
  savePlaylists(playlists);
  renderPlaylists();
}

// ===== BUTTON HOOK =====
if (els.newPlaylistBtn) {
  els.newPlaylistBtn.addEventListener("click", createPlaylist);
}