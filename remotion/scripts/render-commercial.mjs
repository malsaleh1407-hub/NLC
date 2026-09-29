#!/usr/bin/env node
// Datasheet commercial factory: renders one product's 25-second commercial in
// three cuts — 16:9 (YouTube / LinkedIn / website), 9:16 (Reels / Stories /
// TikTok) and 9:16 Arabic.
//
//   node scripts/render-commercial.mjs delta
//   node scripts/render-commercial.mjs delta --site=/path/to/Website
//   node scripts/render-commercial.mjs delta --formats=16x9,ar
//   node scripts/render-commercial.mjs delta --dry-run     # show what it found, render nothing
//   node scripts/render-commercial.mjs delta --no-save     # don't write extracted specs back
//
// Output: out/commercials/<key>-16x9.mp4, <key>-9x16.mp4, <key>-9x16-ar.mp4
//
// The product's facts live in src/data/commercials/<key>.json. Before rendering,
// the script looks at the website (default: the repo root, one level up) for:
//
//   images/products/<key>.png, <key>-g2.png …   → copied into public/products/
//   product/<key>.html  (+ ar/product/<key>.html) → spec rows, when the JSON has none
//   fonts/Bizmo-*.woff2, fonts/LamaSans-*.woff2   → copied into public/fonts/ (licensed,
//                                                   git-ignored) for a pixel-exact logo
//
// Spec rows are only ever *read* from those sources — never guessed. Extracted
// rows are written back to the JSON (unless --no-save) so they can be reviewed
// in git and corrected by hand before publishing.

import {execFileSync} from 'node:child_process';
import {copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const has = (name) => args.includes(`--${name}`);
const key = args.find((a) => !a.startsWith('--'));

if (!key) {
  console.error('Usage: node scripts/render-commercial.mjs <product-key> [--site=<path>] [--formats=16x9,9x16,ar] [--dry-run] [--no-save]');
  process.exit(1);
}

const site = resolve(flag('site') ?? join(root, '..'));
const FORMATS = {
  '16x9': {composition: 'ProductCommercial', lang: 'en', out: `${key}-16x9.mp4`},
  '9x16': {composition: 'ProductCommercialVertical', lang: 'en', out: `${key}-9x16.mp4`},
  ar: {composition: 'ProductCommercialArabic', lang: 'ar', out: `${key}-9x16-ar.mp4`},
};
const formats = (flag('formats') ?? '16x9,9x16,ar').split(',').map((f) => f.trim());
for (const f of formats) {
  if (!FORMATS[f]) {
    console.error(`Unknown format "${f}". Use any of: ${Object.keys(FORMATS).join(', ')}`);
    process.exit(1);
  }
}

// ——— 1. Product data ———————————————————————————————————————————————
const dataPath = join(root, 'src/data/commercials', `${key}.json`);
let data;
const seeded = !existsSync(dataPath);
if (!seeded) {
  data = JSON.parse(readFileSync(dataPath, 'utf8'));
} else {
  // Seed from the catalogue-derived product list so any product can start here.
  const src = readFileSync(join(root, 'src/data/products.ts'), 'utf8');
  const m = src.match(new RegExp(`\\{key: "${key}", label: "(.*?)", cat: ".*?", catLabel: "(.*?)", profile: '(.*?)'`));
  if (!m) {
    console.error(`No src/data/commercials/${key}.json and "${key}" is not in src/data/products.ts.`);
    process.exit(1);
  }
  data = {key, name: m[1], category: m[2], categoryAr: m[2], photo: null, gallery: [], specs: [], profile: m[3]};
  console.warn(`! No ${key}.json yet — seeding it from the catalogue. Set "categoryAr"; it is the English label for now.`);
  console.warn(`! The default opening line is written for downlights; add "hook"/"hookAr" for other families.`);
}

// ——— 2. Photos ——————————————————————————————————————————————————————
const productsDir = join(site, 'images/products');
const publicProducts = join(root, 'public/products');
const dryRun = has('dry-run');
const copyIntoPublic = (file) => {
  if (!dryRun) {
    mkdirSync(publicProducts, {recursive: true});
    copyFileSync(join(productsDir, file), join(publicProducts, file));
  }
  return `products/${file}`;
};

let photo = data.photo && existsSync(join(root, 'public', data.photo)) ? data.photo : null;
if (data.photo && !photo) console.warn(`! photo "${data.photo}" is not in public/ — looking on the site instead.`);
if (!photo && existsSync(join(productsDir, `${key}.png`))) photo = copyIntoPublic(`${key}.png`);

let gallery = (data.gallery ?? []).filter((g) => existsSync(join(root, 'public', g)));
if (!gallery.length && existsSync(productsDir)) {
  gallery = readdirSync(productsDir)
    .filter((f) => new RegExp(`^${key}-g\\d+\\.png$`).test(f))
    .sort((a, b) => Number(a.match(/-g(\d+)/)[1]) - Number(b.match(/-g(\d+)/)[1]))
    .map(copyIntoPublic);
}

// ——— 3. Licensed fonts (never committed) ————————————————————————————
const siteFonts = join(site, 'fonts');
if (existsSync(siteFonts)) {
  const wanted = readdirSync(siteFonts).filter((f) => /^(Bizmo|LamaSans)-.*\.woff2$/.test(f));
  for (const f of wanted) {
    const dest = join(root, 'public/fonts', f);
    if (!existsSync(dest) && !dryRun) copyFileSync(join(siteFonts, f), dest);
  }
  if (wanted.length) console.log(`✓ Brand fonts: ${wanted.length} Bizmo/Lama Sans files available`);
}
const bizmo =
  existsSync(join(root, 'public/fonts/Bizmo-Black.woff2')) || (dryRun && existsSync(join(siteFonts, 'Bizmo-Black.woff2')));

// ——— 4. Specs from the product page ————————————————————————————————
const decode = (s) =>
  s
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&deg;/g, '°')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();

// Two-column rows from <table> or <dl> markup, whatever the page's classes are.
const extractRows = (html) => {
  const rows = [];
  for (const tr of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...tr[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => decode(c[1])).filter(Boolean);
    if (cells.length === 2) rows.push({label: cells[0], value: cells[1]});
  }
  if (!rows.length) {
    for (const dl of html.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)) {
      rows.push({label: decode(dl[1]), value: decode(dl[2])});
    }
  }
  // Drop header rows and prose that is not a spec value.
  return rows.filter((r) => r.value.length <= 48 && !/^(spec|specification|parameter|value|المواصفات|القيمة)/i.test(r.label));
};

// What a specifier looks for first (guidelines §01: wattage, lumens, CRI, IP…).
const PRIORITY = [
  /watt|power|القدرة|الطاقة/i,
  /lumen|flux|lm\b|التدفق/i,
  /efficacy|lm\/w|الكفاءة/i,
  /cct|colou?r temp|حرارة اللون/i,
  /cri|ra\b|تجسيد/i,
  /beam|زاوية/i,
  /\bip\b|ingress|الحماية/i,
  /\bik\b|impact/i,
  /cut.?out|فتحة/i,
  /dimension|size|الأبعاد/i,
];
const rank = (label) => {
  const i = PRIORITY.findIndex((re) => re.test(label));
  return i === -1 ? PRIORITY.length : i;
};

const AR_LABELS = [
  [/watt|power/i, 'القدرة'],
  [/lumen|flux/i, 'التدفق الضوئي'],
  [/efficacy/i, 'الكفاءة الضوئية'],
  [/cct|colou?r temp/i, 'درجة حرارة اللون'],
  [/cri/i, 'مؤشر تجسيد اللون'],
  [/beam/i, 'زاوية الشعاع'],
  [/\bip\b|ingress/i, 'درجة الحماية'],
  [/\bik\b|impact/i, 'مقاومة الصدمات'],
  [/cut.?out/i, 'فتحة التركيب'],
  [/dimension|size/i, 'الأبعاد'],
  [/voltage|input/i, 'جهد التشغيل'],
  [/driver/i, 'المُشغّل'],
  [/dimm/i, 'التعتيم'],
  [/life/i, 'العمر التشغيلي'],
  [/warranty/i, 'الضمان'],
  [/finish|colou?r\b/i, 'اللون'],
  [/material|body|housing/i, 'المادة'],
];

let specs = data.specs ?? [];
let dropped = [];
let specsSource = specs.length ? `src/data/commercials/${key}.json` : null;
if (!specs.length) {
  const enPage = join(site, 'product', `${key}.html`);
  const arPage = join(site, 'ar/product', `${key}.html`);
  if (existsSync(enPage)) {
    const en = extractRows(readFileSync(enPage, 'utf8'));
    const ar = existsSync(arPage) ? extractRows(readFileSync(arPage, 'utf8')) : [];
    const paired = ar.length === en.length;
    const all = en.map((r, i) => ({
      label: r.label,
      labelAr: paired ? ar[i].label : AR_LABELS.find(([re]) => re.test(r.label))?.[1],
      value: r.value,
    }));
    const ordered = all.map((r, i) => ({r, i})).sort((a, b) => rank(a.r.label) - rank(b.r.label) || a.i - b.i);
    specs = ordered.slice(0, 6).map(({r}) => r);
    dropped = ordered.slice(6).map(({r}) => r.label);
    specsSource = `product/${key}.html${paired ? ' + ar/product/' + key + '.html' : ''}`;
    if (!all.length) console.warn(`! product/${key}.html has no two-column spec rows the script recognises.`);
    if (!paired && all.length) console.warn(`! Arabic labels are a generic mapping — check them against the Arabic datasheet.`);
    if (specs.length && !has('no-save') && !dryRun) {
      writeFileSync(dataPath, JSON.stringify({...data, specs}, null, 2) + '\n');
      console.log(`✓ Wrote ${specs.length} spec rows to src/data/commercials/${key}.json — review before publishing`);
    }
  }
}
// A product seeded from the catalogue gets its JSON file even without specs.
if (seeded && !existsSync(dataPath) && !dryRun) {
  writeFileSync(dataPath, JSON.stringify({...data, specs}, null, 2) + '\n');
  console.log(`✓ Created src/data/commercials/${key}.json`);
}

// ——— 5. Report ————————————————————————————————————————————————————————
const line = (ok, text) => console.log(`${ok ? '✓' : '✗'} ${text}`);
console.log(`\n${data.name} — ${data.category} (${data.categoryAr})   site: ${site}`);
line(!!photo, photo ? `Photo: public/${photo}` : `Photo: none — images/products/${key}.png not found; the line-art icon stands in`);
line(true, `Gallery: ${gallery.length ? gallery.join(', ') : 'none'}`);
line(specs.length > 0, specs.length ? `Specs (${specsSource}):` : 'Specs: none — the datasheet scene shows a labelled typical distribution');
for (const s of specs) console.log(`    ${s.label.padEnd(24)} ${s.value.padEnd(20)} ${s.labelAr ?? '(no Arabic label)'}`);
if (dropped.length) console.log(`    (the video shows 6 rows; not shown: ${dropped.join(', ')})`);
line(bizmo, bizmo ? 'Bizmo: loaded (logo wordmark exact)' : 'Bizmo: missing — wordmark falls back to Outfit (see public/fonts/README.md)');

if (dryRun) {
  console.log('\n--dry-run: nothing copied, written or rendered.');
  process.exit(0);
}

// ——— 6. Render ——————————————————————————————————————————————————————————
const outDir = join(root, 'out/commercials');
mkdirSync(outDir, {recursive: true});
for (const f of formats) {
  const {composition, lang, out} = FORMATS[f];
  const props = {...data, photo, gallery, specs, lang};
  const propsFile = join(tmpdir(), `nlc-commercial-${key}-${lang}.json`);
  writeFileSync(propsFile, JSON.stringify(props));
  process.stdout.write(`\nRendering ${out} … `);
  execFileSync('npx', ['remotion', 'render', 'src/index.ts', composition, join('out/commercials', out), `--props=${propsFile}`, '--log=error'], {
    cwd: root,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  console.log('done');
}
console.log(`\n${formats.length} file(s) in out/commercials/`);
