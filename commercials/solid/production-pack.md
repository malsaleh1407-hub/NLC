# NLC SOLID — Commercial

Gemini paints 8 stills of SOLID in Saudi interiors, using the real product photo as the
reference. `commercials/make_commercial.py` then turns them into a 41.6 s 1080p MP4: slow
camera moves, crossfades, NLC captions and an end card. No AI video, no Higgsfield.

| Item | Value |
|---|---|
| Product | SOLID, catalog card "LED Strip" (filter: *Flexibles*) |
| Reference photo | `images/products/solid.png` (+ `solid-g2.png`… if present) |
| Shots, prompts, captions | `shots.json` (single source of truth) |
| Output | `out/solid-commercial.mp4` + `out/solid-commercial-poster.jpg` |

## Run

From the website project root (so `images/products/solid.png` is found):

```bash
pip install Pillow imageio-ffmpeg        # once
export GEMINI_API_KEY=...                # Google AI Studio key
python3 commercials/make_commercial.py solid stills   # 8 stills + stills/_contact-sheet.jpg
python3 commercials/make_commercial.py solid video    # ~2 min render
```

Redo one still: `... solid stills --only 04-arch --force`.
Add a voiceover or music: `... solid video --audio vo.mp3` (faded out over the last 2 s).

## Shots

| # | Scene | Move | Caption |
|---|---|---|---|
| 1 | Macro S-curve of the light on navy | pan right | INTRODUCING · NLC SOLID · Light that follows every line. |
| 2 | Majlis ceiling cove | push in | Majlis & residential · Cove light that sets the tone. |
| 3 | Floating travertine stair, under-lit treads | rise | Stairs & circulation · Every step, clearly drawn. |
| 4 | Arched niche outlined in light, brass dallah | push in | Arches & curves · Bends with the architecture. |
| 5 | Hotel vanity, mirror halo | pan left | Hospitality · A soft halo behind every mirror. |
| 6 | Boutique walnut shelving | pan right | Retail display · Light that sells the shelf. |
| 7 | Hotel corridor, skirting-level line | push in | Corridors & lobbies · Guides the way, end to end. |
| 8 | Sweeping curve on a navy gallery wall | pull out | — |
| End | NLC mark (wipe reveal), SOLID, LED STRIP, tagline, nlc.com.sa | | |

## Spec captions — fill from `datasheets/solid.pdf`

Each shot has a `spec` line in `shots.json`, shown under its headline when filled in.
They are empty on purpose — no figures were invented. Suggested placement:

| Shot | Spec to add |
|---|---|
| 02-majlis-cove | power / lumens per metre |
| 03-stair | cutting interval, max run length |
| 04-arch | bend radius / bending direction |
| 05-vanity | CRI and colour temperatures |
| 06-retail | IP rating |
| 07-corridor | dimming / supply voltage |
