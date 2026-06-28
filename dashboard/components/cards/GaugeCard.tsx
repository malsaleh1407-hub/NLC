import GaugeChart from "../charts/GaugeChart";
import type { GaugeMetric } from "@/data/mockData";

/**
 * Executive gauge card: a radial meter with a centered numeric readout, a
 * title and a helper caption. Reusable across sections.
 */
export default function GaugeCard({ gauge }: { gauge: GaugeMetric }) {
  return (
    <div className="group flex flex-col items-center rounded-2xl bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="relative h-36 w-full">
        <GaugeChart value={gauge.value} max={gauge.max} color={gauge.color} />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold tracking-tight"
            style={{ color: gauge.color }}
          >
            {gauge.display}
          </span>
          <span className="mt-0.5 text-[11px] text-slate-400">
            {gauge.suffix}
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm font-semibold text-navy">{gauge.label}</p>
      <p className="mt-0.5 text-center text-xs text-slate-400">
        {gauge.caption}
      </p>
    </div>
  );
}
