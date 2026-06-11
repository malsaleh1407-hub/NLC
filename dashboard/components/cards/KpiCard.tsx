import { getIcon } from "@/lib/icon";
import type { Kpi } from "@/data/mockData";

/**
 * Reusable executive KPI card.
 * Used across every dashboard section — pass a single `Kpi` object.
 */
export default function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = getIcon(kpi.icon);
  const isUp = kpi.trend === "up";
  const isDown = kpi.trend === "down";

  const trendColor = isUp
    ? "text-emerald-600 bg-emerald-50"
    : isDown
    ? "text-rose-600 bg-rose-50"
    : "text-slate-500 bg-slate-100";

  return (
    <div className="group rounded-2xl bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy/5 text-navy transition-colors group-hover:bg-navy group-hover:text-white">
          <Icon size={20} strokeWidth={2} />
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${trendColor}`}
        >
          {kpi.change}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold tracking-tight text-navy">
          {kpi.value}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-600">{kpi.label}</p>
        {kpi.caption && (
          <p className="mt-0.5 text-xs text-slate-400">{kpi.caption}</p>
        )}
      </div>

      {/* Accent underline that grows on hover */}
      <div className="mt-4 h-1 w-8 rounded-full bg-orange transition-all duration-300 group-hover:w-16" />
    </div>
  );
}
