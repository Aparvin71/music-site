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
DEFAULT_PLAYLIST = "Uncategorized"
DEFAULT_TAGS = ["inspired"]

# =========================
# PROJECT PATHS
# =========================

SITE_DIR = Path(__file__).resolve().parents[1]
AUDIO_DIR = SITE_DIR / "audio"
METADATA_FILE = SITE_DIR / "track_metadata.json"
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

def load_metadata():
    if not METADATA_FILE.exists():
        print(f"Metadata file not found: {METADATA_FILE}")
        return {}

    try:
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            print(f"Loaded metadata for {len(data)} entries.")
            return data
    except json.JSONDecodeError as e:
        raise SystemExit(f"JSON error in track_metadata.json: {e}")

# =========================
# MAIN
# =========================

def main():
    if not AUDIO_DIR.exists():
        raise SystemExit(f"Missing audio folder: {AUDIO_DIR}")

    metadata = load_metadata()
    tracks = []

    for file in sorted(AUDIO_DIR.iterdir(), key=lambda f: f.name.lower()):
        if not (file.is_file() and file.suffix.lower() in AUDIO_EXTENSIONS):
            continue

        fallback_title = clean_title(file.name)
        slug = slugify(fallback_title)

        # Try matching metadata by:
        # 1. slug (recommended)
        # 2. full stem without extension
        # 3. cleaned title
        song_meta = (
            metadata.get(slug)
            or metadata.get(Path(file.name).stem)
            or metadata.get(fallback_title)
            or {}
        )

        print(f"Processing: {file.name}")
        print(f"  Clean title: {fallback_title}")
        print(f"  Slug: {slug}")
        print(f"  Metadata found: {'yes' if song_meta else 'no'}")

        track = {
            "title": song_meta.get("title", fallback_title),
            "artist": song_meta.get("artist", DEFAULT_ARTIST),
            "album": song_meta.get("album", DEFAULT_ALBUM),
            "year": song_meta.get("year", DEFAULT_YEAR),
            "cover": song_meta.get("cover", build_cover_url(slug)),
            "audio": build_audio_url(file.name),
            "playlist": song_meta.get("playlist", DEFAULT_PLAYLIST),
            "tags": song_meta.get("tags", DEFAULT_TAGS)
        }

        tracks.append(track)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(tracks, f, indent=2, ensure_ascii=False)

    print(f"\ntracks.json created successfully with {len(tracks)} tracks.")
    print(f"Output file: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()