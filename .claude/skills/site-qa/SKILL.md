---
name: site-qa
description: Run the NLC site QA sweep. Use before any deploy, after adding products or pages, or when the user asks to check the site, find broken links, or verify EN/AR parity.
---

# NLC Site QA Sweep

Run from the site root. All checks must pass before deploy.

## 1. Broken internal links

```bash
python test_site.py     # machine-readable: MISSING_LINK|file|path
python check_links.py   # human-readable variant, HTML only
```

Zero `MISSING_LINK` lines is the bar. When fixing, consult the image path rules:

| Page | Main images | Product images |
|---|---|---|
| `product/{key}.html` | `../images/` | `../images/products/` |
| `ar/product/{key}.html` | `../../images/` | `../../images/products/` |
| `products.html` | - | `images/products/` |
| `ar/products.html` | - | `../images/products/` |

Known safe to ignore: links into directories that intentionally live outside the repo snapshot (report them to the user instead of "fixing" them).

## 2. Image budget (STYLE-GUIDE rule: nothing over 500 KB)

```bash
find images -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' \) -size +500k
```

Anything listed: recompress (JPG q82 via sips/PIL, PNG optimize) and re-check. Never convert product PNGs to RGB; they need transparency.

## 3. EN/AR parity spot check

Pick 3 changed EN pages. For each, confirm the `/ar/` mirror exists, has `dir="rtl"`, the nav.js root div, translated copy, and both hreflang alternates.

## 4. Report

Summarize as: links (count broken, list), images over budget (list), parity (pass/fail per page). If everything passes say so plainly; the user deploys on this signal.
