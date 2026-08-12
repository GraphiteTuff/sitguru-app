import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeSource(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 50);
  return normalized || "footer";
}

function createUnsubscribeToken() {
  return randomBytes(24).toString("hex");
}

async function syncProfileMarketing(emailNormalized: string, enabled: boolean) {
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", emailNormalized)
      .maybeSingle();

    if (!profile?.id) return null;

    await supabaseAdmin
      .from("profiles")
      .update({
        marketing_notifications: enabled,
      })
      .eq("id", profile.id);

    return profile.id as string;
  } catch (error) {
    console.warn("email-updates profile sync skipped:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const email = safeString(body.email);
    const emailNormalized = normalizeEmail(email);
    const fullName = safeString(body.fullName || body.full_name).slice(0, 120);
    const source = normalizeSource(safeString(body.source));

    if (!isValidEmail(emailNormalized)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const now = new Date().toISOString();
    const unsubscribeToken = createUnsubscribeToken();

    const { data: existing } = await supabaseAdmin
      .from("email_update_subscribers")
      .select("id, status, unsubscribe_token, user_id")
      .eq("email_normalized", emailNormalized)
      .maybeSingle();

    let profileUserId =
      user?.email && normalizeEmail(user.email) === emailNormalized
        ? user.id
        : null;

    if (!profileUserId) {
      profileUserId = await syncProfileMarketing(emailNormalized, true);
    } else {
      await supabaseAdmin
        .from("profiles")
        .update({
          marketing_notifications: true,
        })
        .eq("id", profileUserId);
    }

    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from("email_update_subscribers")
        .update({
          email,
          full_name: fullName || null,
          status: "subscribed",
          source: existing.status === "subscribed" ? source : source,
          user_id: profileUserId || existing.user_id || null,
          subscribed_at: now,
          unsubscribed_at: null,
          updated_at: now,
          unsubscribe_token: existing.unsubscribe_token || unsubscribeToken,
        })
        .eq("id", existing.id);

      if (error) {
        console.error("email-updates resubscribe error:", error);
        return NextResponse.json(
          { ok: false, error: "Unable to save your email preference right now." },
          { status: 500 },
        );
      }

      return NextResponse.json({
        ok: true,
        alreadySubscribed: existing.status === "subscribed",
        message:
          existing.status === "subscribed"
            ? "You’re already signed up for SitGuru email updates."
            : "Welcome back — you’re signed up for SitGuru email updates again.",
      });
    }

    const { error } = await supabaseAdmin.from("email_update_subscribers").insert({
      email,
      email_normalized: emailNormalized,
      full_name: fullName || null,
      user_id: profileUserId,
      status: "subscribed",
      source,
      unsubscribe_token: unsubscribeToken,
      subscribed_at: now,
      updated_at: now,
    });

    if (error) {
      console.error("email-updates subscribe error:", error);
      return NextResponse.json(
        { ok: false, error: "Unable to save your email preference right now." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "You’re signed up for SitGuru email updates.",
    });
  } catch (error) {
    console.error("email-updates POST error:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
