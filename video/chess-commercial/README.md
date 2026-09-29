# CHESS family commercial

A 52-second, 16:9 commercial for the whole CHESS family (Square, Master, Block,
Line, Hexa, Way, Quiet), in the NLC brand palette, using the real product photos
and the master logo from nlc.com.sa.

**Rendered film:** `NLC-CHESS-family-commercial-16x9.mp4` (1920×1080, 30 fps,
H.264 + AAC, 52 s, 16 MB) is in the Higgsfield media library, media id
`d5020c4a-ba59-4278-8ecc-aca98791d02a`.

![Frames from the render: title, Square, Way, end card](preview.jpg)

## Storyboard

| Time | Scene | On screen |
|------|-------|-----------|
| 0:00–0:05 | The board | A ceiling of panels lights up as a chessboard (each lit tile is a 4×4-cell CHESS panel). "Every ceiling is a board." |
| 0:05–0:10 | Title | CHESS MASTER powers on. "CHESS · Designer Panel Light · Innovative Shapes, Powerful Light." |
| 0:10–0:34 | Seven moves | One shape per 3.5 s, "MOVE 01 / 07" to "07 / 07": photo powers on over a lit chessboard wall, with name, one line, size and model code. A chess-piece "clack" marks each move. |
| 0:34–0:40 | Performance | 35 W · 3,500 lm · 100 lm/W · UGR<13 · CRI>80 (>90 optional) · 100,000 h L70B50. Footnote: values at 4000K, ±10%. |
| 0:40–0:45 | Options | 2700K/3000K/4000K/6500K · Recessed/Surface/Suspended · Black/Gray/White · dimming and emergency optional · 3-year warranty, extendable to 5. |
| 0:45–0:52 | Family + end card | All seven in a row: "One family. Every shape." Then "Your ceiling. Your move.", the NLC logo (light-wipe entrance, always at full opacity) and nlc.com.sa. |

Every figure comes from the live CHESS product pages. The film shows no figure
that a page does not state. For example, Quiet has no model code or exact size
on its page, so the film says "Compact panel" and nothing more.

## Re-render

Needs Python 3 with Pillow and numpy, plus ffmpeg and `rsvg-convert`.

```bash
./fetch_assets.sh                                  # photos, logo, Outfit -> ./assets
python3 chess_commercial.py --qa                   # layout/exposure checks, no render
python3 chess_commercial.py --stills 240,365,1530 --still-scale 0.5   # preview frames
python3 chess_commercial.py --out NLC-CHESS-family-commercial-16x9.mp4
```

A full render takes about 40 s on 8 cores. Copy, specs and the order of the
shapes are in the `PIECES`, `STATS` and `CCTS` tables at the top of
`chess_commercial.py`. The headline font is Outfit, because Bizmo is licensed
and not bundled.

## Photo version (Gemini stills, no video generation)

Each shape's scene can show a Gemini photo of that shape installed in a real
interior, instead of the product cut-out. No AI video is generated. The film
animates the stills: a slow push-in, the room "powering on" from navy dark,
and the text over a navy veil on the left.

`generate_stills.py` sends each shape's product photo to Gemini Nano Banana 2
(`gemini-3.1-flash-image-preview`) as the reference image, so the real
luminaire is placed in the scene. It saves 16:9 stills to
`assets/scenes/<shape>.png`. The renderer uses a still for every shape that
has one.

```bash
./fetch_assets.sh
export GEMINI_API_KEY=...                     # Google AI Studio key
python3 generate_stills.py                    # all seven shapes
python3 generate_stills.py hexa way           # re-roll any that look wrong
python3 chess_commercial.py --out NLC-CHESS-family-commercial-16x9.mp4
```

The scene for each shape (office, boardroom, clinic corridor, gallery, hotel
café, boutique, library) and the prompt are in the `SCENES` table in
`generate_stills.py`. Check each still before rendering: the fixture must keep
the product's real shape, finish and cell pattern.

To make the stills by hand in Gemini or AI Studio instead, attach the product
photo, use the prompt from `generate_stills.py`, set 16:9, and save the result
as `assets/scenes/<shape>.png`.
