document.addEventListener("DOMContentLoaded", initAlbumsPage);

async function initAlbumsPage() {
  window.AineoShared?.initSecondaryPageNav?.();
  const grid = document.getElementById("albumsGrid");
  if (!grid) return;

  const escapeHtml = window.AineoShared?.escapeHtml || (value => String(value || ""));
  const escapeAttr = window.AineoShared?.escapeAttr || escapeHtml;
  const fetchJson = window.AineoShared?.fetchJson || (async (url, fallback = []) => {
    try {
      const response = await fetch(url, { cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      return fallback;
    }
  });

  let albums = await fetchJson("./albums.json", []);
  if (!Array.isArray(albums) || !albums.length) {
    const tracks = await fetchJson("./tracks.json", []);
    const byAlbum = new Map();
    (Array.isArray(tracks) ? tracks : []).forEach(track => {
      const name = String(track.album || "Singles").trim() || "Singles";
      if (!byAlbum.has(name)) {
        byAlbum.set(name, {
          title: name,
          slug: String(track.album_slug || "").trim(),
          year: track.year || "",
          artist: track.artist || "Allen Parvin",
          cover: track.cover || "",
          description: track.album_description || "",
          theme: track.album_theme || "",
          story: track.album_story || "",
          badges: Array.isArray(track.album_badges) ? track.album_badges : [],
          track_count: 0,
          album_zip: track.album_zip || ""
        });
      }
      const album = byAlbum.get(name);
      album.track_count += 1;
      if (!album.cover && track.cover) album.cover = track.cover;
      if (!album.year && track.year) album.year = track.year;
      if (!album.album_zip && track.album_zip) album.album_zip = track.album_zip;
    });
    albums = [...byAlbum.values()];
  }

  const normalizedAlbums = (Array.isArray(albums) ? albums : [])
    .map(album => ({
      title: String(album.title || album.name || "Untitled Album").trim(),
      slug: String(album.slug || "").trim(),
      artist: String(album.artist || "Allen Parvin").trim(),
      cover: String(album.cover || "").trim(),
      year: album.year || "",
      description: String(album.description || album.album_description || "").trim(),
      theme: String(album.theme || album.album_theme || "").trim(),
      story: String(album.story || album.album_story || "").trim(),
      badges: Array.isArray(album.badges) ? album.badges : [],
      track_count: Number(album.track_count || album.song_count || 0) || 0,
      album_zip: String(album.album_zip || "").trim()
    }))
    .filter(album => album.title)
    .sort((a, b) => a.title.localeCompare(b.title));

  if (!normalizedAlbums.length) {
    grid.innerHTML = `
      <article class="page-card">
        <p class="eyebrow">No albums yet</p>
        <h2>Your album shelf is empty.</h2>
        <p>Add tracks with album metadata to populate this page.</p>
      </article>
    `;
    return;
  }

  grid.innerHTML = normalizedAlbums.map(album => {
    const subtitle = [album.track_count ? `${album.track_count} song${album.track_count === 1 ? "" : "s"}` : "", album.year ? String(album.year) : ""]
      .filter(Boolean)
      .join(" • ");
    const meta = [album.artist, subtitle].filter(Boolean).join(" • ");
    const badges = album.badges.length
      ? `<div class="quick-link-pills">${album.badges.slice(0, 4).map(badge => `<span class="quick-link-pill quick-link-pill--static">${escapeHtml(badge)}</span>`).join("")}</div>`
      : "";
    const blurb = album.description || album.theme || album.story || "Open the album page for the full track list and story.";
    return `
      <a class="catalog-card" href="./album.html?album=${encodeURIComponent(album.title)}" aria-label="Open ${escapeAttr(album.title)} album page">
        <div class="catalog-card-cover">${album.cover ? `<img src="${escapeAttr(album.cover)}" alt="${escapeAttr(album.title)} cover" loading="lazy" decoding="async" />` : `<div class="catalog-card-cover-fallback">♪</div>`}</div>
        <div class="catalog-card-copy">
          <p class="eyebrow">Album</p>
          <h2>${escapeHtml(album.title)}</h2>
          ${meta ? `<p>${escapeHtml(meta)}</p>` : ""}
          <p>${escapeHtml(blurb)}</p>
          ${badges}
        </div>
      </a>
    `;
  }).join("");
}
