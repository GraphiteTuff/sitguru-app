/**
 * Daily social metrics baseline + optional live brand sync.
 *
 * App Router path (canonical):
 *   app/api/cron/social-metrics-baseline/route.ts
 *   → GET|POST /api/cron/social-metrics-baseline
 *
 * Auth: Authorization: Bearer $CRON_SECRET (same pattern as profile-completion reminders).
 * vercel.json cron: "5 0 * * *" → this path.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  resetDailyBaselines,
  syncBrandSocialMetrics,
} from "@/lib/services/socialMediaClient";

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

async function runSocialMetricsJob(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized social-metrics cron request.",
      },
      { status: 401 },
    );
  }

  try {
    const url = new URL(request.url);
    const syncLive = url.searchParams.get("sync") !== "0";

    const baseline = await resetDailyBaselines();
    const live = syncLive ? await syncBrandSocialMetrics() : [];

    return NextResponse.json({
      ok: true,
      ranAt: new Date().toISOString(),
      baseline,
      live: live.map((row) => ({
        platform: row.platform,
        handle: row.handle,
        currentFollowers: row.currentFollowers,
        newFollowersToday: row.newFollowersToday,
        source: row.source,
        error: row.error || null,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "SitGuru could not sync social platform metrics.";

    console.error("SOCIAL METRICS CRON ERROR:", error);

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
  return runSocialMetricsJob(request);
}

export async function POST(request: NextRequest) {
  return runSocialMetricsJob(request);
}
