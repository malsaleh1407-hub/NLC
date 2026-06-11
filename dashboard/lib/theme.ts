/**
 * Centralized brand + chart styling tokens.
 * Keep this in sync with tailwind.config.ts and the main NLC site (CLAUDE.md).
 */

export const BRAND = {
  navy: "#24285e",
  orange: "#F6851F",
  canvas: "#F0EFEF",
} as const;

// Ordered palette for multi-series charts. Navy and orange lead; the rest are
// muted, executive-friendly tints that read well on white cards.
export const CHART_COLORS = [
  "#24285e", // navy
  "#F6851F", // orange
  "#5a5fa8", // soft indigo
  "#ffb066", // light orange
  "#2c3170", // navy 700
  "#9aa0d6", // pale indigo
  "#d96d0c", // dark orange
  "#c7cae8", // very pale indigo
] as const;

// Shared Recharts axis / grid styling so every chart looks consistent.
export const AXIS_STYLE = {
  tick: { fill: "#6b7090", fontSize: 12 },
  axisLine: { stroke: "#e3e4ee" },
  tickLine: false as const,
};

export const GRID_STYLE = {
  stroke: "#eceaef",
  strokeDasharray: "3 3",
} as const;
