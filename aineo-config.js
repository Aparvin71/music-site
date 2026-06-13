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
      playStats: "aineo_play_stats",
      lastHomePlaylistSelection: "aineo_last_home_playlist_selection"
  };

  window.AineoConfig = {
    version: "v43.2.28",
    assetVersion: "43.2.28",
    defaultArtist: "Allen Parvin",
    assetMode: "decoupled",
    sharing: {
      // Set this after the app is hosted publicly, for example:
      // publicAppShareUrl: "https://your-domain.com/share/app/v43228.html"
      // Facebook requires this to be a public http/https URL it can crawl.
      publicAppShareUrl: "",
      appSharePath: "share/app/v43228.html"
    },
    assets: {
      audioBaseUrl: "https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/audio",
      coverBaseUrl: "https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/covers",
      lyricsBasePath: "lyrics",
      lyricsManifestPath: "lyrics/lrc-manifest.json",
      lyricsVersionKey: "43.2.28",
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
