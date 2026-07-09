"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getIcon } from "@/lib/icon";
import { NAV_ITEMS } from "@/lib/nav";

/**
 * Navy executive sidebar. On desktop it is fixed; on mobile it slides in
 * from the left as an overlay (controlled by the parent layout).
 */
export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-navy/40 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-b from-navy-900 via-navy to-navy-900 text-white shadow-xl transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand / wordmark (text only — no logo per brief) */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange font-bold text-white">
            N
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-wide">NLC</p>
            <p className="text-[11px] text-white/60">Performance Dashboard</p>
          </div>
        </div>

        <nav className="nlc-scroll mt-2 flex-1 space-y-1 overflow-y-auto px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = getIcon(item.icon);
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={2}
                  className={active ? "text-orange" : ""}
                />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-orange" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-5 text-[11px] leading-relaxed text-white/40">
          <p className="font-semibold text-white/60">National Lighting Co.</p>
          <p>Mock data — connect live APIs in /data/mockData.ts</p>
        </div>
      </aside>
    </>
  );
}
