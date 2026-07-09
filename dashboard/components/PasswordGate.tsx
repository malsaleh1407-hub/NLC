"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";

/**
 * Lightweight, FREE password gate for the whole dashboard.
 *
 * Set the password via the NEXT_PUBLIC_DASHBOARD_PASSWORD env var, or just
 * change the fallback string below. Once entered correctly it's remembered in
 * this browser (localStorage) so the team isn't prompted every visit.
 *
 * Security note: this is a client-side gate — a reasonable deterrent for an
 * internal team dashboard, but not bank-grade (the check runs in the browser).
 * For stronger protection later we can move it to a Netlify Edge Function or
 * Netlify's built-in password (paid). For an internal KPI page this is fine.
 */
const PASSWORD = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || "NLC@2026";
const STORAGE_KEY = "nlc_dash_auth_v1";

export default function PasswordGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1") {
      setAuthed(true);
    }
    setReady(true);
  }, []);

  // Avoid a flash of the login screen before we've checked localStorage.
  if (!ready) return null;
  if (authed) return <>{children}</>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "1");
      setAuthed(true);
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-900 via-navy to-[#3a3f86] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-card-hover">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white">
          <Lock size={22} />
        </div>
        <h1 className="mt-5 text-center text-lg font-bold text-navy">
          NLC Performance Dashboard
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Enter the team password to continue.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="password"
            value={value}
            autoFocus
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange ${
              error ? "border-rose-400" : "border-slate-200"
            }`}
          />
          {error && (
            <p className="text-xs font-medium text-rose-600">
              Incorrect password. Please try again.
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-orange py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-dark"
          >
            Open Dashboard
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-slate-400">
          National Lighting Company — internal use only
        </p>
      </div>
    </div>
  );
}
