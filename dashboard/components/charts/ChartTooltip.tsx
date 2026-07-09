"use client";

import type { TooltipProps } from "recharts";
import { compact } from "@/lib/format";

/**
 * Shared, branded Recharts tooltip. Compact-formats numeric values and shows a
 * colored dot per series. Used by every chart for visual consistency.
 */
export default function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = compact,
}: TooltipProps<number, string> & {
  valueFormatter?: (n: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-card-hover">
      {label !== undefined && (
        <p className="mb-1.5 text-xs font-semibold text-navy">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-500">{entry.name}</span>
            <span className="ml-auto font-semibold text-navy">
              {typeof entry.value === "number"
                ? valueFormatter(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
