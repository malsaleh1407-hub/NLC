# Product commercials (stills only)

Same approach as the Mini commercial: no generated video clips. Each shot is a
Gemini still (Nano Banana 2 on Higgsfield, the product photo as reference), and
the motion comes from the edit: slow push-ins and pans, crossfades, brand
captions and an NLC end card.

## Files

| File | Purpose |
|------|---------|
| `build_commercial.py` | Renders the MP4 from a spec: 1920×1080, 30 fps, ~30 s, with a quiet ambient bed |
| `ocean/ocean.json` | OCEAN shot list: Gemini prompts, camera move and caption per shot |

## Making one

1. Generate one still per shot with `nano_banana_2`, 16:9, 2k (2 credits each),
   passing the product photo as `image_references`. Each prompt is
   `generation.brand + generation.product + shot.prompt`.
2. Put each still's URL in `shots[].url`.
3. Render in the Higgsfield sandbox (it has ffmpeg, sox and rsvg-convert):
   `python3 build_commercial.py ocean.json ocean.mp4`.
   Add times, e.g. `... ocean.json x 2.8 27.9`, to write `preview.jpg` frames instead.

Captions are plain marketing lines on purpose. Swap in datasheet figures
(IP rating, lumens, wattage) only from the product's PDF, never guessed.

Brand notes: the logo mark is the master path from
`NLC-Brand-Guidelines-source.html`, revealed with a wipe (never faded). Bizmo is
licensed and not bundled, so the wordmark falls back to Outfit.
