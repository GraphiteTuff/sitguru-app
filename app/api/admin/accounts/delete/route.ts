import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/supabase/admin";

type DeleteAccountPayload = {
  reason?: string;
  feedback?: string;
  confirmationText?: string;
  understandsPermanent?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const { supabaseAdmin, user } = await requireAuthenticatedUser(request);
    const payload = (await request.json()) as DeleteAccountPayload;

    const reason = payload.reason?.trim() || "";
    const feedback = payload.feedback?.trim() || "";
    const confirmationText = payload.confirmationText?.trim() || "";
    const understandsPermanent = Boolean(payload.understandsPermanent);

    if (!reason) {
      return NextResponse.json(
        { error: "Please select a reason before deleting your account." },
        { status: 400 },
      );
    }

    if (!understandsPermanent) {
      return NextResponse.json(
        { error: "Please confirm that you understand deletion is permanent." },
        { status: 400 },
      );
    }

    if (confirmationText !== "DELETE") {
      return NextResponse.json(
        { error: "Please type DELETE to confirm account deletion." },
        { status: 400 },
      );
    }

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, role, account_status, guru_status")
      .eq("id", user.id)
      .single();

    const requestedAt = new Date().toISOString();

    const { data: deletionRequest, error: requestError } = await supabaseAdmin
      .from("account_deletion_requests")
      .insert({
        user_id: user.id,
        email: user.email,
        role: existingProfile?.role || null,
        reason,
        feedback,
        confirmation_text: confirmationText,
        requested_at: requestedAt,
        status: "requested",
      })
      .select("id")
      .single();

    if (requestError) {
      return NextResponse.json(
        { error: requestError.message },
        { status: 400 },
      );
    }

    const { error: lifecycleEventError } = await supabaseAdmin
      .from("account_lifecycle_events")
      .insert({
        user_id: user.id,
        email: user.email,
        role: existingProfile?.role || null,
        previous_account_status: existingProfile?.account_status || null,
        new_account_status: "deleted",
        previous_guru_status: existingProfile?.guru_status || null,
        new_guru_status: existingProfile?.guru_status || null,
        event_type: "account_deleted",
        reason,
        feedback,
        performed_by: user.id,
        performed_by_email: user.email,
      });

    if (lifecycleEventError) {
      await supabaseAdmin
        .from("account_deletion_requests")
        .update({
          status: "failed",
        })
        .eq("id", deletionRequest.id);

      return NextResponse.json(
        { error: lifecycleEventError.message },
        { status: 400 },
      );
    }

    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({
        account_status: "deleted",
        deletion_requested_at: requestedAt,
        deletion_reason: reason,
        deletion_feedback: feedback,
        deletion_confirmed_at: requestedAt,
        deleted_at: requestedAt,
      })
      .eq("id", user.id);

    if (profileUpdateError) {
      await supabaseAdmin
        .from("account_deletion_requests")
        .update({
          status: "failed",
        })
        .eq("id", deletionRequest.id);

      return NextResponse.json(
        { error: profileUpdateError.message },
        { status: 400 },
      );
    }

    const { error: deleteUserError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      await supabaseAdmin
        .from("account_deletion_requests")
        .update({
          status: "failed",
        })
        .eq("id", deletionRequest.id);

      return NextResponse.json(
        { error: deleteUserError.message },
        { status: 400 },
      );
    }

    await supabaseAdmin
      .from("account_deletion_requests")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", deletionRequest.id);

    return NextResponse.json({
      success: true,
      message: "Account deleted.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to delete account.",
      },
      { status: 500 },
    );
  }
}