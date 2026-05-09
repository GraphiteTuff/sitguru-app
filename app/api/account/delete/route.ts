import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type DeleteAccountPayload = {
  reason?: string;
  feedback?: string;
  confirmationText?: string;
  understandsPermanent?: boolean;
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

  if (!authHeader.startsWith("Bearer ")) {
    return "";
  }

  return authHeader.replace("Bearer ", "").trim();
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
      .select("role")
      .eq("id", user.id)
      .single();

    const requestedAt = new Date().toISOString();

    const { data: deletionRequest, error: requestError } = await supabaseAdmin
      .from("account_deletion_requests")
      .insert({
        user_id: user.id,
        email: user.email,
        role: profile?.role || null,
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