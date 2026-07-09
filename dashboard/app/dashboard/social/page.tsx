import ChartCard from "@/components/charts/ChartCard";
import LineTrendChart from "@/components/charts/LineTrendChart";
import DualAxisLineChart from "@/components/charts/DualAxisLineChart";
import BarSeriesChart from "@/components/charts/BarSeriesChart";
import DataTable, { type Column } from "@/components/tables/DataTable";
import PlatformChip from "@/components/PlatformChip";
import SectionHeading from "@/components/SectionHeading";
import Badge from "@/components/Badge";
import {
  followerGrowthByPlatform,
  engagementRateComparison,
  reachByPlatform,
  contentTypePerformance,
  linkedinTrend,
  topPerformingPosts,
  type TopPost,
} from "@/data/mockData";
import { BRAND, CHART_COLORS } from "@/lib/theme";
import { withCommas, prettyDate } from "@/lib/format";

/**
 * 2) SOCIAL MEDIA PERFORMANCE
 * Follower growth, engagement-rate & reach comparisons, content-type breakdown,
 * and a top-performing-posts table.
 * APIs to connect: LinkedIn, Instagram Graph, Facebook Graph, TikTok, YouTube
 * Data, X API v2 — see data/mockData.ts.
 */

const postColumns: Column<TopPost>[] = [
  {
    header: "Platform",
    cell: (r) => <PlatformChip platform={r.platform} />,
  },
  {
    header: "Post Title",
    cell: (r) => <span className="font-medium text-navy">{r.title}</span>,
  },
  { header: "Reach", align: "right", cell: (r) => withCommas(r.reach) },
  {
    header: "Engagement",
    align: "right",
    cell: (r) => withCommas(r.engagement),
  },
  { header: "Clicks", align: "right", cell: (r) => withCommas(r.clicks) },
  {
    header: "Date",
    align: "right",
    cell: (r) => <span className="text-slate-400">{prettyDate(r.date)}</span>,
  },
];

export default function SocialMediaPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        title="Social Media Performance"
        description="LinkedIn, Instagram, TikTok, YouTube, X and Facebook in one view."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Follower Growth by Platform"
          subtitle="Cumulative followers per channel"
        >
          <LineTrendChart
            data={followerGrowthByPlatform}
            xKey="period"
            series={[
              { key: "instagram", name: "Instagram", color: CHART_COLORS[0] },
              { key: "linkedin", name: "LinkedIn", color: CHART_COLORS[1] },
              { key: "facebook", name: "Facebook", color: CHART_COLORS[2] },
              { key: "tiktok", name: "TikTok", color: CHART_COLORS[3] },
              { key: "youtube", name: "YouTube", color: CHART_COLORS[4] },
              { key: "x", name: "X", color: CHART_COLORS[5] },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Engagement Rate Comparison"
          subtitle="Average engagement rate by platform (%)"
        >
          <BarSeriesChart
            data={engagementRateComparison}
            categoryKey="platform"
            layout="horizontal"
            colorByPoint
            valueFormat="percent"
            series={[{ key: "rate", name: "Engagement Rate", color: BRAND.navy }]}
          />
        </ChartCard>

        <ChartCard
          title="Reach by Platform"
          subtitle="Total accounts reached this period"
        >
          <BarSeriesChart
            data={reachByPlatform}
            categoryKey="platform"
            layout="horizontal"
            colorByPoint
            valueFormat="compact"
            series={[{ key: "reach", name: "Reach", color: BRAND.orange }]}
          />
        </ChartCard>

        <ChartCard
          title="Content Type Performance"
          subtitle="Engagement vs. reach by content format"
        >
          <BarSeriesChart
            data={contentTypePerformance}
            categoryKey="type"
            valueFormat="compact"
            series={[
              { key: "reach", name: "Reach", color: BRAND.navy },
              { key: "engagement", name: "Engagement", color: BRAND.orange },
            ]}
          />
        </ChartCard>
      </div>

      <section>
        <SectionHeading
          title="LinkedIn Analytics"
          description="Impressions, reactions, comments, reposts, visitors and followers over time."
        />
        <ChartCard
          title="LinkedIn Performance Over Time"
          subtitle="Left axis: impressions, followers, visitors · Right axis: reactions, comments, reposts"
          bodyHeight={360}
        >
          <DualAxisLineChart
            data={linkedinTrend}
            xKey="period"
            series={[
              // Left axis — high-volume audience & reach metrics
              { key: "impressions", name: "Impressions", color: "#24285e", axis: "left" },
              { key: "followers", name: "Followers", color: "#5a5fa8", axis: "left" },
              { key: "visitors", name: "Visitors", color: "#9aa0d6", axis: "left" },
              // Right axis — engagement metrics (smaller scale)
              { key: "reactions", name: "Reactions", color: "#F6851F", axis: "right" },
              { key: "comments", name: "Comments", color: "#d96d0c", axis: "right" },
              { key: "reposts", name: "Reposts", color: "#ffb066", axis: "right" },
            ]}
          />
        </ChartCard>
      </section>

      <section>
        <SectionHeading title="Top Performing Posts" />
        <div className="rounded-2xl bg-white p-2 shadow-card sm:p-3">
          <DataTable
            columns={postColumns}
            rows={topPerformingPosts}
            rowKey={(_, i) => i}
          />
        </div>
        <p className="mt-3 pl-1 text-xs text-slate-400">
          <Badge tone="orange">Tip</Badge>{" "}
          Video / Reels content drives the highest engagement-to-reach ratio.
        </p>
      </section>
    </div>
  );
}
