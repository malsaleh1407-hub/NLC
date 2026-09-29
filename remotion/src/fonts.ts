import {continueRender, delayRender, staticFile} from 'remotion';

// Outfit + Cairo ship with this repo. Bizmo — the brand display face used in
// the logo wordmark and headlines — is licensed, so its files are NOT included.
// Drop Bizmo-*.woff2 into public/fonts/ (see public/fonts/README.md) and the
// lockup becomes pixel-exact automatically. Until then those faces simply fail
// to load and the browser falls back to Outfit.
type Face = {family: string; weight: string; file: string; required: boolean; unicodeRange?: string};

// Cairo 800 ships as fontsource's Arabic + Latin subsets (OFL), split by unicode-range.
const CAIRO_ARABIC_RANGE =
  'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC';
const CAIRO_LATIN_RANGE =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

const FACES: Face[] = [
  ...['300', '400', '600', '700', '900'].map((w) => ({
    family: 'Outfit',
    weight: w,
    file: `fonts/Outfit-${w}.ttf`,
    required: true,
  })),
  // 800 = the guidelines' Section Title weight (§04)
  {family: 'Outfit', weight: '800', file: 'fonts/Outfit-800.woff2', required: true},
  ...['400', '700', '900'].map((w) => ({
    family: 'Cairo',
    weight: w,
    file: `fonts/Cairo-${w}.ttf`,
    required: true,
  })),
  {family: 'Cairo', weight: '800', file: 'fonts/Cairo-800-arabic.woff2', required: true, unicodeRange: CAIRO_ARABIC_RANGE},
  {family: 'Cairo', weight: '800', file: 'fonts/Cairo-800-latin.woff2', required: true, unicodeRange: CAIRO_LATIN_RANGE},
  ...[
    ['300', 'Light'],
    ['400', 'Regular'],
    ['500', 'Medium'],
    ['600', 'SemiBold'],
    ['700', 'Bold'],
    ['800', 'ExtraBold'],
    ['900', 'Black'],
  ].map(([w, name]) => ({
    family: 'Bizmo',
    weight: w,
    file: `fonts/Bizmo-${name}.woff2`,
    required: false,
  })),
  // Lama Sans is the brand Arabic face (guidelines §04) — licensed, so optional
  // like Bizmo. Without it Arabic falls back to the bundled Cairo.
  ...[
    ['400', 'Regular'],
    ['500', 'Medium'],
    ['700', 'Bold'],
    ['900', 'Black'],
  ].map(([w, name]) => ({
    family: 'Lama Sans',
    weight: w,
    file: `fonts/LamaSans-${name}.woff2`,
    required: false,
  })),
];

let loaded = false;

export const loadBrandFonts = () => {
  if (loaded) {
    return;
  }
  loaded = true;
  const handle = delayRender('Loading brand fonts');

  Promise.all(
    // Each face resolves independently so an absent optional font (Bizmo)
    // can never block or fail the render.
    FACES.map((f) => {
      const face = new FontFace(f.family, `url(${staticFile(f.file)})`, {
        weight: f.weight,
        ...(f.unicodeRange ? {unicodeRange: f.unicodeRange} : {}),
      });
      return face
        .load()
        .then((l) => {
          document.fonts.add(l);
        })
        .catch((err) => {
          if (f.required) {
            console.error(`Failed to load ${f.family} ${f.weight}`, err);
          }
        });
    }),
  ).then(() => continueRender(handle));
};
