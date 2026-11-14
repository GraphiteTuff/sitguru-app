import { NextRequest, NextResponse } from "next/server";
import { dispatchInternshipAssignmentReminders } from "@/lib/internship/dispatch-assignment-reminders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const result = await dispatchInternshipAssignmentReminders();
    return NextResponse.json({ ok: true, date: new Date().toISOString().slice(0, 10), ...result });
  } catch (error) {
    console.error("[intern-reminders] Cron failed.", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "Could not process assignment reminders." }, { status: 500 });
  }
}
