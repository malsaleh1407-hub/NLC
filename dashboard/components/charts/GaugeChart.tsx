"use client";

import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

/**
 * Single-value radial gauge meter. Renders a 260° arc that fills proportionally
 * to value/max, over a light track. The numeric readout is overlaid by the
 * parent (GaugeCard) so it stays perfectly centered.
 */
export default function GaugeChart({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const data = [{ name: "value", value: pct, fill: color }];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart
        data={data}
        innerRadius="74%"
        outerRadius="100%"
        startAngle={230}
        endAngle={-50}
        barSize={16}
      >
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          angleAxisId={0}
          tick={false}
        />
        <RadialBar
          background={{ fill: "#eef0f7" }}
          dataKey="value"
          cornerRadius={20}
          angleAxisId={0}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
