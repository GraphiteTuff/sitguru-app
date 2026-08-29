import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllPartnerEvents,
  getPartnerCommandCenterStats,
  type CommandCenterRange,
} from "@/lib/community/event-command-center";
import { requirePartnerAccountFromRequest } from "@/lib/community/partner-access";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
} from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return optionsWithMobileCors(req);
}

function parseRange(value: string | null): CommandCenterRange {
  if (value === "30d" || value === "90d" || value === "all" || value === "month") {
    return value;
  }
  return "month";
}

export async function GET(req: NextRequest) {
  const access = await requirePartnerAccountFromRequest(req);
  if (!access.ok || !access.partner) {
    return NextResponse.json(
      { error: access.error || "Partner required." },
      { status: 401, headers: mobileCorsHeaders(req) },
    );
  }

  const range = parseRange(req.nextUrl.searchParams.get("range"));
  const events = await fetchAllPartnerEvents(access.partner.id);
  const stats = await getPartnerCommandCenterStats(
    events,
    range,
    access.partner,
  );

  return NextResponse.json(
    { stats, eventCount: events.length },
    { headers: mobileCorsHeaders(req) },
  );
}
