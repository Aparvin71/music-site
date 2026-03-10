
import json
import re
from pathlib import Path
from urllib.parse import quote

from mutagen.mp3 import MP3
from mutagen.id3 import ID3

# =========================
# SETTINGS - EDIT THESE
# =========================

AUDIO_BASE_URL = "https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/audio"
COVER_BASE_URL = "https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/covers"
DEFAULT_ARTIST = "James Parvin"
DEFAULT_ALBUM = "Singles"
DEFAULT_YEAR = 2026
DEFAULT_PLAYLIST = "Uncategorized"
DEFAULT_TAGS = ["christian"]

# =========================
# PROJECT PATHS
# =========================

SITE_DIR = Path(__file__).resolve().parents[1]
AUDIO_DIR = SITE_DIR / "audio"
METADATA_FILE = SITE_DIR / "track_metadata.json"
OUTPUT_FILE = SITE_DIR / "tracks.json"

AUDIO_EXTENSIONS = [".mp3"]


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
        print(f"No track_metadata.json found at: {METADATA_FILE}")
        return {}

    try:
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            print(f"Loaded metadata entries: {len(data)}")
            return data
    except json.JSONDecodeError as e:
        raise SystemExit(f"JSON error in track_metadata.json: {e}")
    except Exception as e:
        raise SystemExit(f"Error reading track_metadata.json: {e}")

def safe_tag_text(tag_value):
    if not tag_value:
        return ""
    return str(tag_value).strip()

def parse_year(tag_value):
    text = safe_tag_text(tag_value)
    match = re.search(r"\d{4}", text)
    if match:
        return int(match.group())
    return DEFAULT_YEAR

def parse_track_number(tag_value):
    text = safe_tag_text(tag_value)
    match = re.match(r"(\d+)", text)
    if match:
        return int(match.group(1))
    return None

def get_mp3_metadata(mp3_path):
    try:
        audio = MP3(mp3_path)
        tags = audio.tags

        title = ""
        artist = ""
        album = ""
        year = DEFAULT_YEAR
        track_number = None
        duration = int(audio.info.length) if audio.info and audio.info.length else 0

        if tags:
            if "TIT2" in tags:
                title = safe_tag_text(tags["TIT2"])
            if "TPE1" in tags:
                artist = safe_tag_text(tags["TPE1"])
            if "TALB" in tags:
                album = safe_tag_text(tags["TALB"])
            if "TDRC" in tags:
                year = parse_year(tags["TDRC"])
            elif "TYER" in tags:
                year = parse_year(tags["TYER"])
            if "TRCK" in tags:
                track_number = parse_track_number(tags["TRCK"])

        return {
            "title": title,
            "artist": artist,
            "album": album,
            "year": year,
            "track_number": track_number,
            "duration": duration
        }

    except Exception as e:
        print(f"Error reading MP3 metadata from {mp3_path.name}: {e}")
        return {
            "title": "",
            "artist": "",
            "album": "",
            "year": DEFAULT_YEAR,
            "track_number": None,
            "duration": 0
        }

def get_embedded_lyrics(mp3_path):
    """
    Extract embedded lyrics from ID3 USLT tags.
    """
    try:
        tags = ID3(mp3_path)

        # Common English key
        if "USLT::eng" in tags:
            text = str(tags["USLT::eng"].text).strip()
            if text:
                return text

        # Fallback: first USLT key found
        for key in tags.keys():
            if key.startswith("USLT"):
                text = str(tags[key].text).strip()
                if text:
                    return text

    except Exception as e:
        print(f"No embedded lyrics found in {mp3_path.name}: {e}")

    return None

# =========================
# MAIN
# =========================

def main():
    print("=== DEBUG INFO ===")
    print(f"SITE_DIR: {SITE_DIR}")
    print(f"AUDIO_DIR: {AUDIO_DIR}")
    print(f"OUTPUT_FILE: {OUTPUT_FILE}")
    print("==================")

    if not AUDIO_DIR.exists():
        raise SystemExit(f"Missing audio folder: {AUDIO_DIR}")

    metadata_overrides = load_metadata()
    tracks = []

    audio_files = [
        f for f in AUDIO_DIR.iterdir()
        if f.is_file() and f.suffix.lower() in AUDIO_EXTENSIONS
    ]

    print(f"Found audio files: {len(audio_files)}")
    for f in audio_files:
        print(f" - {f.name}")

    for file in sorted(audio_files, key=lambda f: f.name.lower()):
        fallback_title = clean_title(file.name)
        base_slug = slugify(fallback_title)

        mp3_meta = get_mp3_metadata(file)

        title = mp3_meta.get("title") or fallback_title
        slug = slugify(title)

        override = (
            metadata_overrides.get(slug)
            or metadata_overrides.get(base_slug)
            or metadata_overrides.get(Path(file.name).stem)
            or metadata_overrides.get(fallback_title)
            or {}
        )

        embedded_lyrics = get_embedded_lyrics(file)
        lyrics = override.get("lyrics") or embedded_lyrics

        track = {
            "title": override.get("title", title),
            "slug": override.get("slug", slug),
            "artist": override.get("artist", mp3_meta.get("artist") or DEFAULT_ARTIST),
            "album": override.get("album", mp3_meta.get("album") or DEFAULT_ALBUM),
            "year": override.get("year", mp3_meta.get("year") or DEFAULT_YEAR),
            "audio": build_audio_url(file.name),
            "cover": override.get("cover", build_cover_url(slug)),
            "playlist": override.get("playlist", DEFAULT_PLAYLIST),
            "tags": override.get("tags", DEFAULT_TAGS),
            "duration": override.get("duration", mp3_meta.get("duration", 0))
        }

        if mp3_meta.get("track_number") is not None:
            track["track_number"] = override.get("track_number", mp3_meta["track_number"])

        if lyrics:
            track["lyrics"] = lyrics

        tracks.append(track)

        print(f"Processed: {file.name}")
        print(f"  Title: {track['title']}")
        print(f"  Artist: {track['artist']}")
        print(f"  Album: {track['album']}")
        print(f"  Year: {track['year']}")
        print(f"  Duration: {track['duration']} sec")
        print(f"  Lyrics found: {'yes' if lyrics else 'no'}")

    tracks.sort(key=lambda t: (
        t.get("album", ""),
        t.get("track_number", 9999),
        t.get("title", "")
    ))

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(tracks, f, indent=2, ensure_ascii=False)

    print(f"\ntracks.json created successfully with {len(tracks)} tracks.")
    print(f"Wrote file to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()