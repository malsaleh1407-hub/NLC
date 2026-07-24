"""Check the product catalog for the mistakes that are easy to make by hand.

Reports, without changing anything:

  * cards whose product page is missing (a dead "view product" link)
  * cards whose photo or datasheet is missing
  * products present in one language's catalog but not the other
  * products with a page on disk but no card in the catalog (orphans)
  * products missing from sitemap.xml
  * the same product listed under more than one category

Checks are skipped rather than failed when the directory they need is absent,
so this stays usable on a partial checkout.

    python3 scripts/check_catalog.py            # report
    python3 scripts/check_catalog.py --strict   # exit 1 if anything is wrong
"""

import re
import sys

from nlc_catalog import (
    CatalogError,
    all_cards,
    catalog_path,
    parse_catalog,
    product_page,
    site_root,
)


def _report(title, items, notes=None):
    """Print a finding block. Returns the number of problems."""
    if not items:
        return 0
    print('\n%s (%d)' % (title, len(items)))
    for item in items:
        print('  - %s' % item)
    if notes:
        print('  %s' % notes)
    return len(items)


def check(root, strict=False):
    problems = 0
    skipped = []

    categories = parse_catalog(catalog_path(root, 'en'))
    cards = all_cards(categories)
    keys = []
    for card in cards:
        if card.key not in keys:
            keys.append(card.key)
    print('Catalog: %d categories, %d cards, %d unique products.'
          % (len(categories), len(cards), len(keys)))

    # Same product under several categories. Legitimate, but worth surfacing
    # because it is equally often a copy/paste slip.
    homes = {}
    for card in cards:
        homes.setdefault(card.key, []).append(card.cat)
    multi = ['%s -> %s' % (k, ', '.join(v)) for k, v in homes.items() if len(v) > 1]
    _report('Listed under multiple categories', multi,
            'Intentional for some products; the browse order keeps the first.')

    # Missing detail pages, photos, datasheets.
    for lang in ('en', 'ar'):
        page_dir = product_page(root, 'x', lang).parent
        if not page_dir.is_dir():
            skipped.append('%s product pages (%s not present)'
                           % (lang.upper(), page_dir.relative_to(root)))
            continue
        missing = [k for k in keys if not product_page(root, k, lang).is_file()]
        problems += _report('%s product pages missing' % lang.upper(), missing)

    images = root / 'images' / 'products'
    if images.is_dir():
        missing = [k for k in keys if not any(
            (images / ('%s%s' % (k, ext))).is_file()
            for ext in ('.png', '.jpg', '.jpeg', '.webp'))]
        problems += _report('Product photos missing', missing)
    else:
        skipped.append('product photos (images/products not present)')

    sheets = root / 'datasheets'
    if sheets.is_dir():
        missing = [k for k in keys if not (sheets / ('%s.pdf' % k)).is_file()]
        _report('Datasheets missing', missing,
                'Only a problem for products that should have one.')
    else:
        skipped.append('datasheets (datasheets/ not present)')

    # Orphan pages: a file on disk that nothing links to from the catalog.
    en_dir = product_page(root, 'x', 'en').parent
    if en_dir.is_dir():
        on_disk = {p.stem for p in en_dir.glob('*.html')}
        problems += _report('Pages with no catalog card', sorted(on_disk - set(keys)))

    # Arabic catalog parity.
    ar_catalog = catalog_path(root, 'ar')
    if ar_catalog.is_file():
        ar_keys = {c.key for c in all_cards(parse_catalog(ar_catalog))}
        problems += _report('In EN catalog but not AR', sorted(set(keys) - ar_keys))
        problems += _report('In AR catalog but not EN', sorted(ar_keys - set(keys)))
    else:
        skipped.append('Arabic catalog parity (ar/products.html not present)')

    # Sitemap coverage.
    sitemap = root / 'sitemap.xml'
    if sitemap.is_file():
        listed = set(re.findall(r'/product/([A-Za-z0-9._-]+)\.html',
                                sitemap.read_text(encoding='utf-8')))
        problems += _report('Missing from sitemap.xml', sorted(set(keys) - listed))
    else:
        skipped.append('sitemap coverage (sitemap.xml not present)')

    if skipped:
        print('\nSkipped %d check(s) — not available in this checkout:' % len(skipped))
        for item in skipped:
            print('  - %s' % item)

    if problems:
        print('\n%d problem(s) found.' % problems)
        return 1 if strict else 0
    print('\nNo problems found.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(check(site_root(), strict='--strict' in sys.argv[1:]))
    except CatalogError as exc:
        print('error: %s' % exc, file=sys.stderr)
        sys.exit(2)
