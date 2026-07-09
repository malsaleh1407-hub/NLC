import type { ReactNode } from "react";

/**
 * Reusable white chart card wrapper.
 * Provides the title, optional subtitle, optional top-right action slot,
 * and a fixed-height body for the chart itself.
 */
export default function ChartCard({
  title,
  subtitle,
  action,
  children,
  className = "",
  bodyHeight = 320,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyHeight?: number;
}) {
  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover sm:p-6 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-navy">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div style={{ height: bodyHeight }} className="w-full">
        {children}
      </div>
    </div>
  );
}
