# NLC Brand Videos — Remotion

Programmatic (AI-generated, code-driven) brand videos for **National Lighting Company**,
built with [Remotion](https://remotion.dev). Every frame is rendered from React
components — no stock footage, no editing suite. All visuals are procedural:
the spark, the self-drawing bulb (with an "N" filament), the light-cone
luminaire icons, and the Saudi skyline that ignites window-by-window.

## Brand compliance

Colours, logo and typography follow `NLC-Brand-Guidelines-source.html`:
navy `#24285E`, orange `#F6851F`, navy deep `#0F1235`.

**The logo is the master vector**, not a recreation. `src/components/NLCLogo.tsx`
embeds the exact mark path lifted from the guidelines' master SVG, with the
official variants (A primary / B reversed / C mark-only). It is built to respect
all eight misuse rules — never rotated, stretched, recoloured, re-typeset,
shadowed, or set below 100% opacity — so the entrance is a **light wipe**
(a clip reveal) rather than a fade.

⚠️ **Bizmo is not bundled** (licensed). The wordmark inside the lockup falls back
to Outfit until you copy `Bizmo-*.woff2` into `public/fonts/` — see
`public/fonts/README.md`. Everything else in the logo is already exact.

ℹ️ Note: the master logo artwork fills the mark with `#F4831F`, which differs
very slightly from the documented brand orange `#F6851F` used everywhere else.
The component reproduces the artwork's own value; worth reconciling at source.

## Compositions

| ID | Format | Duration | Use |
|----|--------|----------|-----|
| `YouTubeCommercial` | 1920×1080 · 30 fps | 30 s | Cinematic brand commercial — "Every city begins in the dark." |
| `InstagramReel` | 1080×1920 · 30 fps | 15 s | Vertical hook-first cutdown for Reels/Stories/TikTok |
| `InstagramPost` | 1080×1080 · 30 fps | 12 s | **Seamless loop** square post (every animation is periodic) |
| `LinkedInPost` | 1920×1080 · 30 fps | 20 s | B2B cut: credibility → stats → portfolio → partnership CTA |
| `ArabicReel` | 1080×1920 · 30 fps | 15.6 s | النسخة العربية — RTL vertical reel, Cairo typeface |
| `SaudiProjectMap` | 1920×1080 · 30 fps | 18 s | Geographic proof film — the Kingdom ignites city by city |
| `ProductSpot` | 1080×1350 · 30 fps | 8 s | **Per-product spot**, rendered once per catalogue product |
| `AlligatorCommercial` | 1920×1080 · 30 fps | 20 s | ALLIGATOR linear-light commercial, 16:9 master |
| `AlligatorReel` | 1080×1920 · 30 fps | 20 s | Same commercial, vertical cut for Reels/Stories/TikTok |

### The product-video factory

`ProductSpot` is parameterised, and `src/data/products.ts` is derived from the
live `products.html` catalogue (156 products, 23 categories). One command
renders a spot for every product:

```bash
npm run render:products                    # all 156 → out/products/<key>.mp4
node scripts/render-products.mjs comet     # a single product
node scripts/render-products.mjs --cat=high-bay
```

Each spot's hero visual is the product's **photometric distribution curve** —
the polar intensity plot a lighting engineer actually reads — drawn live, swept
by a scan ray, with the beam angle computed from the curve itself
(`beamAngle()` measures full-width-half-maximum). A street light's asymmetric
road-side throw and a high bay's tight downward lobe produce visibly different
films from the same template.

> **Accuracy note.** The distribution shapes in `src/data/products.ts` are
> *category-typical* illustrations, not measured photometry, and the on-screen
> footnote says so. Wire real IES/LDT data (or per-product `specs`) in before
> using these as spec claims — `specs` is deliberately empty by default so the
> template can never invent a wattage or lumen figure.

### The ALLIGATOR commercial

`LinearCommercial` is a 20-second product commercial for a linear luminaire,
laid out for any frame size. Five beats: a single line of light is drawn
across the dark ("Every space has a line.") → a corridor's ceiling runs ignite
segment by segment as the camera dollies in ("Draw it in light.") → the
ALLIGATOR name and product hero → the light-distribution curve → NLC end card
pointing to the datasheet.

```bash
npm run render:alligator   # out/commercials/alligator-16x9.mp4 + alligator-9x16.mp4
```

**Stills come from Gemini, motion from the edit.** No AI video is generated:
Gemini (Nano Banana 2, `gemini-3.1-flash-image-preview`) makes four stills
image-to-image from the real catalogue photo, and the commercial animates
them with slow push-ins and crossfades.

| Shot | Where it plays |
|------|----------------|
| `hero` | Scene 3, full-bleed behind the ALLIGATOR title |
| `office`, `lobby` | Scene 2, the product at work |
| `detail` | Scene 4, dimmed behind the light distribution |

```bash
export GEMINI_API_KEY=...                          # https://aistudio.google.com/apikey
python3 scripts/gemini_stills.py alligator          # 4 shots × 16:9 + 9:16 → public/commercials/alligator/
npm run render:alligator                            # picks the stills up automatically
```

`python3 scripts/gemini_stills.py alligator --print` prints the finished
prompts instead, for pasting into AI Studio by hand (attach the product photo,
set the aspect ratio, 2K). Save the results as
`public/commercials/alligator/<shot>-16x9.png` / `<shot>-9x16.png`. Shot
prompts live in `stills/alligator.json`. Any shot that is missing falls back to
the procedural scene.

The script uses `public/products/alligator.png` as the reference, downloading
it from the site on first run. Without that photo there are no stills, so
Gemini is never asked to imagine the product.

**Specs.** Fill `specs` in `src/data/commercials.ts` from
`datasheets/alligator.pdf` (e.g. `{k: 'CRI', v: '90+'}`). They appear as chips
beside the distribution curve. Empty means no chips.

The distribution curve is illustrative (captioned as such on screen) and
shows no numeric readout. Music is added in the edit, per the brand video
system; the render carries a silent track.

## Commands

```bash
cd remotion
npm install

npm run studio           # live preview / timeline editor
npm run render:youtube   # out/nlc-youtube-commercial.mp4
npm run render:reel      # out/nlc-instagram-reel.mp4
npm run render:square    # out/nlc-instagram-post.mp4
npm run render:linkedin  # out/nlc-linkedin-post.mp4
npm run render:all
```

`remotion.config.ts` auto-detects the pre-installed Chromium headless shell in
the remote render environment; on a local machine Remotion downloads its own
headless browser automatically.

## Structure

```
src/
  brand.ts                  # colors, font stack, taglines
  fonts.ts                  # local Outfit + Cairo font loading (no network needed)
  data/products.ts          # 156 products derived from products.html
  components/               # reusable animated pieces
    Photometric.tsx         # animated polar light-distribution plot
    SaudiMap.tsx            # KSA outline (real lon/lat) + city ignition
    Spark.tsx               # flickering ignition point-light
    BulbDraw.tsx            # self-drawing bulb, "N" filament, ignition flash
    Skyline.tsx             # procedural skyline w/ arch tower, ignition wave
    LuminaireIcons.tsx      # street/flood/high-bay/linear fixtures + cones
    StatCounter.tsx         # spring counters (33 yrs / 3,200+ / 142)
    LogoLockup.tsx          # NLC wordmark + light-sweep underline
    LightRays.tsx           # rotating volumetric rays
    ParticleField.tsx       # drifting embers (seeded, deterministic)
    TypeReveal.tsx          # word-by-word text reveal
    Atmosphere.tsx          # backdrops, vignette, light-flash transitions
  compositions/             # the four deliverables
```

## Editing copy

All headline copy lives inline in `src/compositions/*.tsx`; shared taglines in
`src/brand.ts`. Change the text, re-render — the animation adapts (word-by-word
reveals are computed from the string).
