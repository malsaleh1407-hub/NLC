"use client";

import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { DATE_RANGES, type DateRangeKey } from "@/data/mockData";

/**
 * Date range selector. Currently a local-state control over the mock ranges.
 * When wiring real APIs, lift `value` to the page (or a context/store) and pass
 * the selected `DateRangeKey` into your data-fetching calls.
 */
export default function DateRangeSelector({
  value,
  onChange,
}: {
  value?: DateRangeKey;
  onChange?: (key: DateRangeKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<DateRangeKey>("12m");
  const selected = value ?? internal;
  const current = DATE_RANGES.find((r) => r.key === selected) ?? DATE_RANGES[3];

  const select = (key: DateRangeKey) => {
    setInternal(key);
    onChange?.(key);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-navy shadow-sm transition-colors hover:border-orange/60"
      >
        <Calendar size={16} className="text-orange" />
        <span>{current.label}</span>
        <ChevronDown
          size={15}
          className={`text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-card-hover">
            {DATE_RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => select(r.key)}
                className={`flex w-full items-center px-4 py-2 text-sm transition-colors hover:bg-navy/5 ${
                  r.key === selected
                    ? "font-semibold text-orange"
                    : "text-slate-600"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
