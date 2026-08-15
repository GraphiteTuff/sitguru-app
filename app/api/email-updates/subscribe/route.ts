import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmailUpdatesWelcome } from "@/lib/email/email-updates-welcome";

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

function isMissingTableError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const message = String(error.message || "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    message.includes("email_update_subscribers") &&
      (message.includes("schema cache") || message.includes("does not exist"))
  );
}

function missingTableResponse() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Email updates are almost ready. Please try again in a moment while we finish setup.",
      code: "missing_table",
    },
    { status: 503 },
  );
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

async function sendWelcomeSafely(params: {
  email: string;
  fullName: string;
  unsubscribeToken: string;
}) {
  try {
    await sendEmailUpdatesWelcome({
      to: params.email,
      fullName: params.fullName || null,
      unsubscribeToken: params.unsubscribeToken,
    });
    return true;
  } catch (error) {
    console.error("email-updates welcome email failed:", error);
    return false;
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

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("email_update_subscribers")
      .select("id, status, unsubscribe_token, user_id")
      .eq("email_normalized", emailNormalized)
      .maybeSingle();

    if (existingError) {
      console.error("email-updates lookup error:", existingError);
      if (isMissingTableError(existingError)) {
        return missingTableResponse();
      }
      return NextResponse.json(
        { ok: false, error: "Unable to save your email preference right now." },
        { status: 500 },
      );
    }

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
      const token = existing.unsubscribe_token || unsubscribeToken;
      const wasUnsubscribed = existing.status !== "subscribed";

      const { error } = await supabaseAdmin
        .from("email_update_subscribers")
        .update({
          email,
          full_name: fullName || null,
          status: "subscribed",
          source,
          user_id: profileUserId || existing.user_id || null,
          subscribed_at: now,
          unsubscribed_at: null,
          updated_at: now,
          unsubscribe_token: token,
        })
        .eq("id", existing.id);

      if (error) {
        console.error("email-updates resubscribe error:", error);
        if (isMissingTableError(error)) {
          return missingTableResponse();
        }
        return NextResponse.json(
          { ok: false, error: "Unable to save your email preference right now." },
          { status: 500 },
        );
      }

      if (wasUnsubscribed) {
        await sendWelcomeSafely({
          email,
          fullName,
          unsubscribeToken: token,
        });
      }

      return NextResponse.json({
        ok: true,
        alreadySubscribed: !wasUnsubscribed,
        message: wasUnsubscribed
          ? "Welcome back — you’re signed up for SitGuru email updates again."
          : "You’re already signed up for SitGuru email updates.",
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
      if (isMissingTableError(error)) {
        return missingTableResponse();
      }
      return NextResponse.json(
        { ok: false, error: "Unable to save your email preference right now." },
        { status: 500 },
      );
    }

    await sendWelcomeSafely({
      email,
      fullName,
      unsubscribeToken,
    });

    return NextResponse.json({
      ok: true,
      message: "You’re signed up for SitGuru email updates. Check your inbox for a warm welcome!",
    });
  } catch (error) {
    console.error("email-updates POST error:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
