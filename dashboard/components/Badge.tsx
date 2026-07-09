import type { ReactNode } from "react";

type Tone = "navy" | "orange" | "green" | "amber" | "rose" | "slate";

const TONES: Record<Tone, string> = {
  navy: "bg-navy/5 text-navy",
  orange: "bg-orange/10 text-orange-dark",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-600",
};

/** Small pill label used for lead quality, search type, etc. */
export default function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
