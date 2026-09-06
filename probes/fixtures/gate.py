"""Bounded local fixture: keep a tool active while control requests are tested."""
from pathlib import Path
import time

Path("gate-started").write_text("started")
deadline = time.monotonic() + 60
while not Path("gate-release").exists() and time.monotonic() < deadline:
    Path("gate-heartbeat").write_text(str(time.time_ns()))
    time.sleep(0.25)
if not Path("gate-release").exists():
    raise SystemExit("Fixture timed out after 60 seconds; do not restart it.")
Path("gate-finished").write_text("finished")
print("Fixture released. Continue with the latest report instructions.")
