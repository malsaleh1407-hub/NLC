#!/usr/bin/env python3
"""Generate a product photo set with Google Gemini (Nano Banana 2) from a PROMPTS.md file.

Usage:
    GOOGLE_AI_API_KEY=... python3 commercial/generate.py commercial/icon/PROMPTS.md          # every shot
    GOOGLE_AI_API_KEY=... python3 commercial/generate.py commercial/icon/PROMPTS.md 03 05    # re-roll some
    python3 commercial/generate.py commercial/icon/PROMPTS.md --dry-run                      # print prompts only

PROMPTS.md format: a "## Product lock" and a "## House style" blockquote wrapped around every shot, and one
"## `NN-name.png`" section per shot with a "Reference: `file.png`, ..." line and a blockquote prompt.
Reference photos are read from images/products/ and downloaded from nlc.com.sa when missing locally.
Images are saved next to PROMPTS.md under the heading's filename. Standard library only.
"""
import argparse
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS_DIR = ROOT / "images" / "products"
PRODUCTS_URL = "https://nlc.com.sa/images/products/"
API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def parse_prompts(path):
    """Return (product_lock, house_style, shots) where shots = [(filename, [refs], prompt)]."""
    sections = re.split(r"^## ", path.read_text(encoding="utf-8"), flags=re.M)[1:]
    lock = style = ""
    shots = []
    for sec in sections:
        title, _, body = sec.partition("\n")
        quote = " ".join(l[1:].strip() for l in body.splitlines() if l.startswith(">"))
        if title.strip() == "Product lock":
            lock = quote
        elif title.strip() == "House style":
            style = quote
        elif m := re.fullmatch(r"`([\w\-]+\.png)`", title.strip()):
            ref_line = re.search(r"^Reference:(.*)$", body, flags=re.M)
            refs = re.findall(r"`([^`]+)`", ref_line.group(1)) if ref_line else []
            shots.append((m.group(1), refs, quote))
    return lock, style, shots


def load_reference(name):
    local = PRODUCTS_DIR / name
    if local.exists():
        return local.read_bytes()
    with urllib.request.urlopen(PRODUCTS_URL + name, timeout=60) as r:
        return r.read()


def generate(prompt, refs, model, size, key):
    parts = [{"text": prompt}]
    for data in refs:
        parts.append({"inline_data": {"mime_type": "image/png", "data": base64.b64encode(data).decode()}})
    body = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": "16:9", "imageSize": size},
        },
    }
    req = urllib.request.Request(
        API.format(model=model),
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
    )
    with urllib.request.urlopen(req, timeout=300) as r:
        resp = json.load(r)
    for cand in resp.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline:
                return base64.b64decode(inline["data"])
    raise RuntimeError("no image in response: " + json.dumps(resp)[:500])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("prompts", type=Path)
    ap.add_argument("only", nargs="*", help="shot number prefixes to (re)generate, e.g. 01 04")
    ap.add_argument("--model", default="gemini-3.1-flash-image-preview")
    ap.add_argument("--size", default="2K", choices=["1K", "2K", "4K"])
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    lock, style, shots = parse_prompts(args.prompts)
    if args.only:
        shots = [s for s in shots if s[0].split("-")[0] in args.only]
    if not shots:
        sys.exit("no shots found")

    key = os.environ.get("GOOGLE_AI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not key and not args.dry_run:
        sys.exit("set GOOGLE_AI_API_KEY (or GEMINI_API_KEY)")

    failed = 0
    for filename, refs, shot in shots:
        prompt = f"{lock} {shot} {style}".strip()
        if args.dry_run:
            print(f"--- {filename}  (refs: {', '.join(refs)})\n{prompt}\n")
            continue
        out = args.prompts.parent / filename
        print(f"{filename} ...", end=" ", flush=True)
        try:
            image = generate(prompt, [load_reference(r) for r in refs], args.model, args.size, key)
        except (urllib.error.URLError, RuntimeError) as e:
            detail = e.read().decode()[:500] if isinstance(e, urllib.error.HTTPError) else str(e)
            print(f"FAILED: {detail}")
            failed += 1
            continue
        out.write_bytes(image)
        print(f"saved {out.relative_to(ROOT)} ({len(image) // 1024} KB)")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
