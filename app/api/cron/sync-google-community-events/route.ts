import { NextRequest, NextResponse } from "next/server";
import { syncGoogleCommunityEventDiscoveries } from "@/lib/community/google-events-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") || "";

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return authorization === `Bearer ${cronSecret}`;
}

async function runSync(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized Google community events sync." },
      { status: 401 },
    );
  }

  try {
    const result = await syncGoogleCommunityEventDiscoveries({
      respectSchedule: true,
      forceRefresh: false,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "SitGuru could not sync Google community events.";
    console.error("GOOGLE COMMUNITY EVENTS CRON ERROR:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return runSync(request);
}

export async function POST(request: NextRequest) {
  return runSync(request);
}
