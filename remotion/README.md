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
| `ProductCommercial` | 1920×1080 · 30 fps | 25 s | **Datasheet commercial** for one product — YouTube / LinkedIn / website |
| `ProductCommercialVertical` | 1080×1920 · 30 fps | 25 s | Same commercial, vertical — Reels / Stories / TikTok |
| `ProductCommercialArabic` | 1080×1920 · 30 fps | 25 s | Same commercial in Arabic, RTL |

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

### Datasheet commercials (one product, three cuts)

`ProductCommercial` is a 25-second commercial for a single luminaire, cut from one
timeline into 16:9, 9:16 and 9:16 Arabic:

| Time | Scene | What it shows |
|------|-------|---------------|
| 0–4 s | Hook | One aperture switches on; the beam finds the floor |
| 4–9 s | Reveal | The product photo, wiped in by a bar of light · category · name |
| 9–16 s | Datasheet | Up to six spec rows from the datasheet, writing themselves |
| 16–21 s | Application | Downlights along a wall switch on in a wave — scallops and floor pools |
| 21–25 s | CTA | Master logo · "Download the {NAME} datasheet" · nlc.com.sa |

```bash
node scripts/render-commercial.mjs delta            # → out/commercials/delta-16x9.mp4, -9x16.mp4, -9x16-ar.mp4
node scripts/render-commercial.mjs delta --dry-run  # show the photo/specs/fonts it found, render nothing
node scripts/render-commercial.mjs delta --site=/path/to/Website
```

**Everything the video says about the product comes from the product's own
files.** Run from the website repo and the script picks them up by itself:

| Source on the site | Used for |
|--------------------|----------|
| `images/products/{key}.png` (+ `-g2`, `-g3` …) | The hero shot (copied into `public/products/`, git-ignored) |
| `product/{key}.html` + `ar/product/{key}.html` | Spec rows (EN labels, AR labels paired row-by-row) → written to `src/data/commercials/{key}.json` for review |
| `fonts/Bizmo-*.woff2`, `fonts/LamaSans-*.woff2` | Exact logo wordmark and brand Arabic face (copied, git-ignored) |

`src/data/commercials/{key}.json` is the reviewed source of truth: edit a
value there and re-render. A product without a JSON file is seeded from the
catalogue on first run (set its `categoryAr`; for non-downlights add a
`hook` / `hookAr` line, since the default opening line is about downlights).

Honest fallbacks — the template never invents a figure:

- **No photo** → a flat line-art downlight icon (never a render posing as the product).
- **No specs** → the datasheet scene shows a *typical* downlight distribution,
  labelled as typical, and points to the datasheet for the measured photometry.

Copy follows the brand voice (§01): calm, specific, one orange word per
headline. The application line is the guidelines' own approved EN/AR pair.
All copy is in `src/data/commercialCopy.ts`.

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
  data/commercials/*.json   # per-product commercial data (photo, specs) — reviewed facts only
  data/commercialCopy.ts    # EN + AR commercial copy (brand voice)
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
    TypeReveal.tsx          # word-by-word text reveal (optional single orange word)
    ProductHero.tsx         # product photo revealed by a light wipe (icon fallback)
    SpecSheet.tsx           # datasheet table that writes itself, RTL-aware
    Downlight.tsx           # downlight icon, single-beam hook, wall-wash elevation
    Eyebrow.tsx             # section label per the type scale
    Atmosphere.tsx          # backdrops, vignette, light-flash transitions
  compositions/             # the four deliverables
```

## Editing copy

All headline copy lives inline in `src/compositions/*.tsx`; shared taglines in
`src/brand.ts`. Change the text, re-render — the animation adapts (word-by-word
reveals are computed from the string).
