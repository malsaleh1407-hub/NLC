import { NextResponse } from "next/server";
import { getGbpReport } from "@/lib/gbp";

/**
 * GET /api/gbp
 * Returns the latest Google Business Profile monthly report as JSON —
 * live data when GBP_* env vars are configured, the bundled sample otherwise
 * (the `source` field tells you which). Credentials stay server-side; this
 * route never exposes tokens to the browser.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const report = await getGbpReport();
  return NextResponse.json(report);
}
