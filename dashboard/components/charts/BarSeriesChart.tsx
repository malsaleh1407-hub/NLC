"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import { AXIS_STYLE, GRID_STYLE, CHART_COLORS } from "@/lib/theme";
import { compact, withCommas } from "@/lib/format";

export interface BarSeries {
  key: string;
  name: string;
  color: string;
}

/**
 * Value formats are passed as plain strings (not functions) so this client
 * component can be used directly from Server Components without serialization
 * errors. The actual formatter is resolved here.
 */
export type ValueFormat = "compact" | "comma" | "percent";

const FORMATTERS: Record<ValueFormat, (n: number) => string> = {
  compact,
  comma: withCommas,
  percent: (n) => `${n}%`,
};

/**
 * Reusable bar chart supporting:
 *  - vertical (default) or horizontal layout
 *  - one or many series (grouped bars)
 *  - per-bar coloring for single-series charts (set `colorByPoint`)
 *
 * Used by engagement-rate comparison, reach by platform, content-type
 * performance and traffic sources.
 */
export default function BarSeriesChart({
  data,
  categoryKey,
  series,
  layout = "vertical",
  colorByPoint = false,
  valueFormat = "compact",
}: {
  data: object[];
  categoryKey: string;
  series: BarSeries[];
  /** "vertical" = upright bars; "horizontal" = bars run left→right. */
  layout?: "vertical" | "horizontal";
  colorByPoint?: boolean;
  valueFormat?: ValueFormat;
}) {
  const isHorizontal = layout === "horizontal";
  const valueFormatter = FORMATTERS[valueFormat];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout={isHorizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 12, left: isHorizontal ? 8 : -8, bottom: 0 }}
        barCategoryGap={isHorizontal ? "24%" : "30%"}
      >
        <CartesianGrid
          vertical={isHorizontal}
          horizontal={!isHorizontal}
          {...GRID_STYLE}
        />
        {isHorizontal ? (
          <>
            <XAxis type="number" tickFormatter={valueFormatter} {...AXIS_STYLE} />
            <YAxis
              type="category"
              dataKey={categoryKey}
              width={120}
              {...AXIS_STYLE}
            />
          </>
        ) : (
          <>
            <XAxis dataKey={categoryKey} {...AXIS_STYLE} />
            <YAxis tickFormatter={valueFormatter} width={48} {...AXIS_STYLE} />
          </>
        )}
        <Tooltip
          cursor={{ fill: "rgba(36,40,94,0.04)" }}
          content={<ChartTooltip valueFormatter={valueFormatter} />}
        />
        {series.length > 1 && (
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
        )}
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={s.color}
            radius={isHorizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            maxBarSize={48}
          >
            {colorByPoint &&
              data.map((_, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
