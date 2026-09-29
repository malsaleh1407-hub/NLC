import {continueRender, delayRender, staticFile} from 'remotion';

// Outfit ships with this project. Bizmo is licensed, so it is not committed:
// the render script copies it from nlc.com.sa/fonts/ into public/fonts/ first.
// Every face loads independently, so a missing Bizmo only falls back to Outfit.
const FACES: Array<{family: string; weight: string; file: string; required: boolean}> = [
  ...['300', '400', '600', '700', '900'].map((w) => ({
    family: 'Outfit',
    weight: w,
    file: `fonts/Outfit-${w}.ttf`,
    required: true,
  })),
  ...[
    ['400', 'Regular'],
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
    FACES.map((f) =>
      new FontFace(f.family, `url(${staticFile(f.file)})`, {weight: f.weight})
        .load()
        .then((face) => {
          document.fonts.add(face);
        })
        .catch((err) => {
          if (f.required) {
            console.error(`Failed to load ${f.family} ${f.weight}`, err);
          }
        }),
    ),
  ).then(() => continueRender(handle));
};
