#!/usr/bin/env python3
"""Build an NLC product commercial from Gemini-generated stills.

No AI video: Gemini paints one still per shot (using the real product photo as
reference), then this script animates the stills with slow camera moves,
crossfades, NLC captions and a branded end card, and encodes an MP4.

    python3 commercials/make_commercial.py solid stills   # Gemini -> commercials/solid/stills/
    python3 commercials/make_commercial.py solid video    # stills -> commercials/solid/out/solid-commercial.mp4
    python3 commercials/make_commercial.py solid all      # both

Needs: Python 3.9+, Pillow, ffmpeg (on PATH, or `pip install imageio-ffmpeg`),
and GEMINI_API_KEY (or GOOGLE_API_KEY) for the stills step.
Each product lives in commercials/<key>/shots.json.
"""

import argparse
import base64
import io
import json
import math
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
HERE = Path(__file__).resolve().parent
FONTS = HERE / "assets" / "fonts"

W, H = 1920, 1080
NAVY = (36, 40, 94)          # #24285E
NAVY_DEEP = (15, 18, 53)     # #0F1235
ORANGE = (246, 133, 31)      # #F6851F
MARK_ORANGE = (244, 131, 31) # #F4831F, as in the master logo artwork
WHITE = (255, 255, 255)

CROSSFADE = 0.8   # seconds between shots
FADE_IN = 0.8     # from black at the very start

# Master NLC mark, copied untouched from NLC-Brand-Guidelines-source.html.
MARK_PATH = (
    "M37.6363 30.6709V35.1239L27.2574 25.0325C26.6924 24.4601 26.2386 23.802 25.9139 23.0764C25.5891 22.3553 "
    "25.3934 21.5981 25.3355 20.8273C25.3044 20.4983 25.2911 20.1558 25.2911 19.7862C25.2911 18.8397 25.3934 "
    "17.8797 25.5936 16.9287L25.687 16.496L25.2599 16.5952C24.0009 16.8791 22.7108 16.9648 21.4162 16.8566C20.5487 "
    "16.7935 19.7079 16.5501 18.9116 16.1354L18.8493 16.1084C18.271 15.7974 17.7416 15.3963 17.27 14.914L12.3319 "
    "9.85704V9.82549L10.5124 7.96406L2.67369 0.0135213H7.38045C7.5584 0.0135213 7.7319 0.085635 7.86092 "
    "0.216341L21.9412 14.5805L21.9278 0.0135213L25.3622 0V14.3867L37.5518 2.0282V6.81925C37.5518 7.00404 37.4806 "
    "7.17531 37.356 7.30602L27.8402 16.9512L37.5117 16.9377V20.5344H27.8268L37.4361 30.1841C37.5651 30.3148 "
    "37.6363 30.4906 37.6363 30.6709Z"
)

# Camera moves: (centre_x, centre_y, zoom) at start -> end, in source-relative units.
MOVES = {
    "push_in":   ((0.50, 0.50, 1.00), (0.50, 0.50, 1.12)),
    "pull_out":  ((0.50, 0.50, 1.12), (0.50, 0.50, 1.00)),
    "pan_right": ((0.44, 0.50, 1.10), (0.56, 0.50, 1.10)),
    "pan_left":  ((0.56, 0.50, 1.10), (0.44, 0.50, 1.10)),
    "rise":      ((0.50, 0.58, 1.10), (0.50, 0.42, 1.10)),
}


def rel(p):
    p = Path(p).resolve()
    return p.relative_to(ROOT) if p.is_relative_to(ROOT) else p


def font(weight, size):
    return ImageFont.truetype(str(FONTS / f"Outfit-{weight}.ttf"), size)


# --------------------------------------------------------------------------- Gemini

API = "https://generativelanguage.googleapis.com/v1beta"


class GeminiError(RuntimeError):
    def __init__(self, status, body):
        super().__init__(f"Gemini API {status}: {body}")
        self.status = status


def _api(key, method, path, body=None, timeout=300):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"{API}/{path}", data=data, method=method,
        headers={"x-goog-api-key": key, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise GeminiError(e.code, e.read().decode(errors="replace")[:800]) from None


def pick_model(key):
    """Newest Gemini image model: highest major version, Pro before Flash."""
    names, token = [], ""
    while True:
        page = _api(key, "GET", "models?pageSize=1000" + (f"&pageToken={token}" if token else ""))
        for m in page.get("models", []):
            name = m["name"].split("/", 1)[-1]
            if ("image" in name and "imagen" not in name
                    and "generateContent" in m.get("supportedGenerationMethods", [])):
                names.append(name)
        token = page.get("nextPageToken")
        if not token:
            break
    if not names:
        sys.exit("No Gemini image model is available to this API key.")

    def rank(name):
        v = re.search(r"gemini-(\d+)(?:\.(\d+))?", name)
        major, minor = (int(v.group(1)), int(v.group(2) or 0)) if v else (0, 0)
        return (major, "pro" in name, minor, "preview" not in name)

    return max(names, key=rank)


def _reference_parts(refs):
    parts = []
    for p in refs:
        mime = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                ".webp": "image/webp"}.get(p.suffix.lower(), "image/png")
        parts.append({"inline_data": {"mime_type": mime,
                                      "data": base64.b64encode(p.read_bytes()).decode()}})
    return parts


# Tried in order; the first config the model accepts is reused for later shots.
GEN_CONFIGS = [
    {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "16:9", "imageSize": "2K"}},
    {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "16:9"}},
    {"responseModalities": ["TEXT", "IMAGE"]},
]


def generate_still(key, model, refs, prompt, state):
    body = {"contents": [{"role": "user", "parts": _reference_parts(refs) + [{"text": prompt}]}]}
    configs = GEN_CONFIGS[state.get("config", 0):]
    for ci, cfg in enumerate(configs):
        for attempt in range(4):
            try:
                resp = _api(key, "POST", f"models/{model}:generateContent",
                            {**body, "generationConfig": cfg})
            except GeminiError as e:
                if e.status == 400 and ci < len(configs) - 1:
                    break                                   # config not supported: try the next one
                if e.status in (429, 500, 503) and attempt < 3:
                    time.sleep(2 ** (attempt + 2))
                    continue
                raise
            state["config"] = GEN_CONFIGS.index(cfg)
            for cand in resp.get("candidates", []):
                for part in cand.get("content", {}).get("parts", []):
                    blob = part.get("inlineData") or part.get("inline_data")
                    if blob and blob.get("data"):
                        return base64.b64decode(blob["data"])
            reason = [c.get("finishReason") for c in resp.get("candidates", [])]
            text = " ".join(p.get("text", "") for c in resp.get("candidates", [])
                            for p in c.get("content", {}).get("parts", []))
            print(f"    no image returned ({reason} {text[:160]!r}), retrying")
            time.sleep(2)
        else:
            raise RuntimeError("Gemini returned no image after 4 attempts.")
    raise RuntimeError("Gemini rejected every generation config.")


SITE = "https://nlc.com.sa"


def _download(url, dest):
    try:
        with urllib.request.urlopen(url, timeout=60) as r:
            data = r.read()
    except (urllib.error.URLError, OSError):
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return True


def find_refs(spec):
    """Product photo + gallery shots from the site checkout, else downloaded from nlc.com.sa."""
    refs = []
    cache = HERE / spec["key"] / "ref"
    for rel_path in spec.get("reference_images", [f"images/products/{spec['key']}.png"]):
        p = Path(rel_path)
        names = [p.name] + [f"{p.stem}-g{n}{p.suffix}" for n in range(2, 7)]  # key.png, key-g2.png ...
        for name in names:
            local, cached = ROOT / p.parent / name, cache / name
            if local.exists():
                refs.append(local)
            elif cached.exists() or _download(f"{SITE}/{p.parent.as_posix()}/{name}", cached):
                refs.append(cached)
            elif name == p.name:
                break                                       # no main photo: skip its gallery lookups
    if not refs:
        sys.exit("Product photo not found locally or at " + SITE
                 + ". Run from the website project, allow nlc.com.sa, or pass --ref.")
    return refs[:3]


def contact_sheet(stills_dir, shots):
    tw, th, pad = 480, 270, 16
    cols = 4
    rows = math.ceil(len(shots) / cols)
    sheet = Image.new("RGB", (cols * (tw + pad) + pad, rows * (th + pad + 34) + pad), NAVY_DEEP)
    d = ImageDraw.Draw(sheet)
    f = font(600, 20)
    for i, shot in enumerate(shots):
        p = still_path(stills_dir, shot["id"])
        if not p:
            continue
        im = cover(Image.open(p).convert("RGB"), tw, th)
        x = pad + (i % cols) * (tw + pad)
        y = pad + (i // cols) * (th + pad + 34)
        sheet.paste(im, (x, y))
        d.text((x, y + th + 6), shot["id"], font=f, fill=WHITE)
    out = stills_dir / "_contact-sheet.jpg"
    sheet.save(out, quality=88)
    return out


def cmd_stills(spec, args, stills_dir):
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        sys.exit("Set GEMINI_API_KEY (or GOOGLE_API_KEY) to generate stills.")
    refs = [Path(r) for r in args.ref] if args.ref else find_refs(spec)
    model = args.model or os.environ.get("GEMINI_IMAGE_MODEL") or pick_model(key)
    print(f"Model: {model}\nReference: {', '.join(str(r) for r in refs)}")
    stills_dir.mkdir(parents=True, exist_ok=True)
    state = {}
    for shot in selected(spec, args):
        existing = still_path(stills_dir, shot["id"])
        if existing and not args.force:
            print(f"  {shot['id']}: exists, skipping (--force to redo)")
            continue
        prompt = f"{spec['style_prefix']}\n\n{shot['prompt']}"
        print(f"  {shot['id']}: generating...")
        data = generate_still(key, model, refs, prompt, state)
        im = Image.open(io.BytesIO(data))
        out = stills_dir / f"{shot['id']}.png"
        im.save(out)
        (stills_dir / f"{shot['id']}.txt").write_text(f"model: {model}\n\n{prompt}\n")
        print(f"    -> {rel(out)} {im.size[0]}x{im.size[1]}")
    print(f"Contact sheet: {rel(contact_sheet(stills_dir, spec['shots']))}")


# --------------------------------------------------------------------------- drawing helpers

def still_path(stills_dir, shot_id):
    for ext in (".png", ".jpg", ".jpeg", ".webp"):
        p = stills_dir / f"{shot_id}{ext}"
        if p.exists():
            return p
    return None


def cover(im, w, h):
    s = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def ease(t):
    t = min(max(t, 0.0), 1.0)
    return 0.5 - 0.5 * math.cos(math.pi * t)


def gentle(t):
    """Near-linear drift with soft ends, for camera moves."""
    t = min(max(t, 0.0), 1.0)
    return 0.7 * t + 0.3 * ease(t)


def with_opacity(layer, a):
    if a >= 1:
        return layer
    out = layer.copy()
    out.putalpha(layer.getchannel("A").point(lambda v: round(v * a)))
    return out


def text_width(text, f, spacing=0):
    return sum(f.getlength(ch) for ch in text) + spacing * max(len(text) - 1, 0)


def draw_spaced(d, xy, text, f, fill, spacing=0):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill)
        x += f.getlength(ch) + spacing


def parse_path(path):
    """Absolute/relative M L H V C Z -> list of polygons (bezier curves flattened)."""
    tokens = re.findall(r"[MLHVCZmlhvcz]|-?\d*\.?\d+(?:e-?\d+)?", path)
    polys, cur, x, y, cmd, i = [], [], 0.0, 0.0, None, 0

    def num():
        nonlocal i
        i += 1
        return float(tokens[i - 1])

    while i < len(tokens):
        if tokens[i].isalpha():
            cmd = tokens[i]
            i += 1
            if cmd in "Zz":
                if cur:
                    polys.append(cur)
                cur = []
                continue
        rel = cmd.islower()
        c = cmd.upper()
        if c == "M":
            nx, ny = num(), num()
            x, y = (x + nx, y + ny) if rel else (nx, ny)
            if cur:
                polys.append(cur)
            cur = [(x, y)]
            cmd = "l" if rel else "L"
        elif c == "L":
            nx, ny = num(), num()
            x, y = (x + nx, y + ny) if rel else (nx, ny)
            cur.append((x, y))
        elif c == "H":
            nx = num()
            x = x + nx if rel else nx
            cur.append((x, y))
        elif c == "V":
            ny = num()
            y = y + ny if rel else ny
            cur.append((x, y))
        elif c == "C":
            pts = [num() for _ in range(6)]
            if rel:
                pts = [p + (x if k % 2 == 0 else y) for k, p in enumerate(pts)]
            x1, y1, x2, y2, x3, y3 = pts
            for s in range(1, 17):
                t = s / 16
                mt = 1 - t
                cur.append((mt ** 3 * x + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t ** 3 * x3,
                            mt ** 3 * y + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t ** 3 * y3))
            x, y = x3, y3
    if cur:
        polys.append(cur)
    return polys


def render_mark(height, color=MARK_ORANGE):
    polys = parse_path(MARK_PATH)
    xs = [p[0] for poly in polys for p in poly]
    ys = [p[1] for poly in polys for p in poly]
    x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
    ss = 4
    scale = height * ss / (y1 - y0)
    w = math.ceil((x1 - x0) * scale)
    big = Image.new("L", (w, height * ss), 0)
    d = ImageDraw.Draw(big)
    for poly in polys:
        d.polygon([((px - x0) * scale, (py - y0) * scale) for px, py in poly], fill=255)
    mask = big.resize((math.ceil(w / ss), height), Image.LANCZOS)
    mark = Image.new("RGBA", mask.size, color + (0,))
    mark.putalpha(mask)
    return mark


# --------------------------------------------------------------------------- shots

class Shot:
    def __init__(self, spec, path, zoom=1.0):
        self.d = float(spec["duration"])
        move = spec.get("move", "push_in")
        a, b = MOVES[move] if isinstance(move, str) else (tuple(move["from"]), tuple(move["to"]))
        self.a, self.b = ((x, y, z * zoom) for x, y, z in (a, b))  # zoom > 1 trims edges, e.g. watermarks
        src = Image.open(path).convert("RGB")
        zmax = max(self.a[2], self.b[2])
        want = W * zmax * 1.15                              # keep ~1:1 sampling at the tightest crop
        base_w = min(src.width, src.height * 16 / 9)
        if base_w > want:
            s = want / base_w
            src = src.resize((round(src.width * s), round(src.height * s)), Image.LANCZOS)
        elif base_w < W * zmax:
            print(f"  note: {path.name} is {src.width}x{src.height}; will be upscaled")
        self.src = src
        self.caption = build_caption(spec)

    def frame(self, lt):
        p = gentle(lt / self.d)
        cx, cy, z = (a + (b - a) * p for a, b in zip(self.a, self.b))
        sw, sh = self.src.size
        bw = min(sw, sh * 16 / 9)
        bh = bw * 9 / 16
        cw, ch = bw / z, bh / z
        x0 = min(max(cx * sw - cw / 2, 0), sw - cw)
        y0 = min(max(cy * sh - ch / 2, 0), sh - ch)
        im = self.src.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch))
        if self.caption:
            a_in = ease((lt - 0.6) / 0.7)
            a_out = 1 - ease((lt - (self.d - CROSSFADE - 0.6)) / 0.6)
            a = min(a_in, a_out)
            if a > 0:
                scrim, text, dest = self.caption
                over = im.convert("RGBA")
                over.alpha_composite(scrim, (0, H - scrim.height))
                over.alpha_composite(text, (dest[0], dest[1] + round((1 - a) * 14)))
                im = Image.blend(im, over.convert("RGB"), a)
        return im


def build_caption(spec):
    kicker, headline, sub = (spec.get(k, "").strip() for k in ("kicker", "headline", "spec"))
    if not (kicker or headline or sub):
        return None
    fk, fh, fs = font(600, 26), font(600, 68), font(300, 34)
    lines = []                                              # (kind, text, font, height)
    if kicker:
        lines.append(("kicker", kicker.upper(), fk, 34))
    if headline:
        lines.append(("headline", headline, fh, 84))
    if sub:
        lines.append(("spec", sub, fs, 46))
    bar_h, gap = 4, 18
    total = bar_h + gap + sum(h for *_, h in lines)
    tw = max(round(text_width(t, f, 5 if k == "kicker" else 0)) for k, t, f, _ in lines) + 20
    text = Image.new("RGBA", (tw, total + 12), (0, 0, 0, 0))
    d = ImageDraw.Draw(text)
    d.rectangle((0, 0, 56, bar_h - 1), fill=ORANGE + (255,))
    y = bar_h + gap
    for kind, t, f, h in lines:
        if kind == "kicker":
            draw_spaced(d, (0, y), t, f, ORANGE + (255,), spacing=5)
        elif kind == "headline":
            d.text((0, y - 6), t, font=f, fill=WHITE + (255,))
        else:
            d.text((2, y), t, font=f, fill=WHITE + (235,))
        y += h

    scrim_h = 520
    grad = Image.linear_gradient("L").resize((1, scrim_h)).point(lambda v: round(v * 0.72))
    scrim = Image.new("RGBA", (W, scrim_h), NAVY_DEEP + (0,))
    scrim.putalpha(grad.resize((W, scrim_h)))
    dest = (120, H - 120 - total)
    return scrim, text, dest


class EndCard:
    def __init__(self, spec):
        self.d = float(spec.get("end_card", {}).get("duration", 5))
        site = spec.get("end_card", {}).get("site", "nlc.com.sa")
        glow = Image.radial_gradient("L").resize((W, W)).crop((0, (W - H) // 2, W, (W + H) // 2))
        self.bg = Image.composite(Image.new("RGB", (W, H), NAVY_DEEP), Image.new("RGB", (W, H), NAVY), glow)

        self.mark = render_mark(150)
        self.name = self._text(spec["name"].upper(), font(700, 124), WHITE, spacing=22)
        self.kicker = self._text(spec.get("category", "").upper(), font(600, 28), ORANGE, spacing=8)
        self.tag = self._text(spec.get("tagline", ""), font(300, 42), WHITE)
        self.site = self._text(site, font(400, 30), (200, 202, 220))

        lw, lh = 960, 60
        core = Image.new("RGBA", (lw, lh), (0, 0, 0, 0))
        ImageDraw.Draw(core).rounded_rectangle((20, lh // 2 - 6, lw - 20, lh // 2 + 6), 6, fill=ORANGE + (210,))
        halo = core.filter(ImageFilter.GaussianBlur(12))
        ImageDraw.Draw(halo).rounded_rectangle((20, lh // 2 - 2, lw - 20, lh // 2 + 1), 2, fill=(255, 238, 214, 255))
        self.line = halo

    @staticmethod
    def _text(t, f, color, spacing=0):
        w = round(text_width(t, f, spacing)) + 8
        asc, desc = f.getmetrics()
        im = Image.new("RGBA", (max(w, 1), asc + desc + 8), (0, 0, 0, 0))
        draw_spaced(ImageDraw.Draw(im), (4, 2), t, f, color + (255,), spacing)
        return im

    def frame(self, lt):
        im = self.bg.convert("RGBA")
        cx = W // 2
        # Logo is revealed by a wipe, never faded (brand guideline, Section 02).
        mw = round(self.mark.width * ease((lt - 0.2) / 0.9))
        if mw > 0:
            im.alpha_composite(self.mark.crop((0, 0, mw, self.mark.height)), (cx - self.mark.width // 2, 250))
        layers = [
            (self.name, 440, ease((lt - 0.5) / 0.7)),
            (self.kicker, 690, ease((lt - 1.3) / 0.6)),
            (self.tag, 740, ease((lt - 1.5) / 0.6)),
            (self.site, 950, ease((lt - 1.9) / 0.6)),
        ]
        for layer, y, a in layers:
            if a > 0:
                im.alpha_composite(with_opacity(layer, a), (cx - layer.width // 2, y))
        lw = round(self.line.width * ease((lt - 0.9) / 1.2))
        if lw > 2:
            x = (self.line.width - lw) // 2
            im.alpha_composite(self.line.crop((x, 0, x + lw, self.line.height)), (cx - lw // 2, 620))
        return im.convert("RGB")


# --------------------------------------------------------------------------- video

def ffmpeg_exe():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("ffmpeg not found: install it, or `pip install imageio-ffmpeg`.")


def selected(spec, args):
    if not args.only:
        return spec["shots"]
    ids = set(args.only.split(","))
    return [s for s in spec["shots"] if s["id"] in ids]


def cmd_video(spec, args, stills_dir, out_path):
    missing = [s["id"] for s in spec["shots"] if not still_path(stills_dir, s["id"])]
    if missing:
        sys.exit(f"Missing stills in {stills_dir}: {', '.join(missing)}. Run the `stills` step first.")
    segs = [Shot(s, still_path(stills_dir, s["id"]), args.zoom) for s in spec["shots"]] + [EndCard(spec)]
    starts, t = [], 0.0
    for seg in segs:
        starts.append(t)
        t += seg.d - CROSSFADE
    total = starts[-1] + segs[-1].d
    fps = args.fps
    n = round(total * fps)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [ffmpeg_exe(), "-y", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-"]
    if args.audio:
        cmd += ["-i", args.audio, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "192k",
                "-af", f"afade=t=out:st={max(total - 2, 0):.2f}:d=2"]
    cmd += ["-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", "-t", f"{total:.3f}", str(out_path)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    black = Image.new("RGB", (W, H), (0, 0, 0))
    poster_at = round(min(2.5, segs[0].d / 2) * fps)
    print(f"Rendering {total:.1f}s ({n} frames) -> {rel(out_path)}")
    for f in range(n):
        t = f / fps
        active = [i for i, s in enumerate(starts) if s <= t < s + segs[i].d] or [len(segs) - 1]
        i = active[0]
        im = segs[i].frame(t - starts[i])
        if len(active) > 1:
            j = active[1]
            im = Image.blend(im, segs[j].frame(t - starts[j]), ease((t - starts[j]) / CROSSFADE))
        if t < FADE_IN:
            im = Image.blend(black, im, ease(t / FADE_IN))
        if f == poster_at:
            im.save(out_path.with_name(out_path.stem + "-poster.jpg"), quality=90)
        proc.stdin.write(im.tobytes())
        if f % (fps * 5) == 0:
            print(f"  {t:5.1f}s")
    proc.stdin.close()
    if proc.wait():
        sys.exit("ffmpeg failed.")
    print(f"Done: {rel(out_path)}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("product", help="folder under commercials/ holding shots.json, e.g. solid")
    ap.add_argument("step", choices=["stills", "video", "all"])
    ap.add_argument("--model", help="Gemini image model id (default: newest available)")
    ap.add_argument("--ref", action="append", help="product reference photo(s); default from shots.json")
    ap.add_argument("--only", help="comma-separated shot ids for the stills step")
    ap.add_argument("--force", action="store_true", help="regenerate stills that already exist")
    ap.add_argument("--audio", help="voiceover or music track to lay under the video")
    ap.add_argument("--stills-dir", help="override the stills folder")
    ap.add_argument("--out", help="override the output MP4 path")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--zoom", type=float, default=1.0,
                    help="extra zoom on every shot, e.g. 1.1 to crop a corner watermark")
    args = ap.parse_args()

    pdir = HERE / args.product
    spec = json.loads((pdir / "shots.json").read_text())
    stills_dir = Path(args.stills_dir) if args.stills_dir else pdir / "stills"
    out_path = Path(args.out) if args.out else pdir / "out" / f"{spec['key']}-commercial.mp4"
    if args.step in ("stills", "all"):
        cmd_stills(spec, args, stills_dir)
    if args.step in ("video", "all"):
        cmd_video(spec, args, stills_dir, out_path.resolve())


if __name__ == "__main__":
    main()
