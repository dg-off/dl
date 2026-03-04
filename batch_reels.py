"""
batch_reels.py — Split all conversations into groups of 3 and generate a reel
JSON for each group.

Usage:
    python batch_reels.py [options]

Options:
    --group-size N   Conversations per reel (default: 3)
    --limit N        Stop after generating N new reels this run
    --render         Render each reel to MP4 via Remotion after generating its JSON
    --output-dir D   Where to write rendered MP4s (default: output)

Output:
    data/reels/manifest.json      — tracks all assignments (source of truth)
    output/json/reel_0001.json    — reel data consumed by Remotion
    output/json/reel_0002.json
    ...
    output/mp4/reel_0001.mp4      — only with --render

Resume behaviour:
    The manifest records which conversations are already assigned to a reel.
    Re-running the script automatically skips used conversations and continues
    numbering from where it left off — no flags needed.
"""

import argparse
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from main import load_all_conversations, build_and_save_conversation

DATA_DIR      = Path("data")
REELS_DIR     = DATA_DIR / "reels"
MANIFEST_PATH = REELS_DIR / "manifest.json"
OUTPUT_DIR    = Path("output")
JSON_DIR      = OUTPUT_DIR / "json"
MP4_DIR       = OUTPUT_DIR / "mp4"


# ── Manifest ───────────────────────────────────────────────────────────────

def load_manifest() -> dict:
    if MANIFEST_PATH.exists():
        with open(MANIFEST_PATH) as f:
            return json.load(f)
    return {"group_size": None, "reels": []}


def save_manifest(manifest: dict) -> None:
    manifest["updated_at"] = datetime.now(timezone.utc).isoformat()
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, indent=2)


def used_conversation_ids(manifest: dict) -> set[str]:
    ids: set[str] = set()
    for entry in manifest.get("reels", []):
        ids.update(entry.get("conversations", []))
    return ids


# ── Filtering ──────────────────────────────────────────────────────────────

def is_eligible(conv: dict) -> bool:
    """Only include complete conversations with no missing parts and full transcriptions."""
    if not conv.get("is_complete"):
        return False
    if conv.get("missing_parts"):
        return False
    lines = conv.get("lines", [])
    if not lines:
        return False
    return all(line.get("has_transcription") for line in lines)


# ── Grouping ───────────────────────────────────────────────────────────────

def chunked(lst: list, size: int):
    for i in range(0, len(lst), size):
        yield lst[i : i + size]


# ── Per-group processing ──────────────────────────────────────────────────

def process_group(group: list[dict]) -> list[dict]:
    """
    Download/cache each conversation and return Props-compatible dicts.
    Failed conversations are skipped with a warning.
    """
    conversations = []
    for conv_meta in group:
        convo_id = conv_meta["conversation_id"]
        try:
            data = build_and_save_conversation(conv_meta)
            conversations.append({
                "conversationId": data["id"],
                "lines": data["lines"],
            })
        except Exception as exc:
            print(f"  WARNING: skipping {convo_id} -- {exc}")
    return conversations


# ── Rendering ─────────────────────────────────────────────────────────────

def render_reel(reel_path: Path, output_path: Path) -> bool:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "npx", "--prefix", "remotion",
        "remotion", "render", "DeadlockShort",
        str(output_path),
        f"--props={reel_path}",
    ]
    result = subprocess.run(cmd, capture_output=False)
    return result.returncode == 0


# ── Main ──────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Generate reel JSONs for all unused conversation groups."
    )
    parser.add_argument(
        "--group-size", type=int, default=3,
        help="Conversations per reel (default: 3)",
    )
    parser.add_argument(
        "--limit", type=int, default=None,
        help="Stop after generating N new reels this run",
    )
    parser.add_argument(
        "--render", action="store_true",
        help="Render each reel to MP4 via Remotion after generating its JSON",
    )
    parser.add_argument(
        "--output-dir", default="output",
        help="Root output directory (default: output). JSONs go to <dir>/json/, MP4s to <dir>/mp4/",
    )
    args = parser.parse_args()

    REELS_DIR.mkdir(parents=True, exist_ok=True)
    JSON_DIR.mkdir(parents=True, exist_ok=True)
    output_dir = Path(args.output_dir) / "mp4"
    output_dir.mkdir(parents=True, exist_ok=True)

    # ── Load manifest ──────────────────────────────────────────────────────
    manifest = load_manifest()
    already_used = used_conversation_ids(manifest)
    next_reel_num = len(manifest["reels"]) + 1

    if already_used:
        print(f"Manifest: {len(manifest['reels'])} reels already recorded, "
              f"{len(already_used)} conversations already used.")

    # Warn if group size changed since the manifest was created
    if manifest["group_size"] is not None and manifest["group_size"] != args.group_size:
        print(f"WARNING: manifest was created with --group-size {manifest['group_size']}, "
              f"but you passed --group-size {args.group_size}. "
              f"Continuing with {args.group_size}.")
    manifest["group_size"] = args.group_size

    # ── Load + filter conversations ────────────────────────────────────────
    print("Loading conversations...")
    all_convos = load_all_conversations()

    eligible   = [c for c in all_convos if is_eligible(c)]
    unused     = [c for c in eligible if c["conversation_id"] not in already_used]

    print(f"{len(all_convos)} total  |  {len(eligible)} eligible  |  {len(unused)} unused")

    if not unused:
        print("All eligible conversations have already been assigned to reels. Nothing to do.")
        return

    groups = list(chunked(unused, args.group_size))
    # Drop the last group if it's smaller than group_size (incomplete reel)
    if len(groups[-1]) < args.group_size:
        incomplete = groups.pop()
        print(f"Holding back {len(incomplete)} conversation(s) — not enough for a full group yet.")

    total_new = len(groups)
    print(f"{total_new} new reels to generate  ({args.group_size} conversations each)\n")

    if args.limit is not None:
        groups = groups[: args.limit]

    generated = 0
    failed    = 0

    for group in groups:
        reel_num  = next_reel_num
        reel_path = JSON_DIR / f"reel_{reel_num:04d}.json"
        mp4_path  = output_dir / f"reel_{reel_num:04d}.mp4"
        conv_ids  = [c["conversation_id"] for c in group]
        label     = f"[{reel_num:4d}]"

        print(f"{label} {' + '.join(conv_ids)}")

        # ── Build reel JSON ────────────────────────────────────────────────
        conversations = process_group(group)

        if not conversations:
            print(f"  ERROR: no valid conversations, skipping reel.")
            failed += 1
            # Still mark them used so we don't retry endlessly
            manifest["reels"].append({
                "reel_id": f"reel_{reel_num:04d}",
                "conversations": conv_ids,
                "status": "failed",
            })
            save_manifest(manifest)
            next_reel_num += 1
            continue

        reel = {"conversations": conversations}
        with open(reel_path, "w") as f:
            json.dump(reel, f, indent=2)

        total_lines = sum(len(c["lines"]) for c in conversations)
        print(f"  JSON: {reel_path.name}  ({len(conversations)} convos, {total_lines} lines)")

        # ── Update manifest immediately so a crash can't cause reuse ──────
        manifest["reels"].append({
            "reel_id": f"reel_{reel_num:04d}",
            "conversations": conv_ids,
            "status": "render_pending" if args.render else "json_only",
        })
        save_manifest(manifest)
        next_reel_num += 1
        generated += 1

        # ── Optionally render ──────────────────────────────────────────────
        if args.render:
            print(f"  Rendering -> {mp4_path} ...")
            ok = render_reel(reel_path.resolve(), mp4_path.resolve())
            if ok:
                print(f"  Rendered:  {mp4_path}")
                manifest["reels"][-1]["status"] = "rendered"
                save_manifest(manifest)
            else:
                print(f"  ERROR: render failed for reel {reel_num}")
                manifest["reels"][-1]["status"] = "render_failed"
                save_manifest(manifest)
                failed += 1

    # ── Summary ───────────────────────────────────────────────────────────
    print(f"\nDone.")
    print(f"  Generated : {generated}")
    if failed:
        print(f"  Failed    : {failed}")
    print(f"  Manifest  : {MANIFEST_PATH}  ({len(manifest['reels'])} total reels)")


if __name__ == "__main__":
    main()
