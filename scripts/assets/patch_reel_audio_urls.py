"""
patch_reel_audio_urls.py — Rewrite full HTTPS audioUrl values in reel JSONs to
local relative paths (audio/<filename>.mp3).

Usage:
    python3 scripts/assets/patch_reel_audio_urls.py --reels 1-59
    python3 scripts/assets/patch_reel_audio_urls.py --reels 1-59 --dry-run
"""

import argparse
import json
import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
JSON_DIR = REPO_ROOT / "output" / "json"

HTTPS_PREFIX = "https://"


def parse_reel_numbers(spec: str) -> list[int]:
    numbers = []
    for part in spec.split(","):
        part = part.strip()
        if "-" in part:
            lo, hi = part.split("-", 1)
            numbers.extend(range(int(lo), int(hi) + 1))
        else:
            numbers.append(int(part))
    return numbers


def patch_reel(path: Path, dry_run: bool) -> int:
    """Patch all audioUrl fields in a reel JSON. Returns number of lines patched."""
    with open(path) as f:
        reel = json.load(f)

    patched = 0
    for conv in reel.get("conversations", []):
        for line in conv.get("lines", []):
            url = line.get("audioUrl", "")
            if url.startswith(HTTPS_PREFIX):
                filename = os.path.basename(url)
                line["audioUrl"] = f"audio/{filename}"
                patched += 1

    if patched and not dry_run:
        with open(path, "w") as f:
            json.dump(reel, f, indent=2)

    return patched


def main():
    parser = argparse.ArgumentParser(description="Patch HTTPS audioUrls to local paths in reel JSONs.")
    parser.add_argument("--reels", required=True, metavar="RANGE",
                        help="Reel numbers to patch, e.g. '1-59' or '1,2,3'.")
    parser.add_argument("--dry-run", action="store_true",
                        help="Report what would be changed without writing.")
    args = parser.parse_args()

    numbers = parse_reel_numbers(args.reels)
    total_files = 0
    total_lines = 0

    for n in numbers:
        path = JSON_DIR / f"reel_{n:04d}.json"
        if not path.exists():
            print(f"  SKIP  reel_{n:04d}.json (not found)")
            continue
        patched = patch_reel(path, args.dry_run)
        if patched:
            label = "DRY " if args.dry_run else "    "
            print(f"  {label}reel_{n:04d}.json — {patched} line(s) patched")
            total_files += 1
            total_lines += patched
        else:
            print(f"        reel_{n:04d}.json — already local, skipped")

    print(f"\nDone. {total_files} file(s), {total_lines} line(s) {'would be ' if args.dry_run else ''}patched.")


if __name__ == "__main__":
    main()
