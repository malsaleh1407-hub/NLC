# NLC Website — Claude Context

**National Lighting Company** static website.
Path: `/Users/mohammedalsaleh/Documents/Claude/Projects/Website`

---

## Site Structure

```
Website/
  products.html          ← EN product catalog (142 products)
  ar/products.html       ← AR product catalog (same 142 products, RTL)
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

| data-cat value       | EN Label              |
|----------------------|-----------------------|
| indoor               | Indoor / Downlight    |
| outdoor-downlight    | Outdoor Service Light |
| wall-light           | Wall Light            |
| emergency            | Emergency             |
| high-bay             | High Bay              |
| track-light          | Track Light           |
| flood-light          | Flood Light           |
| projector            | Projector             |
| street-light         | Street Light          |
| solar                | Solar                 |
| wall-pack            | Wall Pack             |
| bollard              | Bollard               |
| linear               | Linear Light          |
| strip-light          | Strip Light           |
| spike                | Spike                 |
| outdoor-collection   | Outdoor Collection    |

**Note:** `data-cat` value is never changed when renaming a category label (keeps filters working).

---

## Product Pages Template

The core builder is `/tmp/build_products.py` — `build_product(PRODUCT)` generates both EN + AR pages.

Each `PRODUCT` dict contains:
```python
{
  'key': 'product-key',          # used for filename, image, datasheet
  'name': 'DISPLAY NAME',
  'cat': 'data-cat-value',
  'cat_label': 'EN Category',
  'cat_label_ar': 'AR Category',
  'description': 'EN description...',
  'description_ar': 'AR description...',
  'badges': [('IK', '08'), ('IP', '65'), ('CRI', '80+')],
  'specs': [('Wattage', '30W'), ...],
  'specs_ar': [('الطاقة', '30W'), ...],
  'gallery': ['key', 'key-g2', 'key-g3'],   # keys for gallery images
  'has_datasheet': True,
}
```

---

## Adding a New Product

1. Add product photo to `images/products/{key}.png` (1200×1200 max)
2. Add datasheet PDF to `datasheets/{key}.pdf`
3. Define the `PRODUCT` dict and call `build_product(PRODUCT)` from `/tmp/build_products.py`
4. Add catalog card to both `products.html` and `ar/products.html` using `add_to_cat()` pattern
5. Add to `/tmp/product_order.txt` in the correct position
6. Run `/tmp/inject_prev_next.py` to update all prev/next arrows

---

## Updating a Product Photo

```python
from PIL import Image
img = Image.open('/path/to/new-photo.png')
img.thumbnail((1200, 1200), Image.LANCZOS)
if img.mode != 'RGBA':
    img = img.convert('RGBA')
# IMPORTANT: do NOT convert to RGB — product photos have transparent backgrounds
img.save('/Users/mohammedalsaleh/Documents/Claude/Projects/Website/images/products/{key}.png', 'PNG', optimize=True)
```

Gallery photos use suffix `-g2`, `-g3`, etc.: `images/products/{key}-g2.png`

---

## Prev/Next Navigation

All 142 product pages have floating prev/next arrows (CSS logical properties — auto-RTL flip).

- Order list: `/tmp/product_order.txt` (141 entries)
- Injection script: `/tmp/inject_prev_next.py`
- Re-run after adding new products to update arrows

---

## Key Scripts (in /tmp)

| Script                    | Purpose                                          |
|---------------------------|--------------------------------------------------|
| `build_products.py`       | Core product page builder (EN + AR)              |
| `inject_prev_next.py`     | Injects prev/next arrows into all product pages  |
| `product_order.txt`       | Ordered list of all product keys                 |
| `add_legacy_catalog.py`   | Added 18 legacy products to both catalogs        |
| `catalog_reorg.py`        | Created Projector category, moved cards          |
| `inject_full.py`          | Scans gallery images, injects pd-gallery markup  |
| `spec_legacy.py`          | Built 18 legacy product pages from scanned PDFs  |

---

## Notes

- **No build system** — pure static HTML/CSS/JS, edit files directly
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
