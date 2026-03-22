"""
fetch_character_audio.py — Download all audio lines spoken by a specific character.

Usage:
    python scripts/assets/fetch_character_audio.py wraith
    python scripts/assets/fetch_character_audio.py "Lady Geist" --force
    python scripts/assets/fetch_character_audio.py wraith --output-dir /tmp/wraith_audio
"""

import argparse
import os
import re
import sys

import requests

# Allow imports from the repo root regardless of cwd
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from scripts.pipeline.main import load_all_conversations
from scripts.assets.fetch_reel_audio import AUDIO_BASE

SPEAKER_ALIASES = {
    "mo":           "mo&krill",
    "krill":        "mo&krill",
    "mo & krill":   "mo&krill",
    "mo and krill": "mo&krill",
    "viper":        "vyper",
    "doorman":      "the_doorman",
}

DEFAULT_AUDIO_BASE_DIR = os.path.join("data", "audio")


def to_slug(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')


def collect_character_audio(all_convos: list, character_lower: str) -> list[tuple[str, str]]:
    """Return deduplicated (filename, "") pairs for lines spoken by the character."""
    seen: set[str] = set()
    files: list[tuple[str, str]] = []
    for convo in all_convos:
        for line in convo.get("lines", []):
            if line.get("speaker", "").lower() == character_lower:
                filename = line.get("filename", "")
                if filename and filename not in seen:
                    seen.add(filename)
                    files.append((filename, ""))
    return files


def download_audio(files: list[tuple[str, str]], output_dir: str, force: bool) -> None:
    os.makedirs(output_dir, exist_ok=True)
    total = len(files)
    downloaded = skipped = failed = 0

    for i, (filename, _) in enumerate(files, 1):
        dest = os.path.join(output_dir, filename)
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
        description="Download all audio lines spoken by a specific character."
    )
    parser.add_argument("character", help="Character name, e.g. 'wraith' or 'Lady Geist'.")
    parser.add_argument(
        "--force", action="store_true",
        help="Re-download files that already exist locally.",
    )
    parser.add_argument(
        "--output-dir", default=DEFAULT_AUDIO_BASE_DIR, metavar="DIR",
        help=f"Base directory for audio files; character subdir is appended (default: {DEFAULT_AUDIO_BASE_DIR}).",
    )
    args = parser.parse_args()

    character_lower = args.character.strip().lower()
    character_lower = SPEAKER_ALIASES.get(character_lower, character_lower)

    slug = to_slug(character_lower)
    output_dir = os.path.join(args.output_dir, slug)

    all_convos = load_all_conversations()
    print(f"Loaded {len(all_convos)} conversations.")

    files = collect_character_audio(all_convos, character_lower)
    if not files:
        print(f"No lines found for character '{args.character}'.", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(files)} unique audio file(s) for '{args.character}'.")
    print(f"Saving to: {output_dir}\n")
    download_audio(files, output_dir, force=args.force)


if __name__ == "__main__":
    main()
