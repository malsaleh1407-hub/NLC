"use client";

import { useEffect } from "react";

/**
 * Client-side redirect to the dashboard, used in static-export builds where the
 * server `redirect()` isn't available. Uses a relative path so it works under a
 * GitHub Pages base path (/NLC) as well as at the domain root.
 */
export default function RedirectHome() {
  useEffect(() => {
    window.location.replace("dashboard/");
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas">
      <a href="dashboard/" className="text-navy underline">
        Open the NLC Digital Performance Dashboard
      </a>
    </main>
  );
}
