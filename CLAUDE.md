# NLC Website — Claude Context

**National Lighting Company** static website.
Path: `/Users/mohammedalsaleh/Documents/Claude/Projects/Website`

---

## Site Structure

```
Website/
  products.html          ← EN product catalog (156 products)
  ar/products.html       ← AR product catalog (same 156 products, RTL)
  product/{key}.html     ← EN product detail pages
  ar/product/{key}.html  ← AR product detail pages
  images/products/       ← All product photos (PNG, ~1200×1200)
  images/logo/           ← logo-blue.svg, logo-white.svg
  datasheets/            ← All product PDFs
  index.html             ← EN home page
  ar/index.html          ← AR home page
```

---

## Key Conventions

### CSS Variables
```css
--primary: #24285e     /* navy */
--secondary: #F6851F   /* orange */
```

### Fonts
- EN pages: `Bizmo`, `Outfit`
- AR pages: `Cairo` (RTL, `direction:rtl; text-align:right`)

### Image Path Rules
| Page location            | Main image path       | Product images path        |
|--------------------------|-----------------------|----------------------------|
| `product/{key}.html`     | `../images/`          | `../images/products/`      |
| `ar/product/{key}.html`  | `../../images/`       | `../../images/products/`   |
| `products.html`          | —                     | `images/products/`         |
| `ar/products.html`       | —                     | `../images/products/`      |

---

## Product Catalog Categories

In catalog order. Run `python3 scripts/check_catalog.py` for the live list —
that reads `products.html`, so it can never go stale the way this table can.

| data-cat value | EN Label        | | data-cat value | EN Label      |
|----------------|-----------------|-|----------------|---------------|
| indoor         | Downlight       | | high-bay       | High Bay      |
| panel          | Panels          | | flood-light    | Flood Light   |
| track-light    | Tracking System | | projector      | Projector     |
| linear         | Linear Light    | | street-light   | Street Light  |
| strip-light    | Flexibles       | | solar          | Solar         |
| pendant        | Pendant         | | underwater     | Under Water   |
| block-heads    | Bulkhead        | | in-ground      | In-Ground     |
| wall-light     | Wall Light      | | marco-system   | Marco System  |
| wall-pack      | Wall Pack       | | emergency      | Emergency     |
| bollard        | Bollard         | | canopy         | Canopy        |
| spike          | Spike           | | stadium        | Stadium Light |
| post-top       | Post Top        | |                |               |

**Note:** `data-cat` value is never changed when renaming a category label (keeps filters working).
Rename the `<h2 class="cat-title">` and the matching `.f-btn` label instead.

A product may appear under two categories (SLEEK is under both `post-top` and
`high-bay`). The browse order keeps only its first appearance.

---

## Product Pages

New pages are **cloned from an existing product**, not generated from a
template stored in a script. Pick the closest existing product, clone it, then
edit the text. New markup therefore always matches the current design, and the
tooling never needs updating when the page design changes.

If a page's design needs to change, change it on a real page and clone from
that one afterwards.

---

## Adding a New Product

Full walkthrough in `.claude/skills/nlc-catalog/SKILL.md`. Short version:

1. Add photo to `images/products/{key}.png` (1200×1200 max, keep transparency)
   and datasheet to `datasheets/{key}.pdf`
2. Write a spec: `{"key","name","name_ar","cat","template"}` where `template`
   is the existing product to clone
3. `python3 scripts/new_product.py spec.json` → preview, then `--write`
4. **Edit the new pages** — description, specs and badges are still the
   template's
5. `python3 scripts/gen_product_order.py`
6. `python3 scripts/inject_prev_next.py --write`
7. `python3 scripts/check_catalog.py` and add both URLs to `sitemap.xml`

`new_product.py` and `inject_prev_next.py` preview by default and write nothing
until passed `--write`.

---

## Updating a Product Photo

```python
from PIL import Image
img = Image.open('/path/to/new-photo.png')
img.thumbnail((1200, 1200), Image.LANCZOS)
if img.mode != 'RGBA':
    img = img.convert('RGBA')
# IMPORTANT: do NOT convert to RGB — product photos have transparent backgrounds
img.save('images/products/{key}.png', 'PNG', optimize=True)   # run from the site root
```

Gallery photos use suffix `-g2`, `-g3`, etc.: `images/products/{key}-g2.png`

---

## Prev/Next Navigation

All product pages carry floating prev/next arrows (CSS logical properties —
auto-RTL flip). The chain follows catalog order and wraps from the last product
back to the first.

- Order list: `scripts/product_order.txt` — generated, do not hand-edit
- Injection script: `scripts/inject_prev_next.py`
- The block sits between `<!-- nlc:prev-next start -->` / `<!-- ... end -->`
  markers, so re-running replaces it instead of stacking a second set
- Re-run after adding, removing or reordering any product

---

## Key Scripts (in `scripts/`)

Committed to the repo, standard library only. Earlier versions of these lived
in `/tmp` and were lost whenever the machine or session reset.

| Script                    | Purpose                                              |
|---------------------------|------------------------------------------------------|
| `new_product.py`          | Adds a product — clones pages + catalog cards        |
| `gen_product_order.py`    | Rebuilds `product_order.txt` from catalog order      |
| `inject_prev_next.py`     | Injects/refreshes prev/next arrows on all pages      |
| `check_catalog.py`        | Audits missing pages, photos, orphans, EN/AR drift   |
| `nlc_catalog.py`          | Shared catalog parsing used by the above             |
| `product_order.txt`       | Generated browse order (156 products)                |

`products.html` is the single source of truth — the scripts read it rather than
keeping a parallel list, so the catalog and the tooling cannot drift apart.

---

## Notes

- **No build system** — pure static HTML/CSS/JS, edit files directly
- **The git repo holds only the top-level pages.** `product/`, `ar/`,
  `images/`, `datasheets/` and `js/` exist on the local machine but are not
  committed, so a cloud session sees `products.html` without the pages it links
  to. `scripts/check_catalog.py` skips the checks it cannot run and says which.
  Committing those directories would let any session work on product pages.
- Gallery markup: `.pd-gallery > .gal-main` (new template) — thumbnail strips were removed from all pages
- `onerror` on catalog card images: falls back to lightbulb icon placeholder
- All product image URLs were localized — no CDN references remain on product pages
- Legacy products (AR-05, DL-01, DL-03, etc.) were added from scanned PDF datasheets

---

## Download Registration Gate

`js/dl-gate.js` (v1.1) — injected before `</body>` in all 286 pages.

**How it works:**
- Intercepts every `.pdf` link click site-wide
- Shows a bilingual modal (auto-detects `lang="ar"` on `<html>`)
- If visitor already registered (localStorage, 30-day expiry) → immediate download, no modal
- Submits JSON to base44 NLC Portal → creates `PortalUser` with `status: "pending"`
- On success: saves registration to `localStorage` key `nlc_gate_v1`

**Backend:** Formsubmit.co (`https://formsubmit.co/ajax/info@nlc.com.sa`)
- Zero setup — no account, no API key. Just works.
- One-time activation: first submission triggers a "Confirm Subscription" email to info@nlc.com.sa → click Confirm once
- POST JSON: `{_subject, _captcha:"false", name, email, company, phone, job_title, country, intent_file, language}`
- Returns: `{success: "true"}` (string, handled in code)
- Sends email notification directly to info@nlc.com.sa on every submission
- NLC Portal (base44) for manual admin CRM tracking: `https://app.base44.com/apps/69e8ad990381aca490de6cb7/editor/preview`

**Admin panel:** `admin/index.html` (password: `nlc2025admin`)
- Topbar links: NLC Portal (live app) + Registrations DB (base44 editor)
- Send Approval tab: fills Name/Email/File/Link → generates bilingual mailto
- Datasheet Links tab: copy any PDF URL for approval emails
- How It Works tab: end-to-end flow docs

**base44 NLC Portal entities:**
| Entity | Purpose |
|--------|---------|
| `PortalUser` | Each registration (status: pending/approved/rejected/blocked) |
| `BlockedDomain` | Competitor domains auto-rejected (e.g. competitor.com) |
| `Document` | Catalog of managed documents |
| `DownloadLog` | Tracks completed downloads |
