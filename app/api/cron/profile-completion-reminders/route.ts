import { NextRequest, NextResponse } from "next/server";
import {
  backfillRecentSignupReminderQueue,
  processProfileCompletionReminderQueue,
} from "@/lib/completion-reminders";

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

async function runReminderJob(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized profile-completion reminder request.",
      },
      { status: 401 },
    );
  }

  try {
    const backfill = await backfillRecentSignupReminderQueue({
      days: 14,
      maxUsers: 300,
    });

    const processing = await processProfileCompletionReminderQueue({
      limit: 30,
    });

    return NextResponse.json({
      ok: true,
      ranAt: new Date().toISOString(),
      backfill,
      processing,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "SitGuru could not process profile-completion reminders.";

    console.error("PROFILE COMPLETION REMINDER CRON ERROR:", error);

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
  return runReminderJob(request);
}

export async function POST(request: NextRequest) {
  return runReminderJob(request);
}