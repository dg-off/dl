# Project Structure

```
dl/
├── data/                          # Pipeline data cache (gitignored large files)
│   ├── all_conversations.json     # Master API response cache (1060+ conversations)
│   ├── reel.json                  # Active reel for Remotion Studio preview
│   ├── portrait-config.json       # Per-character portrait positioning (committed)
│   ├── portrait-tune.json         # Scratch pad for live portrait tweaking in Studio
│   ├── pair_counts.txt            # Speaker-pair usage tracking
│   ├── <convo_id>.json            # Per-conversation audio+metadata cache
│   └── reels/
│       ├── manifest.json          # Dedup manifest — all generated reels + status
│       └── *.json                 # Custom conversation group files (--groups-file input)
│
├── output/
│   ├── json/
│   │   └── reel_NNNN.json        # Generated reel props consumed by Remotion
│   └── mp4/
│       └── *.mp4                  # Rendered videos
│
├── remotion/                      # Remotion project (TypeScript/React)
│   ├── src/
│   │   ├── Root.tsx               # Registers composition; merges portrait configs
│   │   ├── Composition.tsx        # Main composition — all timeline logic
│   │   ├── constants.ts           # Frame timing, layout, color, key normalization
│   │   ├── types.ts               # Core types: DialogueLine, Conversation, Props, etc.
│   │   └── components/
│   │       ├── PortraitCard.tsx   # Character card (blurred bg + portrait + nameplate)
│   │       ├── AudioVisualizer.tsx # SVG waveform with crossfade between lines
│   │       └── backgroundReveal.ts # Spring-based slide-in animation (pure function)
│   ├── public/
│   │   ├── audio/                 # MP3 files served by Remotion
│   │   ├── portraits/             # Character portrait PNGs
│   │   └── quirky_names/          # Hero name PNGs (stylized title cards)
│   └── package.json
│
└── scripts/
    ├── pipeline/
    │   ├── main.py                # Fetch conversations + download audio for one convo
    │   ├── pull_reel.py           # Build data/reel.json from specific convo IDs (Studio)
    │   ├── batch_reels.py         # Batch-generate reel JSONs for all unused convos
    │   └── character_reels.py     # Generate reels for one character's unused convos
    └── assets/
        ├── fetch_reel_audio.py    # Download audio referenced by reel JSON(s)
        ├── download_renders.py    # Download portrait PNGs from wiki
        └── download_quirky_names.py # Download hero name PNGs from wiki
```

---

## Key data files

| File | Written by | Read by | Notes |
|------|-----------|---------|-------|
| `data/all_conversations.json` | `main.py` (on first run) | `main.py`, `batch_reels.py`, `character_reels.py` | Downloaded from API; ~1060 conversations |
| `data/<convo_id>.json` | `main.py` via `build_and_save_conversation` | `batch_reels.py`, `character_reels.py` | Cached per-conversation props with audio durations |
| `data/reel.json` | `pull_reel.py` | Remotion `Root.tsx` | Active Studio preview reel |
| `data/portrait-config.json` | `npm run portrait:save` | Remotion `Root.tsx` | Portrait x/y/scale/rotation per character |
| `data/reels/manifest.json` | `batch_reels.py`, `character_reels.py` | Same scripts | Dedup tracking; append-only in normal operation |
| `output/json/reel_NNNN.json` | `batch_reels.py`, `character_reels.py` | Remotion renderer | Props file for one rendered video |
| `remotion/public/portraits/<key>.png` | `download_renders.py` | Remotion `PortraitCard.tsx` | Key = `toPortraitKey(characterName)` |

---

## Remotion composition architecture

### Timeline model

The entire video is driven by a **single global frame counter** in `Composition.tsx`. Pure helper functions compute state from that frame:

| Helper | Returns |
|--------|---------|
| `getConversationRanges` | `[startFrame, endFrame]` per conversation (drives progress bar) |
| `getFrameStateWithPreroll` | `{ participants, activeSpeaker }` — handles intro pre-roll, per-conversation lead-in, fade-to-black transitions |
| `getActivationEvents` | `{ speakerKey, frame }[]` — fires when speaker changes, triggers portrait slide-in |
| `getActiveLineState` | Current + previous `DialogueLine` + crossfade progress (drives audio visualizer) |
| `getAudioSegments` | `{ from, durationInFrames, src }[]` — maps lines to `<Sequence>` audio blocks |

### Portrait key normalization

Character names from the API (e.g. `"Viper"`, `"Mo"`, `"Doorman"`) are normalized before file lookups:

- `toKey(name)` → lowercase, spaces to underscores
- `toPortraitKey(name)` → applies overrides: `viper→vyper`, `mo/krill→mo_&_krill`, `doorman→the_doorman`
- Portrait: `remotion/public/portraits/<portraitKey>.png`
- Nameplate: `remotion/public/quirky_names/<TitledKey>_name.png` (with `mcginnis` override)

---

## Manifest reel statuses

```
json_only       JSON written, not yet rendered
render_pending  Render queued (--render flag was passed)
rendered        MP4 successfully written
render_failed   Remotion returned non-zero exit code
failed          No valid conversations could be built
```

Long-form reels (`--long-form`) are **not** added to the manifest, keeping those conversations available for future short-form reels.
