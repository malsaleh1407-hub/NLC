import type {LinearCommercialProps} from '../compositions/LinearCommercial';

// Per-product commercial settings.
//
// `specs` must come from the product datasheet (datasheets/<key>.pdf) and
// nothing else. Leave it empty until the values are verified; the commercial
// then skips the spec chips instead of guessing.
//
// `photo` is filled in automatically by scripts/render-commercial.mjs when
// public/products/<key>.png exists, so it stays null here.

export const ALLIGATOR: LinearCommercialProps = {
  label: 'ALLIGATOR',
  catLabel: 'Linear Light',
  photo: null,
  specs: [],
  hook: 'Every space has a line.',
  line2: 'Draw it in light.',
  productUrl: 'nlc.com.sa/product/alligator',
};
