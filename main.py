import gzip
import io
import json
import requests
import sys
import os

import mutagen.mp3

# ── Config ──────────────────────────────────────────────────────────────
ALL_CONVOS_URL  = "https://deadlock.vlviewer.com/Games/Deadlock/DeadlockJan2026/all_conversations.json.gz"
AUDIO_BASE      = "https://deadlock.vlviewer.com/Games/Deadlock/DeadlockJan2026/Audio"
DATA_DIR        = "data"
CONVOS_CACHE    = os.path.join(DATA_DIR, "all_conversations.json")
AUDIO_CACHE_DIR = os.path.join("remotion", "public", "audio")

# ── 1. Download the master conversations list ────────────────────────────
def load_all_conversations():
    os.makedirs(DATA_DIR, exist_ok=True)

    if os.path.exists(CONVOS_CACHE):
        print("Loading conversations from cache...")
        with open(CONVOS_CACHE, "r") as f:
            return json.load(f)

    print("Downloading conversations list...")
    r = requests.get(ALL_CONVOS_URL, timeout=30)
    r.raise_for_status()
    convos = json.loads(gzip.decompress(r.content))["conversations"]

    with open(CONVOS_CACHE, "w") as f:
        json.dump(convos, f, indent=2)
    print(f"Cached {len(convos)} conversations to {CONVOS_CACHE}")

    return convos

# ── 2. Find a specific conversation by ID ────────────────────────────────
def find_conversation(all_convos, convo_id):
    for convo in all_convos:
        if convo.get("conversation_id") == convo_id:
            return convo
    raise ValueError(f"Conversation '{convo_id}' not found.")

# ── 3. Fetch audio duration (and cache the file locally) ─────────────────
def get_audio_duration(url: str, filename: str) -> float:
    """Download an MP3 to AUDIO_CACHE_DIR if not already there, return duration."""
    os.makedirs(AUDIO_CACHE_DIR, exist_ok=True)
    local_path = os.path.join(AUDIO_CACHE_DIR, filename)

    if os.path.exists(local_path):
        audio = mutagen.mp3.MP3(local_path)
        return round(audio.info.length, 3)

    r = requests.get(url, timeout=30)
    r.raise_for_status()
    with open(local_path, "wb") as f:
        f.write(r.content)
    audio = mutagen.mp3.MP3(io.BytesIO(r.content))
    return round(audio.info.length, 3)

# ── 4. Build the clean output ─────────────────────────────────────────────
def build_conversation(convo):
    lines = []
    for i, line in enumerate(convo.get("lines", []), 1):
        filename   = line.get("filename", "")
        audio_file = filename.replace(".mp3", "")
        audio_url  = f"audio/{filename}"

        print(f"  [{i}/{len(convo.get('lines', []))}] Fetching/caching: {filename}")
        duration = get_audio_duration(f"{AUDIO_BASE}/{filename}", filename)

        lines.append({
            "order":     line.get("part"),
            "character": line.get("speaker", "Unknown").capitalize(),
            "audioFile": audio_file,
            "audioUrl":  audio_url,
            "text":      line.get("transcription") or "",
            "duration":  duration,
        })

    return {
        "id":    convo["conversation_id"],
        "lines": lines
    }

# ── 5. Build and save (with cache check) ─────────────────────────────────
def build_and_save_conversation(convo):
    out_file = os.path.join(DATA_DIR, f"{convo['conversation_id']}.json")

    if os.path.exists(out_file):
        print(f"Already cached: {out_file}")
        with open(out_file, "r") as f:
            return json.load(f)

    result = build_conversation(convo)
    with open(out_file, "w") as f:
        json.dump(result, f, indent=2)
    print(f"Saved: {out_file}")
    return result

# ── Main ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    convo_id = sys.argv[1] if len(sys.argv) > 1 else None

    all_convos = load_all_conversations()
    print(f"Loaded {len(all_convos)} conversations.")

    if not convo_id:
        print("\nNo conversation ID provided.")
        print("Usage: python main.py <conversation_id>")
        print("\nExample IDs:")
        for c in all_convos[:5]:
            print(f"  {c['conversation_id']}")
        sys.exit(0)

    convo  = find_conversation(all_convos, convo_id)
    result = build_and_save_conversation(convo)

    print(json.dumps(result, indent=2))