"""Add a new product: detail pages (EN + AR) and catalog cards.

Rather than generating markup from a template baked into this file, everything
is cloned from a product that already exists and then has its identifiers
swapped. The design of a new page therefore always matches the rest of the
site, and this script never needs updating when the page design changes.

Give it a JSON spec:

    {
      "key": "vega",
      "name": "VEGA",
      "name_ar": "فيغا",
      "cat": "indoor",
      "template": "agile"
    }

``template`` is the product to clone — pick the closest existing one, ideally
from the same category. ``name_ar`` is optional and defaults to ``name``.

    python3 scripts/new_product.py spec.json           # preview, writes nothing
    python3 scripts/new_product.py spec.json --write

Text that is specific to the product — description, specs, badges — is left as
the template's and must be edited afterwards. The script prints the file paths
so you know what to open. It never overwrites an existing product.
"""

import json
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

KEY_RE = re.compile(r'^[a-z0-9][a-z0-9.-]*$')
REQUIRED = ('key', 'name', 'cat', 'template')


def load_spec(path):
    try:
        spec = json.loads(open(path, encoding='utf-8').read())
    except (OSError, ValueError) as exc:
        raise CatalogError('Could not read spec %s: %s' % (path, exc))

    missing = [f for f in REQUIRED if not spec.get(f)]
    if missing:
        raise CatalogError('Spec is missing required field(s): %s' % ', '.join(missing))
    if not KEY_RE.match(spec['key']):
        raise CatalogError(
            'Invalid key %r — use lowercase letters, digits, dots and dashes '
            '(it becomes the filename, image name and datasheet name).' % spec['key']
        )
    spec.setdefault('name_ar', spec['name'])
    return spec


def find_card(cards, key):
    for card in cards:
        if card.key == key:
            return card
    return None


def clone_card(card_html, src, spec, name_field):
    """Swap a cloned card's identifiers over to the new product."""
    out = card_html
    out = out.replace('data-name="%s"' % src.key, 'data-name="%s"' % spec['key'])
    out = re.sub(r'(products/)%s(\.[a-zA-Z0-9]+)' % re.escape(src.key),
                 lambda m: m.group(1) + spec['key'] + m.group(2), out)
    out = re.sub(r'(product/)%s(\.html)' % re.escape(src.key),
                 lambda m: m.group(1) + spec['key'] + m.group(2), out)
    out = out.replace('alt="%s"' % src.name, 'alt="%s"' % spec[name_field])
    out = out.replace('<div class="prod-name">%s</div>' % src.name,
                      '<div class="prod-name">%s</div>' % spec[name_field])
    return out


def insert_card(root, lang, spec, name_field):
    """Return (path, new_html, note) for a catalog with the card added."""
    path = catalog_path(root, lang)
    if not path.is_file():
        return None, None, 'skipped — %s not present' % path.name

    html = path.read_text(encoding='utf-8')
    cards = all_cards(parse_catalog(path))

    if find_card(cards, spec['key']):
        return path, None, 'already has a card for %s' % spec['key']

    # Clone the last card in the target category so the markup — including the
    # language-specific image paths — matches exactly.
    in_cat = [c for c in cards if c.cat == spec['cat']]
    if not in_cat:
        raise CatalogError(
            'No category "%s" in %s. Existing: %s'
            % (spec['cat'], path.name, ', '.join(sorted({c.cat for c in cards})))
        )
    anchor = in_cat[-1]

    marker = '<div class="prod-card" data-name="%s"' % anchor.key
    start = html.find(marker)
    if start == -1:
        raise CatalogError('Could not locate the %s card in %s.' % (anchor.key, path.name))
    end = html.find('</div>', html.find('class="prod-view"', start))
    if end == -1:
        raise CatalogError('Could not find the end of the %s card in %s.'
                           % (anchor.key, path.name))
    end += len('</div>')

    block = html[start:end]
    indent = re.search(r'([ \t]*)$', html[:start]).group(1)
    new_card = clone_card(block, anchor, spec, name_field)
    return path, html[:end] + '\n' + indent + new_card + html[end:], \
        'card added after %s in "%s"' % (anchor.key, spec['cat'])


def clone_page(root, lang, spec):
    """Return (path, new_html, note) for a cloned product detail page."""
    source = product_page(root, spec['template'], lang)
    target = product_page(root, spec['key'], lang)

    if not source.is_file():
        return target, None, 'skipped — template page %s not present' % source
    if target.exists():
        return target, None, 'refused — %s already exists' % target.name

    html = source.read_text(encoding='utf-8')
    src_name = {c.key: c.name for c in all_cards(parse_catalog(catalog_path(root, lang)))} \
        .get(spec['template'], spec['template'].upper())
    name = spec['name_ar'] if lang == 'ar' else spec['name']

    # Identifiers first, then the display name. Word boundaries keep a short
    # key from matching inside a longer one.
    html = re.sub(r'\b%s\b' % re.escape(spec['template']), spec['key'], html)
    html = re.sub(r'\b%s\b' % re.escape(src_name), name, html)
    return target, html, 'cloned from %s' % source.name


def main(argv):
    if not argv or argv[0].startswith('-'):
        print(__doc__)
        return 2

    write = '--write' in argv
    root = site_root()
    spec = load_spec(argv[0])

    if find_card(all_cards(parse_catalog(catalog_path(root, 'en'))), spec['key']):
        raise CatalogError('Product "%s" is already in the catalog.' % spec['key'])

    actions = []
    for lang, field in (('en', 'name'), ('ar', 'name_ar')):
        actions.append(insert_card(root, lang, spec, field))
        actions.append(clone_page(root, lang, spec))

    print('Product: %s (%s) in category "%s"\n' % (spec['name'], spec['key'], spec['cat']))
    for path, content, note in actions:
        label = path.relative_to(root) if path else '-'
        print('  %-34s %s' % (label, note))
        if write and content is not None:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding='utf-8')

    print('\nAlso needed:')
    print('  images/products/%s.png       product photo, 1200x1200 max, keep transparency'
          % spec['key'])
    print('  datasheets/%s.pdf            if the product has one' % spec['key'])
    if write:
        print('\nWritten. Next:')
        print('  1. Edit the new pages — description, specs and badges are still '
              'the template\'s.')
        print('  2. python3 scripts/gen_product_order.py')
        print('  3. python3 scripts/inject_prev_next.py --write')
        print('  4. python3 scripts/check_catalog.py')
    else:
        print('\nDry run — nothing written. Re-run with --write to apply.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main(sys.argv[1:]))
    except CatalogError as exc:
        print('error: %s' % exc, file=sys.stderr)
        sys.exit(2)
