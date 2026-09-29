#!/usr/bin/env node
// Photo plates for a product commercial, generated with Google Gemini
// ("Nano Banana 2", gemini-3.1-flash-image-preview — the same model and master
// brand prefix as PROMPTS-ALL.md). Stills only: Remotion supplies all motion.
//
//   GOOGLE_AI_API_KEY=… node scripts/generate-stills.mjs delta
//   node scripts/generate-stills.mjs delta --ref=/path/to/delta.png
//   node scripts/generate-stills.mjs delta --shots=hook --dry-run
//
// The product's real photo is sent with every prompt as the reference, so the
// fixture in the scene is the product itself and not one Gemini invents. There
// is no fallback without it: the script stops rather than put an imaginary
// fixture in a product film.
//
// Output: public/stills/<key>/<shot>-<16x9|9x16>.png (+ prompts.json), and the
// paths are written to src/data/commercials/<key>.json under "stills", which
// render-commercial.mjs passes to the video.

import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname, extname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const has = (name) => args.includes(`--${name}`);
const key = args.find((a) => !a.startsWith('--'));
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

if (!key || !/^[a-z0-9-]+$/.test(key)) {
  fail('Usage: node scripts/generate-stills.mjs <product-key> [--ref=<photo>] [--site=<path>] [--shots=hook,application] [--model=<id>] [--dry-run]');
}

// Node's built-in fetch ignores HTTPS_PROXY unless this is set (Node ≥ 22.21).
// Re-exec once with it so the script also works behind a proxy.
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const r = spawnSync(process.execPath, ['--disable-warning=UNDICI-EHPA', ...process.argv.slice(1)], {
    stdio: 'inherit',
    env: {...process.env, NODE_USE_ENV_PROXY: '1'},
  });
  process.exit(r.status ?? 1);
}

const MODEL = flag('model') ?? 'gemini-3.1-flash-image-preview';
const API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
const dryRun = has('dry-run');
const site = resolve(flag('site') ?? join(root, '..'));

// ——— Product data + reference photo ————————————————————————————————
const dataPath = join(root, 'src/data/commercials', `${key}.json`);
if (!existsSync(dataPath)) fail(`No src/data/commercials/${key}.json — run render-commercial.mjs ${key} --dry-run first.`);
const data = JSON.parse(readFileSync(dataPath, 'utf8'));

const refCandidates = [
  flag('ref'),
  data.photo && join(root, 'public', data.photo),
  join(root, 'public/products', `${key}.png`),
  join(site, 'images/products', `${key}.png`),
].filter(Boolean);
const ref = refCandidates.find((p) => existsSync(p));
if (!ref) {
  fail(
    `No photo of ${data.name} to use as the reference (looked for: ${refCandidates.join(', ')}). ` +
      `Gemini would have to invent the fixture. Pass --ref=<photo> or run from the website folder.`,
  );
}

// ——— Prompts —————————————————————————————————————————————————————————
// Master brand prefix, verbatim from PROMPTS-ALL.md, minus its fixed "16:9 aspect
// ratio." (the aspect is set per request instead).
const BRAND_PREFIX =
  'Cinematic photographic, shot on Sony A7R IV with 24mm prime at f/5.6, dramatic teal-and-orange color grade — ' +
  'cool navy shadows (#24285e) and warm orange highlights (#F6851F), National Geographic industrial-tech editorial ' +
  'aesthetic. Saudi commercial/industrial setting — polished concrete or epoxy floors, deep navy painted walls, ' +
  'premium finishes (NEOM-style architecture). No readable text on any surface, no logos, no signage anywhere. ' +
  'Saturated navy and orange ONLY — desaturate any green or red.';

const FIXTURE =
  'The light fitting in this scene is EXACTLY the product in the attached reference photo — same shape, trim, ' +
  'proportions, colour and finish. Do not redesign it, add parts, or substitute another fixture.';

const SPACE = {
  '16x9': 'Keep the left 40% of the frame calm, dark and uncluttered — a headline will be set there.',
  '9x16': 'Vertical frame. Keep the lower 40% of the frame calm, dark and uncluttered — a headline will be set there.',
};

const SHOTS = {
  hook: (aspect) =>
    `${BRAND_PREFIX} ${FIXTURE} Low-angle view up at the dark plaster ceiling of a premium modern Saudi interior at night. ` +
    `A single one of these fixtures, recessed in the ceiling in the ${aspect === '16x9' ? 'right third' : 'upper centre'} of the frame, ` +
    `has just switched on and throws a crisp, warm 3000K cone of light through faint haze onto a polished concrete floor, ` +
    `where it lands as one clean pool. Everything outside the beam falls away into deep navy shadow. No people. ${SPACE[aspect]}`,
  application: (aspect) =>
    `${BRAND_PREFIX} ${FIXTURE} Wide editorial interior of a premium Saudi corporate lobby at dusk, as installed: a straight row of ` +
    `these fixtures recessed in a smooth plaster ceiling, evenly spaced, each washing a warm 3000K scallop down a pale travertine ` +
    `wall and pooling light on the polished floor. Calm, uniform, precise — a real finished project, not a render. No people. ${SPACE[aspect]}`,
};

const shots = (flag('shots') ?? 'hook,application').split(',').map((s) => s.trim());
for (const s of shots) if (!SHOTS[s]) fail(`Unknown shot "${s}". Use any of: ${Object.keys(SHOTS).join(', ')}`);
const ASPECTS = {'16x9': '16:9', '9x16': '9:16'};

// ——— Generate ————————————————————————————————————————————————————————
const refB64 = readFileSync(ref).toString('base64');
const refMime = extname(ref).toLowerCase() === '.jpg' || extname(ref).toLowerCase() === '.jpeg' ? 'image/jpeg' : 'image/png';

const generate = async (prompt, aspectRatio, withSize = true) => {
  const body = {
    contents: [{parts: [{text: prompt}, {inline_data: {mime_type: refMime, data: refB64}}]}],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: withSize ? {aspectRatio, imageSize: '2K'} : {aspectRatio},
    },
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: {'content-type': 'application/json', 'x-goog-api-key': API_KEY},
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Some image models do not take imageSize; retry once without it.
    if (withSize && res.status === 400 && /imageSize|image_size/i.test(JSON.stringify(json))) return generate(prompt, aspectRatio, false);
    throw new Error(`${res.status} ${json.error?.status ?? ''} ${json.error?.message ?? JSON.stringify(json).slice(0, 300)}`);
  }
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
  const img = part?.inlineData ?? part?.inline_data;
  if (!img) throw new Error(`No image in the response (finishReason: ${json.candidates?.[0]?.finishReason ?? 'unknown'})`);
  return {mime: img.mimeType ?? img.mime_type, bytes: Buffer.from(img.data, 'base64')};
};

console.log(`${data.name}: ${shots.length} shot(s) × 2 aspects with ${MODEL}\nreference: ${ref}`);
if (dryRun) {
  for (const s of shots) for (const a of Object.keys(ASPECTS)) console.log(`\n[${s} ${a}]\n${SHOTS[s](a)}`);
  console.log(`\n--dry-run: nothing sent. Key ${API_KEY ? 'found' : 'MISSING (set GOOGLE_AI_API_KEY)'}.`);
  process.exit(0);
}
if (!API_KEY) fail('Set GOOGLE_AI_API_KEY (or GEMINI_API_KEY) — a Gemini API key from aistudio.google.com/apikey.');

const outDir = join(root, 'public/stills', key);
mkdirSync(outDir, {recursive: true});
const promptsPath = join(outDir, 'prompts.json');
const log = existsSync(promptsPath) ? JSON.parse(readFileSync(promptsPath, 'utf8')) : {};
const stills = {...(data.stills ?? {})};

for (const s of shots) {
  for (const [a, ratio] of Object.entries(ASPECTS)) {
    const prompt = SHOTS[s](a);
    process.stdout.write(`${s} ${a} … `);
    try {
      const {mime, bytes} = await generate(prompt, ratio);
      const file = `${s}-${a}.${mime === 'image/jpeg' ? 'jpg' : 'png'}`;
      writeFileSync(join(outDir, file), bytes);
      stills[s] = {...(stills[s] ?? {}), [a]: `stills/${key}/${file}`};
      log[`${s}-${a}`] = {model: MODEL, prompt, reference: ref.replace(site + '/', '')};
      console.log(`✓ public/stills/${key}/${file}`);
    } catch (e) {
      console.log(`✗ ${e.message}`);
    }
  }
}

writeFileSync(promptsPath, JSON.stringify(log, null, 2) + '\n');
writeFileSync(dataPath, JSON.stringify({...data, stills}, null, 2) + '\n');
console.log(`\nLook at every plate before rendering: the fixture must match the reference photo.`);
console.log(`Then: node scripts/render-commercial.mjs ${key}`);
