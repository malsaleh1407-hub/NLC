# MARCO SYSTEM · Stills Commercial

Same recipe as the MINI spot: **Gemini stills only, no AI video**. Eight Gemini
(Nano Banana 2) stills of MARCO in real applications, each given a slow Ken Burns
move, a Bizmo title card and a crossfade, between a navy light-sweep opener and the
white-logo end card. About 30 s, 1920×1080, 30 fps. The file is silent: add the music
bed from the Artlist library in post.

- **Product reference:** `images/products/marco-system.png` (also uploaded to Higgsfield
  as media `465a8e85-175b-4a41-bcb0-34ccad070000`). Attach it to every still.
- **Model:** `nano_banana_2`, 16:9, 2k (2 Higgsfield credits per still, 16 for the set).
- **Build:** `python3 commercials/build_commercial.py commercials/marco/shots.json marco.mp4`
  (runs in the Higgsfield sandbox; fill each `image` in `shots.json` with the still's URL first).
- **Specs on cards** come from the MARCO product page (6–208W, 580–12,940 lm, CRI ≥90,
  IP40, suspension up to 4,000 mm, 1–10V / DALI, sensor integration). No other claims.
- AI stills of MARCO in client settings are concept visuals, so every shot carries a
  small "Concept visualisation" note (brand system, honesty rules).

## Prompt blocks

**Brand block** (start of every prompt):

> Cinematic industrial-tech editorial photograph for a premium Saudi lighting
> manufacturer. Deep navy blue (#24285E) shadows and environments, warm orange-amber
> (#F6851F) light accents, signature warm 3000K illumination. Sony A7R IV editorial
> look, shallow depth of field, teal-and-orange cinematic grade, National Geographic
> industrial-tech aesthetic. Modern Saudi commercial interiors, premium finishes.
> Light behaviour is the hero of the shot. 16:9.

**Product block** (after the shot description):

> The luminaire is the NLC MARCO modular lighting system exactly as in the reference
> image: matte-black cylindrical LED spot modules with frosted round lenses, set in a
> row inside a slim matte-black aluminium channel profile, lenses facing down. Keep the
> module shape, proportions and matte-black finish identical to the reference; do not
> invent a different fixture.

**Negative block** (end of every prompt):

> No text, no captions, no logos, no watermark, no signage, no brand names, no people
> unless described, no distorted hands, no extra fingers, no purple or pink neon, no cold
> blue-only grade, no cartoon or CGI look, no lens flare overload.

## Shot list

| # | Scene | Move | Card |
|---|-------|------|------|
| 01 | Studio hero | push in | 01 · Modular · **Built around light** · Optical modules in one aluminium profile |
| 02 | Office | push in | 02 · Offices · **Any length · Any shape** · Frameless, framed, surface or suspended |
| 03 | Retail boutique | pan right | 03 · Retail · **Light exactly where it sells** · Spot, grill and line optics in one run |
| 04 | Hotel lobby | push in | 04 · Hospitality · **Suspended up to 4 m** · Adjustable wire suspension, any run length |
| 05 | Museum gallery | pan left | 05 · Museums · **CRI ≥90** · True colour on every surface |
| 06 | Corridor | push in | 06 · Corridors · **Dimmable · DALI ready** · 1–10V or DALI, with sensor integration |
| 07 | Furniture showroom | pan right | 07 · Showrooms · **One system · Every space** · Surface, recessed or suspended profiles |
| 08 | Macro module swap | push in | 08 · Service · **Swap modules · No rewiring** · Simpler design, installation and maintenance |

## Shot prompts

Each prompt below goes between the brand block and the product block.

**01 · Studio hero.** A single straight 2.5 m length of the MARCO profile suspended
horizontally on two thin steel wires in a deep navy void. The row of spot modules glows
warm 3000K, each casting a soft cone of light onto a dark polished floor below; fine
haze and dust motes reveal the beams; amber rim light along the profile edge. Wide
composition with the fixture across the upper third and generous empty space on the
left.

**02 · Office.** Open-plan corporate office in Riyadh at blue hour. MARCO profiles
recessed trimless in a smooth white ceiling run as long continuous lines that meet in
crisp 90° corners, forming a large rectangle above the desks. Even, glare-free light on
light-oak desks and ergonomic chairs; floor-to-ceiling glass shows a deep navy dusk sky
and distant city lights. Wide 24 mm lens, eye level, symmetrical one-point perspective.
Empty office, no people.

**03 · Retail.** Luxury fashion boutique in Riyadh at night. A black MARCO profile
recessed in a dark charcoal ceiling carries a run of the black cylindrical spot modules,
each throwing a tight warm beam onto folded garments on travertine display plinths and
handbags on walnut shelves. Strong pools of light, deep navy shadows, polished stone
floor with soft reflections. No mannequins, no people.

**04 · Hospitality.** Five-star hotel lobby in Jeddah in the evening. A long matte-black
MARCO profile suspended on thin steel wires above a travertine reception desk, its spot
modules pooling warm 3000K light on the desk. Vertical walnut wall slats behind, a brass
dallah and a plate of dates on the desk, navy evening sky through tall windows. No
people.

**05 · Museum.** Contemporary art gallery in Riyadh. A frameless MARCO profile recessed
in the ceiling close to the wall washes a tall white wall with smooth, even light. Three
large abstract paintings in indigo, ochre and orange read rich and true; polished
concrete floor, one wooden bench, the rest of the room falls into navy shadow. No people,
no labels.

**06 · Corridor.** Long premium office corridor with a polished concrete floor and
navy-painted walls. A continuous black MARCO profile recessed in the ceiling runs the
full length and turns 90° at the far end; the repeated spot modules create a rhythm of
warm pools of light on the floor receding to the vanishing point. Symmetrical one-point
perspective, 24 mm, no people, no signage.

**07 · Showroom.** High-end furniture showroom at night. Several parallel lines of
surface-mounted black MARCO profile on a dark ceiling accent-light a cognac leather sofa,
a sculptural marble coffee table and a travertine side table. Warm pools of light, deep
navy shadows, tall windows with a blue-hour sky. No people.

**08 · Macro.** Extreme close-up. A technician's hand in a black nitrile glove slides one
matte-black cylindrical spot module into the open channel of the black MARCO aluminium
profile mounted on a ceiling; the neighbouring modules are already lit warm 3000K.
Shallow depth of field with the profile edge and the module lens in sharp focus, navy
background falling off to darkness, amber rim light on the aluminium. One hand only,
five fingers, natural anatomy.
