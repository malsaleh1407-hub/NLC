#!/usr/bin/env node
// Datasheet commercial factory: renders one product's 25-second commercial in
// three cuts — 16:9 (YouTube / LinkedIn / website), 9:16 (Reels / Stories /
// TikTok) and 9:16 Arabic.
//
//   node scripts/render-commercial.mjs delta
//   node scripts/render-commercial.mjs delta --site=/path/to/Website
//   node scripts/render-commercial.mjs delta --formats=16x9,ar
//   node scripts/render-commercial.mjs delta --dry-run        # show what it found, touch nothing
//   node scripts/render-commercial.mjs delta --no-save        # don't write extracted specs back
//   node scripts/render-commercial.mjs delta --datasheet=yes  # override datasheet detection
//
// Output: out/commercials/<key>-16x9.mp4, <key>-9x16.mp4, <key>-9x16-ar.mp4
//
// The product's facts live in src/data/commercials/<key>.json. Before rendering,
// the script looks at the website (default: the repo root, one level up) for:
//
//   products.html card image (+ gallery siblings)  → copied into public/products/
//   product/<key>.html  (+ ar/product/<key>.html)   → spec rows, when the JSON has none
//   datasheets/<key>.pdf, the page's PDF link, or
//   base44-documents-import.csv                     → whether a datasheet exists
//   fonts/Bizmo-*.woff2, fonts/LamaSans-*.woff2     → copied into public/fonts/
//                                                     (licensed, git-ignored)
//
// Spec rows are only ever *read* from those sources — never guessed. Extracted
// rows are written back to the JSON (unless --no-save) so they can be reviewed
// in git and corrected by hand before publishing. The CTA only promises a
// datasheet when one is confirmed.

import {execFileSync} from 'node:child_process';
import {copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const has = (name) => args.includes(`--${name}`);
const key = args.find((a) => !a.startsWith('--'));
const dryRun = has('dry-run');
const force = has('force');

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

if (!key) {
  fail(
    'Usage: node scripts/render-commercial.mjs <product-key> [--site=<path>] [--formats=16x9,9x16,ar] ' +
      '[--datasheet=yes|no] [--dry-run] [--no-save] [--force]',
  );
}
if (!/^[a-z0-9-]+$/.test(key)) fail(`"${key}" is not a catalogue key (lowercase letters, digits and hyphens).`);

const site = resolve(flag('site') ?? join(root, '..'));
const FORMATS = {
  '16x9': {composition: 'ProductCommercial', lang: 'en', out: `${key}-16x9.mp4`},
  '9x16': {composition: 'ProductCommercialVertical', lang: 'en', out: `${key}-9x16.mp4`},
  ar: {composition: 'ProductCommercialArabic', lang: 'ar', out: `${key}-9x16-ar.mp4`},
};
const formats = (flag('formats') ?? '16x9,9x16,ar').split(',').map((f) => f.trim());
for (const f of formats) {
  if (!FORMATS[f]) fail(`Unknown format "${f}". Use any of: ${Object.keys(FORMATS).join(', ')}`);
}
const ARABIC = /[؀-ۿ]/;

// ——— 1. Product data ———————————————————————————————————————————————
const catalogue = readFileSync(join(root, 'src/data/products.ts'), 'utf8');
const entry = catalogue.match(new RegExp(`\\{key: "${key}", label: "(.*?)", cat: "(.*?)", catLabel: "(.*?)", profile: '(.*?)'`));

const dataPath = join(root, 'src/data/commercials', `${key}.json`);
const seeded = !existsSync(dataPath);
let data;
if (!seeded) {
  data = JSON.parse(readFileSync(dataPath, 'utf8'));
} else {
  if (!entry) fail(`No src/data/commercials/${key}.json and "${key}" is not in src/data/products.ts.`);
  // categoryAr is left empty on purpose: the Arabic cut refuses to render until it is set.
  data = {key, name: entry[1], category: entry[3], categoryAr: '', photo: null, gallery: [], specs: [], profile: entry[4], hasDatasheet: false};
  console.warn(`! No ${key}.json yet — seeding it from the catalogue.`);
}

// The template's hook line, line-art icon, "typical" wording and wall-wash
// application scene all depict downlights. Other families need their own
// hook / revealSub (JSON) and visuals before this can be honest.
const family = entry?.[3] ?? data.category;
if (family !== 'Downlight') {
  const msg =
    `${data.name} is a "${family}", but this commercial is written for downlights: the opening line, the ` +
    `line-art stand-in, the application scene (downlights on a wall) and the typical-distribution wording ` +
    `all show downlights. Add "hook"/"hookAr" and "revealSub"/"revealSubAr" to ${key}.json and adapt the ` +
    `visuals, then re-run with --force.`;
  if (!force) fail(msg);
  console.warn(`! --force: ${msg}`);
}

// ——— 2. Photos ——————————————————————————————————————————————————————
const publicProducts = join(root, 'public/products');
const copyIntoPublic = (abs) => {
  const name = basename(abs);
  if (!dryRun) {
    mkdirSync(publicProducts, {recursive: true});
    copyFileSync(abs, join(publicProducts, name));
  }
  return `products/${name}`;
};

// The catalogue card is the source of truth for the photo path (some families
// live in sub-folders with other names, e.g. images/products/chess/…).
const cardImage = (() => {
  const catalogueHtml = join(site, 'products.html');
  if (!existsSync(catalogueHtml)) return null;
  const m = readFileSync(catalogueHtml, 'utf8').match(
    new RegExp(`data-name="${key}"[^>]*>\\s*<div class="prod-img-wrap"><img src="([^"]+)"`),
  );
  return m && existsSync(join(site, m[1])) ? join(site, m[1]) : null;
})();
const mainPhoto = cardImage ?? (existsSync(join(site, 'images/products', `${key}.png`)) ? join(site, 'images/products', `${key}.png`) : null);

let photo = data.photo && existsSync(join(root, 'public', data.photo)) ? data.photo : null;
if (data.photo && !photo) console.warn(`! photo "${data.photo}" is not in public/ — looking on the site instead.`);
if (!photo && mainPhoto) photo = copyIntoPublic(mainPhoto);

let gallery = (data.gallery ?? []).filter((g) => existsSync(join(root, 'public', g)));
if (!gallery.length && mainPhoto) {
  const dir = dirname(mainPhoto);
  const stem = basename(mainPhoto, '.png');
  const re = new RegExp(`^(?:${key}-g(\\d+)|${key}-(\\d+))\\.png$`);
  gallery = readdirSync(dir)
    .filter((f) => re.test(f) && f !== basename(mainPhoto) && f !== `${stem}.png`)
    .sort((a, b) => {
      const n = (f) => Number(f.match(re).slice(1).find(Boolean));
      return n(a) - n(b);
    })
    .map((f) => copyIntoPublic(join(dir, f)));
}

// ——— 3. Licensed fonts (never committed) ————————————————————————————
const siteFonts = join(site, 'fonts');
if (existsSync(siteFonts)) {
  const wanted = readdirSync(siteFonts).filter((f) => /^(Bizmo|LamaSans)-.*\.woff2$/.test(f));
  for (const f of wanted) {
    const dest = join(root, 'public/fonts', f);
    if (!existsSync(dest) && !dryRun) copyFileSync(join(siteFonts, f), dest);
  }
}
const fontReady = (file) => existsSync(join(root, 'public/fonts', file)) || (dryRun && existsSync(join(siteFonts, file)));
const bizmo = fontReady('Bizmo-Black.woff2');
const lamaSans = fontReady('LamaSans-Regular.woff2');

// ——— 4. Datasheet ————————————————————————————————————————————————————
const enPage = join(site, 'product', `${key}.html`);
const datasheet = (() => {
  const override = flag('datasheet');
  if (override) {
    if (!/^(yes|no)$/.test(override)) fail('--datasheet must be yes or no.');
    return {state: override, source: '--datasheet'};
  }
  if (existsSync(join(site, 'datasheets', `${key}.pdf`))) return {state: 'yes', source: `datasheets/${key}.pdf`};
  if (existsSync(enPage) && new RegExp(`href="[^"]*datasheets/${key}\\.pdf"`).test(readFileSync(enPage, 'utf8'))) {
    return {state: 'yes', source: `link on product/${key}.html`};
  }
  const csv = join(site, 'base44-documents-import.csv');
  if (existsSync(csv) && new RegExp(`,${key}\\.pdf,`).test(readFileSync(csv, 'utf8'))) {
    return {state: 'yes', source: 'base44-documents-import.csv'};
  }
  if (existsSync(join(site, 'datasheets'))) return {state: 'no', source: `no datasheets/${key}.pdf`};
  if (existsSync(csv)) return {state: 'no', source: 'not in base44-documents-import.csv'};
  return {state: 'unknown', source: 'no datasheets/ folder or document index to check'};
})();
const hasDatasheet = datasheet.state === 'yes' ? true : datasheet.state === 'no' ? false : !!data.hasDatasheet;

// Gemini photo plates (scripts/generate-stills.mjs) — keep only files that exist.
const stills = {};
for (const [scene, byAspect] of Object.entries(data.stills ?? {})) {
  for (const [aspect, file] of Object.entries(byAspect ?? {})) {
    if (existsSync(join(root, 'public', file))) (stills[scene] ??= {})[aspect] = file;
    else console.warn(`! still ${file} is missing from public/ — that scene uses the drawn visual.`);
  }
}

// ——— 5. Specs from the product page ————————————————————————————————
const ENTITIES = {
  nbsp: ' ', times: '×', Oslash: 'Ø', oslash: 'ø', plusmn: '±', ndash: '–', mdash: '—', ge: '≥', le: '≤',
  deg: '°', micro: 'µ', sup2: '²', sup3: '³', middot: '·', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  lt: '<', gt: '>', quot: '"', apos: "'",
};
const decode = (s) => {
  const out = s
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(sup|sub|small|span|b|strong|i|em)\b[^>]*>/gi, '') // inline tags: keep "30<small>W</small>" as "30W"
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-z]+\d?);/gi, (m, name) => ENTITIES[name] ?? m)
    .replace(/&amp;/g, '&') // last, so "&amp;lt;" stays "&lt;"
    .replace(/\s+/g, ' ')
    .trim();
  if (/&[a-z]+;/i.test(out)) console.warn(`! Undecoded entity in "${out}" — fix it in the JSON.`);
  return out;
};

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
  return rows.filter((r) => r.value.length <= 60 && !/^(spec|specification|parameter|value|المواصفات|القيمة)/i.test(r.label));
};

// What a specifier looks for first (guidelines §01: wattage, lumens, CRI, IP…).
// Specific patterns sit before broad ones; power factor / supply and lumen
// maintenance are deliberately not ranked as wattage or flux.
const NOT_HEADLINE = /power\s*(factor|supply)|\bp\.?f\b|maintenance|\bL\d{2}\b/i;
const PRIORITY = [
  /\bwatt(age)?\b|rated\s*power|power\s*consumption|^power$/i,
  /luminous\s*flux|^lumens?$|lumen\s*output|^flux$/i,
  /efficacy|lm\s*\/\s*w/i,
  /\bcct\b|colou?r\s*temp/i,
  /colou?r\s*render|\bcri\b|^ra$/i,
  /\bbeam\b/i,
  /\bip\b|ingress/i,
  /\bik\b|impact/i,
  /cut.?out/i,
  /dimension|^size$/i,
];
const rank = (label) => {
  if (NOT_HEADLINE.test(label)) return PRIORITY.length;
  const i = PRIORITY.findIndex((re) => re.test(label));
  return i === -1 ? PRIORITY.length : i;
};

const AR_LABELS = [
  [/power\s*factor|\bp\.?f\b/i, 'معامل القدرة'],
  [/power\s*supply|\bpsu\b/i, 'مزود الطاقة'],
  [/lumen\s*maint|\bL\d{2}\b/i, 'ثبات التدفق الضوئي'],
  [/efficacy|lm\s*\/\s*w/i, 'الكفاءة الضوئية'],
  [/colou?r\s*render|\bcri\b|^ra$/i, 'مؤشر تجسيد اللون'],
  [/\bcct\b|colou?r\s*temp/i, 'درجة حرارة اللون'],
  [/\bwatt(age)?\b|rated\s*power|power\s*consumption|^power$/i, 'القدرة'],
  [/luminous\s*flux|^lumens?$|lumen\s*output|^flux$/i, 'التدفق الضوئي'],
  [/\bbeam\b/i, 'زاوية الشعاع'],
  [/\bip\b|ingress/i, 'درجة الحماية'],
  [/\bik\b|impact/i, 'مقاومة الصدمات'],
  [/cut.?out/i, 'فتحة التركيب'],
  [/dimension|^size$/i, 'الأبعاد'],
  [/voltage|^input$/i, 'جهد التشغيل'],
  [/driver/i, 'المُشغّل'],
  [/dimm/i, 'التعتيم'],
  [/lifetime|life\s*span|^life$/i, 'العمر التشغيلي'],
  [/warranty/i, 'الضمان'],
  [/finish|^colou?r$/i, 'اللون'],
  [/material|^body$|housing/i, 'المادة'],
];
const arLabelFor = (label) => AR_LABELS.find(([re]) => re.test(label))?.[1];
const norm = (s) => s.replace(/\s+/g, '').toLowerCase();

const MAX_VALUE = 30; // wider than this does not fit a SpecSheet row on 9:16
let specs = data.specs ?? [];
let specsSource = specs.length ? `src/data/commercials/${key}.json` : null;
const dropped = [];
if (!specs.length && existsSync(enPage)) {
  const arPage = join(site, 'ar/product', `${key}.html`);
  const en = extractRows(readFileSync(enPage, 'utf8'));
  const ar = existsSync(arPage) ? extractRows(readFileSync(arPage, 'utf8')) : [];
  const sameCount = ar.length === en.length;
  const unpaired = [];
  const all = en.map((r, i) => {
    // Pair row by row only when the rows demonstrably line up.
    const a = sameCount ? ar[i] : null;
    const lineUp = a && (norm(a.value) === norm(r.value) || (ARABIC.test(a.value) && !ARABIC.test(r.value)));
    if (!lineUp) unpaired.push(r.label);
    const isWord = !/\d/.test(r.value);
    return {
      label: r.label,
      labelAr: lineUp ? a.label : arLabelFor(r.label),
      value: r.value,
      ...(lineUp && isWord && ARABIC.test(a.value) ? {valueAr: a.value} : {}),
    };
  });
  const tooLong = all.filter((r) => r.value.length > MAX_VALUE);
  for (const r of tooLong) dropped.push(`${r.label} (value too long for the table)`);
  const ordered = all
    .filter((r) => r.value.length <= MAX_VALUE)
    .map((r, i) => ({r, i}))
    .sort((a, b) => rank(a.r.label) - rank(b.r.label) || a.i - b.i);
  specs = ordered.slice(0, 6).map(({r}) => r);
  dropped.push(...ordered.slice(6).map(({r}) => r.label));
  specsSource = `product/${key}.html${ar.length ? ' + ar/product/' + key + '.html' : ''}`;
  if (!all.length) console.warn(`! product/${key}.html has no two-column spec rows the script recognises.`);
  if (ar.length && unpaired.length) console.warn(`! Arabic rows did not line up for: ${unpaired.join(', ')} — generic Arabic labels used, check them.`);
  if (specs.length && !has('no-save') && !dryRun) {
    writeFileSync(dataPath, JSON.stringify({...data, specs}, null, 2) + '\n');
    console.log(`✓ Wrote ${specs.length} spec rows to src/data/commercials/${key}.json — review before publishing`);
  }
}
// A product seeded from the catalogue gets its JSON file even without specs.
if (seeded && !existsSync(dataPath) && !dryRun) {
  writeFileSync(dataPath, JSON.stringify({...data, specs}, null, 2) + '\n');
  console.log(`✓ Created src/data/commercials/${key}.json`);
}

// ——— 6. Report ————————————————————————————————————————————————————————
const line = (ok, text) => console.log(`${ok ? '✓' : '✗'} ${text}`);
console.log(`\n${data.name} — ${data.category} (${data.categoryAr || 'no Arabic category yet'})   site: ${site}`);
line(!!photo, photo ? `Photo: public/${photo}` : `Photo: none on the site — the line-art icon stands in`);
line(true, `Gallery: ${gallery.length ? gallery.join(', ') : 'none'}`);
line(specs.length > 0, specs.length ? `Specs (${specsSource}):` : 'Specs: none — the datasheet scene shows a distribution labelled as typical');
for (const s of specs) console.log(`    ${s.label.padEnd(24)} ${s.value.padEnd(20)} ${s.labelAr ?? '(no Arabic label)'}${s.valueAr ? ' · ' + s.valueAr : ''}`);
if (dropped.length) console.log(`    (the video shows up to 6 rows; not shown: ${dropped.join(', ')})`);
line(
  datasheet.state !== 'unknown',
  `Datasheet: ${datasheet.state} (${datasheet.source}) → CTA "${hasDatasheet ? 'Download the datasheet' : 'See it in the catalogue'}"` +
    (datasheet.state === 'unknown' ? ` — using ${key}.json; pass --datasheet=yes|no to decide` : ''),
);
line(bizmo, bizmo ? 'Bizmo: loaded (English type and logo wordmark exact)' : 'Bizmo: missing — English falls back to Outfit (see public/fonts/README.md)');
line(lamaSans, lamaSans ? 'Lama Sans: loaded' : 'Lama Sans: missing — Arabic falls back to Cairo');
line(
  Object.keys(stills).length > 0,
  Object.keys(stills).length
    ? `Gemini stills: ${Object.entries(stills).map(([s, a]) => `${s} (${Object.keys(a).join(', ')})`).join(', ')}`
    : `Gemini stills: none — drawn visuals (generate with: node scripts/generate-stills.mjs ${key})`,
);

// ——— 7. Pre-flight for the Arabic cut ——————————————————————————————————
const problems = [];
if (formats.includes('ar')) {
  if (!ARABIC.test(data.categoryAr ?? '')) problems.push(`set "categoryAr" in ${key}.json (the Arabic category label)`);
  const noLabel = specs.filter((s) => !s.labelAr).map((s) => s.label);
  if (noLabel.length) problems.push(`add "labelAr" for: ${noLabel.join(', ')}`);
  const wordValues = specs.filter((s) => !/\d/.test(s.value) && !s.valueAr).map((s) => s.label);
  if (wordValues.length) console.warn(`! Arabic cut will show English word values for: ${wordValues.join(', ')} — add "valueAr" to translate them.`);
}

if (dryRun) {
  if (problems.length) console.warn(`! The Arabic cut would not render yet: ${problems.join('; ')}.`);
  console.log('\n--dry-run: nothing copied, written or rendered.');
  process.exit(0);
}
if (problems.length && !force) fail(`The Arabic cut is not ready: ${problems.join('; ')}. (Or drop it with --formats=16x9,9x16.)`);

// ——— 8. Render ——————————————————————————————————————————————————————————
const outDir = join(root, 'out/commercials');
mkdirSync(outDir, {recursive: true});
for (const f of formats) {
  const {composition, lang, out} = FORMATS[f];
  // Every optional field is sent explicitly: Remotion merges these props over
  // the composition's defaultProps (DELTA), so an omitted key would inherit DELTA's.
  const props = {
    ...data,
    hook: data.hook ?? null,
    hookAr: data.hookAr ?? null,
    revealSub: data.revealSub ?? null,
    revealSubAr: data.revealSubAr ?? null,
    stills: Object.keys(stills).length ? stills : null,
    photo,
    gallery,
    specs,
    hasDatasheet,
    lang,
  };
  const propsFile = join(tmpdir(), `nlc-commercial-${key}-${lang}.json`);
  writeFileSync(propsFile, JSON.stringify(props));
  process.stdout.write(`\nRendering ${out} … `);
  execFileSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['remotion', 'render', 'src/index.ts', composition, join('out/commercials', out), `--props=${propsFile}`, '--log=error'],
    {cwd: root, stdio: ['ignore', 'ignore', 'inherit'], shell: process.platform === 'win32'},
  );
  console.log('done');
}
console.log(`\n${formats.length} file(s) in out/commercials/`);
