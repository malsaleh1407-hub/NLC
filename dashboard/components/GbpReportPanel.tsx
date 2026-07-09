import { getIcon } from "@/lib/icon";
import { getGbpReport } from "@/lib/gbp";

/**
 * "Latest Google Business Profile Report" panel.
 * Server component — fetches the live monthly report from the Google Business
 * Profile Performance API when GBP_* env vars are set (see GBP-SETUP.md), and
 * falls back to the bundled sample digest otherwise. A badge in the header
 * shows which source is being displayed.
 */
export default async function GbpReportPanel() {
  const r = await getGbpReport();

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-card">
      {/* Navy header strip */}
      <div className="flex flex-col gap-3 bg-navy px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-white/55">
            Latest Google Business Profile Report
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal ${
                r.source === "live"
                  ? "bg-emerald-400/15 text-emerald-300"
                  : "bg-orange/20 text-orange-light"
              }`}
            >
              {r.source === "live" ? "Live" : "Sample"}
            </span>
          </p>
          <h3 className="text-base font-bold text-white">
            {r.period} · {r.location}
          </h3>
        </div>
        <div className="flex items-center gap-2.5 self-start rounded-xl bg-white/10 px-4 py-2 sm:self-auto">
          <span className="text-2xl font-bold text-white">
            {r.totalInteractions}
          </span>
          <span className="text-[11px] leading-tight text-white/70">
            total
            <br />
            interactions
          </span>
        </div>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-3 lg:grid-cols-6">
        {r.metrics.map((m) => {
          const Icon = getIcon(m.icon);
          const isDown = m.trend === "down";
          return (
            <div
              key={m.id}
              className="bg-white p-4 transition-colors hover:bg-navy/[0.015]"
            >
              <div className="flex items-center gap-1.5">
                <Icon size={15} className="text-orange" strokeWidth={2} />
                <span className="text-xs font-medium text-slate-500">
                  {m.label}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-navy">{m.value}</p>
              <span
                className={`text-xs font-semibold ${
                  isDown ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {m.change}
                <span className="ml-1 font-normal text-slate-400">
                  vs. prev. month
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Top search terms */}
      <div className="border-t border-slate-100 p-5 sm:p-6">
        <p className="mb-3 text-sm font-semibold text-navy">Top search terms</p>
        <ol className="space-y-2">
          {r.topSearchTerms.map((t, i) => (
            <li key={t.term} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy/5 text-xs font-bold text-navy">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
                {t.term}
              </span>
              <span className="shrink-0 rounded-full bg-orange/10 px-2.5 py-0.5 text-xs font-semibold text-orange-dark">
                {t.count}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <p className="px-5 pb-4 text-[11px] text-slate-400 sm:px-6">
        {r.source === "live"
          ? "Source: Google Business Profile Performance API — refreshes automatically (6-hour cache). Single location; more branches can be added in lib/gbp.ts."
          : "Sample data from the GBP email digest. Add GBP_* credentials (see GBP-SETUP.md) to switch this panel to live API data."}
      </p>
    </section>
  );
}
