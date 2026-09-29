#!/usr/bin/env python3
"""Generate the stills for a product commercial with Google Gemini (Nano Banana 2).

The commercial is animated in Remotion from these stills, so no AI video is
generated. Every shot is made image-to-image from the real catalogue photo so
Gemini keeps the actual product instead of inventing one.

    python3 scripts/gemini_stills.py alligator            # all shots, 16:9 + 9:16
    python3 scripts/gemini_stills.py alligator --only hero,office --ratio 16x9
    python3 scripts/gemini_stills.py alligator --print    # prompts for AI Studio, no key needed

Needs GEMINI_API_KEY (or GOOGLE_AI_API_KEY). Model defaults to
gemini-3.1-flash-image-preview; override with GEMINI_IMAGE_MODEL.

Reference photo: public/products/<key>.png, downloaded from the site on first
run if it is missing. Output: public/commercials/<key>/<shot>-<16x9|9x16>.<ext>
Existing stills are kept unless --force is given.
"""

import argparse
import base64
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
MODEL = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image-preview")
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent"
RATIOS = {"16x9": "16:9", "9x16": "9:16"}
FRAMING = {
    "16x9": "Compose for a wide 16:9 frame.",
    "9x16": "Compose for a vertical 9:16 frame, subject centred for a phone screen.",
}
EXT = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}


def reference_photo(key: str, url: str) -> bytes:
    local = ROOT / "public" / "products" / f"{key}.png"
    if local.exists():
        return local.read_bytes()
    try:
        with urllib.request.urlopen(url, timeout=60) as r:
            data = r.read()
    except Exception as e:  # noqa: BLE001 - any failure means the same next step
        sys.exit(f"No reference photo. Copy the catalogue photo to {local} (download of {url} failed: {e})")
    local.parent.mkdir(parents=True, exist_ok=True)
    local.write_bytes(data)
    print(f"Saved reference photo → {local.relative_to(ROOT)}")
    return data


def build_prompt(spec: dict, shot: dict, ratio: str) -> str:
    return " ".join([spec["brand_prefix"], spec["product_lock"], shot["prompt"], FRAMING[ratio], spec["negative"]])


def generate(api_key: str, prompt: str, ref: bytes, ratio: str) -> tuple[bytes, str]:
    body = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"inline_data": {"mime_type": "image/png", "data": base64.b64encode(ref).decode()}},
                    {"text": prompt},
                ],
            }
        ],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": RATIOS[ratio], "imageSize": "2K"},
        },
    }
    req = urllib.request.Request(
        ENDPOINT.format(MODEL),
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                res = json.load(r)
            break
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 503) and attempt < 2:
                time.sleep(10 * (attempt + 1))
                continue
            sys.exit(f"Gemini API error {e.code}: {e.read().decode()[:600]}")
    for cand in res.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            blob = part.get("inlineData") or part.get("inline_data")
            if blob and blob.get("data"):
                return base64.b64decode(blob["data"]), blob.get("mimeType") or blob.get("mime_type") or "image/png"
    raise RuntimeError("No image in Gemini response: " + json.dumps(res)[:600])


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("key", help="product key, e.g. alligator (reads stills/<key>.json)")
    ap.add_argument("--only", help="comma-separated shot ids")
    ap.add_argument("--ratio", choices=[*RATIOS, "both"], default="both")
    ap.add_argument("--force", action="store_true", help="regenerate stills that already exist")
    ap.add_argument("--print", action="store_true", help="print the prompts instead of calling Gemini")
    args = ap.parse_args()

    spec = json.loads((ROOT / "stills" / f"{args.key}.json").read_text())
    shots = spec["shots"]
    if args.only:
        wanted = set(args.only.split(","))
        shots = [s for s in shots if s["id"] in wanted]
    ratios = list(RATIOS) if args.ratio == "both" else [args.ratio]

    if args.print:
        for shot in shots:
            for ratio in ratios:
                print(f"### {shot['id']}-{ratio}  (attach {spec['site_photo']}, aspect {RATIOS[ratio]}, 2K)\n")
                print(build_prompt(spec, shot, ratio) + "\n")
        return

    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_AI_API_KEY")
    if not api_key:
        sys.exit("Set GEMINI_API_KEY (or GOOGLE_AI_API_KEY). Free key: https://aistudio.google.com/apikey")

    ref = reference_photo(args.key, spec["site_photo"])
    out_dir = ROOT / "public" / "commercials" / args.key
    out_dir.mkdir(parents=True, exist_ok=True)

    for shot in shots:
        for ratio in ratios:
            name = f"{shot['id']}-{ratio}"
            if not args.force and any(out_dir.glob(f"{name}.*")):
                print(f"{name:14} kept (use --force to regenerate)")
                continue
            print(f"{name:14} generating with {MODEL} …", end=" ", flush=True)
            data, mime = generate(api_key, build_prompt(spec, shot, ratio), ref, ratio)
            for old in out_dir.glob(f"{name}.*"):
                old.unlink()
            path = out_dir / f"{name}.{EXT.get(mime, 'png')}"
            path.write_bytes(data)
            print(f"→ {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
