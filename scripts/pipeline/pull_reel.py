"""
pull_reel.py — Generate a multi-conversation reel JSON for Remotion.

Usage:
    python pull_reel.py <convo_id_1> <convo_id_2> [convo_id_3 ...]

Output:
    data/reel.json  — matches the Props schema expected by Remotion

Example:
    python pull_reel.py holliday_paradox_convo01 holliday_paradox_convo02 holliday_paradox_convo03
"""

import json
import os
import sys

from main import load_all_conversations, find_conversation, build_and_save_conversation

DATA_DIR = "data"
REEL_OUTPUT = os.path.join(DATA_DIR, "reel.json")


def build_reel(convo_ids: list[str]) -> dict:
    all_convos = load_all_conversations()
    conversations = []
    for convo_id in convo_ids:
        print(f"\n-- Processing: {convo_id}")
        convo = find_conversation(all_convos, convo_id)
        data = build_and_save_conversation(convo)
        conversations.append({
            "conversationId": data["id"],
            "lines": data["lines"],
        })
    return {"conversations": conversations}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pull_reel.py <convo_id_1> <convo_id_2> ...")
        print("\nExample:")
        print("  python pull_reel.py holliday_paradox_convo01 holliday_paradox_convo02 holliday_paradox_convo03")
        sys.exit(1)

    convo_ids = sys.argv[1:]
    print(f"Building reel with {len(convo_ids)} conversation(s): {convo_ids}")

    reel = build_reel(convo_ids)

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(REEL_OUTPUT, "w") as f:
        json.dump(reel, f, indent=2)

    total_lines = sum(len(c["lines"]) for c in reel["conversations"])
    print(f"\nSaved reel to {REEL_OUTPUT} ({len(reel['conversations'])} conversations, {total_lines} lines)")
