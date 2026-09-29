#!/usr/bin/env node
// Renders the ALLIGATOR commercial in both formats.
//
//   node scripts/render-commercial.mjs            # 16:9 master + 9:16 reel
//
// If public/products/alligator.png exists (the catalogue photo from
// images/products/alligator.png on the site), it becomes the hero shot.
// Without it the hero falls back to a line of light rather than a made-up
// product. Spec chips come only from `specs` in src/data/commercials.ts.
//
// Output: out/commercials/alligator-16x9.mp4, out/commercials/alligator-9x16.mp4

import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(resolve(root, 'out/commercials'), {recursive: true});

const key = 'alligator';
const photo = `products/${key}.png`;
const hasPhoto = existsSync(resolve(root, 'public', photo));
const props = hasPhoto ? {photo} : {};

console.log(hasPhoto ? `Hero: catalogue photo public/${photo}` : `Hero: light-only (no public/${photo})`);

for (const [id, suffix] of [
  ['AlligatorCommercial', '16x9'],
  ['AlligatorReel', '9x16'],
]) {
  const out = `out/commercials/${key}-${suffix}.mp4`;
  process.stdout.write(`${id.padEnd(22)} → ${out} … `);
  execFileSync(
    'npx',
    ['remotion', 'render', 'src/index.ts', id, out, `--props=${JSON.stringify(props)}`, '--log=error'],
    {cwd: root, stdio: ['ignore', 'ignore', 'inherit']},
  );
  console.log('done');
}
