#!/usr/bin/env python3
"""NLC site auditor. Scans the site tree and writes dashboard-data.js
for dashboard.html (the Site Command Center).

Usage:  python3 site_audit.py            (run from the site root)
        python3 site_audit.py /path/to/site

Checks: broken internal references, SEO health per page (title, meta
description, hreflang, canonical, Open Graph, alt text), EN/AR parity,
sitemap coverage, orphan pages, image weight budget (STYLE-GUIDE.md:
never ship >500 KB), and an overall health score. Pure stdlib.

CI mode:  python3 site_audit.py --max-broken "$(cat .audit-baseline)"
exits 1 when broken references exceed the baseline (ratchet it down
as the site heals).
"""

import json
import os
import re
import sys
from datetime import datetime, timezone

SKIP_DIRS = {'.git', '.claude', 'node_modules', '__pycache__'}
IMAGE_EXT = {'.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.avif', '.ico'}
FONT_EXT = {'.woff', '.woff2', '.ttf', '.otf', '.eot'}
IMG_BUDGET_KB = 500      # STYLE-GUIDE.md section 7.1
IMG_HARD_KB = 2048       # "Never ship a >2 MB image"

REF_RE = re.compile(r'(?:href|src|poster|data-src)\s*=\s*["\']([^"\']+)["\']', re.I)
CSS_URL_RE = re.compile(r'url\(\s*["\']?([^"\')]+)["\']?\s*\)', re.I)
TITLE_RE = re.compile(r'<title>(.*?)</title>', re.I | re.S)
META_DESC_RE = re.compile(r'<meta[^>]+name=["\']description["\'][^>]*>', re.I)
META_ROBOTS_RE = re.compile(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\']([^"\']*)["\']', re.I)
HREFLANG_RE = re.compile(r'<link[^>]+hreflang=["\']([^"\']+)["\']', re.I)
CANONICAL_RE = re.compile(r'<link[^>]+rel=["\']canonical["\']', re.I)
OG_TITLE_RE = re.compile(r'<meta[^>]+property=["\']og:title["\']', re.I)
OG_IMAGE_RE = re.compile(r'<meta[^>]+property=["\']og:image["\']', re.I)
IMG_TAG_RE = re.compile(r'<img\b[^>]*>', re.I)
ALT_RE = re.compile(r'\balt\s*=', re.I)
LANG_AR_RE = re.compile(r'<html[^>]+lang=["\']ar["\']', re.I)


def is_external(ref):
    return ref.startswith(('http://', 'https://', '//', 'mailto:', 'tel:',
                           'data:', 'javascript:', '#', 'whatsapp:', 'sms:',
                           'file:', 'blob:', 'ftp:'))


def is_template(ref):
    return '${' in ref or '{{' in ref or ref.strip() == ''


def classify(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in ('.html', '.htm'):
        return 'page'
    if ext in IMAGE_EXT:
        return 'image'
    if ext in FONT_EXT:
        return 'font'
    if ext == '.css':
        return 'style'
    if ext == '.js':
        return 'script'
    if ext == '.pdf':
        return 'pdf'
    return 'other'


def resolve(ref, page_rel, root):
    """Resolve a reference to a path relative to the site root, or None."""
    ref = ref.split('#')[0].split('?')[0].strip()
    if not ref:
        return None
    if ref.startswith('/'):
        target = ref.lstrip('/')
    else:
        target = os.path.normpath(os.path.join(os.path.dirname(page_rel), ref))
    target = target.replace('\\', '/')
    if target.startswith('..'):
        return None  # escapes the site root; treat as external
    return target


def top_dir(rel):
    rel = rel.lstrip('./')
    return rel.split('/')[0] if '/' in rel else '(root)'


def audit(root):
    pages = []
    broken = []
    ok_refs = 0
    linked = set()  # page targets referenced from at least one other page
    existing = {}   # cache: rel path -> bool

    def exists(rel):
        if rel not in existing:
            existing[rel] = os.path.exists(os.path.join(root, rel))
        return existing[rel]

    html_files = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if fn.lower().endswith(('.html', '.htm')):
                rel = os.path.relpath(os.path.join(dirpath, fn), root).replace('\\', '/')
                if rel == 'dashboard.html':
                    continue  # this tool audits the site, not itself
                html_files.append(rel)
    html_files.sort()

    for rel in html_files:
        full = os.path.join(root, rel)
        try:
            with open(full, encoding='utf-8', errors='replace') as f:
                content = f.read()
        except OSError:
            continue

        refs = set(REF_RE.findall(content)) | set(CSS_URL_RE.findall(content))
        page_broken = 0
        for ref in refs:
            if is_external(ref) or is_template(ref):
                continue
            target = resolve(ref, rel, root)
            if target is None:
                continue
            if target != rel and target.endswith(('.html', '.htm')):
                linked.add(target)
            if exists(target):
                ok_refs += 1
            else:
                page_broken += 1
                broken.append({'source': rel, 'target': target,
                               'type': classify(target), 'dir': top_dir(target)})

        m = TITLE_RE.search(content)
        title = re.sub(r'\s+', ' ', m.group(1)).strip() if m else ''
        imgs = IMG_TAG_RE.findall(content)
        alt_missing = sum(1 for tag in imgs if not ALT_RE.search(tag))
        robots = META_ROBOTS_RE.search(content)
        is_ar = bool(LANG_AR_RE.search(content)) or rel.startswith('ar/')

        pages.append({
            'path': rel,
            'lang': 'ar' if is_ar else 'en',
            'section': top_dir(rel),
            'title': title,
            'hasTitle': bool(title),
            'hasDesc': bool(META_DESC_RE.search(content)),
            'hasHreflang': bool(HREFLANG_RE.search(content)),
            'hasCanonical': bool(CANONICAL_RE.search(content)),
            'hasOg': bool(OG_TITLE_RE.search(content) and OG_IMAGE_RE.search(content)),
            'noindex': bool(robots and 'noindex' in robots.group(1).lower()),
            'imgs': len(imgs),
            'altMissing': alt_missing,
            'brokenRefs': page_broken,
            'sizeKB': round(os.path.getsize(full) / 1024, 1),
        })

    # EN/AR parity (skip admin + internal pages from the expectation)
    exempt = {'admin.html', 'index-option-a.html', 'dashboard.html',
              'NLC-Brand-Guidelines-source.html'}
    en_paths = {p['path'] for p in pages if p['lang'] == 'en' and p['path'] not in exempt}
    ar_paths = {p['path'] for p in pages if p['path'].startswith('ar/')}
    missing_ar = sorted(p for p in en_paths if 'ar/' + p not in ar_paths)
    missing_en = sorted(p for p in ar_paths if p[3:] not in en_paths)

    # Sitemap coverage
    page_paths = {p['path'] for p in pages}
    indexable = {p['path'] for p in pages
                 if not p['noindex'] and p['path'] not in exempt}
    sitemap = {'present': False, 'count': 0, 'missingOnDisk': [], 'notListed': []}
    sm_file = os.path.join(root, 'sitemap.xml')
    if os.path.exists(sm_file):
        sitemap['present'] = True
        with open(sm_file, encoding='utf-8', errors='replace') as f:
            locs = re.findall(r'<loc>\s*([^<\s]+)\s*</loc>', f.read())
        sm_paths = set()
        for loc in locs:
            path = re.sub(r'^https?://[^/]+/?', '', loc.strip())
            path = path or 'index.html'
            sm_paths.add(path)
        sitemap['count'] = len(sm_paths)
        sitemap['missingOnDisk'] = sorted(p for p in sm_paths
                                          if p.endswith(('.html', '.htm')) and p not in page_paths)
        sitemap['notListed'] = sorted(p for p in indexable if p not in sm_paths)

    # Orphan pages: no other page links to them (home page is never an orphan)
    orphans = sorted(p for p in page_paths
                     if p not in linked and p != 'index.html' and p not in exempt)

    # Image weight audit
    images = {'total': 0, 'totalKB': 0, 'overBudget': []}
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if os.path.splitext(fn)[1].lower() in IMAGE_EXT:
                full = os.path.join(dirpath, fn)
                kb = os.path.getsize(full) / 1024
                images['total'] += 1
                images['totalKB'] += kb
                if kb > IMG_BUDGET_KB:
                    rel = os.path.relpath(full, root).replace('\\', '/')
                    images['overBudget'].append({
                        'path': rel, 'kb': round(kb),
                        'severity': 'critical' if kb > IMG_HARD_KB else 'warning'})
    images['totalKB'] = round(images['totalKB'])
    images['overBudget'].sort(key=lambda x: -x['kb'])

    # Aggregates
    by_dir, by_type = {}, {}
    for b in broken:
        by_dir[b['dir']] = by_dir.get(b['dir'], 0) + 1
        by_type[b['type']] = by_type.get(b['type'], 0) + 1
    pages_by_section = {}
    for p in pages:
        pages_by_section[p['section']] = pages_by_section.get(p['section'], 0) + 1

    seo_pages = [p for p in pages if not p['noindex']]
    n_seo = max(len(seo_pages), 1)
    no_title = sum(1 for p in seo_pages if not p['hasTitle'])
    no_desc = sum(1 for p in seo_pages if not p['hasDesc'])
    no_hreflang = sum(1 for p in seo_pages if not p['hasHreflang'])
    total_imgs = sum(p['imgs'] for p in pages)
    total_alt_missing = sum(p['altMissing'] for p in pages)
    parity_expected = len(en_paths)
    parity_pct = round(100 * (parity_expected - len(missing_ar)) / parity_expected) if parity_expected else 100
    alt_pct = round(100 * (total_imgs - total_alt_missing) / total_imgs) if total_imgs else 100

    # Health score: 100 minus capped penalties per problem class
    penalties = {
        'brokenRefs': min(40, round(len(broken) * 0.1, 1)),
        'parity': min(15, round(len(missing_ar) * 1.0, 1)),
        'seoMeta': min(15, round((no_title + no_desc) * 0.5, 1)),
        'hreflang': min(10, round(no_hreflang * 0.25, 1)),
        'altText': min(10, round(total_alt_missing * 0.1, 1)),
        'imgWeight': min(10, len(images['overBudget']) * 2),
        'sitemap': min(5, round((len(sitemap['missingOnDisk'])
                                 + len(sitemap['notListed'])) * 0.05, 1))
                   if sitemap['present'] else 5,
        'orphans': min(5, round(len(orphans) * 0.5, 1)),
    }
    score = max(0, round(100 - sum(penalties.values())))

    # Action items, worst first
    actions = []
    if len(broken) > 100 and by_dir.get('images', 0) + by_dir.get('product', 0) > 50:
        actions.append({'severity': 'critical',
                        'title': f"{len(broken)} referenced files are missing from this tree",
                        'detail': 'Whole folders (images/, product/, ar/, fonts/, ...) appear absent. '
                                  'If this is the Git repo, the upload skipped subdirectories: push the '
                                  'full site tree with git add -A from the site root.'})
    elif broken:
        actions.append({'severity': 'serious',
                        'title': f'{len(broken)} broken internal references',
                        'detail': 'See the Broken References explorer below for the exact source pages and targets.'})
    for img in images['overBudget'][:1]:
        actions.append({'severity': 'serious',
                        'title': f"{len(images['overBudget'])} images exceed the 500 KB budget",
                        'detail': f"Largest: {img['path']} ({img['kb']} KB). STYLE-GUIDE 7.1: JPG quality 82, max 1920px."})
    if missing_ar:
        actions.append({'severity': 'warning',
                        'title': f'{len(missing_ar)} EN pages have no Arabic mirror',
                        'detail': 'The AR side mirrors EN 1:1 (STYLE-GUIDE section 8). See the parity panel.'})
    if no_desc:
        actions.append({'severity': 'warning',
                        'title': f'{no_desc} indexable pages lack a meta description',
                        'detail': 'Search engines will improvise snippets. Add a unique 150-160 char description per page.'})
    if no_hreflang:
        actions.append({'severity': 'warning',
                        'title': f'{no_hreflang} pages lack hreflang alternates',
                        'detail': 'Both EN and AR files need <link rel="alternate" hreflang> pairs (STYLE-GUIDE section 8).'})
    if sitemap['present'] and sitemap['missingOnDisk']:
        actions.append({'severity': 'warning',
                        'title': f"sitemap.xml promises {len(sitemap['missingOnDisk'])} pages that do not exist here",
                        'detail': 'Crawlers hitting those URLs get 404s, which hurts crawl trust. '
                                  'Either add the files or prune the sitemap. See Search visibility below.'})
    if sitemap['present'] and sitemap['notListed']:
        actions.append({'severity': 'warning',
                        'title': f"{len(sitemap['notListed'])} indexable pages are not in sitemap.xml",
                        'detail': 'They can still be crawled via links, but listing them speeds discovery.'})
    if not sitemap['present']:
        actions.append({'severity': 'warning',
                        'title': 'No sitemap.xml at the site root',
                        'detail': 'robots.txt advertises one; generate it so search engines can discover all pages.'})
    if orphans:
        actions.append({'severity': 'warning',
                        'title': f'{len(orphans)} pages are orphaned (no page links to them)',
                        'detail': 'Visitors can only reach them by typing the URL. Link them from a nav, footer or index.'})
    if total_alt_missing:
        actions.append({'severity': 'warning',
                        'title': f'{total_alt_missing} <img> tags have no alt attribute',
                        'detail': 'Decorative images should carry alt="" (empty, not absent) per STYLE-GUIDE 7.3.'})
    if not actions:
        actions.append({'severity': 'good', 'title': 'No outstanding issues found',
                        'detail': 'All references resolve, SEO metadata is present, and images are within budget.'})

    return {
        'generated': datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),
        'root': os.path.basename(os.path.abspath(root)) or root,
        'score': score,
        'penalties': penalties,
        'summary': {
            'totalPages': len(pages),
            'enPages': sum(1 for p in pages if p['lang'] == 'en'),
            'arPages': sum(1 for p in pages if p['lang'] == 'ar'),
            'refsChecked': ok_refs + len(broken),
            'brokenRefs': len(broken),
            'parityPct': parity_pct,
            'altPct': alt_pct,
            'noTitle': no_title,
            'noDesc': no_desc,
            'noHreflang': no_hreflang,
            'seoIssuePages': sum(1 for p in seo_pages
                                 if not (p['hasTitle'] and p['hasDesc'] and p['hasHreflang'])),
            'imgTotal': images['total'],
            'imgTotalKB': images['totalKB'],
            'imgOverBudget': len(images['overBudget']),
        },
        'missingByDir': dict(sorted(by_dir.items(), key=lambda kv: -kv[1])),
        'missingByType': dict(sorted(by_type.items(), key=lambda kv: -kv[1])),
        'pagesBySection': dict(sorted(pages_by_section.items(), key=lambda kv: -kv[1])),
        'actions': actions,
        'parity': {'missingAr': missing_ar, 'missingEn': missing_en,
                   'expected': parity_expected},
        'sitemap': sitemap,
        'orphans': orphans,
        'images': images,
        'pages': pages,
        'brokenRefs': broken,
    }


def main():
    args = sys.argv[1:]
    max_broken = None
    if '--max-broken' in args:
        i = args.index('--max-broken')
        max_broken = int(args[i + 1])
        del args[i:i + 2]
    root = args[0] if args else '.'
    data = audit(root)
    out = os.path.join(root, 'dashboard-data.js')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('/* Generated by site_audit.py, %s. Do not edit by hand. */\n'
                % data['generated'])
        f.write('window.NLC_AUDIT = ')
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')

    s = data['summary']
    print(f"NLC site audit, {data['generated']}")
    print(f"  Health score:      {data['score']}/100")
    print(f"  Pages scanned:     {s['totalPages']} ({s['enPages']} EN / {s['arPages']} AR)")
    print(f"  References:        {s['refsChecked']} checked, {s['brokenRefs']} broken")
    print(f"  EN->AR parity:     {s['parityPct']}%")
    print(f"  Alt-text coverage: {s['altPct']}% ({sum(p['altMissing'] for p in data['pages'])} missing)")
    print(f"  SEO issue pages:   {s['seoIssuePages']}")
    print(f"  Images:            {s['imgTotal']} files, {s['imgTotalKB']} KB total, "
          f"{s['imgOverBudget']} over 500 KB budget")
    sm = data['sitemap']
    if sm['present']:
        print(f"  Sitemap:           {sm['count']} URLs, {len(sm['missingOnDisk'])} missing on disk, "
              f"{len(sm['notListed'])} pages not listed")
    else:
        print("  Sitemap:           sitemap.xml not found")
    print(f"  Orphan pages:      {len(data['orphans'])}")
    print(f"  Wrote {out}")
    print("  Open dashboard.html in a browser to explore.")

    if max_broken is not None:
        n = s['brokenRefs']
        if n > max_broken:
            print(f"\nFAIL: {n} broken references exceed the baseline of {max_broken}.")
            print("Fix the new breakage, or raise .audit-baseline if intentional.")
            sys.exit(1)
        if n < max_broken:
            print(f"\nBaseline can ratchet down: .audit-baseline is {max_broken}, actual is {n}.")
        print("Baseline check passed.")


if __name__ == '__main__':
    main()
