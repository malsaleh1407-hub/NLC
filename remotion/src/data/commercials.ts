import type {Profile} from '../components/Photometric';
import type {Line} from './commercialCopy';
import delta from './commercials/delta.json';

// Datasheet-driven product commercials.
//
// Each product is one JSON file in ./commercials/. Everything the video states
// about the product comes from that file, and the file is filled from the
// product's own sources — images/products/{key}.png and the spec table on
// product/{key}.html (which mirrors datasheets/{key}.pdf). The template never
// invents a figure: with `specs` empty, the datasheet scene shows a clearly
// labelled *typical* distribution instead of numbers.
//
// scripts/render-commercial.mjs fills `photo`, `gallery` and `specs`
// automatically when it can see the website files; see the README.

export type Spec = {
  label: string;
  /** Arabic label; the English label is used when missing. */
  labelAr?: string;
  /** Values stay in Latin script in both languages (brand guidelines, RTL & bilingual). */
  value: string;
};

export type Lang = 'en' | 'ar';

export type CommercialProduct = {
  key: string;
  /** Display name exactly as on the website catalog card. */
  name: string;
  /** Catalog category label (products.html `prod-cat-tag`). */
  category: string;
  categoryAr: string;
  /** Transparent product PNG, path relative to public/ — null until supplied. */
  photo: string | null;
  /** Extra angles (the site's `-g2`, `-g3` gallery images), relative to public/. */
  gallery: string[];
  /** Rows from the datasheet only. Empty means "not supplied yet". */
  specs: Spec[];
  /** Category-typical light distribution, used only when `specs` is empty. */
  profile: Profile;
  /** Optional per-product opening line; the default hook is written for downlights. */
  hook?: Line;
  hookAr?: Line;
};

export type CommercialProps = CommercialProduct & {lang: Lang};

export const DELTA: CommercialProduct = delta as CommercialProduct;

export const commercialDefaults: CommercialProps = {...DELTA, lang: 'en'};
export const commercialDefaultsAr: CommercialProps = {...DELTA, lang: 'ar'};
