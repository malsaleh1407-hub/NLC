# NLC HARMONY — commercial production pack

**Render:** `npm run render:harmony` → `out/nlc-harmony-commercial.mp4`
(1920×1080 · 30 fps, composition `HarmonyCommercial`).

The cut is built from real product imagery: the studio photo `Harmony-1.png` and
the Opal / Microprismatic front views from `Harmony Datasheet.pdf`. Every figure on
screen is read from `src/data/harmony.ts`, transcribed from that datasheet.

Lifestyle imagery comes from **six Gemini stills**, one per application. No video
generation is needed: the edit animates each still with a slow push-in and drift,
and crossfades between them under the *Made for …* words.

## 1 · Gemini stills

Generate in Gemini (Nano Banana, `gemini-2.5-flash-image`) at **16:9**, ideally
1920×1080 or larger.

**If you use the Gemini app:** attach `Harmony-1.png` to every prompt, so the
fitting in the scene is the real HARMONY, and start the prompt with *"Use the
attached ceiling luminaire as the product."*

**If you use text only** (API / Zapier, which can't take a reference image): the
product description in the suffix does the work. Expect a close lookalike rather
than the exact fitting.

Append this suffix to every prompt:

> The ceiling light is the NLC Harmony: a slim, round, surface-mounted LED ceiling
> luminaire in matt white, a low stepped cylindrical body with a thin white rim
> around a flat, evenly glowing circular diffuser, no visible LEDs, no frame, no
> decoration. It is switched on at warm 3000K. Keep it perfectly circular and
> flush to the ceiling. Cinematic editorial interior photograph, Sony A7R IV, 24mm,
> f/4, warm 3000K light, deep navy shadows, subtle teal-and-orange grade, premium
> Saudi/GCC architecture. Photorealistic. No text, no logos, no signage, no people,
> 16:9.

| # | File | Application | Prompt |
|---|---|---|---|
| 1 | `01-homes.jpg` | Homes | A calm modern Saudi living room at dusk, low sofa and a travertine coffee table, one Harmony fitting centred on the white ceiling washing the room in soft even light, sheer curtains, city lights beyond the window. Keep the left third of the frame calm and darker for a text overlay. |
| 2 | `02-hotels.jpg` | Hotels | A quiet luxury hotel corridor with walnut wall panels and a patterned carpet, a row of Harmony fittings on the ceiling receding into perspective, each making a soft pool of light. |
| 3 | `03-lobbies.jpg` | Lobbies | A bright residential-tower lift lobby with stone floor and brushed-metal lift doors, three Harmony fittings in a line on the ceiling, even glare-free light. |
| 4 | `04-offices.jpg` | Offices | An open-plan office at blue hour, oak desks and ergonomic chairs, a grid of Harmony fittings with microprismatic diffusers on the ceiling, glare-free even light on the desks, screens off. |
| 5 | `05-museums.jpg` | Museums | A museum foyer with pale stone walls and a single abstract sculpture on a plinth, a row of Harmony fittings overhead giving soft ambient light, deep shadows at the edges. |
| 6 | `06-hospitals.jpg` | Hospitals | A clean, calm hospital corridor with soft-white walls and a wooden handrail, opal Harmony fittings evenly spaced along the ceiling, uniform light and gentle reflections on the polished floor. |

White text sits over the left side of every still (a navy gradient is added in the
edit), so busy detail belongs on the right.

### Generating them with Claude in Chrome

Run this from a Claude session on your own computer with the Chrome extension
connected: the Claude Desktop app, or `claude remote-control` in the NLC folder.
Paste:

> On branch `claude/festive-maxwell-bhqugk`, read `remotion/HARMONY-SHOTLIST.md`.
> Using Chrome, open gemini.google.com and switch to image generation
> (Nano Banana). For each of the six stills in the table, start a new chat and
> attach `Harmony-1.png` (Google Drive → "Add from Drive"). Send "Use the attached
> ceiling luminaire as the product." followed by the row's prompt and the suffix,
> in 16:9. Download the full-size result.
>
> Check each still before keeping it: the fitting is round, flat-diffuser and
> flush to the ceiling, with no text, logos or people. Regenerate any still that
> fails.
>
> Save the stills as JPEG, at most 2400 px wide, under
> `remotion/public/harmony/stills/` with the file names in the table. List them in
> `HARMONY_MEDIA.lifestyle`, then run `npm ci && npm run render:harmony` in
> `remotion/`. Check a few frames of the applications scene, then commit the
> stills and the new MP4 and push.

If you use the Chrome side panel on its own instead, have it download the six
stills and put them in Google Drive with those file names. A cloud session can
pull them from Drive and do the render.

## 2 · Layering them in

Save the six stills as `public/harmony/stills/01-homes.jpg` … `06-hospitals.jpg`
and list them in `HARMONY_MEDIA` (`src/data/harmony.ts`), in the same order as the
applications:

```ts
export const HARMONY_MEDIA = {
  voiceover: null,
  music: null,
  lifestyle: [
    'harmony/stills/01-homes.jpg',
    'harmony/stills/02-hotels.jpg',
    'harmony/stills/03-lobbies.jpg',
    'harmony/stills/04-offices.jpg',
    'harmony/stills/05-museums.jpg',
    'harmony/stills/06-hospitals.jpg',
  ],
};
```

Then run `npm run render:harmony`. The applications scene grows to 1.6 s per still
(the spot becomes about 67 s) and every later scene shifts to fit automatically.

## 3 · Voice-over (optional)

`HARMONY_VO` in `src/data/harmony.ts` is a ~55 s read, one paragraph per scene, in
the same voice as the MINI and CENTURY spots. Record or synthesise it, save it as
`public/harmony/vo.mp3`, and set `voiceover: 'harmony/vo.mp3'`. A music bed set in
`music` is ducked automatically under the voice. If the read runs long or short,
adjust the scene lengths in `DUR` at the top of
`src/compositions/HarmonyCommercial.tsx`.

## Scene map (without stills)

| Scene | Time | On screen | Datasheet source |
|---|---|---|---|
| Hook | 0:00 | Harmony switches on from darkness | Harmony-1.png |
| Title | 0:05 | HARMONY · Light that Lasts, Performance you Trust · up to 148 lm/W | p.1 |
| Optics | 0:10 | Opal (NLC-HO) vs Microprismatic (NLC-HP), UGR < 19, microprism macro | p.1, p.2, p.3 |
| Output | 0:18 | 148 lm/W · 20 W / 2,960 lm · 40 W / 5,920 lm · Ø300 / Ø400 mm to scale | p.3 |
| Photometry | 0:25 | 110° polar distribution · Lumileds SMD2835 · CRI > 90 (> 95 opt.) · SDCM < 3 | p.2, p.3 |
| Colour | 0:31 | Flicker-free · 2700 / 3000 / 4000 / 5000 / 5700 / 6500 K sweep | p.2 |
| Durability | 0:36 | IP44/54 · Class II · 1 kV / 2 kV surge · > 50,000 h L70B50 · > 25,000 cycles · –20 to +45 °C | p.1, p.2 |
| Install | 0:42 | Surface mounted / suspended · matt white / matt black · dimming + emergency optional | p.2 |
| Applications | 0:47 | Homes · Hotels · Lobbies · Offices · Museums · Hospitals (Gemini stills when supplied) | p.2 |
| Warranty | 0:52 | 5-year warranty · SASO · CB · IECEE · RoHS · CE | p.1, p.3 |
| End card | 0:56 | Lit Harmony · HARMONY · Light that Lasts, then the light blooms to white on the NLC logo | p.1 logo artwork |

The photometric curve is drawn from the datasheet's 110° beam angle (a smooth
cosine lobe with that full-width-half-maximum). It matches the datasheet's
near-circular polar plots, but it is not a measured IES file.
