let allTracks = [];
let currentQueue = [];
let currentIndex = -1;
let currentAlbum = null;
let currentTrack = null;
let currentTag = null;

const audioPlayer = document.getElementById("audioPlayer");
const nowCover = document.getElementById("nowCover");
const nowTitle = document.getElementById("nowTitle");
const nowArtist = document.getElementById("nowArtist");
const nowAlbum = document.getElementById("nowAlbum");
const nowScripture = document.getElementById("nowScripture");

const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const playQueueBtn = document.getElementById("playQueueBtn");
const shuffleQueueBtn = document.getElementById("shuffleQueueBtn");

const seekBar = document.getElementById("seekBar");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");

const queueList = document.getElementById("queueList");
const queueCount = document.getElementById("queueCount");
const playlistList = document.getElementById("playlistList");
const searchInput = document.getElementById("searchInput");
const albumGrid = document.getElementById("albumGrid");
const tagList = document.getElementById("tagList");

const favoritesList = document.getElementById("favoritesList");
const recentlyPlayedList = document.getElementById("recentlyPlayedList");

const featuredAlbumCover = document.getElementById("featuredAlbumCover");
const featuredAlbumTitle = document.getElementById("featuredAlbumTitle");
const featuredAlbumArtist = document.getElementById("featuredAlbumArtist");
const featuredAlbumCount = document.getElementById("featuredAlbumCount");
const playAlbumBtn = document.getElementById("playAlbumBtn");
const shuffleAlbumBtn = document.getElementById("shuffleAlbumBtn");
const downloadAlbumBtn = document.getElementById("downloadAlbumBtn");
const openAlbumBtn = document.getElementById("openAlbumBtn");

const lyricsContent = document.getElementById("lyricsContent");
const scriptureContent = document.getElementById("scriptureContent");
const openLyricsBtn = document.getElementById("openLyricsBtn");
const copyLyricsBtn = document.getElementById("copyLyricsBtn");
const shareSongBtn = document.getElementById("shareSongBtn");
const favoriteSongBtn = document.getElementById("favoriteSongBtn");
const downloadSongBtn = document.getElementById("downloadSongBtn");

const lyricsModal = document.getElementById("lyricsModal");
const lyricsModalBackdrop = document.getElementById("lyricsModalBackdrop");
const lyricsModalBody = document.getElementById("lyricsModalBody");
const lyricsModalTitle = document.getElementById("lyricsModalTitle");
const closeLyricsBtn = document.getElementById("closeLyricsBtn");

const albumModal = document.getElementById("albumModal");
const albumModalBackdrop = document.getElementById("albumModalBackdrop");
const albumModalTitle = document.getElementById("albumModalTitle");
const albumModalCover = document.getElementById("albumModalCover");
const albumModalArtist = document.getElementById("albumModalArtist");
const albumModalInfo = document.getElementById("albumModalInfo");
const albumModalTracks = document.getElementById("albumModalTracks");
const albumModalPlayBtn = document.getElementById("albumModalPlayBtn");
const albumModalShuffleBtn = document.getElementById("albumModalShuffleBtn");
const albumModalDownloadBtn = document.getElementById("albumModalDownloadBtn");
const closeAlbumBtn = document.getElementById("closeAlbumBtn");

const resumeBanner = document.getElementById("resumeBanner");
const resumeText = document.getElementById("resumeText");
const resumeSongBtn = document.getElementById("resumeSongBtn");
const dismissResumeBtn = document.getElementById("dismissResumeBtn");

const STORAGE_KEYS = {
  favorites: "musicSiteFavorites",
  recent: "musicSiteRecent",
  lastSong: "musicSiteLastSong",
  lastPosition: "musicSiteLastPosition",
  resumeDismissed: "musicSiteResumeDismissed"
};

function safeBind(element, eventName, handler) {
  if (element) {
    element.addEventListener(eventName, handler);
  }
}

function formatTime(seconds) {
  if (!isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatLyricsHtml(text) {
  const escaped = escapeHtml(text);
  return escaped
    .replace(
      /^(verse\s*\d*|chorus|bridge|pre-chorus|hook|outro|intro)$/gim,
      '<span class="lyrics-line-label">$1</span>'
    )
    .replace(/\n/g, "<br>");
}

function sanitizeFileName(name) {
  return String(name || "song")
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getAlbums() {
  const albumMap = new Map();

  allTracks.forEach((track) => {
    const albumName = track.album || "Unknown Album";
    if (!albumMap.has(albumName)) {
      albumMap.set(albumName, {
        name: albumName,
        artist: track.artist || "Unknown Artist",
        cover: track.cover || "",
        year: track.year || "",
        scripture: track.scripture || "",
        tracks: []
      });
    }
    albumMap.get(albumName).tracks.push(track);
  });

  return [...albumMap.values()];
}

function getAlbumByName(name) {
  return getAlbums().find((album) => album.name === name) || null;
}

function updateSongUrl(track) {
  if (!track || !track.slug) return;
  const url = new URL(window.location.href);
  url.searchParams.set("song", track.slug);
  window.history.replaceState({}, "", url);
}

function getSongSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("song");
}

function getStoredArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function setStoredArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getFavorites() {
  return getStoredArray(STORAGE_KEYS.favorites);
}

function setFavorites(favorites) {
  setStoredArray(STORAGE_KEYS.favorites, favorites);
}

function getRecentSongs() {
  return getStoredArray(STORAGE_KEYS.recent);
}

function setRecentSongs(recent) {
  setStoredArray(STORAGE_KEYS.recent, recent);
}

function saveLastSong(track) {
  if (!track?.slug) return;
  localStorage.setItem(STORAGE_KEYS.lastSong, track.slug);
}

function getLastSongSlug() {
  return localStorage.getItem(STORAGE_KEYS.lastSong);
}

function saveLastPosition() {
  if (!currentTrack?.slug) return;
  localStorage.setItem(
    STORAGE_KEYS.lastPosition,
    JSON.stringify({
      slug: currentTrack.slug,
      time: audioPlayer.currentTime || 0
    })
  );
}

function getLastPosition() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.lastPosition));
  } catch {
    return null;
  }
}

function isFavorite(slug) {
  return getFavorites().includes(slug);
}

function toggleFavorite(track) {
  if (!track?.slug) return;

  let favorites = getFavorites();

  if (favorites.includes(track.slug)) {
    favorites = favorites.filter((slug) => slug !== track.slug);
  } else {
    favorites.unshift(track.slug);
  }

  setFavorites(favorites);
  updateFavoriteButton();
  renderFavorites();
}

function updateFavoriteButton() {
  if (!favoriteSongBtn) return;

  if (currentTrack?.slug && isFavorite(currentTrack.slug)) {
    favoriteSongBtn.textContent = "★ Favorited";
  } else {
    favoriteSongBtn.textContent = "☆ Favorite";
  }
}

function addToRecentlyPlayed(track) {
  if (!track?.slug) return;

  let recent = getRecentSongs().filter((slug) => slug !== track.slug);
  recent.unshift(track.slug);
  recent = recent.slice(0, 12);
  setRecentSongs(recent);
  renderRecentlyPlayed();
}

function renderMiniCards(container, tracks, emptyText) {
  if (!container) return;

  if (!tracks.length) {
    container.innerHTML = `<p class="empty-message">${emptyText}</p>`;
    return;
  }

  container.innerHTML = "";

  tracks.forEach((track) => {
    const card = document.createElement("div");
    card.className = "mini-card";

    card.innerHTML = `
      <img src="${track.cover || ""}" alt="${escapeHtml(track.title || "Cover art")}">
      <h3>${escapeHtml(track.title || "Unknown Title")}</h3>
      <p>${escapeHtml(track.artist || "Unknown Artist")}</p>
      <p>${escapeHtml(track.album || "")}</p>
    `;

    card.addEventListener("click", () => {
      const foundIndex = allTracks.findIndex((t) => t.slug === track.slug);
      if (foundIndex !== -1) {
        currentQueue = [...allTracks];
        currentIndex = foundIndex;
        renderQueue();
        loadTrack(foundIndex, true);
      }
    });

    container.appendChild(card);
  });
}

function renderFavorites() {
  const favoriteSlugs = getFavorites();
  const favoriteTracks = favoriteSlugs
    .map((slug) => allTracks.find((track) => track.slug === slug))
    .filter(Boolean);

  renderMiniCards(favoritesList, favoriteTracks, "No favorite songs yet.");
}

function renderRecentlyPlayed() {
  const recentSlugs = getRecentSongs();
  const recentTracks = recentSlugs
    .map((slug) => allTracks.find((track) => track.slug === slug))
    .filter(Boolean);

  renderMiniCards(recentlyPlayedList, recentTracks, "No recently played songs yet.");
}

function clearNowPlaying(messageTitle = "Select a song", messageArtist = "—") {
  currentTrack = null;
  if (nowCover) {
    nowCover.src = "";
    nowCover.alt = "Album cover";
  }
  if (nowTitle) nowTitle.textContent = messageTitle;
  if (nowArtist) nowArtist.textContent = messageArtist;
  if (nowAlbum) nowAlbum.textContent = "—";
  if (nowScripture) nowScripture.textContent = "—";
  renderLyrics(null);
  renderScripture(null);
  updateFavoriteButton();
}

function setNowPlaying(track) {
  currentTrack = track;
  nowCover.src = track.cover || "";
  nowCover.alt = track.title ? `${track.title} cover art` : "Album cover";
  nowTitle.textContent = track.title || "Unknown Title";
  nowArtist.textContent = track.artist || "Unknown Artist";
  nowAlbum.textContent = track.album
    ? `${track.album}${track.year ? " • " + track.year : ""}`
    : "—";
  nowScripture.textContent = track.scripture
    ? `Scripture: ${track.scripture}`
    : "No scripture reference";

  renderLyrics(track);
  renderScripture(track);
  updateSongUrl(track);
  updateFavoriteButton();
  saveLastSong(track);
}

function renderLyrics(track) {
  if (!lyricsContent) return;

  if (track && track.lyrics && String(track.lyrics).trim()) {
    lyricsContent.innerHTML = `<p>${formatLyricsHtml(track.lyrics)}</p>`;
  } else {
    lyricsContent.innerHTML = `<p class="empty-message">No lyrics available for this song.</p>`;
  }
}

function renderScripture(track) {
  if (!scriptureContent) return;

  if (track && track.scripture && String(track.scripture).trim()) {
    scriptureContent.innerHTML = `<p>${escapeHtml(track.scripture)}</p>`;
  } else {
    scriptureContent.innerHTML = `<p class="empty-message">No scripture reference available for this song.</p>`;
  }
}

function openLyricsModal() {
  if (!lyricsModal) return;

  if (currentTrack && currentTrack.lyrics && String(currentTrack.lyrics).trim()) {
    lyricsModalTitle.textContent = currentTrack.title || "Lyrics";
    lyricsModalBody.innerHTML = `<p>${formatLyricsHtml(currentTrack.lyrics)}</p>`;
  } else {
    lyricsModalTitle.textContent = currentTrack?.title || "Lyrics";
    lyricsModalBody.innerHTML = `<p class="empty-message">No lyrics available for this song.</p>`;
  }

  lyricsModal.classList.remove("hidden");
}

function closeLyricsModal() {
  lyricsModal?.classList.add("hidden");
}

function openAlbumModal(album) {
  if (!album || !albumModal) return;

  albumModalTitle.textContent = album.name || "Album";
  albumModalCover.src = album.cover || "";
  albumModalCover.alt = album.name ? `${album.name} cover art` : "Album cover";
  albumModalArtist.textContent = album.artist || "Unknown Artist";
  albumModalInfo.textContent = `${album.tracks.length} song${
    album.tracks.length === 1 ? "" : "s"
  }${album.year ? " • " + album.year : ""}`;
  albumModal.dataset.albumName = album.name;

  albumModalTracks.innerHTML = "";

  album.tracks.forEach((track, index) => {
    const row = document.createElement("div");
    row.className = "album-modal-track";

row.innerHTML = `
  <div class="album-track-main">
    <div class="album-track-title-row">
      <strong>${index + 1}. ${escapeHtml(track.title || "Unknown Title")}</strong>
      <span class="album-track-duration">${formatTime(track.duration || 0)}</span>
    </div>

    <p class="album-track-artist">${escapeHtml(track.artist || "Unknown Artist")}</p>

    ${
      track.scripture
        ? `<p class="album-track-scripture">${escapeHtml(track.scripture)}</p>`
        : ""
    }
  </div>

  <div class="album-modal-actions">
    <button class="action-btn secondary-btn album-play-track" type="button">Play</button>
    <a class="action-btn secondary-btn" href="${track.audio}" download="${sanitizeFileName(track.title)}.mp3">Download</a>
  </div>
`;
    row.querySelector(".album-play-track").addEventListener("click", () => {
      currentAlbum = album.name;
      currentQueue = [...album.tracks];
      currentIndex = index;
      renderAlbums();
      renderQueue();
      loadTrack(index, true);
      closeAlbumModal();
    });

    albumModalTracks.appendChild(row);
  });

  albumModal.classList.remove("hidden");
}

function closeAlbumModal() {
  albumModal?.classList.add("hidden");
}

async function copyLyricsToClipboard() {
  if (!currentTrack || !currentTrack.lyrics || !copyLyricsBtn) return;

  try {
    await navigator.clipboard.writeText(currentTrack.lyrics);
    copyLyricsBtn.textContent = "Copied!";
    setTimeout(() => {
      copyLyricsBtn.textContent = "Copy Lyrics";
    }, 1500);
  } catch (error) {
    console.error("Copy failed:", error);
  }
}

async function copySongLink() {
  if (!currentTrack || !currentTrack.slug || !shareSongBtn) return;

  const url = new URL(window.location.href);
  url.searchParams.set("song", currentTrack.slug);

  try {
    await navigator.clipboard.writeText(url.toString());
    shareSongBtn.textContent = "Link Copied!";
    setTimeout(() => {
      shareSongBtn.textContent = "Copy Song Link";
    }, 1500);
  } catch (error) {
    console.error("Could not copy song link:", error);
  }
}

function downloadCurrentSong() {
  if (!currentTrack || !currentTrack.audio) return;

  const safeTitle = sanitizeFileName(currentTrack.title);
  const link = document.createElement("a");
  link.href = currentTrack.audio;
  link.download = `${safeTitle}.mp3`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadAlbum(album) {
  if (!album?.tracks?.length) return;

  album.tracks.forEach((track, index) => {
    setTimeout(() => {
      const link = document.createElement("a");
      link.href = track.audio;
      link.download = `${sanitizeFileName(track.title)}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, index * 500);
  });
}

function loadTrack(index, shouldPlay = false) {
  if (!currentQueue.length || index < 0 || index >= currentQueue.length) return;

  currentIndex = index;
  const track = currentQueue[index];
  if (!track || !track.audio) return;

  audioPlayer.src = track.audio;
  audioPlayer.load();
  setNowPlaying(track);
  renderQueue();
  updatePlayButton();

  if (shouldPlay) {
    audioPlayer.play().catch((error) => {
      console.warn("Playback could not start:", error);
    });
  }
}

function playCurrent() {
  if (!currentQueue.length) return;
  if (currentIndex === -1) {
    loadTrack(0, true);
    return;
  }
  audioPlayer.play().catch((error) => {
    console.warn("Playback could not start:", error);
  });
}

function pauseCurrent() {
  audioPlayer.pause();
}

function updatePlayButton() {
  if (!playBtn) return;
  playBtn.textContent = audioPlayer.paused ? "▶" : "⏸";
}

function nextTrack() {
  if (!currentQueue.length) return;
  const nextIndex = (currentIndex + 1) % currentQueue.length;
  loadTrack(nextIndex, true);
}

function prevTrack() {
  if (!currentQueue.length) return;

  if (audioPlayer.currentTime > 3) {
    audioPlayer.currentTime = 0;
    return;
  }

  const prevIndex = (currentIndex - 1 + currentQueue.length) % currentQueue.length;
  loadTrack(prevIndex, true);
}

function renderQueue() {
  if (!queueList || !queueCount) return;

  queueList.innerHTML = "";

  if (!currentQueue.length) {
    queueList.innerHTML = '<p class="empty-message">No songs found.</p>';
    queueCount.textContent = "0 songs";
    return;
  }

  queueCount.textContent = `${currentQueue.length} song${currentQueue.length === 1 ? "" : "s"}`;

  currentQueue.forEach((track, index) => {
    const item = document.createElement("div");
    item.className = "queue-item" + (index === currentIndex ? " active" : "");

    const tags =
      Array.isArray(track.tags) && track.tags.length ? track.tags.join(" • ") : "";
    const safeTitle = sanitizeFileName(track.title);

  item.innerHTML = `
  <img class="queue-cover" src="${track.cover || ""}" alt="${escapeHtml(track.title || "Cover art")}">

  <div class="queue-main">
    <div class="queue-title-row">
      <h3>${escapeHtml(track.title || "Unknown Title")}</h3>
      <span class="queue-duration">${formatTime(track.duration || 0)}</span>
    </div>

    <p class="queue-artist">${escapeHtml(track.artist || "Unknown Artist")}</p>

    <div class="queue-meta-row">
      ${track.album ? `<span>${escapeHtml(track.album)}</span>` : ""}
      ${track.scripture ? `<span>${escapeHtml(track.scripture)}</span>` : ""}
    </div>

    ${tags ? `<div class="queue-tags">${escapeHtml(tags)}</div>` : ""}
  </div>

  <div class="queue-actions">
    <button class="queue-play-btn action-btn secondary-btn" type="button">Play</button>
    <a href="${track.audio || "#"}" download="${safeTitle}.mp3" class="queue-download-link action-btn secondary-btn">Download</a>
  </div>
`;

const playRowBtn = item.querySelector(".queue-play-btn");

playRowBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  loadTrack(index, true);
});

    item.addEventListener("click", (event) => {
      if (event.target.closest(".queue-download")) return;
      loadTrack(index, true);
    });

    queueList.appendChild(item);
  });
}

function renderPlaylists(activeName = "All Songs") {
  if (!playlistList) return;

  playlistList.innerHTML = "";

  const playlistNames = [
    ...new Set(allTracks.map((track) => track.playlist).filter(Boolean))
  ];

  const allButton = document.createElement("button");
  allButton.className = "playlist-btn" + (activeName === "All Songs" ? " active" : "");
  allButton.textContent = "All Songs";
  allButton.addEventListener("click", () => {
    currentAlbum = null;
    currentTag = null;
    currentQueue = [...allTracks];
    currentIndex = currentQueue.length ? 0 : -1;
    renderPlaylists("All Songs");
    renderTags();
    renderAlbums();
    renderQueue();
    if (currentQueue.length) loadTrack(0, false);
    else clearNowPlaying();
  });
  playlistList.appendChild(allButton);

  playlistNames.forEach((name) => {
    const button = document.createElement("button");
    button.className = "playlist-btn" + (activeName === name ? " active" : "");
    button.textContent = name;
    button.addEventListener("click", () => {
      currentAlbum = null;
      currentTag = null;
      currentQueue = allTracks.filter((track) => track.playlist === name);
      currentIndex = currentQueue.length ? 0 : -1;
      renderPlaylists(name);
      renderTags();
      renderAlbums();
      renderQueue();
      if (currentQueue.length) loadTrack(0, false);
      else clearNowPlaying();
    });
    playlistList.appendChild(button);
  });
}

function renderTags() {
  if (!tagList) return;

  tagList.innerHTML = "";

  const allTags = [
    ...new Set(
      allTracks.flatMap((track) => (Array.isArray(track.tags) ? track.tags : []))
    )
  ]
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 40);

  const allChip = document.createElement("button");
  allChip.className = "tag-chip" + (currentTag === null ? " active" : "");
  allChip.textContent = "All";
  allChip.addEventListener("click", () => {
    currentTag = null;
    currentAlbum = null;
    currentQueue = [...allTracks];
    currentIndex = currentQueue.length ? 0 : -1;
    renderTags();
    renderQueue();
    if (currentQueue.length) loadTrack(0, false);
    else clearNowPlaying();
  });
  tagList.appendChild(allChip);

  allTags.forEach((tag) => {
    const chip = document.createElement("button");
    chip.className = "tag-chip" + (currentTag === tag ? " active" : "");
    chip.textContent = tag;
    chip.addEventListener("click", () => {
      currentTag = tag;
      currentAlbum = null;
      currentQueue = allTracks.filter(
        (track) => Array.isArray(track.tags) && track.tags.includes(tag)
      );
      currentIndex = currentQueue.length ? 0 : -1;
      renderTags();
      renderQueue();
      if (currentQueue.length) loadTrack(0, false);
      else clearNowPlaying("No songs found", "Try another tag");
    });
    tagList.appendChild(chip);
  });
}

function renderAlbums() {
  if (!albumGrid) return;

  albumGrid.innerHTML = "";
  const albums = getAlbums();

  albums.forEach((album) => {
    const card = document.createElement("div");
    card.className = "album-card" + (currentAlbum === album.name ? " active" : "");
    card.innerHTML = `
      <img class="album-cover" src="${album.cover || ""}" alt="${escapeHtml(album.name || "Album cover")}">
      <h3>${escapeHtml(album.name)}</h3>
      <p>${escapeHtml(album.artist)}</p>
      <p>${album.tracks.length} song${album.tracks.length === 1 ? "" : "s"}</p>
    `;

    card.addEventListener("click", () => {
      currentAlbum = album.name;
      currentTag = null;
      currentQueue = [...album.tracks];
      currentIndex = currentQueue.length ? 0 : -1;
      renderAlbums();
      renderTags();
      renderQueue();
      if (currentQueue.length) loadTrack(0, false);
      setFeaturedAlbum(album);
    });

    card.addEventListener("dblclick", () => {
      openAlbumModal(album);
    });

    albumGrid.appendChild(card);
  });
}

function setFeaturedAlbum(album) {
  if (!album) return;

  if (featuredAlbumCover) {
    featuredAlbumCover.src = album.cover || "";
    featuredAlbumCover.alt = album.name ? `${album.name} cover art` : "Featured album cover";
  }
  if (featuredAlbumTitle) {
    featuredAlbumTitle.textContent = album.name || "Unknown Album";
  }
  if (featuredAlbumArtist) {
    featuredAlbumArtist.textContent = album.artist || "Unknown Artist";
  }
  if (featuredAlbumCount) {
    featuredAlbumCount.textContent = `${album.tracks.length} song${
      album.tracks.length === 1 ? "" : "s"
    }${album.year ? " • " + album.year : ""}`;
  }
}

function applySearch() {
  if (!searchInput) return;

  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    currentAlbum = null;
    currentTag = null;
    currentQueue = [...allTracks];
    currentIndex = currentQueue.length ? 0 : -1;
    renderPlaylists("All Songs");
    renderTags();
    renderAlbums();
    renderQueue();

    if (currentQueue.length) {
      loadTrack(0, false);
    } else {
      clearNowPlaying();
    }
    return;
  }

  currentQueue = allTracks.filter((track) => {
    const searchHaystack = [
      track.title || "",
      track.artist || "",
      track.album || "",
      track.playlist || "",
      track.scripture || "",
      Array.isArray(track.tags) ? track.tags.join(" ") : "",
      track.lyrics || ""
    ]
      .join(" ")
      .toLowerCase();

    return searchHaystack.includes(query);
  });

  currentAlbum = null;
  currentTag = null;
  currentIndex = currentQueue.length ? 0 : -1;
  renderPlaylists("");
  renderTags();
  renderAlbums();
  renderQueue();

  if (currentQueue.length) {
    loadTrack(0, false);
  } else {
    clearNowPlaying("No songs found", "Try a different search");
  }
}

function restoreLastPlayedTrack() {
  const urlSlug = getSongSlugFromUrl();
  const lastSongSlug = getLastSongSlug();
  const targetSlug = urlSlug || lastSongSlug;

  if (!targetSlug) return false;

  const foundIndex = allTracks.findIndex((track) => track.slug === targetSlug);
  if (foundIndex === -1) return false;

  currentQueue = [...allTracks];
  currentIndex = foundIndex;
  renderQueue();
  loadTrack(foundIndex, false);

  const lastPosition = getLastPosition();
  if (lastPosition && lastPosition.slug === targetSlug) {
    audioPlayer.addEventListener("loadedmetadata", function restoreOnce() {
      if (lastPosition.time && lastPosition.time < audioPlayer.duration) {
        audioPlayer.currentTime = lastPosition.time;
      }
      audioPlayer.removeEventListener("loadedmetadata", restoreOnce);
    });
  }

  return true;
}

function showResumeBannerIfNeeded() {
  if (!resumeBanner || !resumeText) return;

  const dismissed = localStorage.getItem(STORAGE_KEYS.resumeDismissed) === "true";
  const lastPosition = getLastPosition();
  const lastSongSlug = getLastSongSlug();

  if (
    dismissed ||
    !lastPosition ||
    !lastSongSlug ||
    !lastPosition.time ||
    lastPosition.time < 5
  ) {
    resumeBanner.classList.add("hidden");
    return;
  }

  const track = allTracks.find((t) => t.slug === lastSongSlug);
  if (!track) {
    resumeBanner.classList.add("hidden");
    return;
  }

  resumeText.textContent = `Resume "${track.title}" at ${formatTime(lastPosition.time)}.`;
  resumeBanner.classList.remove("hidden");
}

function dismissResumeBanner() {
  localStorage.setItem(STORAGE_KEYS.resumeDismissed, "true");
  resumeBanner?.classList.add("hidden");
}

function resumeLastSong() {
  localStorage.removeItem(STORAGE_KEYS.resumeDismissed);
  const restored = restoreLastPlayedTrack();
  if (restored) {
    playCurrent();
    resumeBanner?.classList.add("hidden");
  }
}

/* Controls */
safeBind(playBtn, "click", () => {
  if (audioPlayer.paused) playCurrent();
  else pauseCurrent();
});

safeBind(prevBtn, "click", prevTrack);
safeBind(nextBtn, "click", nextTrack);

safeBind(playQueueBtn, "click", () => {
  if (currentQueue.length) loadTrack(0, true);
});

safeBind(shuffleQueueBtn, "click", () => {
  if (!currentQueue.length) return;
  currentQueue = shuffleArray(currentQueue);
  currentIndex = 0;
  renderQueue();
  loadTrack(0, true);
});

safeBind(playAlbumBtn, "click", () => {
  const albums = getAlbums();
  const album = currentAlbum ? albums.find((a) => a.name === currentAlbum) : albums[0];
  if (!album) return;

  currentAlbum = album.name;
  currentTag = null;
  currentQueue = [...album.tracks];
  currentIndex = 0;
  renderAlbums();
  renderTags();
  renderQueue();
  loadTrack(0, true);
  setFeaturedAlbum(album);
});

safeBind(shuffleAlbumBtn, "click", () => {
  const albums = getAlbums();
  const album = currentAlbum ? albums.find((a) => a.name === currentAlbum) : albums[0];
  if (!album) return;

  currentAlbum = album.name;
  currentTag = null;
  currentQueue = shuffleArray(album.tracks);
  currentIndex = 0;
  renderAlbums();
  renderTags();
  renderQueue();
  loadTrack(0, true);
  setFeaturedAlbum(album);
});

safeBind(downloadAlbumBtn, "click", () => {
  const albums = getAlbums();
  const album = currentAlbum ? albums.find((a) => a.name === currentAlbum) : albums[0];
  if (album) downloadAlbum(album);
});

safeBind(openAlbumBtn, "click", () => {
  const albums = getAlbums();
  const album = currentAlbum ? albums.find((a) => a.name === currentAlbum) : albums[0];
  if (album) openAlbumModal(album);
});

safeBind(albumModalPlayBtn, "click", () => {
  const album = getAlbumByName(albumModal?.dataset.albumName);
  if (!album) return;
  currentAlbum = album.name;
  currentQueue = [...album.tracks];
  currentIndex = 0;
  renderAlbums();
  renderQueue();
  loadTrack(0, true);
  closeAlbumModal();
});

safeBind(albumModalShuffleBtn, "click", () => {
  const album = getAlbumByName(albumModal?.dataset.albumName);
  if (!album) return;
  currentAlbum = album.name;
  currentQueue = shuffleArray(album.tracks);
  currentIndex = 0;
  renderAlbums();
  renderQueue();
  loadTrack(0, true);
  closeAlbumModal();
});

safeBind(albumModalDownloadBtn, "click", () => {
  const album = getAlbumByName(albumModal?.dataset.albumName);
  if (album) downloadAlbum(album);
});

safeBind(openLyricsBtn, "click", openLyricsModal);
safeBind(copyLyricsBtn, "click", copyLyricsToClipboard);
safeBind(shareSongBtn, "click", copySongLink);
safeBind(favoriteSongBtn, "click", () => toggleFavorite(currentTrack));
safeBind(downloadSongBtn, "click", downloadCurrentSong);
safeBind(closeLyricsBtn, "click", closeLyricsModal);
safeBind(lyricsModalBackdrop, "click", closeLyricsModal);

safeBind(closeAlbumBtn, "click", closeAlbumModal);
safeBind(albumModalBackdrop, "click", closeAlbumModal);

safeBind(resumeSongBtn, "click", resumeLastSong);
safeBind(dismissResumeBtn, "click", dismissResumeBanner);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLyricsModal();
    closeAlbumModal();
  }
});

audioPlayer.addEventListener("play", () => {
  updatePlayButton();
  if (currentTrack) addToRecentlyPlayed(currentTrack);
  localStorage.removeItem(STORAGE_KEYS.resumeDismissed);
});

audioPlayer.addEventListener("pause", () => {
  updatePlayButton();
  saveLastPosition();
});

audioPlayer.addEventListener("ended", () => {
  saveLastPosition();
  nextTrack();
});

audioPlayer.addEventListener("loadedmetadata", () => {
  if (durationEl) durationEl.textContent = formatTime(audioPlayer.duration);
});

audioPlayer.addEventListener("timeupdate", () => {
  if (currentTimeEl) currentTimeEl.textContent = formatTime(audioPlayer.currentTime);

  if (audioPlayer.duration) {
    if (seekBar) seekBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  } else {
    if (seekBar) seekBar.value = 0;
  }
});

window.addEventListener("beforeunload", saveLastPosition);

safeBind(seekBar, "input", () => {
  if (audioPlayer.duration) {
    audioPlayer.currentTime = (seekBar.value / 100) * audioPlayer.duration;
  }
});

safeBind(searchInput, "input", applySearch);

/* Fallback for missing cover images */
[nowCover, featuredAlbumCover, albumModalCover].forEach((img) => {
  if (!img) return;
  img.addEventListener("error", () => {
    img.src = "";
  });
});

fetch("tracks.json")
  .then((response) => response.json())
  .then((data) => {
    allTracks = Array.isArray(data) ? data : [];
    currentQueue = [...allTracks];
    currentIndex = currentQueue.length ? 0 : -1;

    renderPlaylists();
    renderTags();
    renderAlbums();
    renderQueue();
    renderFavorites();
    renderRecentlyPlayed();

    const albums = getAlbums();
    if (albums.length) {
      setFeaturedAlbum(albums[0]);
    }

    const restored = restoreLastPlayedTrack();

    if (!restored) {
      if (currentQueue.length) {
        loadTrack(0, false);
      } else {
        clearNowPlaying();
      }
    }

    showResumeBannerIfNeeded();
  })
  .catch((error) => {
    console.error("Could not load tracks.json:", error);
    if (queueList) {
      queueList.innerHTML = '<p class="empty-message">Could not load music library.</p>';
    }
    if (lyricsContent) {
      lyricsContent.innerHTML = '<p class="empty-message">Could not load lyrics.</p>';
    }
    if (scriptureContent) {
      scriptureContent.innerHTML = '<p class="empty-message">Could not load scripture.</p>';
    }
  });