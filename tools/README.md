# tools/ - the NLC product toolchain

This folder is the permanent home for the build scripts that currently live in `/tmp` on the Mac. **macOS wipes `/tmp` periodically and on some reboots.** Until these files are copied here and pushed, the entire 142-product page generator is one reboot away from being lost.

## Rescue steps (run on the Mac, 15 minutes)

```bash
cd /Users/mohammedalsaleh/Documents/Claude/Projects/Website
mkdir -p tools
cp /tmp/build_products.py    tools/ 2>/dev/null || echo "MISSING: build_products.py"
cp /tmp/inject_prev_next.py  tools/ 2>/dev/null || echo "MISSING: inject_prev_next.py"
cp /tmp/product_order.txt    tools/ 2>/dev/null || echo "MISSING: product_order.txt"
cp /tmp/add_legacy_catalog.py tools/ 2>/dev/null || echo "MISSING: add_legacy_catalog.py"
cp /tmp/catalog_reorg.py     tools/ 2>/dev/null || echo "MISSING: catalog_reorg.py"
cp /tmp/inject_full.py       tools/ 2>/dev/null || echo "MISSING: inject_full.py"
cp /tmp/spec_legacy.py       tools/ 2>/dev/null || echo "MISSING: spec_legacy.py"
ls -la tools/
git add tools && git commit -m "Rescue product toolchain from /tmp" && git push
```

Then:

1. Update any `/tmp/` paths inside the scripts to `tools/`.
2. Update the "Key Scripts (in /tmp)" section of `CLAUDE.md` to point at `tools/`.
3. Also move the root-level one-off scripts here to keep the site root clean: `check_links.py`, `check_links_exhaustive.py`, `fix_all.py`, `fix_ar_paths.py`, `fix_remaining.py` (keep `test_site.py` at root; CI runs it from there).

## If a script is already gone

Tell Claude in the next session. `build_products.py` can be rebuilt from the PRODUCT dict spec in `CLAUDE.md` plus one existing `product/*.html` page as the template; `product_order.txt` can be reconstructed from the prev/next links already injected in the 142 product pages.

## Expected contents when complete

| File | Purpose |
|---|---|
| `build_products.py` | Generates EN + AR product detail pages from a PRODUCT dict |
| `inject_prev_next.py` | Injects prev/next arrows into all product pages |
| `product_order.txt` | Ordered list of all product keys (drives the arrows) |
| `add_legacy_catalog.py` | Added 18 legacy products to both catalogs |
| `catalog_reorg.py` | Category reorganization helper |
| `inject_full.py` | Scans gallery images, injects pd-gallery markup |
| `spec_legacy.py` | Built legacy product pages from scanned PDFs |
