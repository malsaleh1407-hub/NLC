#!/usr/bin/env python3
"""Build an NLC product commercial from still images (no AI video).

Each still gets a slow Ken Burns move, a Bizmo title card and a crossfade;
the spot opens on a navy light-sweep card and closes on the white NLC logo.
Runs in the Higgsfield sandbox (Pillow, Playwright/Chromium, ffmpeg).

    python3 build_commercial.py shots.json out.mp4
"""
import json, os, subprocess, sys, urllib.request
from PIL import Image, ImageDraw, ImageFilter

W, H, FPS, XF = 1920, 1080, 30, 0.6        # frame size, fps, crossfade seconds
NAVY, NAVY_DK, ORANGE = (36, 40, 94), (20, 22, 52), (246, 133, 31)
WORK = os.path.abspath("work")
SITE = "https://nlc.com.sa"
FONTS = ["Light", "Regular", "Bold", "Black"]


def fetch(url, path):
    if not os.path.exists(path):
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as r, open(path, "wb") as f:
            f.write(r.read())
    return path


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


# ---------- overlays rendered in Chromium so Bizmo woff2 works ----------
CSS = """
%(faces)s
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;background:transparent;font-family:Bizmo,sans-serif;color:#fff}
.scrim{position:absolute;inset:0;background:linear-gradient(90deg,rgba(20,22,52,.78) 0%%,rgba(20,22,52,.35) 38%%,rgba(20,22,52,0) 60%%),
 linear-gradient(0deg,rgba(20,22,52,.55) 0%%,rgba(20,22,52,0) 40%%)}
.cap{position:absolute;left:120px;bottom:118px;max-width:1100px}
.kick{font-weight:700;font-size:24px;letter-spacing:.34em;color:#F6851F;text-transform:uppercase}
.rule{width:72px;height:3px;background:#F6851F;margin:20px 0 24px}
.title{font-weight:900;font-size:84px;line-height:1.04;text-transform:uppercase;letter-spacing:.01em}
.sub{font-weight:300;font-size:32px;margin-top:18px;opacity:.92}
.note{position:absolute;right:48px;bottom:36px;font-weight:300;font-size:16px;letter-spacing:.2em;opacity:.55;text-transform:uppercase}
.center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.big{font-weight:900;font-size:120px;letter-spacing:.08em;text-transform:uppercase}
.tag{font-weight:300;font-size:36px;letter-spacing:.18em;margin-top:22px;text-transform:uppercase;color:#F6851F}
.logo{height:150px;margin-bottom:56px}
.name{font-weight:900;font-size:64px;letter-spacing:.1em;text-transform:uppercase}
.specs{font-weight:400;font-size:28px;letter-spacing:.08em;margin-top:22px;opacity:.9}
.url{font-weight:700;font-size:30px;letter-spacing:.2em;margin-top:40px;color:#F6851F}
"""


def overlays(cfg):
    from playwright.sync_api import sync_playwright
    faces = "".join(
        "@font-face{font-family:Bizmo;src:url(file://%s/Bizmo-%s.woff2);font-weight:%d}"
        % (WORK, w, {"Light": 300, "Regular": 400, "Bold": 700, "Black": 900}[w]) for w in FONTS)
    style = "<style>" + CSS % {"faces": faces} + "</style>"
    note = cfg.get("note", "")
    pages = {"open": '<div class="center"><div class="big">%s</div><div class="tag">%s</div></div>'
                     % (cfg["title"], cfg["tagline"])}
    for i, s in enumerate(cfg["shots"]):
        pages["shot%d" % i] = (
            '<div class="scrim"></div><div class="cap"><div class="kick">%s</div><div class="rule"></div>'
            '<div class="title">%s</div><div class="sub">%s</div></div><div class="note">%s</div>'
            % (s["kicker"], s["title"], s.get("sub", ""), note))
    e = cfg["end"]
    pages["end"] = ('<div class="center"><img class="logo" src="file://%s/logo-white.svg">'
                    '<div class="name">%s</div><div class="specs">%s</div><div class="url">%s</div></div>'
                    % (WORK, e["name"], e["specs"], e["url"]))
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": W, "height": H})
        for k, body in pages.items():
            path = os.path.join(WORK, "ov_%s.png" % k)
            pg.set_content("<html><head>%s</head><body>%s</body></html>" % (style, body))
            pg.evaluate("document.fonts.ready")
            pg.wait_for_timeout(150)
            pg.screenshot(path=path, omit_background=True)
            out[k] = Image.open(path).convert("RGBA")
        b.close()
    return out


# ---------- backgrounds ----------
def navy_bg():
    g = Image.new("RGB", (W, H), NAVY_DK)
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse((W * .15, H * .05, W * .85, H * .95), fill=255)
    glow = glow.filter(ImageFilter.GaussianBlur(260))
    return Image.composite(Image.new("RGB", (W, H), NAVY), g, glow)


def light_line():
    """Thin orange beam with a soft glow, full width; cropped per frame to animate."""
    ln = Image.new("RGBA", (W, 120), (0, 0, 0, 0))
    d = ImageDraw.Draw(ln)
    d.rectangle((0, 58, W, 61), fill=ORANGE + (255,))
    glow = ln.filter(ImageFilter.GaussianBlur(14))
    return Image.alpha_composite(glow, Image.alpha_composite(glow, ln))


def prep_still(path):
    im = Image.open(path).convert("RGB")
    s = max(W * 1.18 / im.width, H * 1.18 / im.height)    # headroom for the move
    return im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)


MOVES = {  # (zoom0, zoom1, dx0, dx1, dy0, dy1) in fractions of the spare margin
    "in": (1.00, 1.10, 0, 0, 0, 0), "out": (1.10, 1.00, 0, 0, 0, 0),
    "left": (1.06, 1.06, .6, -.6, 0, 0), "right": (1.06, 1.06, -.6, .6, 0, 0),
    "up": (1.06, 1.08, 0, 0, .5, -.5), "down": (1.06, 1.08, 0, 0, -.5, .5),
}


def ken_burns(src, move, u):
    z0, z1, x0, x1, y0, y1 = MOVES[move]
    k = ease(u)
    z = z0 + (z1 - z0) * k
    vw, vh = src.width / (1.18 * z), src.height / (1.18 * z)   # visible window in source px
    cx = src.width / 2 + (x0 + (x1 - x0) * k) * (src.width - vw) / 2
    cy = src.height / 2 + (y0 + (y1 - y0) * k) * (src.height - vh) / 2
    sx, sy = vw / W, vh / H
    return src.transform((W, H), Image.AFFINE, (sx, 0, cx - vw / 2, 0, sy, cy - vh / 2), Image.BICUBIC)


def with_overlay(frame, ov, t, dur, delay=0.35, fade=0.5):
    a = ease((t - delay) / fade) * (1 - ease((t - (dur - fade)) / fade))
    if a <= 0:
        return frame
    lift = int(18 * (1 - ease((t - delay) / (fade * 1.4))))
    o = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    o.paste(ov, (0, lift))
    if a < 1:
        o.putalpha(o.getchannel("A").point(lambda v: int(v * a)))
    return Image.alpha_composite(frame.convert("RGBA"), o).convert("RGB")


def main(cfg_path, out_path):
    os.makedirs(WORK, exist_ok=True)
    cfg = json.load(open(cfg_path))
    for w in FONTS:
        fetch("%s/fonts/Bizmo-%s.woff2" % (SITE, w), os.path.join(WORK, "Bizmo-%s.woff2" % w))
    fetch(SITE + "/images/logo/logo-white.svg", os.path.join(WORK, "logo-white.svg"))
    stills = [prep_still(fetch(s["image"], os.path.join(WORK, "still%d" % i))) for i, s in enumerate(cfg["shots"])]
    ov = overlays(cfg)
    bg, beam = navy_bg(), light_line()

    def open_card(t, dur):
        f = bg.copy().convert("RGBA")
        wpx = int(W * ease(t / 1.4))
        if wpx > 0:
            f.alpha_composite(beam.crop((0, 0, wpx, 120)), ((W - wpx) // 2, H // 2 + 150))
        return with_overlay(f.convert("RGB"), ov["open"], t, dur + 1, delay=0.5, fade=0.8)

    def end_card(t, dur):
        return with_overlay(bg, ov["end"], t, dur + 1, delay=0.3, fade=0.7)

    seg = [(cfg.get("open_dur", 3.0), open_card)]
    for i, s in enumerate(cfg["shots"]):
        seg.append((s.get("dur", 3.6), (lambda i, s: lambda t, d: with_overlay(
            ken_burns(stills[i], s.get("move", "in"), t / d), ov["shot%d" % i], t, d))(i, s)))
    seg.append((cfg.get("end_dur", 4.0), end_card))

    starts, t0 = [], 0.0
    for d, _ in seg:
        starts.append(t0)
        t0 += d - XF
    total = t0 + XF
    enc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                            "-s", "%dx%d" % (W, H), "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
                            "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out_path],
                           stdin=subprocess.PIPE)
    n = int(round(total * FPS))
    for fi in range(n):
        t = fi / FPS
        live = [(k, t - starts[k]) for k in range(len(seg)) if 0 <= t - starts[k] < seg[k][0]]
        k, lt = live[0]
        frame = seg[k][1](lt, seg[k][0])
        if len(live) > 1:                                   # crossfade into the next segment
            k2, lt2 = live[1]
            frame = Image.blend(frame, seg[k2][1](lt2, seg[k2][0]), ease(lt2 / XF))
        if t > total - 0.5:                                  # fade to black at the very end
            frame = Image.blend(frame, Image.new("RGB", (W, H)), ease((t - (total - 0.5)) / 0.5))
        enc.stdin.write(frame.tobytes())
        if fi % 150 == 0:
            print("frame %d/%d" % (fi, n), flush=True)
    enc.stdin.close()
    enc.wait()
    print("done %s %.1fs" % (out_path, total))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
