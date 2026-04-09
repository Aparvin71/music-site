// Aineo Lyrics Engine v42.3.66 (No Highlight + Center Fade Polish)

let lyrics = [];
let currentIndex = -1;

export function loadLyrics(parsedLyrics) {
  lyrics = parsedLyrics || [];
  currentIndex = -1;
}

export function updateLyrics(currentTime) {
  if (!lyrics.length) return;

  let newIndex = lyrics.findIndex((line, i) => {
    const next = lyrics[i + 1];
    return currentTime >= line.time && (!next || currentTime < next.time);
  });

  if (newIndex !== -1 && newIndex !== currentIndex) {
    currentIndex = newIndex;
    renderLyrics();
  }
}

function renderLyrics() {
  const container = document.getElementById("lyrics-container");
  if (!container) return;

  container.classList.add("lyrics-center-fade");
  container.innerHTML = "";

  lyrics.forEach((line, index) => {
    const lineEl = document.createElement("div");
    lineEl.className = "lyric-line";
    lineEl.textContent = line.text;
    container.appendChild(lineEl);

    if (index === currentIndex) {
      lineEl.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  });
}
