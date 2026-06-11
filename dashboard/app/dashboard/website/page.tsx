import KpiGrid from "@/components/cards/KpiGrid";
import ChartCard from "@/components/charts/ChartCard";
import DonutChart from "@/components/charts/DonutChart";
import DataTable, { type Column } from "@/components/tables/DataTable";
import SectionHeading from "@/components/SectionHeading";
import {
  websiteKpis,
  trafficSources,
  topWebsitePages,
  type TopPageRow,
} from "@/data/mockData";
import { withCommas } from "@/lib/format";

/**
 * 4) WEBSITE PERFORMANCE
 * Web KPIs, traffic-source mix, and a top-pages table.
 * API to connect: Google Analytics 4 (GA4 Data API) — see data/mockData.ts.
 */

const pageColumns: Column<TopPageRow>[] = [
  {
    header: "Page",
    cell: (r) => (
      <div>
        <p className="font-medium text-navy">{r.page}</p>
        <p className="text-xs text-slate-400">{r.path}</p>
      </div>
    ),
  },
  { header: "Views", align: "right", cell: (r) => withCommas(r.views) },
  { header: "Avg. Time", align: "right", cell: (r) => r.avgTime },
  {
    header: "Bounce Rate",
    align: "right",
    cell: (r) => <span className="text-slate-500">{r.bounceRate}</span>,
  },
];

export default function WebsitePage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        title="Website Performance"
        description="Traffic, engagement and conversions for nlc.com.sa."
      />

      <KpiGrid kpis={websiteKpis} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ChartCard
            title="Traffic Sources"
            subtitle="Sessions by channel"
            bodyHeight={320}
            className="h-full"
          >
            <DonutChart data={trafficSources.map((t) => ({ name: t.source, value: t.sessions }))} />
          </ChartCard>
        </div>

        <div className="lg:col-span-3">
          <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover sm:p-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-navy">
                Top Website Pages
              </h3>
              <p className="mt-0.5 text-sm text-slate-400">
                Most-visited pages this period
              </p>
            </div>
            <DataTable
              columns={pageColumns}
              rows={topWebsitePages}
              rowKey={(r) => r.path}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
