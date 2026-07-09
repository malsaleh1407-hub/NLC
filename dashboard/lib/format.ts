/** Shared number formatting helpers for charts, tables and tooltips. */

/** 1240000 -> "1.24M", 58200 -> "58.2K", 612 -> "612". */
export function compact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

/** 38600 -> "38,600". */
export function withCommas(n: number): string {
  return n.toLocaleString("en-US");
}

/** ISO date string -> "28 May 2026". */
export function prettyDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
