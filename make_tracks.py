import json
import re
from pathlib import Path
from urllib.parse import quote

from mutagen.id3 import ID3
from mutagen.mp3 import MP3

AUDIO_BASE_URL = "https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/audio"
COVER_BASE_URL = "https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/covers"
ALBUM_ZIP_BASE_URL = "https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/albums"

DEFAULT_ARTIST = "Allen Parvin"
DEFAULT_ALBUM = "Singles"
DEFAULT_YEAR = 2026
DEFAULT_PLAYLIST = "Music"
LRC_MANIFEST_NAME = "lrc-manifest.json"
TRACK_METADATA_NAME = "track-metadata.json"
DEFAULT_COLLECTION = "All Songs"

SCRIPT_PATH = Path(__file__).resolve()
SITE_DIR = SCRIPT_PATH.parent
if not (SITE_DIR / "audio").exists() and SCRIPT_PATH.parents:
    parent_candidate = SCRIPT_PATH.parents[1] if len(SCRIPT_PATH.parents) > 1 else SITE_DIR
    if (parent_candidate / "audio").exists():
        SITE_DIR = parent_candidate

AUDIO_DIR = SITE_DIR / "audio"
COVERS_DIR = SITE_DIR / "covers"
OUTPUT_FILE = SITE_DIR / "tracks.json"
LRC_MANIFEST_FILE = SITE_DIR / LRC_MANIFEST_NAME
TRACK_METADATA_FILE = SITE_DIR / TRACK_METADATA_NAME
LYRICS_DIR = SITE_DIR / "lyrics"

AUDIO_EXTENSIONS = [".mp3"]

SCRIPTURE_BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings",
    "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job",
    "Psalm", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah",
    "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai",
    "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
    "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians",
    "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy",
    "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John",
    "2 John", "3 John", "Jude", "Revelation"
]

# --------------------------------------------------
# OPTIONAL ALBUM METADATA
# Add album zip files and optional page metadata here.
#
# Example:
# "Grace Songs": {
#     "album_zip": "grace-songs.zip",
#     "playlists": ["Worship", "Favorites"],
#     "featured": True,
#     "description": "Album description",
#     "theme": "Main theme",
#     "story": "Background story",
#     "badges": ["New", "Worship"]
# }
# --------------------------------------------------
ALBUM_METADATA = {
    # "Grace Songs": {
    #     "album_zip": "grace-songs.zip",
    #     "playlists": ["Worship"],
    #     "featured": True,
    # },
}


def clean_title(filename: str) -> str:
    title = Path(filename).stem
    title = re.sub(r"\(\d+\)$", "", title).strip()
    title = re.sub(r"^\d+[-_.\s]*", "", title)
    title = re.sub(r"\s+", " ", title)
    return title.strip()


def slugify(text: str) -> str:
    text = (text or "").lower().strip()
    text = re.sub(r"^\d+[-_.\s]*", "", text)
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def build_audio_url(file_name: str) -> str:
    return f"{AUDIO_BASE_URL.rstrip('/')}/{quote(file_name)}"


def build_cover_url(file_name: str) -> str:
    return f"{COVER_BASE_URL.rstrip('/')}/{quote(file_name)}"


def build_album_zip_url(file_name: str) -> str:
    return f"{ALBUM_ZIP_BASE_URL.rstrip('/')}/{quote(file_name)}"


def safe_tag_text(tag_value) -> str:
    if not tag_value:
        return ""

    if hasattr(tag_value, "text"):
        text = tag_value.text
        if isinstance(text, list):
            return " ".join(str(x).strip() for x in text if str(x).strip())
        return str(text).strip()

    if isinstance(tag_value, list):
        return " ".join(str(x).strip() for x in tag_value if str(x).strip())

    return str(tag_value).strip()


def parse_year(tag_value) -> int:
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


def title_case_if_all_caps(text: str) -> str:
    if text and text.isupper():
        return text.title()
    return text


def format_duration(seconds: int) -> str:
    seconds = int(seconds or 0)
    mins = seconds // 60
    secs = seconds % 60
    return f"{mins}:{secs:02d}"


def parse_genre_tags(genre_text: str) -> list[str]:
    if not genre_text:
        return []

    parts = re.split(r"[,;/|]+", genre_text)
    cleaned = []
    seen = set()

    for part in parts:
        value = re.sub(r"\s+", " ", part).strip().lower()
        if not value:
            continue
        if value not in seen:
            seen.add(value)
            cleaned.append(value)

    return cleaned


def get_mp3_metadata(mp3_path: Path) -> dict:
    try:
        audio = MP3(mp3_path)
        tags = audio.tags

        title = ""
        artist = ""
        album = ""
        genre = ""
        year = DEFAULT_YEAR
        track_number = None
        duration_seconds = int(audio.info.length) if audio.info and audio.info.length else 0
        comment = ""

        if tags:
            if "TIT2" in tags:
                title = safe_tag_text(tags["TIT2"])
            if "TPE1" in tags:
                artist = safe_tag_text(tags["TPE1"])
            if "TALB" in tags:
                album = safe_tag_text(tags["TALB"])
            if "TCON" in tags:
                genre = safe_tag_text(tags["TCON"])
            if "TDRC" in tags:
                year = parse_year(tags["TDRC"])
            elif "TYER" in tags:
                year = parse_year(tags["TYER"])
            if "TRCK" in tags:
                track_number = parse_track_number(tags["TRCK"])

            if "COMM::eng" in tags:
                comment = safe_tag_text(tags["COMM::eng"])
            else:
                for key in tags.keys():
                    if key.startswith("COMM"):
                        comment = safe_tag_text(tags[key])
                        if comment:
                            break

        title = title_case_if_all_caps(title)
        artist = title_case_if_all_caps(artist)
        album = title_case_if_all_caps(album)
        genre = title_case_if_all_caps(genre)

        return {
            "title": title,
            "artist": artist,
            "album": album,
            "genre": genre,
            "year": year,
            "track_number": track_number,
            "duration_seconds": duration_seconds,
            "comment": comment,
        }

    except Exception as e:
        print(f"Error reading MP3 metadata from {mp3_path.name}: {e}")
        return {
            "title": "",
            "artist": "",
            "album": "",
            "genre": "",
            "year": DEFAULT_YEAR,
            "track_number": None,
            "duration_seconds": 0,
            "comment": "",
        }


def get_embedded_lyrics(mp3_path: Path):
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


def extract_cover_art(mp3_path: Path, slug: str):
    try:
        tags = ID3(mp3_path)
        apic_frames = tags.getall("APIC")
        if not apic_frames:
            return None

        apic = apic_frames[0]
        mime = (apic.mime or "").lower().strip()

        if mime in ("image/jpeg", "image/jpg"):
            ext = ".jpg"
        elif mime == "image/png":
            ext = ".png"
        else:
            print(f"  Cover art found but unsupported mime type: {mime}")
            return None

        COVERS_DIR.mkdir(parents=True, exist_ok=True)
        cover_filename = f"{slug}{ext}"
        cover_path = COVERS_DIR / cover_filename

        with open(cover_path, "wb") as img_file:
            img_file.write(apic.data)

        return cover_filename
    except Exception as e:
        print(f"  Error extracting cover from {mp3_path.name}: {e}")
        return None


def find_existing_cover(slug: str):
    for ext in [".jpg", ".jpeg", ".png"]:
        cover_path = COVERS_DIR / f"{slug}{ext}"
        if cover_path.exists():
            return f"{slug}{ext}"
    return None


def choose_playlists(album: str) -> list[str]:
    album = (album or "").strip()
    album_meta = ALBUM_METADATA.get(album, {})

    if album_meta.get("playlists"):
        return [p.strip() for p in album_meta["playlists"] if str(p).strip()]

    return [album] if album else [DEFAULT_PLAYLIST]


def get_album_meta(album: str) -> dict:
    return ALBUM_METADATA.get((album or "").strip(), {})


def get_album_zip(album: str) -> str:
    zip_name = (get_album_meta(album).get("album_zip") or "").strip()
    if zip_name:
        return build_album_zip_url(zip_name)
    return ""


def extract_scripture_references(text: str) -> list[str]:
    if not text:
        return []

    normalized = " ".join(str(text).split())
    found = []
    seen = set()

    for book in sorted(SCRIPTURE_BOOKS, key=len, reverse=True):
        pattern = rf"\b{re.escape(book)}\s+\d+:\d+(?:[-–]\d+)?\b"
        matches = re.finditer(pattern, normalized, flags=re.IGNORECASE)
        for match in matches:
            ref = match.group(0).strip()
            key = ref.lower()
            if key not in seen:
                seen.add(key)
                found.append(ref)

    return found


def make_track_id(title: str, album: str, index: int) -> str:
    return f"{slugify(album or DEFAULT_ALBUM)}__{slugify(title or 'track')}__{index}"




def load_track_metadata() -> dict:
    if not TRACK_METADATA_FILE.exists():
        print(f"No {TRACK_METADATA_NAME} found. Skipping track overrides.")
        return {}

    try:
        with open(TRACK_METADATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"Could not read {TRACK_METADATA_NAME}: {e}")
        return {}

    if not isinstance(data, dict):
        print(f"{TRACK_METADATA_NAME} is not a JSON object. Skipping track overrides.")
        return {}

    normalized = {}
    for key, value in data.items():
        if not isinstance(value, dict):
            continue
        normalized[str(key).strip().lower()] = value
        normalized[slugify(str(key))] = value
        normalized[clean_title(str(key)).lower()] = value
    print(f"Loaded {len(data)} track metadata override entries from {TRACK_METADATA_NAME}.")
    return normalized


def get_track_override(file_name: str, title: str, slug: str, track_meta_map: dict) -> dict:
    candidates = [
        file_name.lower(),
        clean_title(file_name).lower(),
        slugify(clean_title(file_name)),
        (title or "").lower(),
        slug,
    ]
    for key in candidates:
        if key and key in track_meta_map:
            return track_meta_map[key]
    return {}

def build_lrc_mapping_from_lyrics_folder() -> dict:
    mapping = {}
    if not LYRICS_DIR.exists():
        print(f"No lyrics folder found at {LYRICS_DIR}.")
        return mapping

    lrc_files = sorted(LYRICS_DIR.glob("*.lrc"))
    for lrc_path in lrc_files:
        relative_path = f"lyrics/{lrc_path.name}"
        stem = lrc_path.stem
        candidate_keys = {
            stem.lower(),
            clean_title(stem).lower(),
            slugify(stem),
            slugify(stem.replace("-", " ")),
            slugify(stem.replace("dont", "don't")),
            slugify(stem.replace("its", "it's")),
            slugify(stem.replace("im", "i'm")),
        }
        for key in candidate_keys:
            if key:
                mapping.setdefault(key, relative_path)

    print(f"Loaded {len(lrc_files)} LRC files from lyrics folder fallback.")
    return mapping


def load_lrc_manifest() -> dict:
    mapping = {}

    if LRC_MANIFEST_FILE.exists():
        try:
            with open(LRC_MANIFEST_FILE, "r", encoding="utf-8") as f:
                entries = json.load(f)
        except Exception as e:
            print(f"Could not read {LRC_MANIFEST_NAME}: {e}")
            entries = []

        if isinstance(entries, list):
            for entry in entries:
                if not isinstance(entry, dict):
                    continue

                lyrics_file = str(entry.get("lyrics_file") or "").strip()
                mp3_name = str(entry.get("mp3") or "").strip()
                title = str(entry.get("title") or "").strip()

                if not lyrics_file:
                    continue

                candidate_keys = {
                    mp3_name.lower(),
                    clean_title(mp3_name).lower(),
                    slugify(clean_title(mp3_name)),
                    title.lower(),
                    slugify(title),
                }

                for key in candidate_keys:
                    if key:
                        mapping[key] = lyrics_file

            print(f"Loaded {len(entries)} LRC manifest entries from {LRC_MANIFEST_NAME}.")
        else:
            print(f"{LRC_MANIFEST_NAME} is not a JSON list. Skipping manifest entries.")
    else:
        print(f"No {LRC_MANIFEST_NAME} found. Falling back to /lyrics folder scan.")

    fallback_map = build_lrc_mapping_from_lyrics_folder()
    for key, value in fallback_map.items():
        mapping.setdefault(key, value)

    return mapping


def find_lyrics_file(file_name: str, title: str, slug: str, lrc_map: dict) -> str:
    candidates = [
        file_name.lower(),
        clean_title(file_name).lower(),
        slugify(clean_title(file_name)),
        (title or "").lower(),
        slug,
    ]
    for key in candidates:
        if key and key in lrc_map:
            return lrc_map[key]
    return ""


def main():
    print("=== DEBUG INFO ===")
    print(f"SCRIPT_PATH: {SCRIPT_PATH}")
    print(f"SITE_DIR: {SITE_DIR}")
    print(f"AUDIO_DIR: {AUDIO_DIR}")
    print(f"COVERS_DIR: {COVERS_DIR}")
    print(f"OUTPUT_FILE: {OUTPUT_FILE}")
    print(f"LRC_MANIFEST_FILE: {LRC_MANIFEST_FILE}")
    print("==================")

    if not AUDIO_DIR.exists():
        raise SystemExit(f"Missing audio folder: {AUDIO_DIR}")

    COVERS_DIR.mkdir(parents=True, exist_ok=True)
    lrc_map = load_lrc_manifest()
    track_meta_map = load_track_metadata()
    tracks = []

    audio_files = [
        f for f in AUDIO_DIR.iterdir()
        if f.is_file() and f.suffix.lower() in AUDIO_EXTENSIONS
    ]

    print(f"Found audio files: {len(audio_files)}")
    for f in audio_files:
        print(f" - {f.name}")

    sorted_files = sorted(audio_files, key=lambda f: f.name.lower())

    for index, file in enumerate(sorted_files, start=1):
        fallback_title = clean_title(file.name)
        mp3_meta = get_mp3_metadata(file)

        title = mp3_meta.get("title") or fallback_title
        artist = mp3_meta.get("artist") or DEFAULT_ARTIST
        album = mp3_meta.get("album") or DEFAULT_ALBUM
        genre = mp3_meta.get("genre") or ""
        year = mp3_meta.get("year") or DEFAULT_YEAR
        track_number = mp3_meta.get("track_number")
        duration_seconds = mp3_meta.get("duration_seconds", 0)
        duration_display = format_duration(duration_seconds)

        slug = slugify(title)
        artist_slug = slugify(artist)
        album_slug = slugify(album)
        lyrics = get_embedded_lyrics(file)
        lyrics_file = find_lyrics_file(file.name, title, slug, lrc_map)
        track_override = get_track_override(file.name, title, slug, track_meta_map)

        scripture_references = (
            extract_scripture_references(mp3_meta.get("comment", ""))
            or extract_scripture_references(lyrics or "")
            or []
        )

        playlists = choose_playlists(album)
        tags = parse_genre_tags(genre)
        album_meta = get_album_meta(album)
        album_zip = get_album_zip(album)

        existing_cover = find_existing_cover(slug)
        extracted_cover = existing_cover or extract_cover_art(file, slug)

        track = {
            "id": make_track_id(title, album, index),
            "title": title,
            "slug": slug,
            "artist": artist,
            "artist_slug": artist_slug,
            "album": album,
            "album_slug": album_slug,
            "genre": genre,
            "year": year,
            "src": build_audio_url(file.name),
            "playlists": playlists,
            "tags": tags,
            "duration": duration_display,
            "duration_seconds": duration_seconds,
            "scripture_references": scripture_references,
            "trackNumber": track_number,
            "album_zip": album_zip,
            "collection": DEFAULT_COLLECTION,
            "featured": bool(album_meta.get("featured") is True),
            "play_count": 0,
            "last_played": "",
            "has_lyrics": bool(lyrics or lyrics_file),
            "has_scripture_refs": bool(scripture_references),
        }

        # Optional album page fields
        if album_meta.get("featured") is True:
            track["album_featured"] = True
        if album_meta.get("description"):
            track["album_description"] = str(album_meta["description"]).strip()
        if album_meta.get("theme"):
            track["album_theme"] = str(album_meta["theme"]).strip()
        if album_meta.get("story"):
            track["album_story"] = str(album_meta["story"]).strip()
        if album_meta.get("badges"):
            track["album_badges"] = [str(x).strip() for x in album_meta["badges"] if str(x).strip()]

        # Compatibility fields for older code
        track["audio"] = track["src"]
        track["playlist"] = playlists[0] if playlists else DEFAULT_PLAYLIST
        track["scripture"] = scripture_references[0] if scripture_references else ""

        if extracted_cover:
            track["cover"] = build_cover_url(extracted_cover)

        if track_override.get("title"):
            track["title"] = str(track_override["title"]).strip()
        if track_override.get("artist"):
            track["artist"] = str(track_override["artist"]).strip()
            track["artist_slug"] = slugify(track["artist"])
        if track_override.get("album"):
            track["album"] = str(track_override["album"]).strip()
            track["album_slug"] = slugify(track["album"])
        if track_override.get("year"):
            track["year"] = int(track_override["year"])
        if track_override.get("genre"):
            track["genre"] = str(track_override["genre"]).strip()
            track["tags"] = parse_genre_tags(track["genre"])
        if track_override.get("playlists"):
            track["playlists"] = [str(x).strip() for x in track_override["playlists"] if str(x).strip()]
        if track_override.get("tags"):
            track["tags"] = [str(x).strip().lower() for x in track_override["tags"] if str(x).strip()]
        if track_override.get("scripture_references"):
            track["scripture_references"] = [str(x).strip() for x in track_override["scripture_references"] if str(x).strip()]
            track["has_scripture_refs"] = bool(track["scripture_references"])
            track["scripture"] = track["scripture_references"][0] if track["scripture_references"] else ""
        if track_override.get("lyrics"):
            track["lyrics"] = str(track_override["lyrics"]).strip()
            track["has_lyrics"] = True
        if track_override.get("lyrics_file"):
            track["lyrics_file"] = str(track_override["lyrics_file"]).strip()
            track["has_lyrics"] = True
        if track_override.get("cover"):
            cover_name = str(track_override["cover"]).strip()
            track["cover"] = cover_name if cover_name.startswith("http") else build_cover_url(cover_name)
        if track_override.get("album_zip"):
            zip_name = str(track_override["album_zip"]).strip()
            track["album_zip"] = zip_name if zip_name.startswith("http") else build_album_zip_url(zip_name)
        if "featured" in track_override:
            track["featured"] = bool(track_override.get("featured"))
        if track_override.get("collection"):
            track["collection"] = str(track_override["collection"]).strip()
        if track_override.get("date_added"):
            track["date_added"] = str(track_override["date_added"]).strip()
        if track_override.get("search_keywords"):
            track["search_keywords"] = [str(v).strip() for v in track_override.get("search_keywords", []) if str(v).strip()]


        if lyrics:
            track["lyrics"] = lyrics

        if lyrics_file:
            track["lyrics_file"] = lyrics_file

        if track["trackNumber"] is None:
            del track["trackNumber"]
        if not track["album_zip"]:
            del track["album_zip"]
        if not track["scripture_references"]:
            del track["scripture_references"]
        if not track["genre"]:
            del track["genre"]
        if not track.get("album_badges"):
            track.pop("album_badges", None)

        tracks.append(track)

        print(f"Processed: {file.name}")
        print(f"  Title: {track['title']}")
        print(f"  Slug: {track['slug']}")
        print(f"  Artist: {track['artist']}")
        print(f"  Artist slug: {track['artist_slug']}")
        print(f"  Album: {track['album']}")
        print(f"  Album slug: {track['album_slug']}")
        print(f"  Genre: {genre or 'none'}")
        print(f"  Playlists: {', '.join(track['playlists'])}")
        print(f"  Tags: {', '.join(track['tags']) if track['tags'] else 'none'}")
        print(f"  Scripture refs: {', '.join(scripture_references) if scripture_references else 'none'}")
        print(f"  Duration: {track['duration']}")
        print(f"  Lyrics found: {'yes' if lyrics else 'no'}")
        print(f"  LRC file: {track.get('lyrics_file', 'none')}")
        print(f"  Cover found: {track.get('cover', 'none')}")
        print(f"  Album zip: {track.get('album_zip', 'none')}")

    tracks.sort(key=lambda t: (
        t.get("album", "").lower(),
        t.get("trackNumber", 9999),
        t.get("title", "").lower(),
    ))

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(tracks, f, indent=2, ensure_ascii=False)

    print(f"\ntracks.json created successfully with {len(tracks)} tracks.")
    print(f"Wrote file to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
