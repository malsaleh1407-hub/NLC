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
  fonts.ts                  # local Outfit font loading (no network needed)
  components/               # reusable animated pieces
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
