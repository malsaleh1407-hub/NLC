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

export interface LineSeries {
  key: string;
  name: string;
  color: string;
}

/**
 * Reusable multi-series line chart.
 * Used by follower growth by platform and Google Maps customer-action trends.
 */
export default function LineTrendChart({
  data,
  xKey,
  series,
}: {
  data: object[];
  xKey: string;
  series: LineSeries[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} {...GRID_STYLE} />
        <XAxis dataKey={xKey} {...AXIS_STYLE} />
        <YAxis tickFormatter={compact} {...AXIS_STYLE} width={48} />
        <Tooltip content={<ChartTooltip />} />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        {series.map((s) => (
          <Line
            key={s.key}
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
