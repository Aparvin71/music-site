from pathlib import Path
import runpy

# v43.1.30 wrapper: run the root generator from /tools without duplicating logic.
runpy.run_path(str(Path(__file__).resolve().parents[1] / 'make_tracks.py'), run_name='__main__')
