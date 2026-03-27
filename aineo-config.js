(function () {
  const STORAGE_KEYS = {
    favorites: "aineo_favorites",
    recentlyPlayed: "aineo_recently_played",
    resume: "aineo_resume",
    customPlaylists: "aineo_custom_playlists",
    downloadedTracks: "aineo_downloaded_tracks",
    lastQueue: "aineo_last_queue"
  };

  window.AineoConfig = {
    version: "v41.0.2",
    defaultArtist: "Allen Parvin",
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
      topMobileTagLimit: 12
    },
    trackDefaults: {
      collection: "All Songs",
      featured: false,
      favorite: false,
      play_count: 0,
      last_played: ""
    }
  };
})();
