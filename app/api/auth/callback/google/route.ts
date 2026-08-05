/**
 * POST /api/auth/callback/google
 * Verifies Google One-Tap / GIS JWT, establishes Supabase session, provisions workspace.
 */

import { OAuth2Client } from "google-auth-library";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClientFromCookieStore } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getGoogleClientId,
  intentFromOneTapRole,
  normalizeOneTapRole,
  redirectUrlForRole,
  type OneTapRole,
} from "@/lib/auth/google-one-tap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type GoogleCallbackBody = {
  credential?: string;
  role?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readReferralCode(request: NextRequest) {
  const fromQuery =
    cleanText(request.nextUrl.searchParams.get("referral_code")) ||
    cleanText(request.nextUrl.searchParams.get("ref")) ||
    cleanText(request.nextUrl.searchParams.get("ambassador_code"));

  if (fromQuery) return fromQuery;

  return (
    cleanText(request.cookies.get("sitguru_ambassador_code")?.value) ||
    cleanText(request.cookies.get("sitguru_referral_code")?.value) ||
    cleanText(request.cookies.get("sitguru_ambassador_ref")?.value)
  );
}

async function provisionWorkspace(options: {
  origin: string;
  accessToken: string;
  userId: string;
  email: string;
  intent: ReturnType<typeof intentFromOneTapRole>;
  referralCode: string;
  fullName: string;
}) {
  try {
    const response = await fetch(
      `${options.origin}/api/auth/provision-signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${options.accessToken}`,
        },
        body: JSON.stringify({
          userId: options.userId,
          email: options.email,
          intent: options.intent,
          referralCode: options.referralCode || undefined,
          fullName: options.fullName || undefined,
          source: "google_one_tap",
        }),
      },
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      console.error(
        "Google One-Tap provision-signup failed:",
        payload?.error || response.status,
      );
    }
  } catch (error) {
    console.error("Google One-Tap provision-signup exception:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getGoogleClientId();
    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Google Client ID is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID.",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as GoogleCallbackBody;
    const credential = cleanText(body.credential);
    const targetRole: OneTapRole = normalizeOneTapRole(
      body.role || request.nextUrl.searchParams.get("role") || "pet_parent",
    );

    if (!credential) {
      return NextResponse.json(
        { success: false, error: "Missing credential token metadata" },
        { status: 400 },
      );
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return NextResponse.json(
        { success: false, error: "Token signature validation failure" },
        { status: 401 },
      );
    }

    const email = cleanText(payload.email).toLowerCase();
    const name = cleanText(payload.name);
    const picture = cleanText(payload.picture);
    const googleId = cleanText(payload.sub);
    const intent = intentFromOneTapRole(targetRole);
    const redirectUrl = redirectUrlForRole(targetRole);
    const referralCode = readReferralCode(request);

    const cookieStore = await cookies();
    const supabase = createClientFromCookieStore(cookieStore);

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithIdToken({
        provider: "google",
        token: credential,
      });

    if (signInError || !signInData.user || !signInData.session) {
      return NextResponse.json(
        {
          success: false,
          error:
            signInError?.message ||
            "Unable to establish a SitGuru session from Google One-Tap.",
        },
        { status: 401 },
      );
    }

    const user = signInData.user;
    const accessToken = signInData.session.access_token;

    try {
      const admin = createSupabaseAdminClient();
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata || {}),
          full_name: name || user.user_metadata?.full_name || null,
          avatar_url: picture || user.user_metadata?.avatar_url || null,
          picture: picture || user.user_metadata?.picture || null,
          google_id: googleId || user.user_metadata?.google_id || null,
          account_intent: intent,
          signup_intent: intent,
          signup_role: intent === "pet_parent" ? "customer" : intent,
          signup_source: "google_one_tap",
        },
      });

      await admin
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email,
            full_name: name || null,
            avatar_url: picture || null,
            role: intent === "pet_parent" ? "customer" : intent,
          },
          { onConflict: "id" },
        );
    } catch (profileError) {
      console.error("Google One-Tap profile upsert soft-fail:", profileError);
    }

    const origin = request.nextUrl.origin;
    await provisionWorkspace({
      origin,
      accessToken,
      userId: user.id,
      email,
      intent,
      referralCode,
      fullName: name,
    });

    try {
      await fetch(`${origin}/api/analytics/event-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "user_registered_completed",
          role: targetRole,
          provider: "google",
          isNewUser: true,
          userEmail: email,
          ambassadorCodeApplied: referralCode || null,
          campaignSource: referralCode ? "ambassador_referral" : "direct",
        }),
      });
    } catch (telemetryError) {
      console.warn("Google signup analytics postback dropped:", telemetryError);
    }

    return NextResponse.json({
      success: true,
      redirectUrl,
      role: targetRole,
      email,
      name: name || null,
      picture: picture || null,
    });
  } catch (error) {
    console.error("OAuth edge handler route exception:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to complete Google One-Tap sign-in.",
      },
      { status: 500 },
    );
  }
}
