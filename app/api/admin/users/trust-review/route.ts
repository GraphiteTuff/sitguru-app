import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";
import {
  asActionString,
  buildFraudTrustHref,
  buildModerationHref,
  normalizeDirectoryUser,
} from "@/lib/admin/user-directory-actions";

export const dynamic = "force-dynamic";

type TrustReviewPayload = {
  action?: "open" | "flag_suspend";
  reason?: string | null;
  user?: {
    id?: string | null;
    email?: string | null;
    name?: string | null;
    role?: string | null;
    source?: string | null;
  } | null;
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
};

/**
 * Opens a secure fraud/trust review context for a directory user.
 * Optional flag_suspend mutates account_status via the same lifecycle fields
 * used by /api/admin/accounts/status.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabaseAdmin, adminUser } = await requireAdminUser(request);
    const payload = (await request.json().catch(() => ({}))) as TrustReviewPayload;

    const action = payload.action === "flag_suspend" ? "flag_suspend" : "open";
    const user =
      normalizeDirectoryUser(payload.user) ||
      normalizeDirectoryUser({
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      });

    const fraudHref = buildFraudTrustHref(user);
    const moderationHref = buildModerationHref(user);

    if (action === "open" || !user?.id) {
      return NextResponse.json({
        ok: true,
        mutated: false,
        href: user?.id ? moderationHref : fraudHref,
        fraudHref,
        moderationHref,
      });
    }

    const userId = asActionString(user.id);
    const reason =
      asActionString(payload.reason) ||
      "Fraud / trust review opened from Admin User Directory.";

    const { data: existingProfile, error: existingError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, account_status, guru_status, email")
      .eq("id", userId)
      .maybeSingle();

    if (existingError || !existingProfile) {
      return NextResponse.json(
        {
          ok: false,
          error: "Account profile not found for trust review.",
          href: fraudHref,
        },
        { status: 404 },
      );
    }

    const now = new Date().toISOString();

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        account_status: "suspended",
        suspended_at: now,
        suspension_reason: reason,
      })
      .eq("id", userId)
      .select("id, account_status, guru_status, email, role")
      .single();

    if (updateError || !updatedProfile) {
      return NextResponse.json(
        {
          ok: false,
          error: updateError?.message || "Unable to update trust state.",
          href: fraudHref,
        },
        { status: 400 },
      );
    }

    await supabaseAdmin.from("account_lifecycle_events").insert({
      user_id: userId,
      email: updatedProfile.email || user.email || null,
      role: updatedProfile.role || user.role || null,
      previous_account_status: existingProfile.account_status,
      new_account_status: updatedProfile.account_status,
      previous_guru_status: existingProfile.guru_status,
      new_guru_status: updatedProfile.guru_status,
      event_type: "account_suspended",
      reason,
      performed_by: adminUser.id,
      performed_by_email: adminUser.email || null,
      created_at: now,
    });

    return NextResponse.json({
      ok: true,
      mutated: true,
      href: moderationHref,
      fraudHref,
      moderationHref,
      accountStatus: updatedProfile.account_status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to open trust review.";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 401 },
    );
  }
}
