# NLC Brand Videos — Remotion

Programmatic (AI-generated, code-driven) brand videos for **National Lighting Company**,
built with [Remotion](https://remotion.dev). Every frame is rendered from React
components — no stock footage, no editing suite. All visuals are procedural:
the spark, the self-drawing bulb (with an "N" filament), the light-cone
luminaire icons, and the Saudi skyline that ignites window-by-window.

Brand tokens mirror the website: navy `#24285e`, orange `#F6851F`, Outfit font
(bundled locally in `public/fonts`).

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
