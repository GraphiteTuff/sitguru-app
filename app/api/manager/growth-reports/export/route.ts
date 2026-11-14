import { NextRequest, NextResponse } from "next/server";
import { requireGrowthActor } from "@/lib/admin/growth/workplace";
import { getGrowthReportPeriod, growthReportFilters } from "@/lib/growth-center-v2/report-periods";
import { readStoredGrowthReport } from "@/lib/growth-center-v2/report-sharepoint";
import { loadGrowthCenterSnapshot } from "@/lib/growth-center-v2/snapshot";
import { snapshotToCsv } from "@/lib/growth-center-v2/reports";

export const dynamic = "force-dynamic";

/** Export uses the exact same Eastern-time date boundaries as saved weekly reports. */
export async function GET(request: NextRequest) {
  const access = await requireGrowthActor();
  if (!access.ok || access.actor.kind === "intern") {
    return NextResponse.json({ error: "Authorized growth manager or admin required." }, { status: 403 });
  }
  const period = getGrowthReportPeriod({
    cadence: request.nextUrl.searchParams.get("period"),
    end: request.nextUrl.searchParams.get("end"),
  });
  const existing = await readStoredGrowthReport(period);
  const snapshot = existing.report?.status === "submitted"
    ? existing.report.snapshot
    : await loadGrowthCenterSnapshot({ audience: "manager", filters: growthReportFilters(period) });
  const csv = snapshotToCsv(snapshot);
  const fileName = "SitGuru-" + period.cadence + "-" + period.endDate + ".csv";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="' + fileName + '"',
      "Cache-Control": "private, no-store",
    },
  });
}
