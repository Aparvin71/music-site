/* v43.2.26 share app preview path and card display repair pass */
window.__AINEO_APP_JS_NAV__ = true;
let tracks = [];
let filteredTracks = [];
let currentTrackIndex = -1;
let currentQueue = [];
let currentQueueIndex = -1;
let currentPlaybackTrackId = "";
window.__AINEO_CURRENT_PLAYBACK_TRACK_ID__ = "";
let continuousPlaybackWanted = false;
let userPausedPlayback = false;
let backgroundAdvanceInFlight = false;
let queuedAutoAdvanceTimer = 0;
let favorites = [];
let recentlyPlayed = [];
let resumeTrackSrc = null;
let resumeTrackTime = 0;
let resumeTrackTitle = '';
let shuffleModeEnabled = false;
let repeatMode = "off";
let pendingResumeSeek = null;
let lastResumePersistAt = 0;
let restoredPausedSession = null;
let resumeChoiceAcceptedForTrackId = "";
let pendingSavedAudioHydration = null;
let lastKnownPersistedPosition = null;
let lastFocusedElement = null;
let customPlaylists = {};
let downloadedTracks = [];
window.downloadedTracks = downloadedTracks;
let playStats = {};
let playlistPickerTrackId = null;
let playerSheetTab = "lyrics";
let queueDragIndex = null;
let syncedLyricsRequestToken = 0;
const autoScrollEnabled = false;
let actionSheetTrackId = "";
let actionSheetTriggerEl = null;
let socialShareTrackId = "";
let socialShareMode = "track";
let socialShareTriggerEl = null;
let previewAudio = null;
let previewTrackId = '';
let previewHoldTimer = null;
let suppressPreviewClickUntil = 0;
let visualizerFrame = 0;
let visualizerBars = [];
let visualizerTick = 0;
const VISUALIZER_BAR_COUNT = 48;
let visualizerRenderedBands = [];
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
const BATTERY_OPTIMIZATION_VERSION = "43.2.26";
const BATTERY_OPTIMIZATION_KEYS = {
  lowPowerMode: "aineo_low_power_mode"
};
let lowPowerModeEnabled = false;
let lastProgressUiUpdateAt = 0;
let playbackContinuityTimer = 0;
let playbackStateSaveTimer = 0;
const AUDIO_READY_TIMEOUT_MS = 9000;

function devicePrefersLowPowerMode() {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    if (window.matchMedia && window.matchMedia('(max-width: 900px)').matches) return true;
    if (navigator.connection && navigator.connection.saveData) return true;
  } catch (error) {}
  return false;
}

function loadLowPowerModeEnabled() {
  try {
    const stored = localStorage.getItem(BATTERY_OPTIMIZATION_KEYS.lowPowerMode);
    if (stored == null) return devicePrefersLowPowerMode();
    return stored !== '0';
  } catch (error) {
    return devicePrefersLowPowerMode();
  }
}

function applyLowPowerModeClass() {
  document.body.classList.toggle('aineo-low-power', Boolean(lowPowerModeEnabled));
}

function setLowPowerModeEnabled(nextValue) {
  lowPowerModeEnabled = Boolean(nextValue);
  try {
    localStorage.setItem(BATTERY_OPTIMIZATION_KEYS.lowPowerMode, lowPowerModeEnabled ? '1' : '0');
  } catch (error) {}
  applyLowPowerModeClass();
  if (!shouldRunVisualizer()) stopVisualizerAnimation();
  else startVisualizerAnimation();
  return lowPowerModeEnabled;
}

function isPlayerSheetOpen() {
  return Boolean(els.playerSheet && !els.playerSheet.classList.contains('hidden') && els.playerSheet.classList.contains('is-open'));
}

function shouldRunVisualizer() {
  return false;
}

lowPowerModeEnabled = loadLowPowerModeEnabled();

const STORAGE_KEYS = (window.AineoConfig && window.AineoConfig.storageKeys) || {
  favorites: "aineo_favorites",
  recentlyPlayed: "aineo_recently_played",
  resume: "aineo_resume",
  customPlaylists: "aineo_custom_playlists",
  downloadedTracks: "aineo_downloaded_tracks",
  playStats: "aineo_play_stats",
  lastQueue: "aineo_last_queue",
  playbackModes: "aineo_playback_modes",
  playerState: "aineo_player_state",
  homeListChoice: "aineo_home_list_choice",
  lastHomePlaylistSelection: "aineo_last_home_playlist_selection"
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

const HOME_LIST_CHOICES = new Set(["suggested", "my-songs", "favorites", "recent"]);
let homeListChoice = "suggested";
let lastHomePlaylistSelection = null;
const HOME_SUGGESTED_TRACK_IDS = [
  "carry-the-light__alive-in-me__3",
  "carry-the-light__trash-in-trash-out__61",
  "carry-the-light__lead-me-home-good-shepherd__32",
  "carry-the-light__same-mouth__50",
  "alpha-and-omega__you-spoke__71",
  "alpha-and-omega__praise-the-lord-o-my-soul__45",
  "alpha-and-omega__worth-it-all__69",
  "alpha-and-omega__you-see-me__70",
  "alpha-and-omega__moved-with-compassion__39",
  "carry-the-light__turn-that-other-cheek__62",
  "carry-the-light__same-sky__51"
];

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
  homeListHelper: document.getElementById("homeListHelper"),

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
  restartSongBtn: document.getElementById("restartSongBtn"),
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
  playerSheetLyricsBtn: document.getElementById("playerSheetLyricsBtn"),
  playerSheetShareBtn: document.getElementById("playerSheetShareBtn"),
  playerSheetMoreBtn: document.getElementById("playerSheetMoreBtn"),
  playerSheetMoreMenu: document.getElementById("playerSheetMoreMenu"),
  playerSheetMorePlaylistBtn: document.getElementById("playerSheetMorePlaylistBtn"),
  playerSheetMoreDownloadBtn: document.getElementById("playerSheetMoreDownloadBtn"),
  playerSheetMoreLyricsBtn: document.getElementById("playerSheetMoreLyricsBtn"),
  playerSheetMoreShareBtn: document.getElementById("playerSheetMoreShareBtn"),
  playerSheetFavoriteBtn: document.getElementById("playerSheetFavoriteBtn"),
  playerSheetLyricsPanel: document.getElementById("playerSheetLyricsPanel"),
  playerSheetScripturePanel: document.getElementById("playerSheetScripturePanel"),  offlineStatusMount: document.getElementById("offlineStatusMount"),
  trackActionSheet: document.getElementById("trackActionSheet"),
  trackActionSheetBackdrop: document.getElementById("trackActionSheetBackdrop"),
  trackActionSheetTitle: document.getElementById("trackActionSheetTitle"),
  trackActionSheetMeta: document.getElementById("trackActionSheetMeta"),
  trackActionCloseXBtn: document.getElementById("trackActionCloseXBtn"),
  trackActionPlayNextBtn: document.getElementById("trackActionPlayNextBtn"),
  trackActionAddPlaylistBtn: document.getElementById("trackActionAddPlaylistBtn"),
  trackActionSaveOfflineBtn: document.getElementById("trackActionSaveOfflineBtn"),
  trackActionGoAlbumBtn: document.getElementById("trackActionGoAlbumBtn"),
  trackActionShareBtn: document.getElementById("trackActionShareBtn"),
  trackActionCloseBtn: document.getElementById("trackActionCloseBtn"),

  socialShareSheet: document.getElementById("socialShareSheet"),
  socialShareBackdrop: document.getElementById("socialShareBackdrop"),
  socialShareCloseBtn: document.getElementById("socialShareCloseBtn"),
  socialShareTitle: document.getElementById("socialShareTitle"),
  socialShareMeta: document.getElementById("socialShareMeta"),
  socialSharePreview: document.getElementById("socialSharePreview"),
  socialShareNativeBtn: document.getElementById("socialShareNativeBtn"),
  socialShareFacebookBtn: document.getElementById("socialShareFacebookBtn"),
  socialShareXBtn: document.getElementById("socialShareXBtn"),
  socialShareCopyBtn: document.getElementById("socialShareCopyBtn"),
  socialShareDownloadBtn: document.getElementById("socialShareDownloadBtn"),
  socialShareStoryBtn: document.getElementById("socialShareStoryBtn"),
  socialShareAppBtn: document.getElementById("socialShareAppBtn"),
  shareAppHomeBtn: document.getElementById("shareAppHomeBtn"),
  shareAppLibraryBtn: document.getElementById("shareAppLibraryBtn")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  loadStoredData();
  loadHomeListChoice();
  loadLastHomePlaylistSelection();
  configureAudioElementForContinuousPlayback();
  bindUI();
  bindPlaybackLifecycleGuards();
  bindMediaSessionHandlers();
  initOfflineStatus();
  initCollapsibles();
  initActionButtonIsolation();
  initSmoothHashJumps();
  initMobilePlayerDrawer();
  initHoldToPreview();
  initMobileNav();
  initPlayerSheetGestures();
  initTabletStickyFilterBar();
  await loadTracks();
  syncHomeListTabs();
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

function mergeTrackAnalysis(track) {
  return track;
}

async function ensureTrackAnalysisLoaded(track) {
  return track || null;
}

function prefetchTrackAnalysis() {}

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
    if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' });
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
        lyrics_file: (() => {
          const raw = String(track.lyrics_file || track.lyricsFile || "").trim();
          if (!raw) return "";
          if (/^https?:\/\//i.test(raw)) return raw;
          const basePath = String(window.AineoConfig?.app?.assets?.lyricsBasePath || "lyrics").replace(/\/$/, "");
          if (raw.startsWith("lyrics/")) return raw;
          if (basePath && !raw.startsWith(basePath + "/")) return `${basePath}/${raw.replace(/^\/+/, "")}`;
          return raw;
        })(),
        lyrics_offset: Number(track.lyrics_offset ?? track.lyricsOffset ?? 0) || 0,
        syncedLyrics: [],
        tags,
        playlists,
        scripture_references: scriptureRefs,
        trackNumber: track.trackNumber || track.track || "",
        description: track.description || "",
        album_zip: track.album_zip || "",
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
  return false;
}

function loadAutoScrollEnabled() {
  return false;
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
    lyricsSyncFrame = 0;
  }
}

function runLyricsSyncLoop() {
  stopLyricsSyncLoop();
}

function startLyricsSyncLoop() {
  stopLyricsSyncLoop();
}

function updateAutoScrollToggleUI() {
  if (!els.playerSheetAutoScrollBtn) return;
  els.playerSheetAutoScrollBtn.remove();
  els.playerSheetAutoScrollBtn = null;
}

function toggleAutoScroll() {
  return false;
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

function showToast(message, duration = 2200) {
  if (!message) return;
  try {
    if (typeof window !== 'undefined' && typeof window.showToast === 'function' && window.showToast !== showToast) {
      window.showToast(message, duration);
      return;
    }
    let toast = document.getElementById('aineo-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'aineo-toast';
      toast.setAttribute('aria-live', 'polite');
      toast.style.cssText = 'position:fixed;left:50%;bottom:92px;transform:translateX(-50%);max-width:min(80vw,420px);padding:10px 14px;border-radius:999px;background:rgba(10,14,24,0.88);color:#fff;font-size:13px;line-height:1.3;box-shadow:0 12px 30px rgba(0,0,0,0.35);z-index:99999;opacity:0;pointer-events:none;transition:opacity 180ms ease';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      if (toast) toast.style.opacity = '0';
    }, duration);
  } catch (_) {}
}

function buildTrackAudioCandidates(track) {
  const raw = [track?.audio, track?.src].filter(Boolean);
  const seen = new Set();
  const out = [];
  const push = (value) => {
    if (!value || seen.has(value)) return;
    seen.add(value);
    out.push(value);
  };

  for (const value of raw) {
    push(value);
    try { push(decodeURIComponent(value)); } catch (_) {}
    push(value.replace(/%27/g, "'"));
    push(value.replace(/'/g, '%27'));
    push(value.replace(/Don't/g, 'Don%E2%80%99t'));
    push(value.replace(/Don%E2%80%99t/g, 'Don%23U2019t'));
    push(value.replace(/%23U2019/g, '%E2%80%99'));
  }

  const audioBaseUrl = window.AineoConfig?.assets?.audioBaseUrl || '';
  const names = [track?.title, ...(track?.title_aliases || [])].filter(Boolean);
  if (audioBaseUrl && names.length) {
    for (const name of names) {
      const baseName = `${name}.mp3`;
      push(`${audioBaseUrl}/${encodeURIComponent(baseName).replace(/%2F/g, '/')}`);
      push(`${audioBaseUrl}/${baseName}`);
      push(`${audioBaseUrl}/${baseName.replace(/'/g, '%27')}`);
    }
  }

  return out;
}

function configureAudioElementForContinuousPlayback() {
  const audio = els.audioPlayer;
  if (!audio) return;
  audio.preload = "auto";
  audio.setAttribute("preload", "auto");
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
  audio.setAttribute("x-webkit-airplay", "allow");
  try { audio.disableRemotePlayback = false; } catch (error) {}
}

function persistPlaybackStateSoon(reason = "state") {
  window.clearTimeout(playbackStateSaveTimer);
  playbackStateSaveTimer = window.setTimeout(() => {
    const current = getCurrentTrack();
    if (current) {
      saveResume(current);
      savePlayerState(current);
    } else {
      savePlayerState();
    }
    try {
      sessionStorage.setItem("aineo_playback_last_health", JSON.stringify({
        reason,
        wanted: continuousPlaybackWanted,
        userPaused: userPausedPlayback,
        trackId: current?.id || "",
        time: Math.max(0, Number(els.audioPlayer?.currentTime) || 0),
        paused: Boolean(els.audioPlayer?.paused ?? true),
        ended: Boolean(els.audioPlayer?.ended),
        updatedAt: Date.now()
      }));
    } catch (error) {}
  }, 80);
}

function schedulePlaybackContinuityCheck(reason = "unknown", delayMs = 6500) {
  window.clearTimeout(playbackContinuityTimer);
  if (!continuousPlaybackWanted || userPausedPlayback || !els.audioPlayer) return;
  playbackContinuityTimer = window.setTimeout(() => {
    const audio = els.audioPlayer;
    const current = getCurrentTrack();
    if (!audio || !current || userPausedPlayback || !continuousPlaybackWanted) return;
    persistPlaybackStateSoon(`continuity:${reason}`);
    updateMediaSessionMetadata(current);
    updateMediaSessionPlaybackState();
    updateMediaSessionPositionState(true);

    if (audio.ended) {
      handleTrackEnded();
      return;
    }

    if (document.hidden) return;

    if (audio.paused && !userPausedPlayback && continuousPlaybackWanted) {
      audio.play().then(() => {
        updatePlayButton();
        syncCurrentPlaybackHighlights();
        syncQueuePlaybackUI();
      }).catch(() => handlePlaybackErrorRecovery());
      return;
    }

    if (navigator.onLine !== false && audio.readyState < 2 && !backgroundAdvanceInFlight) {
      handlePlaybackErrorRecovery();
    }
  }, delayMs);
}

function bindPlaybackLifecycleGuards() {
  if (window.__AINEO_PLAYBACK_LIFECYCLE_BOUND__) return;
  window.__AINEO_PLAYBACK_LIFECYCLE_BOUND__ = true;

  document.addEventListener("visibilitychange", () => {
    const current = getCurrentTrack();
    if (current) persistPlaybackStateSoon(document.hidden ? "hidden" : "visible");
    updateMediaSessionPlaybackState();
    updateMediaSessionPositionState(true);

    if (!document.hidden && continuousPlaybackWanted && !userPausedPlayback && els.audioPlayer?.paused && current) {
      schedulePlaybackContinuityCheck("visible-resume", 180);
    }
  }, { passive: true });

  window.addEventListener("pagehide", () => persistPlaybackStateSoon("pagehide"), { passive: true });
  window.addEventListener("beforeunload", () => persistPlaybackStateSoon("beforeunload"), { passive: true });
  window.addEventListener("pageshow", () => {
    configureAudioElementForContinuousPlayback();
    const current = getCurrentTrack();
    if (current) {
      updateMediaSessionMetadata(current);
      updateMediaSessionPositionState(true);
    }
    if (continuousPlaybackWanted && !userPausedPlayback && els.audioPlayer?.paused && current) {
      schedulePlaybackContinuityCheck("pageshow-resume", 220);
    }
  }, { passive: true });
}

function getPrimaryAudioCandidate(track) {
  const candidates = buildTrackAudioCandidates(track);
  return candidates[0] || track?.src || track?.audio || "";
}

function markUserPlaybackIntent(shouldPlay) {
  continuousPlaybackWanted = Boolean(shouldPlay);
  userPausedPlayback = !shouldPlay;
  window.__AINEO_CONTINUOUS_PLAYBACK_WANTED__ = continuousPlaybackWanted;
}

function hasPlayableNextTrack() {
  if (!Array.isArray(currentQueue) || currentQueue.length < 2) return false;
  if (repeatMode === "one") return true;
  return repeatMode !== "off" || currentQueueIndex < currentQueue.length - 1;
}

function getNextQueueIndexForAutoAdvance() {
  if (!Array.isArray(currentQueue) || !currentQueue.length) return -1;
  if (repeatMode === "one") return Math.max(0, currentQueueIndex);
  const atEnd = currentQueueIndex >= currentQueue.length - 1;
  if (atEnd) return repeatMode === "off" ? -1 : 0;
  return currentQueueIndex + 1;
}

function primeNextAudioForContinuousPlayback() {
  if (!els.audioPlayer || !continuousPlaybackWanted || !hasPlayableNextTrack()) return;
  const nextIndex = getNextQueueIndexForAutoAdvance();
  const nextTrack = nextIndex >= 0 ? currentQueue[nextIndex] : null;
  if (!nextTrack) return;
  try {
    const url = getPrimaryAudioCandidate(nextTrack);
    if (!url) return;
    const warm = new Audio();
    warm.preload = "auto";
    warm.src = url;
    warm.load();
    window.__AINEO_NEXT_AUDIO_PRIME__ = warm;
  } catch (error) {}
}

async function playTrackContinuousAdvance(track) {
  if (!track || !els.audioPlayer) return;
  const requestId = ++playbackRequestId;
  backgroundAdvanceInFlight = true;
  setCurrentPlaybackTrack(track);
  setPendingPlaybackTrack(track.id);
  updateNowPlaying(track);
  renderQueue();
  renderFeaturedTrackList();
  syncCurrentPlaybackHighlights();
  syncQueuePlaybackUI();
  updateMediaSessionMetadata(track);
  updateLyricsPanel(track);
  updateSyncedLyricsProgress();

  try {
    await setAudioSourceWithFallback(track, els.audioPlayer);
    const playPromise = els.audioPlayer.play();
    if (playPromise && typeof playPromise.then === "function") await playPromise;
    if (requestId !== playbackRequestId) return;
    clearPendingPlaybackTrack(track.id);
    playbackErrorRecoveryCount = 0;
    playbackErrorRecoveryAt = 0;
    updatePlayButton();
    syncCurrentPlaybackHighlights();
    syncQueuePlaybackUI();
    updateScripturePanel(track);
    recordTrackPlay(track);
    addToRecentlyPlayed(track);
    saveResume(track);
    saveQueueState();
    savePlayerState(track, 0);
    requestPlaybackUiSync();
    updateUrlForTrack(track);
    ensureSmartQueueSuggestion(track);
    primeNextAudioForContinuousPlayback();
  } catch (error) {
    console.error("Continuous advance failed:", error);
    if (requestId === playbackRequestId && !userPausedPlayback && continuousPlaybackWanted) {
      window.clearTimeout(queuedAutoAdvanceTimer);
      queuedAutoAdvanceTimer = window.setTimeout(() => handlePlaybackErrorRecovery(), 250);
    }
  } finally {
    backgroundAdvanceInFlight = false;
  }
}

function advanceContinuousPlayback() {
  if (!continuousPlaybackWanted || userPausedPlayback || backgroundAdvanceInFlight) return;
  if (!Array.isArray(currentQueue) || !currentQueue.length) return;
  const nextIndex = getNextQueueIndexForAutoAdvance();
  if (nextIndex < 0) {
    continuousPlaybackWanted = false;
    updatePlayButton();
    syncCurrentPlaybackHighlights();
    syncQueuePlaybackUI();
    return;
  }
  currentQueueIndex = nextIndex;
  const nextTrack = currentQueue[currentQueueIndex];
  playTrackContinuousAdvance(nextTrack);
}

async function setAudioSourceWithFallback(track, targetAudio) {
  const audioEl = targetAudio || els.audioPlayer;
  if (!audioEl) throw new Error('Audio player is not available');
  const candidates = buildTrackAudioCandidates(track);
  let lastError = null;
  suppressAudioErrorRecovery += 1;
  try {
    for (const candidate of candidates) {
      try {
        audioEl.pause();
        audioEl.removeAttribute('src');
        audioEl.load();
        audioEl.src = candidate;
        audioEl.load();
        await new Promise((resolve, reject) => {
          const onReady = () => {
            cleanup();
            updatePlayButton();
            syncCurrentPlaybackHighlights();
            syncQueuePlaybackUI();
            resolve();
          };
          const onError = () => {
            cleanup();
            // Keep the UI locked while trying the next fallback candidate.
            updatePlayButton();
            syncCurrentPlaybackHighlights();
            syncQueuePlaybackUI();
            const mediaError = audioEl.error;
            reject(mediaError ? new Error(mediaError.message || `Media error code ${mediaError.code}`) : new Error('Audio source failed to load'));
          };
          const timer = setTimeout(() => {
            cleanup();
            updatePlayButton();
            syncCurrentPlaybackHighlights();
            syncQueuePlaybackUI();
            reject(new Error('Timed out loading audio source'));
          }, AUDIO_READY_TIMEOUT_MS);
          function cleanup() {
            clearTimeout(timer);
            audioEl.removeEventListener('canplay', onReady);
            audioEl.removeEventListener('loadedmetadata', onReady);
            audioEl.removeEventListener('error', onError);
          }
          audioEl.addEventListener('canplay', onReady, { once: true });
          audioEl.addEventListener('loadedmetadata', onReady, { once: true });
          audioEl.addEventListener('error', onError, { once: true });
        });
        track.audio = candidate;
        track.src = candidate;
        return candidate;
      } catch (error) {
        lastError = error;
        console.warn('Audio candidate failed', { title: track?.title, candidate, error: String(error?.message || error) });
      }
    }
  } finally {
    suppressAudioErrorRecovery = Math.max(0, suppressAudioErrorRecovery - 1);
  }
  const finalError = lastError || new Error('No supported audio source found for this track');
  console.error('All audio candidates failed', { title: track?.title, candidates, error: String(finalError?.message || finalError) });
  throw finalError;
}

function savePlayStats() {
  localStorage.setItem(STORAGE_KEYS.playStats, JSON.stringify(playStats));
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


function getTrackDurationSeconds(track, fallbackDuration = 0) {
  return Math.max(0, Number(fallbackDuration) || Number(track?.duration_seconds) || Number(track?.duration) || 0);
}

function applyPersistedProgressUI(track, timeSeconds = 0, durationSeconds = 0) {
  const current = Math.max(0, Number(timeSeconds) || 0);
  const duration = getTrackDurationSeconds(track, durationSeconds || els.audioPlayer?.duration || 0);
  const progress = duration ? Math.max(0, Math.min(100, (current / duration) * 100)) : 0;
  lastKnownPersistedPosition = {
    trackId: track?.id || '',
    time: current,
    duration,
    updatedAt: Date.now()
  };

  if (els.currentTime) els.currentTime.textContent = formatTime(current);
  if (els.duration) els.duration.textContent = formatTime(duration);
  if (els.seekBar) {
    els.seekBar.value = String(progress);
    setRangeProgress(els.seekBar, progress);
  }

  if (els.playerSheetCurrentTime) els.playerSheetCurrentTime.textContent = formatTime(current);
  if (els.playerSheetDuration) els.playerSheetDuration.textContent = formatTime(duration);
  if (els.playerSheetSeekBar) {
    els.playerSheetSeekBar.value = String(progress);
    setRangeProgress(els.playerSheetSeekBar, progress);
  }
}

function clearResumeChoicePrompt() {
  const existing = document.getElementById('aineoResumeChoicePrompt');
  if (existing) existing.remove();
}

function showResumeChoicePrompt(track, timeSeconds = 0) {
  if (!track || !document.body) return;
  if ((Number(timeSeconds) || 0) < 2) return;
  clearResumeChoicePrompt();
  restoredPausedSession = {
    trackId: track.id,
    time: Math.max(0, Number(timeSeconds) || 0),
    duration: getTrackDurationSeconds(track, lastKnownPersistedPosition?.duration || 0)
  };

  const prompt = document.createElement('div');
  prompt.id = 'aineoResumeChoicePrompt';
  prompt.className = 'aineo-resume-choice';
  prompt.setAttribute('role', 'dialog');
  prompt.setAttribute('aria-live', 'polite');
  prompt.innerHTML = `
    <div class="aineo-resume-choice__card">
      <button id="aineoResumeChoiceClose" class="aineo-resume-choice__close" type="button" aria-label="Close resume choice">×</button>
      <img class="aineo-resume-choice__cover" src="${escapeHtml(track.cover || '')}" alt="${escapeHtml(track.title || 'Track')} cover">
      <div class="aineo-resume-choice__copy">
        <p class="aineo-resume-choice__eyebrow">Continue listening?</p>
        <h3>${escapeHtml(track.title || 'This song')}</h3>
        <p>Paused at ${formatTime(restoredPausedSession.time)}.</p>
      </div>
      <div class="aineo-resume-choice__actions">
        <button id="aineoResumeChoiceResume" class="action-btn" type="button">Resume</button>
        <button id="aineoResumeChoiceRestart" class="action-btn secondary-btn" type="button">Start Over</button>
      </div>
    </div>`;
  document.body.appendChild(prompt);
  document.getElementById('aineoResumeChoiceResume')?.addEventListener('click', () => resumePersistedTrackChoice(true));
  document.getElementById('aineoResumeChoiceRestart')?.addEventListener('click', () => resumePersistedTrackChoice(false));
  document.getElementById('aineoResumeChoiceClose')?.addEventListener('click', clearResumeChoicePrompt);
}

function shouldAskResumeChoice() {
  const current = getCurrentTrack();
  if (!current || !restoredPausedSession) return false;
  if (resumeChoiceAcceptedForTrackId === current.id) return false;
  if (restoredPausedSession.trackId !== current.id) return false;
  if (!els.audioPlayer?.paused) return false;
  return (Number(restoredPausedSession.time) || 0) > 2;
}

async function resumePersistedTrackChoice(shouldResume = true) {
  const session = restoredPausedSession;
  const track = session ? tracks.find(item => item.id === session.trackId) : getCurrentTrack();
  if (!track) return;
  resumeChoiceAcceptedForTrackId = track.id;
  clearResumeChoicePrompt();
  const targetTime = shouldResume ? Math.max(0, Number(session?.time) || Number(resumeTrackTime) || 0) : 0;
  resumeTrackSrc = shouldResume ? track.src : null;
  resumeTrackTime = targetTime;
  if (!currentQueue.length) setQueue(getCurrentCollectionTracks().length ? getCurrentCollectionTracks() : tracks, false);
  const queueIndex = currentQueue.findIndex(item => item.id === track.id);
  if (queueIndex >= 0) currentQueueIndex = queueIndex;
  setCurrentPlaybackTrack(track);
  currentTrackIndex = filteredTracks.findIndex(item => item.id === track.id);
  applyPersistedProgressUI(track, targetTime, session?.duration || track.duration_seconds || 0);
  pendingResumeSeek = targetTime > 1 ? targetTime : null;
  await playTrack(track);
  if (!shouldResume && els.audioPlayer) {
    try { els.audioPlayer.currentTime = 0; } catch (error) {}
    saveResume(track, 0);
    savePlayerState(track, 0);
  }
}

async function hydrateSavedAudioElement(track, timeSeconds = 0, durationSeconds = 0) {
  if (!track || !els.audioPlayer) return;
  const token = `${track.id}:${Date.now()}`;
  pendingSavedAudioHydration = token;
  const targetTime = Math.max(0, Number(timeSeconds) || 0);
  const fallbackDuration = getTrackDurationSeconds(track, durationSeconds);
  applyPersistedProgressUI(track, targetTime, fallbackDuration);

  try {
    await setAudioSourceWithFallback(track, els.audioPlayer);
    if (pendingSavedAudioHydration !== token) return;
    els.audioPlayer.pause();
    const applyTime = () => {
      try {
        const duration = Number.isFinite(els.audioPlayer.duration) ? els.audioPlayer.duration : fallbackDuration;
        if (targetTime > 0 && duration > 0) {
          els.audioPlayer.currentTime = Math.min(targetTime, Math.max(0, duration - 0.25));
        }
        applyPersistedProgressUI(track, targetTime, duration);
        updatePlayButton();
        syncCurrentPlaybackHighlights();
        syncQueuePlaybackUI();
      } catch (error) {
        applyPersistedProgressUI(track, targetTime, fallbackDuration);
      }
    };
    if (els.audioPlayer.readyState >= 1) applyTime();
    else els.audioPlayer.addEventListener('loadedmetadata', applyTime, { once: true });
  } catch (error) {
    console.warn('Could not hydrate saved audio state:', error);
    applyPersistedProgressUI(track, targetTime, fallbackDuration);
  }
}

function savePlayerState(track = getCurrentTrack(), timeOverride) {
  const player = els.audioPlayer;
  const resumeTime = Math.max(0, Number(timeOverride ?? player?.currentTime ?? 0) || 0);
  const queueTrackIds = Array.isArray(currentQueue) ? currentQueue.map(item => item.id).filter(Boolean) : [];
  const state = {
    trackId: track?.id || "",
    trackSrc: track?.src || "",
    time: resumeTime,
    duration: Number.isFinite(player?.duration) ? player.duration : Math.max(0, Number(track?.duration_seconds) || 0),
    paused: Boolean(player?.paused ?? true),
    ended: Boolean(player?.ended ?? false),
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
  setCurrentPlaybackTrack(stateTrack);
  resumeTrackSrc = stateTrack.src;
  resumeTrackTime = Math.max(0, Number(state.time) || 0);
  resumeTrackTitle = stateTrack.title || "";

  const restoredTime = Math.max(0, Number(state.time) || 0);
  const restoredDuration = getTrackDurationSeconds(stateTrack, state.duration);

  updateNowPlaying(stateTrack);
  updateMediaSessionMetadata(stateTrack);
  updateLyricsPanel(stateTrack);
  updateScripturePanel(stateTrack);
  applyPersistedProgressUI(stateTrack, restoredTime, restoredDuration);
  hydrateSavedAudioElement(stateTrack, restoredTime, restoredDuration);
  if (state.paused !== false && restoredTime > 2 && !state.ended) {
    showResumeChoicePrompt(stateTrack, restoredTime);
  }
  updatePlayButton();
  syncCurrentPlaybackHighlights();
  syncQueuePlaybackUI();
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
      time: resumeTime,
      duration: Number.isFinite(els.audioPlayer?.duration) ? els.audioPlayer.duration : Math.max(0, Number(track.duration_seconds) || 0),
      paused: Boolean(els.audioPlayer?.paused ?? true),
      updatedAt: Date.now()
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

function setPendingPlaybackTrack(trackId = "") {
  pendingPlaybackTrackId = trackId || "";
  pendingPlaybackLockUntil = pendingPlaybackTrackId ? Date.now() + PENDING_PLAYBACK_LOCK_MS : 0;
  window.__AINEO_PENDING_PLAYBACK_TRACK_ID__ = pendingPlaybackTrackId;
  window.__AINEO_PENDING_PLAYBACK_LOCK_UNTIL__ = pendingPlaybackLockUntil;
}

function isPendingPlaybackTrack(trackId = "") {
  if (!trackId || pendingPlaybackTrackId !== trackId) return false;
  if (pendingPlaybackLockUntil && Date.now() > pendingPlaybackLockUntil) {
    clearPendingPlaybackTrack(trackId);
    return false;
  }
  return true;
}

function clearPendingPlaybackTrack(trackId = "") {
  if (!trackId || pendingPlaybackTrackId === trackId) {
    pendingPlaybackTrackId = "";
    pendingPlaybackLockUntil = 0;
    window.__AINEO_PENDING_PLAYBACK_TRACK_ID__ = "";
    window.__AINEO_PENDING_PLAYBACK_LOCK_UNTIL__ = 0;
  }
}
function savePlaybackModes() {
  localStorage.setItem(
    STORAGE_KEYS.playbackModes,
    JSON.stringify({ shuffle: shuffleModeEnabled, repeat: repeatMode })
  );
}


const AINEO_PLAYER_ICONS = {
  play: '<span class="control-icon control-icon--play"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8.25 6.5v11L17 12 8.25 6.5Z" fill="currentColor"/></svg></span>',
  pause: '<span class="control-icon control-icon--play"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 6h3v12H8V6Zm5 0h3v12h-3V6Z" fill="currentColor"/></svg></span>',
  previous: '<span class="control-icon concept-skip-icon"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 6h2v12H7V6Zm11 1.5V16.5L10.25 12 18 7.5Z" fill="currentColor"/></svg></span>',
  next: '<span class="control-icon concept-skip-icon"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 6h2v12h-2V6ZM6 7.5 13.75 12 6 16.5v-9Z" fill="currentColor"/></svg></span>',
  shuffle: '<span class="control-icon concept-mode-icon"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h2.6c2.1 0 3.3.8 4.7 2.75l1.4 1.95c1.35 1.9 2.55 2.75 4.7 2.75H20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17 11.5 20 14.5 17 17.5M4 17h2.6c1.9 0 3.05-.65 4.25-2.15M17 4.5 20 7.5 17 10.5M14.1 8.15c.95-.85 1.98-1.15 3.3-1.15H20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>',
  repeat: '<span class="control-icon concept-mode-icon"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17 4 20 7 17 10M20 7H9.5A4.5 4.5 0 0 0 5 11.5V12M7 20 4 17 7 14M4 17h10.5A4.5 4.5 0 0 0 19 12.5V12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>',
  heart: '<span class="player-icon-glyph"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg></span>',
  heartFilled: '<span class="player-icon-glyph"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" fill="currentColor"/></svg></span>'
};

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
    btn.innerHTML = AINEO_PLAYER_ICONS.shuffle;
  });
  [els.repeatModeBtn, els.playerSheetRepeatBtn].forEach(btn => {
    if (!btn) return;
    btn.classList.toggle("is-active", repeatMode !== "off");
    btn.dataset.repeatMode = repeatMode;
    btn.dataset.modeState = repeatMode;
    btn.setAttribute("aria-pressed", repeatMode !== "off" ? "true" : "false");
    btn.setAttribute("aria-label", repeatLabelMap[repeatMode]);
    btn.title = repeatLabelMap[repeatMode];
    btn.innerHTML = AINEO_PLAYER_ICONS.repeat;
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
  markUserPlaybackIntent(false);
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
  // v43.2.26 quick action safe floating layer focus: keep trigger path unchanged, only improve sheet behavior.
  window.requestAnimationFrame(() => els.trackActionCloseXBtn?.focus?.({ preventScroll: true }));
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
  if (!currentQueue.length) {
    const fallbackQueue = getCurrentCollectionTracks().length ? getCurrentCollectionTracks() : tracks;
    if (!fallbackQueue.length) return;
    currentQueue = [...fallbackQueue];
    currentQueueIndex = Math.max(0, currentQueue.findIndex(track => track.id === getCurrentTrack()?.id));
  }
  if (repeatMode === "one") {
    markUserPlaybackIntent(true);
    els.audioPlayer.currentTime = 0;
    els.audioPlayer.play().then(() => primeNextAudioForContinuousPlayback()).catch(() => handlePlaybackErrorRecovery());
    return;
  }
  const atEnd = currentQueueIndex >= currentQueue.length - 1;
  if (atEnd && repeatMode === "off") {
    continuousPlaybackWanted = false;
    updatePlayButton();
    syncCurrentPlaybackHighlights();
    syncQueuePlaybackUI();
    return;
  }
  advanceContinuousPlayback();
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
  bindLibraryPanelLaunchers();
  bindHomeListTabs();

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
      const now = Date.now();
      if (now - lastProgressUiUpdateAt >= (lowPowerModeEnabled ? 500 : 250)) {
        updateProgressUI();
        lastProgressUiUpdateAt = now;
      }
      const current = getCurrentTrack();
      if (current && now - lastResumePersistAt > 4000) {
        saveResume(current);
        savePlayerState(current);
        lastResumePersistAt = now;
      }
      if (continuousPlaybackWanted && els.audioPlayer?.duration && Number.isFinite(els.audioPlayer.duration)) {
        const remaining = els.audioPlayer.duration - (els.audioPlayer.currentTime || 0);
        if (remaining > 0 && remaining < 12) primeNextAudioForContinuousPlayback();
      }
    });
    els.audioPlayer.addEventListener("loadedmetadata", () => {
      updateProgressUI();
      updateSyncedLyricsProgress();
      window.requestAnimationFrame(() => updateSyncedLyricsProgress());
      updateMediaSessionPositionState(true);
      updatePlayButton();
      syncCurrentPlaybackHighlights();
      syncQueuePlaybackUI();
    });
    els.audioPlayer.addEventListener("canplay", () => {
      window.clearTimeout(playbackContinuityTimer);
      if (continuousPlaybackWanted) primeNextAudioForContinuousPlayback();
    });
    els.audioPlayer.addEventListener("waiting", () => schedulePlaybackContinuityCheck("waiting", 7000));
    els.audioPlayer.addEventListener("stalled", () => schedulePlaybackContinuityCheck("stalled", 7000));
    els.audioPlayer.addEventListener("suspend", () => {
      if (continuousPlaybackWanted && !userPausedPlayback) persistPlaybackStateSoon("suspend");
    });
    els.audioPlayer.addEventListener("play", () => {
      markUserPlaybackIntent(true);
      requestMiniPlayerSyncAfterSheetClose();
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
      requestMiniPlayerSyncAfterSheetClose();
      playbackErrorRecoveryCount = 0;
      playbackErrorRecoveryAt = 0;
      clearPendingPlaybackTrack(getCurrentTrack()?.id || "");
      updatePlayButton();
      updateSyncedLyricsProgress();
      startLyricsSyncLoop();
      syncCurrentPlaybackHighlights();
      syncQueuePlaybackUI();
    });
    els.audioPlayer.addEventListener("pause", () => {
      const current = getCurrentTrack();
      const pendingCurrent = Boolean(current && isPendingPlaybackTrack(current.id));
      const naturalTransition = Boolean(els.audioPlayer?.ended || pendingCurrent || backgroundAdvanceInFlight);
      const backgroundSuspension = Boolean(document.hidden && continuousPlaybackWanted && !userPausedPlayback);
      if (!naturalTransition && !backgroundSuspension) markUserPlaybackIntent(false);
      if (backgroundSuspension) persistPlaybackStateSoon("background-pause-suppressed");
      // iOS/Safari can emit pause while a new source is still loading. Keep the
      // UI locked on the selected track during that pending transition.
      if (!pendingCurrent && !backgroundAdvanceInFlight) {
        clearPendingPlaybackTrack();
        setMiniVisualizerActive(false);
        stopLyricsSyncLoop();
      }
      updatePlayButton();
      updateProgressUI();
      requestMiniPlayerSyncAfterSheetClose();
      updateMediaSessionPlaybackState();
      if (current) saveResume(current);
      savePlayerState();
      syncCurrentPlaybackHighlights();
      syncQueuePlaybackUI();
    });
    els.audioPlayer.addEventListener("seeking", updateSyncedLyricsProgress);
    els.audioPlayer.addEventListener("seeked", () => {
      updateProgressUI();
      requestMiniPlayerSyncAfterSheetClose();
      updateSyncedLyricsProgress();
      const current = getCurrentTrack();
      if (current) {
        saveResume(current);
        savePlayerState(current);
        restoredPausedSession = els.audioPlayer?.paused ? { trackId: current.id, time: els.audioPlayer.currentTime || 0, duration: Number.isFinite(els.audioPlayer.duration) ? els.audioPlayer.duration : current.duration_seconds || 0 } : null;
      }
      startLyricsSyncLoop();
    });
    els.audioPlayer.addEventListener("ended", () => {
      stopLyricsSyncLoop();
      persistPlaybackStateSoon("ended");
      handleTrackEnded();
      syncCurrentPlaybackHighlights();
    });
    els.audioPlayer.addEventListener("error", () => {
      const current = getCurrentTrack();
      const pendingCurrent = Boolean(current && isPendingPlaybackTrack(current.id));

      // During source fallback probing, Safari/Chrome may fire a temporary media
      // error for one candidate before the next candidate is tested. Do not let
      // that transient error clear the visible selected/playing intent. That was
      // causing the track card to flash purple, reset, and leave the play button
      // stuck on Play even though the user tapped the correct track.
      if (suppressAudioErrorRecovery > 0 && pendingCurrent) {
        updatePlayButton();
        syncCurrentPlaybackHighlights();
        syncQueuePlaybackUI();
        return;
      }

      clearPendingPlaybackTrack();
      if (suppressAudioErrorRecovery > 0) return;
      if (navigator.onLine === false) {
        renderOfflineStatus({ forceVisible: true });
        return;
      }
      handlePlaybackErrorRecovery();
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
  on(els.restartSongBtn, "click", startSavedTrackOver);

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
  on(els.playerSheetShareBtn, "click", sharePlayerSheetAction);
  on(els.playerSheetMoreBtn, "click", event => { event?.preventDefault?.(); event?.stopPropagation?.(); togglePlayerSheetMoreMenu(); });
  on(els.playerSheetMorePlaylistBtn, "click", openPlayerSheetPlaylistAction);
  on(els.playerSheetMoreDownloadBtn, "click", togglePlayerSheetOfflineAction);
  on(els.playerSheetMoreLyricsBtn, "click", openPlayerSheetLyricsAction);
  on(els.playerSheetMoreShareBtn, "click", sharePlayerSheetAction);
  on(els.playerSheetLyricsBtn, "click", openPlayerSheetLyricsAction);
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
  document.addEventListener("click", event => {
    if (!els.playerSheetMoreMenu || els.playerSheetMoreMenu.classList.contains("hidden")) return;
    if (els.playerSheetMoreMenu.contains(event.target) || els.playerSheetMoreBtn?.contains(event.target)) return;
    hidePlayerSheetMoreMenu();
  });
  document.addEventListener("contextmenu", event => {
    if (event.target?.closest?.("#playerSheetMoreBtn, #mobileNavToggle, .mobile-nav-toggle")) event.preventDefault();
  });
  on(els.trackActionSheetBackdrop, "click", closeTrackActionSheet);
  on(els.trackActionCloseBtn, "click", closeTrackActionSheet);
  on(els.trackActionCloseXBtn, "click", closeTrackActionSheet);
  on(els.socialShareBackdrop, "click", closeSocialShareSheet);
  on(els.socialShareCloseBtn, "click", closeSocialShareSheet);
  on(els.socialShareNativeBtn, "click", () => shareActiveSocialItemWithDevice());
  on(els.socialShareFacebookBtn, "click", () => openPlatformShare('facebook'));
  on(els.socialShareXBtn, "click", () => openPlatformShare('x'));
  on(els.socialShareCopyBtn, "click", () => copyActiveSocialShareLink());
  on(els.socialShareDownloadBtn, "click", () => downloadActiveSocialShareCard(false));
  on(els.socialShareStoryBtn, "click", () => downloadActiveSocialShareCard(true));
  on(els.socialShareAppBtn, "click", () => openSocialShareSheetForApp(els.socialShareAppBtn || document.activeElement));
  on(els.shareAppHomeBtn, "click", () => openSocialShareSheetForApp(els.shareAppHomeBtn));
  on(els.shareAppLibraryBtn, "click", () => openSocialShareSheetForApp(els.shareAppLibraryBtn));

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
  on(els.trackActionShareBtn, "click", () => {
    const track = tracks.find(item => item.id === actionSheetTrackId);
    if (!track) return;
    const trigger = actionSheetTriggerEl || els.trackActionShareBtn;
    closeTrackActionSheet();
    window.requestAnimationFrame(() => openSocialShareSheetForTrack(track, trigger));
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

      target.scrollIntoView({ behavior: "auto", block: "start" });
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

  const canvas = document.createElement('canvas');
  canvas.className = 'player-cover-visualizer-canvas';
  visualizerCanvas = canvas;
  visualizerCtx = canvas.getContext('2d', { alpha: true });

  const bars = document.createElement('div');
  bars.className = 'player-cover-visualizer-bars';
  bars.style.gridTemplateColumns = `repeat(${VISUALIZER_BAR_COUNT}, minmax(0, 1fr))`;
  for (let i = 0; i < VISUALIZER_BAR_COUNT; i += 1) {
    const bar = document.createElement('span');
    bar.className = 'player-cover-visualizer-bar';
    bar.dataset.index = String(i);
    bar.style.height = '8px';
    bars.appendChild(bar);
  }

  visualizer.append(glow, canvas, bars);
  wrap.prepend(visualizer);
  visualizerBars = [...bars.children];
  resizeMiniVisualizerCanvas();
  window.addEventListener('resize', resizeMiniVisualizerCanvas, { passive: true });
}

function resizeMiniVisualizerCanvas() {
  if (!visualizerCanvas || !els.playerSheetCoverWrap) return;
  const rect = els.playerSheetCoverWrap.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(220, Math.round(rect.width));
  const height = Math.max(220, Math.round(rect.height));
  visualizerCanvas.width = Math.round(width * dpr);
  visualizerCanvas.height = Math.round(height * dpr);
  visualizerCanvas.style.width = `${width}px`;
  visualizerCanvas.style.height = `${height}px`;
  if (visualizerCtx) visualizerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
}

function setMiniVisualizerActive(active) {
  if (!els.playerSheetCoverWrap) return;
  const shouldActivate = Boolean(active) && shouldRunVisualizer();
  els.playerSheetCoverWrap.classList.toggle('is-visualizer-active', shouldActivate);
  if (shouldActivate) startVisualizerAnimation();
  else stopVisualizerAnimation();
}

function getTrackWaveformEnvelope(track) {
  if (!track) return null;
  if (Array.isArray(track.waveform_envelope) && track.waveform_envelope.length) return track.waveform_envelope;
  if (track.analysis_file && !track.analysis_loaded) prefetchTrackAnalysis(track);
  return null;
}

function getTrackSpectrumFrames(track) {
  if (!track) return null;
  if (Array.isArray(track.spectrum_frames) && track.spectrum_frames.length) return track.spectrum_frames;
  if (track.analysis_file && !track.analysis_loaded) prefetchTrackAnalysis(track);
  return null;
}

function sampleTrackWaveformAt(track, normalizedPosition) {
  const envelope = getTrackWaveformEnvelope(track);
  if (!envelope) return null;
  const clamped = Math.max(0, Math.min(1, normalizedPosition || 0));
  if (envelope.length === 1) return (envelope[0] || 0) / 255;
  const pos = clamped * (envelope.length - 1);
  const left = Math.floor(pos);
  const right = Math.min(envelope.length - 1, left + 1);
  const frac = pos - left;
  const leftValue = (envelope[left] || 0) / 255;
  const rightValue = (envelope[right] || 0) / 255;
  return leftValue + (rightValue - leftValue) * frac;
}

function getSpectrumState(track, currentTime, durationSeconds) {
  const envelope = getTrackWaveformEnvelope(track);
  const timelinePosition = durationSeconds
    ? Math.max(0, Math.min(0.999999, (currentTime || 0) / Math.max(0.001, durationSeconds)))
    : 0;
  const localEnergy = envelope ? (sampleTrackWaveformAt(track, timelinePosition) || 0) : 0;
  const previousEnergy = envelope ? (sampleTrackWaveformAt(track, Math.max(0, timelinePosition - 0.012)) || localEnergy) : localEnergy;
  const nextEnergy = envelope ? (sampleTrackWaveformAt(track, Math.min(0.999999, timelinePosition + 0.018)) || localEnergy) : localEnergy;
  const transient = Math.max(0, nextEnergy - previousEnergy);
  const beatPulse = Math.max(0, (localEnergy - previousEnergy) * 1.45 + transient * 1.9);
  const phraseLift = envelope ? (sampleTrackWaveformAt(track, Math.min(0.999999, timelinePosition + 0.08)) || localEnergy) : localEnergy;

  const frames = getTrackSpectrumFrames(track);
  if (frames && frames.length && durationSeconds) {
    const frameDensity = frames.length / Math.max(1, durationSeconds);
    const clamped = timelinePosition;
    const framePos = clamped * (frames.length - 1);
    const left = Math.floor(framePos);
    const right = Math.min(frames.length - 1, left + 1);
    const mix = framePos - left;
    const bandCount = Math.min(VISUALIZER_BAR_COUNT, frames[left]?.length || 0, frames[right]?.length || 0);
    if (bandCount > 0) {
      const bands = new Array(bandCount).fill(0).map((_, index) => {
        const a = ((frames[left][index] || 0) / 255);
        const b = ((frames[right][index] || 0) / 255);
        let value = a + (b - a) * mix;
        if (envelope) {
          const bandT = index / Math.max(1, bandCount - 1);
          const centerWeight = 1 - Math.min(1, Math.abs(bandT - 0.5) / 0.5);
          const edgeWeight = 1 - centerWeight;
          const energyBoost = 0.88 + localEnergy * 0.50;
          const transientBoost = transient * (0.12 + edgeWeight * 0.14);
          const beatBoost = beatPulse * (0.10 + centerWeight * 0.22);
          const phraseBoost = phraseLift * (0.05 + (1 - Math.abs(bandT - 0.42) / 0.42) * 0.10);
          value = Math.min(1, value * energyBoost + transientBoost + beatBoost + Math.max(0, phraseBoost || 0));
        }
        return Math.max(0.02, Math.min(1, value));
      });
      const bassSlice = bands.slice(0, Math.max(1, Math.floor(bands.length * 0.18)));
      const midSlice = bands.slice(Math.max(1, Math.floor(bands.length * 0.18)), Math.max(2, Math.floor(bands.length * 0.62)));
      const highSlice = bands.slice(Math.max(2, Math.floor(bands.length * 0.62)));
      const avg = (arr) => arr.length ? arr.reduce((sum, value) => sum + value, 0) / arr.length : 0;
      return {
        bands,
        bass: avg(bassSlice),
        mids: avg(midSlice),
        treble: avg(highSlice),
        localEnergy,
        transient,
        beatPulse,
        phraseLift,
        fromSpectrumFrames: true,
        frameDensity,
      };
    }
  }

  if (!envelope || !durationSeconds) return null;
  const bass = Math.min(1, 0.05 + localEnergy * 0.92 + transient * 0.42 + beatPulse * 0.12);
  const mids = Math.min(1, 0.05 + localEnergy * 0.70 + phraseLift * 0.16 + transient * 0.16 + beatPulse * 0.10);
  const treble = Math.min(1, 0.03 + localEnergy * 0.28 + transient * 0.46 + beatPulse * 0.06);
  const bands = new Array(VISUALIZER_BAR_COUNT).fill(0).map((_, index) => {
    const progress = index / Math.max(1, VISUALIZER_BAR_COUNT - 1);
    const offset = (progress - 0.5) * 0.10;
    const scan = Math.max(0, Math.min(0.999999, timelinePosition + offset));
    const value = sampleTrackWaveformAt(track, scan) || 0;
    const contour = 0.90 + Math.sin(progress * Math.PI) * 0.10;
    return Math.max(0.02, Math.min(1, value * contour + transient * 0.12 + beatPulse * 0.10));
  });
  return { bands, bass, mids, treble, localEnergy, transient, beatPulse, phraseLift, fromSpectrumFrames: false, frameDensity: 0 };
}


function mapBandsForVisualizerSide(sideBands, targetCount) {
  if (!Array.isArray(sideBands) || !sideBands.length || targetCount <= 0) return [];
  if (sideBands.length === targetCount) return sideBands.slice();
  if (targetCount === 1) return [sideBands[Math.floor(sideBands.length / 2)] || 0];
  return new Array(targetCount).fill(0).map((_, index) => {
    const position = (index / Math.max(1, targetCount - 1)) * Math.max(0, sideBands.length - 1);
    const left = Math.floor(position);
    const right = Math.min(sideBands.length - 1, left + 1);
    const mix = position - left;
    const a = sideBands[left] || 0;
    const b = sideBands[right] || 0;
    return a + (b - a) * mix;
  });
}

function drawVisualizerFrame() {
  if (!visualizerCtx || !visualizerCanvas) return;
  resizeMiniVisualizerCanvas();

  const width = parseFloat(visualizerCanvas.style.width) || visualizerCanvas.width;
  const height = parseFloat(visualizerCanvas.style.height) || visualizerCanvas.height;
  const ctx = visualizerCtx;
  ctx.clearRect(0, 0, width, height);

  const currentTrack = getCurrentTrack();
  const currentTime = els.audioPlayer?.currentTime || 0;
  const durationSeconds = currentTrack?.duration_seconds || els.audioPlayer?.duration || 0;
  const spectrumState = getSpectrumState(currentTrack, currentTime, durationSeconds);
  if (!spectrumState || !Array.isArray(spectrumState.bands) || !spectrumState.bands.length) return;

  const centerX = width / 2;
  const activeCenterY = (height / 2) - Math.max(17, height * 0.068);
  const backgroundCenterY = activeCenterY;
  const bass = spectrumState.bass || 0;
  const mids = spectrumState.mids || 0;
  const treble = spectrumState.treble || 0;
  const localEnergy = spectrumState.localEnergy || 0;
  const transient = spectrumState.transient || 0;
  const beatPulse = spectrumState.beatPulse || 0;
  const sourceSideBandCount = Math.max(1, Math.floor(spectrumState.bands.length / 2));
  const visibleSideBandCount = Math.max(12, Math.min(VISUALIZER_BAR_COUNT / 2, sourceSideBandCount));

  const outerInset = Math.max(30, width * 0.12);
  const coverGap = Math.max(136, Math.min(width * 0.34, height * 0.64));
  const innerSafetyGap = Math.max(16, Math.min(26, width * 0.03));
  const availableWingWidth = Math.max(72, ((width - (outerInset * 2) - coverGap - (innerSafetyGap * 2)) / 2));
  const wingWidth = Math.min(availableWingWidth, Math.max(96, width * 0.24));
  const leftWingShift = Math.max(6, Math.min(11, width * 0.018));
  const leftEnd = centerX - (coverGap / 2) - innerSafetyGap + leftWingShift;
  const leftStart = leftEnd - wingWidth;
  const rightStart = centerX + (coverGap / 2) + innerSafetyGap;
  const rightEnd = rightStart + wingWidth;
  const maxHalfHeight = Math.max(20, Math.min(height * 0.128, 34 + bass * 14 + mids * 8 + beatPulse * 11 + transient * 8));

  const outerGlow = ctx.createLinearGradient(leftStart, backgroundCenterY, rightEnd, backgroundCenterY);
  outerGlow.addColorStop(0, `rgba(44, 86, 255, ${0.08 + bass * 0.08})`);
  outerGlow.addColorStop(0.35, `rgba(72, 108, 255, ${0.10 + mids * 0.08})`);
  outerGlow.addColorStop(0.7, `rgba(106, 72, 255, ${0.11 + treble * 0.08})`);
  outerGlow.addColorStop(1, `rgba(140, 58, 255, ${0.09 + treble * 0.08})`);
  ctx.save();
  ctx.strokeStyle = outerGlow;
  ctx.lineWidth = maxHalfHeight * 1.12;
  ctx.globalAlpha = 0.10;
  ctx.lineCap = 'round';
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'rgba(122, 154, 255, 0.45)';
  ctx.beginPath();
  ctx.moveTo(leftStart, backgroundCenterY);
  ctx.lineTo(leftEnd, backgroundCenterY);
  ctx.moveTo(rightStart, backgroundCenterY);
  ctx.lineTo(rightEnd, backgroundCenterY);
  ctx.stroke();
  ctx.restore();

  const lineGradientLeft = ctx.createLinearGradient(leftStart, backgroundCenterY, leftEnd, backgroundCenterY);
  lineGradientLeft.addColorStop(0, 'rgba(82, 132, 255, 0.70)');
  lineGradientLeft.addColorStop(1, 'rgba(112, 72, 255, 0.90)');
  ctx.save();
  ctx.strokeStyle = lineGradientLeft;
  ctx.lineWidth = 1.1;
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.moveTo(leftStart, backgroundCenterY);
  ctx.lineTo(leftEnd, backgroundCenterY);
  ctx.stroke();
  ctx.restore();

  const lineGradientRight = ctx.createLinearGradient(rightStart, backgroundCenterY, rightEnd, backgroundCenterY);
  lineGradientRight.addColorStop(0, 'rgba(112, 72, 255, 0.90)');
  lineGradientRight.addColorStop(1, 'rgba(156, 82, 255, 0.82)');
  ctx.save();
  ctx.strokeStyle = lineGradientRight;
  ctx.lineWidth = 1.1;
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.moveTo(rightStart, backgroundCenterY);
  ctx.lineTo(rightEnd, backgroundCenterY);
  ctx.stroke();
  ctx.restore();

  const rawLeftBands = spectrumState.bands.slice(0, sourceSideBandCount);
  const rawRightBands = spectrumState.bands.slice(spectrumState.bands.length - sourceSideBandCount);
  const leftBands = mapBandsForVisualizerSide(rawLeftBands, visibleSideBandCount);
  const rightBands = mapBandsForVisualizerSide(rawRightBands, visibleSideBandCount);
  const leftStep = wingWidth / Math.max(1, visibleSideBandCount - 1);
  const rightStep = wingWidth / Math.max(1, visibleSideBandCount - 1);
  const totalBarCount = visibleSideBandCount * 2;
  if (!visualizerRenderedBands.length || visualizerRenderedBands.length !== totalBarCount) {
    visualizerRenderedBands = new Array(totalBarCount).fill(0);
  }

  const drawSideBand = (band, sideIndex, side, x, totalIndex) => {
    const normalizedSide = visibleSideBandCount <= 1 ? 0 : sideIndex / (visibleSideBandCount - 1);
    const inwardBias = side === 'left' ? normalizedSide : (1 - normalizedSide);
    const outwardBias = 1 - inwardBias;
    const horizontalRatio = totalBarCount <= 1 ? 0 : totalIndex / (totalBarCount - 1);
    const nearArtwork = inwardBias;
    const outerArc = 1 - nearArtwork;
    const curveShape = 0.72 + (outerArc * 0.32);
    const shoulderLift = 0.94 + (outerArc * 0.18) + (Math.sin(outerArc * Math.PI * 0.92) * 0.06);
    const widthBias = 0.92 + (Math.sin(outerArc * Math.PI) * 0.10) + (outerArc * 0.04);
    const beatAccent = beatPulse * (0.62 + nearArtwork * 0.40) + transient * (0.56 + outerArc * 0.32) + localEnergy * 0.13;
    const snapBoost = beatPulse * 0.74 + transient * 0.88;
    const bounceBoost = beatPulse * (0.24 + nearArtwork * 0.14) + transient * 0.28;
    const liveValue = Math.max(0.03, Math.min(1, band * (1.06 + beatAccent * 0.40) + beatAccent + snapBoost + bounceBoost));
    const previousValue = visualizerRenderedBands[totalIndex] || 0;
    const smoothedValue = liveValue >= previousValue
      ? (previousValue * 0.0015) + (liveValue * 0.9985)
      : (previousValue * 0.18) + (liveValue * 0.82);
    visualizerRenderedBands[totalIndex] = smoothedValue;

    const t = performance.now() * 0.0024;
    const microMotion = (Math.sin(t + (totalIndex * 0.6)) * 0.018) + (Math.sin(t * 1.85 + totalIndex) * 0.011);
    const spreadGain = 0.80 + nearArtwork * 0.09 + beatPulse * 0.20 + transient * 0.18;
    const bounceLift = 1 + beatPulse * (0.36 + nearArtwork * 0.10) + transient * 0.26;
    const heightValue = Math.max(0.02, Math.min(1, smoothedValue + microMotion));
    const halfHeight = Math.max(4, heightValue * maxHalfHeight * spreadGain * bounceLift * shoulderLift * curveShape);
    const step = side === 'left' ? leftStep : rightStep;
    const barWidth = Math.max(1.45, Math.min(2.8, step * 0.19 * widthBias));
    const barGradient = ctx.createLinearGradient(x, activeCenterY + halfHeight, x, activeCenterY - halfHeight);
    const topHue = 220 + (60 * horizontalRatio);
    const midHue = 232 + (46 * horizontalRatio);
    const bottomHue = 242 + (32 * horizontalRatio);
    const topLight = 63 + heightValue * 11;
    const midLight = 44 + heightValue * 8;
    const bottomLight = 24 + heightValue * 4;
    const isPeak = heightValue > 0.76;
    barGradient.addColorStop(0, `hsla(${bottomHue}, 88%, ${bottomLight}%, 0.94)`);
    barGradient.addColorStop(0.46, `hsla(${midHue}, 93%, ${midLight}%, 0.97)`);
    barGradient.addColorStop(1, `hsla(${topHue}, 98%, ${topLight}%, 0.99)`);

    ctx.save();
    ctx.strokeStyle = barGradient;
    ctx.lineWidth = barWidth;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.98;
    ctx.shadowBlur = isPeak ? (24 + heightValue * 14) : (13 + heightValue * 7);
    ctx.shadowColor = `hsla(${224 + (52 * horizontalRatio)}, 98%, ${isPeak ? 66 : 56}%, ${isPeak ? 0.78 : 0.56})`;
    ctx.beginPath();
    ctx.moveTo(x, activeCenterY - halfHeight);
    ctx.lineTo(x, activeCenterY + halfHeight);
    ctx.stroke();
    ctx.restore();

    const barEl = visualizerBars[totalIndex];
    if (barEl) {
      const bounceY = Math.round((beatPulse * -8) + (transient * -6));
      barEl.style.height = `${Math.round(halfHeight * 2)}px`;
      barEl.style.opacity = `${0.28 + heightValue * 0.34}`;
      barEl.style.transform = `translateY(${bounceY}px) scaleY(${(1 + beatPulse * 0.14 + transient * 0.08).toFixed(3)})`;
      barEl.style.filter = isPeak ? 'saturate(1.38) brightness(1.16)' : 'saturate(1.2)';
      barEl.style.background = `linear-gradient(180deg, hsla(${220 + (60 * horizontalRatio)}, 98%, ${63 + heightValue * 11}%, 0.99) 0%, hsla(${232 + (46 * horizontalRatio)}, 93%, ${44 + heightValue * 8}%, 0.97) 52%, hsla(${242 + (32 * horizontalRatio)}, 88%, ${24 + heightValue * 4}%, 0.94) 100%)`;
      barEl.style.boxShadow = isPeak
        ? `0 0 16px hsla(${224 + (52 * horizontalRatio)}, 98%, 66%, 0.52), 0 0 28px hsla(${248 + (28 * horizontalRatio)}, 96%, 56%, 0.34)`
        : `0 0 10px hsla(${224 + (52 * horizontalRatio)}, 96%, 58%, 0.22)`;
    }
  };

  leftBands.forEach((band, sideIndex) => {
    const x = leftStart + (leftStep * sideIndex);
    drawSideBand(band, sideIndex, 'left', x, sideIndex);
  });
  rightBands.forEach((band, sideIndex) => {
    const x = rightStart + (rightStep * sideIndex);
    drawSideBand(band, sideIndex, 'right', x, visibleSideBandCount + sideIndex);
  });

  for (let index = totalBarCount; index < visualizerBars.length; index += 1) {
    const barEl = visualizerBars[index];
    if (barEl) {
      barEl.style.height = '0px';
      barEl.style.opacity = '0';
    }
  }
}

function startVisualizerAnimation() {

  if (visualizerFrame || !visualizerBars.length) return;
  ensureVisualizerAudioSetup();
  if (visualizerAudioContext && visualizerAudioContext.state === 'suspended') {
    visualizerAudioContext.resume().catch(() => {});
  }

  let lastFrameAt = 0;
  const minFrameGap = lowPowerModeEnabled ? 140 : 70;

  const animate = (now = 0) => {
    if (!shouldRunVisualizer()) {
      visualizerFrame = 0;
      return;
    }
    if (!lastFrameAt || (now - lastFrameAt) >= minFrameGap) {
      lastFrameAt = now;
      visualizerTick += 1;
      drawVisualizerFrame();
    }
    visualizerFrame = window.requestAnimationFrame(animate);
  };
  visualizerFrame = window.requestAnimationFrame(animate);
}

function stopVisualizerAnimation() {
  if (visualizerFrame) {
    window.cancelAnimationFrame(visualizerFrame);
    visualizerFrame = 0;
  }

  if (visualizerCtx && visualizerCanvas) {
    const width = parseFloat(visualizerCanvas.style.width) || visualizerCanvas.width;
    const height = parseFloat(visualizerCanvas.style.height) || visualizerCanvas.height;
    visualizerCtx.clearRect(0, 0, width, height);
  }

  visualizerBars.forEach((bar) => {
    bar.style.height = '8px';
    bar.style.opacity = '';
    bar.style.transform = '';
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
      saveLastHomePlaylistSelection({ type: "album", name: albumName });
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
      saveLastHomePlaylistSelection({ type: "playlist", name: playlistName });
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

function isLandingHomePage() {
  return document.body.classList.contains("landing-page-layout");
}

function getCustomPlaylistEntryByName(targetName) {
  const target = String(targetName || "").trim().toLowerCase();
  if (!target) return null;
  const names = Object.keys(customPlaylists || {});
  const match = names.find(name => String(name || "").trim().toLowerCase() === target);
  return match ? customPlaylists[match] : null;
}

function normalizePlaylistTrackIds(entry) {
  if (!entry) return [];
  if (Array.isArray(entry)) return entry;
  if (Array.isArray(entry.trackIds)) return entry.trackIds;
  if (Array.isArray(entry.tracks)) return entry.tracks.map(item => typeof item === "string" ? item : item?.id).filter(Boolean);
  return [];
}

function resolveTrackIdsToTracks(ids) {
  const seen = new Set();
  return (ids || [])
    .map(id => tracks.find(track => track.id === id))
    .filter(track => {
      if (!track?.id || seen.has(track.id)) return false;
      seen.add(track.id);
      return true;
    });
}

function normalizeHomeListChoice(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return HOME_LIST_CHOICES.has(normalized) ? normalized : "suggested";
}

function normalizeLastHomePlaylistSelection(selection) {
  if (!selection) return null;
  const type = String(selection.type || "").trim().toLowerCase();
  const name = String(selection.name || "").trim();
  if (!name || !["album", "playlist", "custom-playlist"].includes(type)) return null;
  return {
    type,
    name,
    updatedAt: Number(selection.updatedAt || Date.now()) || Date.now()
  };
}

function loadLastHomePlaylistSelection() {
  try {
    lastHomePlaylistSelection = normalizeLastHomePlaylistSelection(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.lastHomePlaylistSelection || "aineo_last_home_playlist_selection") || "null")
    );
  } catch (error) {
    lastHomePlaylistSelection = null;
  }
  syncHomeListTabs();
}

function saveLastHomePlaylistSelection(selection) {
  const normalized = normalizeLastHomePlaylistSelection({ ...selection, updatedAt: Date.now() });
  if (!normalized) return;
  lastHomePlaylistSelection = normalized;
  try {
    localStorage.setItem(STORAGE_KEYS.lastHomePlaylistSelection || "aineo_last_home_playlist_selection", JSON.stringify(normalized));
  } catch (error) {}
  syncHomeListTabs();
  if (isLandingHomePage() && normalizeHomeListChoice(homeListChoice) === "my-songs") {
    renderFeaturedAlbum();
    renderFeaturedTrackList();
  }
}

function clearLastHomePlaylistSelectionIfMatches(type, name) {
  const normalizedType = String(type || "").trim().toLowerCase();
  const normalizedName = String(name || "").trim();
  if (!lastHomePlaylistSelection || lastHomePlaylistSelection.type !== normalizedType || lastHomePlaylistSelection.name !== normalizedName) return;
  lastHomePlaylistSelection = null;
  try {
    localStorage.removeItem(STORAGE_KEYS.lastHomePlaylistSelection || "aineo_last_home_playlist_selection");
  } catch (error) {}
  syncHomeListTabs();
}

function getTrackListByAlbumName(name) {
  const albumName = String(name || "").trim();
  if (!albumName) return [];
  return tracks.filter(track => track.album === albumName);
}

function getTrackListByPlaylistName(name) {
  const playlistName = String(name || "").trim();
  if (!playlistName) return [];
  return tracks.filter(track => {
    const values = normalizeStringArray(track.playlists || track.playlist);
    return values.includes(playlistName) || track.album === playlistName;
  });
}

function resolveLastHomePlaylistSelection() {
  const selection = normalizeLastHomePlaylistSelection(lastHomePlaylistSelection);
  if (!selection) return null;

  let playlistTracks = [];
  if (selection.type === "custom-playlist") {
    playlistTracks = getCustomPlaylistTracks(selection.name);
  } else if (selection.type === "album") {
    playlistTracks = getTrackListByAlbumName(selection.name);
    if (!playlistTracks.length) playlistTracks = getTrackListByPlaylistName(selection.name);
  } else if (selection.type === "playlist") {
    playlistTracks = getTrackListByPlaylistName(selection.name);
    if (!playlistTracks.length) playlistTracks = getTrackListByAlbumName(selection.name);
  }

  if (!playlistTracks.length) return null;
  return {
    ...selection,
    tracks: playlistTracks
  };
}

function getHomePlaylistTabName() {
  const resolved = resolveLastHomePlaylistSelection();
  return resolved?.name || "My Songs";
}

function trimHomeTabLabel(label) {
  const text = String(label || "My Songs").trim() || "My Songs";
  return text.length > 16 ? `${text.slice(0, 15)}…` : text;
}

function loadHomeListChoice() {
  try {
    homeListChoice = normalizeHomeListChoice(localStorage.getItem(STORAGE_KEYS.homeListChoice || "aineo_home_list_choice"));
  } catch (error) {
    homeListChoice = "suggested";
  }
  syncHomeListTabs();
}

function saveHomeListChoice(choice) {
  homeListChoice = normalizeHomeListChoice(choice);
  try {
    localStorage.setItem(STORAGE_KEYS.homeListChoice || "aineo_home_list_choice", homeListChoice);
  } catch (error) {}
  syncHomeListTabs();
}

function syncHomeListTabs() {
  if (!document.body.classList.contains("landing-page-layout")) return;
  const resolvedLastPlaylist = resolveLastHomePlaylistSelection();
  document.querySelectorAll("[data-home-list-choice]").forEach(tab => {
    const choice = normalizeHomeListChoice(tab.dataset.homeListChoice);
    const active = choice === homeListChoice;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
    if (choice === "my-songs") {
      const label = resolvedLastPlaylist?.name || "My Songs";
      tab.textContent = trimHomeTabLabel(label);
      tab.setAttribute("aria-label", resolvedLastPlaylist ? `Last selected playlist: ${label}` : "My Songs playlist tab");
      tab.title = resolvedLastPlaylist ? `Last selected playlist: ${label}` : "My Songs";
    }
  });
  if (els.homeListHelper) {
    const lastPlaylistLabel = resolvedLastPlaylist?.name || "your last selected album or custom playlist";
    const helperText = {
      suggested: "A starting worship list is ready for first-time listeners. Your selected tab is remembered on this device.",
      "my-songs": resolvedLastPlaylist
        ? `Shows ${lastPlaylistLabel}, the last album playlist or custom playlist you selected.`
        : "Select an album playlist or custom playlist to make this tab yours. Until then, Suggested Listening fills this area.",
      favorites: "Shows the songs you have saved as favorites on this device.",
      recent: "Shows the last 15 songs you played on this device."
    };
    els.homeListHelper.textContent = helperText[homeListChoice] || helperText.suggested;
  }
}

function bindHomeListTabs() {
  document.querySelectorAll("[data-home-list-choice]").forEach(tab => {
    tab.addEventListener("click", () => {
      saveHomeListChoice(tab.dataset.homeListChoice);
      renderFeaturedAlbum();
      renderFeaturedTrackList();
    });
  });
  syncHomeListTabs();
}

function getHomeSuggestedTracks() {
  const seen = new Set();
  return HOME_SUGGESTED_TRACK_IDS
    .map(id => tracks.find(track => track.id === id))
    .filter(track => {
      if (!track?.id || seen.has(track.id)) return false;
      seen.add(track.id);
      return true;
    });
}

function getHomeFavoriteTracks() {
  return resolveTrackIdsToTracks(favorites);
}

function getHomeRecentTracks() {
  return resolveTrackIdsToTracks(recentlyPlayed).slice(0, 15);
}

function getHomeMySongsSelection() {
  return resolveLastHomePlaylistSelection();
}

function getHomeMySongsTracks() {
  return getHomeMySongsSelection()?.tracks || [];
}

function getFeaturedCollection() {
  if (isLandingHomePage()) {
    const choice = normalizeHomeListChoice(homeListChoice);
    const suggestedTracks = getHomeSuggestedTracks();
    let name = "Suggested Listening";
    let subtitle = "A starting worship list for new listeners";
    let key = "home:suggested";
    let homeTracks = suggestedTracks;

    if (choice === "my-songs") {
      const lastPlaylist = getHomeMySongsSelection();
      homeTracks = lastPlaylist?.tracks || [];
      name = lastPlaylist?.name || "My Songs";
      subtitle = lastPlaylist ? (lastPlaylist.type === "custom-playlist" ? "Last selected custom playlist" : "Last selected album playlist") : "Select an album playlist or custom playlist to fill this tab";
      key = lastPlaylist ? `home:last-playlist:${lastPlaylist.type}:${lastPlaylist.name}` : "home:my-songs";
    } else if (choice === "favorites") {
      homeTracks = getHomeFavoriteTracks();
      name = "Favorites";
      subtitle = homeTracks.length ? "Songs you saved as favorites" : "Favorite songs to fill this tab";
      key = "home:favorites";
    } else if (choice === "recent") {
      homeTracks = getHomeRecentTracks();
      name = "Recent Listening";
      subtitle = homeTracks.length ? "Your last 15 played songs" : "Play songs to fill this tab";
      key = "home:recent";
    }

    if (!homeTracks.length && choice !== "suggested") {
      homeTracks = suggestedTracks;
      name = "Suggested Listening";
      subtitle = "A starting worship list for new listeners";
      key = `home:${choice}:suggested-fallback`;
    }
    if (!homeTracks.length) return null;
    return {
      type: "home-list",
      key,
      name,
      subtitle,
      cover: homeTracks.find(track => track.cover)?.cover || "",
      tracks: homeTracks,
      album_zip: "",
      openMode: "collection"
    };
  }

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
  window.scrollTo({ top: Math.max(top, 0), behavior: "auto" });
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

function setCurrentPlaybackTrack(track) {
  currentPlaybackTrackId = track?.id || "";
  window.__AINEO_CURRENT_PLAYBACK_TRACK_ID__ = currentPlaybackTrackId;
  if (currentPlaybackTrackId) {
    const queueMatch = currentQueue.findIndex(item => item.id === currentPlaybackTrackId);
    if (queueMatch >= 0) currentQueueIndex = queueMatch;
    const filteredMatch = filteredTracks.findIndex(item => item.id === currentPlaybackTrackId);
    currentTrackIndex = filteredMatch;
  }
}

function findTrackById(trackId = "") {
  if (!trackId) return null;
  return currentQueue.find(track => track.id === trackId)
    || tracks.find(track => track.id === trackId)
    || filteredTracks.find(track => track.id === trackId)
    || null;
}

function getCurrentPlaybackTrackId() {
  if (currentPlaybackTrackId) return currentPlaybackTrackId;
  const indexed = currentQueueIndex >= 0 && currentQueueIndex < currentQueue.length ? currentQueue[currentQueueIndex] : null;
  if (indexed?.id) return indexed.id;
  const filtered = currentTrackIndex >= 0 && currentTrackIndex < filteredTracks.length ? filteredTracks[currentTrackIndex] : null;
  return filtered?.id || "";
}

function getCurrentTrack() {
  const activeId = getCurrentPlaybackTrackId();
  if (activeId) {
    const activeTrack = findTrackById(activeId);
    if (activeTrack) return activeTrack;
  }

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
  requestPlaybackUiSync();
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
    playTrackById,
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
let playbackRequestId = 0;
let pendingPlaybackTrackId = "";
let pendingPlaybackLockUntil = 0;
const PENDING_PLAYBACK_LOCK_MS = 9000;
window.__AINEO_PENDING_PLAYBACK_TRACK_ID__ = "";
window.__AINEO_PENDING_PLAYBACK_LOCK_UNTIL__ = 0;
let playbackErrorRecoveryCount = 0;
let playbackErrorRecoveryAt = 0;
let suppressAudioErrorRecovery = 0;


function prefetchTrackMedia(track, options = {}) {
  if (!track?.src) return;
  const currentTrack = getCurrentTrack();
  const allowAudio = options.audio !== false && !lowPowerModeEnabled;
  const allowCover = options.cover !== false && !lowPowerModeEnabled;

  if (allowAudio && prefetchedTrackSrc !== track.src) {
    prefetchedTrackSrc = track.src;
    try {
      prefetchedAudio = new Audio();
      prefetchedAudio.preload = "auto";
      prefetchedAudio.src = track.src;
      prefetchedAudio.load();
    } catch (error) {
      prefetchedAudio = null;
    }
  }

  if (allowCover && track.cover) {
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = track.cover;
  }

}

function prefetchPlaybackNeighborhood(index = currentQueueIndex, queue = currentQueue) {
  if (!Array.isArray(queue) || !queue.length) return;
  const normalizedIndex = Math.max(0, Math.min(Number(index) || 0, queue.length - 1));
  const current = queue[normalizedIndex];
  const next = queue[normalizedIndex + 1] || queue[0] || null;
  const candidates = [current];

  if (!lowPowerModeEnabled && next) {
    candidates.push(next);
  }

  const seen = new Set();
  candidates.forEach((track) => {
    if (!track?.id || seen.has(track.id)) return;
    seen.add(track.id);
    prefetchTrackMedia(track, { audio: false, cover: false });
  });

  if (!lowPowerModeEnabled) backgroundWarmupQueue(normalizedIndex, queue);
}

function prefetchUpcomingTrack() {
  prefetchPlaybackNeighborhood(currentQueueIndex, currentQueue);
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

async function playTrack(track) {
  if (!track || !track.src || !els.audioPlayer) return;
  const requestId = ++playbackRequestId;
  markUserPlaybackIntent(true);
  stopPreviewAudio();

  if (navigator.onLine === false && !isDownloaded(track)) {
    renderOfflineStatus({ forceVisible: true, emphasizeSaved: true });
    showToast?.('This song was not saved offline yet.');
    return;
  }

  if (!currentQueue.length) {
    const fallbackQueue = getCurrentCollectionTracks().length ? getCurrentCollectionTracks() : tracks;
    currentQueue = [...fallbackQueue];
  }

  let queueIndex = currentQueue.findIndex(t => t.id === track.id);
  if (queueIndex < 0) {
    currentQueue.push(track);
    queueIndex = currentQueue.length - 1;
  }
  currentQueueIndex = queueIndex;
  setCurrentPlaybackTrack(track);

  currentTrackIndex = filteredTracks.findIndex(t => t.id === track.id);
  setPendingPlaybackTrack(track.id);
  if (Number.isFinite(els.audioPlayer.volume) && els.audioPlayer.volume < 0.98) els.audioPlayer.volume = 1;

  stopLyricsSyncLoop();
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
  renderQueue();
  renderFeaturedTrackList();
  syncCurrentPlaybackHighlights();
  syncQueuePlaybackUI();
  updateMediaSessionMetadata(track);
  updateLyricsPanel(track);
  updateSyncedLyricsProgress();
  window.requestAnimationFrame(() => updateSyncedLyricsProgress());
  if (!lowPowerModeEnabled) prefetchTrackLyrics(track).then(() => {
    if (getCurrentTrack()?.id === track.id) {
      updateLyricsPanel(track);
      updateSyncedLyricsProgress();
    }
  });

  try {
    await setAudioSourceWithFallback(track, els.audioPlayer);
    if (requestId !== playbackRequestId) return;
    await els.audioPlayer.play();
    clearPendingPlaybackTrack(track.id);
    updatePlayButton();
    syncCurrentPlaybackHighlights();
    syncQueuePlaybackUI();
    playbackErrorRecoveryCount = 0;
    playbackErrorRecoveryAt = 0;
    primeNextAudioForContinuousPlayback();
  } catch (err) {
    console.error("Playback failed:", err);
    if (requestId === playbackRequestId) {
      clearPendingPlaybackTrack(track.id);
      showToast?.('Playback had trouble loading this song. Trying the next available track.');
      handlePlaybackErrorRecovery();
    }
    return;
  }

  updateScripturePanel(track);
  recordTrackPlay(track);
  addToRecentlyPlayed(track);
  saveResume(track);
  saveQueueState();
  savePlayerState(track, pendingResumeSeek ?? els.audioPlayer.currentTime ?? 0);
  renderQueue();
  renderFavorites();
  renderFeaturedTrackList();
  requestPlaybackUiSync();
  updateUrlForTrack(track);
  ensureSmartQueueSuggestion(track);
  if (!lowPowerModeEnabled) {
    window.requestIdleCallback ? window.requestIdleCallback(() => prefetchPlaybackNeighborhood(currentQueueIndex, currentQueue), { timeout: 1200 }) : window.setTimeout(() => prefetchPlaybackNeighborhood(currentQueueIndex, currentQueue), 600);
  }
}


function playFromQueueIndex(index) {
  if (index < 0 || index >= currentQueue.length) return;
  const track = currentQueue[index];
  playTrackById(track?.id || "", currentQueue);
}

function playTrackById(trackId, preferredQueue = null) {
  if (!trackId) return;

  const queueSource = Array.isArray(preferredQueue) && preferredQueue.length
    ? preferredQueue
    : (getCurrentCollectionTracks().length ? getCurrentCollectionTracks() : currentQueue.length ? currentQueue : tracks);

  const target = queueSource.find(track => track.id === trackId) || tracks.find(track => track.id === trackId);
  if (!target) return;

  currentQueue = [...queueSource];
  let queueIndex = currentQueue.findIndex(track => track.id === target.id);
  if (queueIndex < 0) {
    currentQueue.push(target);
    queueIndex = currentQueue.length - 1;
  }

  currentQueueIndex = queueIndex;
  setCurrentPlaybackTrack(target);
  setPendingPlaybackTrack(target.id);
  currentTrackIndex = filteredTracks.findIndex(track => track.id === target.id);

  updateNowPlaying(target);
  renderQueue();
  renderFeaturedTrackList();
  requestPlaybackUiSync();
  playTrack(target);
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
  smoothPlayTrack(currentQueue[currentQueueIndex], { crossfade: true, reason: "navigation" });
}

function playNextTrack() {
  markUserPlaybackIntent(true);
  if (!currentQueue.length) {
    if (!getCurrentCollectionTracks().length) return;
    setQueue(getCurrentCollectionTracks(), shuffleModeEnabled);
  }

  if (!currentQueue.length) return;

  if (repeatMode === "one") {
    smoothPlayTrack(currentQueue[currentQueueIndex], { crossfade: true, reason: "navigation" });
    return;
  }

  const isAtEnd = currentQueueIndex >= currentQueue.length - 1;
  if (isAtEnd && repeatMode === "off") {
    markUserPlaybackIntent(false);
    els.audioPlayer.pause();
    return;
  }

  currentQueueIndex = isAtEnd ? 0 : currentQueueIndex + 1;
  playTrack(currentQueue[currentQueueIndex]);
}

function getPlayableStartupTrack() {
  const current = getCurrentTrack();
  if (current?.src) return current;

  if (resumeTrackSrc) {
    const resumed = tracks.find(track => track.src === resumeTrackSrc || track.audio === resumeTrackSrc || track.title === resumeTrackTitle);
    if (resumed?.src) return resumed;
  }

  const savedState = loadJsonFromStorage(STORAGE_KEYS.playerState, null);
  if (savedState?.trackId) {
    const savedTrack = tracks.find(track => track.id === savedState.trackId);
    if (savedTrack?.src) return savedTrack;
  }

  return currentQueue[currentQueueIndex] || currentQueue[0] || getCurrentCollectionTracks()[0] || tracks[0] || null;
}

function handlePlaybackErrorRecovery() {
  const audio = els.audioPlayer;
  const current = getCurrentTrack();
  if (!audio || !current) return;

  const now = Date.now();
  if (now - playbackErrorRecoveryAt > 12000) playbackErrorRecoveryCount = 0;
  playbackErrorRecoveryAt = now;
  playbackErrorRecoveryCount += 1;

  if (navigator.onLine === false) {
    renderOfflineStatus({ forceVisible: true });
    return;
  }

  // Keep recovery gentle. Do not repeatedly swap src on the active audio element,
  // because that can make mobile Safari sound unstable during normal buffering.
  if (playbackErrorRecoveryCount <= 1 && audio.src) {
    const retryTime = Math.max(0, Number(audio.currentTime) || 0);
    window.setTimeout(() => {
      try {
        if (retryTime > 1 && Number.isFinite(audio.duration)) audio.currentTime = Math.min(retryTime, Math.max(0, audio.duration - 1));
        audio.play().catch(() => {
          if (currentQueue.length > 1) playNextTrack();
        });
      } catch (error) {
        if (currentQueue.length > 1) playNextTrack();
      }
    }, 250);
    return;
  }

  if (currentQueue.length > 1) playNextTrack();
}


function togglePlayPause() {
  if (!els.audioPlayer) return;

  const current = getCurrentTrack();
  if (current && isPendingPlaybackTrack(current.id)) {
    updatePlayButton();
    syncCurrentPlaybackHighlights();
    syncQueuePlaybackUI();
    return;
  }

  if (!els.audioPlayer.src) {
    const target = getPlayableStartupTrack();
    if (target) {
      if (!currentQueue.length) {
        setQueue(getCurrentCollectionTracks().length ? getCurrentCollectionTracks() : tracks, false);
      }
      const matchIndex = currentQueue.findIndex(track => track.id === target.id);
      if (matchIndex >= 0) currentQueueIndex = matchIndex;
      playTrack(target);
    }
    return;
  }

  if (els.audioPlayer.paused) {
    if (shouldAskResumeChoice()) {
      showResumeChoicePrompt(current, restoredPausedSession.time);
      return;
    }
    markUserPlaybackIntent(true);
    els.audioPlayer.play().then(() => primeNextAudioForContinuousPlayback()).catch(err => {
      console.error("Playback failed:", err);
      handlePlaybackErrorRecovery();
    });
  } else {
    markUserPlaybackIntent(false);
    els.audioPlayer.pause();
  }
}


function playCurrentAudioFromMediaSession() {
  const audio = els.audioPlayer;
  const current = getCurrentTrack();
  markUserPlaybackIntent(true);
  if (!audio?.src) {
    const target = getPlayableStartupTrack();
    if (target) return playTrack(target);
    return undefined;
  }
  return audio.play().then(() => {
    if (current) updateMediaSessionMetadata(current);
    updatePlayButton();
    syncCurrentPlaybackHighlights();
    syncQueuePlaybackUI();
  }).catch(() => handlePlaybackErrorRecovery());
}

function pauseCurrentAudioFromMediaSession() {
  markUserPlaybackIntent(false);
  els.audioPlayer?.pause();
  updateMediaSessionPlaybackState();
  persistPlaybackStateSoon("media-session-pause");
}

function bindMediaSessionHandlers() {
  if (!window.AineoMediaSession?.bindHandlers) return;
  window.AineoMediaSession.bindHandlers({
    togglePlayPause,
    playCurrentAudio: playCurrentAudioFromMediaSession,
    pauseCurrentAudio: pauseCurrentAudioFromMediaSession,
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
  window.AineoMediaSession?.updatePlaybackState?.(els.audioPlayer);
}

function updateMediaSessionMetadata(track) {
  window.AineoMediaSession?.updateMetadata?.(track, els.audioPlayer);
}

function updateMediaSessionPositionState(force = false) {
  window.AineoMediaSession?.updatePositionState?.(els.audioPlayer, { force });
}

function updateNowPlaying(track) {
  if (els.nowCover) {
    els.nowCover.src = track.cover || "";
    els.nowCover.alt = `${track.title} cover`;
  }

  if (els.nowTitle) els.nowTitle.textContent = track.title || "Untitled";
  if (els.nowArtist) els.nowArtist.textContent = "";
  if (els.nowAlbum) els.nowAlbum.textContent = "";
  if (els.nowScripture) els.nowScripture.textContent = "";

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
  const activeTrackId = getCurrentPlaybackTrackId();
  const isPlaybackPending = Boolean(activeTrackId && isPendingPlaybackTrack(activeTrackId));
  const isPlaying = Boolean(activeTrackId && ((els.audioPlayer && !els.audioPlayer.paused && els.audioPlayer.src) || isPlaybackPending));

  els.featuredTrackList.querySelectorAll(".featured-track-row").forEach(row => {
    const isCurrentTrack = Boolean(activeTrackId && row.dataset.trackId === activeTrackId);
    row.classList.toggle("playing", isCurrentTrack);
    row.classList.toggle("is-current", isCurrentTrack);
    row.classList.toggle("is-playing", isCurrentTrack && isPlaying);
    row.classList.toggle("is-paused", isCurrentTrack && !isPlaying);
  });

  els.featuredTrackList.querySelectorAll(".featured-track-play[data-track-id]").forEach(btn => {
    const trackId = btn.dataset.trackId;
    const row = btn.closest('.featured-track-row');
    const trackTitle = row?.querySelector('.featured-track-title')?.textContent?.trim() || btn.dataset.trackTitle || "track";
    const isCurrentTrack = Boolean(activeTrackId && trackId === activeTrackId);
    const buttonShowsPause = isCurrentTrack && isPlaying;

    btn.textContent = buttonShowsPause ? "❚❚" : "▶";
    btn.classList.toggle("is-playing", buttonShowsPause);
    btn.classList.toggle("is-current", isCurrentTrack);
    btn.setAttribute("aria-pressed", buttonShowsPause ? "true" : "false");
    btn.setAttribute("aria-label", (buttonShowsPause ? "Pause" : "Play") + " " + trackTitle);
  });
}

function syncFeaturedTrackPlayButtons() {
  if (!els.featuredTrackList) return;
  const activeTrackId = getCurrentPlaybackTrackId();

  els.featuredTrackList.querySelectorAll(".featured-track-row").forEach(row => {
    const isCurrentTrack = Boolean(activeTrackId && row.dataset.trackId === activeTrackId);
    row.classList.toggle("playing", isCurrentTrack);
  });

  els.featuredTrackList.querySelectorAll(".featured-track-play[data-track-id]").forEach(btn => {
    const trackId = btn.dataset.trackId;
    const trackTitle = btn.dataset.trackTitle || "track";
    const isCurrentTrack = Boolean(activeTrackId && trackId === activeTrackId);
    const isPlaying = Boolean(isCurrentTrack && ((els.audioPlayer && !els.audioPlayer.paused && els.audioPlayer.src) || isPendingPlaybackTrack(trackId)));

    btn.textContent = isPlaying ? "❚❚" : "▶";
    btn.classList.toggle("is-playing", isPlaying);
    btn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    btn.setAttribute("aria-label", (isPlaying ? "Pause" : "Play") + " " + trackTitle);
  });
}

function syncQueuePlaybackUI() {
  const activeTrackId = getCurrentPlaybackTrackId();
  const isPlaybackPending = Boolean(activeTrackId && isPendingPlaybackTrack(activeTrackId));
  const isPlaying = Boolean(activeTrackId && ((els.audioPlayer && !els.audioPlayer.paused && els.audioPlayer.src) || isPlaybackPending));

  document.querySelectorAll('.queue-row').forEach(row => {
    const isCurrentTrack = Boolean(activeTrackId && row.dataset.trackId === activeTrackId);
    row.classList.toggle('active', isCurrentTrack);
    row.classList.toggle('is-current', isCurrentTrack);
    row.classList.toggle('is-playing', isCurrentTrack && isPlaying);
    row.classList.toggle('is-paused', isCurrentTrack && !isPlaying);
  });

  document.querySelectorAll('.queue-play-btn[data-queue-play]').forEach(btn => {
    const row = btn.closest('.queue-row');
    const trackId = row?.dataset.trackId || '';
    const trackTitle = row?.querySelector('.queue-title-row h3')?.textContent?.trim() || 'track';
    const isCurrentTrack = Boolean(activeTrackId && trackId === activeTrackId);
    const buttonShowsPause = isCurrentTrack && isPlaying;

    btn.textContent = buttonShowsPause ? '❚❚' : '▶';
    btn.classList.toggle('is-playing', buttonShowsPause);
    btn.classList.toggle('is-current', isCurrentTrack);
    btn.setAttribute('aria-pressed', buttonShowsPause ? 'true' : 'false');
    btn.setAttribute('aria-label', (buttonShowsPause ? 'Pause' : 'Play') + ' ' + trackTitle);
  });
}

function requestPlaybackUiSync() {
  const sync = () => {
    syncCurrentPlaybackHighlights();
    syncQueuePlaybackUI();
  };
  sync();
  if (window.requestAnimationFrame) {
    window.requestAnimationFrame(() => {
      sync();
      window.requestAnimationFrame(sync);
    });
  } else {
    window.setTimeout(sync, 0);
    window.setTimeout(sync, 80);
  }
}

function updatePlayButton() {
  if (!els.audioPlayer) return;
  const activeTrackId = getCurrentPlaybackTrackId();
  const pending = Boolean(activeTrackId && isPendingPlaybackTrack(activeTrackId));
  const playing = (pending || !els.audioPlayer.paused);
  const markup = playing ? AINEO_PLAYER_ICONS.pause : AINEO_PLAYER_ICONS.play;
  if (els.playBtn) els.playBtn.innerHTML = markup;
  if (els.playerSheetPlayBtn) els.playerSheetPlayBtn.innerHTML = markup;
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
  const activeId = getCurrentPlaybackTrackId();
  if (!activeId) return;

  const found = filteredTracks.findIndex(track => track.id === activeId);
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
    behavior: "auto",
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

function buildMiniPlayerButtonMarkup(kind, label) {
  const safeLabel = escapeHtml(String(label || ''));
  const icons = {
    favoriteOutline: '<span class="mini-btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></span>',
    favoriteFilled: '<span class="mini-btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M12 1.8l2.84 6.72 7.29.62-5.53 4.8 1.67 7.16L12 17.7l-6.07 3.4 1.67-7.16-5.53-4.8 7.29-.62L12 1.8z"/></svg></span>',
    offlineSave: '<span class="mini-btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M12 3v9.17l3.59-3.58L17 10l-5 5-5-5 1.41-1.41L11 12.17V3zM5 19h14v2H5z"/></svg></span>',
    offlineSaved: '<span class="mini-btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 9-3-3 1.41-1.41L11 9.17l3.59-3.58L16 7l-5 5z"/></svg></span>',
    offlineUnavailable: '<span class="mini-btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></span>'
  };
  const icon = icons[kind] || icons.favoriteOutline;
  return `${icon}<span class="mini-btn-label">${safeLabel}</span>`;
}

window.buildMiniPlayerButtonMarkup = buildMiniPlayerButtonMarkup;

function updateFavoriteButton() {
  const track = getCurrentTrack();
  if (!els.favoriteSongBtn) return;

  if (!track) {
    els.favoriteSongBtn.innerHTML = buildMiniPlayerButtonMarkup("favoriteOutline", "Favorite");
    els.favoriteSongBtn.setAttribute("aria-label", "Favorite");
    if (els.playerSheetFavoriteBtn) {
      els.playerSheetFavoriteBtn.innerHTML = AINEO_PLAYER_ICONS.heart;
      els.playerSheetFavoriteBtn.setAttribute("aria-label", "Favorite");
      els.playerSheetFavoriteBtn.setAttribute("aria-pressed", "false");
      els.playerSheetFavoriteBtn.classList.remove("is-favorited");
      els.playerSheetFavoriteBtn.dataset.favoriteState = "off";
    }
    return;
  }

  const favorited = isFavorite(track);
  els.favoriteSongBtn.innerHTML = buildMiniPlayerButtonMarkup(favorited ? "favoriteFilled" : "favoriteOutline", favorited ? "Favorited" : "Favorite");
  els.favoriteSongBtn.setAttribute("aria-label", favorited ? "Favorited" : "Favorite");
  if (els.playerSheetFavoriteBtn) {
    els.playerSheetFavoriteBtn.innerHTML = favorited ? AINEO_PLAYER_ICONS.heartFilled : AINEO_PLAYER_ICONS.heart;
    els.playerSheetFavoriteBtn.setAttribute("aria-label", favorited ? "Favorited" : "Favorite");
    els.playerSheetFavoriteBtn.setAttribute("aria-pressed", favorited ? "true" : "false");
    els.playerSheetFavoriteBtn.classList.toggle("is-favorited", favorited);
    els.playerSheetFavoriteBtn.dataset.favoriteState = favorited ? "on" : "off";
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
  recentlyPlayed = [track.id, ...recentlyPlayed.filter(id => id !== track.id)].slice(0, 15);
  saveRecentlyPlayed();
  renderRecentlyPlayed();
  if (isLandingHomePage() && normalizeHomeListChoice(homeListChoice) === "recent") {
    renderFeaturedAlbum();
    renderFeaturedTrackList();
  }
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
      behavior: "auto",
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
    behavior: "auto",
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
  restoredPausedSession = { trackId: track.id, time: resumeTrackTime || 0, duration: getTrackDurationSeconds(track, lastKnownPersistedPosition?.duration || 0) };
  resumePersistedTrackChoice(true);
  hideResumeBanner();
}

function startSavedTrackOver() {
  const track = resumeTrackSrc ? tracks.find(t => t.src === resumeTrackSrc) : getCurrentTrack();
  if (!track) return;
  restoredPausedSession = { trackId: track.id, time: 0, duration: getTrackDurationSeconds(track, 0) };
  resumePersistedTrackChoice(false);
  hideResumeBanner();
}


function getTrackShareSlug(track) {
  const fallback = String(track?.title || track?.id || 'song').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'song';
  return track?.slug || fallback;
}

function getAineoAppBaseUrl() {
  try {
    const href = String(window.location.href || '').split(/[?#]/)[0];
    const shareIndex = href.indexOf('/share/');
    if (shareIndex >= 0) return href.slice(0, shareIndex + 1);
    return new URL('./', href || document.baseURI || './').toString();
  } catch (error) {
    try { return new URL('./', document.baseURI || './').toString(); } catch (innerError) { return './'; }
  }
}

function buildAineoShareUrl(path) {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  try {
    return new URL(cleanPath, getAineoAppBaseUrl()).toString();
  } catch (error) {
    return cleanPath;
  }
}

function getAppShareUrl() {
  return buildAineoShareUrl('share/app/v43226.html');
}

function getAppShareCardUrl(story = false) {
  return buildAineoShareUrl(story ? 'share/cards/app-story-v43225.png' : 'share/cards/app-card-v43225.png');
}

function getAppShareText() {
  return 'AINEO Music — original worship songs, playlists, downloads, and Shout Outs.';
}


const AINEO_APP_ICON_INLINE_DATA_URI = "data:image/png;base64,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";

function getTrackShareUrl(track) {
  const slug = getTrackShareSlug(track);
  return buildAineoShareUrl(`share/song/${slug}.html`);
}

function getTrackShareCardUrl(track, story = false) {
  const slug = getTrackShareSlug(track);
  const path = story ? `share/cards/story/${slug}.svg` : `share/cards/song/${slug}.svg`;
  return buildAineoShareUrl(path);
}

function getTrackShareText(track) {
  const refs = Array.isArray(track?.scripture_references) ? track.scripture_references.filter(Boolean) : [];
  const scripture = refs.length ? ` Scripture: ${refs.slice(0, 2).join(' • ')}` : '';
  return `${track?.title || 'AINEO Music'} — listen in AINEO Music.${scripture}`;
}

function findTrackForShare() {
  if (socialShareTrackId) return tracks.find(item => item.id === socialShareTrackId) || null;
  return getCurrentTrack();
}

function getActiveSharePayload() {
  if (socialShareMode === 'app') {
    return {
      kind: 'app',
      title: 'AINEO Music',
      meta: 'Share the full AINEO Music app',
      text: getAppShareText(),
      url: getAppShareUrl(),
      cardUrl: getAppShareCardUrl(false),
      storyUrl: getAppShareCardUrl(true),
      downloadName: 'aineo-app-card.png',
      storyDownloadName: 'aineo-app-story.png'
    };
  }
  const track = findTrackForShare();
  if (!track) return null;
  const refs = Array.isArray(track.scripture_references) ? track.scripture_references.filter(Boolean) : [];
  const slug = getTrackShareSlug(track);
  return {
    kind: 'track',
    title: track.title || 'Share this song',
    meta: `${track.album || 'AINEO Music'}${refs[0] ? ` • ${refs[0]}` : ''}`,
    text: getTrackShareText(track),
    url: getTrackShareUrl(track),
    cardUrl: getTrackShareCardUrl(track, false),
    storyUrl: getTrackShareCardUrl(track, true),
    downloadName: `${slug}-share-card.svg`,
    storyDownloadName: `${slug}-story.svg`
  };
}


function makeAineoFallbackShareCardDataUrl(payload = {}) {
  const isApp = payload.kind === 'app';
  const title = isApp ? 'Share the app.' : (payload.title || 'AINEO Music');
  const safeTitle = String(title).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#1f4fd8"/><stop offset="0.45" stop-color="#110b2d"/><stop offset="1" stop-color="#8c35e8"/></linearGradient>
      <radialGradient id="glow" cx="80%" cy="12%" r="58%"><stop offset="0" stop-color="#c084fc" stop-opacity="0.55"/><stop offset="1" stop-color="#c084fc" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <rect width="1200" height="630" fill="url(#glow)"/>
    <rect x="56" y="56" width="1088" height="518" rx="46" fill="#100a28" fill-opacity="0.92" stroke="#d8b4fe" stroke-width="3"/>
    <rect x="92" y="92" width="1016" height="446" rx="36" fill="#0b0820" fill-opacity="0.82" stroke="#eadcff" stroke-width="2"/>
    <rect x="126" y="132" width="340" height="366" rx="48" fill="#060718" stroke="#72d7ff" stroke-width="4"/>
    <image x="152" y="158" width="288" height="288" preserveAspectRatio="xMidYMid meet" href="${AINEO_APP_ICON_INLINE_DATA_URI}"/>
    <text x="520" y="182" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-weight="900" font-size="28" letter-spacing="3" fill="#d8b4fe">AINEO MUSIC</text>
    <text x="520" y="274" font-family="Georgia,serif" font-weight="900" font-size="68" fill="#ffffff">${safeTitle}</text>
    <text x="520" y="354" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="30" fill="#eee7ff">Original worship songs, playlists,</text>
    <text x="520" y="396" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="30" fill="#eee7ff">downloads, and Shout Outs.</text>
    <rect x="520" y="430" width="287" height="62" rx="31" fill="#9969f8" stroke="#eadcff" stroke-width="2"/>
    <text x="663" y="470" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-weight="900" font-size="26" fill="#ffffff">Open AINEO Music</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function primeSocialPreviewImage(payload) {
  if (!els.socialSharePreview || !payload) return;
  const fallback = makeAineoFallbackShareCardDataUrl(payload);
  els.socialSharePreview.dataset.shareKind = payload.kind || 'track';
  if (payload.kind === 'app') {
    // App sharing uses the true app icon as the in-app preview source so the sheet is never dependent on
    // a cached or misresolved image path. The downloadable/OG assets still use /share/cards/app-card.png.
    els.socialSharePreview.onerror = null;
    els.socialSharePreview.dataset.fallback = 'icon-primary';
    els.socialSharePreview.src = fallback;
    els.socialSharePreview.alt = 'AINEO Music app icon share card preview';
    return;
  }
  els.socialSharePreview.onerror = () => {
    els.socialSharePreview.onerror = null;
    els.socialSharePreview.src = fallback;
    els.socialSharePreview.dataset.fallback = 'true';
  };
  els.socialSharePreview.dataset.fallback = 'false';
  els.socialSharePreview.src = payload.cardUrl;
  els.socialSharePreview.alt = 'AINEO song share card preview';
}

function paintSocialShareSheet(payload) {
  if (!payload) return;
  if (els.socialShareTitle) els.socialShareTitle.textContent = payload.title;
  if (els.socialShareMeta) els.socialShareMeta.textContent = payload.meta || 'Choose where to share.';
  primeSocialPreviewImage(payload);
  if (els.socialShareNativeBtn) els.socialShareNativeBtn.textContent = payload.kind === 'app' ? 'Share App with Device' : 'Share with Device';
  // Download-card and nested Share Full App controls were intentionally removed from the share sheet.
}

function openSocialShareSheetForTrack(track, triggerEl = null) {
  if (!track) return;
  if (!els.socialShareSheet) {
    shareTrackWithDevice(track);
    return;
  }
  socialShareMode = 'track';
  socialShareTrackId = track.id || '';
  socialShareTriggerEl = triggerEl || document.activeElement || null;
  paintSocialShareSheet(getActiveSharePayload());
  els.socialShareSheet.classList.remove('hidden');
  els.socialShareSheet.setAttribute('aria-hidden', 'false');
  document.body.classList.add('social-share-open');
  window.requestAnimationFrame(() => els.socialShareNativeBtn?.focus?.({ preventScroll: true }));
}

function openSocialShareSheetForApp(triggerEl = null) {
  if (!els.socialShareSheet) {
    shareAppWithDevice();
    return;
  }
  socialShareMode = 'app';
  socialShareTrackId = '';
  socialShareTriggerEl = triggerEl || document.activeElement || null;
  paintSocialShareSheet(getActiveSharePayload());
  els.socialShareSheet.classList.remove('hidden');
  els.socialShareSheet.setAttribute('aria-hidden', 'false');
  document.body.classList.add('social-share-open');
  window.requestAnimationFrame(() => els.socialShareNativeBtn?.focus?.({ preventScroll: true }));
}

function closeSocialShareSheet() {
  if (!els.socialShareSheet) return;
  els.socialShareSheet.classList.add('hidden');
  els.socialShareSheet.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('social-share-open');
  socialShareTrackId = '';
  socialShareMode = 'track';
  const restore = socialShareTriggerEl;
  socialShareTriggerEl = null;
  if (restore && typeof restore.focus === 'function') window.requestAnimationFrame(() => restore.focus({ preventScroll: true }));
}

async function shareActiveSocialItemWithDevice() {
  const payload = getActiveSharePayload();
  if (!payload) return;
  if (navigator.share) {
    try {
      await navigator.share({ title: payload.kind === 'app' ? 'AINEO Music' : `${payload.title} | AINEO Music`, text: payload.text, url: payload.url });
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
  }
  return copyActiveSocialShareLink();
}

async function shareTrackWithDevice(track = findTrackForShare()) {
  if (!track) return;
  const previousMode = socialShareMode;
  const previousTrackId = socialShareTrackId;
  socialShareMode = 'track';
  socialShareTrackId = track.id || socialShareTrackId;
  try {
    await shareActiveSocialItemWithDevice();
  } finally {
    socialShareMode = previousMode;
    socialShareTrackId = previousTrackId;
  }
}

async function shareAppWithDevice() {
  const previousMode = socialShareMode;
  socialShareMode = 'app';
  try {
    await shareActiveSocialItemWithDevice();
  } finally {
    socialShareMode = previousMode;
  }
}

function isPublicHttpUrl(value) {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return false;
    if (/^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false;
    return true;
  } catch (error) {
    return false;
  }
}

function openPlatformShare(platform) {
  const payload = getActiveSharePayload();
  if (!payload) return;
  let shareUrl = '';
  if (platform === 'facebook') {
    const facebookTargetUrl = payload.kind === 'app' ? getAppShareUrl() : payload.url;
    if (!isPublicHttpUrl(facebookTargetUrl)) {
      // Facebook cannot prepare a share composer from file://, localhost, private LAN, or unhosted ZIP URLs.
      // Keep the user in the app and explain the real requirement instead of opening a blank/useless Facebook page.
      flashButtonText(els.socialShareFacebookBtn, 'Public host needed');
      copyActiveSocialShareLink();
      return;
    }
    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(facebookTargetUrl)}`;
    flashButtonText(els.socialShareFacebookBtn, 'Opening Facebook…');
    openExternalShareUrl(shareUrl);
    return;
  } else if (platform === 'x') {
    shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(payload.text)}&url=${encodeURIComponent(payload.url)}`;
  }
  if (!shareUrl) return;
  openExternalShareUrl(shareUrl);
}

function openExternalShareUrl(shareUrl) {
  if (!shareUrl) return;
  const link = document.createElement('a');
  link.href = shareUrl;
  link.target = '_blank';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    if (!document.hidden) {
      try { window.open(shareUrl, '_blank', 'noopener'); }
      catch (error) { window.location.href = shareUrl; }
    }
  }, 180);
}

async function copyActiveSocialShareLink() {
  const payload = getActiveSharePayload();
  if (!payload) return;
  try {
    await navigator.clipboard.writeText(payload.url);
    flashButtonText(els.socialShareCopyBtn, 'Copied!');
    if (payload.kind === 'track') {
      flashButtonText(els.shareSongBtn, 'Copied!');
      flashButtonText(els.shareSongBtnDesktop, 'Copied!');
    }
  } catch (error) {
    console.error('Share link copy failed:', error);
  }
}

function downloadActiveSocialShareCard(story = false) {
  const payload = getActiveSharePayload();
  if (!payload) return;
  const a = document.createElement('a');
  a.href = story ? payload.storyUrl : payload.cardUrl;
  a.download = story ? payload.storyDownloadName : payload.downloadName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function copyTrackShareLink(track = findTrackForShare()) {
  if (!track) return;
  const previousMode = socialShareMode;
  const previousTrackId = socialShareTrackId;
  socialShareMode = 'track';
  socialShareTrackId = track.id || socialShareTrackId;
  const result = copyActiveSocialShareLink();
  socialShareMode = previousMode;
  socialShareTrackId = previousTrackId;
  return result;
}

function downloadTrackShareCard(track = findTrackForShare(), story = false) {
  if (!track) return;
  const previousMode = socialShareMode;
  const previousTrackId = socialShareTrackId;
  socialShareMode = 'track';
  socialShareTrackId = track.id || socialShareTrackId;
  try {
    downloadActiveSocialShareCard(story);
  } finally {
    socialShareMode = previousMode;
    socialShareTrackId = previousTrackId;
  }
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
  openSocialShareSheetForTrack(track, els.shareSongBtn || els.playerSheetShareBtn || document.activeElement);
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
  if (els.audioPlayer && !els.audioPlayer.paused) {
    window.requestAnimationFrame(() => setMiniVisualizerActive(true));
  }
}



function hidePlayerSheetMoreMenu() {
  if (!els.playerSheetMoreMenu || !els.playerSheetMoreBtn) return;
  els.playerSheetMoreMenu.classList.add("hidden");
  els.playerSheetMoreBtn.setAttribute("aria-expanded", "false");
}

function togglePlayerSheetMoreMenu() {
  if (!els.playerSheetMoreMenu || !els.playerSheetMoreBtn) return;
  const isHidden = els.playerSheetMoreMenu.classList.contains("hidden");
  els.playerSheetMoreMenu.classList.toggle("hidden", !isHidden);
  els.playerSheetMoreBtn.setAttribute("aria-expanded", isHidden ? "true" : "false");
}

function openPlayerSheetPlaylistAction() {
  const track = getCurrentTrack();
  hidePlayerSheetMoreMenu();
  if (track) openPlaylistModalForTrack(track, els.playerSheetAddToPlaylistBtn || els.playerSheetMorePlaylistBtn);
}

function togglePlayerSheetOfflineAction() {
  const track = getCurrentTrack();
  hidePlayerSheetMoreMenu();
  if (track) toggleTrackOffline(track);
}

function openPlayerSheetLyricsAction(event = null) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  hidePlayerSheetMoreMenu();
  openLyricsModal(els.playerSheetLyricsBtn || event?.currentTarget || null);
}

function sharePlayerSheetAction() {
  hidePlayerSheetMoreMenu();
  shareCurrentSong();
}

function togglePlayerSheetLyricsPanel(forceVisible = true) {
  if (!els.playerSheetPanelSection) return;
  const shouldShow = forceVisible ? true : !els.playerSheetPanelSection.classList.contains('is-visible');
  els.playerSheetPanelSection.classList.toggle('is-visible', shouldShow);
  if (shouldShow && els.playerSheetLyricsPanel) {
    els.playerSheetLyricsPanel.scrollTop = 0;
    requestAnimationFrame(() => els.playerSheetLyricsPanel.scrollIntoView({ behavior: 'auto', block: 'start' }));
  }
}

function syncMiniPlayerFromAudioState() {
  const track = getCurrentTrack();
  if (track) {
    if (els.nowCover) {
      els.nowCover.src = track.cover || "";
      els.nowCover.alt = `${track.title || "Current song"} cover`;
    }
    if (els.nowTitle) els.nowTitle.textContent = track.title || "Untitled";
    if (els.nowArtist) els.nowArtist.textContent = "";
    if (els.nowAlbum) els.nowAlbum.textContent = "";
    if (els.nowScripture) els.nowScripture.textContent = "";
    updateOfflineButtons(track);
  }
  updateProgressUI();
  updatePlayButton();
  updateMediaSessionPlaybackState();
  updateMediaSessionPositionState(true);
  syncCurrentPlaybackHighlights();
  syncQueuePlaybackUI();
}

function requestMiniPlayerSyncAfterSheetClose() {
  syncMiniPlayerFromAudioState();
  window.requestAnimationFrame(() => {
    syncMiniPlayerFromAudioState();
    window.setTimeout(syncMiniPlayerFromAudioState, 80);
    window.setTimeout(syncMiniPlayerFromAudioState, 240);
  });
}
function closePlayerSheet() {
  hidePlayerSheetMoreMenu();
  setMiniVisualizerActive(false);
  requestMiniPlayerSyncAfterSheetClose();
  window.AineoPlayerSheet.close({
    els,
    isAnyModalOpen,
    lockBodyScroll,
    restoreFocus
  });
  requestMiniPlayerSyncAfterSheetClose();
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
  hidePlayerSheetMoreMenu();
  updatePlaybackModeButtons();
  if (els.playerSheetPanelSection) els.playerSheetPanelSection.classList.remove("is-visible");
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

function normalizeSongLookupValue(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function handleSongQueryParam() {
  handleLibraryQueryParams();
  const params = new URLSearchParams(window.location.search);
  const song = params.get("song");
  if (!song) return;

  const normalizedSong = normalizeSongLookupValue(song);
  const track = tracks.find(t => {
    const title = normalizeSongLookupValue(t.title);
    const slug = normalizeSongLookupValue(t.slug);
    const audioName = normalizeSongLookupValue(decodeURIComponent(String(t.audio || t.src || '').split('/').pop() || '').replace(/\.mp3$/i, ''));
    const aliases = Array.isArray(t.title_aliases) ? t.title_aliases.map(value => normalizeSongLookupValue(value)) : [];
    return title === normalizedSong || slug === normalizedSong || audioName === normalizedSong || aliases.includes(normalizedSong);
  });
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
  url.searchParams.set("song", track.slug || track.title);
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
  window.scrollTo({ top: 0, behavior: "auto" });
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


/* =========================
   v43.2.26 LIBRARY PANEL LAUNCHERS
========================= */

function normalizePanelName(panelName = "library") {
  const normalized = String(panelName || "library").toLowerCase();
  if (normalized === "quick-filters" || normalized === "quickfilters") return "filters";
  if (normalized === "playlists" || normalized === "filters" || normalized === "search") return normalized;
  return "library";
}

function setBottomIconSelection(panelName = "library") {
  const row = document.querySelector(".aineo-bottom-icon-row");
  if (!row) return;
  const selected = normalizePanelName(panelName);
  row.querySelectorAll(".aineo-bottom-icon").forEach(icon => {
    icon.classList.remove("active");
    icon.removeAttribute("data-panel-selected");
    if (icon.getAttribute("aria-current") === "page") icon.removeAttribute("aria-current");
  });

  let target = null;
  if (selected === "playlists") target = row.querySelector('[data-open-library-panel="playlists"]');
  else if (selected === "filters") target = row.querySelector('[data-open-library-panel="filters"]');
  else if (selected === "search" || selected === "library") target = row.querySelector('a[href$="/music.html"], a[href="/music.html"]');

  if (target) {
    target.classList.add("active");
    target.setAttribute("data-panel-selected", "true");
    target.setAttribute("aria-current", "page");
  }
}

function scrollPanelToTop(panelName = "library") {
  const selected = normalizePanelName(panelName);
  const target = selected === "playlists"
    ? document.querySelector(".playlist-section-card")
    : selected === "library"
      ? document.querySelector(".featured-tracklist-panel")
      : document.querySelector(".music-library-card");

  try { window.history.scrollRestoration = "manual"; } catch (error) {}
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });

  if (target) {
    target.scrollTop = 0;
    target.querySelectorAll(".section-body, .lyrics-modal-body").forEach(node => { node.scrollTop = 0; });
    if (selected === "library") {
      requestAnimationFrame(() => target.scrollIntoView({ behavior: "auto", block: "start" }));
    }
  }
}

function closeLibraryPanels() {
  document.body.classList.remove("library-panel-search-open", "library-panel-playlists-open", "library-panel-filters-open");
  document.getElementById("libraryPanelBackdrop")?.classList.add("hidden");
  if (document.body.classList.contains("library-page-cleanup")) setBottomIconSelection("library");
}

function openLibraryPanel(panelName = "search") {
  const normalized = normalizePanelName(panelName);
  closeLibraryPanels();
  scrollPanelToTop(normalized);

  if (normalized === "playlists") {
    document.body.classList.add("library-panel-playlists-open");
    document.getElementById("libraryPanelBackdrop")?.classList.remove("hidden");
    setBottomIconSelection("playlists");
    requestAnimationFrame(() => {
      scrollPanelToTop("playlists");
      document.getElementById("playlistSectionBody")?.closest("section")?.querySelector("button, input, a")?.focus?.({ preventScroll: true });
    });
    return;
  }

  if (normalized === "filters") {
    document.body.classList.add("library-panel-filters-open", "library-panel-search-open");
    document.getElementById("libraryPanelBackdrop")?.classList.remove("hidden");
    setBottomIconSelection("filters");
    requestAnimationFrame(() => {
      scrollPanelToTop("filters");
      els.searchInput?.focus?.({ preventScroll: true });
    });
    return;
  }

  document.body.classList.add("library-panel-search-open");
  document.getElementById("libraryPanelBackdrop")?.classList.remove("hidden");
  setBottomIconSelection("library");
  requestAnimationFrame(() => {
    scrollPanelToTop("search");
    els.searchInput?.focus?.({ preventScroll: true });
  });
}

function bindLibraryPanelLaunchers() {
  document.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-open-library-panel]");
    if (opener) {
      event.preventDefault();
      event.stopPropagation();
      openLibraryPanel(opener.dataset.openLibraryPanel || "search");
      return;
    }

    const close = event.target.closest("[data-close-library-panels]");
    if (close) {
      event.preventDefault();
      closeLibraryPanels();
      return;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLibraryPanels();
  });
}


window.AineoLibraryPanels = {
  open: openLibraryPanel,
  close: closeLibraryPanels,
  select: setBottomIconSelection,
  scrollToTop: scrollPanelToTop
};

function handleLibraryQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const smart = params.get("smart");
  if (smart) {
    filters.selectedAlbum = null;
    filters.selectedPlaylist = null;
    filters.selectedTag = null;
    filters.selectedCustomPlaylist = null;
    filters.searchTerm = "";
    filters.selectedSmartPlaylist = smart;
    if (els.searchInput) els.searchInput.value = "";
    updateLibraryView();
    scrollToTrackList();
  }

  const panel = params.get("panel");
  if (panel) {
    requestAnimationFrame(() => openLibraryPanel(panel));
  } else if (document.body.classList.contains("library-page-cleanup")) {
    setBottomIconSelection("library");
    requestAnimationFrame(() => scrollPanelToTop("library"));
  }
}


function initMobileNav() {
  // v43.2.26: nav.js owns hamburger/More through a foreground overlay menu.
  // Keep this initializer as a no-op so music runtime pages do not double-toggle a hidden UL.
}

function closeMobileNav(forceDesktopState = false) {
  const nav = els.siteNavLinks;
  const toggle = els.mobileNavToggle;
  nav?.classList.remove("nav-open", "open");
  document.body.classList.remove("nav-open");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "☰";
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
    clearLastHomePlaylistSelectionIfMatches("custom-playlist", name);
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
      saveLastHomePlaylistSelection({ type: "custom-playlist", name });
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
    saveLastHomePlaylistSelection({ type: "custom-playlist", name: result.activeName });
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
  if (lastHomePlaylistSelection?.type === "custom-playlist" && lastHomePlaylistSelection.name === oldName) {
    saveLastHomePlaylistSelection({ type: "custom-playlist", name: newName });
  }
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
      clearLastHomePlaylistSelectionIfMatches("custom-playlist", name);
    },
    renderPlaylistWorkspace,
    escapeHtml,
    escapeHtmlAttr
  });
}


// v43.2.26 legacy analysis preload disabled
async function preloadAnalysis(){
  return null;
}

async function preloadNextTrack(){
  return null;
}


// v43.2.26 smart playback cleanup
let userSkipCount = 0;

function smartPreloadEngine(){
  return null;
}

function trackSkipped(){
  userSkipCount++;
}

// optional instant play
async function instantPlay(){
  return null;
}



/* =========================
   v43.2.26 ULTRA SMOOTH PLAYBACK
========================= */

const SMART_PLAYBACK_VERSION = "43.2.26";
const SMART_PLAYBACK_KEYS = {
  instantPlay: "aineo_instant_play_mode",
  skipHistory: "aineo_skip_history"
};

const SMART_PLAYBACK = {
  baseCrossfadeMs: 180,
  maxCrossfadeMs: 260,
  fastSkipWindowMs: 20000,
  fastSkipThreshold: 3,
  backgroundQueueDepth: 4
};

let smartSkipTimestamps = [];

function isInstantPlayModeEnabled() {
  try {
    const stored = localStorage.getItem(SMART_PLAYBACK_KEYS.instantPlay);
    return stored == null ? true : stored !== "0";
  } catch (error) {
    return true;
  }
}

function setInstantPlayModeEnabled(nextValue) {
  try {
    localStorage.setItem(SMART_PLAYBACK_KEYS.instantPlay, nextValue ? "1" : "0");
  } catch (error) {}
  return Boolean(nextValue);
}

window.AineoPlayback = Object.assign({}, window.AineoPlayback || {}, {
  isInstantPlayModeEnabled,
  setInstantPlayModeEnabled
});

function noteTrackSkip() {
  const now = Date.now();
  smartSkipTimestamps = smartSkipTimestamps.filter((value) => now - value <= SMART_PLAYBACK.fastSkipWindowMs);
  smartSkipTimestamps.push(now);
  try {
    localStorage.setItem(SMART_PLAYBACK_KEYS.skipHistory, JSON.stringify(smartSkipTimestamps.slice(-12)));
  } catch (error) {}
}

(function restoreSkipHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(SMART_PLAYBACK_KEYS.skipHistory) || "[]");
    if (Array.isArray(raw)) smartSkipTimestamps = raw.filter((value) => Number.isFinite(value));
  } catch (error) {
    smartSkipTimestamps = [];
  }
})();

function shouldUsePredictivePreload() {
  if (lowPowerModeEnabled) return false;
  const now = Date.now();
  smartSkipTimestamps = smartSkipTimestamps.filter((value) => now - value <= SMART_PLAYBACK.fastSkipWindowMs);
  return smartSkipTimestamps.length >= SMART_PLAYBACK.fastSkipThreshold;
}

function getDynamicCrossfadeMs() {
  return shouldUsePredictivePreload() ? SMART_PLAYBACK.baseCrossfadeMs : SMART_PLAYBACK.maxCrossfadeMs;
}

function getTrackAnalysisUrl() {
  return "";
}

function warmTrackAnalysis() {
  return Promise.resolve(null);
}

function backgroundWarmupQueue(index = currentQueueIndex, queue = currentQueue) {
  if (!Array.isArray(queue) || !queue.length) return;
  const normalizedIndex = Math.max(0, Math.min(Number(index) || 0, queue.length - 1));
  const candidates = [];
  const mobileViewport = window.matchMedia?.("(max-width: 700px)")?.matches;
  const warmDepth = lowPowerModeEnabled ? 1 : (mobileViewport ? 2 : SMART_PLAYBACK.backgroundQueueDepth);
  for (let offset = 1; offset <= warmDepth; offset += 1) {
    const track = queue[normalizedIndex + offset];
    if (track) candidates.push(track);
  }
  const warm = () => {
    candidates.forEach((track, candidateIndex) => {
      window.setTimeout(() => {
        prefetchTrackMedia(track, { audio: !lowPowerModeEnabled, cover: candidateIndex < (lowPowerModeEnabled ? 1 : 2) });
      }, candidateIndex * 160);
    });
  };
  if (window.requestIdleCallback) {
    window.requestIdleCallback(warm, { timeout: 1200 });
  } else {
    window.setTimeout(warm, 240);
  }
}

function fadeAudioVolume(audio, fromVolume, toVolume, durationMs) {
  if (audio) audio.volume = Number.isFinite(toVolume) ? toVolume : 1;
  return Promise.resolve();
}

async function smoothPlayTrack(track, options = {}) {
  if (!track || !track.src || !els.audioPlayer) return;
  noteTrackSkip();
  els.audioPlayer.volume = 1;
  return playTrack(track);
}
