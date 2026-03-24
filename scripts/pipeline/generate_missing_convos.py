"""
Generate conversation JSONs for all conversations in all_conversations.json
that don't already have a data/<convo_id>.json file.

No audio download — duration is set to null for all lines.
"""

import json
import os

DATA_DIR = "data"
ALL_CONVOS = os.path.join(DATA_DIR, "all_conversations.json")


def build_conversation_metadata(convo):
    lines = []
    for line in convo.get("lines", []):
        filename = line.get("filename", "")
        audio_file = filename.replace(".mp3", "")
        audio_url = f"audio/{filename}"
        speaker = line.get("speaker", "Unknown")
        lines.append({
            "order": line.get("part"),
            "character": speaker.capitalize(),
            "audioFile": audio_file,
            "audioUrl": audio_url,
            "text": line.get("transcription") or "",
            "duration": None,
        })
    return {
        "id": convo["conversation_id"],
        "lines": lines,
    }


def main():
    with open(ALL_CONVOS) as f:
        all_convos = json.load(f)

    print(f"Total conversations in all_conversations.json: {len(all_convos)}")

    generated = 0
    skipped = 0
    for convo in all_convos:
        convo_id = convo["conversation_id"]
        out_file = os.path.join(DATA_DIR, f"{convo_id}.json")
        if os.path.exists(out_file):
            skipped += 1
            continue
        result = build_conversation_metadata(convo)
        with open(out_file, "w") as f:
            json.dump(result, f, indent=2)
        print(f"Generated: {out_file}")
        generated += 1

    print(f"\nDone. Generated: {generated}, Already existed: {skipped}")
    total = len([f for f in os.listdir(DATA_DIR) if f.endswith(".json") and f != "all_conversations.json" and not f.startswith("reel") and not f.startswith("portrait")])
    print(f"Total conversation JSONs in data/: {total}")


if __name__ == "__main__":
    main()
