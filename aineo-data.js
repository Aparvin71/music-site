(function () {
  const config = window.AineoConfig || {};

  function normalizeStringArray(value) {
    if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
    if (typeof value === "string") return value.split(",").map(v => v.trim()).filter(Boolean);
    return [];
  }

  function makeTrackId(track, index) {
    return `${track.title || "track"}__${track.album || "album"}__${index}`;
  }


  function resolveLyricsFilePath(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const config = window.AineoConfig?.app?.assets || {};
    const basePath = String(config.lyricsBasePath || "lyrics").replace(/\/$/, "");
    if (raw.startsWith("lyrics/")) return raw;
    if (basePath && !raw.startsWith(basePath + "/")) return `${basePath}/${raw.replace(/^\/+/, "")}`;
    return raw;
  }

  function normalizeTrack(track, index) {
    const tags = normalizeStringArray(track.tags);
    const playlists = normalizeStringArray(track.playlists || track.playlist);
    const scriptureRefs = normalizeStringArray(track.scripture_references || track.scriptureReferences || track.scripture);
    const defaults = config.trackDefaults || {};

    return {
      id: track.id || makeTrackId(track, index),
      title: track.title || "Untitled",
      slug: track.slug || "",
      artist: track.artist || config.defaultArtist || "Allen Parvin",
      artist_slug: track.artist_slug || "",
      album: track.album || config.defaultAlbum || "Singles",
      album_slug: track.album_slug || "",
      year: track.year || "",
      genre: track.genre || "",
      duration: track.duration || "",
      duration_seconds: Number(track.duration_seconds || 0) || 0,
      src: track.src || track.url || track.audio || "",
      audio: track.audio || track.src || track.url || "",
      cover: track.cover || track.artwork || track.image || "",
      lyrics: track.lyrics || "",
      lyrics_file: resolveLyricsFilePath(track.lyrics_file || track.lyricsFile || ""),
      lyrics_offset: Number(track.lyrics_offset ?? track.lyricsOffset ?? 0) || 0,
      syncedLyrics: [],
      tags,
      playlists,
      scripture_references: scriptureRefs,
      trackNumber: track.trackNumber || track.track || "",
      description: track.description || "",
      album_zip: track.album_zip || "",
      album_description: track.album_description || "",
      album_theme: track.album_theme || "",
      album_story: track.album_story || "",
      album_badges: normalizeStringArray(track.album_badges),
      collection: track.collection || defaults.collection || "All Songs",
      featured: Boolean(track.featured ?? track.album_featured ?? defaults.featured),
      favorite: Boolean(track.favorite ?? defaults.favorite),
      play_count: Number(track.play_count || defaults.play_count || 0) || 0,
      last_played: track.last_played || defaults.last_played || "",
      date_added: track.date_added || track.added_at || "",
      search_keywords: normalizeStringArray(track.search_keywords || track.searchKeywords),
      has_lyrics: Boolean(track.has_lyrics || track.lyrics || track.lyrics_file),
      has_scripture_refs: Boolean(track.has_scripture_refs || scriptureRefs.length),
    };
  }

  window.AineoData = { normalizeStringArray, makeTrackId, normalizeTrack };
})();
