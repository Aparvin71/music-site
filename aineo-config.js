
// v43.1.25 hard reset
const APP_VERSION = "43.1.25";
try {
  const stored = localStorage.getItem("app_version");
  if (stored !== APP_VERSION) {
    localStorage.clear();
    sessionStorage.clear();
    if (window.indexedDB) {
      indexedDB.databases && indexedDB.databases().then(dbs => {
        dbs.forEach(db => indexedDB.deleteDatabase(db.name));
      });
    }
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
    localStorage.setItem("app_version", APP_VERSION);
    window.location.reload(true);
  }
} catch(e) {}
(function () {
  const STORAGE_KEYS = {
    favorites: "aineo_favorites",
    recentlyPlayed: "aineo_recently_played",
    resume: "aineo_resume",
    customPlaylists: "aineo_custom_playlists",
    downloadedTracks: "aineo_downloaded_tracks",
    lastQueue: "aineo_last_queue",
    tracksCache: "aineo_tracks_cache",
    offlineBannerDismissed: "aineo_offline_banner_dismissed",
      playStats: "aineo_play_stats"
  };

  window.AineoConfig = {
    version: "v43.1.25",
    assetVersion: "43.1.25",
    defaultArtist: "Allen Parvin",
    assetMode: "decoupled",
    assets: {
      audioBaseUrl: "https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/audio",
      coverBaseUrl: "https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/covers",
      lyricsBasePath: "lyrics",
      externalAudio: true,
      externalCovers: true,
      localLyricsOptional: true
    },
    defaultAlbum: "Singles",
    defaultCollectionLabel: "All Songs",
    defaultCollectionKey: "all-songs",
    maxLibraryMiniCards: 12,
    storageKeys: STORAGE_KEYS,
    ui: {
      artwork: {
        featured: 120,
        album: 150,
        mini: 150
      },
      topMobileTagLimit: 12,
      smartPlaylistLimit: 12,
      searchDebounceMs: 120
    },
    searchScopes: ["all", "titles", "albums", "lyrics", "scripture", "tags", "playlists"],
    trackDefaults: {
      collection: "All Songs",
      featured: false,
      favorite: false,
      play_count: 0,
      last_played: ""
    }
  };
})();
