/**
 * POST /api/account/pause — retention pause with churn feedback capture.
 * Freezes public visibility without permanent deletion.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type PausePayload = {
  reason?: string;
  durationDays?: number;
  improvementFeedback?: string;
  role?: string;
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return "";
  return authHeader.replace("Bearer ", "").trim();
}

function addDaysIso(days: number) {
  const next = new Date();
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing authorization token." },
        { status: 401 },
      );
    }

    const payload = (await request.json()) as PausePayload;
    const reason = String(payload.reason || "").trim();
    const improvementFeedback = String(
      payload.improvementFeedback || "",
    ).trim();
    const durationDays = Number(payload.durationDays);
    const role = String(payload.role || "").trim().toLowerCase();

    if (!reason) {
      return NextResponse.json(
        { error: "Please select a pause reason." },
        { status: 400 },
      );
    }

    if (![30, 60, 90].includes(durationDays)) {
      return NextResponse.json(
        { error: "Pause duration must be 30, 60, or 90 days." },
        { status: 400 },
      );
    }

    if (improvementFeedback.length < 10) {
      return NextResponse.json(
        {
          error:
            "Please share at least 10 characters about what we can improve.",
        },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unable to verify your account. Please log in again." },
        { status: 401 },
      );
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role,account_status,guru_status")
      .eq("id", user.id)
      .maybeSingle();

    const previousAccountStatus =
      (profile as { account_status?: string } | null)?.account_status ||
      "active";
    const previousGuruStatus =
      (profile as { guru_status?: string | null } | null)?.guru_status || null;
    const resumeAt = addDaysIso(durationDays);
    const pausedAt = new Date().toISOString();

    const structuredFeedback = JSON.stringify({
      kind: "pause",
      durationDays,
      resumeAt,
      improvement: improvementFeedback,
      role: role || (profile as { role?: string } | null)?.role || null,
    });

    const profilePatch: Record<string, unknown> = {
      account_status: "deactivated",
      deactivated_at: pausedAt,
      deletion_reason: `pause:${reason}`,
      deletion_feedback: structuredFeedback,
    };

    if (role === "guru" || previousGuruStatus) {
      profilePatch.guru_status = "paused";
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(profilePatch)
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 },
      );
    }

    await supabaseAdmin.from("account_lifecycle_events").insert({
      user_id: user.id,
      email: user.email,
      role:
        role ||
        (profile as { role?: string } | null)?.role ||
        null,
      previous_account_status: previousAccountStatus,
      new_account_status: "deactivated",
      previous_guru_status: previousGuruStatus,
      new_guru_status:
        role === "guru" || previousGuruStatus ? "paused" : previousGuruStatus,
      event_type: role === "guru" ? "guru_paused" : "account_deactivated",
      reason,
      feedback: structuredFeedback,
      performed_by: user.id,
      performed_by_email: user.email,
    });

    return NextResponse.json({
      success: true,
      message: "Account visibility paused.",
      resumeAt,
      durationDays,
      reason,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to pause your account.",
      },
      { status: 500 },
    );
  }
}
