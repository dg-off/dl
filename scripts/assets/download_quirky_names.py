#!/usr/bin/env python3
"""
Download Deadlock wiki stylized hero name images (*_name.png).

Usage:
  python download_quirky_names.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse

import requests

HEROES_URL = "https://deadlock.wiki/Heroes"
OUT_DIR = Path("output/quirky_names")
TIMEOUT = 30


def extract_name_png_urls(html: str) -> list[str]:
    urls: set[str] = set()

    # Match src/href/data-src attributes that contain *_name.png
    attr_pattern = re.compile(
        r"""(?:src|href|data-src)\s*=\s*["']([^"']*?_name\.png[^"']*)["']""",
        re.IGNORECASE,
    )
    for match in attr_pattern.findall(html):
        urls.add(urljoin(HEROES_URL, match))

    # Match srcset entries that contain *_name.png
    srcset_pattern = re.compile(r"""srcset\s*=\s*["']([^"']+)["']""", re.IGNORECASE)
    for srcset in srcset_pattern.findall(html):
        for part in srcset.split(","):
            token = part.strip().split(" ")[0]
            if re.search(r"_name\.png(?:\?|$)", token, re.IGNORECASE):
                urls.add(urljoin(HEROES_URL, token))

    # Match MediaWiki file links: /wiki/File:Something_name.png
    file_link_pattern = re.compile(
        r"""["'](/wiki/File:[^"']*?_name\.png(?:\?[^"']*)?)["']""",
        re.IGNORECASE,
    )
    for path in file_link_pattern.findall(html):
        urls.add(urljoin(HEROES_URL, path))

    return sorted(urls)


def normalize_mediawiki_thumb(url: str) -> str:
    """
    Convert MediaWiki thumb URL to original file URL.
    Example:
      /images/thumb/a/ab/Abrams_name.png/300px-Abrams_name.png
      -> /images/a/ab/Abrams_name.png
    """
    parsed = urlparse(url)
    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) >= 6 and parts[0] == "images" and parts[1] == "thumb":
        original_path = "/" + "/".join(["images", parts[2], parts[3], parts[4]])
        return f"{parsed.scheme}://{parsed.netloc}{original_path}"
    # MediaWiki file description page -> direct file redirect
    if len(parts) >= 2 and parts[0] == "wiki" and parts[1].startswith("File:"):
        file_name = parts[1].split("File:", 1)[1]
        redirect_path = f"/wiki/Special:Redirect/file/{file_name}"
        return f"{parsed.scheme}://{parsed.netloc}{redirect_path}"
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"


def filename_from_url(url: str) -> str:
    parsed = urlparse(url)
    return unquote(parsed.path.split("/")[-1])


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Fetching: {HEROES_URL}")
    response = requests.get(HEROES_URL, timeout=TIMEOUT)
    response.raise_for_status()

    raw_urls = extract_name_png_urls(response.text)
    if not raw_urls:
        print("No *_name.png URLs found on the page.")
        return 1

    final_urls = sorted({normalize_mediawiki_thumb(u) for u in raw_urls})

    print(f"Found {len(final_urls)} quirky name images:")
    for idx, url in enumerate(final_urls, start=1):
        print(f"{idx:02d}. {filename_from_url(url)}")

    downloaded = 0
    skipped = 0
    failed: list[tuple[str, str]] = []

    for url in final_urls:
        name = filename_from_url(url)
        dest = OUT_DIR / name
        if dest.exists():
            skipped += 1
            continue

        try:
            img_resp = requests.get(url, timeout=TIMEOUT)
            img_resp.raise_for_status()
            dest.write_bytes(img_resp.content)
            downloaded += 1
            print(f"Downloaded: {name}")
        except Exception as exc:  # noqa: BLE001
            failed.append((name, str(exc)))
            print(f"FAILED: {name} -> {exc}")

    print("\nSummary")
    print(f"- Output dir: {OUT_DIR.resolve()}")
    print(f"- Total found: {len(final_urls)}")
    print(f"- Downloaded: {downloaded}")
    print(f"- Skipped (already existed): {skipped}")
    print(f"- Failed: {len(failed)}")
    if failed:
        print("\nFailures:")
        for name, err in failed:
            print(f"- {name}: {err}")
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
