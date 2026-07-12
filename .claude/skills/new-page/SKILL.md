---
name: new-page
description: Create a new page on the NLC website (EN + AR mirror). Use when the user asks for a new page, section, landing page, or solution sub-page. Enforces STYLE-GUIDE.md tokens, bilingual mirroring, and hreflang.
---

# New NLC Page (EN + AR)

Read `STYLE-GUIDE.md` at the repo root first; it is the single source of truth. Summary of the hard rules:

## Procedure

1. **Copy the nearest sibling EN page** in the same family (directory page, solution sub-page, product detail). Do not start from scratch.
2. **Replace content only.** Reuse existing classes. Do not add new selectors to the inline `<style>` block unless truly page-specific.
3. **Mirror to `/ar/{page}.html`:**
   - `<html lang="ar" dir="rtl">`
   - Navbar via `/ar/nav.js` injection: `<div id="nav-root" data-active="..." data-en="..."></div>` (EN navbars stay inline per page)
   - Translate all copy; AR font is Lama Sans via `/fonts/fonts.css`, do not override font-family
4. **hreflang alternates in BOTH files:** `<link rel="alternate" hreflang="en" href=".../page.html">` plus the `hreflang="ar"` counterpart.
5. **Visual diff vs the sibling:** navbar height (logo 44px, padding 12px 0, never change), hero family and size, button styles, card grid spacing.
6. Run `python test_site.py`, then commit and push.

## Token rules (never violate)

- Colors only via CSS variables: `--primary #24285e`, `--secondary #F6851F`, etc. Never raw hex in content rules.
- Sections: `padding: 80px 0`. Container: `max-width: 1280px; padding: 0 24px`.
- Buttons: `.btn btn-primary` (orange, max one per section), `.btn-outline`, `.btn-outline-white` on dark. `padding: 13px 30px; border-radius: 50px`.
- Cards: `border-radius: var(--radius-lg)`, `--shadow-md` at rest, `--shadow-lg` + `translateY(-6px)` on hover.
- Hero gradient: `linear-gradient(135deg, var(--primary) 0%, #1a1e48 100%)`.
- Fonts: EN Bizmo + Outfit, AR Lama Sans. No new fonts. Icons: Font Awesome 6.5.0 only.
- Images: heroes < 500 KB JPG q82, cards < 250 KB, every `<img>` has alt text.
- No em-dashes in prose (NLC house style). AOS reveal: `data-aos="fade-up"`, init `{duration:700, once:true, offset:60}`.
- Section anchors always point to `index.html#section`.
