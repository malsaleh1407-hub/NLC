import {continueRender, delayRender, staticFile} from 'remotion';

// Outfit + Cairo ship with this repo. Bizmo — the brand display face used in
// the logo wordmark and headlines — is licensed, so its files are NOT included.
// Drop Bizmo-*.woff2 into public/fonts/ (see public/fonts/README.md) and the
// lockup becomes pixel-exact automatically. Until then those faces simply fail
// to load and the browser falls back to Outfit.
const FACES: Array<{family: string; weight: string; file: string; required: boolean}> = [
  ...['300', '400', '600', '700', '900'].map((w) => ({
    family: 'Outfit',
    weight: w,
    file: `fonts/Outfit-${w}.ttf`,
    required: true,
  })),
  ...['400', '700', '900'].map((w) => ({
    family: 'Cairo',
    weight: w,
    file: `fonts/Cairo-${w}.ttf`,
    required: true,
  })),
  ...[
    ['300', 'Light'],
    ['400', 'Regular'],
    ['500', 'Medium'],
    ['600', 'SemiBold'],
    ['700', 'Bold'],
    ['900', 'Black'],
  ].map(([w, name]) => ({
    family: 'Bizmo',
    weight: w,
    file: `fonts/Bizmo-${name}.woff2`,
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
      const face = new FontFace(f.family, `url(${staticFile(f.file)})`, {weight: f.weight});
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
