"""
download_renders.py — Download Deadlock wiki in-game character renders.

Saves high-res PNGs to remotion/public/portraits/ with lowercase-underscore
filenames matching the toPortraitKey() convention used by Remotion.

Usage:
    python download_renders.py           # skip existing files
    python download_renders.py --force   # re-download everything
"""

import os
import sys
import requests

OUTPUT_DIR = os.path.join("remotion", "public", "portraits")
BASE_URL = "https://deadlock.wiki/images"

RENDERS = [
    (f"{BASE_URL}/c/cc/Abrams_Render.png",        "abrams.png"),
    (f"{BASE_URL}/0/04/Apollo_Render.png",         "apollo.png"),
    (f"{BASE_URL}/1/13/Bebop_Render.png",          "bebop.png"),
    (f"{BASE_URL}/7/74/Billy_Render.png",          "billy.png"),
    (f"{BASE_URL}/3/35/Calico_Render.png",         "calico.png"),
    (f"{BASE_URL}/f/fc/Celeste_Render.png",        "celeste.png"),
    (f"{BASE_URL}/7/7f/The_Doorman_Render.png",    "the_doorman.png"),
    (f"{BASE_URL}/5/56/Drifter_Render.png",        "drifter.png"),
    (f"{BASE_URL}/d/d7/Dynamo_Render.png",         "dynamo.png"),
    (f"{BASE_URL}/3/36/Fathom_Render.png",         "fathom.png"),
    (f"{BASE_URL}/e/e8/Graves_Render.png",         "graves.png"),
    (f"{BASE_URL}/6/6e/Grey_Talon_Render.png",     "grey_talon.png"),
    (f"{BASE_URL}/b/b8/Haze_Render.png",           "haze.png"),
    (f"{BASE_URL}/f/fb/Holliday_Render.png",       "holliday.png"),
    (f"{BASE_URL}/e/e6/Infernus_Render.png",       "infernus.png"),
    (f"{BASE_URL}/6/65/Ivy_Render.png",            "ivy.png"),
    (f"{BASE_URL}/1/14/Kelvin_Render.png",         "kelvin.png"),
    (f"{BASE_URL}/2/2c/Lady_Geist_Render.png",     "lady_geist.png"),
    (f"{BASE_URL}/9/9d/Lash_Render.png",           "lash.png"),
    (f"{BASE_URL}/7/78/McGinnis_Render.png",       "mcginnis.png"),
    (f"{BASE_URL}/6/61/Mina_Render.png",           "mina.png"),
    (f"{BASE_URL}/5/51/Mirage_Render.png",         "mirage.png"),
    (f"{BASE_URL}/a/a4/Mo_%26_Krill_Render.png",   "mo_&_krill.png"),
    (f"{BASE_URL}/4/49/Paige_Render.png",          "paige.png"),
    (f"{BASE_URL}/8/8a/Paradox_Render.png",        "paradox.png"),
    (f"{BASE_URL}/c/c9/Pocket_Render.png",         "pocket.png"),
    (f"{BASE_URL}/b/bb/Raven_Render.png",          "raven.png"),
    (f"{BASE_URL}/a/a4/Rem_Render.png",            "rem.png"),
    (f"{BASE_URL}/3/31/Seven_Render.png",          "seven.png"),
    (f"{BASE_URL}/0/01/Shiv_Render.png",           "shiv.png"),
    (f"{BASE_URL}/6/64/Silver_Render.png",         "silver.png"),
    (f"{BASE_URL}/d/d6/Sinclair_Render.png",       "sinclair.png"),
    (f"{BASE_URL}/3/3c/Trapper_Render.png",        "trapper.png"),
    (f"{BASE_URL}/1/15/Venator_Render.png",        "venator.png"),
    (f"{BASE_URL}/c/cb/Victor_Render.png",         "victor.png"),
    (f"{BASE_URL}/c/c1/Vindicta_Render.png",       "vindicta.png"),
    (f"{BASE_URL}/c/c2/Viscous_Render.png",        "viscous.png"),
    (f"{BASE_URL}/0/01/Vyper_Render.png",          "vyper.png"),
    (f"{BASE_URL}/9/94/Warden_Render.png",         "warden.png"),
    (f"{BASE_URL}/9/97/Wraith_Render.png",         "wraith.png"),
    (f"{BASE_URL}/c/cf/Wrecker_Render.png",        "wrecker.png"),
    (f"{BASE_URL}/0/0a/Yamato_Render.png",         "yamato.png"),
]

HEADERS = {
    "User-Agent": "deadlock-shorts-pipeline/1.0 (personal project; downloading wiki renders)"
}


def main():
    force = "--force" in sys.argv

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    total = len(RENDERS)
    skipped = 0
    downloaded = 0
    failed = 0

    for url, filename in RENDERS:
        dest = os.path.join(OUTPUT_DIR, filename)

        if os.path.exists(dest) and not force:
            print(f"  skip  {filename}")
            skipped += 1
            continue

        print(f"  dl    {filename} ...", end=" ", flush=True)
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
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


if __name__ == "__main__":
    main()
