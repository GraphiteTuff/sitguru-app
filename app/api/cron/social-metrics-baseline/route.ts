import { NextResponse } from "next/server";

/**
 * Retired: this job used to overwrite social follower baselines with
 * placeholder data. Only authenticated, verified Meta snapshots may update
 * official counts now; see /api/cron/meta-social-sync.
 */
export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Legacy fallback baseline job retired. Use the official Meta sync." },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST() {
  return GET();
}
