# NLC Digital Performance Dashboard

A premium, executive-grade digital performance dashboard for **National Lighting
Company (NLC)**. It consolidates social, search, web, and lead analytics into a
single branded interface.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS + Recharts**.
Ships with realistic **mock data** and is structured so live APIs can be
connected later without touching the UI.

---

## Features

| Section | What it shows |
|---|---|
| **Executive Overview** | 8 headline KPIs, a multi-metric performance trend, and per-platform summary cards |
| **Social Media** | Follower growth, engagement-rate & reach comparisons, content-type performance, top posts table |
| **Google Maps / Business Profile** | Profile KPIs, customer-action trends, search keywords, actions by city (Dammam, Riyadh, Jeddah, Khobar, Jubail) |
| **Website** | GA4-style KPIs, traffic-source mix, top pages (Lighting, Low Current, Low Voltage, Projects, Contact) |
| **Leads & Inquiries** | Lead KPIs, lead-volume trend, source attribution with conversion rate & quality |

- Navy sidebar, white chart cards, light-gray canvas, orange highlights
- Rounded corners, soft shadows, hover states throughout
- Fully responsive (mobile slide-in sidebar)
- Reusable `KpiCard`, `ChartCard`, `DataTable` components
- Icons via `lucide-react` (no emojis, no logos)

---

## Brand tokens

| Token | Value |
|---|---|
| Primary navy | `#24285e` |
| Accent orange | `#F6851F` |
| Background | `#F0EFEF` |
| Font | **Bizmo** (if provided) → **Inter** fallback |

To use the real **Bizmo** web font, drop the font files into `public/fonts/`
and uncomment the `@font-face` block in `app/globals.css`.

---

## Requirements

- **Node.js 18.17+** (Node 20 LTS recommended)
- npm (or pnpm / yarn)

---

## Installation

```bash
cd dashboard
npm install
```

## Run (development)

```bash
npm run dev
```

Open <http://localhost:3000> — the root redirects to `/dashboard`.

## Build & run (production)

```bash
npm run build
npm run start
```

---

## Project structure

```
dashboard/
  app/
    layout.tsx                 Root layout (fonts, metadata)
    page.tsx                   Redirects "/" -> "/dashboard"
    globals.css                Tailwind + brand variables + Bizmo font hook
    dashboard/
      layout.tsx               Sidebar + topbar shell
      page.tsx                 1) Executive Overview
      social/page.tsx          2) Social Media Performance
      google-maps/page.tsx     3) Google Maps / Business Profile
      website/page.tsx         4) Website Performance
      leads/page.tsx           5) Lead & Inquiry Performance
    api/gbp/route.ts           JSON endpoint for the live GBP report
  components/
    Sidebar.tsx  Topbar.tsx  DateRangeSelector.tsx
    SectionHeading.tsx  Badge.tsx  PlatformChip.tsx
    cards/      KpiCard.tsx  KpiGrid.tsx  PlatformCard.tsx
    charts/     ChartCard.tsx  ChartTooltip.tsx
                AreaTrendChart.tsx  LineTrendChart.tsx
                DualAxisLineChart.tsx  BarSeriesChart.tsx  DonutChart.tsx
    tables/     DataTable.tsx
  data/
    mockData.ts                ALL dashboard data + TS types (single source)
  lib/
    theme.ts   format.ts   icon.tsx   nav.ts
    gbp.ts                     Google Business Profile API client (live data)
  GBP-SETUP.md                 Step-by-step guide to go live with GBP data
  .env.example                 Required env vars for live mode
  tailwind.config.ts  tsconfig.json  next.config.js  postcss.config.js
```

---

## Live Google Business Profile data (built in)

The "Latest Google Business Profile Report" panel on the Google Maps page is
**already wired to the GBP Performance API**. Without credentials it shows a
bundled sample digest (badge: *Sample*); add the `GBP_*` variables from
`.env.example` to `.env.local` and it switches to live data (badge: *Live*),
fetching the last full month's calls, directions, website clicks, chat clicks,
profile views, searches and top search terms with month-over-month deltas.

**Full setup walkthrough: [`GBP-SETUP.md`](./GBP-SETUP.md)** (free — one-time
Google approval required). Raw JSON is also served at `/api/gbp`.

## Connecting real APIs

Everything the UI renders comes from `data/mockData.ts`. Each block is typed and
annotated with the matching provider. To go live:

1. Create server-side route handlers under `app/api/*` that call each provider
   (keeps API keys/secrets out of the browser).
2. Have those routes return the **same shapes** already defined in
   `data/mockData.ts` (e.g. `Kpi[]`, `TrendPoint[]`, `TopPost[]`).
3. Swap the static imports in each page for `fetch()` calls (or a small data
   hook), passing the selected `DateRangeKey` from the date selector.

Providers referenced in the code comments:

| Dashboard data | API |
|---|---|
| Website sessions / users / pages | **Google Analytics 4** (GA4 Data API) |
| Maps profile views / calls / directions / reviews | **Google Business Profile API** |
| Instagram metrics | **Instagram Graph API** |
| Facebook metrics | **Facebook Graph API** |
| LinkedIn metrics | **LinkedIn Marketing API** |
| TikTok metrics | **TikTok for Business / Display API** |
| YouTube metrics | **YouTube Data API** (+ YouTube Analytics API) |
| X metrics | **X API v2** |
| Leads / conversions | GA4 conversions + CRM + WhatsApp Business API + form backend |

> No backend is required to run the dashboard today — it is fully static mock
> data.

---

© National Lighting Company — internal analytics tool.
