import KpiGrid from "@/components/cards/KpiGrid";
import GaugeCard from "@/components/cards/GaugeCard";
import PlatformCard from "@/components/cards/PlatformCard";
import HeroBanner from "@/components/HeroBanner";
import ChartCard from "@/components/charts/ChartCard";
import AreaTrendChart from "@/components/charts/AreaTrendChart";
import SectionHeading from "@/components/SectionHeading";
import {
  executiveKpis,
  executiveGauges,
  performanceTrend,
  platformSummaries,
} from "@/data/mockData";
import { BRAND } from "@/lib/theme";

/**
 * 1) EXECUTIVE OVERVIEW
 * Gradient hero, top-line KPIs, performance gauges, a multi-metric performance
 * trend, and a per-platform summary.
 * Data: data/mockData.ts -> executiveKpis, executiveGauges, performanceTrend,
 * platformSummaries.
 */
export default function ExecutiveOverviewPage() {
  return (
    <div className="space-y-8">
      <HeroBanner
        stats={[
          { label: "Total Reach", value: "2.84M", delta: "+14.2%" },
          { label: "Engagement", value: "186.4K", delta: "+9.7%" },
          { label: "Leads", value: "1,248", delta: "+22.5%" },
          { label: "Avg. Rating", value: "4.7", delta: "+0.2" },
        ]}
      />

      <section>
        <SectionHeading
          title="Key Metrics"
          description="Consolidated digital performance across social, search, web and lead channels."
        />
        <KpiGrid kpis={executiveKpis} />
      </section>

      <section>
        <SectionHeading
          title="Performance Gauges"
          description="Progress against targets and quality benchmarks at a glance."
        />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {executiveGauges.map((g) => (
            <GaugeCard key={g.id} gauge={g} />
          ))}
        </div>
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
