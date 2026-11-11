import { NextRequest, NextResponse } from "next/server";
import { requireGrowthActor } from "@/lib/admin/growth/workplace";
import { parseFiltersFromSearch } from "@/lib/growth-center-v2/date-range";
import { snapshotToCsv } from "@/lib/growth-center-v2/reports";
import { loadGrowthCenterSnapshot } from "@/lib/growth-center-v2/snapshot";
import type { GrowthAudience } from "@/lib/growth-center-v2/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const access = await requireGrowthActor();
  if (!access.ok) {
    return NextResponse.json({ error: access.error || "Unauthorized" }, { status: 401 });
  }

  const audience: GrowthAudience =
    access.actor.kind === "intern"
      ? "intern"
      : access.actor.kind === "admin"
        ? "admin"
        : "manager";

  const filters = parseFiltersFromSearch(req.nextUrl.searchParams);
  const snapshot = await loadGrowthCenterSnapshot({
    audience,
    filters,
    internUserId: audience === "intern" ? access.actor.id : null,
  });
  const csv = snapshotToCsv(snapshot);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sitguru-growth-center-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
