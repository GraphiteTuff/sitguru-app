import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function createUnsubscribeToken() {
  return randomBytes(24).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || !user.email) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to manage email updates." },
        { status: 401 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      subscribed?: boolean;
    };
    const subscribed = Boolean(body.subscribed);
    const emailNormalized = user.email.trim().toLowerCase();
    const now = new Date().toISOString();

    await supabaseAdmin
      .from("profiles")
      .update({ marketing_notifications: subscribed })
      .eq("id", user.id);

    const { data: existing } = await supabaseAdmin
      .from("email_update_subscribers")
      .select("id, unsubscribe_token")
      .eq("email_normalized", emailNormalized)
      .maybeSingle();

    if (subscribed) {
      if (existing?.id) {
        await supabaseAdmin
          .from("email_update_subscribers")
          .update({
            status: "subscribed",
            user_id: user.id,
            subscribed_at: now,
            unsubscribed_at: null,
            updated_at: now,
            source: "my_account",
          })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin.from("email_update_subscribers").insert({
          email: user.email,
          email_normalized: emailNormalized,
          user_id: user.id,
          status: "subscribed",
          source: "my_account",
          unsubscribe_token: createUnsubscribeToken(),
          subscribed_at: now,
          updated_at: now,
        });
      }
    } else if (existing?.id) {
      await supabaseAdmin
        .from("email_update_subscribers")
        .update({
          status: "unsubscribed",
          unsubscribed_at: now,
          updated_at: now,
          user_id: user.id,
        })
        .eq("id", existing.id);
    }

    return NextResponse.json({
      ok: true,
      subscribed,
      message: subscribed
        ? "You’re signed up for SitGuru email updates."
        : "You’ve been unsubscribed from SitGuru email updates.",
    });
  } catch (error) {
    console.error("email-updates me preference error:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to update email preferences right now." },
      { status: 500 },
    );
  }
}
