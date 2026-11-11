import { NextRequest, NextResponse } from "next/server";
import { requireGrowthActor } from "@/lib/admin/growth/workplace";
import { parseFiltersFromSearch } from "@/lib/growth-center-v2/date-range";
import { loadGrowthCenterSnapshot } from "@/lib/growth-center-v2/snapshot";
import type { GrowthAudience } from "@/lib/growth-center-v2/types";

export const dynamic = "force-dynamic";

function audienceFromActor(kind: string, requested: string | null): GrowthAudience {
  if (kind === "intern") return "intern";
  if (requested === "admin" || kind === "admin") return "admin";
  return "manager";
}

export async function GET(req: NextRequest) {
  const access = await requireGrowthActor();
  if (!access.ok) {
    return NextResponse.json({ error: access.error || "Unauthorized" }, { status: 401 });
  }

  const audience = audienceFromActor(
    access.actor.kind,
    req.nextUrl.searchParams.get("role"),
  );
  const filters = parseFiltersFromSearch(req.nextUrl.searchParams);
  const snapshot = await loadGrowthCenterSnapshot({
    audience,
    filters,
    internUserId: audience === "intern" ? access.actor.id : null,
  });

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
