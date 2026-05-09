import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";

type AccountStatusPayload = {
  userId?: string;
  accountStatus?: "active" | "deactivated" | "suspended" | "deleted";
  guruStatus?: "pending" | "active" | "paused" | "cancelled" | "suspended" | null;
  reason?: string;
};

export async function POST(request: NextRequest) {
  try {
    const { supabaseAdmin, adminUser } = await requireAdminUser(request);
    const payload = (await request.json()) as AccountStatusPayload;

    const userId = payload.userId?.trim();
    const reason = payload.reason?.trim() || "";

    if (!userId) {
      return NextResponse.json(
        { error: "Missing user ID." },
        { status: 400 },
      );
    }

    const { data: existingProfile, error: existingProfileError } =
      await supabaseAdmin
        .from("profiles")
        .select(
          `
          id,
          role,
          account_status,
          guru_status
        `,
        )
        .eq("id", userId)
        .single();

    if (existingProfileError || !existingProfile) {
      return NextResponse.json(
        { error: "Account profile not found." },
        { status: 404 },
      );
    }

    const { data: targetAuthUser } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    const updatePayload: Record<string, string | null> = {};
    let eventType = "admin_status_change";

    if (payload.accountStatus) {
      updatePayload.account_status = payload.accountStatus;

      if (payload.accountStatus === "active") {
        updatePayload.deactivated_at = null;
        updatePayload.suspended_at = null;
        updatePayload.suspension_reason = null;
        eventType = "account_reactivated";
      }

      if (payload.accountStatus === "deactivated") {
        updatePayload.deactivated_at = new Date().toISOString();
        eventType = "account_deactivated";
      }

      if (payload.accountStatus === "suspended") {
        updatePayload.suspended_at = new Date().toISOString();
        updatePayload.suspension_reason = reason || "Suspended by admin.";
        eventType = "account_suspended";
      }
    }

    if (payload.guruStatus !== undefined) {
      updatePayload.guru_status = payload.guruStatus;

      if (payload.guruStatus === "active") {
        updatePayload.guru_cancelled_at = null;
        updatePayload.guru_cancellation_reason = null;
        eventType = "guru_reactivated";
      }

      if (payload.guruStatus === "cancelled") {
        updatePayload.guru_cancelled_at = new Date().toISOString();
        updatePayload.guru_cancellation_reason =
          reason || "Guru services cancelled by admin.";
        eventType = "guru_cancelled";
      }

      if (payload.guruStatus === "suspended") {
        updatePayload.suspension_reason =
          reason || "Guru services suspended by admin.";
        eventType = "guru_suspended";
      }

      if (payload.guruStatus === "paused") {
        eventType = "guru_paused";
      }
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId)
      .select(
        `
        id,
        role,
        account_status,
        guru_status
      `,
      )
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 },
      );
    }

    await supabaseAdmin.from("account_lifecycle_events").insert({
      user_id: userId,
      email: targetAuthUser.user?.email || null,
      role: existingProfile.role,
      previous_account_status: existingProfile.account_status,
      new_account_status: updatedProfile.account_status,
      previous_guru_status: existingProfile.guru_status,
      new_guru_status: updatedProfile.guru_status,
      event_type: eventType,
      reason,
      performed_by: adminUser.id,
      performed_by_email: adminUser.email,
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update account.",
      },
      { status: 401 },
    );
  }
}