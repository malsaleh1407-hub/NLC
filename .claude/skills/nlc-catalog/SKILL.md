---
name: nlc-catalog
description: Add, update, reorder or audit products on the NLC lighting website. Use whenever the task involves a product page, the product catalog (products.html / ar/products.html), product photos or datasheets, prev/next arrows, or the EN/AR product pairs under product/ and ar/product/. Triggers on "add a product", "new product page", "update product photo", "reorder the catalog", "product links are broken", "check the catalog".
---

# NLC product catalog

The catalog is plain static HTML — no build system. `products.html` is the
single source of truth for which products exist and in what order they are
browsed; the scripts read it rather than keeping a separate list.

Every product exists in four places, and all four must stay in step:

| Piece | English | Arabic |
|---|---|---|
| Catalog card | `products.html` | `ar/products.html` |
| Detail page | `product/{key}.html` | `ar/product/{key}.html` |
| Photo | `images/products/{key}.png` | same file, shared |
| Datasheet | `datasheets/{key}.pdf` | same file, shared |

`{key}` is lowercase, dash-separated, and drives the filename, the image name
and the datasheet name. It never changes once published — links and the
sitemap depend on it.

## Scripts

Run from the site root. Standard library only; nothing to install.

| Script | Purpose |
|---|---|
| `scripts/new_product.py` | Add a product — clones detail pages and catalog cards from an existing product |
| `scripts/gen_product_order.py` | Rebuild `scripts/product_order.txt` from catalog order |
| `scripts/inject_prev_next.py` | Inject or refresh the floating prev/next arrows |
| `scripts/check_catalog.py` | Audit for missing pages, photos, orphans, EN/AR drift |

`new_product.py` and `inject_prev_next.py` **preview by default and write
nothing** — pass `--write` to apply. Always read the preview first; the
injector touches every product page.

## Adding a product

1. Drop the photo at `images/products/{key}.png` (1200×1200 max). Keep the
   alpha channel — product shots have transparent backgrounds, so convert to
   `RGBA`, never `RGB`. Datasheet, if any, goes to `datasheets/{key}.pdf`.
2. Write a spec, picking the closest existing product as `template`:
   ```json
   {
     "key": "vega",
     "name": "VEGA",
     "name_ar": "فيغا",
     "cat": "indoor",
     "template": "agile"
   }
   ```
3. `python3 scripts/new_product.py spec.json` — check the preview, then re-run
   with `--write`.
4. **Edit the new pages.** Description, specifications and badges are still the
   template's — this is the step that is easy to forget.
5. `python3 scripts/gen_product_order.py`
6. `python3 scripts/inject_prev_next.py --write`
7. `python3 scripts/check_catalog.py`
8. Add both new URLs to `sitemap.xml`.

Everything is cloned from a product that already exists, so new markup always
matches the current design. If a page's design needs to change, change it on a
real page and clone from that one — do not add a template to the scripts.

## Categories

Category is set by `data-cat` on the card and the enclosing `.category-block`.
**Never change a `data-cat` value to rename a category** — the filter buttons
match on it. Change the visible `<h2 class="cat-title">` and the matching
`.f-btn` label instead. `scripts/check_catalog.py` lists every valid value.

A product may legitimately appear under two categories (SLEEK is under both
post-top and high-bay). The browse order keeps only its first appearance.

## Prev/next arrows

Arrows follow `scripts/product_order.txt` and wrap around from the last product
to the first. The injected block sits between `<!-- nlc:prev-next start -->`
and `<!-- nlc:prev-next end -->` markers, so re-running replaces it rather than
stacking a second set. Positioning uses CSS logical properties, so the arrows
flip automatically on the RTL pages.

Re-run the injector after adding, removing or reordering any product.

## Conventions

- Colors come from CSS variables — `--primary` (#24285e navy) and `--secondary`
  (#F6851F orange). Never hardcode the hex values. Full reference in
  `STYLE-GUIDE.md`.
- EN pages use Bizmo/Outfit; AR pages use Cairo with `direction:rtl`.
- Relative image paths differ by page depth: `product/` pages reach photos at
  `../images/products/`, `ar/product/` pages at `../../images/products/`, and
  `ar/products.html` at `../images/products/`. Cloning handles this — copying
  markup between languages by hand does not.
- PDF links are intercepted site-wide by `js/dl-gate.js`, which gates downloads
  behind a registration modal. A new datasheet needs no wiring; it is picked up
  automatically.
