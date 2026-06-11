import KpiGrid from "@/components/cards/KpiGrid";
import PlatformCard from "@/components/cards/PlatformCard";
import ChartCard from "@/components/charts/ChartCard";
import AreaTrendChart from "@/components/charts/AreaTrendChart";
import SectionHeading from "@/components/SectionHeading";
import {
  executiveKpis,
  performanceTrend,
  platformSummaries,
} from "@/data/mockData";
import { BRAND } from "@/lib/theme";

/**
 * 1) EXECUTIVE OVERVIEW
 * Top-line KPIs, a multi-metric performance trend, and a per-platform summary.
 * Data: data/mockData.ts -> executiveKpis, performanceTrend, platformSummaries.
 */
export default function ExecutiveOverviewPage() {
  return (
    <div className="space-y-8">
      <section>
        <SectionHeading
          title="Executive Overview"
          description="Consolidated digital performance across social, search, web and lead channels."
        />
        <KpiGrid kpis={executiveKpis} />
      </section>

      <section>
        <ChartCard
          title="Performance Trend"
          subtitle="Reach, engagement and website visits over time"
          bodyHeight={340}
        >
          <AreaTrendChart
            data={performanceTrend}
            xKey="period"
            series={[
              { key: "reach", name: "Reach", color: BRAND.navy },
              { key: "engagement", name: "Engagement", color: BRAND.orange },
              { key: "visits", name: "Website Visits", color: "#5a5fa8" },
            ]}
          />
        </ChartCard>
      </section>

      <section>
        <SectionHeading
          title="Platform Summary"
          description="Followers, reach and engagement rate by channel."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {platformSummaries.map((p) => (
            <PlatformCard key={p.key} data={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
