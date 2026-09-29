#!/usr/bin/env python3
"""Generate the CHESS commercial scene stills with Gemini (Nano Banana 2).

Each shape's product photo (assets/<photo>.png, from fetch_assets.sh) is sent as
the reference image, so Gemini places the real luminaire in the scene instead
of inventing one. Output: assets/scenes/<shape>.png, 16:9. chess_commercial.py
uses a still automatically when it exists.

    export GEMINI_API_KEY=...          # Google AI Studio key
    python3 generate_stills.py                 # all seven shapes
    python3 generate_stills.py hexa way        # re-roll some
"""
import argparse
import base64
import io
import json
import os
import sys
import urllib.error
import urllib.request

from PIL import Image

MODEL = 'gemini-3.1-flash-image-preview'   # Nano Banana 2, as in PROMPTS-ALL.md

STYLE = (
    'Photorealistic architectural interior photograph for a premium lighting '
    'commercial. {scene} The ceiling luminaires are exactly the product in the '
    'attached photo: {shape}. Keep its exact outline, body colour, LED cell '
    'pattern and proportions; do not redesign it. The luminaires are switched on '
    'and glowing with warm 3000K light. Premium modern Saudi interior, calm '
    'evening mood, deep navy shadows and warm highlights. Shot on Sony A7R IV, '
    '24mm, f/5.6, slightly low angle so the ceiling fixtures are clearly visible '
    'in the upper half of the frame. Keep the left third of the frame calm and '
    'uncluttered. No people, no text, no signage, no logos, no watermark.'
)

SCENES = {
    'square': ('chess-square-1',
               'An open-plan office in Riyadh at dusk, a grid ceiling of these panels over oak desks, the city skyline through floor-to-ceiling glass.',
               'a square 596 x 596 mm white panel with small square LED cells on its face'),
    'master': ('chess-master-1',
               'An executive boardroom with a long walnut table and leather chairs, three of these panels recessed in a row above the table, city lights through the glass.',
               'a square 596 x 596 mm white panel with a 4 x 4 grid of square LED cells'),
    'block': ('chess-block-1',
              'A calm, modern clinic corridor with light stone floors and wood-panelled walls, these panels set in a steady rhythm along the ceiling.',
              'a slim 1196 x 296 mm white rectangular panel with four square LED cells in a row'),
    'line': ('chess-line-1',
             'An art gallery corridor with a travertine floor and framed artworks, continuous runs of these linear fixtures along the ceiling.',
             'a long 1200 x 155 mm white linear bar with a row of small square LED cells'),
    'hexa': ('chess-hexa-1',
             'A boutique hotel cafe with marble tables and brass details, these hexagonal panels clustered into a honeycomb pattern across the ceiling.',
             'a white hexagonal 550 x 635 mm panel with square LED cells'),
    'way': ('chess-way-1',
            'A fashion boutique with a dark ceiling and oak display tables, these black panels suspended on thin straight wires above the tables.',
            'a square 596 x 596 mm black panel with two columns of square LED cells'),
    'quiet': ('chess-quite-1',
              'A university library reading room with long timber reading tables and bookshelves, these compact black panels on the ceiling above the tables.',
              'a compact square black panel with a 4 x 4 grid of square LED cells'),
}


def reference_png(path, max_side=1536):
    im = Image.open(path).convert('RGBA')
    im = im.crop(im.getbbox())
    im.thumbnail((max_side, max_side))
    buf = io.BytesIO()
    im.save(buf, 'PNG')
    return base64.b64encode(buf.getvalue()).decode()


def generate(key, model, prompt, ref_b64, size):
    config = {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': '16:9'}}
    if size:
        config['imageConfig']['imageSize'] = size
    body = {
        'contents': [{'parts': [{'text': prompt},
                                {'inline_data': {'mime_type': 'image/png', 'data': ref_b64}}]}],
        'generationConfig': config,
    }
    req = urllib.request.Request(
        f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        data=json.dumps(body).encode(),
        headers={'Content-Type': 'application/json', 'x-goog-api-key': key})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            resp = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f'Gemini API error {e.code}: {e.read().decode()[:600]}')
    for cand in resp.get('candidates', []):
        for part in cand.get('content', {}).get('parts', []):
            data = part.get('inlineData') or part.get('inline_data')
            if data:
                return base64.b64decode(data['data'])
    sys.exit(f'No image in response: {json.dumps(resp)[:600]}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('shapes', nargs='*', default=list(SCENES))
    ap.add_argument('--assets', default='assets')
    ap.add_argument('--model', default=MODEL)
    ap.add_argument('--size', default='2K', help="imageSize ('' to omit)")
    a = ap.parse_args()
    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        sys.exit('Set GEMINI_API_KEY (a Google AI Studio key).')
    out = os.path.join(a.assets, 'scenes')
    os.makedirs(out, exist_ok=True)
    for shape in a.shapes:
        photo, scene, note = SCENES[shape]
        prompt = STYLE.format(scene=scene, shape=note)
        img = generate(key, a.model, prompt, reference_png(os.path.join(a.assets, photo + '.png')), a.size)
        im = Image.open(io.BytesIO(img)).convert('RGB')
        path = os.path.join(out, shape + '.png')
        im.save(path)
        print(f'{shape}: {path} {im.size}', flush=True)


if __name__ == '__main__':
    main()
