import { TrendingUp } from "lucide-react";

interface HeroStat {
  label: string;
  value: string;
  delta: string;
}

/**
 * Premium gradient hero for the Executive Overview. Sets an executive tone with
 * a navy→indigo gradient, a soft glow accent, and a row of headline stats.
 */
export default function HeroBanner({ stats }: { stats: HeroStat[] }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-[#2c3170] to-[#3a3f86] p-6 text-white shadow-card sm:p-8">
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-orange/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-white/15">
            <span className="h-1.5 w-1.5 rounded-full bg-orange" />
            Live performance snapshot
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          NLC Digital Performance
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-white/70">
          A unified, executive view of reach, engagement, search visibility and
          inbound demand across every National Lighting Company channel.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-navy/30 px-4 py-3.5 backdrop-blur-sm">
              <p className="text-xs text-white/60">{s.label}</p>
              <p className="mt-1 text-xl font-bold">{s.value}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-emerald-300">
                <TrendingUp size={12} />
                {s.delta}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
