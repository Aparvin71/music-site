import json
import os
import re
from pathlib import Path

SITE_DIR = Path(__file__).resolve().parents[1]
AUDIO_DIR = SITE_DIR / "audio"
OUT_FILE = SITE_DIR / "tracks.json"

# Optional: set these once and reuse for all tracks
DEFAULT_ARTIST = "James Parvin"
DEFAULT_ALBUM = "Singles"
DEFAULT_YEAR = 2026

AUDIO_EXTS = {".mp3", ".m4a", ".wav", ".ogg", ".flac"}

def clean_title(filename: str) -> str:
    """Turn '01 Step Out and Have Faith.mp3' into 'Step Out and Have Faith'."""
    name = Path(filename).stem
    name = re.sub(r"^\s*\d+\s*[-_. ]\s*", "", name)  # remove leading track numbers
    name = name.replace("_", " ").replace(".", " ").strip()
    # collapse multiple spaces
    name = re.sub(r"\s+", " ", name)
    return name

def main():
    if not AUDIO_DIR.exists():
        raise SystemExit(f"Missing folder: {AUDIO_DIR}")

    files = sorted([p for p in AUDIO_DIR.iterdir() if p.suffix.lower() in AUDIO_EXTS])

    tracks = []
    for p in files:
        tracks.append({
            "title": clean_title(p.name),
            "artist": DEFAULT_ARTIST,
            "album": DEFAULT_ALBUM,
            "year": DEFAULT_YEAR,
            # For local/static hosting: relative path
            "audio": f"audio/{p.name}",
            # Optional cover art convention (if you want):
            # "cover": f"covers/{Path(p.name).stem}.jpg",
            "tags": ["worship"]
        })

    OUT_FILE.write_text(json.dumps(tracks, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_FILE} with {len(tracks)} tracks.")

if __name__ == "__main__":
    main()