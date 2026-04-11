import json
import re
import unicodedata
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any
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
DEFAULT_COLLECTION = "All Songs"
LRC_MANIFEST_NAME = "lrc-manifest.json"
TRACK_METADATA_NAME = "track-metadata.json"
TRACK_BUILD_CACHE_NAME = "track-build-cache.json"
AUDIO_EXTENSIONS = {".mp3"}
WAVEFORM_ENVELOPE_POINTS = 2048
WAVEFORM_FFMPEG_SAMPLE_RATE = 400
WAVEFORM_MIN_SAMPLES = 256

SCRIPT_PATH = Path(__file__).resolve()
SITE_DIR = SCRIPT_PATH.parent
if not (SITE_DIR / "audio").exists() and len(SCRIPT_PATH.parents) > 1:
    parent_candidate = SCRIPT_PATH.parents[1]
    if (parent_candidate / "audio").exists():
        SITE_DIR = parent_candidate

AUDIO_DIR = SITE_DIR / "audio"
COVERS_DIR = SITE_DIR / "covers"
LYRICS_DIR = SITE_DIR / "lyrics"
OUTPUT_FILE = SITE_DIR / "tracks.json"
LRC_MANIFEST_FILE = SITE_DIR / LRC_MANIFEST_NAME
TRACK_METADATA_FILE = SITE_DIR / TRACK_METADATA_NAME
TRACK_BUILD_CACHE_FILE = SITE_DIR / TRACK_BUILD_CACHE_NAME

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
    "2 John", "3 John", "Jude", "Revelation",
]

# Optional album metadata.
ALBUM_METADATA: dict[str, dict[str, Any]] = {
    # "Grace Songs": {
    #     "album_zip": "grace-songs.zip",
    #     "playlists": ["Worship"],
    #     "featured": True,
    # },
}

SMART_CHAR_REPLACEMENTS = {
    "\u2018": "'",
    "\u2019": "'",
    "\u201c": '"',
    "\u201d": '"',
    "\u2013": "-",
    "\u2014": "-",
    "\u00a0": " ",
}

BAD_UNICODE_MARKER_RE = re.compile(r"[#\\]?u?201[89abcd]|#U201[89ABCD]", re.IGNORECASE)


def normalize_text(value: str) -> str:
    text = str(value or "")
    for old, new in SMART_CHAR_REPLACEMENTS.items():
        text = text.replace(old, new)
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()



def clean_title(filename: str) -> str:
    title = Path(filename).stem
    title = normalize_text(title)
    title = re.sub(r"\(\d+\)$", "", title).strip()
    title = re.sub(r"^\d+[-_.\s]*", "", title)
    title = re.sub(r"\s+", " ", title)
    return title.strip()



def canonical_match_key(text: str) -> str:
    text = normalize_text(text).lower()
    text = BAD_UNICODE_MARKER_RE.sub("'", text)
    text = text.replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()



def slugify(text: str) -> str:
    text = canonical_match_key(text)
    text = re.sub(r"^\d+[-_.\s]*", "", text)
    return text.replace(" ", "-").strip("-")



def encode_url_path_component(file_name: str) -> str:
    cleaned = normalize_text(file_name)
    cleaned = cleaned.replace("\\", "/")
    return quote(cleaned, safe="")



def build_audio_url(file_name: str) -> str:
    return f"{AUDIO_BASE_URL.rstrip('/')}/{encode_url_path_component(file_name)}"



def build_cover_url(file_name: str) -> str:
    return f"{COVER_BASE_URL.rstrip('/')}/{encode_url_path_component(file_name)}"



def build_album_zip_url(file_name: str) -> str:
    return f"{ALBUM_ZIP_BASE_URL.rstrip('/')}/{encode_url_path_component(file_name)}"



def safe_tag_text(tag_value: Any) -> str:
    if not tag_value:
        return ""

    if hasattr(tag_value, "text"):
        text = tag_value.text
        if isinstance(text, list):
            return " ".join(normalize_text(str(x)) for x in text if normalize_text(str(x)))
        return normalize_text(str(text))

    if isinstance(tag_value, list):
        return " ".join(normalize_text(str(x)) for x in tag_value if normalize_text(str(x)))

    return normalize_text(str(tag_value))



def parse_year(tag_value: Any) -> int:
    text = safe_tag_text(tag_value)
    match = re.search(r"\d{4}", text)
    return int(match.group()) if match else DEFAULT_YEAR



def parse_track_number(tag_value: Any) -> int | None:
    text = safe_tag_text(tag_value)
    match = re.match(r"(\d+)", text)
    return int(match.group(1)) if match else None



def title_case_if_all_caps(text: str) -> str:
    return text.title() if text and text.isupper() else text



def format_duration(seconds: int) -> str:
    seconds = int(seconds or 0)
    mins = seconds // 60
    secs = seconds % 60
    return f"{mins}:{secs:02d}"



def parse_genre_tags(genre_text: str) -> list[str]:
    if not genre_text:
        return []

    parts = re.split(r"[,;/|]+", genre_text)
    cleaned: list[str] = []
    seen: set[str] = set()

    for part in parts:
        value = canonical_match_key(part)
        if not value or value in seen:
            continue
        seen.add(value)
        cleaned.append(value)

    return cleaned



def get_mp3_metadata(mp3_path: Path) -> dict[str, Any]:
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

        return {
            "title": title_case_if_all_caps(title),
            "artist": title_case_if_all_caps(artist),
            "album": title_case_if_all_caps(album),
            "genre": title_case_if_all_caps(genre),
            "year": year,
            "track_number": track_number,
            "duration_seconds": duration_seconds,
            "comment": comment,
        }
    except Exception as exc:
        print(f"Error reading MP3 metadata from {mp3_path.name}: {exc}")
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



@dataclass
class TrackCacheEntry:
    file_name: str
    size: int
    mtime_ns: int
    duration_seconds: int

    @classmethod
    def from_path(cls, mp3_path: Path, duration_seconds: int) -> "TrackCacheEntry":
        stat = mp3_path.stat()
        return cls(
            file_name=mp3_path.name,
            size=int(stat.st_size),
            mtime_ns=int(getattr(stat, "st_mtime_ns", int(stat.st_mtime * 1_000_000_000))),
            duration_seconds=int(duration_seconds or 0),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "file_name": self.file_name,
            "size": self.size,
            "mtime_ns": self.mtime_ns,
            "duration_seconds": self.duration_seconds,
        }


def load_existing_tracks() -> list[dict[str, Any]]:
    if not OUTPUT_FILE.exists():
        return []
    try:
        data = json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception as exc:
        print(f"Warning: could not read existing tracks.json: {exc}")
        return []


def load_track_build_cache() -> dict[str, dict[str, Any]]:
    if not TRACK_BUILD_CACHE_FILE.exists():
        return {}
    try:
        data = json.loads(TRACK_BUILD_CACHE_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception as exc:
        print(f"Warning: could not read track build cache: {exc}")
        return {}


def source_cache_matches(cache_data: dict[str, Any], entry: TrackCacheEntry) -> bool:
    if not cache_data:
        return False
    return (
        str(cache_data.get("file_name") or "") == entry.file_name
        and int(cache_data.get("size") or -1) == entry.size
        and int(cache_data.get("mtime_ns") or -1) == entry.mtime_ns
        and int(cache_data.get("duration_seconds") or -1) == entry.duration_seconds
    )


def find_existing_track_for_file(existing_tracks_by_src: dict[str, dict[str, Any]], file_name: str) -> dict[str, Any]:
    return existing_tracks_by_src.get(build_audio_url(file_name), {})


def get_reusable_waveform_data(
    existing_track: dict[str, Any],
    build_cache: dict[str, dict[str, Any]],
    cache_entry: TrackCacheEntry,
) -> tuple[list[int], list[int], bool]:
    existing_envelope = existing_track.get("waveform_envelope")
    existing_ring = existing_track.get("waveform_ring_preview")
    cache_data = build_cache.get(cache_entry.file_name, {})

    envelope_ok = isinstance(existing_envelope, list) and len(existing_envelope) >= WAVEFORM_MIN_SAMPLES
    ring_ok = isinstance(existing_ring, list) and len(existing_ring) > 0

    if envelope_ok and ring_ok and source_cache_matches(cache_data, cache_entry):
        return ([int(round(v)) for v in existing_envelope], [int(round(v)) for v in existing_ring], True)

    return ([], [], False)


def get_embedded_lyrics(mp3_path: Path) -> str | None:
    try:
        tags = ID3(mp3_path)
        if "USLT::eng" in tags:
            text = normalize_text(str(tags["USLT::eng"].text))
            if text:
                return text
        for key in tags.keys():
            if key.startswith("USLT"):
                text = normalize_text(str(tags[key].text))
                if text:
                    return text
    except Exception:
        pass
    return None



def extract_cover_art(mp3_path: Path, slug: str) -> str | None:
    try:
        tags = ID3(mp3_path)
        apic_frames = tags.getall("APIC")
        if not apic_frames:
            return None

        apic = apic_frames[0]
        mime = normalize_text(apic.mime).lower()
        if mime in {"image/jpeg", "image/jpg"}:
            ext = ".jpg"
        elif mime == "image/png":
            ext = ".png"
        else:
            print(f"  Cover art found but unsupported mime type: {mime}")
            return None

        COVERS_DIR.mkdir(parents=True, exist_ok=True)
        cover_filename = f"{slug}{ext}"
        cover_path = COVERS_DIR / cover_filename
        cover_path.write_bytes(apic.data)
        return cover_filename
    except Exception as exc:
        print(f"  Error extracting cover from {mp3_path.name}: {exc}")
        return None



def find_existing_cover(slug: str) -> str | None:
    for ext in (".jpg", ".jpeg", ".png"):
        cover_path = COVERS_DIR / f"{slug}{ext}"
        if cover_path.exists():
            return cover_path.name
    return None



def choose_playlists(album: str) -> list[str]:
    album = normalize_text(album)
    album_meta = ALBUM_METADATA.get(album, {})
    if album_meta.get("playlists"):
        return [normalize_text(str(p)) for p in album_meta["playlists"] if normalize_text(str(p))]
    return [album] if album else [DEFAULT_PLAYLIST]



def get_album_meta(album: str) -> dict[str, Any]:
    return ALBUM_METADATA.get(normalize_text(album), {})



def get_album_zip(album: str) -> str:
    zip_name = normalize_text(str(get_album_meta(album).get("album_zip") or ""))
    return build_album_zip_url(zip_name) if zip_name else ""



def extract_scripture_references(text: str) -> list[str]:
    if not text:
        return []

    normalized = " ".join(normalize_text(text).split())
    found: list[str] = []
    seen: set[str] = set()

    for book in sorted(SCRIPTURE_BOOKS, key=len, reverse=True):
        pattern = rf"\b{re.escape(book)}\s+\d+:\d+(?:[-–]\d+)?\b"
        for match in re.finditer(pattern, normalized, flags=re.IGNORECASE):
            ref = normalize_text(match.group(0))
            key = ref.lower()
            if key not in seen:
                seen.add(key)
                found.append(ref)

    return found



def make_track_id(title: str, album: str, index: int) -> str:
    return f"{slugify(album or DEFAULT_ALBUM)}__{slugify(title or 'track')}__{index}"



def build_lookup_keys(*values: str) -> list[str]:
    keys: list[str] = []
    seen: set[str] = set()
    for value in values:
        candidates = {
            normalize_text(value),
            clean_title(value),
            canonical_match_key(value),
            slugify(value),
            slugify(value.replace("dont", "don't").replace("its", "it's").replace("im", "i'm")),
        }
        for candidate in candidates:
            candidate = candidate.strip().lower()
            if candidate and candidate not in seen:
                seen.add(candidate)
                keys.append(candidate)
    return keys



def load_track_metadata() -> dict[str, dict[str, Any]]:
    if not TRACK_METADATA_FILE.exists():
        print(f"No {TRACK_METADATA_NAME} found. Skipping track overrides.")
        return {}

    try:
        data = json.loads(TRACK_METADATA_FILE.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"Could not read {TRACK_METADATA_NAME}: {exc}")
        return {}

    if not isinstance(data, dict):
        print(f"{TRACK_METADATA_NAME} is not a JSON object. Skipping track overrides.")
        return {}

    normalized: dict[str, dict[str, Any]] = {}
    for key, value in data.items():
        if not isinstance(value, dict):
            continue
        for lookup_key in build_lookup_keys(str(key)):
            normalized[lookup_key] = value

    print(f"Loaded {len(data)} track metadata override entries from {TRACK_METADATA_NAME}.")
    return normalized



def get_track_override(file_name: str, title: str, slug: str, track_meta_map: dict[str, dict[str, Any]]) -> dict[str, Any]:
    for key in build_lookup_keys(file_name, title, slug):
        if key in track_meta_map:
            return track_meta_map[key]
    return {}



def build_lrc_mapping_from_lyrics_folder() -> dict[str, str]:
    mapping: dict[str, str] = {}
    if not LYRICS_DIR.exists():
        print(f"No lyrics folder found at {LYRICS_DIR}.")
        return mapping

    lrc_files = sorted(LYRICS_DIR.glob("*.lrc"))
    for lrc_path in lrc_files:
        relative_path = f"lyrics/{lrc_path.name}"
        for key in build_lookup_keys(lrc_path.stem):
            mapping.setdefault(key, relative_path)

    print(f"Loaded {len(lrc_files)} LRC files from lyrics folder fallback.")
    return mapping



def load_lrc_manifest() -> dict[str, str]:
    mapping: dict[str, str] = {}

    if LRC_MANIFEST_FILE.exists():
        try:
            entries = json.loads(LRC_MANIFEST_FILE.read_text(encoding="utf-8"))
        except Exception as exc:
            print(f"Could not read {LRC_MANIFEST_NAME}: {exc}")
            entries = []

        if isinstance(entries, list):
            for entry in entries:
                if not isinstance(entry, dict):
                    continue
                lyrics_file = normalize_text(str(entry.get("lyrics_file") or ""))
                mp3_name = normalize_text(str(entry.get("mp3") or ""))
                title = normalize_text(str(entry.get("title") or ""))
                if not lyrics_file:
                    continue
                for key in build_lookup_keys(mp3_name, title):
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



def find_lyrics_file(file_name: str, title: str, slug: str, lrc_map: dict[str, str]) -> str:
    for key in build_lookup_keys(file_name, title, slug):
        if key in lrc_map:
            return lrc_map[key]
    return ""



def extract_waveform_envelope(mp3_path: Path, duration_seconds: int, target_points: int = WAVEFORM_ENVELOPE_POINTS) -> list[int]:
    target_points = max(WAVEFORM_MIN_SAMPLES, int(target_points or WAVEFORM_ENVELOPE_POINTS))
    sample_rate = WAVEFORM_FFMPEG_SAMPLE_RATE
    command = [
        "ffmpeg",
        "-v", "error",
        "-i", str(mp3_path),
        "-f", "s16le",
        "-acodec", "pcm_s16le",
        "-ac", "1",
        "-ar", str(sample_rate),
        "-",
    ]

    try:
        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    except FileNotFoundError:
        print("  ffmpeg not found; skipping waveform prerender.")
        return []
    except subprocess.CalledProcessError as exc:
        error_text = exc.stderr.decode("utf-8", errors="ignore").strip()
        print(f"  ffmpeg waveform extraction failed for {mp3_path.name}: {error_text or exc}")
        return []

    raw = result.stdout
    if len(raw) < 4:
        return []

    sample_count = len(raw) // 2
    if sample_count <= 0:
        return []

    peaks: list[float] = []
    chunk_size = max(1, sample_count // target_points)
    max_abs = 1.0

    for start_sample in range(0, sample_count, chunk_size):
        end_sample = min(sample_count, start_sample + chunk_size)
        peak = 0
        total = 0.0
        count = 0
        byte_start = start_sample * 2
        byte_end = end_sample * 2
        for i in range(byte_start, byte_end, 2):
            sample = int.from_bytes(raw[i:i + 2], byteorder="little", signed=True)
            abs_sample = abs(sample)
            if abs_sample > peak:
                peak = abs_sample
            total += abs_sample * abs_sample
            count += 1
        rms = (total / count) ** 0.5 if count else 0.0
        combined = max(peak * 0.72, rms * 1.18)
        peaks.append(combined)
        if combined > max_abs:
            max_abs = combined

    if not peaks:
        return []

    normalized = [min(1.0, value / max_abs) for value in peaks]

    smoothed: list[float] = []
    for idx, value in enumerate(normalized):
        left = normalized[idx - 1] if idx > 0 else value
        right = normalized[idx + 1] if idx + 1 < len(normalized) else value
        smoothed_value = value * 0.62 + left * 0.19 + right * 0.19
        smoothed.append(max(0.0, min(1.0, smoothed_value)))

    if len(smoothed) > target_points:
        smoothed = smoothed[:target_points]
    elif len(smoothed) < target_points and smoothed:
        last = smoothed[-1]
        smoothed.extend([last] * (target_points - len(smoothed)))

    return [int(round(value * 255)) for value in smoothed]


def build_waveform_ring_preview(envelope: list[int], steps: int = 64) -> list[int]:
    if not envelope:
        return []
    steps = max(16, int(steps or 64))
    if len(envelope) == 1:
        return [int(envelope[0])] * steps

    preview: list[int] = []
    max_index = len(envelope) - 1
    for i in range(steps):
        pos = (i / max(1, steps - 1)) * max_index
        left = int(pos)
        right = min(max_index, left + 1)
        frac = pos - left
        sample = envelope[left] * (1 - frac) + envelope[right] * frac
        preview.append(int(round(sample)))
    return preview


def validate_track(track: dict[str, Any], source_file: Path, seen_ids: set[str]) -> list[str]:
    warnings: list[str] = []
    track_id = str(track.get("id") or "")
    src = str(track.get("src") or "")
    audio = str(track.get("audio") or "")

    if track_id in seen_ids:
        warnings.append(f"Duplicate track id: {track_id}")
    else:
        seen_ids.add(track_id)

    if src != audio:
        warnings.append("src/audio mismatch")

    if "#U201" in src or "%23U201" in src or "\\u201" in src.lower():
        warnings.append(f"Suspicious unicode marker in audio URL: {src}")

    if not src.startswith(AUDIO_BASE_URL):
        warnings.append(f"Audio URL does not start with expected base URL: {src}")

    if not source_file.exists():
        warnings.append(f"Source file missing: {source_file}")

    return warnings



def main() -> None:
    print("=== make_tracks.py ===")
    print(f"SCRIPT_PATH: {SCRIPT_PATH}")
    print(f"SITE_DIR: {SITE_DIR}")
    print(f"AUDIO_DIR: {AUDIO_DIR}")
    print(f"COVERS_DIR: {COVERS_DIR}")
    print(f"OUTPUT_FILE: {OUTPUT_FILE}")
    print(f"LRC_MANIFEST_FILE: {LRC_MANIFEST_FILE}")
    print("======================")

    if not AUDIO_DIR.exists():
        raise SystemExit(f"Missing audio folder: {AUDIO_DIR}")

    COVERS_DIR.mkdir(parents=True, exist_ok=True)
    lrc_map = load_lrc_manifest()
    track_meta_map = load_track_metadata()
    existing_tracks = load_existing_tracks()
    existing_tracks_by_src = {str(track.get("src") or ""): track for track in existing_tracks if isinstance(track, dict)}
    build_cache = load_track_build_cache()
    next_build_cache: dict[str, dict[str, Any]] = {}
    tracks: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    reused_waveforms = 0
    regenerated_waveforms = 0

    audio_files = sorted(
        [f for f in AUDIO_DIR.iterdir() if f.is_file() and f.suffix.lower() in AUDIO_EXTENSIONS],
        key=lambda f: f.name.lower(),
    )

    print(f"Found audio files: {len(audio_files)}")
    for file in audio_files:
        print(f" - {file.name}")

    for index, file in enumerate(audio_files, start=1):
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
        cache_entry = TrackCacheEntry.from_path(file, duration_seconds)
        existing_track = find_existing_track_for_file(existing_tracks_by_src, file.name)
        waveform_envelope, waveform_ring, reused_waveform = get_reusable_waveform_data(existing_track, build_cache, cache_entry)
        if reused_waveform:
            reused_waveforms += 1
        else:
            waveform_envelope = extract_waveform_envelope(file, duration_seconds)
            waveform_ring = build_waveform_ring_preview(waveform_envelope)
            if waveform_envelope:
                regenerated_waveforms += 1
        next_build_cache[file.name] = cache_entry.to_dict()

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

        track: dict[str, Any] = {
            "id": make_track_id(title, album, index),
            "title": normalize_text(title),
            "slug": slug,
            "artist": normalize_text(artist),
            "artist_slug": artist_slug,
            "album": normalize_text(album),
            "album_slug": album_slug,
            "genre": normalize_text(genre),
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

        if waveform_envelope:
            track["waveform_envelope"] = waveform_envelope
            track["waveform_ring_preview"] = waveform_ring


        if album_meta.get("featured") is True:
            track["album_featured"] = True
        if album_meta.get("description"):
            track["album_description"] = normalize_text(str(album_meta["description"]))
        if album_meta.get("theme"):
            track["album_theme"] = normalize_text(str(album_meta["theme"]))
        if album_meta.get("story"):
            track["album_story"] = normalize_text(str(album_meta["story"]))
        if album_meta.get("badges"):
            track["album_badges"] = [normalize_text(str(x)) for x in album_meta["badges"] if normalize_text(str(x))]

        track["audio"] = track["src"]
        track["playlist"] = playlists[0] if playlists else DEFAULT_PLAYLIST
        track["scripture"] = scripture_references[0] if scripture_references else ""

        if extracted_cover:
            track["cover"] = build_cover_url(extracted_cover)

        if track_override.get("title"):
            track["title"] = normalize_text(str(track_override["title"]))
            track["slug"] = slugify(track["title"])
        if track_override.get("artist"):
            track["artist"] = normalize_text(str(track_override["artist"]))
            track["artist_slug"] = slugify(track["artist"])
        if track_override.get("album"):
            track["album"] = normalize_text(str(track_override["album"]))
            track["album_slug"] = slugify(track["album"])
        if track_override.get("year"):
            track["year"] = int(track_override["year"])
        if track_override.get("genre"):
            track["genre"] = normalize_text(str(track_override["genre"]))
            track["tags"] = parse_genre_tags(track["genre"])
        if track_override.get("playlists"):
            track["playlists"] = [normalize_text(str(x)) for x in track_override["playlists"] if normalize_text(str(x))]
            track["playlist"] = track["playlists"][0] if track["playlists"] else DEFAULT_PLAYLIST
        if track_override.get("tags"):
            track["tags"] = [canonical_match_key(str(x)) for x in track_override["tags"] if canonical_match_key(str(x))]
        if track_override.get("scripture_references"):
            track["scripture_references"] = [normalize_text(str(x)) for x in track_override["scripture_references"] if normalize_text(str(x))]
            track["has_scripture_refs"] = bool(track["scripture_references"])
            track["scripture"] = track["scripture_references"][0] if track["scripture_references"] else ""
        if track_override.get("lyrics"):
            track["lyrics"] = str(track_override["lyrics"]).strip()
            track["has_lyrics"] = True
        if track_override.get("lyrics_file"):
            track["lyrics_file"] = normalize_text(str(track_override["lyrics_file"]))
            track["has_lyrics"] = True
        if track_override.get("cover"):
            cover_name = normalize_text(str(track_override["cover"]))
            track["cover"] = cover_name if cover_name.startswith("http") else build_cover_url(cover_name)
        if track_override.get("album_zip"):
            zip_name = normalize_text(str(track_override["album_zip"]))
            track["album_zip"] = zip_name if zip_name.startswith("http") else build_album_zip_url(zip_name)
        if "featured" in track_override:
            track["featured"] = bool(track_override.get("featured"))
        if track_override.get("collection"):
            track["collection"] = normalize_text(str(track_override["collection"]))
        if track_override.get("date_added"):
            track["date_added"] = normalize_text(str(track_override["date_added"]))
        if track_override.get("search_keywords"):
            track["search_keywords"] = [normalize_text(str(v)) for v in track_override.get("search_keywords", []) if normalize_text(str(v))]

        if lyrics:
            track["lyrics"] = lyrics
        if lyrics_file:
            track["lyrics_file"] = lyrics_file

        if track["trackNumber"] is None:
            track.pop("trackNumber", None)
        if not track["album_zip"]:
            track.pop("album_zip", None)
        if not track["scripture_references"]:
            track.pop("scripture_references", None)
        if not track.get("genre"):
            track.pop("genre", None)
        if not track.get("album_badges"):
            track.pop("album_badges", None)

        warnings = validate_track(track, file, seen_ids)
        if warnings:
            print(f"Warnings for {file.name}:")
            for warning in warnings:
                print(f"  - {warning}")

        tracks.append(track)

        print(f"Processed: {file.name}")
        print(f"  Title: {track['title']}")
        print(f"  Slug: {track['slug']}")
        print(f"  Artist: {track['artist']}")
        print(f"  Album: {track['album']}")
        print(f"  Duration: {track['duration']}")
        print(f"  Audio URL: {track['src']}")
        print(f"  LRC file: {track.get('lyrics_file', 'none')}")
        print(f"  Cover found: {track.get('cover', 'none')}")
        if waveform_envelope:
            source_label = "reused" if reused_waveform else "regenerated"
            print(f"  Waveform envelope: {len(waveform_envelope)} samples ({source_label})")

    tracks.sort(key=lambda t: (t.get("album", "").lower(), t.get("trackNumber", 9999), t.get("title", "").lower()))
    OUTPUT_FILE.write_text(json.dumps(tracks, indent=2, ensure_ascii=False), encoding="utf-8")
    TRACK_BUILD_CACHE_FILE.write_text(json.dumps(next_build_cache, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\ntracks.json created successfully with {len(tracks)} tracks.")
    print(f"Waveforms reused: {reused_waveforms}")
    print(f"Waveforms regenerated: {regenerated_waveforms}")
    print(f"Wrote file to: {OUTPUT_FILE}")
    print(f"Wrote cache to: {TRACK_BUILD_CACHE_FILE}")


if __name__ == "__main__":
    main()
