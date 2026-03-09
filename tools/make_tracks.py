import json
from pathlib import Path
from urllib.parse import quote

AUDIO_BASE_URL = "https://pub-de889868274142c4924a1b81e51a1d94.r2.dev/audio"


SITE_DIR = Path(__file__).resolve().parents[1]
AUDIO_DIR = SITE_DIR / "audio"
OUTPUT_FILE = SITE_DIR / "tracks.json"

AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg", ".flac"]

DEFAULT_ARTIST = "Allen Parvin"

tracks = []

for file in sorted(AUDIO_DIR.iterdir()):
    if file.is_file() and file.suffix.lower() in AUDIO_EXTENSIONS:
        track = {
            "title": file.stem,
            "artist": DEFAULT_ARTIST,
            "audio": f"{AUDIO_BASE_URL}/{quote(file.name)}"
        }
        tracks.append(track)

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(tracks, f, indent=2)

print("tracks.json created successfully!")