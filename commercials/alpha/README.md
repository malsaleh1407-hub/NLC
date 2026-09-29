# ALPHA commercial

30-second 16:9 spot for the **ALPHA** recessed COB downlight, built the same way
as the MINI commercial: six Gemini stills, no AI video. The edit is a
Remotion composition (`src/AlphaCommercial.tsx`).

| Time | Shot | Super |
|------|------|-------|
| 0–4.5 s | Hero macro, lights up from black | ALPHA · Elegance Scaled to Perfection |
| 4–8.5 s | Gallery | CRI >90 |
| 8–12.5 s | Hotel lobby | 130 lm/W |
| 12–16.5 s | Meeting room | 10–40 W |
| 16–20.5 s | Retail | 27° / 93° |
| 20–24.5 s | Majlis | 100,000 h |
| 24–30 s | End card: real product photo, spec chips, NLC logo, nlc.com.sa | |

All figures come from `nlc.com.sa/product/alpha.html`. The application stills are
AI concept visuals, so they carry a "Concept visualisation" tag and the end-card
footnote says so (brand honesty rule). The end card uses the real product photo.

## Pipeline

1. **Stills.** Generate the six stills in Gemini (web, e.g. driven by Claude in
   Chrome with `GEMINI-CHROME-TASK.md`, or Nano Banana 2 in Higgsfield with
   `PROMPTS.md`), using the real ALPHA photos as references.
2. **Wire them in.** Upload them to `public/stills/` (or paste Higgsfield result
   URLs) and list them, in shot order, in `props/alpha.json` → `stills`.
3. **Render.** Run `scripts/render-in-higgsfield-sandbox.sh` in the Higgsfield
   sandbox. It pulls Bizmo and the master logo from nlc.com.sa, which are never
   committed, then renders and uploads the MP4 to Higgsfield.

Local preview uses labelled placeholders for missing stills:

```bash
npm install
npm run studio            # timeline preview
npm run render:preview    # out/alpha-commercial-preview.mp4
```

The master is silent. Add the licensed Artlist music bed in the edit, as with MINI.
