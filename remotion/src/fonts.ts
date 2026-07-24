import {continueRender, delayRender, staticFile} from 'remotion';

const OUTFIT = ['300', '400', '600', '700', '900'] as const;
const CAIRO = ['400', '700', '900'] as const;
let loaded = false;

export const loadBrandFonts = () => {
  if (loaded) {
    return;
  }
  loaded = true;
  const handle = delayRender('Loading brand fonts');

  const faces = [
    ...OUTFIT.map((w) => ({family: 'Outfit', weight: w, file: `fonts/Outfit-${w}.ttf`})),
    ...CAIRO.map((w) => ({family: 'Cairo', weight: w, file: `fonts/Cairo-${w}.ttf`})),
  ];

  Promise.all(
    faces.map((f) => {
      const font = new FontFace(f.family, `url(${staticFile(f.file)}) format('truetype')`, {
        weight: f.weight,
      });
      return font.load().then((loadedFace) => document.fonts.add(loadedFace));
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      // Fall back to system fonts rather than blocking the render
      console.error('Font loading failed', err);
      continueRender(handle);
    });
};
