#!/usr/bin/env python3
"""NLC site auditor. Audits either a local site folder or the live
website and writes the data file that dashboard.html (the Site Command
Center) displays.

Usage:  python3 site_audit.py                  audit the folder you are in
        python3 site_audit.py /path/to/site    audit another folder
        python3 site_audit.py --url https://nlc.com.sa
                                               crawl and audit the live site

Folder mode writes dashboard-data.js; live mode writes
dashboard-live-data.js. --out PATH overrides the output file.

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
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlparse
from urllib.request import Request, urlopen

SKIP_DIRS = {'.git', '.claude', 'node_modules', '__pycache__'}
IMAGE_EXT = {'.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.avif', '.ico'}
FONT_EXT = {'.woff', '.woff2', '.ttf', '.otf', '.eot'}
IMG_BUDGET_KB = 500      # STYLE-GUIDE.md section 7.1
IMG_HARD_KB = 2048       # "Never ship a >2 MB image"
USER_AGENT = 'NLC-SiteAudit/1.0 (+site_audit.py)'

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
GA_ID_RE = re.compile(r'\b(G-[A-Z0-9]{6,12}|GTM-[A-Z0-9]{5,9})\b')
GA_TAG_RE = re.compile(r'googletagmanager\.com/(?:gtag/js|gtm\.js)', re.I)


def analytics_tag(content):
    """'ok' with a real GA4/GTM id, 'placeholder' when the snippet was never filled in, else 'missing'."""
    if GA_ID_RE.search(content):
        return 'ok'
    return 'placeholder' if GA_TAG_RE.search(content) else 'missing'
SITEMAP_LOC_RE = re.compile(r'<loc>\s*([^<\s]+)\s*</loc>')

# Internal or draft pages that are not expected to have an AR mirror,
# a sitemap entry, or inbound links.
EXEMPT = {'admin.html', 'index-option-a.html', 'dashboard.html',
          'NLC-Brand-Guidelines-source.html'}


def is_external(ref):
    return ref.startswith(('http://', 'https://', '//', 'mailto:', 'tel:',
                           'data:', 'javascript:', '#', 'whatsapp:', 'sms:',
                           'file:', 'blob:', 'ftp:'))


def is_template(ref):
    return '${' in ref or '{{' in ref or ref.strip() == ''


def is_page(path):
    return path.lower().endswith(('.html', '.htm'))


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


def resolve(ref, page_rel):
    """Resolve a reference to a path relative to the site root, or None."""
    ref = ref.split('#')[0].split('?')[0].strip()
    if not ref:
        return None
    if ref.startswith('/'):
        target = os.path.normpath(ref.lstrip('/') or '.')
    else:
        target = os.path.normpath(os.path.join(os.path.dirname(page_rel), ref))
    target = target.replace('\\', '/')
    if target.startswith('..'):
        return None  # escapes the site root; treat as external
    if target in ('', '.'):
        target = 'index.html'
    elif ref.endswith('/'):
        target += '/index.html'
    return target


def top_dir(rel):
    rel = rel.lstrip('./')
    return rel.split('/')[0] if '/' in rel else '(root)'


def sitemap_paths(xml):
    paths = set()
    for loc in SITEMAP_LOC_RE.findall(xml):
        path = re.sub(r'^https?://[^/]+/?', '', loc.strip())
        if not path or path.endswith('/'):
            path += 'index.html'
        paths.add(path)
    return paths


class LocalSource:
    """A site folder on disk."""
    mode = 'repo'

    def __init__(self, root):
        self.root = root
        self.label = os.path.basename(os.path.abspath(root)) or root
        self._exists = {}

    def internalize(self, ref):
        return ref

    def pages(self):
        rels = []
        for dirpath, dirnames, filenames in os.walk(self.root):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for fn in filenames:
                if is_page(fn):
                    rel = os.path.relpath(os.path.join(dirpath, fn), self.root).replace('\\', '/')
                    if rel == 'dashboard.html':
                        continue  # this tool audits the site, not itself
                    rels.append(rel)
        for rel in sorted(rels):
            full = os.path.join(self.root, rel)
            try:
                with open(full, encoding='utf-8', errors='replace') as f:
                    yield rel, f.read(), os.path.getsize(full) / 1024
            except OSError:
                continue

    def check(self, targets):
        for t in targets:
            if t not in self._exists:
                self._exists[t] = os.path.exists(os.path.join(self.root, t))

    def exists(self, rel):
        return self._exists[rel]

    def read_text(self, rel):
        try:
            with open(os.path.join(self.root, rel), encoding='utf-8', errors='replace') as f:
                return f.read()
        except OSError:
            return ''

    def sitemap_xml(self):
        path = os.path.join(self.root, 'sitemap.xml')
        if not os.path.exists(path):
            return None
        with open(path, encoding='utf-8', errors='replace') as f:
            return f.read()

    def images(self):
        found = []
        for dirpath, dirnames, filenames in os.walk(self.root):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for fn in filenames:
                if os.path.splitext(fn)[1].lower() in IMAGE_EXT:
                    full = os.path.join(dirpath, fn)
                    rel = os.path.relpath(full, self.root).replace('\\', '/')
                    found.append((rel, os.path.getsize(full) / 1024))
        return found


class LiveSource:
    """The deployed website, crawled over HTTP from the home page and sitemap."""
    mode = 'live'

    def __init__(self, base_url, max_pages=1500, workers=8, timeout=20):
        if '://' not in base_url:
            base_url = 'https://' + base_url
        p = urlparse(base_url)
        self.base = f'{p.scheme}://{p.netloc}'
        self.hosts = {p.netloc, p.netloc[4:] if p.netloc.startswith('www.') else 'www.' + p.netloc}
        self.label = p.netloc
        self.max_pages = max_pages
        self.workers = workers
        self.timeout = timeout
        self._status = {}  # rel -> (ok, sizeKB)
        self._sitemap = None
        self._sitemap_fetched = False

    def internalize(self, ref):
        """Treat absolute links to this site as internal root-relative paths."""
        for scheme in ('https://', 'http://', '//'):
            for host in self.hosts:
                prefix = scheme + host
                if ref == prefix or ref.startswith(prefix + '/'):
                    return ref[len(prefix):] or '/'
        return ref

    def _url(self, rel):
        return self.base + '/' + quote(rel, safe="/%:@&=+$,;~-._!*'()")

    def _open(self, rel, method):
        req = Request(self._url(rel), method=method, headers={'User-Agent': USER_AGENT})
        return urlopen(req, timeout=self.timeout)

    def _head(self, rel):
        for method in ('HEAD', 'GET'):
            try:
                with self._open(rel, method) as r:
                    size = int(r.headers.get('Content-Length') or 0) / 1024
                    return True, size
            except HTTPError as e:
                if method == 'HEAD' and e.code in (403, 405, 501):
                    continue  # some servers refuse HEAD; retry with GET
                return False, 0
            except (URLError, OSError, ValueError):
                return False, 0
        return False, 0

    def _get_page(self, rel):
        try:
            with self._open(rel, 'GET') as r:
                if 'html' not in (r.headers.get('Content-Type') or 'text/html'):
                    return None
                body = r.read()
                charset = r.headers.get_content_charset() or 'utf-8'
                return body.decode(charset, errors='replace'), len(body) / 1024
        except (HTTPError, URLError, OSError, ValueError):
            return None

    def read_text(self, rel):
        try:
            with self._open(rel, 'GET') as r:
                return r.read(2_000_000).decode('utf-8', errors='replace')
        except (HTTPError, URLError, OSError, ValueError):
            return ''

    def sitemap_xml(self):
        if not self._sitemap_fetched:
            self._sitemap_fetched = True
            page = self._get_page('sitemap.xml')
            if page is None:
                try:
                    with self._open('sitemap.xml', 'GET') as r:
                        page = (r.read().decode('utf-8', errors='replace'), 0)
                except (HTTPError, URLError, OSError, ValueError):
                    page = None
            self._sitemap = page[0] if page else None
        return self._sitemap

    def pages(self):
        seeds = ['index.html']
        xml = self.sitemap_xml()
        if xml:
            seeds += sorted(p for p in sitemap_paths(xml) if is_page(p))
        queue, seen, crawled = deque(), set(), 0
        for s in seeds:
            if s not in seen:
                seen.add(s)
                queue.append(s)
        with ThreadPoolExecutor(self.workers) as pool:
            while queue and crawled < self.max_pages:
                batch = [queue.popleft() for _ in range(min(len(queue), self.workers * 4,
                                                             self.max_pages - crawled))]
                for rel, page in zip(batch, pool.map(self._get_page, batch)):
                    crawled += 1
                    if page is None:
                        self._status[rel] = (False, 0)
                        continue
                    content, size = page
                    self._status[rel] = (True, size)
                    for ref in REF_RE.findall(content):
                        ref = self.internalize(ref)
                        if is_external(ref) or is_template(ref):
                            continue
                        target = resolve(ref, rel)
                        if target and is_page(target) and target not in seen:
                            seen.add(target)
                            queue.append(target)
                    yield rel, content, size

    def check(self, targets):
        todo = sorted({t for t in targets if t not in self._status})
        with ThreadPoolExecutor(self.workers) as pool:
            for rel, result in zip(todo, pool.map(self._head, todo)):
                self._status[rel] = result

    def exists(self, rel):
        return self._status[rel][0]

    def images(self):
        return [(rel, size) for rel, (ok, size) in sorted(self._status.items())
                if ok and os.path.splitext(rel)[1].lower() in IMAGE_EXT]


def audit(source):
    pages = []
    broken = []
    ok_refs = 0
    linked = set()  # page targets referenced from at least one other page
    page_refs = []  # (rel, [targets]) in page order

    for rel, content, size_kb in source.pages():
        refs = sorted(set(REF_RE.findall(content)) | set(CSS_URL_RE.findall(content)))
        targets = []
        for ref in refs:
            ref = source.internalize(ref)
            if is_external(ref) or is_template(ref):
                continue
            target = resolve(ref, rel)
            if target is None:
                continue
            if target != rel and is_page(target):
                linked.add(target)
            targets.append(target)
        page_refs.append((rel, targets))

        m = TITLE_RE.search(content)
        title = re.sub(r'\s+', ' ', m.group(1)).strip() if m else ''
        imgs = IMG_TAG_RE.findall(content)
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
            'altMissing': sum(1 for tag in imgs if not ALT_RE.search(tag)),
            'brokenRefs': 0,
            'sizeKB': round(size_kb, 1),
            'analytics': analytics_tag(content),
            'gaIds': sorted(set(GA_ID_RE.findall(content))),
        })

    source.check(t for _, targets in page_refs for t in targets)

    # A shared script (nav.js, a tag-manager loader...) can inject the
    # analytics tag, so scan the site's own JavaScript files as well.
    scripts = sorted({t for _, targets in page_refs for t in targets
                      if t.endswith('.js') and source.exists(t)
                      and not t.startswith('dashboard')})
    script_text = {t: source.read_text(t) for t in scripts}
    script_tag = {t: analytics_tag(text) for t, text in script_text.items()}
    script_ids = {t: set(GA_ID_RE.findall(text)) for t, text in script_text.items()}
    for page, (rel, targets) in zip(pages, page_refs):
        for t in targets:
            if script_tag.get(t) == 'ok':
                page['analytics'] = 'ok'
                page['gaIds'] = sorted(set(page['gaIds']) | script_ids[t])
                break
            if script_tag.get(t) == 'placeholder' and page['analytics'] == 'missing':
                page['analytics'] = 'placeholder'
    for page, (rel, targets) in zip(pages, page_refs):
        for target in targets:
            if source.exists(target):
                ok_refs += 1
            else:
                page['brokenRefs'] += 1
                broken.append({'source': rel, 'target': target,
                               'type': classify(target), 'dir': top_dir(target)})

    # EN/AR parity
    en_paths = {p['path'] for p in pages if p['lang'] == 'en' and p['path'] not in EXEMPT}
    ar_paths = {p['path'] for p in pages if p['path'].startswith('ar/')}
    missing_ar = sorted(p for p in en_paths if 'ar/' + p not in ar_paths)
    missing_en = sorted(p for p in ar_paths if p[3:] not in en_paths)

    # Sitemap coverage
    page_paths = {p['path'] for p in pages}
    indexable = {p['path'] for p in pages
                 if not p['noindex'] and p['path'] not in EXEMPT}
    sitemap = {'present': False, 'count': 0, 'missingOnDisk': [], 'notListed': []}
    xml = source.sitemap_xml()
    if xml is not None:
        sm_paths = sitemap_paths(xml)
        sitemap['present'] = True
        sitemap['count'] = len(sm_paths)
        sitemap['missingOnDisk'] = sorted(p for p in sm_paths
                                          if is_page(p) and p not in page_paths)
        sitemap['notListed'] = sorted(p for p in indexable if p not in sm_paths)

    # Orphan pages: no other page links to them (home page is never an orphan)
    orphans = sorted(p for p in page_paths
                     if p not in linked and p != 'index.html' and p not in EXEMPT)

    # Image weight audit
    images = {'total': 0, 'totalKB': 0, 'overBudget': []}
    for rel, kb in source.images():
        images['total'] += 1
        images['totalKB'] += kb
        if kb > IMG_BUDGET_KB:
            images['overBudget'].append({
                'path': rel, 'kb': round(kb),
                'severity': 'critical' if kb > IMG_HARD_KB else 'warning'})
    images['totalKB'] = round(images['totalKB'])
    images['overBudget'].sort(key=lambda x: (-x['kb'], x['path']))

    # Aggregates
    by_dir, by_type = {}, {}
    for b in broken:
        by_dir[b['dir']] = by_dir.get(b['dir'], 0) + 1
        by_type[b['type']] = by_type.get(b['type'], 0) + 1
    pages_by_section = {}
    for p in pages:
        pages_by_section[p['section']] = pages_by_section.get(p['section'], 0) + 1

    seo_pages = [p for p in pages if not p['noindex']]
    tracked = [p for p in seo_pages if p['analytics'] == 'ok']
    placeholder = [p['path'] for p in seo_pages if p['analytics'] == 'placeholder']
    untracked = [p['path'] for p in seo_pages if p['analytics'] == 'missing']
    ga_ids = sorted({i for p in pages for i in p['gaIds']})
    tracking = {'tracked': len(tracked), 'placeholder': sorted(placeholder),
                'untracked': sorted(untracked), 'ids': ga_ids,
                'pct': round(100 * len(tracked) / len(seo_pages)) if seo_pages else 0}
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
    score = max(0, round(100 - sum(penalties.values()))) if pages else 0

    # Action items, worst first
    live = source.mode == 'live'
    actions = []
    if not pages:
        actions.append({'severity': 'critical',
                        'title': f'Could not load any pages from {source.label}',
                        'detail': 'The site may be down, blocking automated requests, or the address is wrong.'})
    elif live and broken:
        actions.append({'severity': 'critical' if len(broken) > 50 else 'serious',
                        'title': f'{len(broken)} broken links on the live site',
                        'detail': 'Visitors and search engines get errors when they follow these. '
                                  'The Broken References explorer below lists every source page and target.'})
    elif len(broken) > 100 and by_dir.get('images', 0) + by_dir.get('product', 0) > 50:
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
                        'title': (f"sitemap.xml lists {len(sitemap['missingOnDisk'])} pages that return an error"
                                  if live else
                                  f"sitemap.xml promises {len(sitemap['missingOnDisk'])} pages that do not exist here"),
                        'detail': 'Crawlers hitting those URLs get 404s, which hurts crawl trust. '
                                  'Either add the pages or prune the sitemap. See Search visibility below.'})
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
    if seo_pages and tracking['tracked'] == 0:
        actions.append({'severity': 'critical',
                        'title': 'Google Analytics is not installed with a real ID on any page',
                        'detail': (f"{len(placeholder)} pages still carry the template placeholder GA_MEASUREMENT_ID "
                                   if placeholder else '') +
                                  f"{len(untracked)} pages have no tag at all. No visits are being recorded. "
                                  'Add the G-XXXXXXX measurement ID from Google Analytics to every page.'})
    elif tracking['pct'] < 100:
        actions.append({'severity': 'serious',
                        'title': f"Google Analytics covers only {tracking['pct']}% of pages",
                        'detail': f"{len(untracked) + len(placeholder)} indexable pages are not tracked, "
                                  'so traffic numbers undercount. See Search visibility below for the list.'})
    if len(ga_ids) > 1:
        actions.append({'severity': 'warning',
                        'title': f"{len(ga_ids)} different analytics IDs are in use",
                        'detail': 'Pages report to different properties (' + ', '.join(ga_ids) +
                                  '), which splits your traffic numbers. Use one GA4 ID everywhere.'})
    if total_alt_missing:
        actions.append({'severity': 'warning',
                        'title': f'{total_alt_missing} <img> tags have no alt attribute',
                        'detail': 'Decorative images should carry alt="" (empty, not absent) per STYLE-GUIDE 7.3.'})
    rank = {'critical': 0, 'serious': 1, 'warning': 2, 'good': 3}
    actions.sort(key=lambda a: rank[a['severity']])
    if not actions:
        actions.append({'severity': 'good', 'title': 'No outstanding issues found',
                        'detail': 'All references resolve, SEO metadata is present, and images are within budget.'})

    return {
        'generated': datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),
        'mode': source.mode,
        'root': source.label,
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
            'trackingPct': tracking['pct'],
        },
        'missingByDir': dict(sorted(by_dir.items(), key=lambda kv: (-kv[1], kv[0]))),
        'missingByType': dict(sorted(by_type.items(), key=lambda kv: (-kv[1], kv[0]))),
        'pagesBySection': dict(sorted(pages_by_section.items(), key=lambda kv: (-kv[1], kv[0]))),
        'actions': actions,
        'parity': {'missingAr': missing_ar, 'missingEn': missing_en,
                   'expected': parity_expected},
        'sitemap': sitemap,
        'orphans': orphans,
        'tracking': tracking,
        'images': images,
        'pages': pages,
        'brokenRefs': broken,
    }


def pop_option(args, name):
    if name not in args:
        return None
    i = args.index(name)
    value = args[i + 1]
    del args[i:i + 2]
    return value


def main():
    args = sys.argv[1:]
    max_broken = pop_option(args, '--max-broken')
    url = pop_option(args, '--url')
    out = pop_option(args, '--out')

    if url:
        source = LiveSource(url)
        out = out or 'dashboard-live-data.js'
        var = 'NLC_AUDIT_LIVE'
    else:
        root = args[0] if args else '.'
        source = LocalSource(root)
        out = out or os.path.join(root, 'dashboard-data.js')
        var = 'NLC_AUDIT'

    data = audit(source)
    with open(out, 'w', encoding='utf-8') as f:
        f.write('/* Generated by site_audit.py, %s. Do not edit by hand. */\n'
                % data['generated'])
        f.write(f'window.{var} = ')
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')

    s = data['summary']
    where = 'live site ' + source.label if url else 'folder ' + source.label
    print(f"NLC site audit of {where}, {data['generated']}")
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
        print(f"  Sitemap:           {sm['count']} URLs, {len(sm['missingOnDisk'])} missing, "
              f"{len(sm['notListed'])} pages not listed")
    else:
        print("  Sitemap:           sitemap.xml not found")
    print(f"  Orphan pages:      {len(data['orphans'])}")
    t = data['tracking']
    print(f"  Analytics tag:     {t['pct']}% of pages ({', '.join(t['ids']) or 'no real ID found'}; "
          f"{len(t['placeholder'])} placeholder, {len(t['untracked'])} missing)")
    print(f"  Wrote {out}")
    print("  Open dashboard.html in a browser to explore.")

    if url and not data['pages']:
        sys.exit(2)

    if max_broken is not None:
        max_broken = int(max_broken)
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
