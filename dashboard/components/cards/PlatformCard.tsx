import { getIcon } from "@/lib/icon";
import type { PlatformSummary } from "@/data/mockData";

/**
 * Compact per-platform summary card for the Executive Overview.
 */
export default function PlatformCard({ data }: { data: PlatformSummary }) {
  const Icon = getIcon(data.icon);
  const isDown = data.trend === "down";

  return (
    <div className="group flex flex-col rounded-2xl bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: data.color }}
        >
          <Icon size={18} strokeWidth={2} />
        </span>
        <div>
          <p className="text-sm font-semibold text-navy">{data.name}</p>
          <p className="text-xs text-slate-400">{data.followers} followers</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-400">Reach</p>
          <p className="text-base font-bold text-navy">{data.reach}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Eng. rate</p>
          <p className="text-base font-bold text-navy">{data.engagementRate}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3">
        <span
          className={`text-xs font-semibold ${
            isDown ? "text-rose-600" : "text-emerald-600"
          }`}
        >
          {data.change}
        </span>
        <span className="text-xs text-slate-400">vs. prev. period</span>
      </div>
    </div>
  );
}
