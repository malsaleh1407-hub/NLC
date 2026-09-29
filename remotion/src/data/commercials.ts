import type {LinearCommercialProps} from '../compositions/LinearCommercial';

// Per-product commercial settings.
//
// `specs` must come from the product datasheet (datasheets/<key>.pdf) and
// nothing else. Leave it empty until the values are verified; the commercial
// then skips the spec chips instead of guessing.
//
// `photo` and `stills` are filled in automatically by
// scripts/render-commercial.mjs from public/products/<key>.png and
// public/commercials/<key>/ (the Gemini stills), so they stay empty here.

export const ALLIGATOR: LinearCommercialProps = {
  label: 'ALLIGATOR',
  catLabel: 'Linear Light',
  photo: null,
  stills: {},
  specs: [],
  hook: 'Every space has a line.',
  line2: 'Draw it in light.',
  productUrl: 'nlc.com.sa/product/alligator',
};
