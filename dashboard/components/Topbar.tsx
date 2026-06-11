"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import DateRangeSelector from "./DateRangeSelector";

/** Sticky top bar: mobile menu toggle, section title, and date range. */
export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();

  // Resolve current section title from the nav config (longest match wins).
  const active =
    [...NAV_ITEMS]
      .sort((a, b) => b.href.length - a.href.length)
      .find((i) =>
        i.href === "/dashboard"
          ? pathname === "/dashboard"
          : pathname.startsWith(i.href)
      ) ?? NAV_ITEMS[0];

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200/70 bg-canvas/85 px-4 py-3.5 backdrop-blur-md sm:px-6 lg:px-8">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-navy transition-colors hover:bg-navy/5 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          NLC Digital Performance
        </p>
        <h1 className="truncate text-lg font-bold text-navy">{active.label}</h1>
      </div>

      <div className="ml-auto">
        <DateRangeSelector />
      </div>
    </header>
  );
}
