# Task for Claude in Chrome: make the 6 ALPHA stills in Gemini

Before starting, the person attaches the two reference photos to a new chat at
gemini.google.com (download them first):

- https://nlc.com.sa/images/products/alpha-g2.png
- https://nlc.com.sa/images/products/alpha-g6.png

## Steps

1. Stay in that Gemini chat (it holds the two reference photos).
2. Send the six prompts below one at a time, waiting for each image.
3. If a result changes the fixture (square trim, black baffle, LED grid, wrong
   colour) or contains any text or logo, ask Gemini to regenerate it once.
4. Download each image at full size and name it as shown:
   `01-hero`, `02-gallery`, `03-lobby`, `04-meeting`, `05-retail`, `06-majlis`.

## Prompts (send exactly as written)

**01-hero**
> Using the two attached photos of the ALPHA recessed COB downlight as the exact product reference, create a 16:9 landscape photo. Cinematic editorial commercial still for a premium Saudi lighting manufacturer: deep navy blue (#24285E) shadows, warm orange-amber (#F6851F) accents, warm 3000K light, Sony A7R IV editorial look, shallow depth of field, teal-and-orange grade, photorealistic. Extreme close-up looking up at a single ALPHA downlight recessed flush in a smooth deep-navy plaster ceiling. The COB glows warm; light rakes across the faceted silver reflector, every facet catching amber highlights; the matte-white bezel reads crisp. Faint haze shows a soft cone of light falling out of frame. The fixture sits on the right third; the left half is calm dark navy empty space. Keep the fixture exactly as in the photos: round, wide matte-white bezel, deep faceted silver reflector, one small round warm COB at the centre. No text, no logos, no watermark, no signage, no purple or pink light.

**02-gallery**
> Using the two attached photos of the ALPHA recessed COB downlight as the exact product reference, create a 16:9 landscape photo. Cinematic editorial commercial still: deep navy shadows, warm amber accents, warm 3000K light, shallow depth of field, photorealistic. Wide interior of a hushed contemporary art gallery at night. A straight row of ALPHA downlights recessed in a dark charcoal ceiling, each casting a crisp warm pool onto large abstract canvases in deep reds, ochres and blues and onto a white stone sculpture on a plinth; colours look rich and true. Polished concrete floor, navy-grey walls. Main artwork and light pools centre-right; lower-left of the frame calm and dark. No people. Keep the downlights exactly as in the photos: round, wide matte-white bezel, faceted silver reflector. No text, no logos, no watermark, no signage.

**03-lobby**
> Using the two attached photos of the ALPHA recessed COB downlight as the exact product reference, create a 16:9 landscape photo. Cinematic editorial commercial still: deep navy shadows, warm amber accents, warm 3000K light, photorealistic. Grand modern Saudi hotel lobby at blue hour: long travertine reception desk, warm oak slat walls, brushed brass details, a symmetrical grid of ALPHA downlights recessed in a high white ceiling creating even warm pools on the stone floor and desk; tall glass facade with a deep navy dusk sky. One-point perspective at eye level; lower-left of the frame calm. No people. Keep the downlights exactly as in the photos: round, wide matte-white bezel, faceted silver reflector. No text, no logos, no watermark, no signage.

**04-meeting**
> Using the two attached photos of the ALPHA recessed COB downlight as the exact product reference, create a 16:9 landscape photo. Cinematic editorial commercial still: deep navy shadows, warm amber accents, warm 3000K light, photorealistic. Premium executive meeting room high in a Riyadh tower at blue hour: long walnut table, black leather chairs, floor-to-ceiling glass wall with the navy city skyline and warm city lights. A precise line of ALPHA downlights recessed in the white ceiling above the table gives crisp, even, glare-free light on the table. Three-quarter view down the table, weighted to the right of frame. No people. Keep the downlights exactly as in the photos: round, wide matte-white bezel, faceted silver reflector. No text, no logos, no watermark, no signage.

**05-retail**
> Using the two attached photos of the ALPHA recessed COB downlight as the exact product reference, create a 16:9 landscape photo. Cinematic editorial commercial still: deep navy shadows, warm amber accents, warm 3000K light, photorealistic. Luxury fashion boutique in a Saudi mall: minimal displays of leather handbags and shoes on travertine plinths and backlit oak shelves, ALPHA downlights recessed in a dark ceiling highlighting each product with crisp accent beams; rich, true colours on leather and fabric. Products and light pools centre-right; lower-left calm. No people, no mannequins. Keep the downlights exactly as in the photos: round, wide matte-white bezel, faceted silver reflector. No text, no logos, no brand names, no watermark, no signage.

**06-majlis**
> Using the two attached photos of the ALPHA recessed COB downlight as the exact product reference, create a 16:9 landscape photo. Cinematic editorial commercial still: deep navy shadows, warm amber accents, warm 3000K light, photorealistic. Contemporary Saudi majlis in the evening: low cream sofas along the walls, patterned wool carpet, a low table with a brass dallah, small cups and dates, sheer curtains, ALPHA downlights recessed in a smooth plaster ceiling casting soft warm pools on the walls and floor. Calm, generous, luxurious, weighted to the right of frame. No people. Keep the downlights exactly as in the photos: round, wide matte-white bezel, faceted silver reflector. No text, no logos, no watermark, no signage.

## Hand-off

Upload the six images to GitHub, into this folder on the
`claude/trusting-thompson-ncmzni` branch:

https://github.com/malsaleh1407-hub/NLC/tree/claude/trusting-thompson-ncmzni/commercials/alpha/public/stills

("Add file" → "Upload files"), then tell Claude Code "stills uploaded".
