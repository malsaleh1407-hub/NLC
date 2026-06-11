"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import { CHART_COLORS } from "@/lib/theme";
import { withCommas } from "@/lib/format";

export interface DonutDatum {
  name: string;
  value: number;
}

/**
 * Reusable donut/pie chart. Used by website traffic sources.
 */
export default function DonutChart({
  data,
  nameKey = "name",
  valueKey = "value",
}: {
  data: DonutDatum[];
  nameKey?: string;
  valueKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          stroke="none"
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip valueFormatter={withCommas} />} />
        <Legend
          iconType="circle"
          layout="vertical"
          align="right"
          verticalAlign="middle"
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
