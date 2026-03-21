let tracks = [];
let filteredTracks = [];
let currentTrackIndex = -1;
let currentQueue = [];
let currentQueueIndex = -1;
let favorites = [];
let recentlyPlayed = [];
let resumeTrackSrc = null;
let lastFocusedElement = null;
let customPlaylists = {};
let downloadedTracks = [];
let playlistPickerTrackId = null;
let playerSheetTab = "lyrics";
let queueDragIndex = null;
let toastTimer = null;
let playerSheetSwipeStartY = null;
let activeQueueTouchDrag = null;

const STORAGE_KEYS = {
  favorites: "aineo_favorites",
  recentlyPlayed: "aineo_recently_played",
  resume: "aineo_resume",
  customPlaylists: "aineo_custom_playlists",
  downloadedTracks: "aineo_downloaded_tracks",
  lastQueue: "aineo_last_queue"
};

const filters = {
  selectedAlbum: null,
  selectedPlaylist: null,
  selectedTag: null,
  searchTerm: "",
  selectedScripture: null
};

const els = {
  mobileNavToggle: document.getElementById("mobileNavToggle"),
  siteNavLinks: document.getElementById("siteNavLinks"),

  searchInput: document.getElementById("searchInput"),
  playlistList: document.getElementById("playlistList"),
  tagList: document.getElementById("tagList"),
  scriptureBrowserList: document.getElementById("scriptureBrowserList"),
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
  copyLyricsBtnDesktop: document.getElementById("copyLyricsBtnDesktop"),
  shareSongBtn: document.getElementById("shareSongBtn"),
  shareSongBtnDesktop: document.getElementById("shareSongBtnDesktop"),
  favoriteSongBtn: document.getElementById("favoriteSongBtn"),
  downloadSongBtn: document.getElementById("downloadSongBtn"),
  downloadSongBtnDesktop: document.getElementById("downloadSongBtnDesktop"),
  playQueueBtn: document.getElementById("playQueueBtn"),
  playQueueBtnDesktop: document.getElementById("playQueueBtnDesktop"),
  shuffleQueueBtn: document.getElementById("shuffleQueueBtn"),
  shuffleQueueBtnDesktop: document.getElementById("shuffleQueueBtnDesktop"),
  moreActionsBtn: document.getElementById("moreActionsBtn"),
  mobileActionsDrawer: document.getElementById("mobileActionsDrawer"),

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
  albumModalOpenPageBtn: document.getElementById("albumModalOpenPageBtn"),
  closeAlbumBtn: document.getElementById("closeAlbumBtn"),

  resumeBanner: document.getElementById("resumeBanner"),
  resumeText: document.getElementById("resumeText"),
  resumeSongBtn: document.getElementById("resumeSongBtn"),
  dismissResumeBtn: document.getElementById("dismissResumeBtn"),

  stickyFilterBar: document.getElementById("stickyFilterBar"),
  filterTypeBadge: document.getElementById("filterTypeBadge"),

  queueSectionBody: document.getElementById("queueSectionBody"),

  createPlaylistBtn: document.getElementById("createPlaylistBtn"),
  myPlaylistList: document.getElementById("myPlaylistList"),
  downloadedList: document.getElementById("downloadedList"),

  addToPlaylistBtn: document.getElementById("addToPlaylistBtn"),
  saveOfflineBtn: document.getElementById("saveOfflineBtn"),
  openPlayerSheetBtn: document.getElementById("openPlayerSheetBtn"),

  playlistModal: document.getElementById("playlistModal"),
  playlistModalBackdrop: document.getElementById("playlistModalBackdrop"),
  closePlaylistModalBtn: document.getElementById("closePlaylistModalBtn"),
  playlistSelect: document.getElementById("playlistSelect"),
  newPlaylistName: document.getElementById("newPlaylistName"),
  saveToPlaylistBtn: document.getElementById("saveToPlaylistBtn"),

  playerSheet: document.getElementById("playerSheet"),
  playerSheetContent: document.querySelector(".player-sheet-content"),
  playerSheetBackdrop: document.getElementById("playerSheetBackdrop"),
  closePlayerSheetBtn: document.getElementById("closePlayerSheetBtn"),
  playerSheetCover: document.getElementById("playerSheetCover"),
  playerSheetTrackTitle: document.getElementById("playerSheetTrackTitle"),
  playerSheetTrackArtist: document.getElementById("playerSheetTrackArtist"),
  playerSheetTrackAlbum: document.getElementById("playerSheetTrackAlbum"),
  playerSheetTrackScripture: document.getElementById("playerSheetTrackScripture"),
  playerSheetCurrentTime: document.getElementById("playerSheetCurrentTime"),
  playerSheetSeekBar: document.getElementById("playerSheetSeekBar"),
  playerSheetDuration: document.getElementById("playerSheetDuration"),
  playerSheetPrevBtn: document.getElementById("playerSheetPrevBtn"),
  playerSheetPlayBtn: document.getElementById("playerSheetPlayBtn"),
  playerSheetNextBtn: document.getElementById("playerSheetNextBtn"),
  playerSheetLyricsBtn: document.getElementById("playerSheetLyricsBtn"),
  playerSheetAddToPlaylistBtn: document.getElementById("playerSheetAddToPlaylistBtn"),
  playerSheetSaveOfflineBtn: document.getElementById("playerSheetSaveOfflineBtn"),
  playerSheetShareBtn: document.getElementById("playerSheetShareBtn"),
  playerSheetFavoriteBtn: document.getElementById("playerSheetFavoriteBtn"),
  playerSheetLyricsPanel: document.getElementById("playerSheetLyricsPanel"),
  playerSheetScripturePanel: document.getElementById("playerSheetScripturePanel"),
  playerSheetQueuePanel: document.getElementById("playerSheetQueuePanel")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  loadStoredData();
  bindUI();
  initCollapsibles();
  initMobilePlayerDrawer();
  initMobileNav();
  await loadTracks();
  restoreSavedQueue();
  updateLibraryView();
  renderFavorites();
  renderRecentlyPlayed();
  renderMyPlaylists();
  renderDownloadedSongs();
  renderQueue();
  showResumeBannerIfAvailable();
  updatePlayerSheet();
  handleInitialQueryParams();
  handleSongQueryParam();
}

/* =========================
   LOAD + NORMALIZE
========================= */

async function loadTracks() {
  try {
    const res = await fetch(`tracks.json?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    tracks = Array.isArray(data)
      ? data.map((track, index) => normalizeTrack(track, index))
      : [];
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
  favorites = loadJsonFromStorage(STORAGE_KEYS.favorites, []);
  recentlyPlayed = loadJsonFromStorage(STORAGE_KEYS.recentlyPlayed, []);
  customPlaylists = loadJsonFromStorage(STORAGE_KEYS.customPlaylists, {});
  downloadedTracks = loadJsonFromStorage(STORAGE_KEYS.downloadedTracks, []);

  const resume = loadJsonFromStorage(STORAGE_KEYS.resume, null);
  resumeTrackSrc = resume?.src || null;
}

function loadJsonFromStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function saveFavorites() {
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
}

function saveRecentlyPlayed() {
  localStorage.setItem(STORAGE_KEYS.recentlyPlayed, JSON.stringify(recentlyPlayed));
}

function saveCustomPlaylists() {
  localStorage.setItem(STORAGE_KEYS.customPlaylists, JSON.stringify(customPlaylists));
}

function saveDownloadedTracks() {
  localStorage.setItem(STORAGE_KEYS.downloadedTracks, JSON.stringify(downloadedTracks));
}

function saveQueueState() {
  localStorage.setItem(
    STORAGE_KEYS.lastQueue,
    JSON.stringify({
      trackIds: currentQueue.map(track => track.id),
      index: currentQueueIndex
    })
  );
}

function restoreSavedQueue() {
  const savedQueue = loadJsonFromStorage(STORAGE_KEYS.lastQueue, null);
  if (!savedQueue?.trackIds?.length) return;

  const queueTracks = savedQueue.trackIds
    .map(id => tracks.find(track => track.id === id))
    .filter(Boolean);

  if (!queueTracks.length) return;

  currentQueue = queueTracks;
  currentQueueIndex = Math.max(0, Math.min(savedQueue.index || 0, currentQueue.length - 1));
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
  on(els.searchInput, "input", e => setSearchFilter(e.target.value));
  on(els.clearFiltersBtn, "click", clearAllFilters);

  on(els.playBtn, "click", togglePlayPause);
  on(els.prevBtn, "click", playPreviousTrack);
  on(els.nextBtn, "click", playNextTrack);

  on(els.seekBar, "input", () => {
    if (!els.audioPlayer || !isFinite(els.audioPlayer.duration)) return;
    const percent = Number(els.seekBar.value) / 100;
    els.audioPlayer.currentTime = percent * els.audioPlayer.duration;
  });

  if (els.audioPlayer) {
    els.audioPlayer.addEventListener("timeupdate", updateProgressUI);
    els.audioPlayer.addEventListener("loadedmetadata", updateProgressUI);
    els.audioPlayer.addEventListener("play", updatePlayButton);
    els.audioPlayer.addEventListener("pause", updatePlayButton);
    els.audioPlayer.addEventListener("ended", handleTrackEnded);
  }

  on(els.openLyricsBtn, "click", () => openLyricsModal(els.openLyricsBtn));
  on(els.copyLyricsBtn, "click", copyCurrentLyrics);
  on(els.copyLyricsBtnDesktop, "click", copyCurrentLyrics);
  on(els.shareSongBtn, "click", shareCurrentSong);
  on(els.shareSongBtnDesktop, "click", shareCurrentSong);
  on(els.favoriteSongBtn, "click", toggleCurrentFavorite);
  on(els.downloadSongBtn, "click", downloadCurrentSong);
  on(els.downloadSongBtnDesktop, "click", downloadCurrentSong);

  on(els.playQueueBtn, "click", () => {
    startPlaybackFromList(filteredTracks, false);
    openAndScrollQueueToCurrentTrack();
    closeMobilePlayerDrawer();
  });

  on(els.playQueueBtnDesktop, "click", () => {
    startPlaybackFromList(filteredTracks, false);
    openAndScrollQueueToCurrentTrack();
  });

  on(els.shuffleQueueBtn, "click", () => {
    startPlaybackFromList(filteredTracks, true);
    openAndScrollQueueToCurrentTrack();
    closeMobilePlayerDrawer();
  });

  on(els.shuffleQueueBtnDesktop, "click", () => {
    startPlaybackFromList(filteredTracks, true);
    openAndScrollQueueToCurrentTrack();
  });

  on(els.playAlbumBtn, "click", () => {
    const album = getFeaturedAlbum();
    if (!album) return;
    startPlaybackFromList(album.tracks, false);
  });

  on(els.shuffleAlbumBtn, "click", () => {
    const album = getFeaturedAlbum();
    if (!album) return;
    startPlaybackFromList(album.tracks, true);
  });

  on(els.downloadAlbumBtn, "click", () => {
    const album = getFeaturedAlbum();
    if (!album?.album_zip) return;
    triggerDownload(album.album_zip, `${safeFileName(album.name)}.zip`);
  });

  on(els.openAlbumBtn, "click", () => {
    const album = getFeaturedAlbum();
    if (!album) return;
    openAlbumPage(album.name);
  });

  on(els.closeLyricsBtn, "click", closeLyricsModal);
  on(els.lyricsModalBackdrop, "click", closeLyricsModal);

  on(els.closeAlbumBtn, "click", closeAlbumModal);
  on(els.albumModalBackdrop, "click", closeAlbumModal);

  on(els.albumModalPlayBtn, "click", () => {
    const album = getAlbumModalAlbum();
    if (!album) return;
    startPlaybackFromList(album.tracks, false);
    scrollAlbumModalToCurrentTrack();
  });

  on(els.albumModalShuffleBtn, "click", () => {
    const album = getAlbumModalAlbum();
    if (!album) return;
    startPlaybackFromList(album.tracks, true);
    scrollAlbumModalToCurrentTrack();
  });

  on(els.albumModalDownloadBtn, "click", () => {
    const album = getAlbumModalAlbum();
    if (!album?.album_zip) return;
    triggerDownload(album.album_zip, `${safeFileName(album.name)}.zip`);
  });

  on(els.albumModalOpenPageBtn, "click", () => {
    const album = getAlbumModalAlbum();
    if (!album) return;
    openAlbumPage(album.name);
  });

  on(els.resumeSongBtn, "click", resumeSavedTrack);
  on(els.dismissResumeBtn, "click", hideResumeBanner);

  on(els.createPlaylistBtn, "click", createNewPlaylist);
  on(els.addToPlaylistBtn, "click", () => {
    const track = getCurrentTrack();
    if (track) openPlaylistModalForTrack(track, els.addToPlaylistBtn);
  });
  on(els.saveOfflineBtn, "click", () => {
    const track = getCurrentTrack();
    if (track) saveTrackOffline(track);
  });
  on(els.openPlayerSheetBtn, "click", () => openPlayerSheet(els.openPlayerSheetBtn));
  on(els.closePlayerSheetBtn, "click", closePlayerSheet);
  on(els.playerSheetBackdrop, "click", closePlayerSheet);
  initPlayerSheetSwipeToClose();
  on(els.playerSheetPlayBtn, "click", togglePlayPause);
  on(els.playerSheetPrevBtn, "click", playPreviousTrack);
  on(els.playerSheetNextBtn, "click", playNextTrack);
  on(els.playerSheetLyricsBtn, "click", () => setPlayerSheetTab("lyrics"));
  on(els.playerSheetShareBtn, "click", shareCurrentSong);
  on(els.playerSheetFavoriteBtn, "click", toggleCurrentFavorite);
  on(els.playerSheetAddToPlaylistBtn, "click", () => {
    const track = getCurrentTrack();
    if (track) openPlaylistModalForTrack(track, els.playerSheetAddToPlaylistBtn);
  });
  on(els.playerSheetSaveOfflineBtn, "click", () => {
    const track = getCurrentTrack();
    if (track) saveTrackOffline(track);
  });
  on(els.playlistModalBackdrop, "click", closePlaylistModal);
  on(els.closePlaylistModalBtn, "click", closePlaylistModal);
  on(els.saveToPlaylistBtn, "click", saveTrackToPlaylistFromModal);

  if (els.playerSheetSeekBar) {
    els.playerSheetSeekBar.addEventListener("input", () => {
      if (!els.audioPlayer || !isFinite(els.audioPlayer.duration)) return;
      const percent = Number(els.playerSheetSeekBar.value) / 100;
      els.audioPlayer.currentTime = percent * els.audioPlayer.duration;
    });
  }

  document.querySelectorAll("[data-player-tab]").forEach(btn => {
    btn.addEventListener("click", () => setPlayerSheetTab(btn.dataset.playerTab));
  });

  document.querySelector(".sticky-player-left")?.addEventListener("click", e => {
    if (e.target.closest("button")) return;
    openPlayerSheet();
  });

  document.querySelector(".sticky-player-center")?.addEventListener("click", e => {
    if (e.target.closest("button") || e.target.closest("input")) return;
    openPlayerSheet();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeLyricsModal();
      closeAlbumModal();
      closePlaylistModal();
      closePlayerSheet();
      closeMobilePlayerDrawer();
      closeMobileNav();
    }
  });
}

function on(element, eventName, handler) {
  if (element) {
    element.addEventListener(eventName, handler);
  }
}

/* =========================
   FILTERS
========================= */

function setAlbumFilter(albumName) {
  filters.selectedAlbum = albumName;
  filters.selectedPlaylist = null;
  filters.selectedTag = null;
  filters.selectedScripture = null;
  filters.searchTerm = "";
  if (els.searchInput) els.searchInput.value = "";
  updateLibraryView();
  scrollToTop();
}

function setPlaylistFilter(playlistName) {
  filters.selectedAlbum = null;
  filters.selectedPlaylist = playlistName;
  filters.selectedTag = null;
  filters.selectedScripture = null;
  filters.searchTerm = "";
  if (els.searchInput) els.searchInput.value = "";
  updateLibraryView();
  scrollToTop();
}

function setTagFilter(tagName) {
  filters.selectedAlbum = null;
  filters.selectedPlaylist = null;
  filters.selectedTag = tagName;
  filters.selectedScripture = null;
  filters.searchTerm = "";
  if (els.searchInput) els.searchInput.value = "";
  updateLibraryView();
  scrollToTop();
}

function setSearchFilter(term) {
  filters.selectedAlbum = null;
  filters.selectedPlaylist = null;
  filters.selectedTag = null;
  filters.selectedScripture = null;
  filters.searchTerm = term.trim();
  updateLibraryView();
  scrollToTop();
}

function clearAllFilters() {
  filters.selectedAlbum = null;
  filters.selectedPlaylist = null;
  filters.selectedTag = null;
  filters.selectedScripture = null;
  filters.searchTerm = "";
  if (els.searchInput) els.searchInput.value = "";
  updateLibraryView();
  scrollToTop();
}

function setScriptureFilter(bookName) {
  filters.selectedAlbum = null;
  filters.selectedPlaylist = null;
  filters.selectedTag = null;
  filters.selectedScripture = bookName;
  filters.searchTerm = "";
  if (els.searchInput) els.searchInput.value = "";
  updateLibraryView();
  scrollToTop();
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

  if (filters.selectedScripture) {
    result = result.filter(track =>
      track.scripture_references.some(ref => getScriptureBook(ref) === filters.selectedScripture)
    );
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

function getScriptureBook(reference) {
  const text = String(reference || "").trim();
  if (!text) return "";
  const cleaned = text.replace(/[–-].*$/, "").trim();
  const match = cleaned.match(/^((?:[1-3]\s+)?[A-Za-z]+(?:\s+[A-Za-z]+)*?)(?=\s+\d|$)/);
  return match ? match[1].trim() : cleaned;
}

function getVisibleScriptureGroups(trackList) {
  const books = new Map();

  trackList.forEach(track => {
    track.scripture_references.forEach(ref => {
      const book = getScriptureBook(ref);
      if (!book) return;
      if (!books.has(book)) {
        books.set(book, {
          name: book,
          count: 0,
          testament: isNewTestamentBook(book) ? "New Testament" : "Old Testament"
        });
      }
      books.get(book).count += 1;
    });
  });

  const grouped = new Map();
  [...books.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(book => {
      if (!grouped.has(book.testament)) {
        grouped.set(book.testament, { name: book.testament, total: 0, books: [] });
      }
      const group = grouped.get(book.testament);
      group.books.push(book);
      group.total += book.count;
    });

  return ["Old Testament", "New Testament"]
    .filter(name => grouped.has(name))
    .map(name => grouped.get(name));
}

function isNewTestamentBook(book) {
  return new Set([
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
    "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
    "1 John", "2 John", "3 John", "Jude", "Revelation"
  ]).has(book);
}

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
  const visibleAlbums = getVisibleAlbums(filteredTracks);

  if (filters.selectedAlbum) {
    return visibleAlbums.find(album => album.name === filters.selectedAlbum) || null;
  }

  return visibleAlbums.find(album => album.name === "Testimony") || visibleAlbums[0] || null;
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
  renderScriptureBrowser(filteredTracks);
  renderAlbums(filteredTracks);
  renderFeaturedAlbum();
  renderFeaturedTrackList();
  syncCurrentTrackIndex();
}

/* =========================
   STICKY FILTER BAR
========================= */

function renderActiveFilterLabel() {
  if (!els.activeFilterLabel) return;

  const active = hasActiveFilter();

  let text = "Showing all music";
  let buttonText = "Show All Music";
  let badgeText = "";
  let badgeClass = "";

  if (filters.selectedAlbum) {
    text = `Album: ${filters.selectedAlbum}`;
    buttonText = "Clear Album";
    badgeText = "Album";
    badgeClass = "album";
  } else if (filters.selectedPlaylist) {
    text = `Playlist: ${filters.selectedPlaylist}`;
    buttonText = "Clear Playlist";
    badgeText = "Playlist";
    badgeClass = "playlist";
  } else if (filters.selectedTag) {
    text = `Tag: ${filters.selectedTag}`;
    buttonText = "Clear Tag";
    badgeText = "Tag";
    badgeClass = "tag";
  } else if (filters.selectedScripture) {
    text = `Scripture: ${filters.selectedScripture}`;
    buttonText = "Clear Scripture";
    badgeText = "Scripture";
    badgeClass = "tag";
  } else if (filters.searchTerm) {
    text = `Search: ${filters.searchTerm}`;
    buttonText = "Clear Search";
    badgeText = "Search";
    badgeClass = "search";
  }

  els.activeFilterLabel.textContent = text;

  if (els.clearFiltersBtn) {
    els.clearFiltersBtn.textContent = buttonText;
  }

  if (els.filterTypeBadge) {
    els.filterTypeBadge.textContent = badgeText;
    els.filterTypeBadge.className = `filter-type-badge ${badgeClass}`;
    els.filterTypeBadge.style.display = active ? "inline-flex" : "none";
  }

  if (els.stickyFilterBar) {
    els.stickyFilterBar.classList.toggle("hidden", !active);
  }
}

/* =========================
   PLAYLISTS + TAGS
========================= */

function renderPlaylists(trackList) {
  if (!els.playlistList) return;

  let playlists = getVisiblePlaylists(trackList);

  const allSongsItem = {
    name: "All Songs",
    count: tracks.length
  };

  playlists = [allSongsItem, ...playlists];

  els.playlistList.innerHTML = playlists
    .map(playlist => {
      const isAllSongs = playlist.name === "All Songs";
      const active =
        (isAllSongs && !hasActiveFilter()) ||
        filters.selectedPlaylist === playlist.name
          ? "active"
          : "";

      return `
        <button
          class="filter-chip ${active}"
          data-playlist="${escapeHtmlAttr(playlist.name)}"
          type="button"
        >
          ${isAllSongs ? "🎵 All Songs" : escapeHtml(playlist.name)}
          <span class="chip-count">(${playlist.count})</span>
        </button>
      `;
    })
    .join("");

  els.playlistList.querySelectorAll("[data-playlist]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.playlist === "All Songs") {
        clearAllFilters();
      } else {
        setPlaylistFilter(btn.dataset.playlist);
      }
    });
  });
}

function renderTags(trackList) {
  if (!els.tagList) return;

  let tags = getVisibleTags(trackList);

  if (window.innerWidth <= 640) {
    tags = tags.sort((a, b) => b.count - a.count).slice(0, 12);
  }

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

function renderScriptureBrowser(trackList) {
  if (!els.scriptureBrowserList) return;

  const groups = getVisibleScriptureGroups(trackList);

  if (!groups.length) {
    els.scriptureBrowserList.innerHTML = `<p class="empty-message">No scripture references found.</p>`;
    return;
  }

  els.scriptureBrowserList.innerHTML = groups
    .map(group => {
      const items = group.books
        .map(book => {
          const active = filters.selectedScripture === book.name ? "active" : "";
          return `
            <button class="filter-chip scripture-chip ${active}" data-scripture-book="${escapeHtmlAttr(book.name)}" type="button">
              <span class="scripture-chip-name">${escapeHtml(book.name)}</span>
              <span class="chip-count">${book.count}</span>
            </button>
          `;
        })
        .join("");

      return `
        <div class="scripture-browser-group">
          <div class="scripture-browser-heading">
            <strong>${escapeHtml(group.name)}</strong>
            <span>${group.total} reference${group.total === 1 ? "" : "s"}</span>
          </div>
          <div class="scripture-browser-chips">${items}</div>
        </div>
      `;
    })
    .join("");

  els.scriptureBrowserList.querySelectorAll("[data-scripture-book]").forEach(btn => {
    btn.addEventListener("click", () => setScriptureFilter(btn.dataset.scriptureBook));
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
      const scriptureBooks = [...new Set(album.tracks.flatMap(track => track.scripture_references.map(getScriptureBook)).filter(Boolean))];
      return `
        <article class="album-card-wrap ${isActive}">
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
              ${scriptureBooks.length ? `<p class="album-card-scripture">${escapeHtml(scriptureBooks.slice(0, 3).join(" • "))}${scriptureBooks.length > 3 ? ` • +${scriptureBooks.length - 3} more` : ""}</p>` : ""}
            </div>
          </button>
          <div class="album-card-footer">
            <button class="mini-action-btn" data-open-album-page="${escapeHtmlAttr(album.name)}" type="button">Open Page</button>
          </div>
        </article>
      `;
    })
    .join("");

  els.albumGrid.querySelectorAll("[data-album]").forEach(btn => {
    btn.addEventListener("click", () => setAlbumFilter(btn.dataset.album));
  });

  els.albumGrid.querySelectorAll("[data-open-album-page]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const albumName = btn.dataset.openAlbumPage;
      if (!albumName) return;
      window.location.href = `album.html?album=${encodeURIComponent(albumName)}`;
    });
  });
}

function renderFeaturedAlbum() {
  const album = getFeaturedAlbum();

  if (!album) {
    if (els.featuredAlbumTitle) els.featuredAlbumTitle.textContent = "No album found";
    if (els.featuredAlbumArtist) els.featuredAlbumArtist.textContent = "—";
    if (els.featuredAlbumCount) els.featuredAlbumCount.textContent = "0 songs";
    if (els.featuredAlbumCover) {
      els.featuredAlbumCover.src = "";
      els.featuredAlbumCover.alt = "No album cover";
    }
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
          <button class="featured-track-play" data-featured-index="${index}" type="button" aria-label="Play ${escapeHtmlAttr(track.title)}">
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
            <button class="mini-action-btn" data-play-next-track="${escapeHtmlAttr(track.id)}" type="button">
              Play Next
            </button>
            <button class="mini-action-btn" data-add-queue-track="${escapeHtmlAttr(track.id)}" type="button">
              Add Queue
            </button>
            <button class="mini-action-btn" data-add-playlist-track="${escapeHtmlAttr(track.id)}" type="button">
              + Playlist
            </button>
            <button class="mini-action-btn" data-save-offline-track="${escapeHtmlAttr(track.id)}" type="button">
              ${isDownloaded(track) ? "Saved" : "Offline"}
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
    btn.addEventListener("click", e => {
      const track = album.tracks.find(t => t.id === btn.dataset.lyricsTrack);
      if (!track) return;
      openLyricsModalForTrack(track, e.currentTarget);
    });
  });

  els.featuredTrackList.querySelectorAll("[data-play-next-track]").forEach(btn => {
    btn.addEventListener("click", () => {
      const track = album.tracks.find(t => t.id === btn.dataset.playNextTrack);
      if (!track) return;
      addTrackToQueue(track, { playNext: true });
    });
  });

  els.featuredTrackList.querySelectorAll("[data-add-queue-track]").forEach(btn => {
    btn.addEventListener("click", () => {
      const track = album.tracks.find(t => t.id === btn.dataset.addQueueTrack);
      if (!track) return;
      addTrackToQueue(track);
    });
  });

  els.featuredTrackList.querySelectorAll("[data-download-track]").forEach(btn => {
    btn.addEventListener("click", () => {
      const track = album.tracks.find(t => t.id === btn.dataset.downloadTrack);
      if (!track?.src) return;
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
  saveQueueState();
  renderQueue();
}

function startPlaybackFromList(trackList, shuffle = false, startIndex = 0) {
  if (!Array.isArray(trackList) || !trackList.length) return;
  setQueue(trackList, shuffle);
  playFromQueueIndex(Math.max(0, Math.min(startIndex, currentQueue.length - 1)));
}

function addTrackToQueue(track, options = {}) {
  if (!track) return;

  const playNext = Boolean(options.playNext);
  const current = getCurrentTrack();

  if (!current) {
    currentQueue = [track];
    currentQueueIndex = 0;
    saveQueueState();
    renderQueue();
    playTrack(track);
    showToast(playNext ? `Playing next: ${track.title}` : `Added and playing: ${track.title}`);
    return;
  }

  const queue = currentQueue.length ? [...currentQueue] : [current];
  const existingIndex = queue.findIndex(item => item.id === track.id);
  if (existingIndex >= 0) {
    queue.splice(existingIndex, 1);
  }

  const currentIndex = Math.max(queue.findIndex(item => item.id === current.id), 0);
  const insertIndex = playNext ? currentIndex + 1 : queue.length;
  queue.splice(insertIndex, 0, track);

  currentQueue = queue;
  currentQueueIndex = currentQueue.findIndex(item => item.id === current.id);
  saveQueueState();
  renderQueue();
  showToast(playNext ? `Play next set: ${track.title}` : `Added to queue: ${track.title}`);
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
  saveQueueState();
  renderQueue();
  renderFavorites();
  renderFeaturedTrackList();
  updateUrlForTrack(track);
}

function playFromQueueIndex(index) {
  if (index < 0 || index >= currentQueue.length) return;
  currentQueueIndex = index;
  saveQueueState();
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

function handleTrackEnded() {
  const current = getCurrentTrack();
  if (!current) return;

  const atQueueEnd = !currentQueue.length || currentQueueIndex >= currentQueue.length - 1;

  if (atQueueEnd) {
    const radioTracks = getRelatedTracks(current, { limit: 12, excludeIds: currentQueue.map(track => track.id) });
    if (radioTracks.length) {
      currentQueue = [...currentQueue, ...radioTracks];
      saveQueueState();
      renderQueue();
      showToast(`Radio mode added ${radioTracks.length} related song${radioTracks.length === 1 ? "" : "s"}.`);
    }
  }

  playNextTrack();
}

function getRelatedTracks(track, options = {}) {
  if (!track) return [];
  const excludeIds = new Set(options.excludeIds || []);
  excludeIds.add(track.id);

  const currentAlbum = String(track.album || "").toLowerCase();
  const currentArtist = String(track.artist || "").toLowerCase();
  const currentTags = new Set((track.tags || []).map(tag => String(tag).toLowerCase()));
  const currentRefs = new Set((track.scripture_references || []).map(ref => getScriptureBook(ref).toLowerCase()));
  const currentPlaylists = new Set((track.playlists || []).map(name => String(name).toLowerCase()));

  return tracks
    .filter(candidate => candidate?.src && !excludeIds.has(candidate.id))
    .map(candidate => {
      let score = 0;
      if (String(candidate.artist || "").toLowerCase() === currentArtist) score += 4;
      if (String(candidate.album || "").toLowerCase() === currentAlbum) score += 2;

      (candidate.tags || []).forEach(tag => {
        if (currentTags.has(String(tag).toLowerCase())) score += 3;
      });

      (candidate.playlists || []).forEach(name => {
        if (currentPlaylists.has(String(name).toLowerCase())) score += 2;
      });

      (candidate.scripture_references || []).forEach(ref => {
        if (currentRefs.has(getScriptureBook(ref).toLowerCase())) score += 3;
      });

      if (score === 0 && candidate.genre && track.genre && candidate.genre === track.genre) score += 1;
      return { candidate, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title))
    .slice(0, options.limit || 8)
    .map(item => item.candidate);
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

  if (els.addToPlaylistBtn) {
    els.addToPlaylistBtn.disabled = !track;
  }
  updateFavoriteButton();
  updatePlayButton();
  updateOfflineButtons(track);
  updatePlayerSheet();
}

function updatePlayButton() {
  if (!els.audioPlayer) return;
  const label = els.audioPlayer.paused ? "▶" : "❚❚";
  if (els.playBtn) els.playBtn.textContent = label;
  if (els.playerSheetPlayBtn) els.playerSheetPlayBtn.textContent = label;
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

  if (els.playerSheetCurrentTime) els.playerSheetCurrentTime.textContent = formatTime(current);
  if (els.playerSheetDuration) els.playerSheetDuration.textContent = formatTime(duration);
  if (els.playerSheetSeekBar) {
    els.playerSheetSeekBar.value = duration ? String((current / duration) * 100) : "0";
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

  if (!track?.lyrics) {
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

function openLyricsModal(triggerEl = null) {
  const track = getCurrentTrack();
  if (!track) return;
  openLyricsModalForTrack(track, triggerEl);
}

function openLyricsModalForTrack(track, triggerEl = null) {
  if (!track || !els.lyricsModal || !els.lyricsModalBody || !els.lyricsModalTitle) return;

  lastFocusedElement = triggerEl || document.activeElement || null;
  els.lyricsModalTitle.textContent = `Lyrics — ${track.title}`;
  els.lyricsModalBody.innerHTML = track.lyrics
    ? `<div class="lyrics-block">${nl2br(escapeHtml(track.lyrics))}</div>`
    : `<p class="empty-message">No lyrics available.</p>`;

  els.lyricsModal.classList.remove("hidden");
  els.lyricsModal.setAttribute("aria-hidden", "false");
  lockBodyScroll(true);

  requestAnimationFrame(() => {
    els.closeLyricsBtn?.focus();
  });
}

function closeLyricsModal() {
  if (els.lyricsModal) {
    els.lyricsModal.classList.add("hidden");
    els.lyricsModal.setAttribute("aria-hidden", "true");
  }

  if (!isAnyModalOpen()) {
    lockBodyScroll(false);
    restoreFocus();
  }
}

/* =========================
   ALBUM MODAL
========================= */

function openAlbumModal(album, triggerEl = null) {
  if (!album || !els.albumModal) return;

  lastFocusedElement = triggerEl || document.activeElement || null;
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
        const active = getCurrentTrack()?.id === track.id ? "active" : "";
        return `
          <div class="album-track-row ${active}" data-track-id="${escapeHtmlAttr(track.id)}">
            <button class="album-track-main" data-album-track-index="${index}" type="button">
              <div class="album-track-title-row">
                <strong>${index + 1}. ${escapeHtml(track.title)}</strong>
                <span class="album-track-duration">${escapeHtml(track.duration || "")}</span>
              </div>
              <p class="album-track-artist">${escapeHtml(track.artist)}</p>
              ${
                track.scripture_references.length
                  ? `<p class="album-track-scripture">${escapeHtml(track.scripture_references.join(" • "))}</p>`
                  : ""
              }
            </button>
            <div class="featured-track-actions">
              <button class="mini-action-btn" data-album-play-next="${index}" type="button">Play Next</button>
              <button class="mini-action-btn" data-album-add-queue="${index}" type="button">Add Queue</button>
            </div>
          </div>
        `;
      })
      .join("");

    els.albumModalTracks.querySelectorAll("[data-album-track-index]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.albumTrackIndex);
        startPlaybackFromList(album.tracks, false, idx);
        closeAlbumModal();
      });
    });

    els.albumModalTracks.querySelectorAll("[data-album-play-next]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const track = album.tracks[Number(btn.dataset.albumPlayNext)];
        if (!track) return;
        addTrackToQueue(track, { playNext: true });
      });
    });

    els.albumModalTracks.querySelectorAll("[data-album-add-queue]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const track = album.tracks[Number(btn.dataset.albumAddQueue)];
        if (!track) return;
        addTrackToQueue(track);
      });
    });
  }

  els.albumModal.classList.remove("hidden");
  els.albumModal.setAttribute("aria-hidden", "false");
  lockBodyScroll(true);

  requestAnimationFrame(() => {
    els.closeAlbumBtn?.focus();
    scrollAlbumModalToCurrentTrack();
  });
}

function closeAlbumModal() {
  if (els.albumModal) {
    els.albumModal.classList.add("hidden");
    els.albumModal.setAttribute("aria-hidden", "true");
    delete els.albumModal.dataset.albumName;
  }

  if (!isAnyModalOpen()) {
    lockBodyScroll(false);
    restoreFocus();
  }
}

function getAlbumModalAlbum() {
  const name = els.albumModal?.dataset?.albumName;
  if (!name) return null;

  return (
    getVisibleAlbums(filteredTracks).find(album => album.name === name) ||
    getVisibleAlbums(tracks).find(album => album.name === name) ||
    null
  );
}

function scrollAlbumModalToCurrentTrack() {
  if (!els.albumModalTracks) return;

  const current = getCurrentTrack();
  if (!current) return;

  const activeRow = els.albumModalTracks.querySelector(`[data-track-id="${cssEscape(current.id)}"]`);
  if (!activeRow) return;

  activeRow.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
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
    if (els.playerSheetFavoriteBtn) els.playerSheetFavoriteBtn.textContent = "☆ Favorite";
    return;
  }

  const label = isFavorite(track) ? "★ Favorited" : "☆ Favorite";
  els.favoriteSongBtn.textContent = label;
  if (els.playerSheetFavoriteBtn) els.playerSheetFavoriteBtn.textContent = label;
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


function isDownloaded(track) {
  return Boolean(track && downloadedTracks.includes(track.id));
}

function updateOfflineButtons(track = getCurrentTrack()) {
  const label = track && isDownloaded(track) ? "Saved Offline" : "Offline";
  if (els.saveOfflineBtn) els.saveOfflineBtn.textContent = label;
  if (els.playerSheetSaveOfflineBtn) els.playerSheetSaveOfflineBtn.textContent = label;
}

function saveTrackOffline(track) {
  if (!track?.src) return;

  if (!downloadedTracks.includes(track.id)) {
    downloadedTracks.unshift(track.id);
    saveDownloadedTracks();
  }

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "CACHE_AUDIO_URLS",
      urls: [track.src]
    });
  }

  updateOfflineButtons(track);
  renderDownloadedSongs();
  renderFeaturedTrackList();
}

function renderDownloadedSongs() {
  if (!els.downloadedList) return;

  const savedTracks = downloadedTracks
    .map(id => tracks.find(track => track.id === id))
    .filter(Boolean)
    .slice(0, 12);

  if (!savedTracks.length) {
    els.downloadedList.innerHTML = `<p class="empty-message">No offline songs saved yet.</p>`;
    return;
  }

  els.downloadedList.innerHTML = savedTracks.map((track, index) => renderMiniCard(track, index)).join("");
  bindMiniCardClicks(els.downloadedList, savedTracks);
}

function createNewPlaylist() {
  playlistPickerTrackId = null;
  if (els.playlistSelect) els.playlistSelect.innerHTML = `<option value="">Choose a playlist</option>`;
  if (els.newPlaylistName) els.newPlaylistName.value = "";
  openPlaylistModal(null, els.createPlaylistBtn);
}

function renderMyPlaylists() {
  if (!els.myPlaylistList) return;

  const names = Object.keys(customPlaylists).sort((a, b) => a.localeCompare(b));

  if (!names.length) {
    els.myPlaylistList.innerHTML = `<p class="empty-message">No custom playlists yet.</p>`;
    return;
  }

  els.myPlaylistList.innerHTML = names.map(name => `
    <div class="playlist-chip-row">
      <button class="filter-chip" data-custom-playlist="${escapeHtmlAttr(name)}" type="button">
        ${escapeHtml(name)} <span class="chip-count">(${customPlaylists[name].length})</span>
      </button>
      <button class="mini-action-btn" data-delete-custom-playlist="${escapeHtmlAttr(name)}" type="button">✕</button>
    </div>
  `).join("");

  els.myPlaylistList.querySelectorAll("[data-custom-playlist]").forEach(btn => {
    btn.addEventListener("click", () => {
      const ids = customPlaylists[btn.dataset.customPlaylist] || [];
      filteredTracks = ids.map(id => tracks.find(track => track.id === id)).filter(Boolean);
      filters.selectedAlbum = null;
      filters.selectedPlaylist = null;
      filters.selectedTag = null;
      filters.selectedScripture = null;
      filters.searchTerm = "";
      if (els.searchInput) els.searchInput.value = "";
      if (els.activeFilterLabel) els.activeFilterLabel.textContent = `My Playlist: ${btn.dataset.customPlaylist}`;
      if (els.stickyFilterBar) els.stickyFilterBar.classList.remove("hidden");
      if (els.filterTypeBadge) {
        els.filterTypeBadge.textContent = "My Playlist";
        els.filterTypeBadge.className = "filter-type-badge playlist";
        els.filterTypeBadge.style.display = "inline-flex";
      }
      renderAlbums(filteredTracks);
      renderFeaturedAlbum();
      renderFeaturedTrackList();
      renderQueue();
      scrollToTop();
    });
  });

  els.myPlaylistList.querySelectorAll("[data-delete-custom-playlist]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const name = btn.dataset.deleteCustomPlaylist;
      delete customPlaylists[name];
      saveCustomPlaylists();
      renderMyPlaylists();
    });
  });
}

function openPlaylistModal(track = null, triggerEl = null) {
  if (!els.playlistModal) return;
  lastFocusedElement = triggerEl || document.activeElement || null;

  const names = Object.keys(customPlaylists).sort((a, b) => a.localeCompare(b));
  if (els.playlistSelect) {
    els.playlistSelect.innerHTML = `<option value="">Choose a playlist</option>` + names
      .map(name => `<option value="${escapeHtmlAttr(name)}">${escapeHtml(name)}</option>`)
      .join("");
  }

  if (els.newPlaylistName) els.newPlaylistName.value = "";
  playlistPickerTrackId = track?.id || null;

  els.playlistModal.classList.remove("hidden");
  els.playlistModal.setAttribute("aria-hidden", "false");
  lockBodyScroll(true);
}

function openPlaylistModalForTrack(track, triggerEl = null) {
  if (!track) return;
  openPlaylistModal(track, triggerEl);
}

function closePlaylistModal() {
  if (!els.playlistModal) return;
  els.playlistModal.classList.add("hidden");
  els.playlistModal.setAttribute("aria-hidden", "true");
  playlistPickerTrackId = null;
  if (!isAnyModalOpen()) {
    lockBodyScroll(false);
    restoreFocus();
  }
}

function saveTrackToPlaylistFromModal() {
  const typedName = els.newPlaylistName?.value?.trim();
  const selectedName = els.playlistSelect?.value?.trim();
  const playlistName = typedName || selectedName;

  if (!playlistName) return;

  if (!customPlaylists[playlistName]) {
    customPlaylists[playlistName] = [];
  }

  if (playlistPickerTrackId && !customPlaylists[playlistName].includes(playlistPickerTrackId)) {
    customPlaylists[playlistName].push(playlistPickerTrackId);
  }

  saveCustomPlaylists();
  renderMyPlaylists();
  closePlaylistModal();
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
      startPlaybackFromList([track], false, 0);
    });
  });
}

/* =========================
   QUEUE UI
========================= */
function getQueueDisplayTracks() {
  if (Array.isArray(currentQueue) && currentQueue.length) {
    return currentQueue;
  }

  if (Array.isArray(filteredTracks) && filteredTracks.length) {
    return filteredTracks;
  }

  return Array.isArray(tracks) ? tracks : [];
}

function renderQueue() {
  const displayTracks = getQueueDisplayTracks();

  if (els.queueCount) {
    els.queueCount.textContent = `${displayTracks.length} song${displayTracks.length === 1 ? "" : "s"}`;
  }

  if (!els.queueList) return;

  if (!displayTracks.length) {
    els.queueList.innerHTML = `<p class="empty-message">Queue is empty.</p>`;
    if (els.playerSheetQueuePanel) {
      els.playerSheetQueuePanel.innerHTML = `<p class="empty-message">Queue is empty.</p>`;
    }
    return;
  }

  const queueHtml = displayTracks
    .map((track, index) => {
      const activeIndex = currentQueue.length
        ? currentQueueIndex
        : displayTracks.findIndex(t => t.id === getCurrentTrack()?.id);

      const active = index === activeIndex ? "active" : "";

      return `
        <div class="queue-row ${active}" draggable="true" data-queue-index="${index}" data-track-id="${escapeHtmlAttr(track.id)}">
          <button class="queue-play-btn" data-queue-play="${index}" type="button" aria-label="Play ${escapeHtmlAttr(track.title)}">▶</button>
          <button class="queue-drag-handle" data-queue-drag-handle="${index}" type="button" aria-label="Drag to reorder ${escapeHtmlAttr(track.title)}" title="Drag to reorder">↕</button>
          ${
            track.cover
              ? `<img class="queue-cover" src="${escapeHtmlAttr(track.cover)}" alt="${escapeHtmlAttr(track.title)} cover" />`
              : `<div class="queue-cover"></div>`
          }

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
    })
    .join("");

  els.queueList.innerHTML = queueHtml;
  if (els.playerSheetQueuePanel) {
    els.playerSheetQueuePanel.innerHTML = `<div class="player-sheet-queue-list">${queueHtml}</div>`;
  }

  bindQueueInteractions(els.queueList, displayTracks);
  if (els.playerSheetQueuePanel) {
    bindQueueInteractions(els.playerSheetQueuePanel, displayTracks);
  }
}

function bindQueueInteractions(container, displayTracks) {
  container.querySelectorAll("[data-queue-play]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const index = Number(btn.dataset.queuePlay);
      if (!currentQueue.length) setQueue(displayTracks, false);
      playFromQueueIndex(index);
      if (container === els.queueList) openAndScrollQueueToCurrentTrack();
    });
  });

  container.querySelectorAll("[data-queue-remove]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const index = Number(btn.dataset.queueRemove);
      const baseQueue = currentQueue.length ? [...currentQueue] : [...displayTracks];
      if (index < 0 || index >= baseQueue.length) return;
      const [removed] = baseQueue.splice(index, 1);
      currentQueue = baseQueue;
      if (!currentQueue.length) {
        currentQueueIndex = -1;
      } else if (removed?.id === getCurrentTrack()?.id) {
        currentQueueIndex = Math.min(index, currentQueue.length - 1);
      } else {
        currentQueueIndex = currentQueue.findIndex(track => track.id === getCurrentTrack()?.id);
      }
      saveQueueState();
      renderQueue();
    });
  });

  container.querySelectorAll("[data-queue-play-next]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const index = Number(btn.dataset.queuePlayNext);
      const baseQueue = currentQueue.length ? [...currentQueue] : [...displayTracks];
      if (index < 0 || index >= baseQueue.length) return;
      const current = getCurrentTrack();
      if (!current) {
        setQueue(baseQueue, false);
        playFromQueueIndex(index);
        return;
      }
      const currentIndex = baseQueue.findIndex(track => track.id === current.id);
      const [moved] = baseQueue.splice(index, 1);
      baseQueue.splice(Math.max(currentIndex + 1, 0), 0, moved);
      currentQueue = baseQueue;
      currentQueueIndex = currentQueue.findIndex(track => track.id === current.id);
      saveQueueState();
      renderQueue();
    });
  });

  container.querySelectorAll(".queue-row").forEach(row => {
    row.addEventListener("click", e => {
      if (e.target.closest("button")) return;
      const index = Number(row.dataset.queueIndex);
      if (!currentQueue.length) {
        setQueue(displayTracks, false);
      }
      playFromQueueIndex(index);
      openAndScrollQueueToCurrentTrack();
    });

    row.addEventListener("dragstart", e => {
      if (e.target && !e.target.closest(".queue-drag-handle")) {
        e.preventDefault();
        return;
      }
      queueDragIndex = Number(row.dataset.queueIndex);
      row.classList.add("dragging");
    });

    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
    });

    row.addEventListener("dragover", e => {
      e.preventDefault();
    });

    row.addEventListener("drop", e => {
      e.preventDefault();
      const dropIndex = Number(row.dataset.queueIndex);
      if (queueDragIndex === null || queueDragIndex === dropIndex) return;

      const baseQueue = currentQueue.length ? [...currentQueue] : [...displayTracks];
      const moved = baseQueue.splice(queueDragIndex, 1)[0];
      baseQueue.splice(dropIndex, 0, moved);

      const current = getCurrentTrack();
      currentQueue = baseQueue;
      currentQueueIndex = current ? currentQueue.findIndex(track => track.id === current.id) : 0;
      saveQueueState();
      renderQueue();
      queueDragIndex = null;
    });
  });

  container.querySelectorAll("[data-queue-drag-handle]").forEach(handle => {
    handle.addEventListener("touchstart", e => startQueueTouchDrag(e, container, displayTracks), { passive: true });
    handle.addEventListener("touchmove", e => updateQueueTouchDrag(e), { passive: false });
    handle.addEventListener("touchend", e => finishQueueTouchDrag(e, displayTracks));
    handle.addEventListener("touchcancel", cancelQueueTouchDrag);
  });
}

function openAndScrollQueueToCurrentTrack() {
  const queueSection = document.querySelector('[data-collapsible="queue"]');
  const toggle = queueSection?.querySelector(".section-toggle");

  if (queueSection && !queueSection.classList.contains("open")) {
    queueSection.classList.add("open");
    toggle?.setAttribute("aria-expanded", "true");
    localStorage.setItem("allen_parvin_section_queue", "open");
  }

  requestAnimationFrame(() => {
    els.queueSectionBody?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    setTimeout(scrollQueueToCurrentTrack, 180);
  });
}

function scrollQueueToCurrentTrack() {
  const current = getCurrentTrack();
  if (!current || !els.queueList) return;

  const activeRow = els.queueList.querySelector(`[data-track-id="${cssEscape(current.id)}"]`);
  if (!activeRow) return;

  activeRow.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}


function startQueueTouchDrag(event, container, displayTracks) {
  const touch = event.touches?.[0];
  const handle = event.currentTarget;
  const row = handle?.closest(".queue-row");
  if (!touch || !row) return;

  activeQueueTouchDrag = {
    container,
    displayTracks,
    sourceIndex: Number(row.dataset.queueIndex),
    targetIndex: Number(row.dataset.queueIndex)
  };

  container.querySelectorAll(".queue-row").forEach(item => item.classList.remove("drag-target", "dragging"));
  row.classList.add("dragging");
}

function updateQueueTouchDrag(event) {
  if (!activeQueueTouchDrag) return;
  const touch = event.touches?.[0];
  if (!touch) return;

  event.preventDefault();

  const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest(".queue-row");
  if (!target) return;

  activeQueueTouchDrag.targetIndex = Number(target.dataset.queueIndex);
  activeQueueTouchDrag.container.querySelectorAll(".queue-row").forEach(item => item.classList.remove("drag-target"));
  target.classList.add("drag-target");
}

function finishQueueTouchDrag(event, displayTracks) {
  if (!activeQueueTouchDrag) return;

  const sourceIndex = activeQueueTouchDrag.sourceIndex;
  const targetIndex = activeQueueTouchDrag.targetIndex;
  const container = activeQueueTouchDrag.container;

  container.querySelectorAll(".queue-row").forEach(item => item.classList.remove("drag-target", "dragging"));

  if (Number.isInteger(sourceIndex) && Number.isInteger(targetIndex) && sourceIndex !== targetIndex) {
    const baseQueue = currentQueue.length ? [...currentQueue] : [...(displayTracks || activeQueueTouchDrag.displayTracks || [])];
    const moved = baseQueue.splice(sourceIndex, 1)[0];
    if (moved) {
      baseQueue.splice(targetIndex, 0, moved);
      const current = getCurrentTrack();
      currentQueue = baseQueue;
      currentQueueIndex = current ? currentQueue.findIndex(track => track.id === current.id) : 0;
      saveQueueState();
      renderQueue();
      showToast(`Moved: ${moved.title}`);
    }
  }

  activeQueueTouchDrag = null;
}

function cancelQueueTouchDrag() {
  if (!activeQueueTouchDrag) return;
  activeQueueTouchDrag.container.querySelectorAll(".queue-row").forEach(item => item.classList.remove("drag-target", "dragging"));
  activeQueueTouchDrag = null;
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

  startPlaybackFromList([track], false, 0);
  hideResumeBanner();
}

/* =========================
   SONG ACTIONS
========================= */

function copyCurrentLyrics() {
  const track = getCurrentTrack();
  if (!track?.lyrics) return;

  navigator.clipboard.writeText(track.lyrics).then(() => {
    flashButtonText(els.copyLyricsBtn, "Copied!");
    flashButtonText(els.copyLyricsBtnDesktop, "Copied!");
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
      flashButtonText(els.shareSongBtnDesktop, "Link Copied!");
    }).catch(err => {
      console.error("Share fallback failed:", err);
    });
  }
}

function downloadCurrentSong() {
  const track = getCurrentTrack();
  if (!track?.src) return;
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
   FULL PLAYER SHEET
========================= */

function initPlayerSheetSwipeToClose() {
  if (!els.playerSheetContent || els.playerSheetSwipeHandleBound) return;
  els.playerSheetSwipeHandleBound = true;

  els.playerSheetContent.addEventListener("touchstart", event => {
    if (els.playerSheet?.classList.contains("hidden")) return;
    const touch = event.touches?.[0];
    if (!touch) return;

    const scroller = event.target.closest(".player-tab-panel");
    if (scroller && scroller.scrollTop > 0) return;

    playerSheetSwipeStartY = touch.clientY;
  }, { passive: true });

  els.playerSheetContent.addEventListener("touchmove", event => {
    if (playerSheetSwipeStartY === null) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    const deltaY = touch.clientY - playerSheetSwipeStartY;
    if (deltaY > 10) {
      els.playerSheetContent.style.transform = `translateY(${Math.min(deltaY, 120)}px)`;
    }
  }, { passive: true });

  els.playerSheetContent.addEventListener("touchend", event => {
    if (playerSheetSwipeStartY === null) return;
    const touch = event.changedTouches?.[0];
    const deltaY = touch ? touch.clientY - playerSheetSwipeStartY : 0;
    els.playerSheetContent.style.transform = "";
    playerSheetSwipeStartY = null;
    if (deltaY > 90) {
      closePlayerSheet();
    }
  });

  els.playerSheetContent.addEventListener("touchcancel", () => {
    els.playerSheetContent.style.transform = "";
    playerSheetSwipeStartY = null;
  });
}

function openPlayerSheet(triggerEl = null) {
  if (!els.playerSheet) return;
  lastFocusedElement = triggerEl || document.activeElement || null;
  els.playerSheet.classList.remove("hidden");
  els.playerSheet.setAttribute("aria-hidden", "false");
  lockBodyScroll(true);
  updatePlayerSheet();
}

function closePlayerSheet() {
  if (!els.playerSheet) return;
  els.playerSheet.classList.add("hidden");
  els.playerSheet.setAttribute("aria-hidden", "true");
  if (!isAnyModalOpen()) {
    lockBodyScroll(false);
    restoreFocus();
  }
}

function setPlayerSheetTab(tabName) {
  playerSheetTab = tabName;
  document.querySelectorAll("[data-player-tab]").forEach(btn => {
    const active = btn.dataset.playerTab === tabName;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });

  document.querySelectorAll("[data-player-panel]").forEach(panel => {
    panel.classList.toggle("active", panel.dataset.playerPanel === tabName);
  });
}

function updatePlayerSheet() {
  const track = getCurrentTrack();

  if (els.playerSheetCover) {
    els.playerSheetCover.src = track?.cover || "";
    els.playerSheetCover.alt = track ? `${track.title} cover` : "Current song cover";
  }

  if (els.playerSheetTrackTitle) els.playerSheetTrackTitle.textContent = track?.title || "Select a song";
  if (els.playerSheetTrackArtist) els.playerSheetTrackArtist.textContent = track?.artist || "—";
  if (els.playerSheetTrackAlbum) els.playerSheetTrackAlbum.textContent = track?.album || "—";
  if (els.playerSheetTrackScripture) {
    els.playerSheetTrackScripture.textContent = track?.scripture_references?.length
      ? track.scripture_references.join(" • ")
      : "—";
  }

  if (els.playerSheetLyricsPanel) {
    els.playerSheetLyricsPanel.innerHTML = track?.lyrics
      ? `<div class="lyrics-block">${nl2br(escapeHtml(track.lyrics))}</div>`
      : `<p class="empty-message">No lyrics available.</p>`;
  }

  if (els.playerSheetScripturePanel) {
    els.playerSheetScripturePanel.innerHTML = track?.scripture_references?.length
      ? `<div class="scripture-block">${track.scripture_references.map(ref => `<p>${escapeHtml(ref)}</p>`).join("")}</div>`
      : `<p class="empty-message">No scripture references available.</p>`;
  }

  if (els.playerSheetPlayBtn && els.audioPlayer) {
    els.playerSheetPlayBtn.textContent = els.audioPlayer.paused ? "▶" : "❚❚";
  }

  updateOfflineButtons(track);
  updateFavoriteButton();
  updateProgressUI();
  setPlayerSheetTab(playerSheetTab);
}

function getAlbumPageUrl(albumName) {
  return `album.html?album=${encodeURIComponent(albumName || "")}`;
}

function openAlbumPage(albumName) {
  if (!albumName) return;
  window.location.href = getAlbumPageUrl(albumName);
}

function showToast(message) {
  if (!message) return;

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
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

/* =========================
   URL / STATE HELPERS
========================= */

function handleInitialQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const scripture = params.get("scripture");
  if (scripture) {
    setScriptureFilter(scripture);
  }
}

function handleSongQueryParam() {
  const params = new URLSearchParams(window.location.search);
  const song = params.get("song");
  if (!song) return;

  const track = tracks.find(t => t.title.toLowerCase() === song.toLowerCase());
  if (!track) return;

  setQueue([track], false);
  currentQueueIndex = 0;
  updateNowPlaying(track);
  updateLyricsPanel(track);
  updateScripturePanel(track);
  renderQueue();
}

function updateUrlForTrack(track) {
  if (!track) return;

  const url = new URL(window.location.href);
  url.searchParams.set("song", track.title);
  window.history.replaceState({}, "", url);
}

function isAnyModalOpen() {
  const lyricsOpen = els.lyricsModal && !els.lyricsModal.classList.contains("hidden");
  const albumOpen = els.albumModal && !els.albumModal.classList.contains("hidden");
  const playlistOpen = els.playlistModal && !els.playlistModal.classList.contains("hidden");
  const playerSheetOpen = els.playerSheet && !els.playerSheet.classList.contains("hidden");
  return Boolean(lyricsOpen || albumOpen || playlistOpen || playerSheetOpen);
}

function lockBodyScroll(locked) {
  document.body.style.overflow = locked ? "hidden" : "";
}

function restoreFocus() {
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
  lastFocusedElement = null;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === "function") {
    return window.CSS.escape(value);
  }

  return String(value).replace(/["\\#.:;?+*~'<>=!^$[\](){}|/@]/g, "\\$&");
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

/* =========================
   COLLAPSIBLE SECTIONS
========================= */

function initCollapsibles() {
  const sections = document.querySelectorAll(".collapsible-section");

  sections.forEach(section => {
    const toggle = section.querySelector(".section-toggle");
    const key = section.dataset.collapsible;

    if (!toggle || !key) return;

    const savedState = localStorage.getItem(`allen_parvin_section_${key}`);
    const isOpen = savedState !== "closed";

    section.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

    toggle.addEventListener("click", () => {
      const nowOpen = section.classList.toggle("open");
      toggle.setAttribute("aria-expanded", nowOpen ? "true" : "false");
      localStorage.setItem(`allen_parvin_section_${key}`, nowOpen ? "open" : "closed");
    });
  });
}

/* =========================
   MOBILE PLAYER DRAWER
========================= */

function initMobilePlayerDrawer() {
  if (!els.moreActionsBtn || !els.mobileActionsDrawer) return;

  els.moreActionsBtn.addEventListener("click", e => {
    e.stopPropagation();
    const isHidden = els.mobileActionsDrawer.classList.contains("hidden");
    if (isHidden) {
      openMobilePlayerDrawer();
    } else {
      closeMobilePlayerDrawer();
    }
  });

  document.addEventListener("click", e => {
    if (!els.mobileActionsDrawer || !els.moreActionsBtn) return;
    if (els.mobileActionsDrawer.classList.contains("hidden")) return;

    const clickedInsideDrawer = els.mobileActionsDrawer.contains(e.target);
    const clickedToggle = els.moreActionsBtn.contains(e.target);

    if (!clickedInsideDrawer && !clickedToggle) {
      closeMobilePlayerDrawer();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 640) {
      closeMobilePlayerDrawer();
    }
  });
}

function openMobilePlayerDrawer() {
  if (!els.mobileActionsDrawer || !els.moreActionsBtn) return;
  els.mobileActionsDrawer.classList.remove("hidden");
  els.moreActionsBtn.setAttribute("aria-expanded", "true");
}

function closeMobilePlayerDrawer() {
  if (!els.mobileActionsDrawer || !els.moreActionsBtn) return;
  els.mobileActionsDrawer.classList.add("hidden");
  els.moreActionsBtn.setAttribute("aria-expanded", "false");
}

/* =========================
   MOBILE NAV
========================= */

function initMobileNav() {
  if (!els.mobileNavToggle || !els.siteNavLinks) return;

  els.mobileNavToggle.addEventListener("click", () => {
    const isOpen = els.siteNavLinks.classList.toggle("nav-open");
    els.mobileNavToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    els.mobileNavToggle.textContent = isOpen ? "✕" : "☰";
  });

  els.siteNavLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      closeMobileNav();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 640) {
      closeMobileNav(true);
    }
  });
}

function closeMobileNav(forceDesktopState = false) {
  if (!els.mobileNavToggle || !els.siteNavLinks) return;

  els.siteNavLinks.classList.remove("nav-open");
  els.mobileNavToggle.setAttribute("aria-expanded", "false");
  els.mobileNavToggle.textContent = "☰";

  if (forceDesktopState && window.innerWidth > 640) {
    els.siteNavLinks.classList.remove("nav-open");
  }
}

/* =========================
   PLAYLIST SYSTEM V2
========================= */

let activeCustomPlaylistName = null;
let playlistItemDragIndex = null;

function normalizeCustomPlaylistState() {
  if (!customPlaylists || typeof customPlaylists !== "object") {
    customPlaylists = {};
    return;
  }

  Object.keys(customPlaylists).forEach(name => {
    const ids = Array.isArray(customPlaylists[name]) ? customPlaylists[name] : [];
    customPlaylists[name] = ids.filter(Boolean);
  });
}

function getCustomPlaylistTracks(name) {
  const ids = customPlaylists[name] || [];
  return ids
    .map(id => tracks.find(track => track.id === id))
    .filter(Boolean);
}

function ensurePlaylistWorkspace() {
  if (!els.myPlaylistList) return null;

  let workspace = document.getElementById("playlistWorkspace");
  if (workspace) return workspace;

  workspace = document.createElement("section");
  workspace.id = "playlistWorkspace";
  workspace.className = "playlist-workspace hidden";
  workspace.innerHTML = `
    <div class="playlist-workspace-header">
      <div id="playlistWorkspaceCover" class="playlist-workspace-cover" aria-hidden="true"></div>

      <div class="playlist-workspace-meta">
        <p class="eyebrow">Playlist Studio</p>
        <h3 id="playlistWorkspaceTitle">Select a playlist</h3>
        <p id="playlistWorkspaceInfo" class="playlist-workspace-info">Build playlists, reorder tracks, and play your favorites.</p>

        <div class="playlist-workspace-actions">
          <button id="playlistWorkspacePlayBtn" class="action-btn" type="button">Play</button>
          <button id="playlistWorkspaceShuffleBtn" class="action-btn secondary-btn" type="button">Shuffle</button>
          <button id="playlistWorkspaceFocusBtn" class="action-btn secondary-btn" type="button">Open in Library</button>
        </div>
      </div>
    </div>

    <div class="playlist-workspace-toolbar">
      <label class="visually-hidden" for="playlistRenameInput">Rename playlist</label>
      <input id="playlistRenameInput" class="request-input" type="text" placeholder="Rename playlist" />
      <button id="playlistRenameBtn" class="action-btn secondary-btn" type="button">Rename</button>
      <button id="playlistDeleteBtn" class="action-btn danger-btn" type="button">Delete</button>
    </div>

    <div class="playlist-workspace-helper">
      Drag songs to reorder this playlist. Use remove to take a song out.
    </div>

    <div id="playlistWorkspaceTracks" class="playlist-workspace-tracks" aria-live="polite"></div>
  `;

  els.myPlaylistList.parentElement.appendChild(workspace);
  bindPlaylistWorkspaceUI();
  return workspace;
}

function bindPlaylistWorkspaceUI() {
  const playBtn = document.getElementById("playlistWorkspacePlayBtn");
  const shuffleBtn = document.getElementById("playlistWorkspaceShuffleBtn");
  const focusBtn = document.getElementById("playlistWorkspaceFocusBtn");
  const renameBtn = document.getElementById("playlistRenameBtn");
  const deleteBtn = document.getElementById("playlistDeleteBtn");
  const renameInput = document.getElementById("playlistRenameInput");

  on(playBtn, "click", () => {
    if (!activeCustomPlaylistName) return;
    const list = getCustomPlaylistTracks(activeCustomPlaylistName);
    if (!list.length) return;
    startPlaybackFromList(list, false, 0);
  });

  on(shuffleBtn, "click", () => {
    if (!activeCustomPlaylistName) return;
    const list = getCustomPlaylistTracks(activeCustomPlaylistName);
    if (!list.length) return;
    startPlaybackFromList(list, true, 0);
  });

  on(focusBtn, "click", () => {
    if (!activeCustomPlaylistName) return;
    applyCustomPlaylistFilter(activeCustomPlaylistName);
  });

  on(renameBtn, "click", () => {
    if (!activeCustomPlaylistName) return;
    const nextName = renameInput?.value?.trim();
    renameCustomPlaylist(activeCustomPlaylistName, nextName);
  });

  on(renameInput, "keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      renameBtn?.click();
    }
  });

  on(deleteBtn, "click", () => {
    if (!activeCustomPlaylistName) return;
    const name = activeCustomPlaylistName;
    delete customPlaylists[name];
    saveCustomPlaylists();
    activeCustomPlaylistName = null;
    renderMyPlaylists();
    renderPlaylistWorkspace();
  });
}

function buildPlaylistCoverCollage(trackList) {
  if (!trackList.length) {
    return `<div class="playlist-collage-empty">♪</div>`;
  }

  const covers = trackList
    .map(track => track.cover)
    .filter(Boolean)
    .slice(0, 4);

  if (!covers.length) {
    return `<div class="playlist-collage-empty">♪</div>`;
  }

  return covers
    .map(src => `<img loading="lazy" src="${escapeHtmlAttr(src)}" alt="" />`)
    .join("");
}

function applyCustomPlaylistFilter(name) {
  const ids = customPlaylists[name] || [];
  filteredTracks = ids.map(id => tracks.find(track => track.id === id)).filter(Boolean);
  filters.selectedAlbum = null;
  filters.selectedPlaylist = null;
  filters.selectedTag = null;
  filters.selectedScripture = null;
  filters.searchTerm = "";
  if (els.searchInput) els.searchInput.value = "";
  if (els.activeFilterLabel) els.activeFilterLabel.textContent = `My Playlist: ${name}`;
  if (els.stickyFilterBar) els.stickyFilterBar.classList.remove("hidden");
  if (els.filterTypeBadge) {
    els.filterTypeBadge.textContent = "My Playlist";
    els.filterTypeBadge.className = "filter-type-badge playlist";
    els.filterTypeBadge.style.display = "inline-flex";
  }
  renderAlbums(filteredTracks);
  renderFeaturedAlbum();
  renderFeaturedTrackList();
  renderQueue();
  scrollToTop();
}

function setActiveCustomPlaylist(name) {
  activeCustomPlaylistName = name && customPlaylists[name] ? name : null;
  renderMyPlaylists();
  renderPlaylistWorkspace();
}

function renameCustomPlaylist(oldName, newName) {
  if (!oldName || !customPlaylists[oldName]) return;
  if (!newName || newName === oldName) {
    renderPlaylistWorkspace();
    return;
  }

  if (customPlaylists[newName]) {
    const merged = [...customPlaylists[newName], ...customPlaylists[oldName]];
    customPlaylists[newName] = Array.from(new Set(merged));
    delete customPlaylists[oldName];
  } else {
    customPlaylists[newName] = [...customPlaylists[oldName]];
    delete customPlaylists[oldName];
  }

  activeCustomPlaylistName = newName;
  saveCustomPlaylists();
  renderMyPlaylists();
  renderPlaylistWorkspace();
}

function renderPlaylistWorkspace() {
  const workspace = ensurePlaylistWorkspace();
  if (!workspace) return;

  const title = document.getElementById("playlistWorkspaceTitle");
  const info = document.getElementById("playlistWorkspaceInfo");
  const cover = document.getElementById("playlistWorkspaceCover");
  const renameInput = document.getElementById("playlistRenameInput");
  const tracksWrap = document.getElementById("playlistWorkspaceTracks");
  const deleteBtn = document.getElementById("playlistDeleteBtn");
  const playBtn = document.getElementById("playlistWorkspacePlayBtn");
  const shuffleBtn = document.getElementById("playlistWorkspaceShuffleBtn");
  const focusBtn = document.getElementById("playlistWorkspaceFocusBtn");

  if (!activeCustomPlaylistName || !customPlaylists[activeCustomPlaylistName]) {
    workspace.classList.add("hidden");
    return;
  }

  workspace.classList.remove("hidden");

  const list = getCustomPlaylistTracks(activeCustomPlaylistName);
  if (title) title.textContent = activeCustomPlaylistName;
  if (info) info.textContent = `${list.length} song${list.length === 1 ? "" : "s"} • reorder, remove, or jump back into the library view`;
  if (cover) cover.innerHTML = buildPlaylistCoverCollage(list);
  if (renameInput) renameInput.value = activeCustomPlaylistName;
  if (playBtn) playBtn.disabled = !list.length;
  if (shuffleBtn) shuffleBtn.disabled = !list.length;
  if (focusBtn) focusBtn.disabled = !list.length;
  if (deleteBtn) deleteBtn.disabled = false;

  if (!tracksWrap) return;

  if (!list.length) {
    tracksWrap.innerHTML = `<p class="empty-message">This playlist is empty. Add songs with the + Playlist button from any track card.</p>`;
    return;
  }

  tracksWrap.innerHTML = list.map((track, index) => `
    <div class="playlist-track-row ${getCurrentTrack()?.id === track.id ? "active" : ""}" draggable="true" data-playlist-track-index="${index}">
      <button class="playlist-track-drag" type="button" aria-label="Drag to reorder">☰</button>
      ${track.cover ? `<img class="playlist-track-cover" src="${escapeHtmlAttr(track.cover)}" alt="${escapeHtmlAttr(track.title)} cover" loading="lazy" />` : `<div class="playlist-track-cover playlist-track-cover-fallback">♪</div>`}
      <button class="playlist-track-main" type="button" data-playlist-track-play="${index}">
        <strong>${escapeHtml(track.title)}</strong>
        <span>${escapeHtml(track.artist)} • ${escapeHtml(track.album)}</span>
      </button>
      <div class="playlist-track-row-actions">
        <button class="mini-action-btn" data-playlist-track-queue="${index}" type="button">Queue</button>
        <button class="mini-action-btn" data-playlist-track-remove="${index}" type="button">Remove</button>
      </div>
    </div>
  `).join("");

  tracksWrap.querySelectorAll("[data-playlist-track-play]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.playlistTrackPlay);
      const currentList = getCustomPlaylistTracks(activeCustomPlaylistName);
      startPlaybackFromList(currentList, false, index);
    });
  });

  tracksWrap.querySelectorAll("[data-playlist-track-queue]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.playlistTrackQueue);
      const currentList = getCustomPlaylistTracks(activeCustomPlaylistName);
      const track = currentList[index];
      if (!track) return;
      if (!currentQueue.length) {
        setQueue(currentList, false);
      } else {
        currentQueue.push(track);
        saveQueueState();
        renderQueue();
      }
    });
  });

  tracksWrap.querySelectorAll("[data-playlist-track-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.playlistTrackRemove);
      const ids = [...(customPlaylists[activeCustomPlaylistName] || [])];
      if (index < 0 || index >= ids.length) return;
      ids.splice(index, 1);
      customPlaylists[activeCustomPlaylistName] = ids;
      saveCustomPlaylists();
      renderMyPlaylists();
      renderPlaylistWorkspace();
    });
  });

  tracksWrap.querySelectorAll("[data-playlist-track-index]").forEach(row => {
    row.addEventListener("dragstart", () => {
      playlistItemDragIndex = Number(row.dataset.playlistTrackIndex);
      row.classList.add("dragging");
    });

    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
      playlistItemDragIndex = null;
    });

    row.addEventListener("dragover", e => {
      e.preventDefault();
    });

    row.addEventListener("drop", e => {
      e.preventDefault();
      const dropIndex = Number(row.dataset.playlistTrackIndex);
      if (playlistItemDragIndex === null || playlistItemDragIndex === dropIndex || !activeCustomPlaylistName) {
        return;
      }

      const ids = [...(customPlaylists[activeCustomPlaylistName] || [])];
      const [moved] = ids.splice(playlistItemDragIndex, 1);
      ids.splice(dropIndex, 0, moved);
      customPlaylists[activeCustomPlaylistName] = ids;
      saveCustomPlaylists();
      renderMyPlaylists();
      renderPlaylistWorkspace();
    });
  });
}

function renderMyPlaylists() {
  normalizeCustomPlaylistState();
  ensurePlaylistWorkspace();

  if (!els.myPlaylistList) return;

  const names = Object.keys(customPlaylists).sort((a, b) => a.localeCompare(b));

  if (!names.length) {
    els.myPlaylistList.innerHTML = `<p class="empty-message">No custom playlists yet.</p>`;
    activeCustomPlaylistName = null;
    renderPlaylistWorkspace();
    return;
  }

  if (!activeCustomPlaylistName || !customPlaylists[activeCustomPlaylistName]) {
    activeCustomPlaylistName = names[0];
  }

  els.myPlaylistList.classList.add("playlist-v2-grid");

  els.myPlaylistList.innerHTML = names.map(name => {
    const list = getCustomPlaylistTracks(name);
    const active = name === activeCustomPlaylistName ? "active" : "";
    return `
      <article class="playlist-card ${active}" data-playlist-card="${escapeHtmlAttr(name)}">
        <button class="playlist-card-cover" data-open-custom-playlist="${escapeHtmlAttr(name)}" type="button" aria-label="Open ${escapeHtmlAttr(name)}">
          ${buildPlaylistCoverCollage(list)}
        </button>

        <div class="playlist-card-body">
          <button class="playlist-card-title" data-open-custom-playlist="${escapeHtmlAttr(name)}" type="button">
            ${escapeHtml(name)}
          </button>
          <p class="playlist-card-meta">${list.length} song${list.length === 1 ? "" : "s"}</p>

          <div class="playlist-card-actions">
            <button class="mini-action-btn" data-custom-playlist-play="${escapeHtmlAttr(name)}" type="button">Play</button>
            <button class="mini-action-btn" data-custom-playlist-shuffle="${escapeHtmlAttr(name)}" type="button">Shuffle</button>
            <button class="mini-action-btn" data-custom-playlist-focus="${escapeHtmlAttr(name)}" type="button">Library</button>
            <button class="mini-action-btn danger-btn" data-delete-custom-playlist="${escapeHtmlAttr(name)}" type="button">Delete</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  els.myPlaylistList.querySelectorAll("[data-open-custom-playlist]").forEach(btn => {
    btn.addEventListener("click", () => setActiveCustomPlaylist(btn.dataset.openCustomPlaylist));
  });

  els.myPlaylistList.querySelectorAll("[data-custom-playlist-play]").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.customPlaylistPlay;
      const list = getCustomPlaylistTracks(name);
      if (!list.length) return;
      setActiveCustomPlaylist(name);
      startPlaybackFromList(list, false, 0);
    });
  });

  els.myPlaylistList.querySelectorAll("[data-custom-playlist-shuffle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.customPlaylistShuffle;
      const list = getCustomPlaylistTracks(name);
      if (!list.length) return;
      setActiveCustomPlaylist(name);
      startPlaybackFromList(list, true, 0);
    });
  });

  els.myPlaylistList.querySelectorAll("[data-custom-playlist-focus]").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.customPlaylistFocus;
      setActiveCustomPlaylist(name);
      applyCustomPlaylistFilter(name);
    });
  });

  els.myPlaylistList.querySelectorAll("[data-delete-custom-playlist]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const name = btn.dataset.deleteCustomPlaylist;
      delete customPlaylists[name];
      if (activeCustomPlaylistName === name) activeCustomPlaylistName = null;
      saveCustomPlaylists();
      renderMyPlaylists();
      renderPlaylistWorkspace();
    });
  });

  renderPlaylistWorkspace();
}

function createNewPlaylist() {
  playlistPickerTrackId = null;
  if (els.playlistSelect) els.playlistSelect.innerHTML = `<option value="">Choose a playlist</option>`;
  if (els.newPlaylistName) els.newPlaylistName.value = "";
  openPlaylistModal(null, els.createPlaylistBtn);
}

function saveTrackToPlaylistFromModal() {
  const typedName = els.newPlaylistName?.value?.trim();
  const selectedName = els.playlistSelect?.value?.trim();
  const playlistName = typedName || selectedName;

  if (!playlistName) return;

  if (!customPlaylists[playlistName]) {
    customPlaylists[playlistName] = [];
  }

  if (playlistPickerTrackId && !customPlaylists[playlistName].includes(playlistPickerTrackId)) {
    customPlaylists[playlistName].push(playlistPickerTrackId);
  }

  saveCustomPlaylists();
  activeCustomPlaylistName = playlistName;
  renderMyPlaylists();
  renderPlaylistWorkspace();
  closePlaylistModal();
}
