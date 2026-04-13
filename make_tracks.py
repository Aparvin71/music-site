
import argparse
import json
import re
import shutil
import subprocess
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import quote

import numpy as np
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
ANALYSIS_DIR_NAME = "analysis"
ANALYSIS_MANIFEST_NAME = "analysis-manifest.json"
ANALYSIS_BUILD_CACHE_NAME = "analysis-build-cache.json"
BUILD_REPORT_NAME = "track-build-report.json"
ANALYSIS_VERSION = "v1"
GENERATOR_VERSION = "v43.1.30"
AUDIO_EXTENSIONS = {".mp3"}
WAVEFORM_ENVELOPE_POINTS = 2048
WAVEFORM_FFMPEG_SAMPLE_RATE = 400
WAVEFORM_MIN_SAMPLES = 256
SPECTRUM_FRAME_COUNT = 120
SPECTRUM_BAND_COUNT = 24
SPECTRUM_SAMPLE_RATE = 11025
SPECTRUM_MIN_HZ = 40.0
SPECTRUM_MAX_HZ = 5200.0

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
ANALYSIS_DIR = SITE_DIR / ANALYSIS_DIR_NAME
ANALYSIS_MANIFEST_FILE = SITE_DIR / ANALYSIS_MANIFEST_NAME
ANALYSIS_BUILD_CACHE_FILE = SITE_DIR / ANALYSIS_BUILD_CACHE_NAME
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
BAD_UNICODE_MARKER_RE = re.compile(r"[#\]?u?201[89abcd]|#U201[89ABCD]", re.IGNORECASE)


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


def source_cache_matches(cache_data: dict[str, Any], entry: TrackCacheEntry) -> bool:
    return bool(cache_data) and str(cache_data.get("file_name") or "") == entry.file_name and int(cache_data.get("size") or -1) == entry.size and int(cache_data.get("mtime_ns") or -1) == entry.mtime_ns and int(cache_data.get("duration_seconds") or -1) == entry.duration_seconds


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


def extract_waveform_envelope(mp3_path: Path, target_points: int = WAVEFORM_ENVELOPE_POINTS) -> list[int]:
    command = ["ffmpeg", "-v", "error", "-i", str(mp3_path), "-f", "s16le", "-acodec", "pcm_s16le", "-ac", "1", "-ar", str(WAVEFORM_FFMPEG_SAMPLE_RATE), "-"]
    try:
        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    except Exception as exc:
        print(f"  ffmpeg waveform extraction failed for {mp3_path.name}: {exc}")
        return []
    raw = result.stdout
    if len(raw) < 4:
        return []
    sample_count = len(raw) // 2
    peaks = []
    chunk_size = max(1, sample_count // max(WAVEFORM_MIN_SAMPLES, int(target_points or WAVEFORM_ENVELOPE_POINTS)))
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
        max_abs = max(max_abs, combined)
    normalized = [min(1.0, value / max_abs) for value in peaks] if peaks else []
    smoothed = []
    for idx, value in enumerate(normalized):
        left = normalized[idx - 1] if idx > 0 else value
        right = normalized[idx + 1] if idx + 1 < len(normalized) else value
        smoothed.append(max(0.0, min(1.0, value * 0.62 + left * 0.19 + right * 0.19)))
    points = max(WAVEFORM_MIN_SAMPLES, int(target_points or WAVEFORM_ENVELOPE_POINTS))
    if len(smoothed) > points:
        smoothed = smoothed[:points]
    elif len(smoothed) < points and smoothed:
        smoothed.extend([smoothed[-1]] * (points - len(smoothed)))
    return [int(round(value * 255)) for value in smoothed]


def extract_spectrum_frames(mp3_path: Path, frame_count: int = SPECTRUM_FRAME_COUNT, band_count: int = SPECTRUM_BAND_COUNT, sample_rate: int = SPECTRUM_SAMPLE_RATE) -> list[list[int]]:
    command = ["ffmpeg", "-v", "error", "-i", str(mp3_path), "-f", "s16le", "-acodec", "pcm_s16le", "-ac", "1", "-ar", str(sample_rate), "-"]
    try:
        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    except Exception as exc:
        print(f"  ffmpeg spectrum extraction failed for {mp3_path.name}: {exc}")
        return []
    raw = result.stdout
    if len(raw) < 8:
        return []
    samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32)
    if samples.size < 2048:
        return []
    samples /= 32768.0
    frame_count = max(24, int(frame_count or SPECTRUM_FRAME_COUNT))
    band_count = max(8, int(band_count or SPECTRUM_BAND_COUNT))
    edges = np.geomspace(SPECTRUM_MIN_HZ, min(SPECTRUM_MAX_HZ, sample_rate / 2 - 10), band_count + 1)
    chunks = np.array_split(samples, frame_count)
    n_fft = 2048
    freq_axis = np.fft.rfftfreq(n_fft, d=1.0 / sample_rate)
    frames = []
    for chunk in chunks:
        if chunk.size < 32:
            frames.append(np.zeros(band_count, dtype=np.float32))
            continue
        if chunk.size < n_fft:
            padded = np.zeros(n_fft, dtype=np.float32)
            padded[:chunk.size] = chunk
            windowed = padded * np.hanning(n_fft)
        else:
            start = max(0, (chunk.size - n_fft) // 2)
            trimmed = chunk[start:start+n_fft]
            if trimmed.size < n_fft:
                padded = np.zeros(n_fft, dtype=np.float32)
                padded[:trimmed.size] = trimmed
                trimmed = padded
            windowed = trimmed * np.hanning(n_fft)
        spectrum = np.abs(np.fft.rfft(windowed))
        band_values = np.zeros(band_count, dtype=np.float32)
        for i in range(band_count):
            mask = (freq_axis >= edges[i]) & (freq_axis < edges[i+1])
            if np.any(mask):
                band_slice = spectrum[mask]
                if band_slice.size:
                    band_values[i] = float(np.sqrt(np.mean(np.square(band_slice))))
        frames.append(band_values)
    frame_matrix = np.vstack(frames)
    if not np.any(frame_matrix):
        return []
    compression = np.power(frame_matrix, 0.6)
    reference = np.percentile(compression, 95, axis=0)
    reference[reference <= 1e-6] = np.max(compression) if np.max(compression) > 1e-6 else 1.0
    normalized = np.clip(compression / reference, 0.0, 1.0)
    smoothed = normalized.copy()
    for idx in range(smoothed.shape[0]):
        left = normalized[idx - 1] if idx > 0 else normalized[idx]
        center = normalized[idx]
        right = normalized[idx + 1] if idx + 1 < normalized.shape[0] else normalized[idx]
        smoothed[idx] = left * 0.2 + center * 0.6 + right * 0.2
    shaped = np.clip(np.power(smoothed, 0.82) * 1.12, 0.0, 1.0)
    shaped[:, :3] *= 1.18
    shaped[:, 3:8] *= 1.10
    shaped[:, -4:] *= 0.94
    shaped = np.clip(shaped, 0.0, 1.0)
    return [[int(round(float(value) * 255)) for value in row] for row in shaped]


def build_analysis_file_name(track_id: str) -> str:
    return f"{slugify(track_id)}.json"


def load_existing_analysis(rel_path: str) -> dict[str, Any]:
    if not rel_path:
        return {}
    path = SITE_DIR / rel_path
    return load_json_file(path, {}) if path.exists() else {}


def get_reusable_spectrum_frames(existing_analysis: dict[str, Any], analysis_cache: dict[str, dict[str, Any]], cache_entry: TrackCacheEntry) -> tuple[list[list[int]], bool]:
    existing_frames = existing_analysis.get("spectrum_frames")
    cache_data = analysis_cache.get(cache_entry.file_name, {})
    frames_ok = isinstance(existing_frames, list) and len(existing_frames) > 0 and all(isinstance(frame, list) and len(frame) > 0 for frame in existing_frames)
    if frames_ok and source_cache_matches(cache_data, cache_entry) and str(existing_analysis.get("analysis_version") or "") == ANALYSIS_VERSION:
        return ([[int(round(v)) for v in frame] for frame in existing_frames], True)
    return ([], False)


def write_analysis_file(track: dict[str, Any], waveform_envelope: list[int], spectrum_frames: list[list[int]]) -> str:
    ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
    filename = build_analysis_file_name(track["id"])
    rel_path = f"{ANALYSIS_DIR_NAME}/{filename}"
    payload = {
        "analysis_version": ANALYSIS_VERSION,
        "generator_version": GENERATOR_VERSION,
        "track_id": track["id"],
        "slug": track.get("slug") or "",
        "waveform_envelope": waveform_envelope or [],
        "spectrum_frames": spectrum_frames or [],
        "spectrum_band_count": len(spectrum_frames[0]) if spectrum_frames else 0,
        "spectrum_frame_count": len(spectrum_frames) if spectrum_frames else 0,
    }
    save_json_file(SITE_DIR / rel_path, payload)
    return rel_path


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build tracks.json and split analysis files incrementally.")
    parser.add_argument("--analysis-mode", choices=["changed", "missing", "all"], default="changed", help="How aggressively to generate analysis files.")
    parser.add_argument("--report-json", action="store_true", help="Write track-build-report.json with a detailed summary.")
    parser.add_argument("--limit", type=int, default=0, help="Only process the first N audio files for targeted testing.")
    parser.add_argument("--verbose", action="store_true", help="Print per-track decisions.")
    return parser


def summarize_counts(label: str, items: list[str]) -> str:
    preview = ", ".join(items[:5])
    suffix = "" if len(items) <= 5 else f", +{len(items)-5} more"
    return f"{label}: {len(items)}" + (f" ({preview}{suffix})" if items else "")


def main() -> int:
    args = create_parser().parse_args()
    existing_tracks = load_json_file(OUTPUT_FILE, [])
    existing_tracks = existing_tracks if isinstance(existing_tracks, list) else []
    existing_by_src = {str(track.get("src") or ""): track for track in existing_tracks if isinstance(track, dict)}
    track_cache = load_json_file(TRACK_BUILD_CACHE_FILE, {})
    track_cache = track_cache if isinstance(track_cache, dict) else {}
    analysis_cache = load_json_file(ANALYSIS_BUILD_CACHE_FILE, {})
    analysis_cache = analysis_cache if isinstance(analysis_cache, dict) else {}
    lrc_map = load_lrc_manifest()
    track_meta_map = load_track_metadata()
    analysis_manifest_existing = load_json_file(ANALYSIS_MANIFEST_FILE, {"analysis_version": ANALYSIS_VERSION, "tracks": {}})
    analysis_manifest_tracks = analysis_manifest_existing.get("tracks", {}) if isinstance(analysis_manifest_existing, dict) else {}
    analysis_manifest_out = {"analysis_version": ANALYSIS_VERSION, "generator_version": GENERATOR_VERSION, "tracks": {}}

    mp3_paths = sorted([p for p in AUDIO_DIR.glob("*.mp3") if p.suffix.lower() in AUDIO_EXTENSIONS], key=lambda p: p.name.lower()) if AUDIO_DIR.exists() else []
    if args.limit and args.limit > 0:
        mp3_paths = mp3_paths[:args.limit]

    tracks_out = []
    new_track_cache = {}
    new_analysis_cache = {}
    seen_analysis_paths = set()

    report = {
        "generator_version": GENERATOR_VERSION,
        "analysis_version": ANALYSIS_VERSION,
        "analysis_mode": args.analysis_mode,
        "audio_found": len(mp3_paths),
        "tracks_written": 0,
        "new_tracks": [],
        "changed_tracks": [],
        "reused_tracks": [],
        "analysis_generated": [],
        "analysis_reused": [],
        "analysis_missing": [],
        "warnings": [],
    }

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
        previous_sig = {
            "title": existing_track.get("title"), "album": existing_track.get("album"),
            "artist": existing_track.get("artist"), "duration_seconds": existing_track.get("duration_seconds")
        } if isinstance(existing_track, dict) else {}

        override = get_track_override(mp3_path.name, title, slug, track_meta_map)
        title = normalize_text(str(override.get("title") or title))
        artist = normalize_text(str(override.get("artist") or artist or DEFAULT_ARTIST))
        album = normalize_text(str(override.get("album") or album or DEFAULT_ALBUM))
        genre = normalize_text(str(override.get("genre") or genre))
        slug = slugify(title)
        track_id = str(override.get("id") or existing_track.get("id") or make_track_id(title, album, index))
        collection = normalize_text(str(override.get("collection") or existing_track.get("collection") or DEFAULT_COLLECTION))
        featured = bool(override.get("featured", existing_track.get("featured", False)))
        playlists = override.get("playlists") or existing_track.get("playlists") or choose_playlists(album)
        tags = override.get("tags") or existing_track.get("tags") or parse_genre_tags(genre)
        lyrics_file = normalize_text(str(override.get("lyrics_file") or find_lyrics_file(mp3_path.name, title, slug, lrc_map) or existing_track.get("lyrics_file") or ""))
        lyrics = normalize_text(str(override.get("lyrics") or existing_track.get("lyrics") or get_embedded_lyrics(mp3_path) or ""))
        scripture_refs = override.get("scripture_references") or existing_track.get("scripture_references") or extract_scripture_references(" ".join([lyrics, str(metadata.get("comment") or "")]))
        cover_value = normalize_text(str(override.get("cover") or existing_track.get("cover") or build_cover_url(f"{slug}.jpg")))

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
            "playlists": playlists,
            "tags": tags,
            "duration": format_duration(duration_seconds),
            "duration_seconds": duration_seconds,
            "scripture_references": scripture_refs,
            "trackNumber": track_number,
            "collection": collection,
            "featured": featured,
            "play_count": existing_track.get("play_count", 0),
            "last_played": existing_track.get("last_played", ""),
            "has_lyrics": bool(lyrics_file or lyrics),
            "has_scripture_refs": bool(scripture_refs),
            "audio": audio_url,
            "playlist": playlists[0] if playlists else album,
            "scripture": scripture_refs[0] if scripture_refs else "",
            "cover": cover_value,
            "lyrics": lyrics,
            "lyrics_file": lyrics_file,
        }

        cache_entry = TrackCacheEntry.from_path(mp3_path, duration_seconds)
        new_track_cache[mp3_path.name] = {**cache_entry.to_dict(), "track_id": track_id, "title": title, "album": album}
        existing_analysis_rel = normalize_text(str(existing_track.get("analysis_file") or analysis_manifest_tracks.get(track_id, {}).get("analysis_file") or ""))
        existing_analysis = load_existing_analysis(existing_analysis_rel)

        waveform = []
        waveform_reused = False
        prev_track_cache = track_cache.get(mp3_path.name, {})
        prev_analysis_cache = analysis_cache.get(mp3_path.name, {})
        if isinstance(existing_analysis, dict):
            existing_waveform = existing_analysis.get("waveform_envelope")
            if isinstance(existing_waveform, list) and len(existing_waveform) >= WAVEFORM_MIN_SAMPLES and source_cache_matches(prev_track_cache, cache_entry):
                waveform = [int(round(v)) for v in existing_waveform]
                waveform_reused = True
        if not waveform:
            waveform = extract_waveform_envelope(mp3_path)

        spectrum, spectrum_reused = get_reusable_spectrum_frames(existing_analysis, analysis_cache, cache_entry)
        analysis_path_existing = existing_analysis_rel and (SITE_DIR / existing_analysis_rel).exists()
        should_generate = False
        if args.analysis_mode == "all":
            should_generate = True
        elif args.analysis_mode == "missing":
            should_generate = not analysis_path_existing
        else:
            should_generate = not spectrum_reused or not waveform_reused or not analysis_path_existing
        if should_generate and not spectrum:
            spectrum = extract_spectrum_frames(mp3_path)
        analysis_rel_path = existing_analysis_rel if analysis_path_existing and not should_generate else write_analysis_file(track, waveform, spectrum)
        if should_generate:
            report["analysis_generated"].append(track_id)
        else:
            report["analysis_reused"].append(track_id)

        new_analysis_cache[mp3_path.name] = {
            **cache_entry.to_dict(),
            "track_id": track_id,
            "analysis_file": analysis_rel_path,
            "analysis_version": ANALYSIS_VERSION,
            "waveform_point_count": len(waveform),
            "spectrum_frame_count": len(spectrum),
            "spectrum_band_count": len(spectrum[0]) if spectrum else 0,
        }

        track["analysis_file"] = analysis_rel_path
        track["analysis_version"] = ANALYSIS_VERSION
        track["has_analysis"] = bool(analysis_rel_path)
        track["waveform_point_count"] = len(waveform)
        track["spectrum_band_count"] = len(spectrum[0]) if spectrum else 0
        track["spectrum_frame_count"] = len(spectrum)
        analysis_manifest_out["tracks"][track_id] = {
            "analysis_file": analysis_rel_path,
            "analysis_version": ANALYSIS_VERSION,
            "waveform_point_count": len(waveform),
            "spectrum_frame_count": len(spectrum),
            "spectrum_band_count": len(spectrum[0]) if spectrum else 0,
        }
        seen_analysis_paths.add(analysis_rel_path)
        tracks_out.append(track)

        if not existing_track:
            report["new_tracks"].append(track_id)
        else:
            changed = previous_sig != {"title": title, "album": album, "artist": artist, "duration_seconds": duration_seconds}
            if changed:
                report["changed_tracks"].append(track_id)
            else:
                report["reused_tracks"].append(track_id)
        if args.verbose:
            decision = "new" if track_id in report["new_tracks"] else "changed" if track_id in report["changed_tracks"] else "reused"
            analysis_decision = "generated" if track_id in report["analysis_generated"] else "reused"
            print(f"[{decision:7}] {mp3_path.name} -> {track_id} | analysis={analysis_decision}")

    # prune stale analysis files that are no longer referenced
    if ANALYSIS_DIR.exists():
        removed = []
        for file_path in ANALYSIS_DIR.glob("*.json"):
            rel = f"{ANALYSIS_DIR_NAME}/{file_path.name}"
            if rel not in seen_analysis_paths:
                file_path.unlink()
                removed.append(rel)
        if removed:
            report["warnings"].append(f"Removed {len(removed)} stale analysis files.")

    tracks_out.sort(key=lambda item: (normalize_text(item.get("album") or ""), int(item.get("trackNumber") or 0), normalize_text(item.get("title") or "")))
    report["tracks_written"] = len(tracks_out)

    save_json_file(OUTPUT_FILE, tracks_out)
    save_json_file(TRACK_BUILD_CACHE_FILE, new_track_cache)
    save_json_file(ANALYSIS_BUILD_CACHE_FILE, new_analysis_cache)
    save_json_file(ANALYSIS_MANIFEST_FILE, analysis_manifest_out)
    if args.report_json:
        save_json_file(BUILD_REPORT_FILE, report)

    print(f"Generator {GENERATOR_VERSION}")
    print(f"Analysis mode: {args.analysis_mode}")
    print(f"Audio files found: {len(mp3_paths)}")
    print(f"Tracks written: {len(tracks_out)}")
    print(summarize_counts("New tracks", report["new_tracks"]))
    print(summarize_counts("Changed tracks", report["changed_tracks"]))
    print(summarize_counts("Reused tracks", report["reused_tracks"]))
    print(summarize_counts("Analysis generated", report["analysis_generated"]))
    print(summarize_counts("Analysis reused", report["analysis_reused"]))
    if report["warnings"]:
        for warning in report["warnings"]:
            print(f"Warning: {warning}")
    print(f"tracks.json -> {OUTPUT_FILE.name}")
    print(f"analysis manifest -> {ANALYSIS_MANIFEST_FILE.name}")
    if args.report_json:
        print(f"build report -> {BUILD_REPORT_FILE.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
