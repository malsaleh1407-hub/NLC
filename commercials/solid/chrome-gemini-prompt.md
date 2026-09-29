# SOLID stills via Gemini web + Claude in Chrome

## Steps

1. In Chrome, open https://gemini.google.com/app and start a new chat.
2. Attach the SOLID product photo (`Website/images/products/solid.png`) to that chat. Don't send anything yet.
3. Open the Claude in Chrome extension on that tab and paste the prompt below.
4. Upload the 8 downloaded images here (any file names are fine, I match them by looking at them):
   https://github.com/malsaleh1407-hub/NLC/upload/claude/awesome-bardeen-j83nh8/commercials/solid/stills
5. Tell the Claude Code session "stills uploaded": it pulls them, renders the commercial and sends the MP4.

## Prompt for the Claude in Chrome extension

```text
Open https://gemini.google.com/app in this tab. The chat already has our product photo (NLC SOLID, a flexible LED light) attached.

Generate 8 images, one per message, in the order below. For each one:
1. Send the message exactly as written.
2. Wait until the image has fully finished.
3. Download it at full size with Gemini's download button.
If Gemini replies with text instead of an image, or the image is not landscape, send the same message once more ending with "Generate the image now, 16:9 landscape."

When all 8 are downloaded, list the downloaded file names in order.

--- Message 1 ---
Use the attached product photo as the exact light fitting in every image in this chat: same profile, diffuser, finish, width and colour; do not redesign it or add dots or segments. Style for every image: photorealistic cinematic architectural photograph for a premium lighting commercial, Sony A7R IV, 24mm, f/4, shallow depth of field, warm 3000K light, deep navy shadows (#24285e), warm orange highlights (#F6851F), teal-and-orange grade, modern Saudi luxury interior. No text, no logos, no signage, no people. Wide 16:9 landscape.

Image 1 of 8 (01-hero): Extreme macro product hero: a length of the light lies in a gentle S-curve on a matte deep-navy surface, lit and glowing warm along its full length, the curve fading into soft darkness.

--- Message 2 ---
Image 2 of 8 (02-majlis-cove), same product and style rules, wide 16:9 landscape: Wide view of a modern Saudi majlis at night: low cream seating, plain plastered walls, a recessed ceiling cove running around the room with the light hidden inside, washing the ceiling in an even warm glow.

--- Message 3 ---
Image 3 of 8 (03-stair), same product and style rules, wide 16:9 landscape: Floating travertine staircase in a villa entrance hall, each tread under-lit by the light set into a shadow groove, a clean line of warm light beneath every step, deep shadow around.

--- Message 4 ---
Image 4 of 8 (04-arch), same product and style rules, wide 16:9 landscape: Arched plaster niche in a hotel lobby wall, the light bent smoothly around the full arch outline, a brass dallah on a stone plinth inside the niche.

--- Message 5 ---
Image 5 of 8 (05-vanity), same product and style rules, wide 16:9 landscape: Luxury hotel bathroom: marble vanity, frameless mirror with the light behind it creating a soft warm halo on the stone wall.

--- Message 6 ---
Image 6 of 8 (06-retail), same product and style rules, wide 16:9 landscape: High-end boutique: walnut shelving with the light concealed under each shelf edge, grazing down onto folded garments and leather handbags.

--- Message 7 ---
Image 7 of 8 (07-corridor), same product and style rules, wide 16:9 landscape: Long hotel corridor with timber wall panels, a continuous line of the light at skirting level running the full length of both walls into the vanishing point.

--- Message 8 ---
Image 8 of 8 (08-closing), same product and style rules, wide 16:9 landscape: A single sweeping curve of the lit light across a dark navy feature wall in an otherwise empty gallery, the rest of the room in deep shadow.
```
