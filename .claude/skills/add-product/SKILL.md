---
name: add-product
description: Add a new product to the NLC catalog end to end. Use when the user asks to add a product, a new SKU, a new luminaire, or a new product page. Covers EN + AR detail pages, both catalog cards, the order list, prev/next arrows, and QA.
---

# Add a Product to the NLC Site

The site is pure static HTML, no build system. Adding one product touches 6+ files. Do ALL steps; a product missing from any one of them is a shipped bug.

## Prerequisites (ask the user if missing)

1. Product photo (will become `images/products/{key}.png`)
2. Datasheet PDF (will become `datasheets/{key}.pdf`)
3. Product key (kebab-case, e.g. `fl-90-pro`), display name, category, wattage/IP/CRI specs, EN + AR descriptions

## The PRODUCT dict

The generator is `tools/build_products.py` (if `tools/` does not exist yet, check `/tmp/build_products.py`; if both are gone, rebuild the generator from an existing `product/*.html` page as template).

```python
{
  'key': 'product-key',          # filename, image, datasheet all derive from this
  'name': 'DISPLAY NAME',
  'cat': 'data-cat-value',       # NEVER change existing data-cat values; they drive filters
  'cat_label': 'EN Category',
  'cat_label_ar': 'AR Category',
  'description': '...', 'description_ar': '...',
  'badges': [('IK','08'), ('IP','65'), ('CRI','80+')],
  'specs': [('Wattage','30W'), ...], 'specs_ar': [('الطاقة','30W'), ...],
  'gallery': ['key', 'key-g2'],  # gallery image keys, suffix -g2, -g3
  'has_datasheet': True,
}
```

Valid `cat` values: indoor, outdoor-downlight, wall-light, emergency, high-bay, track-light, flood-light, projector, street-light, solar, wall-pack, bollard, linear, strip-light, spike, outdoor-collection.

## Steps

1. **Photo:** resize to max 1200x1200 with `PIL.Image.thumbnail((1200,1200), Image.LANCZOS)`. Keep mode RGBA. NEVER convert to RGB; product photos have transparent backgrounds. Save optimized PNG to `images/products/{key}.png`. Gallery shots: `{key}-g2.png`, `{key}-g3.png`.
2. **Datasheet:** place PDF at `datasheets/{key}.pdf`.
3. **Detail pages:** call `build_product(PRODUCT)` to generate `product/{key}.html` and `ar/product/{key}.html`.
4. **Catalog cards:** add the card to BOTH `products.html` and `ar/products.html` under the right category. Card images use `images/products/` in EN and `../images/products/` in AR. Keep the `onerror` lightbulb-icon fallback on card images.
5. **Order list:** insert the key at the right position in `tools/product_order.txt` (or `/tmp/product_order.txt`).
6. **Arrows:** run `inject_prev_next.py` to refresh prev/next arrows on all product pages.

## Image path rules (the #1 source of bugs)

| Page | Main images | Product images |
|---|---|---|
| `product/{key}.html` | `../images/` | `../images/products/` |
| `ar/product/{key}.html` | `../../images/` | `../../images/products/` |
| `products.html` | - | `images/products/` |
| `ar/products.html` | - | `../images/products/` |

## QA before finishing

1. `python test_site.py` from the site root; zero `MISSING_LINK` lines mentioning the new key.
2. Open both detail pages; confirm image, badges, specs, datasheet link, prev/next arrows.
3. Confirm the card appears in both catalogs and the category filter still works.
4. Commit and push.
