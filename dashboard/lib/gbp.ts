/* =============================================================================
 * Google Business Profile (GBP) Performance API client — SERVER-SIDE ONLY.
 * -----------------------------------------------------------------------------
 * Fetches the same numbers Google emails in the monthly digest, live:
 *   - Calls, website clicks, direction requests, chat clicks (daily metrics)
 *   - Profile views / searches (impressions by surface)
 *   - Top search terms (monthly search keywords)
 * for the LAST FULL CALENDAR MONTH, with deltas vs. the month before.
 *
 * Configuration (all required for live mode — see dashboard/GBP-SETUP.md):
 *   GBP_CLIENT_ID       OAuth client id from Google Cloud Console
 *   GBP_CLIENT_SECRET   OAuth client secret
 *   GBP_REFRESH_TOKEN   Long-lived refresh token for the GBP owner account
 *   GBP_LOCATION_ID     Numeric location id (locations/XXXXXXXXXXXX)
 *   GBP_LOCATION_LABEL  Display name, e.g. "NLC — Factory#2, 106, Dammam"
 *
 * If any variable is missing, or the API errors, callers receive the bundled
 * sample report from data/mockData.ts so the dashboard always renders.
 * ===========================================================================*/

import {
  latestGbpReport,
  type GbpMonthlyReport,
  type GbpReportMetric,
  type TrendDirection,
} from "@/data/mockData";

const PERF_BASE = "https://businessprofileperformance.googleapis.com/v1";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

/** Daily metrics requested from fetchMultiDailyMetricsTimeSeries. */
const DAILY_METRICS = [
  "CALL_CLICKS",
  "WEBSITE_CLICKS",
  "BUSINESS_DIRECTION_REQUESTS",
  "BUSINESS_CONVERSATIONS",
  "BUSINESS_BOOKINGS",
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
] as const;

type DailyMetric = (typeof DAILY_METRICS)[number];
type MonthTotals = Record<DailyMetric, number>;

export function isGbpConfigured(): boolean {
  return Boolean(
    process.env.GBP_CLIENT_ID &&
      process.env.GBP_CLIENT_SECRET &&
      process.env.GBP_REFRESH_TOKEN &&
      process.env.GBP_LOCATION_ID
  );
}

/** Exchange the long-lived refresh token for a short-lived access token. */
async function getAccessToken(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GBP_CLIENT_ID!,
      client_secret: process.env.GBP_CLIENT_SECRET!,
      refresh_token: process.env.GBP_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
    // Tokens must never be cached across requests.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`GBP token refresh failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

interface YMD {
  year: number;
  month: number; // 1-12
  day: number;
}

/** First and last day of the month `offset` months before the current one. */
function monthRange(offset: number): { start: YMD; end: YMD; label: string } {
  const now = new Date();
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
  return {
    start: { year: first.getUTCFullYear(), month: first.getUTCMonth() + 1, day: 1 },
    end: { year: last.getUTCFullYear(), month: last.getUTCMonth() + 1, day: last.getUTCDate() },
    label: first.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
  };
}

/** Sum each requested daily metric across a date range for the location. */
async function fetchMonthTotals(
  token: string,
  locationId: string,
  start: YMD,
  end: YMD
): Promise<MonthTotals> {
  const params = new URLSearchParams();
  for (const m of DAILY_METRICS) params.append("dailyMetrics", m);
  params.set("dailyRange.startDate.year", String(start.year));
  params.set("dailyRange.startDate.month", String(start.month));
  params.set("dailyRange.startDate.day", String(start.day));
  params.set("dailyRange.endDate.year", String(end.year));
  params.set("dailyRange.endDate.month", String(end.month));
  params.set("dailyRange.endDate.day", String(end.day));

  const res = await fetch(
    `${PERF_BASE}/locations/${locationId}:fetchMultiDailyMetricsTimeSeries?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      // Performance data is daily; cache server-side for 6 hours.
      next: { revalidate: 21600 },
    }
  );
  if (!res.ok) {
    throw new Error(`GBP metrics fetch failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as {
    multiDailyMetricTimeSeries?: {
      dailyMetricTimeSeries?: {
        dailyMetric: DailyMetric;
        timeSeries?: { datedValues?: { value?: string }[] };
      }[];
    }[];
  };

  const totals = Object.fromEntries(
    DAILY_METRICS.map((m) => [m, 0])
  ) as MonthTotals;

  for (const group of json.multiDailyMetricTimeSeries ?? []) {
    for (const series of group.dailyMetricTimeSeries ?? []) {
      const sum = (series.timeSeries?.datedValues ?? []).reduce(
        (acc, v) => acc + Number(v.value ?? 0),
        0
      );
      if (series.dailyMetric in totals) totals[series.dailyMetric] += sum;
    }
  }
  return totals;
}

/** Top search keywords (by impressions) for a single month. */
async function fetchSearchKeywords(
  token: string,
  locationId: string,
  month: YMD,
  limit = 5
): Promise<{ term: string; count: number }[]> {
  const params = new URLSearchParams({
    "monthlyRange.startMonth.year": String(month.year),
    "monthlyRange.startMonth.month": String(month.month),
    "monthlyRange.endMonth.year": String(month.year),
    "monthlyRange.endMonth.month": String(month.month),
    pageSize: String(limit),
  });

  const res = await fetch(
    `${PERF_BASE}/locations/${locationId}/searchkeywords/impressions/monthly?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 21600 },
    }
  );
  if (!res.ok) {
    throw new Error(`GBP keywords fetch failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as {
    searchKeywordsCounts?: {
      searchKeyword?: string;
      // Low-volume keywords return a threshold ("fewer than N") not a value.
      insightsValue?: { value?: string; threshold?: string };
    }[];
  };

  return (json.searchKeywordsCounts ?? [])
    .map((k) => ({
      term: k.searchKeyword ?? "",
      count: Number(k.insightsValue?.value ?? k.insightsValue?.threshold ?? 0),
    }))
    .filter((k) => k.term);
}

/** "462" / "+28%" style formatting matching the email digest. */
function delta(cur: number, prev: number): { change: string; trend: TrendDirection } {
  if (prev === 0) {
    return cur > 0 ? { change: "new", trend: "up" } : { change: "—", trend: "flat" };
  }
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0) return { change: "0%", trend: "flat" };
  return { change: `${pct > 0 ? "+" : ""}${pct}%`, trend: pct > 0 ? "up" : "down" };
}

/** Assemble the digest-style report from two months of raw totals. */
function buildReport(
  cur: MonthTotals,
  prev: MonthTotals,
  keywords: { term: string; count: number }[],
  periodLabel: string
): GbpMonthlyReport {
  const views = (t: MonthTotals) =>
    t.BUSINESS_IMPRESSIONS_DESKTOP_MAPS +
    t.BUSINESS_IMPRESSIONS_MOBILE_MAPS +
    t.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH +
    t.BUSINESS_IMPRESSIONS_MOBILE_SEARCH;
  const searches = (t: MonthTotals) =>
    t.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH + t.BUSINESS_IMPRESSIONS_MOBILE_SEARCH;
  // Google's definition: call, booking, website visit, or direction request.
  const interactions = (t: MonthTotals) =>
    t.CALL_CLICKS +
    t.BUSINESS_BOOKINGS +
    t.WEBSITE_CLICKS +
    t.BUSINESS_DIRECTION_REQUESTS;

  const metric = (
    id: string,
    label: string,
    icon: string,
    get: (t: MonthTotals) => number
  ): GbpReportMetric => ({
    id,
    label,
    icon,
    value: get(cur).toLocaleString("en-US"),
    ...delta(get(cur), get(prev)),
  });

  return {
    location: process.env.GBP_LOCATION_LABEL ?? `Location ${process.env.GBP_LOCATION_ID}`,
    period: periodLabel,
    totalInteractions: interactions(cur),
    metrics: [
      metric("views", "Profile Views", "Eye", views),
      metric("searches", "Searches", "Search", searches),
      metric("directions", "Direction Requests", "Navigation", (t) => t.BUSINESS_DIRECTION_REQUESTS),
      metric("calls", "Calls", "PhoneCall", (t) => t.CALL_CLICKS),
      metric("website", "Website Visits", "MousePointerClick", (t) => t.WEBSITE_CLICKS),
      metric("chat", "Chat Clicks", "MessageCircle", (t) => t.BUSINESS_CONVERSATIONS),
    ],
    topSearchTerms: keywords.slice(0, 5),
    source: "live",
  };
}

/**
 * Public entry point used by the dashboard. Returns the live monthly report
 * when credentials are configured, otherwise the bundled sample report.
 */
export async function getGbpReport(): Promise<GbpMonthlyReport> {
  if (!isGbpConfigured()) return latestGbpReport;

  try {
    const token = await getAccessToken();
    const locationId = process.env.GBP_LOCATION_ID!;
    const curRange = monthRange(1); // last full month
    const prevRange = monthRange(2); // the month before it

    const [cur, prev, keywords] = await Promise.all([
      fetchMonthTotals(token, locationId, curRange.start, curRange.end),
      fetchMonthTotals(token, locationId, prevRange.start, prevRange.end),
      fetchSearchKeywords(token, locationId, curRange.start),
    ]);

    return buildReport(cur, prev, keywords, curRange.label);
  } catch (err) {
    // Never break the dashboard over an upstream hiccup — log and fall back.
    console.error("[gbp] live fetch failed, serving sample report:", err);
    return latestGbpReport;
  }
}
