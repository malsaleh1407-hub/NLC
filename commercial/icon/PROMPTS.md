# ICON — Commercial Photo Set (Gemini)

Application photos for the **ICON** recessed spotlight, done the same way as the LUXO and MINI sets.

**Tool:** Google Gemini, Nano Banana 2 (`gemini-3.1-flash-image-preview`), 16:9, 2K.
**Every shot must use the reference photo listed under it.** Gemini uses it to copy the real fixture.

- **CLI (preferred):** `GOOGLE_AI_API_KEY=... python3 commercial/generate.py commercial/icon/PROMPTS.md`
  generates every shot below, attaches the reference photos and saves the results in this folder.
  To re-roll some shots only: `... PROMPTS.md 03 05`.
- **Web:** open https://aistudio.google.com, attach the reference photo(s) from `images/products/`,
  paste *Product lock + shot prompt + House style*, set 16:9 / 2K and save the file under the name in the heading.

**Product facts (nlc.com.sa/product/icon.html):** ICON recessed spotlight, white polycarbonate body, tiltable head,
1, 2 or 3 modules (round single, square single, double, triple), 6.5–19.5 W, 747–2,241 lm, 115 lm/W,
41° beam, CRI > 90, 3000/4000/6500 K. Used in retail, galleries, hospitality, reception areas and homes.

---

## Product lock

> The light fixture in this image must be the exact NLC ICON recessed spotlight shown in the attached
> reference photo(s): a white powder-coated trim holding round, tiltable white spotlight modules, each with a
> warm LED lens set deep inside. Reproduce its shape, proportions, trim and white colour faithfully; do not
> redesign it, recolour it or add brand marks. Keep every ICON the same size and design throughout the scene.

## House style

> Photorealistic cinematic editorial commercial photograph, Sony A7R IV look, 35mm lens, shallow depth of
> field, warm 3000K light, deep navy shadows (#24285E) and warm orange highlights (#F6851F), teal-and-orange
> grade, premium modern Saudi interior. Physically correct light: every light pool and beam comes from a
> visible ICON fixture. No people, no text, no captions, no logos, no signage, no watermark. 16:9 landscape.

---

## `01-hero.png`
Reference: `icon-g3.png`

> Extreme low-angle close-up of a single square ICON spotlight recessed flush into a smooth matte-white
> plaster ceiling. The round module inside glows warm, and a soft visible cone of light falls through faint
> haze into a dark room below. The fixture sits sharp in the upper-left third; the ceiling plane falls away
> into soft navy shadow.

## `02-tilt.png`
Reference: `icon-g4.png`, `icon-g6.png`

> A round ICON spotlight in the ceiling of a modern Saudi villa entrance hall, its module visibly tilted
> about 25 degrees toward the wall, throwing a crisp oval accent beam onto a textured honed-limestone feature
> wall. Grazing light brings out the stone texture; a slim walnut console and a ceramic vase sit inside the
> pool of light. The fixture is visible at the top of the frame.

## `03-boutique.png`
Reference: `icon-g5.png`

> Wide interior of a luxury fashion boutique in Riyadh in the evening: a row of triple-module ICON spotlights
> recessed in a white ceiling, each module aimed at the displays below: oak display tables with folded
> garments and leather handbags on shelves. Crisp warm pools of light on the merchandise, darker walkways
> between them, polished stone floor with soft reflections.

## `04-gallery.png`
Reference: `icon-g2.png`

> Contemporary art gallery: double-module ICON spotlights recessed in a white ceiling, their beams aimed at a
> large abstract canvas in navy and burnt-orange tones and at a hand-thrown ceramic vessel on a white plinth.
> Crisp beam edges and rich, true colour on the artwork; the rest of the room in soft navy shadow; polished
> concrete floor.

## `05-reception.png`
Reference: `icon-g4.png`

> Five-star hotel reception: a line of round ICON spotlights recessed above a long travertine reception
> desk, each casting an even warm pool on the stone top, where a small brass bell and a white orchid sit.
> Vertical walnut slat wall behind; the lobby softly out of focus. Welcoming, calm evening atmosphere.

## `06-majlis.png`
Reference: `icon-g3.png`

> Modern Saudi majlis dining room at night: square ICON spotlights recessed in the ceiling above a walnut
> dining table set with a brass dallah, small finjan cups and a bowl of dates. Warm light pools on the table,
> low cream seating, sheer curtains glowing faintly, deep navy shadows in the corners.

## `07-family.png`
Reference: `icon.png`

> Studio product hero of the ICON family (a round single, a square single, a double and a triple) arranged
> on a glossy surface in front of a dark navy seamless backdrop, with soft reflections. Every module is
> switched on with a warm glow, and a warm orange rim light traces the white trims. Clean, premium catalogue
> composition with generous negative space on the right.
