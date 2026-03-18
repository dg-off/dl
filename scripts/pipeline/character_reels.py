"""
character_reels.py — Generate reel JSONs for all unused conversations involving
a specified character.

Usage:
    python character_reels.py <character> [options]

Arguments:
    character           Character name (case-insensitive, e.g. "wraith", "Lady Geist")

Options:
    --list              Print available unused conversations and exit (no files written)
    --limit N           Max conversations to include (default: all)
    --group-size N      Conversations per reel (default: 3)
    --long-form         Put all conversations in a single reel JSON (ignores group-size)
    --render            Render each reel to MP4 via Remotion after generating its JSON
    --output-dir D      Root output directory (default: output)
    --include-used      Include conversations already tracked in the manifest

Examples:
    python character_reels.py wraith --list
    python character_reels.py wraith
    python character_reels.py wraith --limit 9
    python character_reels.py wraith --long-form
    python character_reels.py "Lady Geist" --render
    python character_reels.py wraith --include-used
"""

import argparse
import json
from pathlib import Path

from main import load_all_conversations
from batch_reels import (
    is_eligible,
    load_manifest,
    save_manifest,
    used_conversation_ids,
    render_reel,
    process_group,
    chunked,
    REELS_DIR,
)

JSON_DIR_DEFAULT = Path("output") / "json"
MP4_DIR_DEFAULT = Path("output") / "mp4"


def filter_by_character(all_convos: list[dict], character_name: str) -> list[dict]:
    """Return conversations that include at least one line spoken by the character."""
    name_lower = character_name.strip().lower()
    return [
        conv for conv in all_convos
        if any(line.get("speaker", "").lower() == name_lower for line in conv.get("lines", []))
    ]


def main():
    parser = argparse.ArgumentParser(
        description="Generate reel JSONs for all unused conversations involving a character."
    )
    parser.add_argument(
        "character",
        help="Character name (case-insensitive, e.g. 'wraith', 'Lady Geist')",
    )
    parser.add_argument(
        "--list", action="store_true",
        help="Print available conversations and exit (no files written)",
    )
    parser.add_argument(
        "--limit", type=int, default=None,
        help="Max conversations to include",
    )
    parser.add_argument(
        "--group-size", type=int, default=3,
        help="Conversations per reel (default: 3)",
    )
    parser.add_argument(
        "--long-form", action="store_true",
        help="Put all conversations in a single reel JSON (ignores --group-size)",
    )
    parser.add_argument(
        "--render", action="store_true",
        help="Render each reel to MP4 via Remotion after generating its JSON",
    )
    parser.add_argument(
        "--output-dir", default="output",
        help="Root output directory (default: output)",
    )
    parser.add_argument(
        "--include-used", action="store_true",
        help="Include conversations already tracked in the manifest",
    )
    args = parser.parse_args()

    # ── Load manifest ──────────────────────────────────────────────────────
    manifest = load_manifest()
    already_used = used_conversation_ids(manifest)

    # Derive next reel number from both the manifest and existing files on disk,
    # so long-form reels (which don't update the manifest) don't get overwritten.
    json_dir_probe = Path(args.output_dir) / "json"
    existing_nums = {
        int(p.stem.split("_")[-1])
        for p in json_dir_probe.glob("reel_*.json")
        if p.stem.split("_")[-1].isdigit()
    } if json_dir_probe.exists() else set()
    manifest_next = len(manifest["reels"]) + 1
    next_reel_num = max([manifest_next] + list(existing_nums)) + 1 if existing_nums else manifest_next

    # ── Load + filter conversations ────────────────────────────────────────
    print("Loading conversations...")
    all_convos = load_all_conversations()

    eligible = [c for c in all_convos if is_eligible(c)]
    char_convos = filter_by_character(eligible, args.character)

    if not char_convos:
        print(f"No eligible conversations found for character: '{args.character}'")
        return

    if args.include_used:
        candidate_convos = char_convos
    else:
        candidate_convos = [c for c in char_convos if c["conversation_id"] not in already_used]

    if args.limit is not None:
        candidate_convos = candidate_convos[: args.limit]

    print(
        f"Character '{args.character}': "
        f"{len(char_convos)} eligible  |  {len(candidate_convos)} available"
    )

    if not candidate_convos:
        print("All eligible conversations for this character are already used. Nothing to do.")
        return

    # ── List mode ──────────────────────────────────────────────────────────
    if args.list:
        print(f"\nAvailable conversations ({len(candidate_convos)}):")
        for conv in candidate_convos:
            speakers = sorted({line.get("speaker", "") for line in conv.get("lines", [])})
            print(f"  {conv['conversation_id']}  [{', '.join(speakers)}]")
        return

    # ── Build groups ───────────────────────────────────────────────────────
    json_dir = Path(args.output_dir) / "json"
    mp4_dir = Path(args.output_dir) / "mp4"
    REELS_DIR.mkdir(parents=True, exist_ok=True)
    json_dir.mkdir(parents=True, exist_ok=True)
    mp4_dir.mkdir(parents=True, exist_ok=True)

    if args.long_form:
        groups = [{"long_form": True, "conversations": candidate_convos}]
        print(f"Long-form mode: 1 reel with {len(candidate_convos)} conversations\n")
    else:
        raw_groups = list(chunked(candidate_convos, args.group_size))
        # Drop last group if incomplete
        if raw_groups and len(raw_groups[-1]) < args.group_size:
            held = raw_groups.pop()
            print(
                f"Holding back {len(held)} conversation(s) — "
                "not enough for a full group yet."
            )
        if not raw_groups:
            print("Not enough conversations for a full group. Use --long-form or --limit.")
            return
        groups = [{"long_form": False, "conversations": g} for g in raw_groups]
        print(f"{len(groups)} reel(s) to generate  ({args.group_size} conversations each)\n")

    generated = 0
    failed = 0

    for group in groups:
        reel_num = next_reel_num
        reel_path = json_dir / f"reel_{reel_num:04d}.json"
        mp4_path = mp4_dir / f"reel_{reel_num:04d}.mp4"
        conv_ids = [c["conversation_id"] for c in group["conversations"]]
        label = f"[{reel_num:4d}]"

        print(f"{label} {' + '.join(conv_ids)}")

        # ── Build reel JSON ────────────────────────────────────────────────
        conversations = process_group(group["conversations"])

        if not conversations:
            print(f"  ERROR: no valid conversations, skipping reel.")
            failed += 1
            if not group["long_form"]:
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

        # ── Update manifest (normal mode only; long-form stays untracked) ──
        if not group["long_form"]:
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
                if not group["long_form"]:
                    manifest["reels"][-1]["status"] = "rendered"
                    save_manifest(manifest)
            else:
                print(f"  ERROR: render failed for reel {reel_num}")
                if not group["long_form"]:
                    manifest["reels"][-1]["status"] = "render_failed"
                    save_manifest(manifest)
                failed += 1

    # ── Summary ───────────────────────────────────────────────────────────
    print(f"\nDone.")
    print(f"  Character : {args.character}")
    print(f"  Generated : {generated}")
    if failed:
        print(f"  Failed    : {failed}")
    if not args.long_form:
        print(f"  Manifest  : data/reels/manifest.json  ({len(manifest['reels'])} total reels)")
    else:
        print(f"  Note: long-form reel is NOT tracked in the manifest.")


if __name__ == "__main__":
    main()
