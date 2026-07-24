#!/usr/bin/env node
// The product-video factory: renders one 8-second spot per catalogue product.
//
//   node scripts/render-products.mjs                 # every product (156)
//   node scripts/render-products.mjs comet diamond   # only these keys
//   node scripts/render-products.mjs --cat=high-bay  # one category
//
// Output: out/products/<key>.mp4

import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'out/products');
mkdirSync(outDir, {recursive: true});

// Parse the generated data module without needing a TS toolchain.
const src = readFileSync(resolve(root, 'src/data/products.ts'), 'utf8');
const products = [...src.matchAll(/\{key: "(.*?)", label: "(.*?)", cat: "(.*?)", catLabel: "(.*?)", profile: '(.*?)', icon: '(.*?)'\}/g)].map(
  ([, key, label, cat, catLabel, profile, icon]) => ({key, label, cat, catLabel, profile, icon}),
);

const args = process.argv.slice(2);
const catArg = args.find((a) => a.startsWith('--cat='))?.split('=')[1];
const keys = args.filter((a) => !a.startsWith('--'));

let queue = products;
if (catArg) queue = queue.filter((p) => p.cat === catArg);
if (keys.length) queue = queue.filter((p) => keys.includes(p.key));

if (!queue.length) {
  console.error('No products matched. Available categories:', [...new Set(products.map((p) => p.cat))].join(', '));
  process.exit(1);
}

console.log(`Rendering ${queue.length} product spot(s) → out/products/`);

queue.forEach((p, i) => {
  // Real wattage/lumen figures belong in the datasheet, not this template.
  // Populate `specs` here only from verified datasheet values.
  const props = {
    label: p.label,
    catLabel: p.catLabel,
    profile: p.profile,
    icon: p.icon,
    specs: [],
  };
  process.stdout.write(`[${i + 1}/${queue.length}] ${p.label.padEnd(20)} `);
  execFileSync(
    'npx',
    [
      'remotion',
      'render',
      'src/index.ts',
      'ProductSpot',
      `out/products/${p.key}.mp4`,
      `--props=${JSON.stringify(props)}`,
      '--log=error',
    ],
    {cwd: root, stdio: ['ignore', 'ignore', 'inherit']},
  );
  console.log('done');
});

console.log(`\n${queue.length} spot(s) written to out/products/`);
