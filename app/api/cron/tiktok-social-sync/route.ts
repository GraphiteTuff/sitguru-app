import { NextResponse } from "next/server";
import { syncAuthorizedTikTok } from "@/lib/tiktok/social-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Protected hourly sync. It is inert until explicit Vercel configuration.
 * Sandbox records are isolated from official production TikTok metrics.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.TIKTOK_SOCIAL_SYNC_ENABLED !== "true") {
    return NextResponse.json(
      { ok: true, enabled: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const snapshot = await syncAuthorizedTikTok();
    return NextResponse.json(
      { ok: true, enabled: true, snapshot },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    // Deliberately omit raw provider and credential data from logs/responses.
    const name = error instanceof Error ? error.name : "UnknownError";
    console.error("TikTok social sync failed:", name);
    return NextResponse.json(
      { ok: false, enabled: true, error: "TikTok authorization or API sync failed." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}