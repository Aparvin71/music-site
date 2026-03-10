
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


DEFAULT_ARTIST = "Allen Parvin"
DEFAULT_ALBUM = "Singles"
DEFAULT_YEAR = 2026
DEFAULT_PLAYLIST = "Uncategorized"

# common words to ignore when auto-building tags
STOPWORDS = {
    "the", "and", "a", "an", "of", "to", "in", "on", "for", "with",
    "my", "me", "your", "you", "i", "we", "our", "is", "are"
}

# =========================
# PROJECT PATHS
# =========================

SITE_DIR = Path(__file__).resolve().parents[1]
AUDIO_DIR = SITE_DIR / "audio"
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

def title_case_if_all_caps(text):
    if text and text.isupper():
        return text.title()
    return text

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

        title = title_case_if_all_caps(title)
        artist = title_case_if_all_caps(artist)
        album = title_case_if_all_caps(album)

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
    try:
        tags = ID3(mp3_path)

        if "USLT::eng" in tags:
            text = str(tags["USLT::eng"].text).strip()
            if text:
                return text

        for key in tags.keys():
            if key.startswith("USLT"):
                text = str(tags[key].text).strip()
                if text:
                    return text

    except Exception:
        pass

    return None

def words_for_tags(text):
    words = re.findall(r"[a-z0-9]+", text.lower())
    return [w for w in words if w not in STOPWORDS and len(w) > 2]

def build_tags(title, album, artist):
    tag_set = set()

    for word in words_for_tags(title):
        tag_set.add(word)

    for word in words_for_tags(album):
        tag_set.add(word)

    for word in words_for_tags(artist):
        tag_set.add(word)

    # useful baseline tags for your type of site
    tag_set.add("christian")

    return sorted(tag_set)

def choose_playlist(album):
    album = (album or "").strip()
    return album if album else DEFAULT_PLAYLIST

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

        mp3_meta = get_mp3_metadata(file)

        title = mp3_meta.get("title") or fallback_title
        artist = mp3_meta.get("artist") or DEFAULT_ARTIST
        album = mp3_meta.get("album") or DEFAULT_ALBUM
        year = mp3_meta.get("year") or DEFAULT_YEAR
        track_number = mp3_meta.get("track_number")
        duration = mp3_meta.get("duration", 0)

        slug = slugify(title)
        lyrics = get_embedded_lyrics(file)
        playlist = choose_playlist(album)
        tags = build_tags(title, album, artist)

        track = {
            "title": title,
            "slug": slug,
            "artist": artist,
            "album": album,
            "year": year,
            "audio": build_audio_url(file.name),
            "cover": build_cover_url(slug),
            "playlist": playlist,
            "tags": tags,
            "duration": duration
        }

        if track_number is not None:
            track["track_number"] = track_number

        if lyrics:
            track["lyrics"] = lyrics

        tracks.append(track)

        print(f"Processed: {file.name}")
        print(f"  Title: {track['title']}")
        print(f"  Slug: {track['slug']}")
        print(f"  Artist: {track['artist']}")
        print(f"  Album: {track['album']}")
        print(f"  Playlist: {track['playlist']}")
        print(f"  Tags: {', '.join(track['tags'])}")
        print(f"  Duration: {track['duration']} sec")
        print(f"  Lyrics found: {'yes' if lyrics else 'no'}")

    tracks.sort(key=lambda t: (
        t.get("album", "").lower(),
        t.get("track_number", 9999),
        t.get("title", "").lower()
    ))

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(tracks, f, indent=2, ensure_ascii=False)

    print(f"\ntracks.json created successfully with {len(tracks)} tracks.")
    print(f"Wrote file to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()