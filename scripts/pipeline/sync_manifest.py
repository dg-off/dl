"""
sync_manifest.py — Mark any reel as 'rendered' if its MP4 already exists on disk.

Usage:
    python3 scripts/pipeline/sync_manifest.py
"""

import json
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT     = Path(__file__).resolve().parents[2]
MP4_DIR       = REPO_ROOT / "output" / "mp4"
MP4_USED_DIR  = MP4_DIR / "AA_USED_CLIPS"
MANIFEST_PATH = REPO_ROOT / "data" / "reels" / "manifest.json"


def mp4_exists(reel_id: str) -> bool:
    name = f"{reel_id}.mp4"
    return (MP4_DIR / name).exists() or (MP4_USED_DIR / name).exists()


def main():
    if not MANIFEST_PATH.exists():
        print("manifest.json not found.")
        return

    with open(MANIFEST_PATH) as f:
        manifest = json.load(f)

    updated = 0
    for entry in manifest.get("reels", []):
        if entry["status"] != "rendered" and mp4_exists(entry["reel_id"]):
            print(f"  {entry['reel_id']}: {entry['status']} -> rendered")
            entry["status"] = "rendered"
            updated += 1

    if updated:
        manifest["updated_at"] = datetime.now(timezone.utc).isoformat()
        with open(MANIFEST_PATH, "w") as f:
            json.dump(manifest, f, indent=2)
        print(f"\nUpdated {updated} entries.")
    else:
        print("Nothing to update.")


if __name__ == "__main__":
    main()
