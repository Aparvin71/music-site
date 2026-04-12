/* v42.4.2 background update detection */
window.__AINEO_APP_JS_NAV__ = true;
let tracks = [];
let filteredTracks = [];
let currentTrackIndex = -1;
let currentQueue = [];
let currentQueueIndex = -1;
let favorites = [];
let recentlyPlayed = [];
let resumeTrackSrc = null;
let resumeTrackTime = 0;
let resumeTrackTitle = '';
let shuffleModeEnabled = false;
let repeatMode = "off";
let pendingResumeSeek = null;
let lastResumePersistAt = 0;
let lastFocusedElement = null;
let customPlaylists = {};
let downloadedTracks = [];
window.downloadedTracks = downloadedTracks;
let playStats = {};
let playlistPickerTrackId = null;
let playerSheetTab = "lyrics";
let queueDragIndex = null;
let syncedLyricsRequestToken = 0;
let autoScrollEnabled = loadAutoScrollEnabled();
let actionSheetTrackId = "";
let actionSheetTriggerEl = null;
let previewAudio = null;
let previewTrackId = '';
let previewHoldTimer = null;
let suppressPreviewClickUntil = 0;
let visualizerFrame = 0;
let visualizerBars = [];
let visualizerLeftBars = [];
let visualizerRightBars = [];
let visualizerTick = 0;
let visualizerCanvas = null;
let visualizerCtx = null;
let visualizerAudioContext = null;
let visualizerAnalyser = null;
let visualizerSourceNode = null;
let visualizerFreqData = null;
let visualizerWaveData = null;
let visualizerAudioSetupAttempted = false;
let visualizerUseFallback = false;
let lyricsSyncFrame = 0;
const DEFAULT_LYRICS_GLOBAL_OFFSET = -0.12;
let smartQueueSuggestionId = '';

const STORAGE_KEYS = (window.AineoConfig && window.AineoConfig.storageKeys) || {
  favorites: "aineo_favorites",
  recentlyPlayed: "aineo_recently_played",
  resume: "aineo_resume",
  customPlaylists: "aineo_custom_playlists",
  downloadedTracks: "aineo_downloaded_tracks",
  playStats: "aineo_play_stats",
  lastQueue: "aineo_last_queue",
  playbackModes: "aineo_playback_modes",
  playerState: "aineo_player_state"
};

const filters = {
  selectedAlbum: null,
  selectedPlaylist: null,
  selectedTag: null,
  selectedSmartPlaylist: null,
  selectedCustomPlaylist: null,
  searchTerm: "",
  searchScope: "all"
};

let currentCollectionKey = "all-songs";

const els = {
  mobileNavToggle: document.getElementById("mobileNavToggle"),
  siteNavLinks: document.getElementById("siteNavLinks"),

  searchInput: document.getElementById("searchInput"),
  searchScopeBar: document.getElementById("searchScopeBar"),
  searchMeta: document.getElementById("searchMeta"),
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
  featuredCollectionStats: document.getElementById("featuredCollectionStats"),
  featuredCollectionLead: document.getElementById("featuredCollectionLead"),
  featuredCollectionPreview: document.getElementById("featuredCollectionPreview"),
  playAlbumBtn: document.getElementById("playAlbumBtn"),
  shuffleAlbumBtn: document.getElementById("shuffleAlbumBtn"),
  saveAlbumOfflineBtn: document.getElementById("saveAlbumOfflineBtn"),
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
  albumModalSaveOfflineBtn: document.getElementById("albumModalSaveOfflineBtn"),
  albumModalDownloadBtn: document.getElementById("albumModalDownloadBtn"),
  closeAlbumBtn: document.getElementById("closeAlbumBtn"),

  resumeBanner: document.getElementById("resumeBanner"),
  resumeText: document.getElementById("resumeText"),
  resumeSongBtn: document.getElementById("resumeSongBtn"),
  dismissResumeBtn: document.getElementById("dismissResumeBtn"),
  continueListeningCard: document.getElementById("continueListeningCard"),
  continueListeningCover: document.getElementById("continueListeningCover"),
  continueListeningTitle: document.getElementById("continueListeningTitle"),
  continueListeningMeta: document.getElementById("continueListeningMeta"),

  stickyFilterBar: document.getElementById("stickyFilterBar"),
  stickyFilterBarInner: document.querySelector("#stickyFilterBar .sticky-filter-bar-inner"),
  stickyFilterOverlayMount: document.getElementById("stickyFilterOverlayMount"),
  filterTypeBadge: document.getElementById("filterTypeBadge"),

  queueSectionBody: document.getElementById("queueSectionBody"),

  createPlaylistBtn: document.getElementById("createPlaylistBtn"),
  myPlaylistList: document.getElementById("myPlaylistList"),
  downloadedList: document.getElementById("downloadedList"),

  addToPlaylistBtn: document.getElementById("addToPlaylistBtn"),
  saveOfflineBtn: document.getElementById("saveOfflineBtn"),
  openPlayerSheetBtn: document.getElementById("openPlayerSheetBtn"),
  stickyPlayer: document.querySelector(".sticky-player"),

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
  playerSheetCoverWrap: document.querySelector("#playerSheet .player-sheet-cover-wrap"),
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
  shuffleModeBtn: document.getElementById("shuffleModeBtn"),
  repeatModeBtn: document.getElementById("repeatModeBtn"),
  playNextBtn: document.getElementById("playNextBtn"),
  playerSheetShuffleBtn: document.getElementById("playerSheetShuffleBtn"),
  playerSheetRepeatBtn: document.getElementById("playerSheetRepeatBtn"),
  playerSheetPlayNextBtn: document.getElementById("playerSheetPlayNextBtn"),  playerSheetAutoScrollBtn: document.getElementById("playerSheetAutoScrollBtn"),
  playerSheetAddToPlaylistBtn: document.getElementById("playerSheetAddToPlaylistBtn"),
  playerSheetSaveOfflineBtn: document.getElementById("playerSheetSaveOfflineBtn"),
  playerSheetShareBtn: document.getElementById("playerSheetShareBtn"),
  playerSheetFavoriteBtn: document.getElementById("playerSheetFavoriteBtn"),
  playerSheetLyricsPanel: document.getElementById("playerSheetLyricsPanel"),
  playerSheetScripturePanel: document.getElementById("playerSheetScripturePanel"),  offlineStatusMount: document.getElementById("offlineStatusMount"),
  trackActionSheet: document.getElementById("trackActionSheet"),
  trackActionSheetBackdrop: document.getElementById("trackActionSheetBackdrop"),
  trackActionSheetTitle: document.getElementById("trackActionSheetTitle"),
  trackActionSheetMeta: document.getElementById("trackActionSheetMeta"),
  trackActionPlayNextBtn: document.getElementById("trackActionPlayNextBtn"),
  trackActionAddPlaylistBtn: document.getElementById("trackActionAddPlaylistBtn"),
  trackActionSaveOfflineBtn: document.getElementById("trackActionSaveOfflineBtn"),
  trackActionGoAlbumBtn: document.getElementById("trackActionGoAlbumBtn"),
  trackActionCloseBtn: document.getElementById("trackActionCloseBtn")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  loadStoredData();
  bindUI();
  bindMediaSessionHandlers();
  initOfflineStatus();
  initCollapsibles();
  initActionButtonIsolation();
  initSmoothHashJumps();
  initMobilePlayerDrawer();
  initMiniVisualizer();
  initHoldToPreview();
  initMobileNav();
  initPlayerSheetGestures();
  initTabletStickyFilterBar();
  await loadTracks();
  currentCollectionKey = 'all-songs';
  restoreSavedQueue();
  updateLibraryView();
  restoreSavedPlaybackContext();
  renderFavorites();
  renderRecentlyPlayed();
  renderMyPlaylists();
  renderDownloadedSongs();
  ensureOfflineAssetsReady();
  renderQueue();
  showResumeBannerIfAvailable();
  updatePlaybackModeButtons();
  updatePlayerSheet();
  handleSongQueryParam();
}


function saveTracksCache(nextTracks) {
  try {
    localStorage.setItem(STORAGE_KEYS.tracksCache || "aineo_tracks_cache", JSON.stringify(nextTracks));
  } catch (error) {
    console.warn("Could not cache tracks locally:", error);
  }
}

function loadTracksCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.tracksCache || "aineo_tracks_cache");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function ensureOfflineStatusMount() {
  if (els.offlineStatusMount) return els.offlineStatusMount;
  const main = document.getElementById("mainContent");
  if (!main) return null;
  const mount = document.createElement("section");
  mount.id = "offlineStatusMount";
  mount.className = "offline-status-wrap";
  main.insertBefore(mount, main.firstChild);
  els.offlineStatusMount = mount;
  return mount;
}

function renderOfflineStatus({ forceVisible = false, emphasizeSaved = false } = {}) {
  const mount = ensureOfflineStatusMount();
  if (!mount) return;

  const isOffline = navigator.onLine === false;
  const savedCount = Array.isArray(downloadedTracks) ? downloadedTracks.length : 0;
  const shouldShow = forceVisible || isOffline;

  if (!shouldShow) {
    mount.innerHTML = '';
    mount.classList.add('hidden');
    return;
  }

  mount.classList.remove('hidden');
  mount.innerHTML = `
    <div class="offline-status-card${isOffline ? ' is-offline' : ''}">
      <div class="offline-status-copy">
        <p class="eyebrow">${isOffline ? 'Offline Mode' : 'Connection Restored'}</p>
        <h2>${isOffline ? 'You are offline' : 'Back online'}</h2>
        <p>${isOffline
          ? (savedCount
              ? `Showing cached pages and your ${savedCount} saved offline song${savedCount === 1 ? '' : 's'}. Look for “Saved Offline ✓” on tracks and collections. Songs that were not saved may need internet before they can play.`
              : 'Showing cached pages and library data. Save songs offline while connected to make them playable without internet.')
          : (emphasizeSaved
              ? 'Your saved songs and cached pages are ready for offline use.'
              : 'Streaming and offline saving are fully available again.')}
        </p>
      </div>
      <div class="offline-status-actions">
        <button type="button" class="action-btn secondary-btn small-action-btn" data-scroll-offline>${savedCount ? 'View Downloaded' : 'How Offline Works'}</button>
      </div>
    </div>
  `;

  mount.querySelector('[data-scroll-offline]')?.addEventListener('click', () => {
    const target = savedCount ? document.getElementById('downloadedList') : document.getElementById('downloadedSection');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function initOfflineStatus() {
  ensureOfflineStatusMount();
  renderOfflineStatus();
  window.addEventListener('online', () => renderOfflineStatus({ forceVisible: true, emphasizeSaved: true }));
  window.addEventListener('offline', () => renderOfflineStatus({ forceVisible: true }));
}

function ensureOfflineAssetsReady() {
  if (!navigator.onLine || !tracks.length || !downloadedTracks.length || !("serviceWorker" in navigator) || !navigator.serviceWorker.controller) return;
  const savedTracks = downloadedTracks
    .map(id => tracks.find(track => track.id === id))
    .filter(Boolean);

  const audioUrls = savedTracks.map(track => track.src).filter(Boolean);
  const artworkUrls = savedTracks.map(track => track.cover).filter(Boolean);
  const lyricUrls = savedTracks.map(track => track.lyrics_file).filter(Boolean);
  if (audioUrls.length) navigator.serviceWorker.controller.postMessage({ type: 'CACHE_AUDIO_URLS', urls: audioUrls });
  if (artworkUrls.length) navigator.serviceWorker.controller.postMessage({ type: 'CACHE_URLS', urls: artworkUrls });
  if (lyricUrls.length) navigator.serviceWorker.controller.postMessage({ type: 'CACHE_URLS', urls: lyricUrls });
}

/* =========================
   LOAD + NORMALIZE
========================= */

async function loadTracks() {
  try {
    const data = await (window.AineoShared?.fetchJson ? window.AineoShared.fetchJson("tracks.json", []) : fetch("tracks.json", { cache: "no-cache" }).then(res => res.json()));
    const nextTracks = Array.isArray(data)
      ? data.map((track, index) => normalizeTrack(track, index))
      : [];

    tracks = nextTracks;
    filteredTracks = [...tracks];
    saveTracksCache(nextTracks);
    try {
      const signature = String((Array.isArray(data) ? JSON.stringify(data) : "[]").length) + ":" + nextTracks.length + ":" + (nextTracks[0]?.id || "") + ":" + (nextTracks[nextTracks.length - 1]?.id || "");
      window.AineoAppUpdates?.rememberTracksSignature?.(signature, "./tracks.json");
    } catch (error) {}
  } catch (error) {
    console.error("Error loading tracks.json:", error);
    const cachedTracks = loadTracksCache();
    if (cachedTracks.length) {
      tracks = cachedTracks.map((track, index) => normalizeTrack(track, index));
      filteredTracks = [...tracks];
      renderOfflineStatus({ forceVisible: true, emphasizeSaved: true });
      return;
    }
    tracks = [];
    filteredTracks = [];
    renderEmptyLibraryState("Could not load music library.");
  }
}

const normalizeTrack = (window.AineoData && window.AineoData.normalizeTrack)
  ? window.AineoData.normalizeTrack
  : function normalizeTrack(track, index) {
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
        lyrics_offset: Number(track.lyrics_offset ?? track.lyricsOffset ?? 0) || 0,
        syncedLyrics: [],
        tags,
        playlists,
        scripture_references: scriptureRefs,
        trackNumber: track.trackNumber || track.track || "",
        description: track.description || "",
        album_zip: track.album_zip || ""
      };
    };

const normalizeStringArray = (window.AineoData && window.AineoData.normalizeStringArray)
  ? window.AineoData.normalizeStringArray
  : function normalizeStringArray(value) {
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
    };

const makeTrackId = (window.AineoData && window.AineoData.makeTrackId)
  ? window.AineoData.makeTrackId
  : function makeTrackId(track, index) {
      return `${track.title || "track"}__${track.album || "album"}__${index}`;
    };

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
  return window.AineoLyricsEngine.parseLrcText(lrcText);
}

function findActiveLyricIndex(lines, currentTime) {
  return window.AineoLyricsEngine.findActiveLyricIndex(lines, currentTime);
}

function getRenderableLyricsLines(track) {
  return window.AineoLyricsEngine.getRenderableLyricsLines(track);
}

function saveAutoScrollEnabled(value) {
  try {
    localStorage.setItem("autoScrollEnabled", value ? "1" : "0");
  } catch (error) {
    console.warn("Could not save auto-scroll preference:", error);
  }
}

function loadAutoScrollEnabled() {
  try {
    return localStorage.getItem("autoScrollEnabled") !== "0";
  } catch (error) {
    return true;
  }
}

function getGlobalLyricsOffset() {
  try {
    const raw = localStorage.getItem("aineoLyricsGlobalOffset");
    if (raw == null || raw === "") return DEFAULT_LYRICS_GLOBAL_OFFSET;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : DEFAULT_LYRICS_GLOBAL_OFFSET;
  } catch (error) {
    return DEFAULT_LYRICS_GLOBAL_OFFSET;
  }
}

function getTrackLyricsOffset(track) {
  const offset = Number(track?.lyrics_offset ?? track?.lyricsOffset ?? 0);
  return Number.isFinite(offset) ? offset : 0;
}

function getEffectiveLyricsTime(track, currentTime) {
  const time = Number(currentTime || 0) + getGlobalLyricsOffset() + getTrackLyricsOffset(track);
  return time > 0 ? time : 0;
}

function stopLyricsSyncLoop() {
  if (lyricsSyncFrame) {
    window.cancelAnimationFrame(lyricsSyncFrame);
    lyricsSyncFrame = null;
  }
}

function runLyricsSyncLoop() {
  const audio = els.audioPlayer;
  if (!audio || audio.paused || audio.ended) {
    stopLyricsSyncLoop();
    return;
  }

  updateSyncedLyricsProgress();
  lyricsSyncFrame = window.requestAnimationFrame(runLyricsSyncLoop);
}

function startLyricsSyncLoop() {
  stopLyricsSyncLoop();
  if (!els.audioPlayer || els.audioPlayer.paused) return;
  lyricsSyncFrame = window.requestAnimationFrame(runLyricsSyncLoop);
}

function updateAutoScrollToggleUI() {
  if (!els.playerSheetAutoScrollBtn) return;
  els.playerSheetAutoScrollBtn.textContent = autoScrollEnabled ? "Auto-Scroll On" : "Auto-Scroll Off";
  els.playerSheetAutoScrollBtn.title = autoScrollEnabled ? "Turn auto-scroll off" : "Turn auto-scroll on";
  els.playerSheetAutoScrollBtn.classList.toggle("is-on", autoScrollEnabled);
  els.playerSheetAutoScrollBtn.classList.toggle("is-off", !autoScrollEnabled);
  els.playerSheetAutoScrollBtn.setAttribute("aria-pressed", autoScrollEnabled ? "true" : "false");
}

function toggleAutoScroll() {
  autoScrollEnabled = !autoScrollEnabled;
  saveAutoScrollEnabled(autoScrollEnabled);
  updateAutoScrollToggleUI();
  updateSyncedLyricsProgress();
}

function buildLyricsMarkup(track, emptyMessage = "No lyrics available.") {
  return window.AineoLyricsEngine.buildLyricsMarkup(track, emptyMessage, {
    escapeHtml,
    escapeHtmlAttr,
    nl2br
  });
}

function renderLyricsInto(container, track, emptyMessage) {
  window.AineoLyricsEngine.renderLyricsInto({
    container,
    track,
    emptyMessage,
    requestToken: ++syncedLyricsRequestToken,
    onRendered: () => window.requestAnimationFrame(() => updateSyncedLyricsProgress()),
    escapeHtml,
    escapeHtmlAttr,
    nl2br
  });
}

function prefetchTrackLyrics(track) {
  return window.AineoLyricsEngine?.preloadSyncedLyrics?.(track) || Promise.resolve([]);
}

function updateSyncedLyricsProgress() {
  const track = getCurrentTrack();
  window.AineoLyricsEngine.updateProgress({
    track,
    currentTime: getEffectiveLyricsTime(track, els.audioPlayer?.currentTime || 0),
    autoScrollEnabled
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
  window.downloadedTracks = downloadedTracks;
  playStats = loadJsonFromStorage(STORAGE_KEYS.playStats, {});

  const resume = loadJsonFromStorage(STORAGE_KEYS.resume, null);
  resumeTrackSrc = resume?.src || null;
  resumeTrackTime = Number(resume?.time || 0) || 0;
  resumeTrackTitle = resume?.title || "";

  const playbackModes = loadJsonFromStorage(STORAGE_KEYS.playbackModes, null);
  shuffleModeEnabled = Boolean(playbackModes?.shuffle);
  repeatMode = ["off", "all", "one"].includes(playbackModes?.repeat) ? playbackModes.repeat : "off";
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
  renderOfflineStatus({ forceVisible: navigator.onLine === false });
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

function savePlayerState(track = getCurrentTrack(), timeOverride) {
  const player = els.audioPlayer;
  const resumeTime = Math.max(0, Number(timeOverride ?? player?.currentTime ?? 0) || 0);
  const queueTrackIds = Array.isArray(currentQueue) ? currentQueue.map(item => item.id).filter(Boolean) : [];
  const state = {
    trackId: track?.id || "",
    trackSrc: track?.src || "",
    time: resumeTime,
    paused: Boolean(player?.paused ?? true),
    queueTrackIds,
    queueIndex: currentQueueIndex,
    collectionKey: getCurrentCollectionKey?.() || currentCollectionKey || "all-songs",
    updatedAt: Date.now()
  };

  localStorage.setItem(STORAGE_KEYS.playerState, JSON.stringify(state));
}

function restoreSavedPlaybackContext() {
  const state = loadJsonFromStorage(STORAGE_KEYS.playerState, null);
  if (!state) return;

  if (Array.isArray(state.queueTrackIds) && state.queueTrackIds.length) {
    const queueTracks = state.queueTrackIds
      .map(id => tracks.find(track => track.id === id))
      .filter(Boolean);
    if (queueTracks.length) {
      currentQueue = queueTracks;
      currentQueueIndex = Math.max(0, Math.min(Number(state.queueIndex) || 0, queueTracks.length - 1));
    }
  }

  const stateTrack = tracks.find(track => track.id === state.trackId)
    || tracks.find(track => track.src === state.trackSrc)
    || null;
  if (!stateTrack) return;

  const queueIndex = currentQueue.findIndex(track => track.id === stateTrack.id);
  if (queueIndex >= 0) currentQueueIndex = queueIndex;
  currentTrackIndex = filteredTracks.findIndex(track => track.id === stateTrack.id);
  resumeTrackSrc = stateTrack.src;
  resumeTrackTime = Math.max(0, Number(state.time) || 0);
  resumeTrackTitle = stateTrack.title || "";

  updateNowPlaying(stateTrack);
  updateMediaSessionMetadata(stateTrack);
  updateLyricsPanel(stateTrack);
  updateScripturePanel(stateTrack);
  renderQueue();
}

function saveResume(track, timeOverride) {
  if (!track) return;

  const resumeTime = Math.max(0, Number(timeOverride ?? els.audioPlayer?.currentTime ?? 0) || 0);

  localStorage.setItem(
    STORAGE_KEYS.resume,
    JSON.stringify({
      trackId: track.id,
      src: track.src,
      title: track.title,
      artist: track.artist,
      album: track.album,
      time: resumeTime
    })
  );

  savePlayerState(track, resumeTime);

  resumeTrackSrc = track.src;
  resumeTrackTime = resumeTime;
  resumeTrackTitle = track.title || "";
}

function clearResume() {
  localStorage.removeItem(STORAGE_KEYS.resume);
  localStorage.removeItem(STORAGE_KEYS.playerState);
  resumeTrackSrc = null;
  resumeTrackTime = 0;
  resumeTrackTitle = "";
}
function savePlaybackModes() {
  localStorage.setItem(
    STORAGE_KEYS.playbackModes,
    JSON.stringify({ shuffle: shuffleModeEnabled, repeat: repeatMode })
  );
}

function formatSecondsToClock(totalSeconds) {
  const total = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function updatePlaybackModeButtons() {
  const repeatLabelMap = { off: "Repeat Off", all: "Repeat All", one: "Repeat One" };
  [els.shuffleModeBtn, els.playerSheetShuffleBtn].forEach(btn => {
    if (!btn) return;
    btn.classList.toggle("is-active", shuffleModeEnabled);
    btn.dataset.modeState = shuffleModeEnabled ? "on" : "off";
    btn.setAttribute("aria-pressed", shuffleModeEnabled ? "true" : "false");
    btn.setAttribute("aria-label", shuffleModeEnabled ? "Shuffle On" : "Shuffle Off");
    btn.title = shuffleModeEnabled ? "Shuffle On" : "Shuffle Off";
    btn.textContent = "🔀";
  });
  [els.repeatModeBtn, els.playerSheetRepeatBtn].forEach(btn => {
    if (!btn) return;
    btn.classList.toggle("is-active", repeatMode !== "off");
    btn.dataset.repeatMode = repeatMode;
    btn.dataset.modeState = repeatMode;
    btn.setAttribute("aria-pressed", repeatMode !== "off" ? "true" : "false");
    btn.setAttribute("aria-label", repeatLabelMap[repeatMode]);
    btn.title = repeatLabelMap[repeatMode];
    btn.textContent = repeatMode === "one" ? "🔂" : "🔁";
  });
}

function toggleShuffleMode() {
  shuffleModeEnabled = !shuffleModeEnabled;
  if (shuffleModeEnabled && currentQueue.length) {
    const current = getCurrentTrack();
    const others = currentQueue.filter(track => !current || track.id !== current.id);
    currentQueue = current ? [current, ...shuffleArray(others)] : shuffleArray([...currentQueue]);
    currentQueueIndex = current ? 0 : currentQueueIndex;
    saveQueueState();
    renderQueue();
  }
  savePlaybackModes();
  updatePlaybackModeButtons();
}

function toggleRepeatMode() {
  repeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
  savePlaybackModes();
  updatePlaybackModeButtons();
}

function addTrackToQueue(track, options = {}) {
  if (!track) return;
  const playNext = Boolean(options.playNext);
  if (!currentQueue.length) {
    const collectionTracks = getCurrentCollectionTracks();
    currentQueue = collectionTracks.length ? [...collectionTracks] : [track];
    currentQueueIndex = currentQueue.findIndex(item => item.id === track.id);
    if (currentQueueIndex < 0) {
      currentQueue.push(track);
      currentQueueIndex = 0;
    }
  }

  const existingIndex = currentQueue.findIndex(item => item.id === track.id);
  if (existingIndex >= 0) currentQueue.splice(existingIndex, 1);

  const insertIndex = playNext ? Math.max(currentQueueIndex + 1, 0) : currentQueue.length;
  currentQueue.splice(insertIndex, 0, track);
  if (existingIndex >= 0 && existingIndex < currentQueueIndex) currentQueueIndex -= 1;
  if (smartQueueSuggestionId === track.id) smartQueueSuggestionId = '';
  saveQueueState();
  renderQueue();
  showToast?.(playNext ? `Playing next: ${track.title}` : `Added to queue: ${track.title}`);
}

function queueCurrentTrackNext() {
  if (!currentQueue.length) {
    const collectionTracks = getCurrentCollectionTracks();
    if (!collectionTracks.length) return;
    setQueue(collectionTracks, shuffleModeEnabled);
  }
  if (!currentQueue.length) return;
  playNextTrack();
}



function clearQueueList() {
  currentQueue = [];
  currentQueueIndex = -1;
  smartQueueSuggestionId = '';
  saveQueueState();
  savePlayerState();
  renderQueue();
  syncQueuePlaybackUI();
}
function openTrackActionSheet(track, triggerEl = null) {
  if (!track || !els.trackActionSheet) return;
  actionSheetTrackId = track.id;
  actionSheetTriggerEl = triggerEl || null;
  if (els.trackActionSheetTitle) els.trackActionSheetTitle.textContent = track.title || "Track actions";
  if (els.trackActionSheetMeta) els.trackActionSheetMeta.textContent = `${track.album || "Singles"}${track.duration ? ` • ${track.duration}` : ""}`;
  if (els.trackActionSaveOfflineBtn) {
    const offlineState = window.AineoOffline?.getTrackOfflineUiState
      ? window.AineoOffline.getTrackOfflineUiState({ track, downloadedTracks })
      : { actionLabel: isDownloaded(track) ? "Remove Offline" : "Save Offline", disabled: false, downloaded: false };
    els.trackActionSaveOfflineBtn.textContent = offlineState.actionLabel;
    els.trackActionSaveOfflineBtn.disabled = Boolean(offlineState.disabled);
    els.trackActionSaveOfflineBtn.classList.toggle('is-saved-offline', Boolean(offlineState.downloaded));
  }
  els.trackActionSheet.classList.remove("hidden");
  els.trackActionSheet.setAttribute("aria-hidden", "false");
  document.body.classList.add("track-action-sheet-open");
}

function closeTrackActionSheet() {
  if (!els.trackActionSheet) return;
  els.trackActionSheet.classList.add("hidden");
  els.trackActionSheet.setAttribute("aria-hidden", "true");
  document.body.classList.remove("track-action-sheet-open");
  actionSheetTrackId = "";
  actionSheetTriggerEl = null;
}

function handleTrackEnded() {
  if (!currentQueue.length) return;
  if (repeatMode === "one") {
    els.audioPlayer.currentTime = 0;
    els.audioPlayer.play().catch(() => {});
    return;
  }
  const atEnd = currentQueueIndex >= currentQueue.length - 1;
  if (atEnd && repeatMode === "off") {
    updatePlayButton();
    return;
  }
  playNextTrack();
}

/* =========================
   UI BINDINGS
========================= */

function bindUI() {

  if (els.searchInput) {
    const searchDebounceMs = window.AineoConfig?.ui?.searchDebounceMs || window.AineoConfig?.searchDebounceMs || 120;
    let searchDebounceTimer = null;
    on(els.searchInput, "input", e => {
      const value = e.target.value;
      window.clearTimeout(searchDebounceTimer);
      searchDebounceTimer = window.setTimeout(() => setSearchFilter(value), searchDebounceMs);
    });
  }

  on(els.clearFiltersBtn, "click", clearAllFilters);
  bindSearchScopeChips();

  on(els.playBtn, "click", togglePlayPause);
  on(els.prevBtn, "click", playPreviousTrack);
  on(els.nextBtn, "click", playNextTrack);
  on(els.shuffleModeBtn, "click", toggleShuffleMode);
  on(els.repeatModeBtn, "click", toggleRepeatMode);
  const handlePlayNextAction = e => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    queueCurrentTrackNext();
    closeMobilePlayerDrawer();
  };
  on(els.playNextBtn, "click", handlePlayNextAction);
  on(els.playerSheetPlayNextBtn, "click", handlePlayNextAction);

  on(els.seekBar, "input", () => {
    if (!els.audioPlayer || !isFinite(els.audioPlayer.duration)) return;
    const percent = Number(els.seekBar.value) / 100;
    els.audioPlayer.currentTime = percent * els.audioPlayer.duration;
  });

  if (els.audioPlayer) {
    els.audioPlayer.addEventListener("timeupdate", () => {
      updateProgressUI();
      updateSyncedLyricsProgress();
      drawVisualizerFrame();
      const current = getCurrentTrack();
      const now = Date.now();
      if (current && now - lastResumePersistAt > 2500) {
        saveResume(current);
        lastResumePersistAt = now;
      }
    });
    els.audioPlayer.addEventListener("loadedmetadata", () => {
      updateProgressUI();
      updateSyncedLyricsProgress();
      window.requestAnimationFrame(() => updateSyncedLyricsProgress());
      updateMediaSessionPositionState();
      syncCurrentPlaybackHighlights();
    });
    els.audioPlayer.addEventListener("play", () => {
      stopPreviewAudio();
      updatePlayButton();
      updateMediaSessionPlaybackState();
      setMiniVisualizerActive(true);
      savePlayerState();
      updateSyncedLyricsProgress();
      startLyricsSyncLoop();
      syncCurrentPlaybackHighlights();
    });
    els.audioPlayer.addEventListener("playing", () => {
      updateSyncedLyricsProgress();
      startLyricsSyncLoop();
    });
    els.audioPlayer.addEventListener("pause", () => {
      updatePlayButton();
      updateMediaSessionPlaybackState();
      setMiniVisualizerActive(false);
      savePlayerState();
      stopLyricsSyncLoop();
      syncCurrentPlaybackHighlights();
    });
    els.audioPlayer.addEventListener("seeking", updateSyncedLyricsProgress);
    els.audioPlayer.addEventListener("seeked", () => {
      updateSyncedLyricsProgress();
      startLyricsSyncLoop();
    });
    els.audioPlayer.addEventListener("ended", () => {
      stopLyricsSyncLoop();
      stopVisualizerAnimation();
      handleTrackEnded();
      syncCurrentPlaybackHighlights();
    });
    els.audioPlayer.addEventListener("error", () => {
      if (navigator.onLine === false) renderOfflineStatus({ forceVisible: true });
    });
  }

  on(els.openLyricsBtn, "click", () => openLyricsModal(els.openLyricsBtn));
  on(els.copyLyricsBtn, "click", copyCurrentLyrics);
  on(els.copyLyricsBtnDesktop, "click", copyCurrentLyrics);
  on(els.shareSongBtn, "click", shareCurrentSong);
  on(els.shareSongBtnDesktop, "click", shareCurrentSong);
  on(els.favoriteSongBtn, "click", toggleCurrentFavorite);
  on(els.downloadSongBtn, "click", downloadCurrentSong);
  on(els.downloadSongBtnDesktop, "click", downloadCurrentSong);

  on(els.shuffleQueueBtn, "click", () => {
    startPlaybackFromList(getCurrentCollectionTracks(), true);
    openAndScrollQueueToCurrentTrack();
    closeMobilePlayerDrawer();
  });

  on(els.shuffleQueueBtnDesktop, "click", () => {
    startPlaybackFromList(getCurrentCollectionTracks(), true);
    openAndScrollQueueToCurrentTrack();
  });

  on(els.queuePlayListBtn, "click", () => {
    const list = getCurrentCollectionTracks();
    if (!list.length) return;
    startPlaybackFromList(list, false);
    openAndScrollQueueToCurrentTrack();
  });

  on(els.queueShuffleListBtn, "click", () => {
    const list = getCurrentCollectionTracks();
    if (!list.length) return;
    startPlaybackFromList(list, true);
    openAndScrollQueueToCurrentTrack();
  });

  on(els.queueClearBtn, "click", () => {
    clearQueueList();
  });

  on(els.playAlbumBtn, "click", () => {
    const collection = getFeaturedCollection();
    if (!collection) return;
    startPlaybackFromList(collection.tracks, false);
  });

  on(els.shuffleAlbumBtn, "click", () => {
    const collection = getFeaturedCollection();
    if (!collection) return;
    startPlaybackFromList(collection.tracks, true);
  });

  on(els.saveAlbumOfflineBtn, "click", async () => {
    const collection = getFeaturedCollection();
    if (!collection) return;
    await toggleCollectionOffline(collection.tracks);
  });

  on(els.downloadAlbumBtn, "click", () => {
    const collection = getFeaturedCollection();
    if (!collection?.album_zip) return;
    triggerDownload(collection.album_zip, `${safeFileName(collection.name)}.zip`);
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

  on(els.albumModalSaveOfflineBtn, "click", async () => {
    const album = getAlbumModalAlbum();
    if (!album) return;
    await toggleCollectionOffline(album.tracks);
    updateAlbumModalOfflineButton(album);
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
    if (track) toggleTrackOffline(track);
  });
  on(els.openPlayerSheetBtn, "click", () => openPlayerSheet(els.openPlayerSheetBtn));
  on(els.closePlayerSheetBtn, "click", closePlayerSheet);
  on(els.playerSheetBackdrop, "click", closePlayerSheet);
  on(els.playerSheetPlayBtn, "click", togglePlayPause);
  on(els.playerSheetPrevBtn, "click", playPreviousTrack);
  on(els.playerSheetNextBtn, "click", playNextTrack);
  on(els.playerSheetShuffleBtn, "click", toggleShuffleMode);
  on(els.playerSheetRepeatBtn, "click", toggleRepeatMode);
  on(els.playerSheetAutoScrollBtn, "click", toggleAutoScroll);
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
    if (track) toggleTrackOffline(track);
  });
  on(els.playlistModalBackdrop, "click", closePlaylistModal);
  on(els.closePlaylistModalBtn, "click", closePlaylistModal);
  on(els.saveToPlaylistBtn, "click", saveTrackToPlaylistFromModal);
  on(els.trackActionSheetBackdrop, "click", closeTrackActionSheet);
  on(els.trackActionCloseBtn, "click", closeTrackActionSheet);
  on(els.trackActionPlayNextBtn, "click", () => {
    const track = tracks.find(item => item.id === actionSheetTrackId);
    if (!track) return;
    addTrackToQueue(track, { playNext: true });
    closeTrackActionSheet();
  });
  on(els.trackActionAddPlaylistBtn, "click", () => {
    const track = tracks.find(item => item.id === actionSheetTrackId);
    if (!track) return;
    closeTrackActionSheet();
    window.requestAnimationFrame(() => openPlaylistModalForTrack(track, actionSheetTriggerEl || els.trackActionAddPlaylistBtn));
  });
  on(els.trackActionSaveOfflineBtn, "click", () => {
    const track = tracks.find(item => item.id === actionSheetTrackId);
    if (!track) return;
    toggleTrackOffline(track);
    closeTrackActionSheet();
  });
  on(els.trackActionGoAlbumBtn, "click", () => {
    const track = tracks.find(item => item.id === actionSheetTrackId);
    if (!track) return;
    closeTrackActionSheet();
    setAlbumFilter(track.album);
  });

  if (els.playerSheetSeekBar) {
    els.playerSheetSeekBar.addEventListener("input", () => {
      if (!els.audioPlayer || !isFinite(els.audioPlayer.duration)) return;
      const percent = Number(els.playerSheetSeekBar.value) / 100;
      setRangeProgress(els.playerSheetSeekBar, Number(els.playerSheetSeekBar.value));
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
    const target = e.target;
    const tagName = target?.tagName || "";
    const isTypingTarget = Boolean(target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(tagName));

    if (!isTypingTarget && (e.code === "Space" || e.key.toLowerCase() === "k")) {
      e.preventDefault();
      togglePlayPause();
      return;
    }

    if (!isTypingTarget && e.key.toLowerCase() === "j" && els.audioPlayer?.src) {
      e.preventDefault();
      els.audioPlayer.currentTime = Math.max(0, (els.audioPlayer.currentTime || 0) - 10);
      updateProgressUI();
      return;
    }

    if (!isTypingTarget && e.key.toLowerCase() === "l" && els.audioPlayer?.src && Number.isFinite(els.audioPlayer.duration)) {
      e.preventDefault();
      els.audioPlayer.currentTime = Math.min(els.audioPlayer.duration, (els.audioPlayer.currentTime || 0) + 10);
      updateProgressUI();
      return;
    }

    if (e.key === "Escape") {
      closeLyricsModal();
      closeAlbumModal();
      closePlaylistModal();
      closeTrackActionSheet();
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


function initActionButtonIsolation() {
  [
    els.favoriteSongBtn,
    els.addToPlaylistBtn,
    els.saveOfflineBtn,
    els.playNextBtn,
    els.openPlayerSheetBtn,
    els.moreActionsBtn,
    els.copyLyricsBtn,
    els.shareSongBtn,
    els.downloadSongBtn,
    els.shuffleQueueBtn
  ].forEach(btn => {
    if (!btn || btn.dataset.actionIsolationBound === "true") return;
    btn.dataset.actionIsolationBound = "true";
    ["pointerdown", "touchstart", "click"].forEach(eventName => {
      btn.addEventListener(eventName, event => {
        event.stopPropagation();
      }, { passive: eventName !== "click" });
    });
  });
}

function initSmoothHashJumps() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    if (link.dataset.hashJumpBound === "true") return;
    link.dataset.hashJumpBound = "true";
    link.addEventListener("click", event => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();

      const collapsible = target.closest('.collapsible-section');
      if (collapsible && !collapsible.classList.contains('open')) {
        collapsible.classList.add('open');
        collapsible.querySelector(".section-toggle")?.setAttribute("aria-expanded", "true");
      }

      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}


function initMiniVisualizer() {
  const wrap = els.playerSheetCoverWrap;
  if (!wrap || wrap.querySelector('.player-cover-visualizer')) return;

  const visualizer = document.createElement('div');
  visualizer.className = 'player-cover-visualizer';
  visualizer.setAttribute('aria-hidden', 'true');

  const glow = document.createElement('div');
  glow.className = 'player-cover-visualizer-glow';

  const bars = document.createElement('div');
  bars.className = 'player-cover-visualizer-bars';

  const leftLane = document.createElement('div');
  leftLane.className = 'player-cover-visualizer-lane is-left';
  const rightLane = document.createElement('div');
  rightLane.className = 'player-cover-visualizer-lane is-right';

  const BAR_COUNT = 28;
  for (let i = 0; i < BAR_COUNT; i += 1) {
    const leftBar = document.createElement('span');
    leftBar.className = 'player-cover-visualizer-bar';
    leftBar.dataset.side = 'left';
    leftBar.dataset.index = String(i);
    leftLane.appendChild(leftBar);

    const rightBar = document.createElement('span');
    rightBar.className = 'player-cover-visualizer-bar';
    rightBar.dataset.side = 'right';
    rightBar.dataset.index = String(i);
    rightLane.appendChild(rightBar);
  }

  bars.append(leftLane, rightLane);
  visualizer.append(glow, bars);
  wrap.prepend(visualizer);

  visualizerLeftBars = [...leftLane.children];
  visualizerRightBars = [...rightLane.children];
  visualizerBars = [...visualizerLeftBars, ...visualizerRightBars];
}

function resizeMiniVisualizerCanvas() {
  return;
}

function ensureVisualizerAudioSetup() {
  if (visualizerAudioSetupAttempted) return;
  visualizerAudioSetupAttempted = true;
  visualizerUseFallback = true;
  visualizerAudioContext = null;
  visualizerAnalyser = null;
  visualizerSourceNode = null;
  visualizerFreqData = null;
  visualizerWaveData = null;

  const audio = els.audioPlayer;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!audio || !AudioCtx) return;

  try {
    audio.crossOrigin = 'anonymous';
    visualizerAudioContext = new AudioCtx();
    visualizerAnalyser = visualizerAudioContext.createAnalyser();
    visualizerAnalyser.fftSize = 256;
    visualizerAnalyser.minDecibels = -92;
    visualizerAnalyser.maxDecibels = -14;
    visualizerAnalyser.smoothingTimeConstant = 0.82;
    visualizerFreqData = new Uint8Array(visualizerAnalyser.frequencyBinCount);
    visualizerWaveData = new Uint8Array(visualizerAnalyser.frequencyBinCount);
    visualizerSourceNode = visualizerAudioContext.createMediaElementSource(audio);
    visualizerSourceNode.connect(visualizerAnalyser);
    visualizerAnalyser.connect(visualizerAudioContext.destination);
    visualizerUseFallback = false;
  } catch (error) {
    console.warn('Visualizer analyser setup failed, using fallback spectrum.', error);
    visualizerUseFallback = true;
    visualizerAudioContext = null;
    visualizerAnalyser = null;
    visualizerSourceNode = null;
    visualizerFreqData = null;
    visualizerWaveData = null;
  }
}

function setMiniVisualizerActive(active) {
  if (!els.playerSheetCoverWrap) return;
  els.playerSheetCoverWrap.classList.toggle('is-visualizer-active', Boolean(active));
  if (active) {
    drawVisualizerFrame();
    startVisualizerAnimation();
  } else {
    stopVisualizerAnimation();
  }
}

function getTrackWaveformEnvelope(track) {
  if (!track || !Array.isArray(track.waveform_envelope) || !track.waveform_envelope.length) return null;
  return track.waveform_envelope;
}

function sampleTrackWaveformAt(track, normalizedPosition) {
  const envelope = getTrackWaveformEnvelope(track);
  if (!envelope) return null;
  const clamped = Math.max(0, Math.min(1, normalizedPosition || 0));
  if (envelope.length === 1) return Math.max(0, Math.min(1, (envelope[0] || 0) / 255));
  const pos = clamped * (envelope.length - 1);
  const left = Math.floor(pos);
  const right = Math.min(envelope.length - 1, left + 1);
  const frac = pos - left;
  const leftValue = (envelope[left] || 0) / 255;
  const rightValue = (envelope[right] || 0) / 255;
  return Math.max(0, Math.min(1, leftValue + ((rightValue - leftValue) * frac)));
}

function buildFallbackSpectrumSamples(track, progress, barCount, side) {
  const envelope = getTrackWaveformEnvelope(track);
  if (!envelope || !envelope.length || !barCount) return [];

  const maxIndex = envelope.length - 1;
  const centerIndex = Math.max(0, Math.min(maxIndex, Math.round(progress * maxIndex)));
  const span = Math.max(barCount * 3, Math.round(envelope.length * 0.05));
  const samples = [];

  for (let i = 0; i < barCount; i += 1) {
    const ratio = (i + 1) / barCount;
    const curved = Math.pow(ratio, 1.35);
    const distance = Math.max(1, Math.round(curved * span));
    const sampleIndex = side === 'left'
      ? Math.max(0, centerIndex - distance)
      : Math.min(maxIndex, centerIndex + distance);

    const here = (envelope[sampleIndex] || 0) / 255;
    const prev = (envelope[Math.max(0, sampleIndex - 1)] || envelope[sampleIndex] || 0) / 255;
    const next = (envelope[Math.min(maxIndex, sampleIndex + 1)] || envelope[sampleIndex] || 0) / 255;
    const localDelta = Math.abs(next - prev);
    const shaped = Math.max(0.03, Math.min(1, (here * 0.72) + (localDelta * 1.15)));
    samples.push(shaped);
  }

  return samples;
}

function buildAnalyserSpectrumSamples(barCount, side) {
  if (!visualizerAnalyser || !visualizerFreqData || !barCount) return [];

  visualizerAnalyser.getByteFrequencyData(visualizerFreqData);
  const usableStart = 2;
  const usableEnd = Math.max(usableStart + 8, Math.floor(visualizerFreqData.length * 0.78));
  const usable = visualizerFreqData.slice(usableStart, usableEnd);
  const half = Math.max(1, Math.floor(usable.length / 2));
  const lane = side === 'left' ? usable.slice(0, half) : usable.slice(half);
  const chunkSize = Math.max(1, Math.floor(lane.length / barCount));
  const samples = [];

  for (let i = 0; i < barCount; i += 1) {
    const start = i * chunkSize;
    const end = i === barCount - 1 ? lane.length : Math.min(lane.length, start + chunkSize);
    let peak = 0;
    let avg = 0;
    let count = 0;
    for (let j = start; j < end; j += 1) {
      const value = lane[j] || 0;
      peak = Math.max(peak, value);
      avg += value;
      count += 1;
    }
    const mean = count ? avg / count : 0;
    const raw = ((peak * 0.62) + (mean * 0.38)) / 255;
    const emphasis = side === 'left'
      ? 0.9 + ((barCount - i) / barCount) * 0.18
      : 0.9 + (i / barCount) * 0.18;
    samples.push(Math.max(0.035, Math.min(1, raw * emphasis)));
  }

  return side === 'left' ? samples.reverse() : samples;
}

function drawVisualizerFrame() {
  const currentTrack = getCurrentTrack();
  if (!currentTrack || !visualizerLeftBars.length || !visualizerRightBars.length) return;

  const audio = els.audioPlayer;
  const currentTime = audio?.currentTime || 0;
  const durationSeconds = currentTrack?.durationSeconds || currentTrack?.duration || audio?.duration || 0;
  const progress = durationSeconds > 0 ? Math.max(0, Math.min(0.9999, currentTime / durationSeconds)) : 0;
  const laneCount = Math.min(visualizerLeftBars.length, visualizerRightBars.length);

  if (visualizerAudioContext && visualizerAudioContext.state === 'suspended' && audio && !audio.paused) {
    visualizerAudioContext.resume().catch(() => {});
  }

  const leftSamples = !visualizerUseFallback ? buildAnalyserSpectrumSamples(laneCount, 'left') : buildFallbackSpectrumSamples(currentTrack, progress, laneCount, 'left');
  const rightSamples = !visualizerUseFallback ? buildAnalyserSpectrumSamples(laneCount, 'right') : buildFallbackSpectrumSamples(currentTrack, progress, laneCount, 'right');

  const fallbackBeat = (Date.now() % 1800) / 1800;

  const renderLane = (bars, samples, side) => {
    for (let i = 0; i < bars.length; i += 1) {
      const bar = bars[i];
      const synthetic = 0.08 + (0.08 * Math.sin((fallbackBeat * Math.PI * 2) + (i * 0.28) + (side === 'left' ? 0 : 0.85)));
      const sample = samples[i] ?? synthetic;
      const energy = Math.max(0, Math.min(1, sample));
      const eased = Math.pow(energy, 1.18);
      const barHeight = 10 + (eased * 108);
      const alpha = 0.26 + (eased * 0.72);
      bar.style.height = `${barHeight}px`;
      bar.style.opacity = `${alpha}`;
      bar.style.transform = `translateZ(0)`;
      if (side === 'left') {
        bar.style.background = `linear-gradient(180deg, rgba(224,240,255,${alpha}) 0%, rgba(92,164,255,${alpha}) 58%, rgba(56,95,228,${Math.min(1, alpha * 0.98)}) 100%)`;
        bar.style.boxShadow = `0 0 14px rgba(87,146,255,${0.16 + eased * 0.30})`;
      } else {
        bar.style.background = `linear-gradient(180deg, rgba(240,225,255,${alpha}) 0%, rgba(177,109,255,${alpha}) 58%, rgba(95,73,224,${Math.min(1, alpha * 0.98)}) 100%)`;
        bar.style.boxShadow = `0 0 14px rgba(168,105,255,${0.16 + eased * 0.30})`;
      }
    }
  };

  renderLane(visualizerLeftBars, leftSamples, 'left');
  renderLane(visualizerRightBars, rightSamples, 'right');
}

function startVisualizerAnimation() {
  if (!visualizerBars.length) return;
  ensureVisualizerAudioSetup();
  drawVisualizerFrame();
  if (visualizerFrame) return;

  const animate = () => {
    drawVisualizerFrame();
    if (els.audioPlayer && !els.audioPlayer.paused && els.audioPlayer.src) {
      visualizerFrame = window.requestAnimationFrame(animate);
    } else {
      visualizerFrame = 0;
    }
  };
  visualizerFrame = window.requestAnimationFrame(animate);
}

function stopVisualizerAnimation() {
  if (visualizerFrame) {
    window.cancelAnimationFrame(visualizerFrame);
    visualizerFrame = 0;
  }

  visualizerBars.forEach((bar, index) => {
    const seed = 0.12 + ((index % 7) * 0.018);
    bar.style.height = `${10 + seed * 42}px`;
    bar.style.opacity = '0.34';
  });
}

function stopPreviewAudio() {
  if (previewHoldTimer) {
    window.clearTimeout(previewHoldTimer);
    previewHoldTimer = null;
  }
  if (previewAudio) {
    try {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      previewAudio.src = '';
    } catch (error) {}
    previewAudio = null;
  }
  if (previewTrackId) {
    document.querySelectorAll(`[data-preview-track-id="${cssEscape(previewTrackId)}"]`).forEach(el => el.classList.remove('is-previewing'));
  }
  previewTrackId = '';
}

function startTrackPreview(track, sourceEl) {
  if (!track?.src || navigator.onLine === false) return;
  stopPreviewAudio();
  previewTrackId = track.id || '';
  sourceEl?.classList.add('is-previewing');
  if (previewTrackId) document.querySelectorAll(`[data-preview-track-id="${cssEscape(previewTrackId)}"]`).forEach(el => el.classList.add('is-previewing'));
  previewAudio = new Audio(track.src);
  previewAudio.preload = 'auto';
  previewAudio.volume = 0.78;
  previewAudio.crossOrigin = 'anonymous';
  previewAudio.addEventListener('loadedmetadata', () => {
    const duration = Number(previewAudio.duration) || 0;
    const previewStart = duration > 50 ? Math.min(Math.max(duration * 0.32, 12), duration - 12) : 0;
    if (previewStart > 0) previewAudio.currentTime = previewStart;
    previewAudio.play().catch(() => {});
  }, { once: true });
  previewAudio.addEventListener('play', () => showToast?.(`Previewing: ${track.title}`), { once: true });
  previewAudio.addEventListener('timeupdate', () => {
    if (!previewAudio) return;
    const start = Number(previewAudio.dataset.previewStart || previewAudio.currentTime || 0);
    if (!previewAudio.dataset.previewStart) previewAudio.dataset.previewStart = String(start);
    if ((previewAudio.currentTime - start) >= 9) stopPreviewAudio();
  });
  previewAudio.addEventListener('ended', stopPreviewAudio, { once: true });
  previewAudio.load();
}

function findTrackFromPreviewTarget(target) {
  const row = target.closest('[data-track-id], [data-mini-index]');
  if (!row) return null;
  if (target.closest('button, a, input, label, select, textarea') && !target.closest('.featured-track-row, .album-track-row, .mini-card')) return null;
  let track = null;
  if (row.dataset.trackId) {
    track = tracks.find(item => item.id === row.dataset.trackId) || null;
  } else if (row.dataset.miniIndex && row.closest('#favoritesList, #recentlyPlayedList')) {
    const source = row.closest('#favoritesList') ? favorites : recentlyPlayed;
    const ids = source.map(id => tracks.find(trackItem => trackItem.id === id)).filter(Boolean);
    track = ids[Number(row.dataset.miniIndex)] || null;
  }
  if (track && row.dataset.previewTrackId !== track.id) row.dataset.previewTrackId = track.id;
  return track ? { track, row } : null;
}

function initHoldToPreview() {
  const holdSelector = '.featured-track-row, .album-track-row, .mini-card';
  const cancelPreview = () => {
    if (previewHoldTimer) {
      window.clearTimeout(previewHoldTimer);
      previewHoldTimer = null;
    }
    stopPreviewAudio();
  };

  document.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const candidate = event.target.closest(holdSelector);
    if (!candidate) return;
    if (event.target.closest('.featured-track-play, .featured-track-actions, .mini-action-btn, [data-track-more], [data-favorite-track], [data-lyrics-track], [data-offline-track]')) return;
    const match = findTrackFromPreviewTarget(candidate);
    if (!match?.track?.src) return;
    previewHoldTimer = window.setTimeout(() => {
      suppressPreviewClickUntil = Date.now() + 380;
      window.__AINEO_SUPPRESS_PREVIEW_CLICK_UNTIL__ = suppressPreviewClickUntil;
      startTrackPreview(match.track, match.row);
      previewHoldTimer = null;
    }, 420);
  }, { passive: true });

  ['pointerup','pointercancel','pointerleave','scroll'].forEach(name => {
    document.addEventListener(name, cancelPreview, { passive: true });
  });

  document.addEventListener('click', event => {
    if (Date.now() < suppressPreviewClickUntil) {
      const candidate = event.target.closest(holdSelector);
      if (candidate) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }, true);
}

window.__AINEO_SUPPRESS_PREVIEW_CLICK_UNTIL__ = 0;

function getSmartQueueSuggestion(baseTrack = getCurrentTrack()) {
  if (!baseTrack || !tracks.length) return null;
  const excluded = new Set(currentQueue.map(item => item.id));
  excluded.add(baseTrack.id);
  recentlyPlayed.slice(0, 6).forEach(id => excluded.add(id));
  const baseTags = Array.isArray(baseTrack.tags) ? baseTrack.tags : [];
  const basePlaylists = Array.isArray(baseTrack.playlists) ? baseTrack.playlists : [];
  const currentYear = Number(baseTrack.year || 0);
  const candidates = tracks.filter(candidate => candidate?.id && !excluded.has(candidate.id));
  if (!candidates.length) return null;
  let best = null;
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    let score = 0;
    if (candidate.album && candidate.album === baseTrack.album) score += 42;
    if (candidate.artist && candidate.artist === baseTrack.artist) score += 10;
    if (candidate.collection && candidate.collection === baseTrack.collection) score += 6;
    if ((candidate.play_count || 0) > 0) score += Math.min(Number(candidate.play_count || 0), 8);
    if (currentYear && Number(candidate.year || 0) === currentYear) score += 4;
    const tagOverlap = (Array.isArray(candidate.tags) ? candidate.tags : []).filter(tag => baseTags.includes(tag)).length;
    score += tagOverlap * 9;
    const playlistOverlap = (Array.isArray(candidate.playlists) ? candidate.playlists : []).filter(name => basePlaylists.includes(name)).length;
    score += playlistOverlap * 7;
    if (candidate.featured) score += 3;
    if (recentlyPlayed.includes(candidate.id)) score -= 16;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return bestScore > 0 ? best : candidates[0] || null;
}

function ensureSmartQueueSuggestion(baseTrack = getCurrentTrack()) {
  if (!baseTrack || !Array.isArray(currentQueue) || !currentQueue.length) return;
  const remaining = currentQueue.length - currentQueueIndex - 1;
  if (remaining > 1) return;
  if (smartQueueSuggestionId && currentQueue.some(item => item.id === smartQueueSuggestionId)) return;
  const suggestion = getSmartQueueSuggestion(baseTrack);
  if (!suggestion || currentQueue.some(item => item.id === suggestion.id)) return;
  currentQueue.push(suggestion);
  smartQueueSuggestionId = suggestion.id;
  saveQueueState();
  renderQueue();
  showToast?.(`Smart queue added: ${suggestion.title}`);
}

/* =========================
   FILTERS
========================= */

function setAlbumFilter(albumName) {
  window.AineoLibrary.applyNamedFilter({
    filters,
    searchInput: els.searchInput,
    type: "album",
    value: albumName,
    onAfterChange: () => {
      updateLibraryView();
      scrollToTrackList();
    }
  });
}

function setPlaylistFilter(playlistName) {
  window.AineoLibrary.applyNamedFilter({
    filters,
    searchInput: els.searchInput,
    type: "playlist",
    value: playlistName,
    onAfterChange: () => {
      updateLibraryView();
      scrollToTrackList();
    }
  });
}

function setSmartPlaylistFilter(smartKey) {
  window.AineoLibrary.applyNamedFilter({
    filters,
    searchInput: els.searchInput,
    type: "smart-playlist",
    value: smartKey,
    onAfterChange: () => {
      updateLibraryView();
      scrollToTrackList();
    }
  });
}

function setTagFilter(tagName) {
  window.AineoLibrary.applyNamedFilter({
    filters,
    searchInput: els.searchInput,
    type: "tag",
    value: tagName,
    onAfterChange: () => {
      updateLibraryView();
      scrollToTrackList();
    }
  });
}

function setSearchFilter(term) {
  window.AineoLibrary.applyNamedFilter({
    filters,
    searchInput: els.searchInput,
    type: "search",
    value: term,
    onAfterChange: () => {
      updateLibraryView();
      scrollToTrackList();
    }
  });
}

function clearAllFilters() {
  window.AineoLibrary.clearFilters({
    filters,
    searchInput: els.searchInput,
    onAfterChange: () => {
      activeCustomPlaylistName = null;
      smartQueueSuggestionId = '';
      currentCollectionKey = '';
      updateLibraryView();
      syncQueueToCurrentCollection(true);
      syncQueuePlaybackUI();
      syncCurrentPlaybackHighlights();
      scrollToTrackList();
    }
  });
}

function getFilteredTracks() {
  return window.AineoLibrary.getFilteredTracks({ tracks, filters, favorites, recentlyPlayed, downloadedTracks, playStats, customPlaylists });
}

/* =========================
   DERIVED DATA
========================= */

function getCurrentCollectionTracks() {
  return Array.isArray(filteredTracks) ? [...filteredTracks] : [];
}

function getCurrentCollectionKey() {
  if (filters.selectedAlbum) return `album:${filters.selectedAlbum}`;
  if (filters.selectedPlaylist) return `playlist:${filters.selectedPlaylist}`;
  if (filters.selectedTag) return `tag:${filters.selectedTag}`;
  if (filters.selectedSmartPlaylist) return `smart:${filters.selectedSmartPlaylist}`;
  if (filters.selectedCustomPlaylist) return `custom-playlist:${filters.selectedCustomPlaylist}`;
  if (filters.searchTerm) return `search:${filters.searchScope || "all"}:${filters.searchTerm.toLowerCase()}`;
  return "all-songs";
}

function getCurrentCollectionMeta() {
  const collectionTracks = getCurrentCollectionTracks();
  const fallbackCover = collectionTracks.find(track => track.cover)?.cover || "";
  const fallbackArtist = collectionTracks[0]?.artist || "Allen Parvin";
  const albumZip = collectionTracks.find(track => track.album_zip)?.album_zip || "";

  if (filters.selectedAlbum) {
    const album = getVisibleAlbums(collectionTracks).find(item => item.name === filters.selectedAlbum);
    return {
      type: "album",
      key: getCurrentCollectionKey(),
      name: filters.selectedAlbum,
      subtitle: album?.artist || fallbackArtist,
      cover: album?.cover || fallbackCover,
      tracks: collectionTracks,
      album_zip: album?.album_zip || albumZip,
      openMode: "album"
    };
  }

  if (filters.selectedPlaylist) {
    return {
      type: "playlist",
      key: getCurrentCollectionKey(),
      name: filters.selectedPlaylist,
      subtitle: "Playlist",
      cover: fallbackCover,
      tracks: collectionTracks,
      album_zip: "",
      openMode: "collection"
    };
  }

  if (filters.selectedTag) {
    return {
      type: "tag",
      key: getCurrentCollectionKey(),
      name: `#${filters.selectedTag}`,
      subtitle: "Filtered by tag",
      cover: fallbackCover,
      tracks: collectionTracks,
      album_zip: "",
      openMode: "collection"
    };
  }

  if (filters.selectedCustomPlaylist) {
    return {
      type: "custom-playlist",
      key: getCurrentCollectionKey(),
      name: filters.selectedCustomPlaylist,
      subtitle: "My Playlist",
      cover: fallbackCover,
      tracks: collectionTracks,
      album_zip: "",
      openMode: "collection"
    };
  }

  if (filters.selectedSmartPlaylist) {
    const smartPlaylists = window.AineoLibrary.getSmartPlaylistDefinitions({ tracks, favorites, recentlyPlayed, downloadedTracks, playStats });
    const smart = smartPlaylists.find(item => item.key === filters.selectedSmartPlaylist);
    return {
      type: "smart-playlist",
      key: getCurrentCollectionKey(),
      name: smart?.name || "Smart Playlist",
      subtitle: smart ? `${smart.tracks.length} songs` : "Smart Playlist",
      cover: smart?.tracks?.find(track => track.cover)?.cover || fallbackCover,
      tracks: collectionTracks,
      album_zip: "",
      openMode: "collection"
    };
  }

  if (filters.searchTerm) {
    return {
      type: "search",
      key: getCurrentCollectionKey(),
      name: collectionTracks.length ? `Search Results` : "Search Results",
      subtitle: `Matches for “${filters.searchTerm}”`,
      cover: fallbackCover,
      tracks: collectionTracks,
      album_zip: "",
      openMode: "collection"
    };
  }

  return {
    type: "all",
    key: "all-songs",
    name: "All Songs",
    subtitle: "Entire music library",
    cover: fallbackCover,
    tracks: collectionTracks,
    album_zip: "",
    openMode: "collection"
  };
}

function getFeaturedCollection() {
  const collection = getCurrentCollectionMeta();
  return collection.tracks.length ? collection : null;
}

function scrollToTrackList() {
  const target = document.getElementById("featuredTrackListTitle")?.closest(".featured-tracklist-panel")
    || document.getElementById("featuredTrackList")
    || els.featuredTrackList;
  if (!target) return;
  const headerHeight = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
  const top = window.scrollY + target.getBoundingClientRect().top - headerHeight - 16;
  window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
}

function scrollToFeaturedCollection() {
  scrollToTrackList();
}

function syncQueueToCurrentCollection(force = false) {
  const collectionTracks = getCurrentCollectionTracks();
  const nextKey = getCurrentCollectionKey();
  const currentTrack = getCurrentTrack();
  const needsSync = force || currentCollectionKey !== nextKey || currentQueue.length !== collectionTracks.length || currentQueue.some((track, index) => track.id !== collectionTracks[index]?.id);

  currentCollectionKey = nextKey;
  if (!needsSync) return;

  currentQueue = [...collectionTracks];
  if (!currentQueue.length) {
    currentQueueIndex = -1;
    saveQueueState();
    renderQueue();
    return;
  }

  if (currentTrack) {
    const matchIndex = currentQueue.findIndex(track => track.id === currentTrack.id);
    currentQueueIndex = matchIndex >= 0 ? matchIndex : 0;
  } else {
    currentQueueIndex = 0;
  }

  saveQueueState();
  renderQueue();
}

function getVisibleAlbums(trackList) {
  return window.AineoFeatured.getVisibleAlbums(trackList);
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
  return getFeaturedCollection();
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
  syncCurrentTrackIndex();
  syncQueueToCurrentCollection();
  renderActiveFilterLabel();
  renderPlaylists(filteredTracks);
  renderTags(filteredTracks);
  renderAlbums(filteredTracks);
  renderFeaturedAlbum();
  renderFeaturedTrackList();
  renderSearchUi();
  renderMyPlaylists();
  renderPlaylistWorkspace();
}

function getSearchScopeLabel(scopeKey = "all") {
  const labels = { all: "Everywhere", titles: "Titles", albums: "Albums", lyrics: "Lyrics", scripture: "Scripture", tags: "Tags", playlists: "Playlists" };
  return labels[scopeKey] || "Everywhere";
}

function bindSearchScopeChips() {
  if (!els.searchScopeBar) return;
  els.searchScopeBar.addEventListener("click", event => {
    const button = event.target.closest("[data-search-scope]");
    if (!button) return;
    filters.searchScope = button.dataset.searchScope || "all";
    renderSearchUi();
    if (filters.searchTerm) updateLibraryView();
  });
}

function renderSearchUi() {
  if (els.searchScopeBar) {
    const scopes = (window.AineoConfig?.searchScopes || ["all","titles","albums","lyrics","scripture","tags","playlists"]);
    els.searchScopeBar.innerHTML = scopes.map(scope => {
      const label = getSearchScopeLabel(scope);
      return window.AineoUI?.renderSearchScopeChip
        ? window.AineoUI.renderSearchScopeChip({ key: scope, label, active: (filters.searchScope || "all") === scope, escapeHtml, escapeAttr: escapeHtmlAttr })
        : `<button class="search-scope-chip ${(filters.searchScope || "all") === scope ? "active" : ""}" data-search-scope="${escapeHtmlAttr(scope)}" type="button">${escapeHtml(label)}</button>`;
    }).join("");
  }
  if (els.searchMeta) {
    const count = Array.isArray(filteredTracks) ? filteredTracks.length : 0;
    if (filters.searchTerm) {
      els.searchMeta.textContent = `${count} result${count === 1 ? "" : "s"} in ${getSearchScopeLabel(filters.searchScope)}`;
    } else {
      els.searchMeta.textContent = `Search songs, albums, tags, playlists, lyrics, and scripture.`;
    }
  }
}

/* =========================
   STICKY FILTER BAR
========================= */

function isTabletLibraryViewport() {
  return true;
}

function getStickyFilterTopOffset() {
  const docStyle = getComputedStyle(document.documentElement);
  const readPxVar = (name) => {
    const raw = (docStyle.getPropertyValue(name) || '').trim();
    if (!raw) return 0;
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : 0;
  };

  if (document.body.classList.contains("ios-standalone")) {
    const safeTop = Math.max(readPxVar("--safe-top"), readPxVar("--app-safe-top-visual"));
    return Math.max(0, Math.round(safeTop + 8));
  }

  return 0;
}

function ensureStickyFilterOverlayMount() {
  if (els.stickyFilterOverlayMount && document.body.contains(els.stickyFilterOverlayMount)) return els.stickyFilterOverlayMount;
  const mount = document.createElement("div");
  mount.id = "stickyFilterOverlayMount";
  mount.className = "sticky-filter-overlay-mount";
  mount.setAttribute("aria-hidden", "true");
  document.body.appendChild(mount);
  els.stickyFilterOverlayMount = mount;
  return mount;
}

function syncTabletStickyFilterBarMetrics() {
  if (!els.stickyFilterBar || !els.stickyFilterBarInner) return;

  const top = getStickyFilterTopOffset();
  const mount = ensureStickyFilterOverlayMount();
  const barRect = els.stickyFilterBar.getBoundingClientRect();
  const height = Math.ceil(els.stickyFilterBarInner.offsetHeight || els.stickyFilterBar.offsetHeight || 0);
  const width = Math.max(0, Math.round(barRect.width || els.stickyFilterBar.offsetWidth || 0));
  const left = Math.round(barRect.left);
  const mainContent = document.getElementById("mainContent");

  els.stickyFilterBar.style.setProperty("--sticky-filter-top", `${top}px`);
  els.stickyFilterBar.style.setProperty("--tablet-sticky-top", `${top}px`);
  els.stickyFilterBar.style.setProperty("--tablet-sticky-height", `${height}px`);
  els.stickyFilterBar.style.setProperty("--tablet-sticky-width", `${width}px`);
  els.stickyFilterBar.style.setProperty("--tablet-sticky-left", `${left}px`);
  els.stickyFilterBar.style.minHeight = `${height}px`;

  mount.style.setProperty("--sticky-filter-top", `${top}px`);
  mount.style.setProperty("--sticky-filter-height", `${height}px`);
  mount.style.setProperty("--sticky-filter-width", `${width}px`);
  mount.style.setProperty("--sticky-filter-left", `${left}px`);

  if (mainContent) {
    mainContent.style.setProperty("--active-sticky-filter-space", `${height}px`);
  }
}

function moveStickyFilterBarToOverlay() {
  const mount = ensureStickyFilterOverlayMount();
  if (!els.stickyFilterBarInner || !mount) return;
  if (els.stickyFilterBarInner.parentElement !== mount) {
    mount.appendChild(els.stickyFilterBarInner);
  }
}

function restoreStickyFilterBarToPlaceholder() {
  if (!els.stickyFilterBar || !els.stickyFilterBarInner) return;
  if (els.stickyFilterBarInner.parentElement !== els.stickyFilterBar) {
    els.stickyFilterBar.appendChild(els.stickyFilterBarInner);
  }
}

function updateTabletStickyFilterBar() {
  if (!els.stickyFilterBar || !els.stickyFilterBarInner) return;

  const active = hasActiveFilter() && !els.stickyFilterBar.classList.contains("hidden");
  const mainContent = document.getElementById("mainContent");
  const mount = ensureStickyFilterOverlayMount();

  if (!active) {
    els.stickyFilterBar.classList.remove("is-fixed");
    mount.classList.remove("active");
    restoreStickyFilterBarToPlaceholder();
    els.stickyFilterBar.style.removeProperty("--sticky-filter-top");
    els.stickyFilterBar.style.removeProperty("--tablet-sticky-top");
    els.stickyFilterBar.style.removeProperty("--tablet-sticky-height");
    els.stickyFilterBar.style.removeProperty("--tablet-sticky-width");
    els.stickyFilterBar.style.removeProperty("--tablet-sticky-left");
    els.stickyFilterBar.style.removeProperty("min-height");
    mount.style.removeProperty("--sticky-filter-top");
    mount.style.removeProperty("--sticky-filter-height");
    mount.style.removeProperty("--sticky-filter-width");
    mount.style.removeProperty("--sticky-filter-left");
    els.stickyFilterBarInner.style.removeProperty("left");
    els.stickyFilterBarInner.style.removeProperty("top");
    els.stickyFilterBarInner.style.removeProperty("width");
    if (mainContent) {
      mainContent.classList.remove("sticky-filter-active");
      mainContent.style.removeProperty("--active-sticky-filter-space");
    }
    return;
  }

  syncTabletStickyFilterBarMetrics();
  els.stickyFilterBar.classList.add("is-fixed");
  mount.classList.add("active");
  moveStickyFilterBarToOverlay();
  els.stickyFilterBarInner.style.left = `var(--sticky-filter-left, 12px)`;
  els.stickyFilterBarInner.style.top = `var(--sticky-filter-top, 0px)`;
  els.stickyFilterBarInner.style.width = `var(--sticky-filter-width, calc(100% - 24px))`;
  if (mainContent) {
    mainContent.classList.add("sticky-filter-active");
  }
}

function initTabletStickyFilterBar() {
  if (!els.stickyFilterBar || !els.stickyFilterBarInner) return;

  let stickyUpdateFrame = null;
  const requestUpdate = () => {
    if (stickyUpdateFrame) return;
    stickyUpdateFrame = window.requestAnimationFrame(() => {
      stickyUpdateFrame = null;
      updateTabletStickyFilterBar();
    });
  };

  window.addEventListener("resize", requestUpdate, { passive: true });
  window.addEventListener("orientationchange", requestUpdate, { passive: true });
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("load", requestUpdate, { passive: true });
  window.addEventListener("pageshow", requestUpdate, { passive: true });
  document.addEventListener("visibilitychange", requestUpdate, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", requestUpdate, { passive: true });
    window.visualViewport.addEventListener("scroll", requestUpdate, { passive: true });
  }

  requestUpdate();
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
  } else if (filters.selectedCustomPlaylist) {
    text = `My Playlist: ${filters.selectedCustomPlaylist}`;
    buttonText = "Clear My Playlist";
    badgeText = "My Playlist";
    badgeClass = "playlist";
  } else if (filters.selectedSmartPlaylist) {
    const smartPlaylists = window.AineoLibrary.getSmartPlaylistDefinitions({ tracks, favorites, recentlyPlayed, downloadedTracks, playStats });
    const smart = smartPlaylists.find(item => item.key === filters.selectedSmartPlaylist);
    text = `Smart Playlist: ${smart?.name || filters.selectedSmartPlaylist}`;
    buttonText = "Clear Smart Playlist";
    badgeText = "Smart";
    badgeClass = "playlist";
  } else if (filters.searchTerm) {
    const scopeLabel = getSearchScopeLabel(filters.searchScope);
    text = `Search ${scopeLabel}: ${filters.searchTerm}`;
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

  updateTabletStickyFilterBar();
}

/* =========================
   PLAYLISTS + TAGS
========================= */

function renderPlaylists(trackList) {
  window.AineoLibrary.renderPlaylists({
    container: els.playlistList,
    trackList,
    allTracks: tracks,
    filters,
    hasActiveFilter,
    onClearAll: clearAllFilters,
    onSetPlaylistFilter: setPlaylistFilter,
    onSetSmartPlaylistFilter: setSmartPlaylistFilter,
    favorites,
    recentlyPlayed,
    downloadedTracks,
    playStats,
    escapeHtml,
    escapeHtmlAttr
  });
}

function renderTags(trackList) {
  window.AineoLibrary.renderTags({
    container: els.tagList,
    trackList,
    filters,
    windowWidth: window.innerWidth,
    onSetTagFilter: setTagFilter,
    escapeHtml,
    escapeHtmlAttr,
    getVisibleTags
  });
}

/* =========================
   ALBUMS
========================= */

function renderAlbums(trackList) {
  window.AineoFeatured.renderAlbums({
    els,
    trackList,
    filters,
    getVisibleAlbums,
    escapeHtml,
    escapeHtmlAttr,
    setAlbumFilter
  });
}

function renderFeaturedAlbum() {
  window.AineoFeatured.renderFeaturedAlbum({
    els,
    getFeaturedCollection
  });
  updateCollectionOfflineButtons();
}

function getFeaturedTrackPlayState(track) {
  return window.AineoFeatured.getFeaturedTrackPlayState({
    track,
    getCurrentTrack,
    audioPlayer: els.audioPlayer
  });
}

function renderFeaturedTrackList() {
  window.AineoFeatured.renderFeaturedTrackList({
    els,
    getFeaturedCollection,
    getFeaturedTrackPlayState,
    isFavorite,
    isDownloaded,
    escapeHtml,
    escapeHtmlAttr,
    getCurrentTrack,
    audioPlayer: els.audioPlayer,
    togglePlayPause,
    syncQueueToCurrentCollection,
    getCurrentCollectionTracks,
    setQueue,
    playFromQueueIndex,
    toggleFavorite,
    openLyricsModalForTrack,
    openPlaylistModalForTrack,
    saveTrackOffline,
    removeTrackOffline,
    triggerDownload,
    safeFileName,
    addTrackToQueue,
    openTrackActionSheet
  });
}

/* =========================
   QUEUE + PLAYBACK
========================= */

let prefetchedTrackSrc = "";
let prefetchedAudio = null;

function prefetchTrackMedia(track) {
  if (!track?.src || prefetchedTrackSrc === track.src) return;
  prefetchedTrackSrc = track.src;

  try {
    prefetchedAudio = new Audio();
    prefetchedAudio.preload = "auto";
    prefetchedAudio.src = track.src;
    prefetchedAudio.load();
  } catch (error) {
    prefetchedAudio = null;
  }

  if (track.cover) {
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = track.cover;
  }
}

function prefetchUpcomingTrack() {
  if (!Array.isArray(currentQueue) || !currentQueue.length) return;
  const nextIndex = currentQueueIndex >= 0 && currentQueueIndex < currentQueue.length - 1 ? currentQueueIndex + 1 : 0;
  const nextTrack = currentQueue[nextIndex];
  if (nextTrack) prefetchTrackMedia(nextTrack);
}

function setQueue(trackList, shuffle = false) {
  currentQueue = shuffle ? shuffleArray([...trackList]) : [...trackList];
  currentQueueIndex = currentQueue.length ? 0 : -1;
  saveQueueState();
  savePlayerState();
  renderQueue();
}

function startPlaybackFromList(trackList, shuffle = false, startIndex = 0) {
  if (!Array.isArray(trackList) || !trackList.length) return;
  setQueue(trackList, shuffle);
  playFromQueueIndex(Math.max(0, Math.min(startIndex, currentQueue.length - 1)));
}

function playTrack(track) {
  if (!track || !track.src || !els.audioPlayer) return;
  stopPreviewAudio();

  if (navigator.onLine === false && !isDownloaded(track)) {
    renderOfflineStatus({ forceVisible: true, emphasizeSaved: true });
    showToast?.('This song was not saved offline yet.');
    return;
  }

  const queueIndex = currentQueue.findIndex(t => t.id === track.id);
  if (queueIndex >= 0) {
    currentQueueIndex = queueIndex;
  }

  currentTrackIndex = filteredTracks.findIndex(t => t.id === track.id);

  stopLyricsSyncLoop();
  els.audioPlayer.crossOrigin = 'anonymous';
  els.audioPlayer.src = track.src;
  pendingResumeSeek = track.src === resumeTrackSrc && resumeTrackTime > 1 ? resumeTrackTime : null;
  const applyResumeSeek = () => {
    if (pendingResumeSeek !== null && Number.isFinite(els.audioPlayer.duration)) {
      els.audioPlayer.currentTime = Math.min(pendingResumeSeek, Math.max(0, els.audioPlayer.duration - 1));
      pendingResumeSeek = null;
      updateSyncedLyricsProgress();
    }
  };
  els.audioPlayer.addEventListener("loadedmetadata", applyResumeSeek, { once: true });

  updateNowPlaying(track);
  updateMediaSessionMetadata(track);
  updateLyricsPanel(track);
  updateSyncedLyricsProgress();
  window.requestAnimationFrame(() => updateSyncedLyricsProgress());
  prefetchTrackLyrics(track).then(() => {
    if (getCurrentTrack()?.id === track.id) {
      updateLyricsPanel(track);
      updateSyncedLyricsProgress();
    }
  });

  els.audioPlayer.play().catch(err => console.error("Playback failed:", err));
  updateScripturePanel(track);
  recordTrackPlay(track);
  addToRecentlyPlayed(track);
  saveResume(track);
  saveQueueState();
  savePlayerState(track, pendingResumeSeek ?? els.audioPlayer.currentTime ?? 0);
  renderQueue();
  renderFavorites();
  renderFeaturedTrackList();
  updateUrlForTrack(track);
  ensureSmartQueueSuggestion(track);
  window.requestIdleCallback ? window.requestIdleCallback(() => prefetchUpcomingTrack(), { timeout: 700 }) : window.setTimeout(prefetchUpcomingTrack, 250);
}

function playFromQueueIndex(index) {
  if (index < 0 || index >= currentQueue.length) return;
  currentQueueIndex = index;
  saveQueueState();
  playTrack(currentQueue[index]);
}

function playPreviousTrack() {
  if (!currentQueue.length) {
    if (!getCurrentCollectionTracks().length) return;
    setQueue(getCurrentCollectionTracks(), shuffleModeEnabled);
  }

  if (!currentQueue.length) return;

  if (shuffleModeEnabled && currentQueue.length > 1) {
    currentQueueIndex = currentQueueIndex <= 0 ? currentQueue.length - 1 : currentQueueIndex - 1;
  } else {
    currentQueueIndex = currentQueueIndex <= 0 ? currentQueue.length - 1 : currentQueueIndex - 1;
  }
  playTrack(currentQueue[currentQueueIndex]);
}

function playNextTrack() {
  if (!currentQueue.length) {
    if (!getCurrentCollectionTracks().length) return;
    setQueue(getCurrentCollectionTracks(), shuffleModeEnabled);
  }

  if (!currentQueue.length) return;

  if (repeatMode === "one") {
    playTrack(currentQueue[currentQueueIndex]);
    return;
  }

  const isAtEnd = currentQueueIndex >= currentQueue.length - 1;
  if (isAtEnd && repeatMode === "off") {
    els.audioPlayer.pause();
    return;
  }

  currentQueueIndex = isAtEnd ? 0 : currentQueueIndex + 1;
  playTrack(currentQueue[currentQueueIndex]);
}

function togglePlayPause() {
  if (!els.audioPlayer) return;

  if (!els.audioPlayer.src) {
    const first = currentQueue[0] || getCurrentCollectionTracks()[0] || tracks[0];
    if (first) {
      if (!currentQueue.length) {
        setQueue(getCurrentCollectionTracks().length ? getCurrentCollectionTracks() : tracks, false);
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


function bindMediaSessionHandlers() {
  window.AineoMediaSession.bindHandlers({
    togglePlayPause,
    playPreviousTrack,
    playNextTrack,
    getAudio: () => els.audioPlayer,
    onStateChange: () => {
      updateProgressUI();
      updateMediaSessionPlaybackState();
      updateMediaSessionPositionState();
    }
  });
}

function updateMediaSessionPlaybackState() {
  window.AineoMediaSession.updatePlaybackState(els.audioPlayer);
}

function updateMediaSessionMetadata(track) {
  window.AineoMediaSession.updateMetadata(track, els.audioPlayer);
}

function updateMediaSessionPositionState() {
  window.AineoMediaSession.updatePositionState(els.audioPlayer);
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


function syncCurrentPlaybackHighlights() {
  if (!els.featuredTrackList) return;
  const currentTrack = getCurrentTrack();
  const isPlaying = Boolean(currentTrack && els.audioPlayer && !els.audioPlayer.paused && els.audioPlayer.src);

  els.featuredTrackList.querySelectorAll(".featured-track-row").forEach(row => {
    const isCurrentTrack = Boolean(currentTrack && row.dataset.trackId === currentTrack.id);
    row.classList.toggle("playing", isCurrentTrack);
    row.classList.toggle("is-current", isCurrentTrack);
    row.classList.toggle("is-playing", isCurrentTrack && isPlaying);
    row.classList.toggle("is-paused", isCurrentTrack && !isPlaying);
  });

  els.featuredTrackList.querySelectorAll(".featured-track-play[data-track-id]").forEach(btn => {
    const trackId = btn.dataset.trackId;
    const row = btn.closest('.featured-track-row');
    const trackTitle = row?.querySelector('.featured-track-title')?.textContent?.trim() || btn.dataset.trackTitle || "track";
    const isCurrentTrack = Boolean(currentTrack && trackId === currentTrack.id);
    const buttonShowsPause = isCurrentTrack && isPlaying;

    btn.textContent = buttonShowsPause ? "❚❚" : "▶";
    btn.classList.toggle("is-playing", buttonShowsPause);
    btn.classList.toggle("is-current", isCurrentTrack);
    btn.setAttribute("aria-pressed", buttonShowsPause ? "true" : "false");
    btn.setAttribute("aria-label", `${buttonShowsPause ? "Pause" : "Play"} ${trackTitle}`);
  });
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
  syncCurrentPlaybackHighlights();
}

function setRangeProgress(el, value) {
  if (!el) return;
  const numeric = Math.max(0, Math.min(100, Number(value) || 0));
  el.style.setProperty("--range-progress", `${numeric}%`);
}

function updateProgressUI() {
  if (!els.audioPlayer) return;

  const current = els.audioPlayer.currentTime || 0;
  const duration = isFinite(els.audioPlayer.duration) ? els.audioPlayer.duration : 0;

  if (els.currentTime) els.currentTime.textContent = formatTime(current);
  if (els.duration) els.duration.textContent = formatTime(duration);

  if (els.seekBar) {
    const progress = duration ? (current / duration) * 100 : 0;
    els.seekBar.value = String(progress);
    setRangeProgress(els.seekBar, progress);
  }

  if (els.playerSheetCurrentTime) els.playerSheetCurrentTime.textContent = formatTime(current);
  if (els.playerSheetDuration) els.playerSheetDuration.textContent = formatTime(duration);
  if (els.playerSheetSeekBar) {
    const progress = duration ? (current / duration) * 100 : 0;
    els.playerSheetSeekBar.value = String(progress);
    setRangeProgress(els.playerSheetSeekBar, progress);
  }

  updateSyncedLyricsProgress();
  updateMediaSessionPositionState();
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
  return;
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
  updateAlbumModalOfflineButton(album);

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
        if (Date.now() < suppressPreviewClickUntil) return;
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
  if (els.playerSheetFavoriteBtn) {
    const icon = isFavorite(track) ? "★" : "☆";
    els.playerSheetFavoriteBtn.textContent = icon;
    els.playerSheetFavoriteBtn.setAttribute("aria-label", isFavorite(track) ? "Favorited" : "Favorite");
    els.playerSheetFavoriteBtn.title = isFavorite(track) ? "Favorited" : "Favorite";
  }
}

function renderFavorites() {
  if (!els.favoritesList) return;

  const favTracks = favorites
    .map(id => tracks.find(track => track.id === id))
    .filter(Boolean)
    .slice(0, 12);

  if (!favTracks.length) {
    els.favoritesList.innerHTML = window.AineoUI?.renderEmptyMessage ? window.AineoUI.renderEmptyMessage("No favorites yet.") : `<p class="empty-message">No favorites yet.</p>`;
    return;
  }

  els.favoritesList.innerHTML = favTracks.map((track, index) => renderMiniCard(track, index)).join("");
  bindMiniCardClicks(els.favoritesList, favTracks);
}


function isDownloaded(track) {
  return window.AineoOffline.isDownloaded({
    track,
    downloadedTracks
  });
}

function updateOfflineButtons(track = getCurrentTrack()) {
  window.AineoOffline.updateButtons({
    track,
    downloadedTracks,
    els
  });
}

function updateCollectionOfflineButtons(trackList = getFeaturedCollection()?.tracks || []) {
  if (!window.AineoOffline) return;
  const downloaded = window.AineoOffline.isCollectionDownloaded({ tracks: trackList, downloadedTracks });
  const offline = navigator.onLine === false;
  if (els.saveAlbumOfflineBtn) {
    els.saveAlbumOfflineBtn.textContent = downloaded
      ? 'Collection Saved ✓'
      : (offline ? 'Needs Internet' : 'Save Collection Offline');
    els.saveAlbumOfflineBtn.disabled = !downloaded && offline;
    els.saveAlbumOfflineBtn.classList.toggle('is-saved-offline', downloaded);
    els.saveAlbumOfflineBtn.classList.toggle('is-offline-disabled', !downloaded && offline);
  }
}

function updateAlbumModalOfflineButton(album = getAlbumModalAlbum()) {
  if (!window.AineoOffline || !els.albumModalSaveOfflineBtn) return;
  const downloaded = window.AineoOffline.isCollectionDownloaded({ tracks: album?.tracks || [], downloadedTracks });
  const offline = navigator.onLine === false;
  els.albumModalSaveOfflineBtn.textContent = downloaded
    ? 'Collection Saved ✓'
    : (offline ? 'Needs Internet' : 'Save Collection Offline');
  els.albumModalSaveOfflineBtn.disabled = !downloaded && offline;
  els.albumModalSaveOfflineBtn.classList.toggle('is-saved-offline', downloaded);
  els.albumModalSaveOfflineBtn.classList.toggle('is-offline-disabled', !downloaded && offline);
}

async function saveTrackOffline(track) {
  const result = await window.AineoOffline.saveTrackOffline({
    track,
    downloadedTracks,
    setDownloadedTracks(nextDownloadedTracks) {
      downloadedTracks = nextDownloadedTracks;
      window.downloadedTracks = downloadedTracks;
    },
    saveDownloadedTracks,
    els,
    renderDownloadedSongs,
    renderFeaturedTrackList,
    updateButtons: updateOfflineButtons,
    flashButtonText
  });
  updateCollectionOfflineButtons();
  updateAlbumModalOfflineButton();
  return result;
}

async function removeTrackOffline(track) {
  const result = await window.AineoOffline.removeTrackOffline({
    track,
    downloadedTracks,
    setDownloadedTracks(nextDownloadedTracks) {
      downloadedTracks = nextDownloadedTracks;
      window.downloadedTracks = downloadedTracks;
    },
    saveDownloadedTracks,
    renderDownloadedSongs,
    renderFeaturedTrackList,
    updateButtons: updateOfflineButtons,
    els,
    flashButtonText
  });
  updateCollectionOfflineButtons();
  updateAlbumModalOfflineButton();
  return result;
}

async function toggleTrackOffline(track) {
  const result = await window.AineoOffline.toggleTrackOffline({
    track,
    downloadedTracks,
    setDownloadedTracks(nextDownloadedTracks) {
      downloadedTracks = nextDownloadedTracks;
      window.downloadedTracks = downloadedTracks;
    },
    saveDownloadedTracks,
    els,
    renderDownloadedSongs,
    renderFeaturedTrackList,
    updateButtons: updateOfflineButtons,
    flashButtonText
  });
  updateCollectionOfflineButtons();
  updateAlbumModalOfflineButton();
  return result;
}

async function toggleCollectionOffline(trackList) {
  const result = await window.AineoOffline.toggleCollectionOffline({
    tracks: trackList,
    downloadedTracks,
    setDownloadedTracks(nextDownloadedTracks) {
      downloadedTracks = nextDownloadedTracks;
      window.downloadedTracks = downloadedTracks;
    },
    saveDownloadedTracks,
    els,
    renderDownloadedSongs,
    renderFeaturedTrackList,
    updateButtons: updateOfflineButtons,
    flashButtonText
  });
  updateCollectionOfflineButtons(trackList);
  updateAlbumModalOfflineButton();
  return result;
}

function renderDownloadedSongs() {
  return window.AineoOffline.renderDownloadedSongs({
    els,
    downloadedTracks,
    tracks,
    escapeHtml,
    escapeHtmlAttr,
    startPlaybackFromList,
    removeTrackOffline,
    getCurrentTrack
  });
}

function createNewPlaylist() {
  playlistPickerTrackId = null;
  if (els.playlistSelect) els.playlistSelect.innerHTML = `<option value="">Choose a playlist</option>`;
  if (els.newPlaylistName) els.newPlaylistName.value = "";
  openPlaylistModal(null, els.createPlaylistBtn);
}

function renderMyPlaylistsLegacyV1() {
  if (!els.myPlaylistList) return;

  const names = Object.keys(customPlaylists).sort((a, b) => a.localeCompare(b));

  if (!names.length) {
    els.myPlaylistList.innerHTML = window.AineoUI?.renderEmptyMessage ? window.AineoUI.renderEmptyMessage("No custom playlists yet.") : `<p class="empty-message">No custom playlists yet.</p>`;
    return;
  }

  els.myPlaylistList.innerHTML = names.map(name => window.AineoUI?.renderPlaylistChipRow ? window.AineoUI.renderPlaylistChipRow({ name, count: customPlaylists[name].length, escapeHtml, escapeAttr: escapeHtmlAttr }) : `
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
      filters.selectedSmartPlaylist = null;
      filters.selectedCustomPlaylist = btn.dataset.customPlaylist;
      filters.searchTerm = "";
      if (els.searchInput) els.searchInput.value = "";
      renderActiveFilterLabel();
      renderAlbums(filteredTracks);
      renderFeaturedAlbum();
      renderFeaturedTrackList();
      renderQueue();
      scrollToTrackList();
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
  window.AineoPlaylists.openPlaylistModal({
    els,
    customPlaylists,
    track,
    triggerEl,
    setLastFocusedElement(value) {
      lastFocusedElement = value;
    },
    setPlaylistPickerTrackId(value) {
      playlistPickerTrackId = value;
    },
    lockBodyScroll
  });
}

function openPlaylistModalForTrack(track, triggerEl = null) {
  if (!track) return;
  openPlaylistModal(track, triggerEl);
}

function closePlaylistModal() {
  window.AineoPlaylists.closePlaylistModal({
    els,
    isAnyModalOpen,
    lockBodyScroll,
    restoreFocus,
    onClosed() {
      playlistPickerTrackId = null;
    }
  });
}

function saveTrackToPlaylistFromModal() {
  const result = window.AineoPlaylists.saveTrackToPlaylistFromModal({
    els,
    customPlaylists,
    playlistPickerTrackId
  });
  if (!result?.saved) return;
  saveCustomPlaylists();
  renderMyPlaylists();
  closePlaylistModal();
}

function recordTrackPlay(track) {
  if (!track?.id) return;
  const current = playStats[track.id] || { count: 0, lastPlayed: "" };
  playStats[track.id] = {
    count: Number(current.count || 0) + 1,
    lastPlayed: new Date().toISOString()
  };
  track.play_count = playStats[track.id].count;
  track.last_played = playStats[track.id].lastPlayed;
  savePlayStats();
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
    els.recentlyPlayedList.innerHTML = window.AineoUI?.renderEmptyMessage ? window.AineoUI.renderEmptyMessage("No recent songs yet.") : `<p class="empty-message">No recent songs yet.</p>`;
    return;
  }

  els.recentlyPlayedList.innerHTML = recentTracks.map((track, index) => renderMiniCard(track, index)).join("");
  bindMiniCardClicks(els.recentlyPlayedList, recentTracks);
}

function renderMiniCard(track, index) {
  if (window.AineoUI?.renderMiniCard) {
    return window.AineoUI.renderMiniCard({
      track,
      index,
      escapeHtml,
      escapeAttr: escapeHtmlAttr
    });
  }

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
      if (Date.now() < suppressPreviewClickUntil) return;
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
  return window.AineoQueue.getDisplayTracks({ currentQueue, filteredTracks, tracks });
}

function renderQueue() {
  window.AineoQueue.renderQueue({
    currentQueue,
    currentQueueIndex,
    filteredTracks,
    tracks,
    queueListEl: els.queueList,
    queueCountEl: els.queueCount,
    playerSheetQueuePanelEl: els.playerSheetQueuePanel,
    audioPlayer: els.audioPlayer,
    getCurrentTrack,
    escapeHtml,
    escapeHtmlAttr,
    bindInteractions(container, displayTracks) {
      window.AineoQueue.bindInteractions({
        container,
        displayTracks,
        currentQueue,
        setCurrentQueue(nextQueue) {
          currentQueue = nextQueue;
        },
        getCurrentQueueIndex: () => currentQueueIndex,
        setCurrentQueueIndex(nextIndex) {
          currentQueueIndex = nextIndex;
        },
        getCurrentTrack,
        togglePlayPause,
        setQueue,
        playFromQueueIndex,
        saveQueueState,
        renderQueue,
        syncQueuePlaybackUI,
        openAndScrollQueueToCurrentTrack,
        openTrackActionSheet,
        setQueueDragIndex(value) {
          queueDragIndex = value;
        },
        getQueueDragIndex() {
          return queueDragIndex;
        }
      });
    }
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

/* =========================
   RESUME
========================= */

function showResumeBannerIfAvailable() {
  if (!resumeTrackSrc || !els.continueListeningCard) return;

  const track = tracks.find(t => t.src === resumeTrackSrc);
  if (!track) return;

  if (els.continueListeningCover) {
    els.continueListeningCover.src = track.cover || "";
    els.continueListeningCover.alt = `${track.title} cover`;
  }
  if (els.continueListeningTitle) els.continueListeningTitle.textContent = track.title;
  if (els.continueListeningMeta) els.continueListeningMeta.textContent = `${track.album} • Resume from ${formatSecondsToClock(resumeTrackTime || 0)}`;
  els.continueListeningCard.classList.remove("hidden");
}

function hideResumeBanner() {
  if (els.continueListeningCard) {
    els.continueListeningCard.classList.add("hidden");
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

const PLAYER_SHEET_TABS = ["lyrics"];

function initPlayerSheetGestures() {
  window.AineoPlayerSheet.initGestures({
    els,
    getPlayerSheetTab: () => playerSheetTab,
    setPlayerSheetTab,
    playNextTrack,
    playPreviousTrack,
    closePlayerSheet,
    openPlayerSheet
  });
}

function openPlayerSheet(triggerEl = null) {
  window.AineoPlayerSheet.open({
    els,
    triggerEl,
    setLastFocusedElement(value) {
      lastFocusedElement = value;
    },
    lockBodyScroll,
    updatePlayerSheet
  });
}

function closePlayerSheet() {
  window.AineoPlayerSheet.close({
    els,
    isAnyModalOpen,
    lockBodyScroll,
    restoreFocus
  });
}

function setPlayerSheetTab(tabName) {
  playerSheetTab = window.AineoPlayerSheet.setTab({
    tabName,
    currentTab: playerSheetTab
  });
}


function openPlayerSheetLyricsPanel() {
  setPlayerSheetTab("lyrics");
  window.AineoPlayerSheet.openLyricsPanel({
    els
  });
}

function updatePlayerSheet() {
  updatePlaybackModeButtons();
  window.AineoPlayerSheet.update({
    els,
    track: getCurrentTrack(),
    audioPlayer: els.audioPlayer,
    renderScriptureLinks,
    renderLyricsInto,
    updateOfflineButtons,
    updateFavoriteButton,
    updateProgressUI,
    getPlayerSheetTab: () => playerSheetTab,
    setPlayerSheetTab
  });
}

/* =========================
   URL / STATE HELPERS
========================= */

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
  updateSyncedLyricsProgress();
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
    filters.selectedSmartPlaylist ||
    filters.selectedCustomPlaylist ||
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

  ["pointerdown", "touchstart"].forEach(eventName => {
    els.moreActionsBtn.addEventListener(eventName, e => {
      e.stopPropagation();
    }, { passive: true });
  });

  els.moreActionsBtn.addEventListener("click", e => {
    e.preventDefault();
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
  activeCustomPlaylistName = window.AineoPlaylists.normalizeState({
    customPlaylists,
    activeCustomPlaylistName: filters.selectedCustomPlaylist || null
  });
  if (filters.selectedCustomPlaylist && activeCustomPlaylistName !== filters.selectedCustomPlaylist) {
    filters.selectedCustomPlaylist = activeCustomPlaylistName;
  }
  if (!filters.selectedCustomPlaylist) {
    activeCustomPlaylistName = null;
  }
}

function getCustomPlaylistTracks(name) {
  return window.AineoPlaylists.getCustomPlaylistTracks({
    name,
    customPlaylists,
    tracks
  });
}

function ensurePlaylistWorkspace() {
  return window.AineoPlaylists.ensureWorkspace({
    els,
    createPlaylistBtn: els.createPlaylistBtn,
    onCreatePlaylist: createNewPlaylist
  });
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
    .map(src => `<img loading="lazy" decoding="async" fetchpriority="low" src="${escapeHtmlAttr(src)}" alt="" />`)
    .join("");
}

function applyCustomPlaylistFilter(name) {
  const result = window.AineoPlaylists.applyCustomPlaylistFilter({
    name,
    customPlaylists,
    filters,
    searchInput: els.searchInput,
    onAfterChange: () => {
      activeCustomPlaylistName = name;
      updateLibraryView();
      scrollToTrackList();
    }
  });
  if (!result?.applied) return;
}

function setActiveCustomPlaylist(name) {
  const result = window.AineoPlaylists.setActiveCustomPlaylist({
    name,
    customPlaylists,
    currentActiveName: activeCustomPlaylistName
  });
  activeCustomPlaylistName = result.activeName;
  if (result.activeName) {
    filters.selectedCustomPlaylist = result.activeName;
  }
  if (!result.changed) return;
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
  window.AineoPlaylists.renderWorkspace({
    els,
    activeCustomPlaylistName,
    getCustomPlaylistTracks,
    startPlaybackFromList,
    applyCustomPlaylistFilter,
    escapeHtml,
    escapeHtmlAttr,
    isFavorite,
    isDownloaded,
    getCurrentTrack,
    audioPlayer: els.audioPlayer,
    togglePlayPause,
    toggleFavorite,
    openLyricsModalForTrack,
    openPlaylistModalForTrack,
    saveTrackOffline,
    removeTrackOffline,
    triggerDownload,
    safeFileName,
    customPlaylists,
    saveCustomPlaylists,
    renderMyPlaylists,
    onPlaylistChanged(name) {
      if (getCurrentFilterKey() === `custom-playlist:${name}`) {
        applyCustomPlaylistFilter(name);
      }
    }
  });
}

function renderMyPlaylists() {
  normalizeCustomPlaylistState();
  ensurePlaylistWorkspace();
  window.AineoPlaylists.renderMyPlaylists({
    els,
    customPlaylists,
    activeCustomPlaylistName,
    filters,
    getCustomPlaylistTracks,
    setActiveCustomPlaylist,
    startPlaybackFromList,
    applyCustomPlaylistFilter,
    saveCustomPlaylists,
    onDelete(name) {
      delete customPlaylists[name];
      if (activeCustomPlaylistName === name) activeCustomPlaylistName = null;
    },
    renderPlaylistWorkspace,
    escapeHtml,
    escapeHtmlAttr
  });
}
