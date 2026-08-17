# NLC Site Command Center

An internal ops dashboard for the NLC website. One script scans the whole
site tree; one HTML page turns the result into an actionable overview.

## Files

| File | Role |
|---|---|
| `site_audit.py` | Scanner. Pure Python 3 stdlib, no installs. Writes `dashboard-data.js`. |
| `dashboard.html` | The dashboard UI. Static, self-contained, reads `dashboard-data.js`. |
| `dashboard-data.js` | Generated snapshot. Committed so the dashboard works out of the box. |

## How to use

```bash
cd /path/to/site        # the folder that contains index.html
python3 site_audit.py
open dashboard.html     # or double-click it
```

Run it from the **full site tree on your Mac** (the folder with `images/`,
`product/`, `ar/`, `fonts/`) to audit the real site. Run it inside the Git
repo to audit what is actually committed. Comparing the two runs is exactly
how you catch upload gaps.

## What it checks

- **Broken internal references.** Every `href`/`src`/`url()` on every page,
  resolved against the tree. Grouped by directory and asset type, fully
  searchable in the explorer table.
- **Per-page SEO health.** `<title>`, meta description, `hreflang`
  alternates, canonical, Open Graph tags, `alt` attribute coverage.
  `noindex` pages (admin) are exempt.
- **Bilingual parity.** Which EN pages have no `/ar/` mirror and which AR
  pages are orphaned (STYLE-GUIDE section 8).
- **Sitemap coverage.** Both directions: sitemap URLs that would 404
  because the file does not exist, and indexable pages missing from
  `sitemap.xml`.
- **Orphan pages.** Pages no other page links to, reachable only by
  typing the URL.
- **Image weight budget.** Flags anything over the 500 KB budget from
  STYLE-GUIDE section 7.1, red-flags anything over 2 MB.
- **Health score.** 100 minus capped penalties per problem class. The hero
  chips show exactly what is costing points.

## Current headline finding

The GitHub repo contains only the root-level HTML files. The
`images/`, `product/`, `ar/`, `academy/`, `solutions/`, `fonts/`,
`certificates/` and `js/` folders were never uploaded ("Add files via
upload" on github.com does not carry folders). That is 800+ broken
references in the repo copy. Fix from the site root on your Mac:

```bash
git add -A
git commit -m "Add full site tree (images, product, ar, fonts, academy, solutions)"
git push
```

Then re-run `python3 site_audit.py` and watch the score jump.

## Access control

`dashboard.html` carries `noindex, nofollow` and is not linked from any
public page. If you deploy it to production, protect it the same way as
`admin.html` (see `SERVER-AUTH.md`).

## CI guard

`.github/workflows/site-audit.yml` runs the audit on every push and pull
request. It fails the build when broken internal references exceed the
number in `.audit-baseline`, so new breakage can never land silently.
The baseline starts at the current count; lower it as the site heals
(the audit prints a reminder whenever it can be ratcheted down). Local
check before pushing:

```bash
python3 site_audit.py --max-broken "$(cat .audit-baseline)"
```

After every push, the workflow also regenerates `dashboard-data.js` and
commits it back to the branch when the numbers changed (timestamp-only
churn is ignored). So the committed dashboard is always in sync with
the latest push: `git pull`, open `dashboard.html`, and you see the
current state without running anything.

## Ideas for later

- **Registrations panel.** Feed the base44 `PortalUser` export (CSV) into a
  second dashboard tab: pending approvals, downloads per datasheet,
  registrations per week.
- **Product catalog as data.** Generate `products.html`, the AR mirror and
  all detail pages from one `products.json`, so a price/spec change is a
  one-line edit instead of four files.
- **Privacy-friendly analytics.** Plausible or GoatCounter is one `<script>`
  tag, no cookie banner needed; would fill the "traffic" gap this dashboard
  intentionally leaves out.
- **Lighthouse budget.** Track performance/accessibility scores per release
  next to the health score.
