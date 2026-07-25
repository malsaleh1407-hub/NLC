#!/usr/bin/env python3
"""
Recover the dead /storage/ photos and rebuild them as a drop-in folder.

The site still asks for images at the old CMS location:

    https://nlc.com.sa/storage/team/images/01KFJ93RV6S0T3S1XY9HVE47A9.png

That path used to be served by the previous Laravel site. It no longer exists,
so every one of those images 404s — which is why the leadership team shows
initials in circles and the news cards are blank.

Rather than rewrite 31 URLs across the HTML (which the CMS would overwrite the
next time anyone saves), this rebuilds the folder those URLs already point at.
Upload the result to public_html and every dead URL starts working again, with
no edits to the site at all.

Sources tried per image, in order:
  1. the live server, in case the old folder partly survived
  2. the Wayback Machine, across several snapshot dates

Usage
-----
    python3 recover_storage_photos.py --site ~/Documents/Claude/Projects/Website

    # or point it at a single file
    python3 recover_storage_photos.py --site . --only index.html

Output: ./storage-recovered/storage/...  ready to zip and upload.
Requires Python 3.8+. No third-party packages.
"""

from __future__ import annotations

import argparse
import re
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

STORAGE_URL = re.compile(
    r"https?://(?:www\.)?nlc\.com\.sa/storage/"
    r"([^\s\"'<>)]+\.(?:png|jpe?g|gif|svg|webp|ico))",
    re.I,
)

# Wayback keeps snapshots by date. The old site was replaced during 2026, so
# try recent captures first and walk backwards.
WAYBACK_STAMPS = ["2026", "20251201", "20250601", "20240101"]

UA = {"User-Agent": "Mozilla/5.0 (compatible; NLC site migration)"}


def find_urls(site: Path, only: str | None) -> dict[str, set[str]]:
    """Map each /storage/ tail -> the files that reference it."""
    found: dict[str, set[str]] = {}

    targets = [site / only] if only else sorted(site.rglob("*.html"))

    for f in targets:
        if not f.is_file():
            continue
        # admin.html holds JS placeholder strings, not real URLs; the regex
        # requires a real image extension so those are skipped anyway.
        text = f.read_text(encoding="utf-8", errors="ignore")
        for m in STORAGE_URL.finditer(text):
            found.setdefault(m.group(1), set()).add(f.name)

    return found


def fetch(url: str, timeout: int = 25) -> bytes | None:
    ctx = ssl.create_default_context()
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
            if r.status != 200:
                return None
            data = r.read()
        # Anything this small is an error page, not a photo.
        return data if len(data) > 200 else None
    except Exception:
        return None


def recover(tail: str, out_root: Path) -> tuple[bool, str]:
    """Try every source for one image. Returns (success, where-from)."""
    dest = out_root / "storage" / urllib.parse.unquote(tail)

    if dest.exists() and dest.stat().st_size > 200:
        return True, "already had it"

    original = "https://nlc.com.sa/storage/" + tail

    data = fetch(original)
    source = "live server"

    if data is None:
        for stamp in WAYBACK_STAMPS:
            data = fetch(f"https://web.archive.org/web/{stamp}id_/{original}")
            if data is not None:
                source = f"web archive {stamp}"
                break

    if data is None:
        return False, ""

    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return True, source


def main() -> int:
    ap = argparse.ArgumentParser(description="Recover dead /storage/ photos.")
    ap.add_argument("--site", required=True, type=Path, help="Website folder")
    ap.add_argument("--only", help="Scan a single file instead of the whole folder")
    ap.add_argument("--out", type=Path, default=Path("storage-recovered"),
                    help="Where to build the folder (default ./storage-recovered)")
    args = ap.parse_args()

    site = args.site.expanduser().resolve()
    if not site.is_dir():
        print(f"ERROR: not a folder: {site}")
        return 1

    out = args.out.expanduser().resolve()

    urls = find_urls(site, args.only)
    if not urls:
        print("No /storage/ URLs found — nothing to recover.")
        return 0

    print(f"\nFound {len(urls)} dead image URL(s) referenced by the site.\n")
    print("Trying the live server, then the Wayback Machine. This is slow —")
    print("roughly 10-30 seconds per image that has to fall through.\n")
    print("=" * 70)

    got: list[str] = []
    lost: dict[str, set[str]] = {}

    for i, (tail, refs) in enumerate(sorted(urls.items()), 1):
        print(f"[{i}/{len(urls)}] {tail[:58]:<58}", end=" ", flush=True)
        ok, source = recover(tail, out)
        if ok:
            print(f"OK  ({source})")
            got.append(tail)
        else:
            print("not found")
            lost[tail] = refs

    # ---- Summary ----------------------------------------------------------
    print("=" * 70)
    print(f"\nRecovered : {len(got)}")
    print(f"Missing   : {len(lost)}\n")

    if got:
        print(f"Built: {out}/storage/\n")
        print("To install:")
        print(f"  1. In Finder, compress the 'storage' folder inside {out.name}")
        print("  2. cPanel File Manager -> public_html -> Upload the zip")
        print("  3. Right-click it -> Extract -> into /public_html")
        print("  4. Delete the zip")
        print("\nThat recreates the exact path the site is already asking for,")
        print("so the photos start working with no changes to the site itself.\n")

    if lost:
        print("These could not be recovered from anywhere and need to be")
        print("re-supplied by hand (from HR, marketing, or the photographer):\n")
        for tail, refs in sorted(lost.items()):
            print(f"  storage/{tail}")
            print(f"      used on: {', '.join(sorted(refs))}")
        print("\nDrop each one into the matching folder under")
        print(f"  {out}/storage/")
        print("keeping the exact filename, then upload as above.\n")

    return 0


if __name__ == "__main__":
    sys.exit(main())
