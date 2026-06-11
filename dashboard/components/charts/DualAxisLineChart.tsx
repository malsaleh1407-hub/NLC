"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import { AXIS_STYLE, GRID_STYLE } from "@/lib/theme";
import { compact } from "@/lib/format";

export interface DualAxisSeries {
  key: string;
  name: string;
  color: string;
  /** Which Y-axis this series binds to. Defaults to "left". */
  axis?: "left" | "right";
}

/**
 * Multi-series line chart with two independent Y-axes, so metrics with very
 * different scales (e.g. Impressions in the hundreds of thousands vs. Reposts
 * in the hundreds) stay readable on a single chart.
 * Used by the LinkedIn analytics section.
 */
export default function DualAxisLineChart({
  data,
  xKey,
  series,
}: {
  data: object[];
  xKey: string;
  series: DualAxisSeries[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} {...GRID_STYLE} />
        <XAxis dataKey={xKey} {...AXIS_STYLE} />
        <YAxis
          yAxisId="left"
          tickFormatter={compact}
          width={48}
          {...AXIS_STYLE}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={compact}
          width={48}
          {...AXIS_STYLE}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        {series.map((s) => (
          <Line
            key={s.key}
            yAxisId={s.axis ?? "left"}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
