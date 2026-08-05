/**
 * POST /api/analytics/event-log
 * Lightweight signup / conversion telemetry sink for ambassador attribution charts.
 */

import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type EventLogBody = {
  event?: string;
  eventName?: string;
  timestamp?: string;
  userIdSha256?: string;
  userEmail?: string;
  role?: string;
  provider?: string;
  isNewUser?: boolean;
  ambassadorCodeApplied?: string | null;
  campaignSource?: string | null;
  metadata?: Record<string, unknown>;
};

function cleanText(value: unknown, max = 300) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    ""
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EventLogBody;
    const eventName =
      cleanText(body.event || body.eventName, 120) ||
      "user_registered_completed";
    const role = cleanText(body.role, 64) || null;
    const provider = cleanText(body.provider, 64) || null;
    const ambassadorCode =
      cleanText(body.ambassadorCodeApplied, 64) || null;
    const campaignSource =
      cleanText(body.campaignSource, 120) ||
      (ambassadorCode ? "ambassador_referral" : "direct");
    const email = cleanText(body.userEmail, 320).toLowerCase();
    const userHash =
      cleanText(body.userIdSha256, 128) ||
      (email ? sha256(email) : "");

    const metadata: Record<string, unknown> = {
      ...(body.metadata && typeof body.metadata === "object"
        ? body.metadata
        : {}),
      provider,
      isNewUser: Boolean(body.isNewUser),
      ambassadorCodeApplied: ambassadorCode,
      campaignSource,
      userIdSha256: userHash || null,
      timestamp: cleanText(body.timestamp, 64) || new Date().toISOString(),
    };

    const row = {
      event_name: eventName,
      event_type: "signup",
      role,
      source: provider || "signup",
      page_path: "/signup",
      session_id: null,
      ip_address: getClientIp(request) || null,
      user_agent: cleanText(request.headers.get("user-agent"), 500) || null,
      metadata,
      referral_code: ambassadorCode,
      created_at: new Date().toISOString(),
    };

    // Primary analytics table used across SitGuru dashboards.
    const { error: analyticsError } = await supabaseAdmin
      .from("analytics_events")
      .insert(row);

    if (analyticsError) {
      // Soft-fallback: some environments may use a narrower column set.
      const { error: fallbackError } = await supabaseAdmin
        .from("analytics_events")
        .insert({
          event_name: eventName,
          event_type: "signup",
          role,
          source: provider || "signup",
          metadata,
        });

      if (fallbackError) {
        console.error("event-log insert failed:", analyticsError, fallbackError);
        return NextResponse.json(
          { success: false, error: fallbackError.message },
          { status: 500 },
        );
      }
    }

    // Mirror referral-coded signups into growth campaign stream when available.
    if (ambassadorCode) {
      try {
        await supabaseAdmin.from("growth_campaign_events").insert({
          event_name: eventName,
          event_type: "signup",
          source: provider || "signup",
          role,
          metadata: {
            ...metadata,
            referral_code: ambassadorCode,
          },
        });
      } catch {
        // Optional table — ignore when absent.
      }
    }

    return NextResponse.json({
      success: true,
      event: eventName,
      ambassadorCodeApplied: ambassadorCode,
    });
  } catch (error) {
    console.error("event-log route exception:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to record analytics event.",
      },
      { status: 500 },
    );
  }
}
