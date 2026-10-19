# NLC Site Command Center

An internal ops dashboard for the NLC website. One script audits the
site; one HTML page turns the result into an actionable overview. It
can audit two things, and the dashboard switches between them:

- **Live site:** the real, deployed nlc.com.sa, crawled over HTTP.
- **Repository:** the files committed to this GitHub repo.

## Files

| File | Role |
|---|---|
| `site_audit.py` | Auditor. Pure Python 3 stdlib, no installs. |
| `dashboard.html` | The dashboard UI. Static, self-contained. |
| `dashboard-live-data.js` | Generated live-site audit (written by CI). |
| `dashboard-data.js` | Generated repository audit. |
| `.audit-baseline` | Max allowed broken references in the repo (CI guard). |
| `.github/workflows/site-audit.yml` | Runs everything automatically. |

## How it stays up to date (no action needed)

The workflow runs:

- **Every day at 06:17 Riyadh time:** crawls the live site and refreshes
  the live audit.
- **On every push to `main`:** audits the repository and the live site.
- **On every push to any branch:** audits the repository, fails the build
  if broken references exceed `.audit-baseline`.
- **On demand:** Actions tab, "Site audit", "Run workflow".

When the numbers changed, it commits the refreshed data files back
(timestamp-only changes are ignored) and asks GitHub Pages to rebuild,
so the published dashboard shows the new results within minutes.

The live audit is report-only: if nlc.com.sa is slow or down, the build
does not fail and the last good live data is kept.

## Where it is live

Once this is on `main`, GitHub Pages serves it at:

https://malsaleh1407-hub.github.io/NLC/dashboard.html

The repository is public, so that URL is public too. The page carries
`noindex, nofollow` and is not linked from the website, but anyone with
the link can open it. It shows only site-health information.

## Running it by hand

```bash
cd /path/to/site                          # the folder with index.html
python3 site_audit.py                     # audit this folder
python3 site_audit.py --url https://nlc.com.sa   # audit the live site
open dashboard.html
```

Run the folder audit on the **full site tree on your Mac** (the folder
with `images/`, `product/`, `ar/`, `fonts/`) to check work before you
upload it.

## What it checks

- **Broken internal references.** Every `href`/`src`/`url()` on every page.
  On the live site, absolute links to nlc.com.sa count as internal too.
  Grouped by directory and asset type, searchable in the explorer table.
- **Per-page SEO health.** `<title>`, meta description, `hreflang`
  alternates, canonical, Open Graph tags, `alt` attribute coverage.
  `noindex` pages (admin) are exempt.
- **Bilingual parity.** Which EN pages have no `/ar/` mirror and which AR
  pages are orphaned (STYLE-GUIDE section 8).
- **Sitemap coverage.** Both directions: sitemap URLs that 404, and
  indexable pages missing from `sitemap.xml`.
- **Orphan pages.** Pages no other page links to.
- **Image weight budget.** Flags anything over the 500 KB budget from
  STYLE-GUIDE section 7.1, red-flags anything over 2 MB.
- **Health score.** 100 minus capped penalties per problem class. The hero
  chips show exactly what is costing points.

## CI guard

The repository audit fails the build when broken references exceed the
number in `.audit-baseline`, so new breakage can never land silently.
Lower the baseline as the site heals (the audit prints a reminder
whenever it can be ratcheted down). Local check before pushing:

```bash
python3 site_audit.py --max-broken "$(cat .audit-baseline)"
```

## Headline finding (repository)

The GitHub repo contains only the root-level HTML files. The `images/`,
`product/`, `ar/`, `academy/`, `solutions/`, `fonts/`, `certificates/`
and `js/` folders were never uploaded ("Add files via upload" on
github.com does not carry folders). Fix from the site root on your Mac:

```bash
git add -A
git commit -m "Add full site tree (images, product, ar, fonts, academy, solutions)"
git push
```

## Ideas for later

- **Registrations panel.** Feed the base44 `PortalUser` export (CSV) into a
  second dashboard tab: pending approvals, downloads per datasheet,
  registrations per week.
- **Product catalog as data.** Generate `products.html`, the AR mirror and
  all detail pages from one `products.json`, so a spec change is a
  one-line edit instead of four files.
- **Privacy-friendly analytics.** Plausible or GoatCounter is one `<script>`
  tag, no cookie banner needed.
- **Lighthouse budget.** Track performance/accessibility scores per release
  next to the health score.
