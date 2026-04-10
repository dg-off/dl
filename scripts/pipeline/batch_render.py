"""
batch_render.py — Render unrendered reel JSONs to MP4 via Remotion.

Usage:
    python3 scripts/pipeline/batch_render.py            # render 20
    python3 scripts/pipeline/batch_render.py --count 5  # render N

On startup, syncs manifest.json: any reel whose MP4 already exists on disk
(in output/mp4/ or output/mp4/AA_USED_CLIPS/) is marked 'rendered'.
Then renders the first N reels still at status 'json_only'.
Updates manifest status to 'rendered' or 'render_failed' after each reel.
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT     = Path(__file__).resolve().parents[2]
JSON_DIR      = REPO_ROOT / "output" / "json"
MP4_DIR       = REPO_ROOT / "output" / "mp4"
MP4_USED_DIR  = MP4_DIR / "AA_USED_CLIPS"
MANIFEST_PATH = REPO_ROOT / "data" / "reels" / "manifest.json"
REMOTION_DIR  = REPO_ROOT / "remotion"


def load_manifest() -> dict:
    if MANIFEST_PATH.exists():
        with open(MANIFEST_PATH) as f:
            return json.load(f)
    return {"reels": []}


def save_manifest(manifest: dict) -> None:
    manifest["updated_at"] = datetime.now(timezone.utc).isoformat()
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, indent=2)


def mp4_exists(reel_id: str) -> bool:
    name = f"{reel_id}.mp4"
    return (MP4_DIR / name).exists() or (MP4_USED_DIR / name).exists()


def sync_manifest(manifest: dict) -> int:
    """Mark any manifest entry as 'rendered' if its MP4 file already exists on disk.
    Returns the number of entries updated."""
    updated = 0
    for entry in manifest.get("reels", []):
        if entry["status"] != "rendered" and mp4_exists(entry["reel_id"]):
            entry["status"] = "rendered"
            updated += 1
    return updated


def render_reel(reel_id: str) -> bool:
    """Run Remotion render for a single reel. Returns True on success."""
    json_path = f"../output/json/{reel_id}.json"
    mp4_path  = f"../output/mp4/{reel_id}.mp4"
    cmd = [
        "npx", "remotion", "render", "DeadlockShort",
        mp4_path,
        f"--props={json_path}",
    ]
    print(f"\n{'='*60}")
    print(f"Rendering {reel_id} ...")
    print(f"{'='*60}")
    result = subprocess.run(cmd, cwd=REMOTION_DIR)
    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(description="Batch render reel JSONs to MP4.")
    parser.add_argument("--count", type=int, default=20, help="Number of reels to render (default: 20)")
    args = parser.parse_args()

    manifest = load_manifest()

    # Sync manifest against files on disk before doing anything
    synced = sync_manifest(manifest)
    if synced:
        print(f"Synced manifest: marked {synced} already-rendered reels as 'rendered'.")
        save_manifest(manifest)

    # Build index: reel_id -> entry
    reel_index = {entry["reel_id"]: entry for entry in manifest.get("reels", [])}

    # Find reel IDs that have a JSON but are not yet rendered, sorted by number
    json_files = sorted(JSON_DIR.glob("reel_*.json"))
    if not json_files:
        print("No reel JSON files found in output/json/")
        sys.exit(1)

    unrendered = []
    for jf in json_files:
        reel_id = jf.stem
        entry = reel_index.get(reel_id)
        if entry is None or entry["status"] not in ("rendered",):
            # Double-check file existence in case manifest is ahead of reality
            if not mp4_exists(reel_id):
                unrendered.append(reel_id)

    print(f"Found {len(unrendered)} unrendered reels out of {len(json_files)} total.")

    to_render = unrendered[:args.count]
    if not to_render:
        print("Nothing to render.")
        return

    end_label = to_render[-1] if len(to_render) > 1 else ""
    print(f"Will render {len(to_render)}: {to_render[0]}{' ... ' + end_label if end_label else ''}")

    success_count = 0
    fail_count = 0

    for reel_id in to_render:
        ok = render_reel(reel_id)
        status = "rendered" if ok else "render_failed"

        if reel_id in reel_index:
            reel_index[reel_id]["status"] = status
        else:
            manifest.setdefault("reels", []).append({
                "reel_id": reel_id,
                "conversations": [],
                "status": status,
            })
            reel_index[reel_id] = manifest["reels"][-1]

        save_manifest(manifest)

        if ok:
            success_count += 1
            print(f"  OK  {reel_id}")
        else:
            fail_count += 1
            print(f"  FAILED  {reel_id} (continuing)")

    print(f"\nDone. {success_count} succeeded, {fail_count} failed.")


if __name__ == "__main__":
    main()
