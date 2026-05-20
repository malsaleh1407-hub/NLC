# NLC Website — Visual Identity Guideline

A practical reference for any designer or developer building new pages on the NLC site. Every value listed here is the **canonical value** already used across both the English (root) and Arabic (`/ar/`) sides of the site. Match these and the new page will look like it belongs.

> **Quick rule of thumb:** when in doubt, copy an existing page in the same family (directory page, solution sub-page, product detail, etc.) and only swap the content. Don't redeclare design tokens — use the variables.

---

## 1. Brand Identity

### 1.1 Logo

Three variants live in `/images/logo/`. Pick the one that fits the background.

| File | When to use |
|---|---|
| `logo-blue.svg` | Default. Use on any white / light background (navbar, footer brand area on light backgrounds, partner sites). |
| `logo-white.svg` | On dark backgrounds (footer over navy, hero CTAs, dark cards). Same artwork, white fill. |
| `logo-mark.svg` | **Icon-only** (orange starburst, no text). For favicons, hero watermarks, social-share thumbnails, app tiles, loading states. Never use as the sole visible identifier on a page. |

Rendered height in navbars: **44 px** (do not deviate). Always preserve aspect ratio.

### 1.2 Brand Mark Construction

The starburst is two interlocking 4-rayed bursts (one rotated 45°) forming an 8-point asterisk. Maintain at least 8 px of clear space around it on all sides. Don't recolor — orange is the only sanctioned mark color.

---

## 2. Color Palette

Declared as CSS custom properties on every page's `:root` block. **Use the variables — never the hex codes directly.**

```css
:root{
  --primary:        #24285e;   /* Navy - headings, navbar text, footer bg */
  --primary-light:  #2e3478;   /* Navy hover / gradient stop */
  --primary-dark:   #1a1e48;   /* Hero gradient end */
  --secondary:      #F6851F;   /* Orange - CTAs, accents, active state */
  --secondary-dark: #e0720a;   /* Orange hover */
  --bg:             #F0EFEF;   /* Page background */
  --white:          #fff;
  --dark:           #1a1c3a;   /* Body text */
  --gray:           #6b7280;   /* Secondary text */
  --gray-light:     #9ca3af;   /* Tertiary text, captions */
  --border:         #e2e1e1;   /* Card borders, dividers */
}
```

| Use case | Color |
|---|---|
| Body text | `--dark` |
| Headings | `--primary` |
| Subtext / paragraphs | `--gray` |
| Captions / muted | `--gray-light` |
| CTA buttons, links on hover, active nav | `--secondary` |
| Page background | `--bg` |
| Section dividers | `--border` |

---

## 3. Typography

### 3.1 Font Families

| Locale | Variable value | Source |
|---|---|---|
| English (root) | `'Bizmo','Outfit',sans-serif` | `/fonts/fonts.css` (Bizmo local) + Outfit fallback (Google Fonts) |
| Arabic (`/ar/`) | `'Lama Sans',sans-serif` | `/fonts/fonts.css` (Lama Sans local) |

Both fonts are loaded site-wide via `<link rel="stylesheet" href="/fonts/fonts.css">` near the top of the `<head>`. **Don't override** the font-family on body or any element — the locale handles it.

### 3.2 Type Scale

The values below are the **only** approved sizes for each role. If you find yourself wanting a different size, you probably want a different element.

| Role | Selector | Size | Weight | Line-height |
|---|---|---|---|---|
| Hero title (H1) | `.page-hero h1` | `clamp(2.2rem, 5vw, 3.5rem)` | 900 | 1.1 |
| Hero description | `.page-hero p` / `.hero-desc` | 1.05 rem | 400 | 1.8 |
| Section title (H2) | `.section-title` | `clamp(1.8rem, 3.5vw, 2.6rem)` | 900 | 1.15 |
| Section subtitle | `.section-subtitle` | 1.02 rem | 400 | 1.75 |
| Section eyebrow label | `.section-label` | 0.72 rem | 700 | uppercase, letter-spacing 0.32em |
| Card title (H3/H4) | inside cards | 1.05 rem | 800 | 1.3 |
| Card description | inside cards | 0.83 rem | 400 | 1.6 |
| Body paragraph | default | 1 rem | 400 | **1.6** |
| Navbar link | `.nav-link` | 0.88 rem | 500 | — |
| Mobile nav link | `.mob-link` | 1.3 rem | 700 | — |
| Button (default) | `.btn` | 0.93 rem (1 rem on landing only) | 600 | — |
| Lang switch pill | `.lang-switch` | 0.8 rem | 600 | — |
| Sub-solution strip pill | `.sol-link` | 0.82 rem | 600 | — |
| Footer body copy | `.footer-brand p` / `.footer-links a` | 0.86 rem | 400 | 1.85 |
| Footer column heading | `.footer-col h4` | 0.78 rem | 700 | uppercase, 1px tracking |

**Rule:** every page-level rhythm key is enforced site-wide. If you create a new page, copy the inline `<style>` block from the closest sibling page and only edit the page-specific selectors.

### 3.3 Numbers and Units

- Always include the unit (`px`, `rem`, `em`, `%`, etc.) — never bare numbers.
- Prefer `rem` for typography (1 rem = 16 px on default).
- Prefer `px` for borders, shadows, fixed UI dimensions (logo height, navbar padding).

---

## 4. Layout System

### 4.1 Container

```css
.container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
```

This is the only content-width container. Content never extends edge-to-edge — always inside `.container`.

### 4.2 Section Padding

```css
.section { padding: 80px 0; }
.section-alt { background: var(--white); }   /* alternating section background */
```

Vertical breathing room between sections is **80 px top and bottom**. Don't deviate. Special hero sections have their own rules below.

### 4.3 Page Hero (the navy banner under the navbar)

Three families based on page purpose. Pick one — don't invent new sizes.

| Family | Pages that use it | CSS |
|---|---|---|
| **Directory hero** | News, Products, Clients, Tools, Certifications | `padding: 160px 0 80px; min-height: 420px; display: flex; align-items: center;` |
| **Projects hero** (taller, has stats row) | Projects | `padding: 140px 0 60px; height: 500px; display: flex; align-items: center;` |
| **Clients hero** (slightly shorter, no stats) | Clients | `padding: 140px 0 60px; height: 440px; display: flex; align-items: center;` |
| **Solution sub-page hero** (with photo) | All `/solutions/*.html` pages | `padding: 0; height: 520px; display: flex; align-items: flex-start;` plus a background `<img class="hero-img">` and an overlay |

Background gradient (always): `linear-gradient(135deg, var(--primary) 0%, #1a1e48 100%)`.

Optional decorations (use freely):
- `.page-hero::before` for the orange dot-grid pattern at 4% opacity
- `.page-hero-orb` for a soft orange glow blurred behind the title

### 4.4 Navbar

```css
.navbar { position: fixed; top: 0; width: 100%; z-index: 1000;
          background: rgba(255,255,255,.98); backdrop-filter: blur(20px);
          padding: 12px 0; box-shadow: 0 2px 30px rgba(36,40,94,.1); }
.nav-logo img { height: 44px; }
```

Locked at `padding: 12px 0` and logo height `44 px`. **Never change these on any page** — the navbar must look identical site-wide.

### 4.5 Footer

```css
.footer { background: var(--primary); color: var(--white); padding: 60px 0 0; }
.footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: 56px; margin-bottom: 48px; }
```

Four-column grid with the brand column twice as wide. Bottom strip with copyright is `padding: 20px 0; border-top: 1px solid rgba(255,255,255,.1)`.

### 4.6 Spacing Tokens

| Token | Value |
|---|---|
| Card grid gap | 22 px (default) / 14 px (clients) / 24 px (solutions) |
| Section vertical padding | 80 px |
| Hero top padding | 160 px (directory) / 140 px (projects/clients) |
| Footer top padding | 60 px |
| Footer-grid gap | 56 px |

---

## 5. Components

### 5.1 Buttons

Two visual styles, three sizes.

```html
<a href="..." class="btn btn-primary">Primary action <i class="fas fa-arrow-right"></i></a>
<a href="..." class="btn btn-outline">Secondary action</a>
<a href="..." class="btn btn-outline-white">Use on dark backgrounds</a>
```

- **Primary (orange):** highest-priority action on the page. One per section maximum.
- **Outline (navy on light bg):** secondary action.
- **Outline-white (white on dark bg):** secondary action when sitting on top of a hero/dark background.

All buttons share: `padding: 13px 30px; border-radius: 50px; font-weight: 600;`. Always trailing arrow icon for navigational actions.

### 5.2 Cards

| Variant | Class | Layout |
|---|---|---|
| Project card | `.proj-card` | Image top, overlay on hover with category + title + description. Aspect ratio 4:3. |
| Product card | `.prod-card` | Image (200 px height) + body (icon, name, specs). Border 1px `--border`. |
| News card | `.news-card` | Image (170 px) + meta + title + excerpt. Border 1px `--border`. |
| Client logo card | `.client-card` | 170 × 90 px container, logo `object-fit: contain`. Border 1px `--border`. |
| Solution card | `.solution-card` | Full-bleed image with gradient overlay revealing title on hover. |
| Sub-solution category card | `.cat-card` | Top image (180 px) + body with title, description, "Explore" link. |

All cards: `border-radius: var(--radius-lg)` (20 px), `box-shadow: var(--shadow-md)` at rest, `var(--shadow-lg)` on hover, `transform: translateY(-6px)` on hover.

### 5.3 Sub-Solution Nav Strip

The 4-tab sticky strip below solution sub-page heroes:

```html
<div class="sol-nav">
  <div class="container sol-nav-inner">
    <a href="lighting-solutions.html" class="sol-link">Lighting Solutions</a>
    <a href="low-current-systems.html" class="sol-link">Low Current Systems</a>
    <a href="power-control-systems.html" class="sol-link current">Power & Control Systems</a>
    <a href="fabrication-painting.html" class="sol-link">Fabrication & Painting</a>
  </div>
</div>
```

Sticky at `top: 68px` (just under the navbar). The current page tab gets `.current` (orange-filled pill).

### 5.4 Forms

```css
.field input, .field select, .field textarea {
  padding: 11px 14px; font-size: 0.95rem; border: 1.5px solid var(--border); border-radius: 12px;
}
.field input:focus { border-color: var(--secondary); box-shadow: 0 0 0 3px rgba(246,133,31,.15); }
```

All form fields share these dimensions. Labels are `0.85 rem; font-weight: 600; color: var(--primary);` above the input.

---

## 6. Design Tokens (CSS Variables)

Declared on `:root` of every page. Always reference via `var(--token)`, never hard-code.

| Token | Value |
|---|---|
| `--radius` | 12 px (small UI: pills, inputs, buttons) |
| `--radius-lg` | 20 px (cards) |
| `--radius-xl` | 28 px (hero containers, large feature blocks) |
| `--shadow-md` | `0 8px 30px rgba(36,40,94,.12)` |
| `--shadow-lg` | `0 20px 60px rgba(36,40,94,.18)` |
| `--transition` | `0.3s cubic-bezier(.4, 0, .2, 1)` |

---

## 7. Imagery

### 7.1 File Size Budget

| Asset type | Target file size |
|---|---|
| Hero image (full-width) | < 500 KB JPG, sized 1920 × 1080 max |
| Card image (project / product / news) | < 250 KB JPG, sized 1280 × 960 max |
| Logo (client) | < 50 KB SVG/PNG, transparent background preferred |
| Icon | < 10 KB SVG |

Rules:
- **Always export as JPG quality 82 for photographs** (use `sips -Z 1600 -s format jpeg -s formatOptions 82`).
- PNG only for transparency or graphics with sharp edges.
- WebP optional via `<picture>` with JPG fallback.
- Never ship a >2 MB image. The site has zero of these in the rendered tree.

### 7.2 Aspect Ratios

| Use | Ratio |
|---|---|
| Hero image | 16:9 |
| Project / category card | 4:3 |
| Solution sub-page card | 16:10 |
| Client logo container | 17:9 (170 × 90 px) |
| Product card | 1:1 |

### 7.3 Alt Text

Every `<img>` needs `alt`. If decorative-only, use empty `alt=""` (not missing) — that signals "skip me" to screen readers. Never describe the file format ("logo image", "JPG of building") — describe what the image represents.

### 7.4 Photo Style Guide

For new commissioned photography or AI-generated images:
- Photorealistic, professional commercial photography
- Saudi/Gulf commercial or industrial context
- Clean architectural lines, premium finishes
- Warm neutral palette with subtle metallic accents
- Soft daylight + quality architectural lighting
- **No people / faces / hands** — equipment, installations, environments only
- Sharp focus, balanced exposure, no readable logos or text
- Aspect ratio per the table above

A reusable Gemini/Nano-Banana prompt template lives at `images/SOLUTION_PROMPTS.md`.

---

## 8. Bilingual & RTL

The site is fully bilingual. The Arabic side mirrors the English side 1:1.

- **Document direction:** every AR file declares `<html lang="ar" dir="rtl">`. EN files default to LTR.
- **AR shared navbar:** injected by `/ar/nav.js` reading `<div id="nav-root" data-active="..." data-en="..."></div>`. Update `nav.js` once → every AR page reflects the change.
- **EN navbars:** inline in each HTML file (because each EN page is independently editable for non-developers via the CMS comments at the top of each file).
- **All section anchors** use `index.html#section` (e.g. `#about`, `#projects`, `#clients`) so cross-page navigation always lands on the home page section.

When you add a new EN page:
1. Copy the closest sibling page.
2. Replace content.
3. Mirror it to `/ar/your-page.html` with the AR navbar root + Arabic copy.
4. Add `<link rel="alternate" hreflang="en" href=".../page.html">` and the `hreflang="ar"` counterpart in both files.

---

## 9. Animation

### 9.1 AOS Library (page reveal)

Loaded site-wide via `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/.../aos.css">` and initialized at the bottom of each page:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"></script>
<script>AOS.init({ duration: 700, once: true, offset: 60 });</script>
```

Add `data-aos="fade-up"` to any element you want revealed on scroll, with `data-aos-delay="100"` (or 200, 300) for staggered cascades within a group.

### 9.2 Hero Slideshow

Crossfade transition: **0.55 s ease-in-out**. Each slide stays visible for **2 s**. Hover-to-pause is wired via `mouseenter` / `mouseleave`.

### 9.3 Hover Transitions

Use the `--transition` variable: `transition: var(--transition);` (= `0.3s cubic-bezier(.4, 0, .2, 1)`). Card lift: `transform: translateY(-6px); box-shadow: var(--shadow-lg);` on `:hover`.

---

## 10. Don'ts

- ❌ Don't redeclare design tokens (`--primary`, `--radius`, etc.) with different values on a single page.
- ❌ Don't hard-code colors as hex inside content rules — always use `var(--secondary)`, etc.
- ❌ Don't change navbar padding, logo height, or footer-grid gap "just for one page". They must look identical site-wide.
- ❌ Don't use em-dashes (—) in prose (NLC house style — feels AI-generated). Use periods or commas.
- ❌ Don't use icons beyond Font Awesome 6.5.0 (already loaded site-wide).
- ❌ Don't add new fonts. EN uses Bizmo + Outfit fallback. AR uses Lama Sans. End of list.
- ❌ Don't use centered-text body paragraphs except inside hero CTAs and section headers with `.section-header.center`.
- ❌ Don't ship images larger than 500 KB. Compress.

---

## 11. Quick-Start Checklist for a New Page

1. Copy the nearest sibling page in EN. Save as your new EN file.
2. Replace the content (title, description, body copy, images).
3. Verify the inline `<style>` block didn't grow new selectors. Reuse existing classes.
4. Mirror to `/ar/your-page.html` — change `<html dir>`, swap navbar to nav.js injection, translate copy.
5. Add hreflang alternates to both files.
6. Run a visual diff against the EN sibling: navbar height, hero size, button styles, card grid spacing.
7. Hard-refresh, scroll the page in both EN and AR, confirm parity.

---

**File location:** `/STYLE-GUIDE.md` at the project root. Update this doc whenever a token changes — it's the single source of truth.

**Maintainers:** anyone who adds a page or component is responsible for keeping this guide in sync.
