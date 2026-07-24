import {continueRender, delayRender, staticFile} from 'remotion';

const weights = ['300', '400', '600', '700', '900'] as const;
let loaded = false;

export const loadBrandFonts = () => {
  if (loaded) {
    return;
  }
  loaded = true;
  const handle = delayRender('Loading Outfit fonts');
  Promise.all(
    weights.map((w) => {
      const font = new FontFace(
        'Outfit',
        `url(${staticFile(`fonts/Outfit-${w}.ttf`)}) format('truetype')`,
        {weight: w},
      );
      return font.load().then((f) => document.fonts.add(f));
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      // Fall back to system fonts rather than blocking the render
      console.error('Font loading failed', err);
      continueRender(handle);
    });
};
