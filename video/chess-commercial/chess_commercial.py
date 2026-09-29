#!/usr/bin/env python3
"""NLC CHESS family commercial: procedural 16:9 renderer.

Every frame is drawn with Pillow + numpy and piped to ffmpeg; the soundtrack is
synthesised with numpy. Product photos, the NLC logo and the Outfit font are
read from --assets (fetch_assets.sh downloads them from nlc.com.sa).

Every spec on screen comes from the live CHESS product pages on nlc.com.sa
(values at 4000K, +/-10%). Nothing is invented: if a page does not state a
figure, the film does not show one.

    python3 chess_commercial.py --assets assets --out chess-commercial.mp4
    python3 chess_commercial.py --assets assets --stills 60,240,420 --still-scale 0.5
"""
import argparse
import math
import multiprocessing as mp
import os
import subprocess
import sys
import wave
from functools import lru_cache

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1920, 1080, 30

# Brand tokens (NLC-Brand-Guidelines-source.html, Section 03).
NAVY = (36, 40, 94)
NAVY_DEEP = (15, 18, 53)
ORANGE = (246, 133, 31)
WHITE = (255, 255, 255)
MUTED = (176, 181, 212)
WARM = (255, 226, 186)          # 3000K-ish LED glow

ASSETS = 'assets'

# ---------------------------------------------------------------- timeline ---
T_TITLE = 150
T_PIECES, PIECE_LEN = 300, 105
T_PERF = T_PIECES + 7 * PIECE_LEN      # 1035
T_OPTS = T_PERF + 180                  # 1215
T_END = T_OPTS + 150                   # 1365
TOTAL = T_END + 195                    # 1560 frames = 52 s

PCX, PCY, PBOX = 1300, 505, (860, 560)   # hero product stage
TXL = 150                                # left text column

PIECES = [
    dict(name='SQUARE', img='chess-square-1', code='NLC-CHS', dim='596 × 596 mm',
         line='The flagship\nChess shape.'),
    dict(name='MASTER', img='chess-master-2', code='NLC-CHM', dim='596 × 596 mm',
         line='Dual-thickness panel,\nsleek symmetrical face.'),
    dict(name='BLOCK', img='chess-block-2', code='NLC-CHB', dim='1196 × 296 × 12 mm',
         line='12 mm thin. Drops into\n1200 × 300 ceiling grids.'),
    dict(name='LINE', img='chess-line-2', code='NLC-CHL', dim='1200 × 155 mm',
         line='A continuous\nline of light.'),
    dict(name='HEXA', img='chess-hexa-1', code='NLC-CHH', dim='550 × 635 mm',
         line='Clusters into\nhoneycomb patterns.'),
    dict(name='WAY', img='chess-way-2', code='NLC-CHW', dim='596 × 596 mm',
         line='Its own\npattern of light.'),
    dict(name='QUIET', img='chess-quite-1', code=None, dim='Compact panel',
         line='Same 35 W · 3,500 lm,\ncompact form.'),
]
LINEUP = ['chess-square-1', 'chess-master-1', 'chess-block-1', 'chess-line-1',
          'chess-hexa-1', 'chess-way-1', 'chess-quite-1']

STATS = [  # (target or text, format, unit, label, sub)
    (35, '{:,.0f}', 'W', 'POWER', ''),
    (3500, '{:,.0f}', 'lm', 'SYSTEM LUMEN', ''),
    (100, '{:,.0f}', 'lm/W', 'EFFICACY', ''),
    ('<13', None, 'UGR', 'LOW GLARE', ''),
    ('>80', None, 'CRI', 'COLOUR RENDERING', '>90 optional'),
    (100000, '{:,.0f}', 'h', 'LIFETIME', 'L70B50'),
]
CCTS = [('2700K', 'Candlelight', (255, 167, 87)), ('3000K', 'Warm', (255, 186, 118)),
        ('4000K', 'Cool', (255, 216, 178)), ('6500K', 'Daylight', (236, 242, 255))]

# Audio cue frames (chess-piece "clack" + sub pulse).
CLACKS = [T_TITLE + 22] + [T_PIECES + k * PIECE_LEN + 10 for k in range(7)] + [T_END + 128]


# ------------------------------------------------------------------ easing ---
def clamp(v, a=0.0, b=1.0):
    return a if v < a else b if v > b else v


def prog(f, a, b):
    return clamp((f - a) / (b - a))


def eo(t):
    return 1 - (1 - t) ** 3


def eio(t):
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def lerp(a, b, t):
    return tuple(int(round(x + (y - x) * t)) for x, y in zip(a, b))


# ------------------------------------------------------------------- fonts ---
@lru_cache(None)
def font(weight, size):
    static = os.path.join(ASSETS, f'Outfit-{weight}.ttf')
    if os.path.exists(static):
        return ImageFont.truetype(static, size)
    f = ImageFont.truetype(os.path.join(ASSETS, 'Outfit.ttf'), size)
    f.set_variation_by_axes([weight])
    return f


@lru_cache(maxsize=4096)
def sprite(txt, weight, size, color=WHITE, track=0):
    f = font(weight, size)
    asc, desc = f.getmetrics()
    widths = [f.getlength(c) for c in txt] if track else None
    w = sum(widths) + track * (len(txt) - 1) if track else f.getlength(txt)
    im = Image.new('RGBA', (int(math.ceil(w)) + 8, asc + desc + 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if track:
        x = 4
        for c, cw in zip(txt, widths):
            d.text((x, 4), c, font=f, fill=color)
            x += cw + track
    else:
        d.text((4, 4), txt, font=f, fill=color)
    return im


def fade(img, alpha):
    if alpha >= 0.999:
        return img
    img = img.copy()
    img.putalpha(img.getchannel('A').point(lambda v: int(v * alpha)))
    return img


def put(frame, spr, x, y, alpha=1.0, wipe=1.0, anchor='l'):
    if alpha <= 0.004 or wipe <= 0.0:
        return
    if anchor == 'c':
        x -= spr.width / 2
    if wipe < 1:
        spr = spr.crop((0, 0, max(1, int(spr.width * wipe)), spr.height))
    spr = fade(spr, alpha)
    frame.paste(spr, (int(round(x)), int(round(y))), spr)


def tx(frame, text, weight, size, x, y, f, start, dur=18, color=WHITE, track=0,
       anchor='l', galpha=1.0, rise=26, lh=1.28):
    p = eo(prog(f, start, start + dur))
    for i, line in enumerate(text.split('\n')):
        put(frame, sprite(line, weight, size, color, track), x,
            y + i * size * lh + (1 - p) * rise, alpha=p * galpha, anchor=anchor)


def screen_at(frame, glow, x, y):
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + glow.width), min(H, y + glow.height)
    if x1 <= x0 or y1 <= y0:
        return
    region = frame.crop((x0, y0, x1, y1))
    g = glow.crop((x0 - x, y0 - y, x1 - x, y1 - y))
    frame.paste(ImageChops.screen(region, g), (x0, y0))


# ---------------------------------------------------------------- products ---
class Product:
    """A product photo prepared for 'power-on': dark, lit and glow layers."""

    def __init__(self, path, box, pad=150):
        im = Image.open(path).convert('RGBA')
        im = im.crop(im.getbbox())
        s = min(box[0] / im.width, box[1] / im.height)
        self.size0 = (max(1, round(im.width * s)), max(1, round(im.height * s)))
        big = (round(self.size0[0] * 1.05), round(self.size0[1] * 1.05))
        self.lit = im.resize(big, Image.LANCZOS)
        a = np.asarray(self.lit).astype(np.float32)
        rgb, al = a[..., :3], a[..., 3] / 255.0
        lum = rgb @ np.array([0.3, 0.59, 0.11], np.float32)
        opaque = al > 0.8
        med = float(np.median(lum[opaque])) if opaque.any() else 128.0
        self.dark = med < 120
        off = rgb * 0.24 + np.array(NAVY, np.float32) * 0.12
        self.off = Image.fromarray(np.dstack([off, a[..., 3]]).clip(0, 255).astype(np.uint8), 'RGBA')
        thr = 70.0 if self.dark else 212.0
        m = np.clip((lum - thr) / 40.0, 0, 1) * al
        if self.dark:  # soft backlight so black finishes separate from the navy
            m = np.maximum(m, al * 0.32)
        mask = Image.new('L', (big[0] + 2 * pad, big[1] + 2 * pad), 0)
        mask.paste(Image.fromarray((m * 255).astype(np.uint8), 'L'), (pad, pad))
        g = (np.asarray(mask.filter(ImageFilter.GaussianBlur(14)), np.float32) * 0.8 +
             np.asarray(mask.filter(ImageFilter.GaussianBlur(52)), np.float32) * 1.3) / 255.0
        g = np.clip(g * (1.5 if self.dark else 1.0), 0, 1)
        self.glow = Image.fromarray((g[..., None] * np.array(WARM, np.float32)).clip(0, 255).astype(np.uint8), 'RGB')

    def draw(self, frame, cx, cy, scale=1.0, ig=1.0, alpha=1.0, dx=0.0, glow_k=0.8):
        if alpha <= 0.004:
            return
        w = max(1, round(self.size0[0] * scale))
        h = max(1, round(self.size0[1] * scale))
        gk = ig * alpha * glow_k
        if gk > 0.01:
            gw = max(1, round(self.glow.width * scale / 1.05))
            gh = max(1, round(self.glow.height * scale / 1.05))
            g = self.glow.resize((gw, gh), Image.BILINEAR)
            if gk < 0.999:
                g = g.point(lambda v: int(v * gk))
            screen_at(frame, g, round(cx - gw / 2 + dx), round(cy - gh / 2))
        img = self.lit if ig >= 0.999 else self.off if ig <= 0.001 else Image.blend(self.off, self.lit, ig)
        img = fade(img.resize((w, h), Image.BILINEAR), alpha)
        frame.paste(img, (round(cx - w / 2 + dx), round(cy - h / 2)), img)


# -------------------------------------------------------------- backdrops ---
def _grid():
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    return x, y


def make_backdrops():
    x, y = _grid()
    d = np.sqrt(((x - W * 0.62) / (W * 0.9)) ** 2 + ((y - H * 0.45) / (H * 0.9)) ** 2)
    t = (np.clip(d / 0.8, 0, 1) ** 1.3)[..., None]
    base = np.array([34, 38, 92], np.float32) * (1 - t) + np.array([10, 12, 38], np.float32) * t
    base += np.random.default_rng(7).normal(0, 1.1, base.shape)  # dither against banding
    # Lit stage: a chessboard wall revealed by the product's light.
    s = 172.0
    par = ((np.floor((x - PCX) / s) + np.floor((y - PCY) / s)) % 2)[..., None]
    r = np.sqrt((x - PCX) ** 2 + ((y - PCY) * 1.25) ** 2)
    reveal = np.exp(-(r / 620.0) ** 2)[..., None]
    halo = np.exp(-(r / 360.0) ** 2)[..., None]
    lit = base + par * reveal * np.array([12, 13, 30], np.float32) + halo * np.array(WARM, np.float32) * 0.16
    bg0 = Image.fromarray(base.clip(0, 255).astype(np.uint8), 'RGB')
    bg1 = Image.fromarray(lit.clip(0, 255).astype(np.uint8), 'RGB')
    # Board-scene vignette with a darker band where the headline sits.
    v = 1 - 0.55 * np.clip(np.sqrt(((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2) - 0.35, 0, 1)
    band = 1 - 0.72 * np.exp(-((y - 545) / 190.0) ** 2) * np.exp(-((x - W / 2) / 760.0) ** 2)
    vig = Image.fromarray((np.clip(v * band, 0, 1) * 255).astype(np.uint8), 'L').convert('RGB')
    return bg0, bg1, vig


# Board scene: a ceiling of panels seen from below, lighting up like a chessboard.
BW, BH, TS, TG = 2200, 1250, 112, 10


def make_tiles():
    rng = np.random.default_rng(3)
    tiles = []
    for r in range(BH // (TS + TG) + 1):
        for c in range(BW // (TS + TG) + 1):
            x0, y0 = c * (TS + TG) + 6, r * (TS + TG) + 6
            t0 = 8 + (c * 0.55 + r * 0.9) * 3.2 + rng.uniform(-3, 3)
            tiles.append((x0, y0, x0 + TS, y0 + TS, (r + c) % 2 == 0, t0))
    return tiles


def persp_coeffs(dst, src):
    a, b = [], []
    for (x, y), (X, Y) in zip(dst, src):
        a.append([x, y, 1, 0, 0, 0, -X * x, -X * y]); b.append(X)
        a.append([0, 0, 0, x, y, 1, -Y * x, -Y * y]); b.append(Y)
    return np.linalg.solve(np.array(a, float), np.array(b, float)).tolist()


# ------------------------------------------------------------- UI sprites ---
@lru_cache(None)
def chip(text, color=WHITE, border=(96, 104, 170), accent=False):
    f = font(600, 24)
    w = int(f.getlength(text)) + 44
    im = Image.new('RGBA', (w, 50), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((1, 1, w - 2, 48), radius=24, outline=border + (255,), width=2,
                        fill=(ORANGE + (40,)) if accent else (255, 255, 255, 10))
    d.text((22, 9), text, font=f, fill=color)
    return im


@lru_cache(None)
def card(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=18, fill=(255, 255, 255, 12),
                        outline=(92, 100, 168, 200), width=2)
    d.rectangle((0, 22, 5, 70), fill=ORANGE + (255,))
    return im


@lru_cache(None)
def mount_icon(kind):
    im = Image.new('RGBA', (140, 110), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    line = MUTED + (255,)
    panel = (240, 240, 244, 255)
    d.line((6, 24, 134, 24), fill=line, width=3)
    if kind == 'recessed':
        d.rectangle((34, 12, 106, 26), fill=panel)
        glow_y = 26
    elif kind == 'surface':
        d.rectangle((34, 26, 106, 40), fill=panel)
        glow_y = 40
    else:
        d.line((44, 24, 44, 70), fill=line, width=2)
        d.line((96, 24, 96, 70), fill=line, width=2)
        d.rectangle((34, 70, 106, 84), fill=panel)
        glow_y = 84
    d.polygon([(36, glow_y + 2), (104, glow_y + 2), (124, glow_y + 26), (16, glow_y + 26)],
              fill=WARM + (70,))
    return im


@lru_cache(None)
def square_icon(fill, outline):
    im = Image.new('RGBA', (74, 74), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((1, 1, 72, 72), radius=10, fill=fill + (255,), outline=outline + (255,), width=2)
    return im


@lru_cache(None)
def dot(color, r=34):
    s = r * 4
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    halo = Image.new('L', (s, s), 0)
    ImageDraw.Draw(halo).ellipse((s / 2 - r * 1.2, s / 2 - r * 1.2, s / 2 + r * 1.2, s / 2 + r * 1.2), fill=120)
    halo = halo.filter(ImageFilter.GaussianBlur(r * 0.45))
    im.paste(Image.new('RGBA', (s, s), color + (255,)), (0, 0), halo)
    ImageDraw.Draw(im).ellipse((s / 2 - r, s / 2 - r, s / 2 + r, s / 2 + r), fill=color + (255,))
    return im


# ------------------------------------------------------------------ scenes ---
def board(f):
    im = Image.new('RGB', (BW, BH), (10, 12, 36))
    d = ImageDraw.Draw(im)
    cell = TS / 4
    for x0, y0, x1, y1, lit, t0 in TILES:
        b = eo(prog(f, t0, t0 + 12))
        b = b * 0.95 if lit else b * 0.08
        c = lerp((17, 20, 54), (246, 224, 192), b)
        d.rectangle((x0, y0, x1, y1), fill=c)
        if lit and b > 0.05:  # every lit tile is a CHESS panel: 4x4 LED cells
            cc = lerp(c, (255, 250, 240), 0.55 * b)
            for i in range(4):
                for j in range(4):
                    cx0, cy0 = x0 + i * cell + cell * 0.22, y0 + j * cell + cell * 0.22
                    d.rectangle((cx0, cy0, cx0 + cell * 0.56, cy0 + cell * 0.56), fill=cc)
    k = eio(prog(f, 0, 170))
    top, bot = -250 + 40 * k, 1190
    sx = -70 + 120 * k
    dst = [(-700 + sx, top), (2620 + sx, top), (2000 + sx * 0.5, bot), (-80 + sx * 0.5, bot)]
    src = [(0, 0), (BW, 0), (BW, BH), (0, BH)]
    fr = im.transform((W, H), Image.PERSPECTIVE, persp_coeffs(dst, src), Image.BILINEAR)
    bloom = fr.resize((W // 4, H // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(9)).resize((W, H), Image.BILINEAR)
    fr = ImageChops.screen(fr, bloom.point(lambda v: int(v * 0.7)))
    fr = ImageChops.multiply(fr, VIG)
    fin = eo(prog(f, 0, 14))
    if fin < 1:
        fr = Image.blend(Image.new('RGB', (W, H), (0, 0, 0)), fr, fin)
    out = 1 - eio(prog(f, 128, 148))
    tx(fr, 'Every ceiling', 300, 112, W / 2, 400, f, 30, dur=22, anchor='c', galpha=out)
    tx(fr, 'is a board.', 900, 112, W / 2, 530, f, 42, dur=22, anchor='c', galpha=out)
    return fr


def title(f):
    ig = eo(prog(f, 165, 205))
    out = eio(prog(f, 282, 300))
    fr = Image.blend(BG0, BG1, ig * (1 - out))
    PROD['chess-master-1'].draw(fr, PCX, PCY, scale=0.94 + 0.05 * prog(f, 150, 300), ig=ig,
                                alpha=eo(prog(f, 152, 178)) * (1 - out))
    ga = 1 - out
    tx(fr, 'DESIGNER PANEL LIGHT', 600, 24, TXL, 318, f, 178, color=ORANGE, track=8, galpha=ga)
    put(fr, sprite('CHESS', 900, 210, WHITE, 6), TXL - 10, 352, alpha=ga, wipe=eio(prog(f, 186, 214)))
    rule = eo(prog(f, 206, 226))
    if rule * ga > 0:
        ImageDraw.Draw(fr).rectangle((TXL, 612, TXL + int(150 * rule), 617), fill=lerp(BG0.getpixel((TXL, 614)), ORANGE, ga))
    tx(fr, 'Innovative Shapes,', 300, 58, TXL, 640, f, 212, galpha=ga)
    tx(fr, 'Powerful Light.', 700, 58, TXL, 712, f, 220, galpha=ga)
    return fr


def progress(fr, k, alpha):
    d = Image.new('RGBA', (7 * 30, 20), (0, 0, 0, 0))
    dd = ImageDraw.Draw(d)
    for i in range(7):
        x = i * 30
        if i == k:
            dd.rectangle((x, 0, x + 17, 17), fill=ORANGE + (255,))
        elif i < k:
            dd.rectangle((x, 0, x + 17, 17), fill=MUTED + (150,))
        else:
            dd.rectangle((x, 0, x + 17, 17), outline=MUTED + (150,), width=2)
    put(fr, d, TXL, 962, alpha=alpha)


def piece(f):
    k, u = divmod(f - T_PIECES, PIECE_LEN)
    p = PIECES[k]
    ig = eo(prog(u, 8, 36))
    enter = eo(prog(u, 0, 20))
    ex = eio(prog(u, 92, PIECE_LEN))
    fr = Image.blend(BG0, BG1, ig * (1 - ex) * 0.95)
    PROD[p['img']].draw(fr, PCX, PCY, scale=0.97 + 0.05 * u / PIECE_LEN, ig=ig,
                        alpha=enter * (1 - ex), dx=(1 - enter) * 90 - ex * 50)
    ga = 1 - ex
    tx(fr, f'MOVE {k + 1:02d} / 07', 600, 24, TXL, 292, u, 6, color=ORANGE, track=6, galpha=ga)
    tx(fr, 'CHESS', 300, 46, TXL, 330, u, 10, color=MUTED, track=14, galpha=ga)
    put(fr, sprite(p['name'], 900, 150, WHITE, 2), TXL - 8, 380, alpha=ga, wipe=eio(prog(u, 12, 32)))
    tx(fr, p['line'], 300, 38, TXL, 578, u, 22, color=(214, 217, 236), galpha=ga)
    pc = eo(prog(u, 30, 44)) * ga
    x = TXL
    put(fr, chip(p['dim']), x, 700 + (1 - pc) * 16, alpha=pc)
    if p['code']:
        put(fr, chip(p['code'], ORANGE, (150, 96, 60)), x + chip(p['dim']).width + 14, 700 + (1 - pc) * 16, alpha=pc)
    progress(fr, k, eo(prog(f, T_PIECES, T_PIECES + 20)) * (1 - eio(prog(f, T_PERF - 13, T_PERF))))
    return fr


def perf(f):
    u = f - T_PERF
    ga = 1 - eio(prog(u, 165, 180))
    fr = BG0.copy()
    tx(fr, 'PERFORMANCE', 600, 24, TXL, 150, u, 4, color=ORANGE, track=8, galpha=ga)
    tx(fr, 'Same performance. Every shape.', 700, 64, TXL, 188, u, 8, galpha=ga)
    cw, ch = 520, 262
    for i, (val, fmt, unit, label, sub) in enumerate(STATS):
        cx, cy = TXL + (i % 3) * (cw + 40), 330 + (i // 3) * (ch + 34)
        start = 20 + i * 7
        a = eo(prog(u, start, start + 14)) * ga
        if a <= 0:
            continue
        dy = (1 - eo(prog(u, start, start + 14))) * 22
        put(fr, card(cw, ch), cx, cy + dy, alpha=a)
        if fmt:
            v = val * eo(prog(u, start, start + 34))
            s = fmt.format(v)
        else:
            s = val
        vs = sprite(s, 700, 96, WHITE)
        put(fr, vs, cx + 34, cy + 26 + dy, alpha=a)
        put(fr, sprite(unit, 400, 42, ORANGE), cx + 34 + vs.width - 4, cy + 72 + dy, alpha=a)
        put(fr, sprite(label, 600, 22, MUTED, 6), cx + 38, cy + 176 + dy, alpha=a)
        if sub:
            put(fr, sprite(sub, 300, 24, (214, 217, 236)), cx + 38, cy + 206 + dy, alpha=a)
    tx(fr, 'Values at 4000K · ±10% tolerance', 300, 22, TXL, 930, u, 70, color=MUTED, galpha=ga)
    return fr


def opts(f):
    u = f - T_OPTS
    ga = 1 - eio(prog(u, 136, 150))
    fr = BG0.copy()
    tx(fr, 'OPTIONS', 600, 24, TXL, 150, u, 4, color=ORANGE, track=8, galpha=ga)
    tx(fr, 'Shaped to your space.', 700, 64, TXL, 188, u, 8, galpha=ga)
    cols = [TXL, TXL + 590, TXL + 1180]
    heads = ['COLOUR TEMPERATURE', 'MOUNTING', 'FINISH']
    for i, (cx, head) in enumerate(zip(cols, heads)):
        s = 18 + i * 10
        a = eo(prog(u, s, s + 16)) * ga
        dy = (1 - eo(prog(u, s, s + 16))) * 22
        put(fr, sprite(head, 600, 22, ORANGE, 6), cx, 380 + dy, alpha=a)
        if i == 0:
            for j, (cct, name, col) in enumerate(CCTS):
                x = cx + 14 + j * 116
                put(fr, dot(col), x + 44, 422 + dy, alpha=a, anchor='c')
                put(fr, sprite(cct, 600, 24), x + 44, 572 + dy, alpha=a, anchor='c')
                put(fr, sprite(name, 300, 20, MUTED), x + 44, 606 + dy, alpha=a, anchor='c')
        elif i == 1:
            for j, kind in enumerate(['recessed', 'surface', 'suspended']):
                x = cx + j * 160
                put(fr, mount_icon(kind), x, 440 + dy, alpha=a)
                put(fr, sprite(kind.capitalize(), 600, 24), x + 70, 572 + dy, alpha=a, anchor='c')
        else:
            for j, (name, col) in enumerate([('Black', (26, 26, 30)), ('Gray', (136, 139, 146)), ('White', (242, 242, 244))]):
                x = cx + j * 150
                put(fr, square_icon(col, (120, 126, 180)), x + 70, 460 + dy, alpha=a, anchor='c')
                put(fr, sprite(name, 600, 24), x + 70, 572 + dy, alpha=a, anchor='c')
    tx(fr, 'Dimming and emergency backup optional', 300, 32, TXL, 740, u, 52, color=(214, 217, 236), galpha=ga)
    tx(fr, '3-year warranty, extendable to 5 years', 300, 32, TXL, 790, u, 58, color=(214, 217, 236), galpha=ga)
    return fr


def end(f):
    u = f - T_END
    fr = BG0.copy()
    la = 1 - eio(prog(u, 92, 110))
    tx(fr, 'One family. Every shape.', 700, 72, W / 2, 190, u, 8, anchor='c', galpha=la)
    cell = 250
    x0 = (W - cell * 7) / 2
    for i, key in enumerate(LINEUP):
        s = 14 + i * 6
        a = eo(prog(u, s, s + 14)) * la
        ig = eo(prog(u, s + 4, s + 26))
        cx = x0 + cell * i + cell / 2
        LINE_PROD[key].draw(fr, cx, 520, scale=1.0, ig=ig, alpha=a, glow_k=0.55)
        put(fr, sprite(PIECES[i]['name'], 600, 22, WHITE, 6), cx, 650, alpha=a, anchor='c')
    # End card. The logo enters with a light wipe at full opacity (brand rule).
    ya = eo(prog(u, 108, 128))
    a1 = sprite('Your ceiling. ', 300, 84)
    a2 = sprite('Your move.', 900, 84)
    lx = (W - a1.width - a2.width) / 2
    put(fr, a1, lx, 300 + (1 - ya) * 20, alpha=ya)
    put(fr, a2, lx + a1.width - 8, 300 + (1 - ya) * 20, alpha=ya)
    put(fr, LOGO, (W - LOGO.width) / 2, 470, wipe=eio(prog(u, 126, 150)))
    tx(fr, 'CHESS  ·  Designer Panel Light', 400, 32, W / 2, 690, u, 146, color=MUTED, anchor='c', rise=12)
    tx(fr, 'nlc.com.sa', 600, 32, W / 2, 738, u, 152, color=ORANGE, anchor='c', rise=12)
    return fr


def render(f):
    if f < T_TITLE:
        return board(f)
    if f < T_TITLE + 22:
        return Image.blend(board(f), title(f), eio((f - T_TITLE) / 22))
    if f < T_PIECES:
        return title(f)
    if f < T_PERF:
        return piece(f)
    if f < T_OPTS:
        return perf(f)
    if f < T_END:
        return opts(f)
    return end(f)


def render_bytes(f):
    return render(f).tobytes()


# ------------------------------------------------------------------- audio ---
def make_audio(path, seconds, sr=48000):
    n = int(seconds * sr)
    t = np.arange(n) / sr
    out = np.zeros(n)
    rng = np.random.default_rng(11)

    # Pad: slow chord bed, D major colour, crossfaded every 13 s.
    chords = [[146.83, 220.0, 329.63, 369.99, 554.37],
              [123.47, 185.0, 293.66, 440.0, 554.37],
              [98.0, 146.83, 246.94, 369.99, 554.37],
              [110.0, 146.83, 185.0, 220.0, 329.63]]
    seg = seconds / len(chords)
    for i, ch in enumerate(chords):
        env = np.clip(1 - np.abs((t - (i + 0.5) * seg) / (seg * 0.62)), 0, 1) ** 0.8
        voice = np.zeros(n)
        for j, fq in enumerate(ch):
            for det in (0.9985, 1.0015):
                ph = rng.uniform(0, 2 * np.pi)
                voice += np.sin(2 * np.pi * fq * det * t + ph) + 0.22 * np.sin(4 * np.pi * fq * det * t + ph)
        out += voice * env * (1 + 0.15 * np.sin(2 * np.pi * 0.11 * t + i))
    out *= 0.018
    out *= np.clip(t / 2.5, 0, 1)

    def add(sig, at):
        a = int(at * sr)
        if a >= n:
            return
        b = min(n, a + len(sig))
        out[a:b] += sig[:b - a]

    # Board ignition: pentatonic sparkle as the lit tiles come on.
    penta = [1174.66, 1318.51, 1479.98, 1760.0, 1975.53, 2349.32]
    bt = np.arange(int(0.9 * sr)) / sr
    lit = sorted(t0 for *_, l, t0 in TILES if l)
    for t0 in lit[::3][:44]:
        fq = penta[rng.integers(len(penta))]
        add(np.sin(2 * np.pi * fq * bt) * np.exp(-bt / 0.09) * 0.045, t0 / FPS)

    # Chess-piece clack + sub pulse on every reveal.
    ct = np.arange(int(0.35 * sr)) / sr
    click = rng.normal(0, 1, len(ct))
    click = np.diff(click, prepend=0) * np.exp(-ct / 0.004) * 0.35
    body = (np.sin(2 * np.pi * 390 * ct) * np.exp(-ct / 0.035) * 0.55 +
            np.sin(2 * np.pi * 1240 * ct) * np.exp(-ct / 0.018) * 0.28)
    st = np.arange(int(1.4 * sr)) / sr
    sub = np.sin(2 * np.pi * 52 * st) * np.exp(-st / 0.45) * np.clip(st / 0.01, 0, 1) * 0.5
    for fr in CLACKS:
        add((click + body) * 0.55, fr / FPS)
        add(sub, fr / FPS)

    # Room: exponentially decaying noise impulse response.
    ir_t = np.arange(int(2.2 * sr)) / sr
    ir = rng.normal(0, 1, len(ir_t)) * np.exp(-ir_t / 0.55)
    ir /= np.sqrt((ir ** 2).sum())
    m = 1 << int(np.ceil(np.log2(n + len(ir))))
    wet = np.fft.irfft(np.fft.rfft(out, m) * np.fft.rfft(ir, m), m)[:n]
    mix = out * 0.8 + wet * 0.45
    mix *= np.clip((seconds - t) / 1.5, 0, 1)
    mix /= max(1e-9, np.abs(mix).max()) / 0.8
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, 'wb') as wv:
        wv.setnchannels(2)
        wv.setsampwidth(2)
        wv.setframerate(sr)
        wv.writeframes(np.repeat(pcm[:, None], 2, axis=1).tobytes())


# -------------------------------------------------------------------- main ---
def load_assets(adir):
    global ASSETS, PROD, LINE_PROD, LOGO, BG0, BG1, VIG, TILES
    ASSETS = adir
    hero = {p['img'] for p in PIECES} | {'chess-master-1'}
    PROD = {k: Product(os.path.join(adir, k + '.png'), PBOX) for k in hero}
    LINE_PROD = {k: Product(os.path.join(adir, k + '.png'), (205, 160), pad=60) for k in LINEUP}
    logo = Image.open(os.path.join(adir, 'logo.png')).convert('RGBA')
    LOGO = logo.resize((round(logo.width * 150 / logo.height), 150), Image.LANCZOS)
    BG0, BG1, VIG = make_backdrops()
    TILES = make_tiles()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--assets', default='assets')
    ap.add_argument('--out', default='chess-commercial.mp4')
    ap.add_argument('--stills', help='comma-separated frame numbers to save as JPEG')
    ap.add_argument('--still-scale', type=float, default=1.0)
    ap.add_argument('--still-dir', default='stills')
    ap.add_argument('--procs', type=int, default=os.cpu_count() or 2)
    ap.add_argument('--no-audio', action='store_true')
    ap.add_argument('--qa', action='store_true', help='print layout and exposure checks')
    a = ap.parse_args()
    load_assets(a.assets)

    if a.qa:
        print('logo', LOGO.size, 'mean RGBA', [round(v) for v in np.asarray(LOGO).reshape(-1, 4)[np.asarray(LOGO)[..., 3].ravel() > 128].mean(0)])
        for k, p in enumerate(PIECES):
            pr = PROD[p['img']]
            left = PCX - pr.size0[0] * 1.02 / 2
            name_r = TXL - 8 + sprite(p['name'], 900, 150, WHITE, 2).width
            line_r = TXL + max(sprite(s, 300, 38).width for s in p['line'].split('\n'))
            fr = np.asarray(render(T_PIECES + k * PIECE_LEN + 60)).astype(np.int32)
            x0, x1 = int(PCX - pr.size0[0] / 2), int(PCX + pr.size0[0] / 2)
            y0, y1 = int(PCY - pr.size0[1] / 2), int(PCY + pr.size0[1] / 2)
            reg = fr[max(0, y0):y1, max(0, x0):x1]
            clip = (reg.min(-1) >= 250).mean()
            print(f"{p['name']:7s} dark={pr.dark} size={pr.size0} left={left:.0f} name_r={name_r} gap={left - max(name_r, line_r):.0f} "
                  f"y={y0}..{y1} clip={clip:.2f} mean={reg.mean():.0f}")
        for key in LINEUP:
            print('lineup', key, LINE_PROD[key].size0, 'dark', LINE_PROD[key].dark)
        return

    if a.stills:
        os.makedirs(a.still_dir, exist_ok=True)
        for f in [int(x) for x in a.stills.split(',')]:
            im = render(f)
            if a.still_scale != 1:
                im = im.resize((round(W * a.still_scale), round(H * a.still_scale)), Image.LANCZOS)
            im.save(os.path.join(a.still_dir, f'f{f:04d}.jpg'), quality=88)
        return

    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
           '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-']
    if not a.no_audio:
        wav = os.path.splitext(a.out)[0] + '.wav'
        make_audio(wav, TOTAL / FPS)
        cmd += ['-i', wav, '-c:a', 'aac', '-b:a', '192k']
    cmd += ['-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart', '-shortest', a.out]
    enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with mp.get_context('fork').Pool(a.procs) as pool:
        for i, buf in enumerate(pool.imap(render_bytes, range(TOTAL), chunksize=4)):
            enc.stdin.write(buf)
            if i % 150 == 0:
                print(f'frame {i}/{TOTAL}', flush=True)
    enc.stdin.close()
    sys.exit(enc.wait())


if __name__ == '__main__':
    main()
