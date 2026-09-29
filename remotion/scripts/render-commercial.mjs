#!/usr/bin/env node
// Renders the ALLIGATOR commercial in both formats.
//
//   node scripts/render-commercial.mjs            # 16:9 master + 9:16 reel
//
// Picks up, when present:
//   public/products/alligator.png              the catalogue photo (hero fallback)
//   public/commercials/alligator/<shot>-<ratio>.{png,jpg,webp}
//                                              Gemini stills from scripts/gemini_stills.py
//                                              (shots: hero, office, lobby, detail)
// Anything missing falls back to the procedural scene, never a made-up
// product. Spec chips come only from `specs` in src/data/commercials.ts.
//
// Output: out/commercials/alligator-16x9.mp4, out/commercials/alligator-9x16.mp4

import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(resolve(root, 'out/commercials'), {recursive: true});

const key = 'alligator';
const photo = `products/${key}.png`;
const hasPhoto = existsSync(resolve(root, 'public', photo));
console.log(hasPhoto ? `Photo: public/${photo}` : `Photo: none (no public/${photo})`);

const stillsDir = resolve(root, 'public/commercials', key);
const stillFiles = existsSync(stillsDir) ? readdirSync(stillsDir) : [];
const stillsFor = (ratio) => {
  const found = {};
  for (const shot of ['hero', 'office', 'lobby', 'detail']) {
    const file = stillFiles.find((f) => f.replace(/\.(png|jpe?g|webp)$/i, '') === `${shot}-${ratio}`);
    if (file) found[shot] = `commercials/${key}/${file}`;
  }
  return found;
};

for (const [id, suffix] of [
  ['AlligatorCommercial', '16x9'],
  ['AlligatorReel', '9x16'],
]) {
  const stills = stillsFor(suffix);
  const props = {...(hasPhoto ? {photo} : {}), stills};
  const out = `out/commercials/${key}-${suffix}.mp4`;
  console.log(`${suffix} stills: ${Object.keys(stills).join(', ') || 'none (procedural scenes)'}`);
  process.stdout.write(`${id.padEnd(22)} → ${out} … `);
  execFileSync(
    'npx',
    ['remotion', 'render', 'src/index.ts', id, out, `--props=${JSON.stringify(props)}`, '--log=error'],
    {cwd: root, stdio: ['ignore', 'ignore', 'inherit']},
  );
  console.log('done');
}
