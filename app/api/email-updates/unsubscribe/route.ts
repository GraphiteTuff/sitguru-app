import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function syncProfileMarketingOff(emailNormalized: string, userId?: string | null) {
  try {
    if (userId) {
      await supabaseAdmin
        .from("profiles")
        .update({ marketing_notifications: false })
        .eq("id", userId);
      return;
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", emailNormalized)
      .maybeSingle();

    if (profile?.id) {
      await supabaseAdmin
        .from("profiles")
        .update({ marketing_notifications: false })
        .eq("id", profile.id);
    }
  } catch (error) {
    console.warn("email-updates unsubscribe profile sync skipped:", error);
  }
}

async function unsubscribeByToken(token: string) {
  const cleanToken = safeString(token);
  if (!cleanToken || cleanToken.length < 16) {
    return { ok: false as const, error: "Invalid unsubscribe link.", status: 400 };
  }

  const { data: row, error } = await supabaseAdmin
    .from("email_update_subscribers")
    .select("id, email_normalized, user_id, status")
    .eq("unsubscribe_token", cleanToken)
    .maybeSingle();

  if (error) {
    console.error("email-updates unsubscribe lookup error:", error);
    return {
      ok: false as const,
      error: "Unable to update your preference right now.",
      status: 500,
    };
  }

  if (!row?.id) {
    return { ok: false as const, error: "This unsubscribe link is not valid.", status: 404 };
  }

  if (row.status === "unsubscribed") {
    return {
      ok: true as const,
      alreadyUnsubscribed: true,
      message: "You’re already unsubscribed from SitGuru email updates.",
    };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabaseAdmin
    .from("email_update_subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: now,
      updated_at: now,
    })
    .eq("id", row.id);

  if (updateError) {
    console.error("email-updates unsubscribe update error:", updateError);
    return {
      ok: false as const,
      error: "Unable to update your preference right now.",
      status: 500,
    };
  }

  await syncProfileMarketingOff(row.email_normalized, row.user_id);

  return {
    ok: true as const,
    message: "You’ve been unsubscribed from SitGuru email updates.",
  };
}

export async function GET(req: NextRequest) {
  const token = safeString(req.nextUrl.searchParams.get("token"));
  const result = await unsubscribeByToken(token);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const token =
      safeString(body.token) ||
      safeString(req.nextUrl.searchParams.get("token"));

    const result = await unsubscribeByToken(token);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("email-updates unsubscribe POST error:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
