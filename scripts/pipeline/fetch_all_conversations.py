"""
fetch_all_conversations.py — Bulk-fetch and cache all eligible uncached conversations.

Usage:
    python scripts/pipeline/fetch_all_conversations.py

Options:
    --chunk-size N   Conversations per chunk (default: 20)
    --delay N        Seconds to sleep between chunks (default: 5)
    --limit N        Stop after N conversations total
    --dry-run        Print what would be fetched; no downloads
"""

import argparse
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))

from main import load_all_conversations, build_and_save_conversation
from batch_reels import is_eligible


DATA_DIR = "data"


def main():
    parser = argparse.ArgumentParser(
        description="Bulk-fetch and cache all eligible uncached conversations."
    )
    parser.add_argument(
        "--chunk-size", type=int, default=20,
        help="Conversations per chunk (default: 20)",
    )
    parser.add_argument(
        "--delay", type=int, default=5,
        help="Seconds to sleep between chunks (default: 5)",
    )
    parser.add_argument(
        "--limit", type=int, default=None,
        help="Stop after N conversations total",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Print what would be fetched; no downloads",
    )
    args = parser.parse_args()

    all_convos = load_all_conversations()
    print(f"Loaded {len(all_convos)} conversations.")

    eligible = [c for c in all_convos if is_eligible(c)]
    uncached = [
        c for c in eligible
        if not os.path.exists(os.path.join(DATA_DIR, f"{c['conversation_id']}.json"))
    ]

    skipped = len(eligible) - len(uncached)
    print(f"{len(eligible)} eligible  |  {skipped} already cached  |  {len(uncached)} to fetch")

    if args.limit is not None:
        uncached = uncached[: args.limit]
        print(f"Limiting to {len(uncached)} conversations (--limit {args.limit})")

    if not uncached:
        print("Nothing to fetch.")
        return

    if args.dry_run:
        print(f"\nDry run — would fetch {len(uncached)} conversations:")
        for c in uncached:
            print(f"  {c['conversation_id']}")
        return

    # Split into chunks
    chunks = [uncached[i : i + args.chunk_size] for i in range(0, len(uncached), args.chunk_size)]
    total_chunks = len(chunks)
    total_convos = len(uncached)

    fetched = 0
    failed_ids = []
    convo_offset = 0

    for chunk_idx, chunk in enumerate(chunks, start=1):
        start_n = convo_offset + 1
        end_n   = convo_offset + len(chunk)
        print(f"\nChunk {chunk_idx}/{total_chunks}  (convos {start_n}–{end_n} of {total_convos})")

        for conv in chunk:
            convo_id = conv["conversation_id"]
            try:
                build_and_save_conversation(conv)
                fetched += 1
            except Exception as exc:
                print(f"  ERROR: {convo_id} — {exc}")
                failed_ids.append(convo_id)

        convo_offset += len(chunk)

        # Sleep between chunks (not after the last one)
        if chunk_idx < total_chunks:
            print(f"Sleeping {args.delay}s before next chunk...")
            for remaining in range(args.delay, 0, -1):
                print(f"  {remaining}s", end="\r", flush=True)
                time.sleep(1)
            print()

    # Summary
    print(f"\nDone.")
    print(f"  Fetched  : {fetched}")
    print(f"  Skipped  : {skipped}")
    if failed_ids:
        print(f"  Failed   : {len(failed_ids)}")
        for fid in failed_ids:
            print(f"    {fid}")


if __name__ == "__main__":
    main()
