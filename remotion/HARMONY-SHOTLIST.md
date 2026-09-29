# NLC HARMONY — commercial production pack

**Render now:** `npm run render:harmony` → `out/nlc-harmony-commercial.mp4`
(1920×1080 · 30 fps · 62 s, composition `HarmonyCommercial`).

The rendered cut uses only real product imagery: the studio photo `Harmony-1.png`
and the Opal / Microprismatic front views from `Harmony Datasheet.pdf`. Every figure
on screen is read from `src/data/harmony.ts`, which is transcribed from that
datasheet.

The MINI and CENTURY spots were built from Higgsfield **Kling 3.0** lifestyle clips
plus an **ElevenLabs "Fraser"** voice-over. This pack repeats that recipe for
HARMONY. When the account had 0.61 credits it could not be generated, so run it once
credits are topped up and drop the files in (see *Layering it in* below).

## Budget (Higgsfield)

| Item | Setting | Credits |
|---|---|---|
| Voice-over | text2speech_v2 · ElevenLabs · preset voice **Fraser** | ≈ 2.4 |
| 6 lifestyle clips | Kling 3.0 · pro · 16:9 · 5 s · sound off | 6 × 7.5 = 45 |
| **Total** | | **≈ 48** (+ stills if made in Higgsfield) |

## 1 · Voice-over (Fraser)

Paste as one read, with the blank lines between paragraphs, the same way as the
MINI / CENTURY reads. The source is `HARMONY_VO` in `src/data/harmony.ts`:

```
Some spaces just need light. Done right.

This is the N L C Harmony. Light that lasts, performance you trust.

Two optics, one design. Soft opal, or microprismatic, with glare held below U G R nineteen.

Twenty or forty watts. Up to a hundred and forty-eight lumens per watt.

Lumileds LEDs. A hundred-and-ten-degree beam. C R I above ninety.

Flicker-free, from warm to cool white.

I P forty-four to fifty-four, Class Two, rated beyond fifty thousand hours.

Surface-mounted or suspended, in matt white or black.

For homes, hotels, offices, museums, and hospitals.

Five-year warranty. N L C Harmony. Light that lasts.
```

Save it as `public/harmony/vo.mp3`.

## 2 · Start stills (one per application)

Make each still with `Harmony-1.png` attached as the product reference, in 16:9.
Append this suffix to every still prompt:

> The ceiling luminaire is the exact NLC Harmony from the reference: a slim round
> surface-mounted fitting with a white stepped rim and a flat glowing diffuser,
> shown switched on at 3000K. Keep its circular shape and proportions exactly.
> Cinematic editorial interior photograph, Sony A7R IV, 24mm, f/4, warm 3000K light,
> deep navy shadows, teal-and-orange grade. No text, no logos, no signage, no people.

| # | App | Still prompt |
|---|---|---|
| 1 | Homes | A calm modern Saudi living room at dusk, low sofa and a travertine coffee table, one Harmony fitting centred on the white ceiling washing the room in soft even light, sheer curtains, city lights beyond the window. |
| 2 | Hotels | A quiet luxury hotel corridor with walnut wall panels and a patterned carpet, a row of Harmony fittings on the ceiling receding into perspective, each making a soft pool of light. |
| 3 | Lobbies | A bright residential-tower lift lobby with stone floor and brushed-metal lift doors, three Harmony fittings in a line on the ceiling, even glare-free light. |
| 4 | Offices | An open-plan office at blue hour, oak desks and ergonomic chairs, a grid of microprismatic Harmony fittings on the ceiling, glare-free even light on the desks, screens off. |
| 5 | Museums | A museum foyer with pale stone walls and a single sculpture on a plinth, a row of Harmony fittings overhead giving soft ambient light, deep shadows at the edges. |
| 6 | Hospitals | A clean hospital corridor with soft-white walls and a handrail, opal Harmony fittings evenly spaced along the ceiling, calm uniform light and polished floor reflections. |

Upload the six stills to Higgsfield as media inputs.

## 3 · Kling 3.0 motion prompts

Settings: `model kling3_0 · mode pro · aspect 16:9 · duration 5 · sound off ·
cfg_scale 0.5 · enhance_prompt false`, with the matching still as `start_image`.
Every prompt ends with the same guard rail used on MINI / CENTURY:

> Cinematic editorial commercial, Sony A7R IV look, 24fps, shallow depth of field,
> warm 3000K light, deep navy shadows, teal-and-orange cinematic grade. The round
> ceiling luminaires keep their exact circular shape, white rim and flat glowing
> diffuser and stay fixed flat to the ceiling; walls, furniture and floor stay solid
> and unchanged; no new objects appear; no morphing or warping; no people; no text,
> no captions, no logos, no watermark, no lens flare overload, no shaky handheld,
> no fast cuts, no speed ramps.

| # | App | Motion |
|---|---|---|
| 1 | Homes | Very slow, smooth push-in toward the sofa; the Harmony light stays steady and even; the sheer curtains breathe very gently. |
| 2 | Hotels | Extremely slow forward glide down the corridor, passing under the row of Harmony fittings, each pool of light steady on the carpet. |
| 3 | Lobbies | Slow lateral slider move from left to right past the lift doors, the three Harmony fittings passing overhead, light steady and even. |
| 4 | Offices | Very slow, gentle upward tilt from the desks toward the ceiling grid of Harmony fittings; soft, glare-free, never harsh. |
| 5 | Museums | Very slow push-in toward the sculpture; soft ambient light from the Harmony fittings holds steady; faint haze in the air. |
| 6 | Hospitals | Slow, smooth dolly forward down the corridor; the opal Harmony fittings pass overhead one by one, reflections gliding on the polished floor. |

Download as `public/harmony/clips/01-homes.mp4` … `06-hospitals.mp4`.

## 4 · Layering it in

Set the file paths in `HARMONY_MEDIA` (`src/data/harmony.ts`):

```ts
export const HARMONY_MEDIA = {
  voiceover: 'harmony/vo.mp3',
  music: null, // or 'harmony/music.mp3', ducked automatically under the VO
  lifestyle: [
    'harmony/clips/01-homes.mp4',
    'harmony/clips/02-hotels.mp4',
    'harmony/clips/03-lobbies.mp4',
    'harmony/clips/04-offices.mp4',
    'harmony/clips/05-museums.mp4',
    'harmony/clips/06-hospitals.mp4',
  ],
};
```

Then run `npm run render:harmony`. With clips present, the *Made for …* scene
becomes a full-frame lifestyle montage with one clip per application word. The
scene lengthens to fit, and everything after it shifts automatically. If the
Fraser read runs long or short, adjust the scene lengths in `DUR` at the top of
`src/compositions/HarmonyCommercial.tsx`. The line-to-scene mapping is one
`HARMONY_VO` paragraph per scene, in order: hook, title, optics, output,
photometry, cct, durability, install, applications, then warranty + end card.

## Scene map (as rendered)

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
| Applications | 0:47 | Homes · Hotels · Lobbies · Offices · Museums · Hospitals | p.2 |
| Warranty | 0:52 | 5-year warranty · SASO · CB · IECEE · RoHS · CE | p.1, p.3 |
| End card | 0:56 | Lit Harmony · HARMONY · Light that Lasts, then the light blooms to white on the NLC logo | p.1 logo artwork |

The photometric curve is drawn from the datasheet's 110° beam angle (a smooth
cosine lobe with that full-width-half-maximum). It matches the datasheet's
near-circular polar plots, but it is not a measured IES file.
