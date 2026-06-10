(function () {
  let handlersBound = false;
  let lastPositionUpdateAt = 0;
  let lastPositionSignature = "";

  function absoluteUrl(src) {
    try { return new URL(src, window.location.href).href; }
    catch (error) { return src; }
  }

  function isSupported() {
    return "mediaSession" in navigator;
  }

  function inferArtworkType(src) {
    const value = String(src || "").toLowerCase();
    if (value.endsWith(".png")) return "image/png";
    if (value.endsWith(".webp")) return "image/webp";
    return "image/jpeg";
  }

  function buildArtwork(track) {
    const src = track?.cover || track?.artwork || "/icons/icon-512.png";
    if (!src) return [];
    const type = inferArtworkType(src);
    const absoluteSrc = absoluteUrl(src);
    return [96, 128, 192, 256, 384, 512].map(size => ({
      src: absoluteSrc,
      sizes: `${size}x${size}`,
      type
    }));
  }

  function bindHandlers({ togglePlayPause, playCurrentAudio, pauseCurrentAudio, playPreviousTrack, playNextTrack, getAudio, onStateChange }) {
    if (handlersBound || !isSupported()) return;

    const safeAudio = () => getAudio?.() || null;
    const playRequested = () => {
      const audio = safeAudio();
      if (typeof playCurrentAudio === "function") return playCurrentAudio();
      if (audio && audio.paused && typeof audio.play === "function") return audio.play().catch(() => togglePlayPause?.());
      return undefined;
    };
    const pauseRequested = () => {
      const audio = safeAudio();
      if (typeof pauseCurrentAudio === "function") return pauseCurrentAudio();
      if (audio && !audio.paused) { audio.pause(); onStateChange?.(); return undefined; }
      return undefined;
    };

    const handlers = {
      play: playRequested,
      pause: pauseRequested,
      previoustrack: () => playPreviousTrack?.(),
      nexttrack: () => playNextTrack?.(),
      stop: () => {
        const audio = safeAudio();
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
        onStateChange?.();
      },
      seekbackward: (details = {}) => {
        const audio = safeAudio();
        if (!audio) return;
        const seekOffset = Number(details.seekOffset || 10);
        audio.currentTime = Math.max(0, (audio.currentTime || 0) - seekOffset);
        onStateChange?.();
      },
      seekforward: (details = {}) => {
        const audio = safeAudio();
        if (!audio) return;
        const seekOffset = Number(details.seekOffset || 10);
        const duration = Number.isFinite(audio.duration) ? audio.duration : (audio.currentTime || 0) + seekOffset;
        audio.currentTime = Math.min(duration, (audio.currentTime || 0) + seekOffset);
        onStateChange?.();
      },
      seekto: (details = {}) => {
        const audio = safeAudio();
        if (!audio || !Number.isFinite(details.seekTime)) return;
        audio.currentTime = details.seekTime;
        onStateChange?.();
      }
    };

    Object.entries(handlers).forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (error) {
        console.warn(`Media Session action not supported: ${action}`, error);
      }
    });

    handlersBound = true;
  }

  function updatePlaybackState(audio) {
    if (!isSupported()) return;
    navigator.mediaSession.playbackState = audio && !audio.paused ? "playing" : "paused";
  }

  function updateMetadata(track, audio) {
    if (!isSupported() || !track) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || "Untitled",
        artist: track.artist || "Allen Parvin",
        album: track.album || track.collection || "Singles",
        artwork: buildArtwork(track)
      });
    } catch (error) {
      console.warn("Media Session metadata could not be updated:", error);
    }

    updatePlaybackState(audio);
  }

  function updatePositionState(audio, { force = false } = {}) {
    if (!isSupported() || !audio || typeof navigator.mediaSession.setPositionState !== "function") return;

    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const position = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    if (!duration || duration <= 0) return;

    const now = Date.now();
    const signature = `${Math.floor(position)}|${Math.floor(duration)}|${audio.playbackRate || 1}|${audio.paused ? "p" : "y"}`;
    if (!force && signature === lastPositionSignature && now - lastPositionUpdateAt < 4500) return;
    if (!force && now - lastPositionUpdateAt < 4500 && !audio.paused) return;
    lastPositionUpdateAt = now;
    lastPositionSignature = signature;

    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: audio.playbackRate || 1,
        position: Math.min(position, duration)
      });
    } catch (error) {
      console.warn("Media Session position state could not be updated:", error);
    }
  }

  window.AineoMediaSession = {
    bindHandlers,
    updatePlaybackState,
    updateMetadata,
    updatePositionState
  };
})();