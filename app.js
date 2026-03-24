window.__AINEO_APP_JS_NAV__ = true;
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
let syncedLyricsRequestToken = 0;

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
  searchTerm: ""
};

const els = {
  mobileNavToggle: document.getElementById("mobileNavToggle"),
  siteNavLinks: document.getElementById("siteNavLinks"),

  searchInput: document.getElementById("searchInput"),
  playlistList: document.getElementById("playlistList"),
  tagList: document.getElementById("tagList"),
  albumGrid: document.getElementById("albumGrid"),

  activeFilterLabel: document.getElementById("activeFilterLabel"),
  clearFiltersBtn: document.getElementById("clearFiltersBtn"),
  featuredTrackListTitle: document.getElementById("featuredTrackListTitle"),
  featuredTrackList: document.getElementById("featuredTrackList"),

  featuredAlbumCard: document.getElementById("featuredAlbumCard"),
  featuredAlbumEyebrow: document.getElementById("featuredAlbumEyebrow"),
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
  closeAlbumBtn: document.getElementById("closeAlbumBtn"),

  resumeBanner: document.getElementById("resumeBanner"),
  resumeText: document.getElementById("resumeText"),
  resumeSongBtn: document.getElementById("resumeSongBtn"),
  dismissResumeBtn: document.getElementById("dismissResumeBtn"),

  stickyFilterBar: document.getElementById("stickyFilterBar"),
  stickyFilterBarInner: document.querySelector("#stickyFilterBar .sticky-filter-bar-inner"),
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
  playerSheetBackdrop: document.getElementById("playerSheetBackdrop"),
  playerSheetContent: document.querySelector("#playerSheet .player-sheet-content"),
  playerSheetHeader: document.querySelector("#playerSheet .player-sheet-header"),
  playerSheetBodyWrap: document.querySelector("#playerSheet .player-sheet-body"),
  playerSheetNowSection: document.querySelector("#playerSheet .player-sheet-now"),
  playerSheetPanelSection: document.querySelector("#playerSheet .player-sheet-panel"),
  playerSheetTabs: document.querySelector("#playerSheet .player-sheet-tabs"),
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
  initPlayerSheetGestures();
  initTabletStickyFilterBar();
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
    lyrics_file: track.lyrics_file || track.lyricsFile || "",
    syncedLyrics: [],
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

function renderScriptureLinks(refs, options = {}) {
  const list = Array.isArray(refs)
    ? refs.map(ref => String(ref).trim()).filter(Boolean)
    : String(refs || "")
        .split(/[;,]+/)
        .map(ref => ref.trim())
        .filter(Boolean);

  if (!list.length) return "";

  const compactClass = options.compact ? " scripture-link--compact" : "";

  return list.map(ref => {
    const url = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}`;
    return `<a class="scripture-link${compactClass}" href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(ref)}</a>`;
  }).join("");
}

function parseLrcText(lrcText) {
  return String(lrcText || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map(line => {
      const match = line.match(/^\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\](.*)$/);
      if (!match) return null;
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const text = match[3].trim();
      return Number.isFinite(minutes) && Number.isFinite(seconds) && text
        ? { time: minutes * 60 + seconds, text }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.time - b.time);
}

function findActiveLyricIndex(lines, currentTime) {
  if (!Array.isArray(lines) || !lines.length) return -1;

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (currentTime >= lines[i].time) return i;
  }

  return -1;
}

function buildLyricsMarkup(track, emptyMessage = "No lyrics available.") {
  if (!track) {
    return `<p class="empty-message">${escapeHtml(emptyMessage)}</p>`;
  }

  if (Array.isArray(track.syncedLyrics) && track.syncedLyrics.length) {
    return `
      <div class="synced-lyrics" data-track-id="${escapeHtmlAttr(track.id)}">
        ${track.syncedLyrics.map((line, index) => `
          <button class="lyric-line" type="button" data-lyric-time="${line.time.toFixed(2)}" data-lyric-index="${index}" data-track-id="${escapeHtmlAttr(track.id)}">${escapeHtml(line.text)}</button>
        `).join("")}
      </div>
    `;
  }

  if (track.lyrics) {
    return `<div class="lyrics-block">${nl2br(escapeHtml(track.lyrics))}</div>`;
  }

  return `<p class="empty-message">${escapeHtml(emptyMessage)}</p>`;
}

function renderLyricsInto(container, track, emptyMessage) {
  if (!container) return;

  container.dataset.trackId = track?.id || "";
  container.innerHTML = buildLyricsMarkup(track, emptyMessage);
  updateSyncedLyricsProgress();

  if (!track?.lyrics_file || track._syncedLyricsLoaded || track._syncedLyricsLoading) return;

  const requestToken = ++syncedLyricsRequestToken;
  track._syncedLyricsLoading = true;

  fetch(`${track.lyrics_file}?v=1`, { cache: "no-store" })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(text => {
      track.syncedLyrics = parseLrcText(text);
      track._syncedLyricsLoaded = true;
    })
    .catch(error => {
      console.warn(`Could not load synced lyrics for ${track.title}:`, error);
      track.syncedLyrics = [];
      track._syncedLyricsLoaded = true;
    })
    .finally(() => {
      track._syncedLyricsLoading = false;
      if (container.dataset.trackId === track.id && requestToken <= syncedLyricsRequestToken) {
        container.innerHTML = buildLyricsMarkup(track, emptyMessage);
        updateSyncedLyricsProgress();
      }
    });
}

function updateSyncedLyricsProgress() {
  const track = getCurrentTrack();
  const currentTime = els.audioPlayer?.currentTime || 0;
  const activeIndex = findActiveLyricIndex(track?.syncedLyrics || [], currentTime);

  document.querySelectorAll('.synced-lyrics').forEach(container => {
    const isCurrentTrack = Boolean(track && container.dataset.trackId === track.id);
    const lineEls = container.querySelectorAll('.lyric-line');

    lineEls.forEach((lineEl, index) => {
      lineEl.classList.toggle('active', isCurrentTrack && index === activeIndex);
    });

    if (!isCurrentTrack || activeIndex < 0) return;
    if (container.dataset.activeIndex === String(activeIndex)) return;

    container.dataset.activeIndex = String(activeIndex);

    const activeLine = lineEls[activeIndex];
    if (!activeLine) return;

    const panel = activeLine.closest('.player-tab-panel, .modal-body, .content-panel, .panel-card-body, .panel-card');
    if (panel && panel.offsetParent !== null) {
      activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
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
    els.audioPlayer.addEventListener("timeupdate", () => {
      updateProgressUI();
      updateSyncedLyricsProgress();
    });
    els.audioPlayer.addEventListener("loadedmetadata", () => {
      updateProgressUI();
      updateSyncedLyricsProgress();
    });
    els.audioPlayer.addEventListener("play", updatePlayButton);
    els.audioPlayer.addEventListener("pause", updatePlayButton);
    els.audioPlayer.addEventListener("ended", playNextTrack);
  }

  on(els.openLyricsBtn, "click", () => openLyricsModal(els.openLyricsBtn));

  document.addEventListener("click", event => {
    const lyricButton = event.target.closest("[data-lyric-time]");
    if (!lyricButton || !els.audioPlayer) return;

    const targetTime = Number(lyricButton.dataset.lyricTime || 0);
    if (!Number.isFinite(targetTime)) return;

    els.audioPlayer.currentTime = targetTime;
    updateProgressUI();
    updateSyncedLyricsProgress();
  });
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
    const collection = getFeaturedCollection();
    if (!collection?.tracks?.length) return;
    startPlaybackFromList(collection.tracks, false);
  });

  on(els.shuffleAlbumBtn, "click", () => {
    const collection = getFeaturedCollection();
    if (!collection?.tracks?.length) return;
    startPlaybackFromList(collection.tracks, true);
  });

  on(els.downloadAlbumBtn, "click", () => {
    const collection = getFeaturedCollection();
    if (!collection?.album?.album_zip) return;
    triggerDownload(collection.album.album_zip, `${safeFileName(collection.album.name)}.zip`);
  });

  on(els.openAlbumBtn, "click", e => {
    const collection = getFeaturedCollection();
    if (!collection) return;
    if (collection.album) {
      openAlbumModal(collection.album, e.currentTarget);
      return;
    }
    if (collection.type === "custom-playlist") {
      document.querySelector('[data-collapsible="my-playlists"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
  on(els.playerSheetPlayBtn, "click", togglePlayPause);
  on(els.playerSheetPrevBtn, "click", playPreviousTrack);
  on(els.playerSheetNextBtn, "click", playNextTrack);
  on(els.playerSheetLyricsBtn, "click", () => {
    if (window.matchMedia("(max-width: 640px)").matches) {
      closePlayerSheet();
      window.requestAnimationFrame(() => openLyricsModal(els.playerSheetLyricsBtn));
      return;
    }
    openPlayerSheetLyricsPanel();
  });
  on(els.playerSheetShareBtn, "click", shareCurrentSong);
  on(els.playerSheetFavoriteBtn, "click", toggleCurrentFavorite);
  on(els.playerSheetAddToPlaylistBtn, "click", () => {
    const track = getCurrentTrack();
    if (!track) return;
    if (window.matchMedia("(max-width: 640px)").matches) {
      closePlayerSheet();
      window.requestAnimationFrame(() => openPlaylistModalForTrack(track, els.playerSheetAddToPlaylistBtn));
      return;
    }
    openPlaylistModalForTrack(track, els.playerSheetAddToPlaylistBtn);
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
  activeCustomPlaylistName = null;
  filters.selectedAlbum = albumName;
  filters.selectedPlaylist = null;
  filters.selectedTag = null;
  filters.searchTerm = "";
  if (els.searchInput) els.searchInput.value = "";
  updateLibraryView();
  scrollFeaturedAlbumCardIntoView();
}

function setPlaylistFilter(playlistName) {
  activeCustomPlaylistName = null;
  filters.selectedAlbum = null;
  filters.selectedPlaylist = playlistName;
  filters.selectedTag = null;
  filters.searchTerm = "";
  if (els.searchInput) els.searchInput.value = "";
  updateLibraryView();
  scrollFeaturedAlbumCardIntoView();
}

function setTagFilter(tagName) {
  activeCustomPlaylistName = null;
  filters.selectedAlbum = null;
  filters.selectedPlaylist = null;
  filters.selectedTag = tagName;
  filters.searchTerm = "";
  if (els.searchInput) els.searchInput.value = "";
  updateLibraryView();
  scrollFeaturedAlbumCardIntoView();
}

function setSearchFilter(term) {
  activeCustomPlaylistName = null;
  filters.selectedAlbum = null;
  filters.selectedPlaylist = null;
  filters.selectedTag = null;
  filters.searchTerm = term.trim();
  updateLibraryView();
  scrollToTop();
}

function clearAllFilters() {
  activeCustomPlaylistName = null;
  filters.selectedAlbum = null;
  filters.selectedPlaylist = null;
  filters.selectedTag = null;
  filters.searchTerm = "";
  if (els.searchInput) els.searchInput.value = "";
  updateLibraryView();
  scrollFeaturedAlbumCardIntoView();
}

function getFilteredTracks() {
  if (activeCustomPlaylistName && customPlaylists[activeCustomPlaylistName]) {
    return getCustomPlaylistTracks(activeCustomPlaylistName);
  }

  let result = [...tracks];

  if (activeCustomPlaylistName) {
    text = `My Playlist: ${activeCustomPlaylistName}`;
    buttonText = "Clear Playlist";
    badgeText = "My Playlist";
    badgeClass = "playlist";
  } else if (filters.selectedAlbum) {
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
  const visibleAlbums = getVisibleAlbums(filteredTracks);

  if (filters.selectedAlbum) {
    return visibleAlbums.find(album => album.name === filters.selectedAlbum) || null;
  }

  return visibleAlbums.find(album => album.name === "Testimony") || visibleAlbums[0] || null;
}

function getFeaturedCollection() {
  if (activeCustomPlaylistName && customPlaylists[activeCustomPlaylistName]) {
    const tracksForPlaylist = getCustomPlaylistTracks(activeCustomPlaylistName);
    return {
      type: "custom-playlist",
      eyebrow: "My Playlist",
      title: activeCustomPlaylistName,
      subtitle: "Selected playlist",
      countText: `${tracksForPlaylist.length} song${tracksForPlaylist.length === 1 ? "" : "s"}`,
      cover: tracksForPlaylist[0]?.cover || "",
      tracks: tracksForPlaylist,
      album: null
    };
  }

  if (filters.selectedAlbum) {
    const album = getFeaturedAlbum();
    if (!album) return null;
    return {
      type: "album",
      eyebrow: "Selected Album",
      title: album.name,
      subtitle: album.artist || "Allen Parvin",
      countText: `${album.tracks.length} song${album.tracks.length === 1 ? "" : "s"}`,
      cover: album.cover || "",
      tracks: album.tracks,
      album
    };
  }

  if (filters.selectedPlaylist) {
    return {
      type: "playlist",
      eyebrow: "Selected Playlist",
      title: filters.selectedPlaylist,
      subtitle: "Library playlist",
      countText: `${filteredTracks.length} song${filteredTracks.length === 1 ? "" : "s"}`,
      cover: filteredTracks[0]?.cover || "",
      tracks: filteredTracks,
      album: null
    };
  }

  if (filters.selectedTag) {
    return {
      type: "tag",
      eyebrow: "Selected Tag",
      title: filters.selectedTag,
      subtitle: "Tagged songs",
      countText: `${filteredTracks.length} song${filteredTracks.length === 1 ? "" : "s"}`,
      cover: filteredTracks[0]?.cover || "",
      tracks: filteredTracks,
      album: null
    };
  }

  if (filters.searchTerm) {
    return {
      type: "search",
      eyebrow: "Search Results",
      title: filters.searchTerm,
      subtitle: "Selected results",
      countText: `${filteredTracks.length} song${filteredTracks.length === 1 ? "" : "s"}`,
      cover: filteredTracks[0]?.cover || "",
      tracks: filteredTracks,
      album: null
    };
  }

  const album = getFeaturedAlbum();
  if (!album) return null;
  return {
    type: "album",
    eyebrow: "Featured Album",
    title: album.name,
    subtitle: album.artist || "Allen Parvin",
    countText: `${album.tracks.length} song${album.tracks.length === 1 ? "" : "s"}`,
    cover: album.cover || "",
    tracks: album.tracks,
    album
  };
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

/* =========================
   STICKY FILTER BAR
========================= */

function isTabletLibraryViewport() {
  return window.matchMedia("(min-width: 641px) and (max-width: 1100px)").matches;
}

function getStickyFilterTopOffset() {
  const headerHeight = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
  return Math.round(headerHeight + 12);
}

function syncTabletStickyFilterBarMetrics(resetAnchor = false) {
  if (!els.stickyFilterBar || !els.stickyFilterBarInner) return;

  const barRect = els.stickyFilterBar.getBoundingClientRect();
  const width = Math.round(barRect.width);
  const left = Math.round(barRect.left);
  const height = Math.ceil(els.stickyFilterBarInner.offsetHeight);

  if (!els.stickyFilterBar.classList.contains("is-fixed") || resetAnchor) {
    els.stickyFilterBar.dataset.anchorTop = String(Math.round(window.scrollY + barRect.top));
  }

  els.stickyFilterBar.style.setProperty("--tablet-sticky-left", `${left}px`);
  els.stickyFilterBar.style.setProperty("--tablet-sticky-width", `${width}px`);
  els.stickyFilterBar.style.setProperty("--tablet-sticky-height", `${height}px`);
  els.stickyFilterBar.style.setProperty("--tablet-sticky-top", `${getStickyFilterTopOffset()}px`);
  els.stickyFilterBar.style.minHeight = `${height}px`;
}

function updateTabletStickyFilterBar(resetAnchor = false) {
  if (!els.stickyFilterBar || !els.stickyFilterBarInner) return;

  const active = hasActiveFilter() && !els.stickyFilterBar.classList.contains("hidden");
  if (!active || !isTabletLibraryViewport()) {
    els.stickyFilterBar.classList.remove("is-fixed");
    els.stickyFilterBar.style.removeProperty("--tablet-sticky-left");
    els.stickyFilterBar.style.removeProperty("--tablet-sticky-width");
    els.stickyFilterBar.style.removeProperty("--tablet-sticky-height");
    els.stickyFilterBar.style.removeProperty("--tablet-sticky-top");
    els.stickyFilterBar.style.minHeight = "";
    return;
  }

  syncTabletStickyFilterBarMetrics(resetAnchor);

  const anchorTop = Number(els.stickyFilterBar.dataset.anchorTop || 0);
  const threshold = Math.max(anchorTop - getStickyFilterTopOffset(), 0);
  const shouldFix = window.scrollY >= threshold;

  els.stickyFilterBar.classList.toggle("is-fixed", shouldFix);

  if (shouldFix) {
    syncTabletStickyFilterBarMetrics(false);
  }
}

function initTabletStickyFilterBar() {
  if (!els.stickyFilterBar || !els.stickyFilterBarInner) return;

  let ticking = false;
  const requestUpdate = (resetAnchor = false) => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateTabletStickyFilterBar(resetAnchor);
      ticking = false;
    });
  };

  window.addEventListener("scroll", () => requestUpdate(false), { passive: true });
  window.addEventListener("resize", () => requestUpdate(true));
  window.addEventListener("orientationchange", () => requestUpdate(true));

  requestUpdate(true);
}

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

  updateTabletStickyFilterBar(true);
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
  const collection = getFeaturedCollection();

  if (!collection) {
    if (els.featuredAlbumEyebrow) els.featuredAlbumEyebrow.textContent = "Selected Collection";
    if (els.featuredAlbumTitle) els.featuredAlbumTitle.textContent = "Nothing selected";
    if (els.featuredAlbumArtist) els.featuredAlbumArtist.textContent = "—";
    if (els.featuredAlbumCount) els.featuredAlbumCount.textContent = "0 songs";
    if (els.featuredAlbumCover) {
      els.featuredAlbumCover.src = "";
      els.featuredAlbumCover.alt = "No cover";
    }
    if (els.playAlbumBtn) els.playAlbumBtn.textContent = "Play";
    if (els.shuffleAlbumBtn) els.shuffleAlbumBtn.textContent = "Shuffle";
    if (els.downloadAlbumBtn) els.downloadAlbumBtn.style.display = "none";
    if (els.openAlbumBtn) els.openAlbumBtn.style.display = "none";
    return;
  }

  if (els.featuredAlbumEyebrow) els.featuredAlbumEyebrow.textContent = collection.eyebrow;
  if (els.featuredAlbumCover) {
    els.featuredAlbumCover.src = collection.cover || "";
    els.featuredAlbumCover.alt = `${collection.title} cover`;
  }
  if (els.featuredAlbumTitle) els.featuredAlbumTitle.textContent = collection.title;
  if (els.featuredAlbumArtist) els.featuredAlbumArtist.textContent = collection.subtitle;
  if (els.featuredAlbumCount) els.featuredAlbumCount.textContent = collection.countText;

  if (els.playAlbumBtn) els.playAlbumBtn.textContent = collection.type === "album" ? "Play Album" : "Play Selection";
  if (els.shuffleAlbumBtn) els.shuffleAlbumBtn.textContent = collection.type === "album" ? "Shuffle Album" : "Shuffle Selection";
  if (els.downloadAlbumBtn) els.downloadAlbumBtn.style.display = collection.album?.album_zip ? "inline-flex" : "none";
  if (els.openAlbumBtn) {
    if (collection.album) {
      els.openAlbumBtn.style.display = "inline-flex";
      els.openAlbumBtn.textContent = "Open Album";
    } else if (collection.type === "custom-playlist") {
      els.openAlbumBtn.style.display = "inline-flex";
      els.openAlbumBtn.textContent = "My Playlists";
    } else {
      els.openAlbumBtn.style.display = "none";
    }
  }
}

function getFeaturedTrackPlayState(track) {
  const isCurrentTrack = getCurrentTrack()?.id === track?.id;
  const isPlaying = Boolean(isCurrentTrack && els.audioPlayer && !els.audioPlayer.paused && els.audioPlayer.src);
  return {
    isCurrentTrack,
    isPlaying,
    label: isPlaying ? "❚❚" : "▶",
    action: isPlaying ? "Pause" : "Play"
  };
}

function renderFeaturedTrackList() {
  if (!els.featuredTrackList || !els.featuredTrackListTitle) return;

  const collection = getFeaturedCollection();

  if (!collection) {
    els.featuredTrackListTitle.textContent = "Tracks";
    els.featuredTrackList.innerHTML = `<p class="empty-message">No tracks available.</p>`;
    return;
  }

  els.featuredTrackListTitle.textContent = `${collection.title} Songs`;

  if (!collection.tracks.length) {
    els.featuredTrackList.innerHTML = `<p class="empty-message">No tracks available.</p>`;
    return;
  }

  if (collection.type === "custom-playlist") {
    els.featuredTrackList.innerHTML = collection.tracks.map((track, index) => `
      <div class="playlist-track-row featured-playlist-track-row ${getCurrentTrack()?.id === track.id ? "active" : ""}" draggable="true" data-playlist-track-index="${index}">
        <button class="playlist-track-drag" type="button" aria-label="Drag to reorder">☰</button>
        ${track.cover ? `<img class="playlist-track-cover" src="${escapeHtmlAttr(track.cover)}" alt="${escapeHtmlAttr(track.title)} cover" loading="lazy" />` : `<div class="playlist-track-cover playlist-track-cover-fallback">♪</div>`}
        <button class="playlist-track-main" type="button" data-playlist-track-play="${index}">
          <strong>${escapeHtml(track.title)}</strong>
          <span>${escapeHtml(track.artist)} • ${escapeHtml(track.album)}</span>
        </button>
        <div class="playlist-track-row-actions">
          <button class="mini-action-btn" data-playlist-track-queue="${index}" type="button">Queue</button>
          <button class="mini-action-btn danger-btn" data-playlist-track-remove="${index}" type="button">Remove</button>
        </div>
      </div>
    `).join("");

    const tracksWrap = els.featuredTrackList;
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
        filteredTracks = getFilteredTracks();
        renderMyPlaylists();
        renderFeaturedAlbum();
        renderFeaturedTrackList();
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
        if (playlistItemDragIndex === null || playlistItemDragIndex === dropIndex || !activeCustomPlaylistName) return;
        const ids = [...(customPlaylists[activeCustomPlaylistName] || [])];
        const [moved] = ids.splice(playlistItemDragIndex, 1);
        ids.splice(dropIndex, 0, moved);
        customPlaylists[activeCustomPlaylistName] = ids;
        saveCustomPlaylists();
        filteredTracks = getFilteredTracks();
        renderMyPlaylists();
        renderFeaturedTrackList();
      });
    });

    return;
  }

  els.featuredTrackList.innerHTML = collection.tracks
    .map((track, index) => {
      const playState = getFeaturedTrackPlayState(track);
      const isPlaying = playState.isCurrentTrack ? "playing" : "";
      const isFav = isFavorite(track) ? "favorited" : "";

      return `
        <div class="featured-track-row ${isPlaying}" data-track-id="${escapeHtmlAttr(track.id)}">
          <button class="featured-track-play ${playState.isPlaying ? "is-playing" : ""}" data-featured-index="${index}" data-track-id="${escapeHtmlAttr(track.id)}" data-track-title="${escapeHtmlAttr(track.title)}" type="button" aria-label="${playState.action} ${escapeHtmlAttr(track.title)}" aria-pressed="${playState.isPlaying ? "true" : "false"}">
            ${playState.label}
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
            <button class="mini-action-btn ${isFav}" data-favorite-track="${escapeHtmlAttr(track.id)}" type="button">${isFavorite(track) ? "★" : "☆"}</button>
            <button class="mini-action-btn" data-lyrics-track="${escapeHtmlAttr(track.id)}" type="button">Lyrics</button>
            <button class="mini-action-btn" data-add-playlist-track="${escapeHtmlAttr(track.id)}" type="button">+ Playlist</button>
            <button class="mini-action-btn" data-save-offline-track="${escapeHtmlAttr(track.id)}" type="button">${isDownloaded(track) ? "Saved" : "Offline"}</button>
            <button class="mini-action-btn" data-download-track="${escapeHtmlAttr(track.id)}" type="button">Download</button>
          </div>
        </div>
      `;
    })
    .join("");

  els.featuredTrackList.querySelectorAll("[data-featured-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.featuredIndex);
      const track = collection.tracks[idx];
      if (!track) return;
      if (getCurrentTrack()?.id === track.id && els.audioPlayer?.src) {
        togglePlayPause();
        return;
      }
      setQueue(collection.tracks, false);
      playFromQueueIndex(idx);
    });
  });

  els.featuredTrackList.querySelectorAll("[data-favorite-track]").forEach(btn => {
    btn.addEventListener("click", () => {
      const track = collection.tracks.find(t => t.id === btn.dataset.favoriteTrack);
      if (!track) return;
      toggleFavorite(track);
      renderFeaturedTrackList();
    });
  });

  els.featuredTrackList.querySelectorAll("[data-lyrics-track]").forEach(btn => {
    btn.addEventListener("click", e => {
      const track = collection.tracks.find(t => t.id === btn.dataset.lyricsTrack);
      if (!track) return;
      openLyricsModalForTrack(track, e.currentTarget);
    });
  });

  els.featuredTrackList.querySelectorAll("[data-download-track]").forEach(btn => {
    btn.addEventListener("click", () => {
      const track = collection.tracks.find(t => t.id === btn.dataset.downloadTrack);
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

function syncFeaturedTrackPlayButtons() {
  if (!els.featuredTrackList) return;

  const currentTrack = getCurrentTrack();

  els.featuredTrackList.querySelectorAll(".featured-track-row").forEach(row => {
    const isCurrentTrack = Boolean(currentTrack && row.dataset.trackId === currentTrack.id);
    row.classList.toggle("playing", isCurrentTrack);
  });

  els.featuredTrackList.querySelectorAll(".featured-track-play[data-track-id]").forEach(btn => {
    const trackId = btn.dataset.trackId;
    const trackTitle = btn.dataset.trackTitle || "track";
    const isCurrentTrack = Boolean(currentTrack && trackId === currentTrack.id);
    const isPlaying = Boolean(isCurrentTrack && els.audioPlayer && !els.audioPlayer.paused && els.audioPlayer.src);

    btn.textContent = isPlaying ? "❚❚" : "▶";
    btn.classList.toggle("is-playing", isPlaying);
    btn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    btn.setAttribute("aria-label", `${isPlaying ? "Pause" : "Play"} ${trackTitle}`);
  });
}

function syncQueuePlaybackUI() {
  const currentTrack = getCurrentTrack();
  const isPlaying = Boolean(currentTrack && els.audioPlayer && !els.audioPlayer.paused && els.audioPlayer.src);

  document.querySelectorAll('.queue-row').forEach(row => {
    const isCurrentTrack = Boolean(currentTrack && row.dataset.trackId === currentTrack.id);
    row.classList.toggle('active', isCurrentTrack);
    row.classList.toggle('is-current', isCurrentTrack);
    row.classList.toggle('is-playing', isCurrentTrack && isPlaying);
    row.classList.toggle('is-paused', isCurrentTrack && !isPlaying);
  });

  document.querySelectorAll('.queue-play-btn[data-queue-play]').forEach(btn => {
    const row = btn.closest('.queue-row');
    const trackId = row?.dataset.trackId || '';
    const trackTitle = row?.querySelector('.queue-title-row h3')?.textContent?.trim() || 'track';
    const isCurrentTrack = Boolean(currentTrack && trackId === currentTrack.id);
    const buttonShowsPause = isCurrentTrack && isPlaying;

    btn.textContent = buttonShowsPause ? '❚❚' : '▶';
    btn.classList.toggle('is-playing', buttonShowsPause);
    btn.classList.toggle('is-current', isCurrentTrack);
    btn.setAttribute('aria-pressed', buttonShowsPause ? 'true' : 'false');
    btn.setAttribute('aria-label', `${buttonShowsPause ? 'Pause' : 'Play'} ${trackTitle}`);
  });
}

function updatePlayButton() {
  if (!els.audioPlayer) return;
  const label = els.audioPlayer.paused ? "▶" : "❚❚";
  if (els.playBtn) els.playBtn.textContent = label;
  if (els.playerSheetPlayBtn) els.playerSheetPlayBtn.textContent = label;
  syncFeaturedTrackPlayButtons();
  syncQueuePlaybackUI();
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

  updateSyncedLyricsProgress();
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
  renderLyricsInto(els.lyricsContent, track, "Select a song to view lyrics.");
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
  renderLyricsInto(els.lyricsModalBody, track, "No lyrics available.");

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
          <button class="album-track-row ${active}" data-album-track-index="${index}" data-track-id="${escapeHtmlAttr(track.id)}" type="button">
            <div class="album-track-main">
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
            </div>
          </button>
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
  normalizeCustomPlaylistState();
  renderPlaylistWorkspace();

  if (!els.myPlaylistList) return;

  const names = Object.keys(customPlaylists).sort((a, b) => a.localeCompare(b));

  if (!names.length) {
    els.myPlaylistList.innerHTML = `<p class="empty-message">No custom playlists yet.</p>`;
    activeCustomPlaylistName = null;
    return;
  }

  els.myPlaylistList.classList.add("playlist-v2-grid");

  els.myPlaylistList.innerHTML = names.map(name => {
    const list = getCustomPlaylistTracks(name);
    const active = name === activeCustomPlaylistName ? "active" : "";
    return `
      <article class="playlist-card playlist-card-compact ${active}" data-playlist-card="${escapeHtmlAttr(name)}">
        <button class="playlist-card-cover" data-open-custom-playlist="${escapeHtmlAttr(name)}" type="button" aria-label="Open ${escapeHtmlAttr(name)}">${buildPlaylistCoverCollage(list)}</button>
        <div class="playlist-card-body">
          <button class="playlist-card-title" data-open-custom-playlist="${escapeHtmlAttr(name)}" type="button">${escapeHtml(name)}</button>
          <p class="playlist-card-meta">${list.length} song${list.length === 1 ? "" : "s"}</p>
        </div>
        <div class="playlist-card-actions compact-actions">
          <button class="mini-action-btn" data-custom-playlist-play="${escapeHtmlAttr(name)}" type="button">Play</button>
          <button class="mini-action-btn danger-btn" data-delete-custom-playlist="${escapeHtmlAttr(name)}" type="button">Delete</button>
        </div>
      </article>
    `;
  }).join("");

  els.myPlaylistList.querySelectorAll("[data-open-custom-playlist]").forEach(btn => {
    btn.addEventListener("click", () => applyCustomPlaylistFilter(btn.dataset.openCustomPlaylist));
  });

  els.myPlaylistList.querySelectorAll("[data-custom-playlist-play]").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.customPlaylistPlay;
      const list = getCustomPlaylistTracks(name);
      if (!list.length) return;
      activeCustomPlaylistName = name;
      renderMyPlaylists();
      startPlaybackFromList(list, false, 0);
    });
  });

  els.myPlaylistList.querySelectorAll("[data-delete-custom-playlist]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const name = btn.dataset.deleteCustomPlaylist;
      delete customPlaylists[name];
      if (activeCustomPlaylistName === name) activeCustomPlaylistName = null;
      saveCustomPlaylists();
      updateLibraryView();
      renderMyPlaylists();
    });
  });
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
