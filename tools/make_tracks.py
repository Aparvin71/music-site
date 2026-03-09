import json
import re
from pathlib import Path
from urllib.parse import quote

# =========================
# SETTINGS - EDIT THESE
# =========================

AUDIO_BASE_URL = "https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/audio"
COVER_BASE_URL = "https://https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/covers"

DEFAULT_ARTIST = "Allen Parvin"
DEFAULT_ALBUM = "Inspired Songs"
DEFAULT_YEAR = 2026
DEFAULT_PLAYLIST = "Inspired"
DEFAULT_TAGS = ["worship", "christian", "scripture", "inspired"]

# =========================
# PROJECT PATHS
# =========================

SITE_DIR = Path(__file__).resolve().parents[1]
AUDIO_DIR = SITE_DIR / "audio"
OUTPUT_FILE = SITE_DIR / "tracks.json"

AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg", ".flac"]

# =========================
# HELPERS
# =========================

def clean_title(filename):
    title = Path(filename).stem
    title = re.sub(r"^\d+[-_.\s]*", "", title)
    title = re.sub(r"\s+", " ", title)
    return title.strip()

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"^\d+[-_.\s]*", "", text)
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")

def build_audio_url(file_name):
    return f"{AUDIO_BASE_URL.rstrip('/')}/{quote(file_name)}"

def build_cover_url(slug):
    return f"{COVER_BASE_URL.rstrip('/')}/{slug}.jpg"

# =========================
# MAIN
# =========================

def main():
    if not AUDIO_DIR.exists():
        raise SystemExit(f"Missing audio folder: {AUDIO_DIR}")

    tracks = []

    for file in sorted(AUDIO_DIR.iterdir(), key=lambda f: f.name.lower()):
        if file.is_file() and file.suffix.lower() in AUDIO_EXTENSIONS:
            cleaned_title = clean_title(file.name)
            slug = slugify(cleaned_title)

            track = {
                "title": cleaned_title,
                "artist": DEFAULT_ARTIST,
                "album": DEFAULT_ALBUM,
                "year": DEFAULT_YEAR,
                "cover": build_cover_url(slug),
                "audio": build_audio_url(file.name),
                "playlist": DEFAULT_PLAYLIST,
                "tags": DEFAULT_TAGS
            }

            tracks.append(track)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(tracks, f, indent=2, ensure_ascii=False)

    print(f"tracks.json created successfully with {len(tracks)} tracks.")

if __name__ == "__main__":
    main()