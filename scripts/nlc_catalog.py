"""Shared helpers for reading the NLC product catalog.

Everything here treats ``products.html`` as the single source of truth for
which products exist and in what order they are browsed. Nothing is hardcoded
so the catalog can grow without the scripts going stale.

Standard library only — no install step.
"""

import re
from collections import namedtuple
from pathlib import Path

# A single catalog card. ``key`` drives the filename, image and datasheet;
# one product may appear in several categories (SLEEK is in post-top and
# high-bay), so keys are not unique across cards.
Card = namedtuple('Card', 'key name cat cat_label')

# A ``.category-block`` section with its cards, in document order.
Category = namedtuple('Category', 'cat label cards')

_BLOCK_START = re.compile(r'<div class="category-block"[^>]*?data-cat="([a-z0-9-]+)"')
_CAT_TITLE = re.compile(r'<h2 class="cat-title">\s*(.*?)\s*</h2>', re.S)
_CARD_START = re.compile(r'<div class="prod-card"[^>]*?data-name="([^"]+)"')
_PROD_NAME = re.compile(r'<div class="prod-name">\s*(.*?)\s*</div>', re.S)


class CatalogError(Exception):
    """Raised when the catalog HTML does not look the way we expect."""


def site_root(start=None):
    """Return the site root — the nearest ancestor holding products.html."""
    here = Path(start or Path(__file__).resolve().parent)
    for candidate in [here, *here.parents]:
        if (candidate / 'products.html').is_file():
            return candidate
    raise CatalogError(
        'Could not locate the site root (no products.html found above %s). '
        'Run this from inside the website directory.' % here
    )


def catalog_path(root, lang='en'):
    """Path to the catalog page for a language."""
    return root / 'products.html' if lang == 'en' else root / 'ar' / 'products.html'


def parse_catalog(path):
    """Parse a catalog page into ``Category`` records, in document order."""
    path = Path(path)
    try:
        html = path.read_text(encoding='utf-8')
    except FileNotFoundError:
        raise CatalogError('Catalog page not found: %s' % path)

    starts = [(m.start(), m.group(1)) for m in _BLOCK_START.finditer(html)]
    if not starts:
        raise CatalogError(
            'No <div class="category-block" data-cat="..."> found in %s — the '
            'catalog markup has changed and these scripts need updating.' % path
        )

    # Each block runs until the next one begins (last one to end of document).
    bounds = [s for s, _ in starts] + [len(html)]
    categories = []
    for i, (_, cat) in enumerate(starts):
        chunk = html[bounds[i]:bounds[i + 1]]
        title = _CAT_TITLE.search(chunk)
        label = title.group(1) if title else cat
        categories.append(Category(cat, label, _parse_cards(chunk, cat, label)))
    return categories


def _parse_cards(chunk, cat, label):
    positions = [(m.start(), m.group(1)) for m in _CARD_START.finditer(chunk)]
    edges = [p for p, _ in positions] + [len(chunk)]
    cards = []
    for i, (_, key) in enumerate(positions):
        body = chunk[edges[i]:edges[i + 1]]
        name = _PROD_NAME.search(body)
        cards.append(Card(key, name.group(1) if name else key.upper(), cat, label))
    return cards


def all_cards(categories):
    """Flatten categories into one card list, in browse order."""
    return [card for category in categories for card in category.cards]


def ordered_keys(categories):
    """Deduplicated product keys in catalog browse order.

    This is the order the prev/next arrows follow. A product listed under two
    categories keeps only its first appearance so the chain stays a simple loop.
    """
    seen = set()
    order = []
    for card in all_cards(categories):
        if card.key not in seen:
            seen.add(card.key)
            order.append(card.key)
    return order


def product_page(root, key, lang='en'):
    """Path to a product detail page."""
    if lang == 'en':
        return root / 'product' / ('%s.html' % key)
    return root / 'ar' / 'product' / ('%s.html' % key)


def read_order_file(root):
    """Read scripts/product_order.txt, ignoring blanks and # comments."""
    path = root / 'scripts' / 'product_order.txt'
    if not path.is_file():
        raise CatalogError(
            'Missing %s — run scripts/gen_product_order.py first.' % path
        )
    keys = []
    for line in path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if line and not line.startswith('#'):
            keys.append(line)
    return keys
