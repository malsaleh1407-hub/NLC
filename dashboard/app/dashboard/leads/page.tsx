import KpiGrid from "@/components/cards/KpiGrid";
import GaugeCard from "@/components/cards/GaugeCard";
import ChartCard from "@/components/charts/ChartCard";
import LineTrendChart from "@/components/charts/LineTrendChart";
import DataTable, { type Column } from "@/components/tables/DataTable";
import SectionHeading from "@/components/SectionHeading";
import Badge from "@/components/Badge";
import {
  leadKpis,
  leadGauges,
  leadSources,
  leadTrend,
  type LeadSourceRow,
} from "@/data/mockData";
import { BRAND } from "@/lib/theme";

/**
 * 5) LEAD & INQUIRY PERFORMANCE
 * Lead KPIs, lead-volume trend, and a source-attribution table with quality.
 * APIs to connect: GA4 conversions + CRM + WhatsApp Business API + form backend.
 */

const sourceColumns: Column<LeadSourceRow>[] = [
  {
    header: "Source",
    cell: (r) => <span className="font-medium text-navy">{r.source}</span>,
  },
  { header: "Leads", align: "right", cell: (r) => r.leads.toLocaleString() },
  {
    header: "Conversion Rate",
    align: "right",
    cell: (r) => <span className="font-semibold text-navy">{r.conversionRate}</span>,
  },
  {
    header: "Quality",
    align: "right",
    cell: (r) => (
      <Badge
        tone={
          r.quality === "High"
            ? "green"
            : r.quality === "Medium"
            ? "amber"
            : "rose"
        }
      >
        {r.quality}
      </Badge>
    ),
  },
];

export default function LeadsPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        title="Lead & Inquiry Performance"
        description="Inbound demand across every contact channel, with source quality."
      />

      <KpiGrid kpis={leadKpis} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {leadGauges.map((g) => (
          <GaugeCard key={g.id} gauge={g} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChartCard
            title="Lead Volume Trend"
            subtitle="Total leads vs. converted opportunities"
            bodyHeight={320}
            className="h-full"
          >
            <LineTrendChart
              data={leadTrend}
              xKey="period"
              series={[
                { key: "leads", name: "Total Leads", color: BRAND.navy },
                { key: "conversions", name: "Conversions", color: BRAND.orange },
              ]}
            />
          </ChartCard>
        </div>

        <div className="lg:col-span-2">
          <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover sm:p-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-navy">
                Leads by Source
              </h3>
              <p className="mt-0.5 text-sm text-slate-400">
                Volume, conversion rate and quality
              </p>
            </div>
            <DataTable
              columns={sourceColumns}
              rows={leadSources}
              rowKey={(r) => r.source}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
