# Fonts

`Outfit-*.ttf` and `Cairo-*.ttf` are bundled (open source, used for body copy and
Arabic respectively). The 800 weights — the guidelines' Section Title weight —
come from fontsource (`Outfit-800.woff2`, `Cairo-800-arabic.woff2`,
`Cairo-800-latin.woff2`), also SIL Open Font License 1.1.

## Bizmo — required for a pixel-exact logo lockup

**Bizmo is the NLC display face.** It sets the "NLC" wordmark and
"NATIONAL LIGHTING CO." descriptor inside the logo lockup, and per the brand
guidelines the wordmark must never be re-set in another typeface.

Bizmo is licensed and is therefore **not committed to this repo**. Copy these
files from the website project (`Website/fonts/`) into this folder:

```
Bizmo-Light.woff2      (300)
Bizmo-Regular.woff2    (400)
Bizmo-Medium.woff2     (500)
Bizmo-SemiBold.woff2   (600)
Bizmo-Bold.woff2       (700)
Bizmo-ExtraBold.woff2  (800)
Bizmo-Black.woff2      (900)
```

Then re-render:

```bash
npm run render:all
```

`src/fonts.ts` loads each face independently, so while Bizmo is missing the
renders still succeed — but the wordmark falls back to Outfit and **is not
final**. Everything else (the mark itself, colours, geometry, clear space) is
already exact, because the mark is the master vector path.

## Lama Sans — the brand Arabic face

Also licensed and not committed. Copy `LamaSans-Regular/Medium/Bold/Black.woff2`
from `Website/fonts/` for the Arabic commercial; until then Arabic falls back to
Cairo. `scripts/render-commercial.mjs` copies both families in automatically
when it can see the website folder, and `.gitignore` keeps them out of git.
