let tracks = [];
let filteredTracks = [];
let currentTrackIndex = -1;
let currentQueue = [];
let currentQueueIndex = -1;
let favorites = [];
let recentlyPlayed = [];
let resumeTrackSrc = null;

const STORAGE_KEYS = {
  favorites: "allen_parvin_favorites",
  recentlyPlayed: "allen_parvin_recently_played",
  resume: "allen_parvin_resume"
};

const filters = {
  selectedAlbum: null,
  selectedPlaylist: null,
  selectedTag: null,
  searchTerm: ""
};

const els = {
  searchInput: document.getElementById("searchInput"),
  playlistList: document.getElementById("playlistList"),
  tagList: document.getElementById("tagList"),
  albumGrid: document.getElementById("albumGrid"),

  activeFilterLabel: document.getElementById("activeFilterLabel"),
  clearFiltersBtn: document.getElementById("clearFiltersBtn"),
  featuredTrackListTitle: document.getElementById("featuredTrackListTitle"),
  featuredTrackList: document.getElementById("featuredTrackList"),

  featuredAlbumCard: document.getElementById("featuredAlbumCard"),
  featuredAlbumCover: document.getElementById("featuredAlbumCover"),
  featuredAlbumTitle: document.getElementById("featuredAlbumTitle"),
  featuredAlbumArtist: document.getElementById("featuredAlbumArtist"),
  featuredAlbumCount: document.getElementById("featuredAlbumCount"),
  playAlbumBtn: document.getElementById("playAlbumBtn"),
  shuffleAlbumBtn: document.getElementById("shuffleAlbumBtn"),
  downloadAlbumBtn: document.getElementById("downloadAlbumBtn"),
  openAlbumBtn: document.getElementById("openAlbumBtn"),

  favoritesList: document.getElementById("favoritesList"),
  recentlyPlayedList: document.getElementById("recentlyPlayedList"),

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
  duration: document.getElementById("duration"),
  audioPlayer: document.getElementById("audioPlayer"),

  openLyricsBtn: document.getElementById("openLyricsBtn"),
  copyLyricsBtn: document.getElementById("copyLyricsBtn"),
  shareSongBtn: document.getElementById("shareSongBtn"),
  favoriteSongBtn: document.getElementById("favoriteSongBtn"),
  downloadSongBtn: document.getElementById("downloadSongBtn"),
  playQueueBtn: document.getElementById("playQueueBtn"),
  shuffleQueueBtn: document.getElementById("shuffleQueueBtn"),

  lyricsContent: document.getElementById("lyricsContent"),
  scriptureContent: document.getElementById("scriptureContent"),

  queueCount: document.getElementById("queueCount"),
  queueList: document.getElementById("queueList"),

  lyricsModal: document.getElementById("lyricsModal"),
  lyricsModalBackdrop: document.getElementById("lyricsModalBackdrop"),
  lyricsModalTitle: document.getElementById("lyricsModalTitle"),
  lyricsModalBody: document.getElementById("lyricsModalBody"),
  closeLyricsBtn: document.getElementById("closeLyricsBtn"),

  albumModal: document.getElementById("albumModal"),
  albumModalBackdrop: document.getElementById("albumModalBackdrop"),
  albumModalTitle: document.getElementById("albumModalTitle"),
  albumModalCover: document.getElementById("albumModalCover"),
  albumModalArtist: document.getElementById("albumModalArtist"),
  albumModalInfo: document.getElementById("albumModalInfo"),
  albumModalTracks: document.getElementById("albumModalTracks"),
  albumModalPlayBtn: document.getElementById("albumModalPlayBtn"),
  albumModalShuffleBtn: document.getElementById("albumModalShuffleBtn"),
  albumModalDownloadBtn: document.getElementById("albumModalDownloadBtn"),
  closeAlbumBtn: document.getElementById("closeAlbumBtn"),

  resumeBanner: document.getElementById("resumeBanner"),
  resumeText: document.getElementById("resumeText"),
  resumeSongBtn: document.getElementById("resumeSongBtn"),
  dismissResumeBtn: document.getElementById("dismissResumeBtn")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  loadStoredData();
  bindUI();
  await loadTracks();
  updateLibraryView();
  renderFavorites();
  renderRecentlyPlayed();
  renderQueue();
  showResumeBannerIfAvailable();
}

/* =========================
   LOAD + NORMALIZE
========================= */

async function loadTracks() {
  try {
    const res = await fetch("tracks.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    tracks = Array.isArray(data) ? data.map(normalizeTrack) : [];
    filteredTracks = [...tracks];
  } catch (error) {
    console.error("Error loading tracks.json:", error);
    tracks = [];
    filteredTracks = [];
    renderEmptyLibraryState("Could not load music library.");
  }
}

function normalizeTrack(track, index) {
  const tags = normalizeStringArray(track.tags);
  const playlists = normalizeStringArray(track.playlists || track.playlist);
  const scriptureRefs = normalizeStringArray(
    track.scripture_references || track.scriptureReferences || track.scripture
  );

  return {
    id: track.id || makeTrackId(track, index),
    title: track.title || "Untitled",
    artist: track.artist || "Allen Parvin",
    album: track.album || "Singles",
    year: track.year || "",
    genre: track.genre || "",
    duration: track.duration || "",
    src: track.src || track.url || track.audio || "",
    cover: track.cover || track.artwork || track.image || "",
    lyrics: track.lyrics || "",
    tags,
    playlists,
    scripture_references: scriptureRefs,
    trackNumber: track.trackNumber || track.track || "",
    description: track.description || "",
    album_zip: track.album_zip || ""
  };
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map(v => v.trim())
      .filter(Boolean);
  }

  return [];
}

function makeTrackId(track, index) {
  return `${track.title || "track"}__${track.album || "album"}__${index}`;
}

/* =========================
   STORAGE
========================= */

function loadStoredData() {
  try {
    favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || "[]");
  } catch {
    favorites = [];
  }

  try {
    recentlyPlayed = JSON.parse(localStorage.getItem(STORAGE_KEYS.recentlyPlayed) || "[]");
  } catch {
    recentlyPlayed = [];
  }

  try {
    const resume = JSON.parse(localStorage.getItem(STORAGE_KEYS.resume) || "null");
    if (resume && resume.src) {
      resumeTrackSrc = resume.src;
    }
  } catch {
    resumeTrackSrc = null;
  }
}

function saveFavorites() {
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
}

function saveRecentlyPlayed() {
  localStorage.setItem(STORAGE_KEYS.recentlyPlayed, JSON.stringify(recentlyPlayed));
}

function saveResume(track) {
  if (!track) return;

  localStorage.setItem(
    STORAGE_KEYS.resume,
    JSON.stringify({
      src: track.src,
      title: track.title,
      artist: track.artist,
      album: track.album
    })
  );

  resumeTrackSrc = track.src;
}

function clearResume() {
  localStorage.removeItem(STORAGE_KEYS.resume);
  resumeTrackSrc = null;
}

/* =========================
   UI BINDINGS
========================= */

function bindUI() {
  if (els.searchInput) {
    els.searchInput.addEventListener("input", e => {
      setSearchFilter(e.target.value);
    });
  }

  if (els.clearFiltersBtn) {
    els.clearFiltersBtn.addEventListener("click", clearAllFilters);
  }

  if (els.playBtn) {
    els.playBtn.addEventListener("click", togglePlayPause);
  }

  if (els.prevBtn) {
    els.prevBtn.addEventListener("click", playPreviousTrack);
  }

  if (els.nextBtn) {
    els.nextBtn.addEventListener("click", playNextTrack);
  }

  if (els.seekBar) {
    els.seekBar.addEventListener("input", () => {
      if (!els.audioPlayer || !isFinite(els.audioPlayer.duration)) return;
      const percent = Number(els.seekBar.value) / 100;
      els.audioPlayer.currentTime = percent * els.audioPlayer.duration;
    });
  }

  if (els.audioPlayer) {
    els.audioPlayer.addEventListener("timeupdate", updateProgressUI);
    els.audioPlayer.addEventListener("loadedmetadata", updateProgressUI);
    els.audioPlayer.addEventListener("play", updatePlayButton);
    els.audioPlayer.addEventListener("pause", updatePlayButton);
    els.audioPlayer.addEventListener("ended", playNextTrack);
  }

  if (els.openLyricsBtn) {
    els.openLyricsBtn.addEventListener("click", openLyricsModal);
  }

  if (els.copyLyricsBtn) {
    els.copyLyricsBtn.addEventListener("click", copyCurrentLyrics);
  }

  if (els.shareSongBtn) {
    els.shareSongBtn.addEventListener("click", shareCurrentSong);
  }

  if (els.favoriteSongBtn) {
    els.favoriteSongBtn.addEventListener("click", toggleCurrentFavorite);
  }

  if (els.downloadSongBtn) {
    els.downloadSongBtn.addEventListener("click", downloadCurrentSong);
  }

  if (els.playQueueBtn) {
    els.playQueueBtn.addEventListener("click", () => {
      if (!filteredTracks.length) return;
      setQueue(filteredTracks, false);
      playFromQueueIndex(0);
    });
  }

  if (els.shuffleQueueBtn) {
    els.shuffleQueueBtn.addEventListener("click", () => {
      if (!filteredTracks.length) return;
      setQueue(filteredTracks, true);
      playFromQueueIndex(0);
    });
  }

  if (els.playAlbumBtn) {
    els.playAlbumBtn.addEventListener("click", () => {
      const album = getFeaturedAlbum();
      if (!album) return;
      setQueue(album.tracks, false);
      playFromQueueIndex(0);
    });
  }

  if (els.shuffleAlbumBtn) {
    els.shuffleAlbumBtn.addEventListener("click", () => {
      const album = getFeaturedAlbum();
      if (!album) return;
      setQueue(album.tracks, true);
      playFromQueueIndex(0);
    });
  }

  if (els.downloadAlbumBtn) {
    els.downloadAlbumBtn.addEventListener("click", () => {
      const album = getFeaturedAlbum();
      if (!album || !album.album_zip) return;
      triggerDownload(album.album_zip, `${safeFileName(album.name)}.zip`);
    });
  }

  if (els.openAlbumBtn) {
    els.openAlbumBtn.addEventListener("click", () => {
      const album = getFeaturedAlbum();
      if (!album) return;
      openAlbumModal(album);
    });
  }

  if (els.closeLyricsBtn) {
    els.closeLyricsBtn.addEventListener("click", closeLyricsModal);
  }

  if (els.lyricsModalBackdrop) {
    els.lyricsModalBackdrop.addEventListener("click", closeLyricsModal);
  }

  if (els.closeAlbumBtn) {
    els.closeAlbumBtn.addEventListener("click", closeAlbumModal);
  }

  if (els.albumModalBackdrop) {
    els.albumModalBackdrop.addEventListener("click", closeAlbumModal);
  }

  if (els.albumModalPlayBtn) {
    els.albumModalPlayBtn.addEventListener("click", () => {
      const album = getAlbumModalAlbum();
      if (!album) return;
      setQueue(album.tracks, false);
      playFromQueueIndex(0);
    });
  }

  if (els.albumModalShuffleBtn) {
    els.albumModalShuffleBtn.addEventListener("click", () => {
      const album = getAlbumModalAlbum();
      if (!album) return;
      setQueue(album.tracks, true);
      playFromQueueIndex(0);
    });
  }

  if (els.albumModalDownloadBtn) {
    els.albumModalDownloadBtn.addEventListener("click", () => {
      const album = getAlbumModalAlbum();
      if (!album || !album.album_zip) return;
      triggerDownload(album.album_zip, `${safeFileName(album.name)}.zip`);
    });
  }

  if (els.resumeSongBtn) {
    els.resumeSongBtn.addEventListener("click", resumeSavedTrack);
  }

  if (els.dismissResumeBtn) {
    els.dismissResumeBtn.addEventListener("click", hideResumeBanner);
  }

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeLyricsModal();
      closeAlbumModal();
    }
  });
}

/* =========================
   FILTERS
========================= */

function setAlbumFilter(albumName) {
  filters.selectedAlbum = albumName;
  filters.selectedPlaylist = null;
  filters.selectedTag = null;
  filters.searchTerm = "";
  if (els.searchInput) els.searchInput.value = "";
  updateLibraryView();
}

function setPlaylistFilter(playlistName) {
  filters.selectedAlbum = null;
  filters.selectedPlaylist = playlistName;
  filters.selectedTag = null;
  filters.searchTerm = "";
  if (els.searchInput) els.searchInput.value = "";
  updateLibraryView();
}

function setTagFilter(tagName) {
  filters.selectedAlbum = null;
  filters.selectedPlaylist = null;
  filters.selectedTag = tagName;
  filters.searchTerm = "";
  if (els.searchInput) els.searchInput.value = "";
  updateLibraryView();
}

function setSearchFilter(term) {
  filters.selectedAlbum = null;
  filters.selectedPlaylist = null;
  filters.selectedTag = null;
  filters.searchTerm = term.trim();
  updateLibraryView();
}

function clearAllFilters() {
  filters.selectedAlbum = null;
  filters.selectedPlaylist = null;
  filters.selectedTag = null;
  filters.searchTerm = "";
  if (els.searchInput) els.searchInput.value = "";
  updateLibraryView();
}

function getFilteredTracks() {
  let result = [...tracks];

  if (filters.selectedAlbum) {
    result = result.filter(track => track.album === filters.selectedAlbum);
  }

  if (filters.selectedPlaylist) {
    result = result.filter(track => track.playlists.includes(filters.selectedPlaylist));
  }

  if (filters.selectedTag) {
    result = result.filter(track => track.tags.includes(filters.selectedTag));
  }

  if (filters.searchTerm) {
    const q = filters.searchTerm.toLowerCase();

    result = result.filter(track => {
      const haystack = [
        track.title,
        track.artist,
        track.album,
        track.genre,
        track.lyrics,
        ...track.tags,
        ...track.playlists,
        ...track.scripture_references
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }

  return result;
}

/* =========================
   DERIVED DATA
========================= */

function getVisibleAlbums(trackList) {
  const map = new Map();

  trackList.forEach(track => {
    const albumName = track.album || "Singles";

    if (!map.has(albumName)) {
      map.set(albumName, {
        name: albumName,
        cover: track.cover || "",
        artist: track.artist || "Allen Parvin",
        year: track.year || "",
        tracks: [],
        album_zip: track.album_zip || ""
      });
    }

    const album = map.get(albumName);
    album.tracks.push(track);

    if (!album.cover && track.cover) album.cover = track.cover;
    if (!album.album_zip && track.album_zip) album.album_zip = track.album_zip;
  });

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function getVisiblePlaylists(trackList) {
  const map = new Map();

  trackList.forEach(track => {
    track.playlists.forEach(playlist => {
      map.set(playlist, (map.get(playlist) || 0) + 1);
    });
  });

  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getVisibleTags(trackList) {
  const map = new Map();

  trackList.forEach(track => {
    track.tags.forEach(tag => {
      map.set(tag, (map.get(tag) || 0) + 1);
    });
  });

  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getFeaturedAlbum() {
  const albums = getVisibleAlbums(filteredTracks);
  return albums[0] || null;
}

function getCurrentTrack() {
  if (currentQueueIndex >= 0 && currentQueueIndex < currentQueue.length) {
    return currentQueue[currentQueueIndex];
  }

  if (currentTrackIndex >= 0 && currentTrackIndex < filteredTracks.length) {
    return filteredTracks[currentTrackIndex];
  }

  return null;
}

/* =========================
   MASTER RENDER
========================= */

function updateLibraryView() {
  filteredTracks = getFilteredTracks();
  renderActiveFilterLabel();
  renderPlaylists(filteredTracks);
  renderTags(filteredTracks);
  renderAlbums(filteredTracks);
  renderFeaturedAlbum();
  renderFeaturedTrackList();
  syncCurrentTrackIndex();
}

function renderActiveFilterLabel() {
  if (!els.activeFilterLabel) return;

  let text = "Showing all music";

  if (filters.selectedAlbum) {
    text = `Showing album: ${filters.selectedAlbum}`;
  } else if (filters.selectedPlaylist) {
    text = `Showing playlist: ${filters.selectedPlaylist}`;
  } else if (filters.selectedTag) {
    text = `Showing tag: ${filters.selectedTag}`;
  } else if (filters.searchTerm) {
    text = `Search results for: ${filters.searchTerm}`;
  }

  els.activeFilterLabel.textContent = text;

  if (els.clearFiltersBtn) {
    els.clearFiltersBtn.style.display = hasActiveFilter() ? "inline-flex" : "none";
  }
}

/* =========================
   PLAYLISTS + TAGS
========================= */

function renderPlaylists(trackList) {
  if (!els.playlistList) return;

  const playlists = getVisiblePlaylists(trackList);

  if (!playlists.length) {
    els.playlistList.innerHTML = `<p class="empty-message">No playlists found.</p>`;
    return;
  }

  els.playlistList.innerHTML = playlists
    .map(playlist => {
      const active = filters.selectedPlaylist === playlist.name ? "active" : "";
      return `
        <button class="filter-chip ${active}" data-playlist="${escapeHtmlAttr(playlist.name)}" type="button">
          ${escapeHtml(playlist.name)} <span class="chip-count">(${playlist.count})</span>
        </button>
      `;
    })
    .join("");

  els.playlistList.querySelectorAll("[data-playlist]").forEach(btn => {
    btn.addEventListener("click", () => setPlaylistFilter(btn.dataset.playlist));
  });
}

function renderTags(trackList) {
  if (!els.tagList) return;

  const tags = getVisibleTags(trackList);

  if (!tags.length) {
    els.tagList.innerHTML = `<p class="empty-message">No tags found.</p>`;
    return;
  }

  els.tagList.innerHTML = tags
    .map(tag => {
      const active = filters.selectedTag === tag.name ? "active" : "";
      return `
        <button class="filter-chip ${active}" data-tag="${escapeHtmlAttr(tag.name)}" type="button">
          #${escapeHtml(tag.name)} <span class="chip-count">(${tag.count})</span>
        </button>
      `;
    })
    .join("");

  els.tagList.querySelectorAll("[data-tag]").forEach(btn => {
    btn.addEventListener("click", () => setTagFilter(btn.dataset.tag));
  });
}

/* =========================
   ALBUMS
========================= */

function renderAlbums(trackList) {
  if (!els.albumGrid) return;

  const albums = getVisibleAlbums(trackList);

  if (!albums.length) {
    els.albumGrid.innerHTML = `<p class="empty-message">No albums found.</p>`;
    return;
  }

  els.albumGrid.innerHTML = albums
    .map(album => {
      const isActive = filters.selectedAlbum === album.name ? "active" : "";
      return `
        <button class="album-card ${isActive}" data-album="${escapeHtmlAttr(album.name)}" type="button">
          <div class="album-card-cover-wrap">
            ${
              album.cover
                ? `<img class="album-card-cover" src="${escapeHtmlAttr(album.cover)}" alt="${escapeHtmlAttr(album.name)} cover" />`
                : `<div class="album-card-cover album-card-placeholder">No Cover</div>`
            }
          </div>
          <div class="album-card-meta">
            <h3>${escapeHtml(album.name)}</h3>
            <p>${album.tracks.length} song${album.tracks.length === 1 ? "" : "s"}</p>
          </div>
        </button>
      `;
    })
    .join("");

  els.albumGrid.querySelectorAll("[data-album]").forEach(btn => {
    btn.addEventListener("click", () => setAlbumFilter(btn.dataset.album));
  });
}

function renderFeaturedAlbum() {
  const album = getFeaturedAlbum();

  if (!album) {
    if (els.featuredAlbumTitle) els.featuredAlbumTitle.textContent = "No album found";
    if (els.featuredAlbumArtist) els.featuredAlbumArtist.textContent = "—";
    if (els.featuredAlbumCount) els.featuredAlbumCount.textContent = "0 songs";
    if (els.featuredAlbumCover) els.featuredAlbumCover.src = "";
    if (els.downloadAlbumBtn) els.downloadAlbumBtn.style.display = "none";
    return;
  }

  if (els.featuredAlbumCover) {
    els.featuredAlbumCover.src = album.cover || "";
    els.featuredAlbumCover.alt = `${album.name} cover`;
  }

  if (els.featuredAlbumTitle) els.featuredAlbumTitle.textContent = album.name;
  if (els.featuredAlbumArtist) els.featuredAlbumArtist.textContent = album.artist || "Allen Parvin";
  if (els.featuredAlbumCount) {
    els.featuredAlbumCount.textContent = `${album.tracks.length} song${album.tracks.length === 1 ? "" : "s"}`;
  }

  if (els.downloadAlbumBtn) {
    els.downloadAlbumBtn.style.display = album.album_zip ? "inline-flex" : "none";
  }
}

function renderFeaturedTrackList() {
  if (!els.featuredTrackList || !els.featuredTrackListTitle) return;

  const album = getFeaturedAlbum();

  if (!album) {
    els.featuredTrackListTitle.textContent = "Album Tracks";
    els.featuredTrackList.innerHTML = `<p class="empty-message">No tracks available.</p>`;
    return;
  }

  els.featuredTrackListTitle.textContent = `${album.name} Tracks`;

  els.featuredTrackList.innerHTML = album.tracks
    .map((track, index) => {
      const isPlaying = getCurrentTrack()?.id === track.id ? "playing" : "";
      const isFav = isFavorite(track) ? "favorited" : "";

      return `
        <div class="featured-track-row ${isPlaying}" data-track-id="${escapeHtmlAttr(track.id)}">
          <button class="featured-track-play" data-featured-index="${index}" type="button">
            ▶
          </button>

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
            <button class="mini-action-btn ${isFav}" data-favorite-track="${escapeHtmlAttr(track.id)}" type="button">
              ${isFavorite(track) ? "★" : "☆"}
            </button>
            <button class="mini-action-btn" data-lyrics-track="${escapeHtmlAttr(track.id)}" type="button">
              Lyrics
            </button>
            <button class="mini-action-btn" data-download-track="${escapeHtmlAttr(track.id)}" type="button">
              Download
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  els.featuredTrackList.querySelectorAll("[data-featured-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.featuredIndex);
      setQueue(album.tracks, false);
      playFromQueueIndex(idx);
    });
  });

  els.featuredTrackList.querySelectorAll("[data-favorite-track]").forEach(btn => {
    btn.addEventListener("click", () => {
      const track = album.tracks.find(t => t.id === btn.dataset.favoriteTrack);
      if (!track) return;
      toggleFavorite(track);
      renderFeaturedTrackList();
    });
  });

  els.featuredTrackList.querySelectorAll("[data-lyrics-track]").forEach(btn => {
    btn.addEventListener("click", () => {
      const track = album.tracks.find(t => t.id === btn.dataset.lyricsTrack);
      if (!track) return;
      openLyricsModalForTrack(track);
    });
  });

  els.featuredTrackList.querySelectorAll("[data-download-track]").forEach(btn => {
    btn.addEventListener("click", () => {
      const track = album.tracks.find(t => t.id === btn.dataset.downloadTrack);
      if (!track || !track.src) return;
      triggerDownload(track.src, `${safeFileName(track.title)}.mp3`);
    });
  });
}

/* =========================
   QUEUE + PLAYBACK
========================= */

function setQueue(trackList, shuffle = false) {
  currentQueue = shuffle ? shuffleArray([...trackList]) : [...trackList];
  currentQueueIndex = currentQueue.length ? 0 : -1;
  renderQueue();
}

function playTrack(track) {
  if (!track || !track.src || !els.audioPlayer) return;

  const queueIndex = currentQueue.findIndex(t => t.id === track.id);
  if (queueIndex >= 0) {
    currentQueueIndex = queueIndex;
  }

  currentTrackIndex = filteredTracks.findIndex(t => t.id === track.id);

  els.audioPlayer.src = track.src;
  els.audioPlayer.play().catch(err => console.error("Playback failed:", err));

  updateNowPlaying(track);
  updateLyricsPanel(track);
  updateScripturePanel(track);
  addToRecentlyPlayed(track);
  saveResume(track);
  renderQueue();
  renderFavorites();
  renderFeaturedTrackList();
}

function playFromQueueIndex(index) {
  if (index < 0 || index >= currentQueue.length) return;
  currentQueueIndex = index;
  playTrack(currentQueue[index]);
}

function playPreviousTrack() {
  if (!currentQueue.length) {
    if (!filteredTracks.length) return;
    setQueue(filteredTracks, false);
  }

  if (!currentQueue.length) return;

  currentQueueIndex = currentQueueIndex <= 0 ? currentQueue.length - 1 : currentQueueIndex - 1;
  playTrack(currentQueue[currentQueueIndex]);
}

function playNextTrack() {
  if (!currentQueue.length) {
    if (!filteredTracks.length) return;
    setQueue(filteredTracks, false);
  }

  if (!currentQueue.length) return;

  currentQueueIndex = currentQueueIndex >= currentQueue.length - 1 ? 0 : currentQueueIndex + 1;
  playTrack(currentQueue[currentQueueIndex]);
}

function togglePlayPause() {
  if (!els.audioPlayer) return;

  if (!els.audioPlayer.src) {
    const first = currentQueue[0] || filteredTracks[0] || tracks[0];
    if (first) {
      if (!currentQueue.length) {
        setQueue(filteredTracks.length ? filteredTracks : tracks, false);
      }
      playTrack(first);
    }
    return;
  }

  if (els.audioPlayer.paused) {
    els.audioPlayer.play().catch(err => console.error("Playback failed:", err));
  } else {
    els.audioPlayer.pause();
  }
}

function updateNowPlaying(track) {
  if (els.nowCover) {
    els.nowCover.src = track.cover || "";
    els.nowCover.alt = `${track.title} cover`;
  }

  if (els.nowTitle) els.nowTitle.textContent = track.title || "Untitled";
  if (els.nowArtist) els.nowArtist.textContent = track.artist || "Allen Parvin";
  if (els.nowAlbum) els.nowAlbum.textContent = track.album || "Singles";
  if (els.nowScripture) {
    els.nowScripture.textContent = track.scripture_references.length
      ? track.scripture_references.join(" • ")
      : "—";
  }

  updateFavoriteButton();
  updatePlayButton();
}

function updatePlayButton() {
  if (!els.playBtn || !els.audioPlayer) return;
  els.playBtn.textContent = els.audioPlayer.paused ? "▶" : "❚❚";
}

function updateProgressUI() {
  if (!els.audioPlayer) return;

  const current = els.audioPlayer.currentTime || 0;
  const duration = isFinite(els.audioPlayer.duration) ? els.audioPlayer.duration : 0;

  if (els.currentTime) els.currentTime.textContent = formatTime(current);
  if (els.duration) els.duration.textContent = formatTime(duration);

  if (els.seekBar) {
    els.seekBar.value = duration ? String((current / duration) * 100) : "0";
  }
}

function syncCurrentTrackIndex() {
  const current = getCurrentTrack();
  if (!current) return;

  const found = filteredTracks.findIndex(track => track.id === current.id);
  currentTrackIndex = found;
}

/* =========================
   LYRICS + SCRIPTURE
========================= */

function updateLyricsPanel(track) {
  if (!els.lyricsContent) return;

  if (!track || !track.lyrics) {
    els.lyricsContent.innerHTML = `<p class="empty-message">Select a song to view lyrics.</p>`;
    return;
  }

  els.lyricsContent.innerHTML = `
    <div class="lyrics-block">
      ${nl2br(escapeHtml(track.lyrics))}
    </div>
  `;
}

function updateScripturePanel(track) {
  if (!els.scriptureContent) return;

  if (!track || !track.scripture_references.length) {
    els.scriptureContent.innerHTML = `<p class="empty-message">No scripture reference available for this song.</p>`;
    return;
  }

  els.scriptureContent.innerHTML = `
    <div class="scripture-block">
      ${track.scripture_references.map(ref => `<p>${escapeHtml(ref)}</p>`).join("")}
    </div>
  `;
}

function openLyricsModal() {
  const track = getCurrentTrack();
  if (!track) return;
  openLyricsModalForTrack(track);
}

function openLyricsModalForTrack(track) {
  if (!track || !els.lyricsModal || !els.lyricsModalBody || !els.lyricsModalTitle) return;

  els.lyricsModalTitle.textContent = `Lyrics — ${track.title}`;
  els.lyricsModalBody.innerHTML = track.lyrics
    ? `<div class="lyrics-block">${nl2br(escapeHtml(track.lyrics))}</div>`
    : `<p class="empty-message">No lyrics available.</p>`;

  els.lyricsModal.classList.remove("hidden");
}

function closeLyricsModal() {
  if (els.lyricsModal) {
    els.lyricsModal.classList.add("hidden");
  }
}

/* =========================
   ALBUM MODAL
========================= */

function openAlbumModal(album) {
  if (!album || !els.albumModal) return;

  els.albumModal.dataset.albumName = album.name;

  if (els.albumModalTitle) els.albumModalTitle.textContent = album.name;
  if (els.albumModalCover) {
    els.albumModalCover.src = album.cover || "";
    els.albumModalCover.alt = `${album.name} cover`;
  }
  if (els.albumModalArtist) els.albumModalArtist.textContent = album.artist || "Allen Parvin";
  if (els.albumModalInfo) {
    els.albumModalInfo.textContent = `${album.tracks.length} song${album.tracks.length === 1 ? "" : "s"}`;
  }

  if (els.albumModalDownloadBtn) {
    els.albumModalDownloadBtn.style.display = album.album_zip ? "inline-flex" : "none";
  }

  if (els.albumModalTracks) {
    els.albumModalTracks.innerHTML = album.tracks
      .map((track, index) => {
        return `
          <button class="album-track-row" data-album-track-index="${index}" type="button">
            <span>${index + 1}. ${escapeHtml(track.title)}</span>
            <span>${escapeHtml(track.duration || "")}</span>
          </button>
        `;
      })
      .join("");

    els.albumModalTracks.querySelectorAll("[data-album-track-index]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.albumTrackIndex);
        setQueue(album.tracks, false);
        playFromQueueIndex(idx);
      });
    });
  }

  els.albumModal.classList.remove("hidden");
}

function closeAlbumModal() {
  if (els.albumModal) {
    els.albumModal.classList.add("hidden");
    delete els.albumModal.dataset.albumName;
  }
}

function getAlbumModalAlbum() {
  const name = els.albumModal?.dataset?.albumName;
  if (!name) return null;

  return getVisibleAlbums(filteredTracks).find(album => album.name === name)
    || getVisibleAlbums(tracks).find(album => album.name === name)
    || null;
}

/* =========================
   FAVORITES + RECENT
========================= */

function isFavorite(track) {
  return favorites.includes(track.id);
}

function toggleCurrentFavorite() {
  const track = getCurrentTrack();
  if (!track) return;
  toggleFavorite(track);
  renderFeaturedTrackList();
}

function toggleFavorite(track) {
  if (isFavorite(track)) {
    favorites = favorites.filter(id => id !== track.id);
  } else {
    favorites.unshift(track.id);
  }

  saveFavorites();
  updateFavoriteButton();
  renderFavorites();
}

function updateFavoriteButton() {
  const track = getCurrentTrack();
  if (!els.favoriteSongBtn) return;

  if (!track) {
    els.favoriteSongBtn.textContent = "☆ Favorite";
    return;
  }

  els.favoriteSongBtn.textContent = isFavorite(track) ? "★ Favorited" : "☆ Favorite";
}

function renderFavorites() {
  if (!els.favoritesList) return;

  const favTracks = favorites
    .map(id => tracks.find(track => track.id === id))
    .filter(Boolean)
    .slice(0, 12);

  if (!favTracks.length) {
    els.favoritesList.innerHTML = `<p class="empty-message">No favorites yet.</p>`;
    return;
  }

  els.favoritesList.innerHTML = favTracks.map((track, index) => renderMiniCard(track, index)).join("");
  bindMiniCardClicks(els.favoritesList, favTracks);
}

function addToRecentlyPlayed(track) {
  recentlyPlayed = [track.id, ...recentlyPlayed.filter(id => id !== track.id)].slice(0, 20);
  saveRecentlyPlayed();
  renderRecentlyPlayed();
}

function renderRecentlyPlayed() {
  if (!els.recentlyPlayedList) return;

  const recentTracks = recentlyPlayed
    .map(id => tracks.find(track => track.id === id))
    .filter(Boolean)
    .slice(0, 12);

  if (!recentTracks.length) {
    els.recentlyPlayedList.innerHTML = `<p class="empty-message">No recent songs yet.</p>`;
    return;
  }

  els.recentlyPlayedList.innerHTML = recentTracks.map((track, index) => renderMiniCard(track, index)).join("");
  bindMiniCardClicks(els.recentlyPlayedList, recentTracks);
}

function renderMiniCard(track, index) {
  return `
    <button class="mini-card" data-mini-index="${index}" type="button">
      ${
        track.cover
          ? `<img src="${escapeHtmlAttr(track.cover)}" alt="${escapeHtmlAttr(track.title)} cover" class="mini-card-cover" />`
          : `<div class="mini-card-cover mini-card-placeholder">No Cover</div>`
      }
      <div class="mini-card-meta">
        <strong>${escapeHtml(track.title)}</strong>
        <span>${escapeHtml(track.album)}</span>
      </div>
    </button>
  `;
}

function bindMiniCardClicks(container, trackList) {
  container.querySelectorAll("[data-mini-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.miniIndex);
      const track = trackList[index];
      if (!track) return;
      setQueue([track], false);
      playFromQueueIndex(0);
    });
  });
}

/* =========================
   QUEUE UI
========================= */

function renderQueue() {
  if (els.queueCount) {
    els.queueCount.textContent = `${currentQueue.length} song${currentQueue.length === 1 ? "" : "s"}`;
  }

  if (!els.queueList) return;

  if (!currentQueue.length) {
    els.queueList.innerHTML = `<p class="empty-message">Queue is empty.</p>`;
    return;
  }

  els.queueList.innerHTML = currentQueue
    .map((track, index) => {
      const active = index === currentQueueIndex ? "active" : "";
      return `
        <button class="queue-row ${active}" data-queue-index="${index}" type="button">
          <span>${escapeHtml(track.title)}</span>
          <span>${escapeHtml(track.album)}</span>
        </button>
      `;
    })
    .join("");

  els.queueList.querySelectorAll("[data-queue-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      playFromQueueIndex(Number(btn.dataset.queueIndex));
    });
  });
}

/* =========================
   RESUME
========================= */

function showResumeBannerIfAvailable() {
  if (!resumeTrackSrc || !els.resumeBanner || !els.resumeText) return;

  const track = tracks.find(t => t.src === resumeTrackSrc);
  if (!track) return;

  els.resumeText.textContent = `${track.title} • ${track.artist} • ${track.album}`;
  els.resumeBanner.classList.remove("hidden");
}

function hideResumeBanner() {
  if (els.resumeBanner) {
    els.resumeBanner.classList.add("hidden");
  }
}

function resumeSavedTrack() {
  if (!resumeTrackSrc) return;
  const track = tracks.find(t => t.src === resumeTrackSrc);
  if (!track) return;

  setQueue([track], false);
  playFromQueueIndex(0);
  hideResumeBanner();
}

/* =========================
   SONG ACTIONS
========================= */

function copyCurrentLyrics() {
  const track = getCurrentTrack();
  if (!track || !track.lyrics) return;

  navigator.clipboard.writeText(track.lyrics).then(() => {
    flashButtonText(els.copyLyricsBtn, "Copied!");
  }).catch(err => {
    console.error("Copy failed:", err);
  });
}

function shareCurrentSong() {
  const track = getCurrentTrack();
  if (!track) return;

  const url = new URL(window.location.href);
  url.searchParams.set("song", track.title);

  if (navigator.share) {
    navigator.share({
      title: track.title,
      text: `${track.title} — ${track.artist}`,
      url: url.toString()
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url.toString()).then(() => {
      flashButtonText(els.shareSongBtn, "Link Copied!");
    }).catch(err => {
      console.error("Share fallback failed:", err);
    });
  }
}

function downloadCurrentSong() {
  const track = getCurrentTrack();
  if (!track || !track.src) return;
  triggerDownload(track.src, `${safeFileName(track.title)}.mp3`);
}

function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* =========================
   HELPERS
========================= */

function hasActiveFilter() {
  return Boolean(
    filters.selectedAlbum ||
    filters.selectedPlaylist ||
    filters.selectedTag ||
    filters.searchTerm
  );
}

function renderEmptyLibraryState(message) {
  if (els.albumGrid) els.albumGrid.innerHTML = `<p class="empty-message">${escapeHtml(message)}</p>`;
  if (els.playlistList) els.playlistList.innerHTML = `<p class="empty-message">${escapeHtml(message)}</p>`;
  if (els.tagList) els.tagList.innerHTML = `<p class="empty-message">${escapeHtml(message)}</p>`;
  if (els.featuredTrackList) els.featuredTrackList.innerHTML = `<p class="empty-message">${escapeHtml(message)}</p>`;
}

function formatTime(seconds) {
  if (!isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function nl2br(text) {
  return text.replace(/\n/g, "<br>");
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function flashButtonText(button, text) {
  if (!button) return;
  const original = button.textContent;
  button.textContent = text;
  setTimeout(() => {
    button.textContent = original;
  }, 1400);
}

function safeFileName(str = "download") {
  return String(str).replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim() || "download";
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeHtmlAttr(str = "") {
  return escapeHtml(str);
}