import { NextResponse } from "next/server";
import { requireGrowthActor } from "@/lib/admin/growth/workplace";
import { loadSocialConnectorStatus } from "@/lib/growth-center-v2/social-connectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Authorized, cache-free follower source for Manager, Intern and Admin reporting.
 * Only public-facing counts/statuses are returned. OAuth credentials never leave the server.
 */
export async function GET() {
  const access = await requireGrowthActor();
  if (!access.ok) {
    return NextResponse.json(
      { error: "Growth portal access required." },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const social = await loadSocialConnectorStatus();
  return NextResponse.json(
    { social, checkedAt: new Date().toISOString() },
    { status: 200, headers: { "Cache-Control": "private, no-store" } },
  );
}