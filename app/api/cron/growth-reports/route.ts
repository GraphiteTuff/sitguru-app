import { NextRequest, NextResponse } from "next/server";
import { growthReportCronPeriods, growthReportFilters } from "@/lib/growth-center-v2/report-periods";
import { loadGrowthCenterSnapshot } from "@/lib/growth-center-v2/snapshot";
import { saveGrowthReportToMicrosoft365 } from "@/lib/growth-center-v2/report-sharepoint";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Runs at 06:15 UTC, after the preceding Eastern calendar day has closed.
 * Every run records yesterday. Monday also records the Sunday week ending;
 * the first of each month additionally records the month that just ended.
 *
 * Application Graph can write SharePoint, but cannot post Teams channel
 * messages. Publishing to Teams requires a separate delegated/Workflow flow.
 */
export async function GET(request: NextRequest) {
  const secret = String(process.env.CRON_SECRET || "");
  if (!secret || request.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const periods = growthReportCronPeriods(now);
  const results = await Promise.all(periods.map(async (period) => {
    try {
      const snapshot = await loadGrowthCenterSnapshot({
        audience: "manager",
        filters: growthReportFilters(period),
      });
      const saved = await saveGrowthReportToMicrosoft365({
        period,
        snapshot,
        mode: "auto",
        author: "SitGuru Growth Reporting",
      });
      return { cadence: period.cadence, ending: period.endDate, ok: saved.ok, status: saved.status, message: saved.message };
    } catch (error) {
      console.warn("growth report cron", period.label, error instanceof Error ? error.message : error);
      return { cadence: period.cadence, ending: period.endDate, ok: false, status: "error", message: "Could not capture this report." };
    }
  }));
  const ok = results.every((item) => item.ok);
  return NextResponse.json(
    { ok, capturedAt: now.toISOString(), timezone: "America/New_York", results },
    { status: ok ? 200 : 502, headers: { "Cache-Control": "no-store" } },
  );
}
