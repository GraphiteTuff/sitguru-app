import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { syncSocialMetricsBaseline } from "@/services/socialMediaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") || "";

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return authorization === `Bearer ${cronSecret}`;
}

async function runBaselineJob(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized social-metrics baseline request.",
      },
      { status: 401 },
    );
  }

  try {
    const sync = await syncSocialMetricsBaseline(supabaseAdmin);

    return NextResponse.json(
      {
        ok: sync.ok,
        ranAt: sync.ranAt,
        updated: sync.updated,
        results: sync.results,
      },
      { status: sync.ok ? 200 : 500 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "SitGuru could not sync social metrics baselines.";

    console.error("SOCIAL METRICS BASELINE CRON ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return runBaselineJob(request);
}

export async function POST(request: NextRequest) {
  return runBaselineJob(request);
}
