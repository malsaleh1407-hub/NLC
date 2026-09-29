# NLC SOLID — Video Commercial Production Pack

Same format as the **MINI** (Sep 2026) and **CENTURY** (Sep 2026) commercials:
AI scene stills → **Kling 3.0** image-to-video shots → **Fraser** voiceover → edit with end card.

| Item | Value |
|---|---|
| Product | SOLID — `data-cat="strip-light"` (catalog family: *Flexibles*, with COASTER, CONTOUR-L/S, RIBBON) |
| Product photo in Higgsfield | media `465a8e85-175b-4a41-bcb0-34ccad070000` (imported from `images/products/solid.png`) |
| Datasheet | `datasheets/solid.pdf` — **spec slots below must be filled from it; nothing here is invented** |
| Runtime | ~55 s voiceover over 8 shots / 51 s of footage, plus logo end card |
| Aspect | 16:9, 1920×1080 |

---

## Credit budget (Higgsfield)

Observed rates on this account: Kling 3.0 pro, sound off = **7.5 credits per 5 s** (1.5 / s); Fraser voiceover ≈ **2.4 credits**.

| Stage | Qty | Credits |
|---|---|---|
| Kling 3.0 shots (51 s total) | 8 | ~76.5 |
| Voiceover (ElevenLabs, Fraser) | 1 | ~2.4 |
| Scene stills (nano_banana_2, with product reference) — skip if you upload your own stills as for MINI/CENTURY | 8 | a few credits each |
| **Total** | | **≈ 80 + stills** |

Balance on 2026-09-29: **0.61 credits** — top up before Stage B.

---

## Stage A — Scene stills (start frames)

Model `nano_banana_2`, 16:9, reference image = SOLID photo (`465a8e85-…`).
Prepend this prefix to every still prompt:

> Cinematic architectural interior photograph for a premium lighting commercial. Shot on Sony A7R IV, 24mm prime, f/4, shallow depth of field. Warm 3000K light, deep navy shadows (#24285e), warm orange highlights (#F6851F), teal-and-orange editorial grade, modern Saudi luxury interior. The luminaire is the EXACT flexible linear LED light from the reference image — match its profile, diffuser, finish, width and colour exactly; do not redesign it, do not add dots or segments that are not in the reference. No text, no logos, no signage, no watermark, no people. 16:9.

| # | Still | Prompt (after prefix) |
|---|---|---|
| 1 | `01-hero.png` | Extreme macro product hero: a length of the light lies in a gentle S-curve on a matte deep-navy surface, lit and glowing warm along its full length, the curve fading into soft darkness. |
| 2 | `02-majlis-cove.png` | Wide view of a modern Saudi majlis at night: low cream seating, plain plastered walls, a recessed ceiling cove running around the room with the light hidden inside, washing the ceiling in an even warm glow. |
| 3 | `03-stair.png` | Floating travertine staircase in a villa entrance hall, each tread under-lit by the light set into a shadow groove, a clean line of warm light beneath every step, deep shadow around. |
| 4 | `04-arch.png` | Arched plaster niche in a hotel lobby wall, the light bent smoothly around the full arch outline, a brass dallah on a stone plinth inside the niche. |
| 5 | `05-vanity.png` | Luxury hotel bathroom: marble vanity, frameless mirror with the light behind it creating a soft warm halo on the stone wall. |
| 6 | `06-retail.png` | High-end boutique: walnut shelving with the light concealed under each shelf edge, grazing down onto folded garments and leather handbags. |
| 7 | `07-corridor.png` | Long hotel corridor with timber wall panels, a continuous line of the light at skirting level running the full length of both walls into the vanishing point. |
| 8 | `08-closing.png` | A single sweeping curve of the lit light across a dark navy feature wall in an otherwise empty gallery, the rest of the room in deep shadow. |

---

## Stage B — Kling 3.0 shots

Settings for every shot (identical to MINI/CENTURY):

```json
{ "model": "kling3_0", "aspect_ratio": "16:9", "mode": "pro", "sound": "off",
  "cfg_scale": 0.5, "enhance_prompt": false, "multi_shots": false,
  "medias": [{ "role": "start_image", "value": "<still media id>" }] }
```

Every prompt ends with the shared style + guard tail:

> Cinematic editorial commercial, Sony A7R IV look, 24fps, shallow depth of field, warm 3000K light, deep navy shadows, teal-and-orange cinematic grade. The light stays one unbroken line and keeps its exact profile, width and position; architecture and objects stay solid and unchanged; no new objects or fixtures appear; no morphing or warping; no people; no text, no captions, no logos, no watermark, no lens flare overload, no shaky handheld, no fast cuts, no speed ramps.

| # | Start frame | Dur | Motion prompt (before the tail) |
|---|---|---|---|
| 1 | `01-hero` | 5 s | Very slow lateral slider move along the curved line of light, following its S-curve. The warm glow brightens smoothly and evenly along the whole length. Elegant product hero move. |
| 2 | `02-majlis-cove` | 8 s | Very slow push-in across the majlis toward the far wall. The ceiling cove glow stays perfectly even and steady, softly washing the ceiling. Calm, unhurried. |
| 3 | `03-stair` | 5 s | Slow upward crane move following the staircase from the bottom tread to the landing. Each line of light under the treads stays steady and even. |
| 4 | `04-arch` | 5 s | Very slow push-in toward the arched niche. The line of light around the arch brightens gently and settles; the dallah glints softly. |
| 5 | `05-vanity` | 5 s | Slow, smooth lateral slider move from left to right along the marble vanity. The warm halo behind the mirror stays soft and even. |
| 6 | `06-retail` | 5 s | Slow dolly along the walnut shelving. The concealed light under each shelf grazes steadily onto the garments and handbags. |
| 7 | `07-corridor` | 8 s | Very slow, smooth forward glide down the hotel corridor, the two lines of light at skirting level running steadily into the vanishing point. Deep perspective. |
| 8 | `08-closing` | 10 s | Very slow pull-back from the sweeping curve of light, revealing the dark gallery around it. The curve stays perfectly smooth and steady; faint haze in the air. |

Total footage: 51 s (≈ 76.5 credits).

---

## Stage C — Voiceover

Model `text2speech_v2`, `elevenlabs`, preset voice **Fraser** (`6705e465-7b52-5915-a1d8-b1222885e01d`) — same voice as MINI and CENTURY.
Structure mirrors those two scripts. **Bracketed lines are spec slots: fill each from `datasheets/solid.pdf`, drop any line the datasheet does not support.** Write numbers as words (e.g. "a hundred thousand hours", "C R I") as in the earlier scripts.

```text
Every space has a line worth following.

This is the NLC Solid. Light that follows every line.

[Power and output: e.g. "<N> watts per metre, for <N> lumens per metre."]

[Construction: body / diffuser material, and how tightly it bends.]

[Cut and connect: cutting interval, maximum run length, supply voltage.]

[Protection: I P rating — only if stated.]

[Colour: C R I value, flicker-free if stated, colour temperatures offered.]

[LED source and rated life, if stated.]

[Dimming / control options, if stated.]

For coves, stairs, shelving, hotels, and homes.

NLC Solid. Light that follows every line.
```

Target ~55 s read, matching MINI (55.0 s) and CENTURY (54.1 s).

---

## Stage D — Edit

Cut order = shot order 1 → 8, voiceover laid from 0:00, logo end card (`images/logo/logo-white.svg` on navy `#24285e`) over the last 3 s of shot 8.
Suggested VO alignment: hook + name over shots 1–2, specs over 3–6, applications over 7, sign-off over 8.
