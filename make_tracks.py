
import argparse
import json
import re
import shutil
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote, unquote

from mutagen.id3 import ID3, APIC
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
BUILD_REPORT_NAME = "track-build-report.json"
GENERATOR_VERSION = "v43.2.33"
AUDIO_EXTENSIONS = {".mp3"}
COVER_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")

SCRIPT_PATH = Path(__file__).resolve()
SITE_DIR = SCRIPT_PATH.parent
if not (SITE_DIR / "tracks.json").exists() and len(SCRIPT_PATH.parents) > 1:
    parent_candidate = SCRIPT_PATH.parents[1]
    if (parent_candidate / "tracks.json").exists():
        SITE_DIR = parent_candidate

AUDIO_DIR = SITE_DIR / "audio"
COVERS_DIR = SITE_DIR / "covers"
LYRICS_DIR = SITE_DIR / "lyrics"
OUTPUT_FILE = SITE_DIR / "tracks.json"
LRC_MANIFEST_FILE = SITE_DIR / LRC_MANIFEST_NAME
TRACK_METADATA_FILE = SITE_DIR / TRACK_METADATA_NAME
TRACK_BUILD_CACHE_FILE = SITE_DIR / TRACK_BUILD_CACHE_NAME
BUILD_REPORT_FILE = SITE_DIR / BUILD_REPORT_NAME

SCRIPTURE_BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
    "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
    "Nehemiah", "Esther", "Job", "Psalm", "Psalms", "Proverbs", "Ecclesiastes",
    "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea",
    "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai",
    "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
    "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
    "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon",
    "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation",
]

ALBUM_METADATA: dict[str, dict[str, Any]] = {}
SMART_CHAR_REPLACEMENTS = {"‘": "'", "’": "'", "“": '"', "”": '"', "–": "-", "—": "-", " ": " "}
BAD_UNICODE_MARKER_RE = re.compile(r"(?:#?u?201[89abcd]|#U201[89ABCD])", re.IGNORECASE)


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
    text = normalize_text(text)
    text = BAD_UNICODE_MARKER_RE.sub("'", text)
    text = text.replace("&", " and ").replace("'", "")
    text = re.sub(r"^\d+[-_.\s]*", "", text)
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def encode_url_path_component(file_name: str) -> str:
    return quote(str(file_name or "").replace("\\", "/"), safe="")


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
    m = re.search(r"\d{4}", text)
    return int(m.group()) if m else DEFAULT_YEAR


def parse_track_number(tag_value: Any) -> int | None:
    text = safe_tag_text(tag_value)
    m = re.match(r"(\d+)", text)
    return int(m.group(1)) if m else None


def title_case_if_all_caps(text: str) -> str:
    return text.title() if text and text.isupper() else text


def format_duration(seconds: int) -> str:
    seconds = int(seconds or 0)
    return f"{seconds // 60}:{seconds % 60:02d}"


def parse_genre_tags(genre_text: str) -> list[str]:
    if not genre_text:
        return []
    parts = re.split(r"[,;/|]+", genre_text)
    seen, cleaned = set(), []
    for part in parts:
        value = canonical_match_key(part)
        if value and value not in seen:
            seen.add(value)
            cleaned.append(value)
    return cleaned


def get_mp3_metadata(mp3_path: Path) -> dict[str, Any]:
    try:
        audio = MP3(mp3_path)
        tags = audio.tags
        title = artist = album = genre = comment = ""
        year = DEFAULT_YEAR
        track_number = None
        duration_seconds = int(audio.info.length) if audio.info and audio.info.length else 0
        if tags:
            if "TIT2" in tags: title = safe_tag_text(tags["TIT2"])
            if "TPE1" in tags: artist = safe_tag_text(tags["TPE1"])
            if "TALB" in tags: album = safe_tag_text(tags["TALB"])
            if "TCON" in tags: genre = safe_tag_text(tags["TCON"])
            if "TDRC" in tags: year = parse_year(tags["TDRC"])
            elif "TYER" in tags: year = parse_year(tags["TYER"])
            if "TRCK" in tags: track_number = parse_track_number(tags["TRCK"])
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
        return {"title": "", "artist": "", "album": "", "genre": "", "year": DEFAULT_YEAR, "track_number": None, "duration_seconds": 0, "comment": ""}


@dataclass
class TrackCacheEntry:
    file_name: str
    size: int
    mtime_ns: int
    duration_seconds: int

    @classmethod
    def from_path(cls, mp3_path: Path, duration_seconds: int) -> "TrackCacheEntry":
        stat = mp3_path.stat()
        return cls(mp3_path.name, int(stat.st_size), int(getattr(stat, "st_mtime_ns", int(stat.st_mtime * 1_000_000_000))), int(duration_seconds or 0))

    def to_dict(self) -> dict[str, Any]:
        return {"file_name": self.file_name, "size": self.size, "mtime_ns": self.mtime_ns, "duration_seconds": self.duration_seconds}


def load_json_file(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data
    except Exception as exc:
        print(f"Warning: could not read {path.name}: {exc}")
        return default


def save_json_file(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")



def build_lookup_keys(*values: str) -> list[str]:
    keys, seen = [], set()
    for value in values:
        candidates = {normalize_text(value), clean_title(value), canonical_match_key(value), slugify(value), slugify(value.replace("dont", "don't").replace("its", "it's").replace("im", "i'm"))}
        for candidate in candidates:
            candidate = candidate.strip().lower()
            if candidate and candidate not in seen:
                seen.add(candidate)
                keys.append(candidate)
    return keys


def source_name_from_url_or_path(value: Any) -> str:
    raw = normalize_text(str(value or ""))
    if not raw:
        return ""
    raw = raw.split("?", 1)[0].split("#", 1)[0]
    return unquote(raw.rsplit("/", 1)[-1])


def build_existing_track_lookup_keys(track: dict[str, Any]) -> list[str]:
    if not isinstance(track, dict):
        return []
    src = source_name_from_url_or_path(track.get("src") or track.get("audio") or "")
    return build_lookup_keys(
        src,
        track.get("title") or "",
        track.get("slug") or "",
        f"{track.get('album') or ''} {track.get('title') or ''}",
    )


def add_lookup_entry(lookup: dict[str, dict[str, Any]], keys: list[str], track: dict[str, Any]) -> None:
    for key in keys:
        lookup.setdefault(key, track)


def find_existing_track_by_lookup(file_name: str, title: str, slug: str, album: str, lookup: dict[str, dict[str, Any]]) -> dict[str, Any]:
    for key in build_lookup_keys(file_name, title, slug, f"{album} {title}"):
        match = lookup.get(key)
        if isinstance(match, dict):
            return match
    return {}


def load_track_metadata() -> dict[str, dict[str, Any]]:
    if not TRACK_METADATA_FILE.exists():
        return {}
    data = load_json_file(TRACK_METADATA_FILE, {})
    if not isinstance(data, dict):
        return {}
    normalized = {}
    for key, value in data.items():
        if isinstance(value, dict):
            for lookup_key in build_lookup_keys(str(key)):
                normalized[lookup_key] = value
    return normalized


def get_track_override(file_name: str, title: str, slug: str, track_meta_map: dict[str, dict[str, Any]]) -> dict[str, Any]:
    for key in build_lookup_keys(file_name, title, slug):
        if key in track_meta_map:
            return track_meta_map[key]
    return {}


def build_lrc_mapping_from_lyrics_folder() -> dict[str, str]:
    mapping = {}
    if not LYRICS_DIR.exists():
        return mapping
    for lrc_path in sorted(LYRICS_DIR.glob("*.lrc")):
        relative_path = f"lyrics/{lrc_path.name}"
        for key in build_lookup_keys(lrc_path.stem):
            mapping.setdefault(key, relative_path)
    return mapping


def load_lrc_manifest() -> dict[str, str]:
    mapping: dict[str, str] = {}
    entries = load_json_file(LRC_MANIFEST_FILE, [])
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
    fallback_map = build_lrc_mapping_from_lyrics_folder()
    for key, value in fallback_map.items():
        mapping.setdefault(key, value)
    return mapping


def find_lyrics_file(file_name: str, title: str, slug: str, lrc_map: dict[str, str]) -> str:
    for key in build_lookup_keys(file_name, title, slug):
        if key in lrc_map:
            return lrc_map[key]
    return ""

def normalize_boolish_text(value: Any) -> str:
    """Return only real lyric text. Prevent old boolean placeholders from becoming lyrics."""
    if value is None:
        return ""
    if isinstance(value, bool):
        return ""
    text = normalize_text(str(value))
    return "" if text.lower() in {"true", "false", "none", "null"} else text


def normalize_multiline_lyrics(value: Any) -> str:
    """Preserve lyric line breaks while cleaning smart characters and non-lyric markers."""
    if value is None or isinstance(value, bool):
        return ""
    raw = str(value).replace("\r\n", "\n").replace("\r", "\n")
    for old, new in SMART_CHAR_REPLACEMENTS.items():
        raw = raw.replace(old, new)
    raw = unicodedata.normalize("NFKC", raw)
    if raw.strip().lower() in {"true", "false", "none", "null"}:
        return ""
    cleaned_lines: list[str] = []
    for line in raw.split("\n"):
        line = re.sub(r"\*\*([^*]+)\*\*", r"\1", line)
        line = re.sub(r"__([^_]+)__", r"\1", line)
        line = re.sub(r"\s+", " ", line).strip()
        line = re.sub(r"^title:\s*.*$", "", line, flags=re.IGNORECASE).strip()
        if not line:
            continue
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines).strip()


def is_lyric_section_or_metadata_line(text: str) -> bool:
    value = normalize_text(text)
    if not value:
        return True
    if re.match(r"^\[(ar|ti|al|by|re|ve|offset|length):.*\]$", value, flags=re.IGNORECASE):
        return True
    if re.match(r"^(verse|chorus|bridge|pre-chorus|intro|outro|tag|instrumental|music)\s*\d*:?$", value, flags=re.IGNORECASE):
        return True
    if re.match(r"^[.\-–—]{2,}$", value):
        return True
    return False


def lyric_lines_for_lrc(lyrics_text: str) -> list[str]:
    lines = []
    for line in normalize_multiline_lyrics(lyrics_text).split("\n"):
        line = normalize_text(line)
        if not line or is_lyric_section_or_metadata_line(line):
            continue
        lines.append(line)
    return lines


def format_lrc_time(seconds: float) -> str:
    seconds = max(0.0, float(seconds or 0))
    minutes = int(seconds // 60)
    remainder = seconds - (minutes * 60)
    return f"{minutes:02d}:{remainder:05.2f}"


def build_estimated_lrc_text(lyrics_text: str, duration_seconds: int = 0) -> str:
    lines = lyric_lines_for_lrc(lyrics_text)
    if not lines:
        return ""
    duration = int(duration_seconds or 0)
    if duration <= 0:
        duration = max(180, len(lines) * 5)
    # Leave a small lead-in, then spread the lyric lines across the track.
    start_at = 0.8 if duration < 90 else 2.0
    usable_duration = max(float(duration) - start_at - 2.0, float(len(lines)) * 2.0)
    step = usable_duration / max(len(lines), 1)
    out = [f"[length:{format_lrc_time(duration)}]"]
    for index, line in enumerate(lines):
        out.append(f"[{format_lrc_time(start_at + (index * step))}]{line}")
    return "\n".join(out).strip() + "\n"


def write_generated_lrc(slug: str, lyrics_text: str, duration_seconds: int = 0, requested_path: str = "") -> tuple[str, bool]:
    lrc_text = build_estimated_lrc_text(lyrics_text, duration_seconds)
    if not lrc_text:
        return "", False
    raw = normalize_relative_path(requested_path, "lyrics") if requested_path else f"lyrics/{slugify(slug) or 'track'}.lrc"
    if re.match(r"^https?://", raw, flags=re.IGNORECASE):
        raw = f"lyrics/{slugify(slug) or 'track'}.lrc"
    target = SITE_DIR / raw
    target.parent.mkdir(parents=True, exist_ok=True)
    existing = target.read_text(encoding="utf-8") if target.exists() else ""
    changed = existing != lrc_text
    if changed:
        target.write_text(lrc_text, encoding="utf-8")
    return raw.replace("\\", "/"), changed


def normalize_relative_path(value: Any, default_folder: str = "") -> str:
    raw = normalize_text(str(value or ""))
    if not raw:
        return ""
    if re.match(r"^https?://", raw, flags=re.IGNORECASE):
        return raw
    raw = raw.replace("\\", "/").lstrip("/")
    if default_folder and not raw.startswith(default_folder.rstrip("/") + "/"):
        return f"{default_folder.rstrip('/')}/{raw}"
    return raw


def write_lrc_manifest_from_tracks(tracks_out: list[dict[str, Any]]) -> None:
    """Write both root and lyrics-folder LRC manifests from the current track list."""
    entries = []
    for track in tracks_out:
        lyrics_file = normalize_text(str(track.get("lyrics_file") or ""))
        if not lyrics_file:
            continue
        src = normalize_text(str(track.get("src") or track.get("audio") or ""))
        mp3_name = unquote(src.rsplit("/", 1)[-1]) if src else ""
        entries.append({
            "title": track.get("title") or "",
            "slug": track.get("slug") or slugify(track.get("title") or ""),
            "mp3": quote(mp3_name, safe="") if mp3_name else "",
            "lyrics_file": lyrics_file,
        })
    save_json_file(LRC_MANIFEST_FILE, entries)
    save_json_file(LYRICS_DIR / LRC_MANIFEST_NAME, entries)


def iso_from_ns(ns_value: Any) -> str:
    try:
        ns = int(ns_value)
        if ns <= 0:
            return ""
        return datetime.fromtimestamp(ns / 1_000_000_000, tz=timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    except Exception:
        return ""


def iso_from_path_mtime(path: Path) -> str:
    try:
        return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    except Exception:
        return ""


def find_cover_file(file_name: str, title: str, slug: str, cover_override: Any = "") -> str:
    if cover_override:
        raw = normalize_text(str(cover_override)).replace("\\", "/").lstrip("/")
        candidate = COVERS_DIR / raw.replace("covers/", "", 1)
        if candidate.exists():
            return candidate.name
        if Path(raw).suffix.lower() in COVER_EXTENSIONS:
            return Path(raw).name
    if not COVERS_DIR.exists():
        return ""
    stems = []
    for value in (slug, title, clean_title(file_name), Path(file_name).stem):
        for key in build_lookup_keys(value):
            if key not in stems:
                stems.append(key)
    by_stem = {cover_path.stem.lower(): cover_path.name for ext in COVER_EXTENSIONS for cover_path in COVERS_DIR.glob(f"*{ext}")}
    for stem in stems:
        if stem in by_stem:
            return by_stem[stem]
    return ""


def cover_asset_path(file_name: str) -> str:
    return f"covers/{Path(file_name).name}"


def choose_cover_value(file_name: str, title: str, slug: str, override: dict[str, Any], existing_track: dict[str, Any], mp3_path: Path | None = None) -> tuple[str, str, bool]:
    """Choose and, when possible, generate the local cover asset used by the app/package."""
    override_cover = normalize_text(str(override.get("cover") or ""))
    if override_cover:
        if re.match(r"^https?://", override_cover, flags=re.IGNORECASE):
            return override_cover, "metadata-cover-url", False
        file_part = override_cover.replace("covers/", "", 1).lstrip("/")
        candidate = COVERS_DIR / file_part
        if candidate.exists():
            return cover_asset_path(candidate.name), "metadata-cover-file", False
        return build_cover_url(file_part), "metadata-cover-file-missing-local", False

    requested_cover = override.get("cover_file") or override.get("coverFile") or ""
    if requested_cover:
        raw = normalize_text(str(requested_cover)).replace("\\", "/").lstrip("/")
        source = SITE_DIR / raw
        if not source.exists() and raw.startswith("covers/"):
            source = COVERS_DIR / raw.replace("covers/", "", 1)
        if source.exists() and source.is_file() and source.suffix.lower() in COVER_EXTENSIONS:
            target_name = f"{slug}.{source.suffix.lower()}"
            target = COVERS_DIR / target_name
            COVERS_DIR.mkdir(parents=True, exist_ok=True)
            if source.resolve() != target.resolve():
                shutil.copy2(source, target)
            return cover_asset_path(target.name), "metadata-cover-file-copied", True

    cover_file = find_cover_file(file_name, title, slug, requested_cover)
    if cover_file:
        return cover_asset_path(cover_file), "local-cover-file", False

    if mp3_path is not None:
        extracted_name, changed = extract_embedded_cover_file(mp3_path, slug, requested_cover)
        if extracted_name:
            return cover_asset_path(extracted_name), "embedded-cover-extracted", changed

    existing_cover = normalize_text(str(existing_track.get("cover") or "")) if isinstance(existing_track, dict) else ""
    existing_cover_name = existing_cover.rsplit("/", 1)[-1] if existing_cover else ""
    if existing_cover and (not existing_cover_name or (COVERS_DIR / existing_cover_name).exists() or re.match(r"^https?://", existing_cover, flags=re.IGNORECASE)):
        return existing_cover, "existing-cover", False

    return build_cover_url(f"{slug}.jpg"), "slug-default-missing", False


def get_audio_added_at(mp3_path: Path, existing_track: dict[str, Any], cache_entry: dict[str, Any], override: dict[str, Any]) -> str:
    for key in ("added_at", "date_added", "dateAdded"):
        if override.get(key):
            return normalize_text(str(override.get(key)))
    if isinstance(existing_track, dict):
        for key in ("added_at", "date_added", "dateAdded"):
            if existing_track.get(key):
                return normalize_text(str(existing_track.get(key)))
    if isinstance(cache_entry, dict):
        cached = cache_entry.get("added_at") or cache_entry.get("date_added") or iso_from_ns(cache_entry.get("mtime_ns"))
        if cached:
            return normalize_text(str(cached))
    return iso_from_path_mtime(mp3_path)


def find_cache_entry_for_existing_track(existing_track: dict[str, Any], track_cache: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(existing_track, dict) or not isinstance(track_cache, dict):
        return {}
    src = normalize_text(str(existing_track.get("src") or existing_track.get("audio") or ""))
    src_name = unquote(src.rsplit("/", 1)[-1]) if src else ""
    direct = track_cache.get(src_name)
    if isinstance(direct, dict):
        return direct
    lookup_keys = set(build_lookup_keys(src_name, existing_track.get("title") or "", existing_track.get("slug") or ""))
    for cache_name, cache_entry in track_cache.items():
        if lookup_keys.intersection(build_lookup_keys(str(cache_name or ""), str(cache_entry.get("title") or "") if isinstance(cache_entry, dict) else "")):
            return cache_entry if isinstance(cache_entry, dict) else {}
    return {}


def fallback_added_at_for_existing_track(existing_track: dict[str, Any]) -> str:
    year = normalize_text(str(existing_track.get("year") or ""))
    if re.match(r"^\d{4}$", year):
        return f"{year}-01-01T00:00:00Z"
    return ""



def extract_scripture_references(text: str) -> list[str]:
    if not text:
        return []
    normalized = " ".join(normalize_text(text).split())
    found, seen = [], set()
    for book in sorted(SCRIPTURE_BOOKS, key=len, reverse=True):
        pattern = rf"{re.escape(book)}\s+\d+:\d+(?:[-–]\d+)?"
        for match in re.finditer(pattern, normalized, flags=re.IGNORECASE):
            ref = normalize_text(match.group(0))
            key = ref.lower()
            if key not in seen:
                seen.add(key)
                found.append(ref)
    return found


def make_track_id(title: str, album: str, index: int) -> str:
    return f"{slugify(album or DEFAULT_ALBUM)}__{slugify(title or 'track')}__{index}"


def get_embedded_lyrics(mp3_path: Path) -> str | None:
    """Return embedded USLT lyrics while preserving line breaks for generated LRC files."""
    try:
        tags = ID3(mp3_path)
        preferred_keys = ["USLT::eng"] + [key for key in tags.keys() if key.startswith("USLT") and key != "USLT::eng"]
        for key in preferred_keys:
            if key in tags:
                text = normalize_multiline_lyrics(getattr(tags[key], "text", ""))
                if text:
                    return text
    except Exception:
        pass
    return None


def get_embedded_cover_bytes(mp3_path: Path) -> tuple[bytes, str]:
    """Return the best embedded APIC image payload and extension."""
    try:
        tags = ID3(mp3_path)
    except Exception:
        return b"", ""
    apic_frames = []
    for frame in tags.values():
        if isinstance(frame, APIC) and getattr(frame, "data", None):
            apic_frames.append(frame)
    if not apic_frames:
        return b"", ""
    # Prefer front cover/type 3, otherwise any embedded artwork.
    apic_frames.sort(key=lambda frame: 0 if int(getattr(frame, "type", 0) or 0) == 3 else 1)
    frame = apic_frames[0]
    data = bytes(frame.data or b"")
    mime = normalize_text(str(getattr(frame, "mime", "") or "")).lower()
    if "png" in mime or data.startswith(b"\x89PNG"):
        ext = ".png"
    elif "webp" in mime or data.startswith(b"RIFF"):
        ext = ".webp"
    else:
        ext = ".jpg"
    return data, ext


def extract_embedded_cover_file(mp3_path: Path, slug: str, requested_name: str = "") -> tuple[str, bool]:
    data, ext = get_embedded_cover_bytes(mp3_path)
    if not data:
        return "", False
    raw_requested = normalize_text(str(requested_name or "")).replace("\\", "/").lstrip("/")
    if raw_requested and Path(raw_requested).suffix.lower() in COVER_EXTENSIONS:
        target_name = Path(raw_requested.replace("covers/", "", 1)).name
    else:
        target_name = f"{slugify(slug) or mp3_path.stem}{ext}"
    target = COVERS_DIR / target_name
    COVERS_DIR.mkdir(parents=True, exist_ok=True)
    changed = not target.exists() or target.read_bytes() != data
    if changed:
        target.write_bytes(data)
    return target.name, changed


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



def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build tracks.json incrementally for the Aineo site.")
    parser.add_argument("--analysis-mode", choices=["changed", "missing", "all"], default="changed", help="Deprecated and ignored. Kept for compatibility with older build commands.")
    parser.add_argument("--report-json", action="store_true", help="Write track-build-report.json with a detailed summary.")
    parser.add_argument("--limit", type=int, default=0, help="Only process the first N audio files for targeted testing.")
    parser.add_argument("--verbose", action="store_true", help="Print per-track decisions.")
    parser.add_argument("--replace-all", action="store_true", help="Advanced: rebuild tracks.json from local audio only instead of preserving existing remote tracks.")
    return parser


def summarize_counts(label: str, items: list[str]) -> str:
    preview = ", ".join(items[:5])
    suffix = "" if len(items) <= 5 else f", +{len(items)-5} more"
    return f"{label}: {len(items)}" + (f" ({preview}{suffix})" if items else "")


def main() -> int:
    args = create_parser().parse_args()
    existing_tracks = load_json_file(OUTPUT_FILE, [])
    existing_tracks = existing_tracks if isinstance(existing_tracks, list) else []
    existing_by_src = {str(track.get("src") or track.get("audio") or ""): track for track in existing_tracks if isinstance(track, dict)}
    existing_by_id = {str(track.get("id") or ""): track for track in existing_tracks if isinstance(track, dict) and track.get("id")}
    existing_by_lookup: dict[str, dict[str, Any]] = {}
    for track in existing_tracks:
        if isinstance(track, dict):
            add_lookup_entry(existing_by_lookup, build_existing_track_lookup_keys(track), track)
    track_cache = load_json_file(TRACK_BUILD_CACHE_FILE, {})
    track_cache = track_cache if isinstance(track_cache, dict) else {}
    lrc_map = load_lrc_manifest()
    track_meta_map = load_track_metadata()

    mp3_paths = sorted([p for p in AUDIO_DIR.glob("*.mp3") if p.suffix.lower() in AUDIO_EXTENSIONS], key=lambda p: p.name.lower()) if AUDIO_DIR.exists() else []
    if args.limit and args.limit > 0:
        mp3_paths = mp3_paths[:args.limit]

    tracks_out: list[dict[str, Any]] = []
    new_track_cache: dict[str, Any] = {}
    processed_srcs: set[str] = set()
    processed_ids: set[str] = set()
    processed_lookup_keys: set[str] = set()

    report = {
        "generator_version": GENERATOR_VERSION,
        "analysis_mode": "disabled",
        "audio_found": len(mp3_paths),
        "tracks_written": 0,
        "new_tracks": [],
        "changed_tracks": [],
        "reused_tracks": [],
        "preserved_existing_tracks": [],
        "cover_sources": {},
        "generated_cover_files": [],
        "generated_lyrics_files": [],
        "warnings": [],
    }

    if not mp3_paths:
        report["warnings"].append("No local audio/*.mp3 files found. Existing tracks.json was preserved instead of being overwritten empty.")

    for index, mp3_path in enumerate(mp3_paths, start=1):
        metadata = get_mp3_metadata(mp3_path)
        title = metadata.get("title") or clean_title(mp3_path.name)
        artist = metadata.get("artist") or DEFAULT_ARTIST
        album = metadata.get("album") or DEFAULT_ALBUM
        genre = metadata.get("genre") or ""
        year = int(metadata.get("year") or DEFAULT_YEAR)
        duration_seconds = int(metadata.get("duration_seconds") or 0)
        track_number = metadata.get("track_number") or index
        slug = slugify(title)
        audio_url = build_audio_url(mp3_path.name)
        existing_track = existing_by_src.get(audio_url, {})
        if not existing_track:
            existing_track = find_existing_track_by_lookup(mp3_path.name, title, slug, album, existing_by_lookup)

        override = get_track_override(mp3_path.name, title, slug, track_meta_map)
        title = normalize_text(str(override.get("title") or title))
        artist = normalize_text(str(override.get("artist") or artist or DEFAULT_ARTIST))
        album = normalize_text(str(override.get("album") or album or DEFAULT_ALBUM))
        genre = normalize_text(str(override.get("genre") or genre))
        year = int(override.get("year") or year or DEFAULT_YEAR)
        slug = normalize_text(str(override.get("slug") or slugify(title)))
        track_id = str(override.get("id") or (existing_track.get("id") if isinstance(existing_track, dict) else "") or make_track_id(title, album, index))
        if not existing_track and track_id in existing_by_id:
            existing_track = existing_by_id.get(track_id, {})
        collection = normalize_text(str(override.get("collection") or existing_track.get("collection") or DEFAULT_COLLECTION))
        featured = bool(override.get("featured", existing_track.get("featured", False)))
        playlists = override.get("playlists") or existing_track.get("playlists") or choose_playlists(album)
        tags = override.get("tags") or existing_track.get("tags") or parse_genre_tags(genre)

        lyrics_file = normalize_relative_path(override.get("lyrics_file") or find_lyrics_file(mp3_path.name, title, slug, lrc_map) or existing_track.get("lyrics_file") or "", "lyrics")
        embedded_lyrics = get_embedded_lyrics(mp3_path) or ""
        lyrics = normalize_multiline_lyrics(override.get("lyrics")) or normalize_multiline_lyrics(embedded_lyrics) or normalize_multiline_lyrics(existing_track.get("lyrics") if isinstance(existing_track, dict) else "")
        if lyrics:
            lyrics_path_exists = bool(lyrics_file and not re.match(r"^https?://", lyrics_file, flags=re.IGNORECASE) and (SITE_DIR / lyrics_file).exists())
            if not lyrics_path_exists:
                requested_lyrics_path = override.get("lyrics_file") or override.get("lyricsFile") or lyrics_file or ""
                generated_lyrics_file, lyrics_changed = write_generated_lrc(slug, lyrics, duration_seconds, requested_lyrics_path)
                if generated_lyrics_file:
                    lyrics_file = generated_lyrics_file
                    if lyrics_changed:
                        report["generated_lyrics_files"].append(lyrics_file)
        scripture_refs = override.get("scripture_references") or existing_track.get("scripture_references") or extract_scripture_references(" ".join([lyrics, str(metadata.get("comment") or "")]))
        cover_value, cover_source, cover_changed = choose_cover_value(mp3_path.name, title, slug, override, existing_track if isinstance(existing_track, dict) else {}, mp3_path)
        if cover_changed and cover_value.startswith("covers/"):
            report["generated_cover_files"].append(cover_value)
        added_at = get_audio_added_at(mp3_path, existing_track if isinstance(existing_track, dict) else {}, track_cache.get(mp3_path.name, {}), override)
        updated_at = iso_from_path_mtime(mp3_path)

        previous_sig = {
            "title": existing_track.get("title"), "album": existing_track.get("album"),
            "artist": existing_track.get("artist"), "duration_seconds": existing_track.get("duration_seconds"),
            "cover": existing_track.get("cover"), "lyrics_file": existing_track.get("lyrics_file")
        } if isinstance(existing_track, dict) else {}

        track = {
            "id": track_id,
            "title": title,
            "slug": slug,
            "artist": artist,
            "artist_slug": slugify(artist),
            "album": album,
            "album_slug": slugify(album),
            "genre": genre,
            "year": year,
            "src": audio_url,
            "playlists": playlists if isinstance(playlists, list) else [str(playlists)],
            "tags": tags if isinstance(tags, list) else parse_genre_tags(str(tags)),
            "duration": format_duration(duration_seconds),
            "duration_seconds": duration_seconds,
            "scripture_references": scripture_refs if isinstance(scripture_refs, list) else [str(scripture_refs)],
            "trackNumber": track_number,
            "collection": collection,
            "featured": featured,
            "play_count": existing_track.get("play_count", 0) if isinstance(existing_track, dict) else 0,
            "last_played": existing_track.get("last_played", "") if isinstance(existing_track, dict) else "",
            "date_added": added_at,
            "added_at": added_at,
            "updated_at": updated_at,
            "has_lyrics": bool(lyrics_file or lyrics),
            "has_scripture_refs": bool(scripture_refs),
            "audio": audio_url,
            "playlist": (playlists[0] if isinstance(playlists, list) and playlists else album),
            "scripture": (scripture_refs[0] if isinstance(scripture_refs, list) and scripture_refs else ""),
            "cover": cover_value,
            "cover_file": cover_value if str(cover_value).startswith("covers/") else "",
            "cover_source": cover_source,
            "lyrics": lyrics,
            "lyrics_file": lyrics_file,
        }

        cache_entry = TrackCacheEntry.from_path(mp3_path, duration_seconds)
        new_track_cache[mp3_path.name] = {**cache_entry.to_dict(), "track_id": track_id, "title": title, "album": album, "added_at": added_at, "updated_at": updated_at, "cover": cover_value, "lyrics_file": lyrics_file}
        tracks_out.append(track)
        processed_srcs.add(audio_url)
        processed_ids.add(track_id)
        processed_lookup_keys.update(build_lookup_keys(mp3_path.name, title, slug, f"{album} {title}"))
        report["cover_sources"][track_id] = cover_source

        if not existing_track:
            report["new_tracks"].append(track_id)
        else:
            current_sig = {"title": title, "album": album, "artist": artist, "duration_seconds": duration_seconds, "cover": cover_value, "lyrics_file": lyrics_file}
            changed = previous_sig != current_sig
            if changed:
                report["changed_tracks"].append(track_id)
            else:
                report["reused_tracks"].append(track_id)
        if args.verbose:
            decision = "new" if track_id in report["new_tracks"] else "changed" if track_id in report["changed_tracks"] else "reused"
            print(f"[{decision:7}] {mp3_path.name} -> {track_id} ({cover_source})")

    if not getattr(args, 'replace_all', False):
        for existing in existing_tracks:
            if not isinstance(existing, dict):
                continue
            existing_src = str(existing.get("src") or existing.get("audio") or "")
            existing_id = str(existing.get("id") or "")
            existing_keys = set(build_existing_track_lookup_keys(existing))
            if (existing_src and existing_src in processed_srcs) or (existing_id and existing_id in processed_ids) or existing_keys.intersection(processed_lookup_keys):
                continue
            preserved = dict(existing)
            if not (preserved.get("date_added") or preserved.get("added_at")):
                cached = find_cache_entry_for_existing_track(preserved, track_cache)
                added = cached.get("added_at") or cached.get("date_added") or iso_from_ns(cached.get("mtime_ns")) or fallback_added_at_for_existing_track(preserved)
                if added:
                    preserved["date_added"] = added
                    preserved["added_at"] = added
            tracks_out.append(preserved)
            if existing_id:
                report["preserved_existing_tracks"].append(existing_id)

    def sort_key(item: dict[str, Any]):
        return (normalize_text(item.get("album") or ""), int(item.get("trackNumber") or 9999), normalize_text(item.get("title") or ""))

    tracks_out.sort(key=sort_key)
    report["tracks_written"] = len(tracks_out)

    save_json_file(OUTPUT_FILE, tracks_out)
    write_lrc_manifest_from_tracks(tracks_out)
    save_json_file(TRACK_BUILD_CACHE_FILE, {**track_cache, **new_track_cache})
    if args.report_json:
        save_json_file(BUILD_REPORT_FILE, report)

    print(f"Generator {GENERATOR_VERSION}")
    print("Analysis mode: disabled (legacy argument ignored)")
    print(f"Audio files found: {len(mp3_paths)}")
    print(f"Tracks written: {len(tracks_out)}")
    print(summarize_counts("New tracks", report["new_tracks"]))
    print(summarize_counts("Changed tracks", report["changed_tracks"]))
    print(summarize_counts("Reused tracks", report["reused_tracks"]))
    print(summarize_counts("Preserved existing tracks", report["preserved_existing_tracks"]))
    print(summarize_counts("Generated cover files", report.get("generated_cover_files", [])))
    print(summarize_counts("Generated lyrics files", report.get("generated_lyrics_files", [])))
    if report["warnings"]:
        for warning in report["warnings"]:
            print(f"Warning: {warning}")
    print(f"tracks.json -> {OUTPUT_FILE.name}")
    if args.report_json:
        print(f"build report -> {BUILD_REPORT_FILE.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
