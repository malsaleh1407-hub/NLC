#!/usr/bin/env python3
"""Stills-only product commercial: slow camera moves over AI stills, crossfades,
brand captions and an NLC end card. No generated video clips.

Built to run in the Higgsfield sandbox (Pillow, ffmpeg, sox, rsvg-convert):
    python3 build_commercial.py spec.json out.mp4 [preview_seconds...]
With preview seconds it writes preview.jpg (one small frame per time) instead
of the movie.
"""
import json, math, os, subprocess, sys, urllib.request
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1920, 1080, 30
NAVY, DEEP, ORANGE, WHITE = (36, 40, 94), (15, 18, 53), (246, 133, 31), (255, 255, 255)
# Master mark from NLC-Brand-Guidelines-source.html. Never redraw or recolour it.
MARK_PATH = ('M37.6363 30.6709V35.1239L27.2574 25.0325C26.6924 24.4601 26.2386 23.802 25.9139 23.0764C25.5891 22.3553 25.3934 21.5981 25.3355 20.8273C25.3044 20.4983 25.2911 20.1558 25.2911 19.7862C25.2911 18.8397 25.3934 17.8797 25.5936 16.9287L25.687 16.496L25.2599 16.5952C24.0009 16.8791 22.7108 16.9648 21.4162 16.8566C20.5487 16.7935 19.7079 16.5501 18.9116 16.1354L18.8493 16.1084C18.271 15.7974 17.7416 15.3963 17.27 14.914L12.3319 9.85704V9.82549L10.5124 7.96406L2.67369 0.0135213H7.38045C7.5584 0.0135213 7.7319 0.085635 7.86092 0.216341L21.9412 14.5805L21.9278 0.0135213L25.3622 0V14.3867L37.5518 2.0282V6.81925C37.5518 7.00404 37.4806 7.17531 37.356 7.30602L27.8402 16.9512L37.5117 16.9377V20.5344H27.8268L37.4361 30.1841C37.5651 30.3148 37.6363 30.4906 37.6363 30.6709Z')
# Bizmo (the wordmark face) is licensed and not bundled; Outfit is the brand fallback.
FONT_URL = 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-{}-normal.ttf'
# Zoom start/end and pan start/end as a fraction of the room the zoom leaves.
MOVES = {'in': (1.0, 1.12, (0, 0), (0, 0)), 'out': (1.12, 1.0, (0, 0), (0, 0)),
         'left': (1.1, 1.1, (.9, 0), (-.9, 0)), 'right': (1.1, 1.1, (-.9, 0), (.9, 0)),
         'rise': (1.1, 1.14, (0, .8), (0, -.8))}


def font(weight, size):
    path = f'/tmp/outfit-{weight}.ttf'
    if not os.path.exists(path):
        urllib.request.urlretrieve(FONT_URL.format(weight), path)
    return ImageFont.truetype(path, size)


def ease(p):
    p = min(max(p, 0.0), 1.0)
    return 0.5 - 0.5 * math.cos(math.pi * p)


def spaced(draw, xy, text, fnt, fill, spacing):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill, anchor='ls')
        x += fnt.getlength(ch) + spacing
    return x


def width(text, fnt, spacing):
    return sum(fnt.getlength(ch) + spacing for ch in text) - spacing


def scrim(side):
    """Navy gradient behind captions so white type stays legible on any still."""
    if side == 'left':
        g = Image.new('L', (W, 1))
        g.putdata([int(185 * ease(1 - x / (W * .62))) for x in range(W)])
    else:
        g = Image.new('L', (1, H))
        g.putdata([int(185 * ease((y - H * .45) / (H * .55))) for y in range(H)])
    layer = Image.new('RGBA', (W, H), DEEP + (0,))
    layer.putalpha(g.resize((W, H)))
    return layer


def caption_layer(shot, first):
    layer = scrim('left' if first else 'bottom')
    d = ImageDraw.Draw(layer)
    x = 120
    if first:  # opening title card, left third
        spaced(d, (x, 430), shot.get('eyebrow', ''), font(500, 26), ORANGE, 6)
        spaced(d, (x - 6, 580), shot['title'], font(700, 150), WHITE, 22)
        d.rectangle((x, 628, x + 72, 634), fill=ORANGE)
        d.text((x, 710), shot.get('sub', ''), font=font(300, 44), fill=WHITE, anchor='ls')
    else:
        spaced(d, (x, H - 238), shot.get('eyebrow', ''), font(500, 24), ORANGE, 6)
        d.rectangle((x, H - 214, x + 64, H - 209), fill=ORANGE)
        d.text((x, H - 128), shot['caption'], font=font(600, 64), fill=WHITE, anchor='ls')
    return layer


def logo_layer(height):
    k = height / 39
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 39" width="{38 * k:.0f}" '
           f'height="{39 * k:.0f}"><path d="{MARK_PATH}" fill="#F4831F"/></svg>')
    open('/tmp/mark.svg', 'w').write(svg)
    subprocess.run(['rsvg-convert', '/tmp/mark.svg', '-o', '/tmp/mark.png'], check=True)
    small = font(500, int(5 * k))
    descriptor = 'NATIONAL LIGHTING CO.'
    # Outfit sets wider than Bizmo, so size the canvas to the descriptor, not the 106-unit artboard.
    logo = Image.new('RGBA', (int(max(106 * k, 48 * k + width(descriptor, small, .5 * k) + 4)), int(39 * k)), (0, 0, 0, 0))
    logo.alpha_composite(Image.open('/tmp/mark.png').convert('RGBA'))
    d = ImageDraw.Draw(logo)  # reversed variant: white wordmark on navy
    d.text((48 * k, 26 * k), 'NLC', font=font(900, int(22 * k)), fill=WHITE, anchor='ls')
    spaced(d, (48 * k, 35 * k), descriptor, small, WHITE, .5 * k)
    return logo


def endcard_bg():
    bg = Image.new('RGB', (W, H), DEEP)
    glow = Image.new('L', (W, H))
    px = glow.load()
    for y in range(0, H, 2):
        for x in range(0, W, 2):
            v = int(255 * ease(1 - math.hypot((x - W / 2) / (W * .6), (y - H * .42) / (H * .7))))
            px[x, y] = px[x + 1, y] = px[x, y + 1] = px[x + 1, y + 1] = v
    return Image.composite(Image.new('RGB', (W, H), NAVY), bg, glow)


def load(url):
    path = '/tmp/still-' + str(abs(hash(url))) + '.img'
    if not os.path.exists(path):
        urllib.request.urlretrieve(url, path)
    return Image.open(path).convert('RGB')


SPEC = json.load(open(sys.argv[1]))
SEG, XF, END = SPEC.get('seg', 4.8), SPEC.get('xfade', 0.7), SPEC.get('end', 5.0)
SHOTS = SPEC['shots']
STILLS = [load(s['url']) for s in SHOTS]
CAPS = [caption_layer(s, i == 0) for i, s in enumerate(SHOTS)]
STEP = SEG - XF
END_AT = len(SHOTS) * STEP
TOTAL = END_AT + END
LOGO = logo_layer(210)
BG = endcard_bg()
END_TEXT = Image.new('RGBA', (W, H), (0, 0, 0, 0))
_d = ImageDraw.Draw(END_TEXT)
spaced(_d, ((W - width(SPEC['product'], font(700, 60), 14)) / 2, 690), SPEC['product'], font(700, 60), WHITE, 14)
_d.text((W / 2, 745), SPEC['category'], font=font(300, 34), fill=WHITE, anchor='ms')
URL_TEXT = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ImageDraw.Draw(URL_TEXT).text((W / 2, 835), SPEC['url'], font=font(600, 34), fill=ORANGE, anchor='ms')


def kenburns(img, move, p):
    s0, s1, (fx0, fy0), (fx1, fy1) = MOVES[move]
    e = ease(p)
    s = s0 + (s1 - s0) * e
    base = max(W / img.width, H / img.height)
    sw, sh = img.width * base, img.height * base
    dx = (fx0 + (fx1 - fx0) * e) * (sw - W / s) / 2
    dy = (fy0 + (fy1 - fy0) * e) * (sh - H / s) / 2
    a = 1 / (s * base)
    c = (sw / 2 + dx - W / (2 * s)) / base
    f = (sh / 2 + dy - H / (2 * s)) / base
    return img.transform((W, H), Image.AFFINE, (a, 0, c, 0, a, f), resample=Image.BICUBIC)


def faded(layer, m, rise=0):
    if m <= 0:
        return None
    out = layer.copy()
    out.putalpha(out.getchannel('A').point(lambda v: int(v * m)))
    if rise:
        moved = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        moved.paste(out, (0, int(rise * (1 - m))))
        out = moved
    return out


def shot_frame(i, u):
    frame = kenburns(STILLS[i], SHOTS[i].get('move', 'in'), u / SEG).convert('RGBA')
    t_in = (1.1, 1.9) if i == 0 else (0.5, 1.1)
    m = ease((u - t_in[0]) / (t_in[1] - t_in[0])) * (1 - ease((u - (SEG - 1.0)) / 0.5))
    cap = faded(CAPS[i], m, rise=24)
    if cap:
        frame.alpha_composite(cap)
    return frame


def end_frame(u):
    frame = BG.convert('RGBA')
    r = ease((u - 0.8) / 1.0)  # light wipe, full opacity (brand rule: logo never fades)
    if r > 0:
        cut = LOGO.crop((0, 0, max(1, int(LOGO.width * r)), LOGO.height))
        x0, y0 = (W - LOGO.width) // 2, 410 - LOGO.height // 2
        frame.alpha_composite(cut, (x0, y0))
        if r < 1:
            ImageDraw.Draw(frame).rectangle((x0 + cut.width, y0 - 10, x0 + cut.width + 3, y0 + LOGO.height + 10), fill=ORANGE)
    for layer, start in ((END_TEXT, 1.9), (URL_TEXT, 2.4)):
        lay = faded(layer, ease((u - start) / 0.6), rise=16)
        if lay:
            frame.alpha_composite(lay)
    return frame


def render(fi):
    t = fi / FPS
    layers = []  # (start, frame); at most two overlap, during a crossfade
    for i in range(len(SHOTS)):
        if i * STEP <= t < i * STEP + SEG:
            layers.append((i * STEP, shot_frame(i, t - i * STEP)))
    if t >= END_AT:
        layers.append((END_AT, end_frame(t - END_AT)))
    if len(layers) == 2:
        out = Image.blend(layers[0][1], layers[1][1], ease((t - layers[1][0]) / XF))
    else:
        out = layers[0][1]
    return out.convert('RGB').tobytes()


def pad(seconds, path):
    """Quiet ambient bed (A-major drone) so the cut is not silent."""
    tones = []
    for n, (f, v) in enumerate(((110, .30), (164.81, .22), (220, .20), (277.18, .12), (329.63, .12), (440, .05))):
        tone = f'/tmp/tone{n}.wav'
        subprocess.run(['sox', '-n', '-r', '48000', '-c', '1', tone, 'synth', str(seconds), 'sine', str(f),
                        'vol', str(v), 'tremolo', str(.07 + .03 * n), '35'], check=True)
        tones.append(tone)
    subprocess.run(['sox', '-m', *tones, '/tmp/mix.wav'], check=True)
    subprocess.run(['sox', '/tmp/mix.wav', path, 'remix', '1', '1', 'lowpass', '1600', 'reverb', '70',
                    'fade', 'q', '2.5', str(seconds), '3.5', 'norm', '-18'], check=True)


if __name__ == '__main__':
    out = sys.argv[2]
    if len(sys.argv) > 3:  # preview frames only
        frames = [Image.frombytes('RGB', (W, H), render(int(float(s) * FPS))) for s in sys.argv[3:]]
        sheet = Image.new('RGB', (400, 225 * len(frames)))
        for n, fr in enumerate(frames):
            sheet.paste(fr.resize((400, 225), Image.LANCZOS), (0, 225 * n))
        sheet.save('preview.jpg', quality=40)
        sys.exit(0)
    frames = int(TOTAL * FPS)
    pad(TOTAL, '/tmp/pad.wav')
    enc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                            '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', '/tmp/pad.wav',
                            '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                            '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest',
                            '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    with Pool(os.cpu_count()) as pool:
        for buf in pool.imap(render, range(frames), chunksize=4):
            enc.stdin.write(buf)
    enc.stdin.close()
    sys.exit(enc.wait())
