import KpiCard from "./KpiCard";
import type { Kpi } from "@/data/mockData";

/**
 * Responsive grid wrapper for a set of KPI cards.
 * 1 col on mobile → 2 on small → 3 on large → 4 on xl.
 */
export default function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
