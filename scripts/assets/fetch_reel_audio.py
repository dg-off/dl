"""
fetch_reel_audio.py — Download all audio files referenced by one or more reel JSONs.

Usage:
    python fetch_reel_audio.py output/json/reel_0090.json [reel_0091.json ...]
    python fetch_reel_audio.py output/json/reel_009*.json
    python fetch_reel_audio.py --reels 90-99
    python fetch_reel_audio.py --reels 90,91,95

Options:
    --reels RANGE   Reel numbers to fetch (range like 90-99 or comma-separated list).
                    Looks for files in output/json/reel_NNNN.json.
    --force         Re-download files that already exist locally.
"""

import argparse
import json
import os
import sys

import requests

AUDIO_BASE = "https://deadlock.vlviewer.com/Games/Deadlock/DeadlockJan2026/Audio"
AUDIO_CACHE_DIR = os.path.join("remotion", "public", "audio")
JSON_DIR = os.path.join("output", "json")


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


def collect_audio_files(reel_paths: list[str]) -> list[tuple[str, str]]:
    """Return a deduplicated list of (filename, audioUrl-relative-path) pairs."""
    seen: set[str] = set()
    files: list[tuple[str, str]] = []
    for path in reel_paths:
        with open(path) as f:
            reel = json.load(f)
        for conv in reel.get("conversations", []):
            for line in conv.get("lines", []):
                audio_url = line.get("audioUrl", "")
                filename = os.path.basename(audio_url)
                if filename and filename not in seen:
                    seen.add(filename)
                    files.append((filename, audio_url))
    return files


def download_audio(files: list[tuple[str, str]], force: bool) -> None:
    os.makedirs(AUDIO_CACHE_DIR, exist_ok=True)
    total = len(files)
    downloaded = skipped = failed = 0

    for i, (filename, _) in enumerate(files, 1):
        dest = os.path.join(AUDIO_CACHE_DIR, filename)
        label = f"[{i}/{total}]"

        if os.path.exists(dest) and not force:
            print(f"  {label} skip  {filename}")
            skipped += 1
            continue

        url = f"{AUDIO_BASE}/{filename}"
        print(f"  {label} dl    {filename} ...", end=" ", flush=True)
        try:
            resp = requests.get(url, timeout=30)
            resp.raise_for_status()
            with open(dest, "wb") as f:
                f.write(resp.content)
            size_kb = len(resp.content) // 1024
            print(f"ok ({size_kb} KB)")
            downloaded += 1
        except Exception as e:
            print(f"FAILED: {e}")
            failed += 1

    print()
    print(f"Done. {downloaded} downloaded, {skipped} skipped, {failed} failed  (total {total})")
    if failed:
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Download audio files referenced by reel JSON(s)."
    )
    parser.add_argument(
        "files", nargs="*", metavar="REEL_JSON",
        help="Reel JSON file paths to process.",
    )
    parser.add_argument(
        "--reels", metavar="RANGE",
        help="Reel numbers to fetch, e.g. '90-99' or '90,91,95'.",
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Re-download files that already exist locally.",
    )
    args = parser.parse_args()

    reel_paths = list(args.files)

    if args.reels:
        numbers = parse_reel_numbers(args.reels)
        for n in numbers:
            path = os.path.join(JSON_DIR, f"reel_{n:04d}.json")
            if not os.path.exists(path):
                print(f"WARNING: {path} not found, skipping.", file=sys.stderr)
                continue
            reel_paths.append(path)

    if not reel_paths:
        parser.print_help()
        sys.exit(1)

    print(f"Scanning {len(reel_paths)} reel file(s)...")
    files = collect_audio_files(reel_paths)
    print(f"Found {len(files)} unique audio file(s).\n")

    download_audio(files, force=args.force)


if __name__ == "__main__":
    main()
