import KpiGrid from "@/components/cards/KpiGrid";
import ChartCard from "@/components/charts/ChartCard";
import LineTrendChart from "@/components/charts/LineTrendChart";
import BarSeriesChart from "@/components/charts/BarSeriesChart";
import DataTable, { type Column } from "@/components/tables/DataTable";
import SectionHeading from "@/components/SectionHeading";
import GbpReportPanel from "@/components/GbpReportPanel";
import Badge from "@/components/Badge";
import {
  googleMapsKpis,
  mapsActionsTrend,
  searchKeywords,
  customerActionsByCity,
  type SearchKeywordRow,
} from "@/data/mockData";
import { BRAND, CHART_COLORS } from "@/lib/theme";
import { withCommas } from "@/lib/format";

/**
 * 3) GOOGLE MAPS / BUSINESS PROFILE
 * Profile KPIs, customer-action trends, search keyword table, and a
 * per-city customer-actions breakdown.
 * API to connect: Google Business Profile API — see data/mockData.ts.
 */

const keywordColumns: Column<SearchKeywordRow>[] = [
  {
    header: "Search Keyword",
    cell: (r) => <span className="font-medium text-navy">{r.keyword}</span>,
  },
  {
    header: "Type",
    cell: (r) => (
      <Badge tone={r.type === "Direct" ? "navy" : "orange"}>{r.type}</Badge>
    ),
  },
  {
    header: "Impressions",
    align: "right",
    cell: (r) => withCommas(r.impressions),
  },
];

export default function GoogleMapsPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        title="Google Maps / Business Profile"
        description="How customers find and act on NLC Business Profiles across locations."
      />

      <GbpReportPanel />

      <SectionHeading
        title="All Locations — Overview"
        description="Aggregate Business Profile performance across all NLC branches."
      />

      <KpiGrid kpis={googleMapsKpis} />

      <ChartCard
        title="Calls, Directions & Website Clicks"
        subtitle="Customer actions over time"
        bodyHeight={320}
      >
        <LineTrendChart
          data={mapsActionsTrend}
          xKey="period"
          series={[
            { key: "websiteClicks", name: "Website Clicks", color: BRAND.navy },
            { key: "directions", name: "Direction Requests", color: BRAND.orange },
            { key: "calls", name: "Phone Calls", color: CHART_COLORS[2] },
          ]}
        />
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section>
          <SectionHeading title="Search Keywords" />
          <div className="rounded-2xl bg-white p-2 shadow-card sm:p-3">
            <DataTable
              columns={keywordColumns}
              rows={searchKeywords}
              rowKey={(r) => r.keyword}
            />
          </div>
        </section>

        <ChartCard
          title="Customer Actions by City"
          subtitle="Profile views, calls and directions per location"
        >
          <BarSeriesChart
            data={customerActionsByCity}
            categoryKey="city"
            valueFormat="compact"
            series={[
              { key: "views", name: "Profile Views", color: BRAND.navy },
              { key: "directions", name: "Directions", color: BRAND.orange },
              { key: "calls", name: "Calls", color: CHART_COLORS[2] },
            ]}
          />
        </ChartCard>
      </div>
    </div>
  );
}
