import { NextRequest, NextResponse } from "next/server";
import { syncFacebookPageMetrics } from "@/lib/facebook-integration/facebook-page-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function run(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  try {
    const result = await syncFacebookPageMetrics();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Facebook sync failed.";
    console.warn("Facebook Page metrics sync failed:", message);
    return NextResponse.json(
      { ok: false, error: "Facebook sync unavailable. Check server configuration and API access." },
      { status: 503 },
    );
  }
}
export async function GET(request: NextRequest) { return run(request); }
export async function POST(request: NextRequest) { return run(request); }
