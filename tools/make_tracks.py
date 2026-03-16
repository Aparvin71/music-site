import json
import re
from pathlib import Path
from urllib.parse import quote

from mutagen.mp3 import MP3
from mutagen.id3 import ID3

AUDIO_BASE_URL = "https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/audio"
COVER_BASE_URL = "https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/covers"

DEFAULT_ARTIST = "Allen Parvin"
DEFAULT_ALBUM = "Singles"
DEFAULT_YEAR = 2026
DEFAULT_PLAYLIST = "Music"

STOPWORDS = {
    "the", "and", "a", "an", "of", "to", "in", "on", "for", "with", "allen", "parvin",
    "my", "me", "your", "you", "i", "we", "our", "is", "are", "christian"
}

SITE_DIR = Path(__file__).resolve().parents[1]
AUDIO_DIR = SITE_DIR / "audio"
COVERS_DIR = SITE_DIR / "covers"
OUTPUT_FILE = SITE_DIR / "tracks.json"

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


def build_cover_url(file_name):
    return f"{COVER_BASE_URL.rstrip('/')}/{quote(file_name)}"


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
        comment = ""

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
            if "COMM::eng" in tags:
                comment = safe_tag_text(tags["COMM::eng"].text)
            else:
                for key in tags.keys():
                    if key.startswith("COMM"):
                        comment = safe_tag_text(tags[key].text)
                        if comment:
                            break

        title = title_case_if_all_caps(title)
        artist = title_case_if_all_caps(artist)
        album = title_case_if_all_caps(album)

        return {
            "title": title,
            "artist": artist,
            "album": album,
            "year": year,
            "track_number": track_number,
            "duration": duration,
            "comment": comment
        }

    except Exception as e:
        print(f"Error reading MP3 metadata from {mp3_path.name}: {e}")
        return {
            "title": "",
            "artist": "",
            "album": "",
            "year": DEFAULT_YEAR,
            "track_number": None,
            "duration": 0,
            "comment": ""
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


def extract_cover_art(mp3_path, slug):
    """
    Extract embedded cover art from an MP3 and save it to /covers.
    Returns the saved filename (example: 'my-song.jpg') or None.
    """
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


def find_existing_cover(slug):
    """
    If a cover file already exists locally, use it instead of re-extracting.
    """
    for ext in [".jpg", ".jpeg", ".png"]:
        cover_path = COVERS_DIR / f"{slug}{ext}"
        if cover_path.exists():
            if ext == ".jpeg":
                return f"{slug}.jpeg"
            return f"{slug}{ext}"
    return None


def words_for_tags(text):
    words = re.findall(r"[a-z0-9]+", text.lower())
    return [w for w in words if w not in STOPWORDS and len(w) > 2]


def build_tags(title, album, artist, scripture):
    tag_set = set()

    for word in words_for_tags(title):
        tag_set.add(word)
    for word in words_for_tags(album):
        tag_set.add(word)
    for word in words_for_tags(artist):
        tag_set.add(word)
    for word in words_for_tags(scripture):
        tag_set.add(word)

    tag_set.add("christian")
    return sorted(tag_set)


def choose_playlist(album):
    album = (album or "").strip()
    return album if album else DEFAULT_PLAYLIST


def extract_scripture_reference(text):
    if not text:
        return ""

    normalized = " ".join(str(text).split())

    for book in sorted(SCRIPTURE_BOOKS, key=len, reverse=True):
        pattern = rf"\b{re.escape(book)}\s+\d+:\d+(?:[-–]\d+)?\b"
        match = re.search(pattern, normalized, flags=re.IGNORECASE)
        if match:
            return match.group(0)

    return ""


def main():
    print("=== DEBUG INFO ===")
    print(f"SITE_DIR: {SITE_DIR}")
    print(f"AUDIO_DIR: {AUDIO_DIR}")
    print(f"COVERS_DIR: {COVERS_DIR}")
    print(f"OUTPUT_FILE: {OUTPUT_FILE}")
    print("==================")

    if not AUDIO_DIR.exists():
        raise SystemExit(f"Missing audio folder: {AUDIO_DIR}")

    COVERS_DIR.mkdir(parents=True, exist_ok=True)

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
        scripture = (
            extract_scripture_reference(mp3_meta.get("comment", ""))
            or extract_scripture_reference(lyrics or "")
            or ""
        )
        playlist = choose_playlist(album)
        tags = build_tags(title, album, artist, scripture)

        existing_cover = find_existing_cover(slug)
        extracted_cover = existing_cover or extract_cover_art(file, slug)

        track = {
            "title": title,
            "slug": slug,
            "artist": artist,
            "album": album,
            "year": year,
            "audio": build_audio_url(file.name),
            "playlist": playlist,
            "tags": tags,
            "duration": duration,
            "scripture": scripture
        }

        if extracted_cover:
            track["cover"] = build_cover_url(extracted_cover)

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
        print(f"  Scripture: {track['scripture'] or 'none'}")
        print(f"  Tags: {', '.join(track['tags'])}")
        print(f"  Duration: {track['duration']} sec")
        print(f"  Lyrics found: {'yes' if lyrics else 'no'}")
        print(f"  Cover found: {track.get('cover', 'none')}")

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