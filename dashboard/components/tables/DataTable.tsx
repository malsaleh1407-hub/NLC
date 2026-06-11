import type { ReactNode } from "react";

export interface Column<T> {
  /** Header label. */
  header: string;
  /** Cell renderer — receives the full row. */
  cell: (row: T) => ReactNode;
  /** Optional alignment; defaults to left. */
  align?: "left" | "right" | "center";
  /** Optional extra className for the cell. */
  className?: string;
}

/**
 * Reusable, responsive data table with a branded header row.
 * Generic over the row type so any dataset can be rendered.
 */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
}) {
  const alignClass = (a?: Column<T>["align"]) =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  return (
    <div className="overflow-x-auto nlc-scroll">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 ${alignClass(
                  col.align
                )}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={rowKey(row, ri)}
              className="border-b border-slate-50 transition-colors last:border-0 hover:bg-navy/[0.025]"
            >
              {columns.map((col, ci) => (
                <td
                  key={ci}
                  className={`whitespace-nowrap px-4 py-3.5 text-slate-600 ${alignClass(
                    col.align
                  )} ${col.className ?? ""}`}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
