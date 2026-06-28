/* =============================================================================
 * NLC Digital Performance Dashboard — MOCK DATA LAYER
 * -----------------------------------------------------------------------------
 * This file is the single source of truth for everything the dashboard renders.
 * It is intentionally structured so each block can be swapped for a real API
 * call later WITHOUT touching the UI components. Each exported value below has
 * a matching TypeScript type, so once you fetch live data you only need to make
 * your API client return the same shape.
 *
 * WHERE TO CONNECT REAL APIs (replace the mock exports with fetched data):
 *   - Website KPIs / sessions / pages ....... Google Analytics 4 (GA4 Data API)
 *   - Google Maps / Business Profile ........ Google Business Profile API
 *   - Instagram metrics ..................... Instagram Graph API
 *   - Facebook metrics ...................... Facebook Graph API
 *   - LinkedIn metrics ...................... LinkedIn Marketing API
 *   - TikTok metrics ........................ TikTok for Business / Display API
 *   - YouTube metrics ....................... YouTube Data API + YT Analytics API
 *   - X (Twitter) metrics ................... X API v2
 *
 * Suggested pattern for going live (see /lib for a future api/ folder):
 *   export async function getExecutiveKpis(range: DateRangeKey) {
 *     const res = await fetch(`/api/executive?range=${range}`);
 *     return (await res.json()) as Kpi[];
 *   }
 * Build /app/api/* route handlers that call each provider server-side so secrets
 * never reach the browser, then have components call those routes.
 * ===========================================================================*/

/* ----------------------------- Shared types ------------------------------ */

export type TrendDirection = "up" | "down" | "flat";

export interface Kpi {
  /** Stable id, handy when wiring to an API field. */
  id: string;
  label: string;
  /** Pre-formatted display value, e.g. "1.2M", "4.7", "3.8%". */
  value: string;
  /** Period-over-period change, e.g. "+12.4%". */
  change: string;
  trend: TrendDirection;
  /** lucide-react icon name (resolved in components/cards/KpiCard.tsx). */
  icon: string;
  /** Optional helper text shown under the value. */
  caption?: string;
}

export type DateRangeKey = "7d" | "30d" | "90d" | "12m";

export interface DateRangeOption {
  key: DateRangeKey;
  label: string;
}

export const DATE_RANGES: DateRangeOption[] = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "12m", label: "Last 12 months" },
];

export type PlatformKey =
  | "linkedin"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x"
  | "facebook";

export interface PlatformMeta {
  key: PlatformKey;
  name: string;
  /** lucide-react icon name. */
  icon: string;
  /** Brand accent used for small platform chips/dots. */
  color: string;
}

export const PLATFORMS: PlatformMeta[] = [
  { key: "linkedin", name: "LinkedIn", icon: "Linkedin", color: "#0A66C2" },
  { key: "instagram", name: "Instagram", icon: "Instagram", color: "#E1306C" },
  { key: "tiktok", name: "TikTok", icon: "Music2", color: "#010101" },
  { key: "youtube", name: "YouTube", icon: "Youtube", color: "#FF0000" },
  { key: "x", name: "X", icon: "Twitter", color: "#1d1d1f" },
  { key: "facebook", name: "Facebook", icon: "Facebook", color: "#1877F2" },
];

/* ============================================================================
 * 1) EXECUTIVE OVERVIEW
 * ==========================================================================*/

// Connect: aggregate of GA4 + Google Business Profile + all social platform APIs.
export const executiveKpis: Kpi[] = [
  { id: "reach", label: "Total Reach", value: "2.84M", change: "+14.2%", trend: "up", icon: "Radio", caption: "across all channels" },
  { id: "engagement", label: "Total Engagement", value: "186.4K", change: "+9.7%", trend: "up", icon: "Heart", caption: "likes, comments, shares" },
  { id: "follower-growth", label: "Follower Growth", value: "+12.3K", change: "+18.1%", trend: "up", icon: "TrendingUp", caption: "net new followers" },
  { id: "website-visits", label: "Website Visits", value: "94.7K", change: "+6.4%", trend: "up", icon: "Globe", caption: "sessions" },
  { id: "maps-views", label: "Google Maps Views", value: "58.2K", change: "+11.9%", trend: "up", icon: "MapPin", caption: "profile + search views" },
  { id: "leads", label: "Leads / Inquiries", value: "1,248", change: "+22.5%", trend: "up", icon: "Inbox", caption: "qualified inquiries" },
  { id: "maps-calls", label: "Calls from Google Maps", value: "612", change: "-3.2%", trend: "down", icon: "PhoneCall", caption: "tap-to-call" },
  { id: "rating", label: "Average Rating", value: "4.7", change: "+0.2", trend: "up", icon: "Star", caption: "1,034 reviews" },
];

export interface GaugeMetric {
  id: string;
  label: string;
  /** Current value (raw). */
  value: number;
  /** Maximum of the gauge scale. */
  max: number;
  /** Pre-formatted big number shown in the gauge center, e.g. "4.7", "82%". */
  display: string;
  /** Small line under the big number, e.g. "out of 5.0". */
  suffix: string;
  /** Helper caption under the gauge label. */
  caption: string;
  /** Arc color (brand palette). */
  color: string;
}

// Connect: derive from the same sources as the KPIs (rating from Google
// Business Profile, conversion from CRM/GA4, goal attainment vs. your targets).
export const executiveGauges: GaugeMetric[] = [
  { id: "rating", label: "Average Rating", value: 4.7, max: 5, display: "4.7", suffix: "out of 5.0", caption: "1,034 Google reviews", color: "#F6851F" },
  { id: "conversion", label: "Lead Conversion", value: 3.8, max: 6, display: "3.8%", suffix: "of 6% target", caption: "63% to goal", color: "#24285e" },
  { id: "reach-goal", label: "Monthly Reach Goal", value: 81, max: 100, display: "81%", suffix: "of 3.5M target", caption: "2.84M reached", color: "#5a5fa8" },
  { id: "sentiment", label: "Positive Sentiment", value: 91, max: 100, display: "91%", suffix: "positive reviews", caption: "+4 pts vs. last quarter", color: "#16a34a" },
];

export interface TrendPoint {
  /** Period label, e.g. "Jan", "Wk 1". */
  period: string;
  reach: number;
  engagement: number;
  visits: number;
}

// Connect: time-series rollup keyed by your selected date range.
export const performanceTrend: TrendPoint[] = [
  { period: "Jan", reach: 198000, engagement: 11800, visits: 6400 },
  { period: "Feb", reach: 212000, engagement: 12600, visits: 6900 },
  { period: "Mar", reach: 234000, engagement: 13900, visits: 7300 },
  { period: "Apr", reach: 221000, engagement: 13100, visits: 7100 },
  { period: "May", reach: 256000, engagement: 15200, visits: 7800 },
  { period: "Jun", reach: 274000, engagement: 16400, visits: 8200 },
  { period: "Jul", reach: 268000, engagement: 16000, visits: 8050 },
  { period: "Aug", reach: 289000, engagement: 17100, visits: 8600 },
  { period: "Sep", reach: 301000, engagement: 18200, visits: 9000 },
  { period: "Oct", reach: 318000, engagement: 19000, visits: 9400 },
  { period: "Nov", reach: 332000, engagement: 19800, visits: 9700 },
  { period: "Dec", reach: 348000, engagement: 20600, visits: 10100 },
];

export interface PlatformSummary {
  key: PlatformKey;
  name: string;
  icon: string;
  color: string;
  followers: string;
  reach: string;
  engagementRate: string;
  change: string;
  trend: TrendDirection;
}

// Connect: one row per platform from each platform's API.
export const platformSummaries: PlatformSummary[] = [
  { key: "linkedin", name: "LinkedIn", icon: "Linkedin", color: "#0A66C2", followers: "48.2K", reach: "612K", engagementRate: "4.8%", change: "+15.2%", trend: "up" },
  { key: "instagram", name: "Instagram", icon: "Instagram", color: "#E1306C", followers: "63.5K", reach: "884K", engagementRate: "3.6%", change: "+11.4%", trend: "up" },
  { key: "tiktok", name: "TikTok", icon: "Music2", color: "#010101", followers: "29.1K", reach: "742K", engagementRate: "6.1%", change: "+34.7%", trend: "up" },
  { key: "youtube", name: "YouTube", icon: "Youtube", color: "#FF0000", followers: "12.8K", reach: "318K", engagementRate: "2.9%", change: "+8.3%", trend: "up" },
  { key: "x", name: "X", icon: "Twitter", color: "#1d1d1f", followers: "9.4K", reach: "164K", engagementRate: "1.7%", change: "-2.1%", trend: "down" },
  { key: "facebook", name: "Facebook", icon: "Facebook", color: "#1877F2", followers: "41.7K", reach: "286K", engagementRate: "2.2%", change: "+3.5%", trend: "up" },
];

/* ============================================================================
 * 2) SOCIAL MEDIA PERFORMANCE
 * ==========================================================================*/

export interface FollowerGrowthPoint {
  period: string;
  linkedin: number;
  instagram: number;
  tiktok: number;
  youtube: number;
  x: number;
  facebook: number;
}

// Connect: monthly follower counts per platform API.
export const followerGrowthByPlatform: FollowerGrowthPoint[] = [
  { period: "Jan", linkedin: 39200, instagram: 54100, tiktok: 16800, youtube: 10900, x: 8900, facebook: 39800 },
  { period: "Feb", linkedin: 40500, instagram: 55600, tiktok: 18200, youtube: 11100, x: 9000, facebook: 40100 },
  { period: "Mar", linkedin: 41900, instagram: 56900, tiktok: 19700, youtube: 11300, x: 9150, facebook: 40300 },
  { period: "Apr", linkedin: 43100, instagram: 58200, tiktok: 21400, youtube: 11600, x: 9220, facebook: 40600 },
  { period: "May", linkedin: 44600, instagram: 59800, tiktok: 23100, youtube: 11900, x: 9300, facebook: 40900 },
  { period: "Jun", linkedin: 45800, instagram: 61000, tiktok: 24900, youtube: 12100, x: 9350, facebook: 41100 },
  { period: "Jul", linkedin: 46900, instagram: 62100, tiktok: 26600, youtube: 12400, x: 9380, facebook: 41400 },
  { period: "Aug", linkedin: 48200, instagram: 63500, tiktok: 29100, youtube: 12800, x: 9400, facebook: 41700 },
];

export interface EngagementRateRow {
  platform: string;
  rate: number; // percentage
}

// Connect: engagement rate (engagements / reach) per platform.
export const engagementRateComparison: EngagementRateRow[] = [
  { platform: "TikTok", rate: 6.1 },
  { platform: "LinkedIn", rate: 4.8 },
  { platform: "Instagram", rate: 3.6 },
  { platform: "YouTube", rate: 2.9 },
  { platform: "Facebook", rate: 2.2 },
  { platform: "X", rate: 1.7 },
];

export interface ReachRow {
  platform: string;
  reach: number;
}

// Connect: reach/impressions per platform.
export const reachByPlatform: ReachRow[] = [
  { platform: "Instagram", reach: 884000 },
  { platform: "TikTok", reach: 742000 },
  { platform: "LinkedIn", reach: 612000 },
  { platform: "YouTube", reach: 318000 },
  { platform: "Facebook", reach: 286000 },
  { platform: "X", reach: 164000 },
];

export interface ContentTypeRow {
  type: string;
  engagement: number;
  reach: number;
}

// Connect: group post metrics by media/content type per platform.
export const contentTypePerformance: ContentTypeRow[] = [
  { type: "Video / Reels", engagement: 72400, reach: 1240000 },
  { type: "Image / Carousel", engagement: 54100, reach: 868000 },
  { type: "Project Case Study", engagement: 31800, reach: 412000 },
  { type: "Product Launch", engagement: 19600, reach: 286000 },
  { type: "Article / Link", engagement: 8500, reach: 158000 },
];

export interface LinkedInTrendPoint {
  period: string;
  impressions: number;
  reactions: number;
  comments: number;
  reposts: number;
  visitors: number;
  followers: number;
}

// Connect: LinkedIn Marketing API — organization share statistics
// (impressionCount, likeCount, commentCount, shareCount) + page statistics
// (pageViews / uniqueVisitors) + follower statistics (organicFollowerGain).
// Followers below align with followerGrowthByPlatform.linkedin for consistency.
export const linkedinTrend: LinkedInTrendPoint[] = [
  { period: "Jan", impressions: 118000, reactions: 2480, comments: 312, reposts: 148, visitors: 4200, followers: 39200 },
  { period: "Feb", impressions: 132000, reactions: 2710, comments: 348, reposts: 172, visitors: 4600, followers: 40500 },
  { period: "Mar", impressions: 149000, reactions: 3050, comments: 402, reposts: 198, visitors: 5100, followers: 41900 },
  { period: "Apr", impressions: 141000, reactions: 2920, comments: 380, reposts: 186, visitors: 4900, followers: 43100 },
  { period: "May", impressions: 168000, reactions: 3480, comments: 456, reposts: 224, visitors: 5800, followers: 44600 },
  { period: "Jun", impressions: 184000, reactions: 3820, comments: 502, reposts: 256, visitors: 6300, followers: 45800 },
  { period: "Jul", impressions: 196000, reactions: 4060, comments: 538, reposts: 278, visitors: 6700, followers: 46900 },
  { period: "Aug", impressions: 214000, reactions: 4380, comments: 586, reposts: 312, visitors: 7200, followers: 48200 },
];

export interface TopPost {
  platform: PlatformKey;
  platformName: string;
  title: string;
  reach: number;
  engagement: number;
  clicks: number;
  date: string;
}

// Connect: top posts ranked by engagement across all platform APIs.
export const topPerformingPosts: TopPost[] = [
  { platform: "tiktok", platformName: "TikTok", title: "Inside an NLC stadium lighting install", reach: 312000, engagement: 28400, clicks: 4120, date: "2026-05-28" },
  { platform: "instagram", platformName: "Instagram", title: "NLC architectural facade — Riyadh tower", reach: 268000, engagement: 21900, clicks: 3380, date: "2026-05-21" },
  { platform: "linkedin", platformName: "LinkedIn", title: "How smart low-current systems cut OPEX 30%", reach: 184000, engagement: 12600, clicks: 5210, date: "2026-06-02" },
  { platform: "youtube", platformName: "YouTube", title: "NLC Academy: lighting design fundamentals", reach: 142000, engagement: 9800, clicks: 2640, date: "2026-05-14" },
  { platform: "instagram", platformName: "Instagram", title: "Behind the scenes — NLC product lab", reach: 131000, engagement: 11200, clicks: 1980, date: "2026-06-05" },
  { platform: "facebook", platformName: "Facebook", title: "New solar street-light range now shipping", reach: 96000, engagement: 6400, clicks: 1520, date: "2026-05-30" },
  { platform: "x", platformName: "X", title: "NLC wins Jubail industrial lighting tender", reach: 58000, engagement: 3100, clicks: 890, date: "2026-06-07" },
];

/* ============================================================================
 * 3) GOOGLE MAPS / BUSINESS PROFILE
 * ==========================================================================*/

// Connect: Google Business Profile API (performance + reviews endpoints).
export const googleMapsKpis: Kpi[] = [
  { id: "profile-views", label: "Profile Views", value: "58.2K", change: "+11.9%", trend: "up", icon: "Eye" },
  { id: "search-appearances", label: "Search Appearances", value: "176.4K", change: "+8.7%", trend: "up", icon: "Search" },
  { id: "direction-requests", label: "Direction Requests", value: "4,820", change: "+13.4%", trend: "up", icon: "Navigation" },
  { id: "phone-calls", label: "Phone Calls", value: "612", change: "-3.2%", trend: "down", icon: "PhoneCall" },
  { id: "website-clicks", label: "Website Clicks", value: "7,340", change: "+16.1%", trend: "up", icon: "MousePointerClick" },
  { id: "reviews", label: "Reviews", value: "1,034", change: "+58", trend: "up", icon: "MessageSquare" },
  { id: "avg-rating", label: "Average Rating", value: "4.7", change: "+0.2", trend: "up", icon: "Star" },
];

/* ---------------------------------------------------------------------------
 * Latest Google Business Profile monthly report.
 * LIVE integration: lib/gbp.ts fetches this from the GBP Performance API when
 * GBP_* env vars are configured (see GBP-SETUP.md). The object below is the
 * sample fallback — real May 2026 figures for one NLC location, taken from the
 * GBP email digest — served whenever credentials are absent or the API errors.
 * ------------------------------------------------------------------------- */
export interface GbpReportMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: TrendDirection;
  icon: string;
}

export interface GbpReportSearchTerm {
  term: string;
  count: number;
}

export interface GbpMonthlyReport {
  location: string;
  period: string;
  /** "An interaction is a call, booking, website visit or direction request." */
  totalInteractions: number;
  metrics: GbpReportMetric[];
  topSearchTerms: GbpReportSearchTerm[];
  /** "live" when fetched from the GBP API, "sample" for the bundled fallback. */
  source: "live" | "sample";
}

export const latestGbpReport: GbpMonthlyReport = {
  location: "NLC — Factory#2, 106, Dammam",
  period: "May 2026",
  totalInteractions: 398,
  metrics: [
    { id: "views", label: "Profile Views", value: "462", change: "-2%", trend: "down", icon: "Eye" },
    { id: "searches", label: "Searches", value: "141", change: "-2%", trend: "down", icon: "Search" },
    { id: "directions", label: "Direction Requests", value: "379", change: "+28%", trend: "up", icon: "Navigation" },
    { id: "calls", label: "Calls", value: "9", change: "-35%", trend: "down", icon: "PhoneCall" },
    { id: "website", label: "Website Visits", value: "8", change: "-27%", trend: "down", icon: "MousePointerClick" },
    { id: "chat", label: "Chat Clicks", value: "2", change: "+100%", trend: "up", icon: "MessageCircle" },
  ],
  topSearchTerms: [
    { term: "national lighting company (nlc) - factory#2, 106, dammam", count: 44 },
    { term: "nlc", count: 37 },
    { term: "national lighting company", count: 27 },
  ],
  source: "sample",
};

export interface MapsActionPoint {
  period: string;
  calls: number;
  directions: number;
  websiteClicks: number;
}

// Connect: customer-action time series from Google Business Profile.
export const mapsActionsTrend: MapsActionPoint[] = [
  { period: "Wk 1", calls: 128, directions: 980, websiteClicks: 1480 },
  { period: "Wk 2", calls: 142, directions: 1120, websiteClicks: 1620 },
  { period: "Wk 3", calls: 156, directions: 1240, websiteClicks: 1810 },
  { period: "Wk 4", calls: 138, directions: 1180, websiteClicks: 1740 },
  { period: "Wk 5", calls: 161, directions: 1300, websiteClicks: 1920 },
  { period: "Wk 6", calls: 149, directions: 1260, websiteClicks: 1880 },
];

export interface SearchKeywordRow {
  keyword: string;
  impressions: number;
  type: "Direct" | "Discovery";
}

// Connect: "searches that showed your profile" from Business Profile API.
export const searchKeywords: SearchKeywordRow[] = [
  { keyword: "lighting company saudi arabia", impressions: 18400, type: "Discovery" },
  { keyword: "national lighting company", impressions: 14200, type: "Direct" },
  { keyword: "led street lights supplier", impressions: 9600, type: "Discovery" },
  { keyword: "low current systems riyadh", impressions: 7300, type: "Discovery" },
  { keyword: "nlc dammam", impressions: 5100, type: "Direct" },
  { keyword: "industrial high bay lighting", impressions: 4400, type: "Discovery" },
  { keyword: "solar lighting jeddah", impressions: 3800, type: "Discovery" },
];

export interface CityActionRow {
  city: string;
  views: number;
  calls: number;
  directions: number;
}

// Connect: customer actions grouped by location/city (Business Profile API).
export const customerActionsByCity: CityActionRow[] = [
  { city: "Dammam", views: 18600, calls: 214, directions: 1640 },
  { city: "Riyadh", views: 16200, calls: 186, directions: 1380 },
  { city: "Jeddah", views: 11400, calls: 112, directions: 920 },
  { city: "Khobar", views: 7800, calls: 64, directions: 540 },
  { city: "Jubail", views: 4200, calls: 36, directions: 340 },
];

/* ============================================================================
 * 4) WEBSITE PERFORMANCE
 * ==========================================================================*/

// Connect: Google Analytics 4 (GA4 Data API — runReport).
export const websiteKpis: Kpi[] = [
  { id: "sessions", label: "Website Sessions", value: "94.7K", change: "+6.4%", trend: "up", icon: "MousePointer2" },
  { id: "new-users", label: "New Users", value: "61.3K", change: "+8.1%", trend: "up", icon: "UserPlus" },
  { id: "page-views", label: "Page Views", value: "342.6K", change: "+5.2%", trend: "up", icon: "FileText" },
  { id: "engagement-time", label: "Avg. Engagement Time", value: "2m 38s", change: "+12s", trend: "up", icon: "Clock" },
  { id: "form-submissions", label: "Form Submissions", value: "1,486", change: "+19.3%", trend: "up", icon: "ClipboardCheck" },
  { id: "catalog-downloads", label: "Catalog Downloads", value: "3,920", change: "+24.8%", trend: "up", icon: "Download" },
  { id: "product-visits", label: "Product Page Visits", value: "48.1K", change: "+9.6%", trend: "up", icon: "Package" },
];

export interface TrafficSourceRow {
  source: string;
  sessions: number;
}

// Connect: GA4 sessions grouped by sessionDefaultChannelGroup.
export const trafficSources: TrafficSourceRow[] = [
  { source: "Organic Search", sessions: 38600 },
  { source: "Direct", sessions: 21400 },
  { source: "Social", sessions: 17800 },
  { source: "Referral", sessions: 9100 },
  { source: "Paid Search", sessions: 5300 },
  { source: "Email", sessions: 2500 },
];

export interface TopPageRow {
  page: string;
  path: string;
  views: number;
  avgTime: string;
  bounceRate: string;
}

// Connect: GA4 page-level report (screenPageViews by pagePath).
export const topWebsitePages: TopPageRow[] = [
  { page: "Lighting", path: "/products.html", views: 48100, avgTime: "3m 12s", bounceRate: "34%" },
  { page: "Low Current Systems", path: "/low-current", views: 26400, avgTime: "2m 54s", bounceRate: "38%" },
  { page: "Low Voltage Systems", path: "/low-voltage", views: 19800, avgTime: "2m 41s", bounceRate: "41%" },
  { page: "Projects", path: "/projects.html", views: 17200, avgTime: "3m 28s", bounceRate: "29%" },
  { page: "Contact Us", path: "/contact", views: 12600, avgTime: "1m 49s", bounceRate: "46%" },
];

/* ============================================================================
 * 5) LEAD & INQUIRY PERFORMANCE
 * ==========================================================================*/

// Connect: blend of GA4 conversions, CRM, WhatsApp Business API and form backend.
export const leadKpis: Kpi[] = [
  { id: "total-leads", label: "Total Leads", value: "1,248", change: "+22.5%", trend: "up", icon: "Inbox" },
  { id: "whatsapp-clicks", label: "WhatsApp Clicks", value: "3,640", change: "+28.1%", trend: "up", icon: "MessageCircle" },
  { id: "form-submissions", label: "Contact Form Submissions", value: "1,486", change: "+19.3%", trend: "up", icon: "ClipboardCheck" },
  { id: "phone-calls", label: "Phone Calls", value: "612", change: "-3.2%", trend: "down", icon: "PhoneCall" },
  { id: "email-clicks", label: "Email Clicks", value: "894", change: "+7.6%", trend: "up", icon: "Mail" },
  { id: "conversion-rate", label: "Conversion Rate", value: "3.8%", change: "+0.6pp", trend: "up", icon: "Percent" },
];

// Connect: CRM funnel ratios + GA4 conversions vs. your monthly targets.
export const leadGauges: GaugeMetric[] = [
  { id: "conv-rate", label: "Conversion Rate", value: 3.8, max: 6, display: "3.8%", suffix: "of 6% target", caption: "lead → opportunity", color: "#F6851F" },
  { id: "lead-goal", label: "Monthly Lead Goal", value: 1248, max: 1500, display: "83%", suffix: "1,248 of 1,500", caption: "on track this month", color: "#24285e" },
  { id: "response", label: "Response Rate", value: 88, max: 100, display: "88%", suffix: "within 24h", caption: "+6 pts vs. last month", color: "#16a34a" },
];

export type LeadQuality = "High" | "Medium" | "Low";

export interface LeadSourceRow {
  source: string;
  leads: number;
  conversionRate: string;
  quality: LeadQuality;
}

// Connect: CRM attribution — leads grouped by first/last-touch source.
export const leadSources: LeadSourceRow[] = [
  { source: "Google Maps", leads: 462, conversionRate: "5.2%", quality: "High" },
  { source: "Website", leads: 388, conversionRate: "4.1%", quality: "High" },
  { source: "LinkedIn", leads: 246, conversionRate: "3.4%", quality: "Medium" },
  { source: "Instagram", leads: 152, conversionRate: "2.1%", quality: "Medium" },
];

export interface LeadTrendPoint {
  period: string;
  leads: number;
  conversions: number;
}

// Connect: lead volume vs. converted opportunities over time (CRM).
export const leadTrend: LeadTrendPoint[] = [
  { period: "Jan", leads: 142, conversions: 5 },
  { period: "Feb", leads: 158, conversions: 6 },
  { period: "Mar", leads: 176, conversions: 7 },
  { period: "Apr", leads: 168, conversions: 6 },
  { period: "May", leads: 204, conversions: 8 },
  { period: "Jun", leads: 232, conversions: 9 },
  { period: "Jul", leads: 248, conversions: 10 },
  { period: "Aug", leads: 268, conversions: 11 },
];
