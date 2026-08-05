/**
 * POST /api/auth/callback/apple
 * Verifies Apple identity tokens (RS256 / JWKS), establishes Supabase session,
 * upserts profile identity, and returns role-aware dashboard redirects.
 */

import jwt, { type JwtHeader, type SigningKeyCallback } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClientFromCookieStore } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  APPLE_ISSUER,
  APPLE_JWKS_URI,
  getAppleClientId,
} from "@/lib/auth/apple-auth";
import {
  intentFromOneTapRole,
  normalizeOneTapRole,
  redirectUrlForRole,
  type OneTapRole,
} from "@/lib/auth/google-one-tap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AppleNamePayload = {
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
};

type AppleUserPayload = {
  name?: AppleNamePayload;
  email?: string;
};

type AppleCallbackBody = {
  id_token?: string;
  identityToken?: string;
  user?: AppleUserPayload | string;
  role?: string;
};

const jwks = jwksClient({
  jwksUri: APPLE_JWKS_URI,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getAppleSigningKey(
  header: JwtHeader,
  callback: SigningKeyCallback,
) {
  if (!header.kid) {
    callback(new Error("Apple token header missing kid."));
    return;
  }

  jwks.getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      callback(err || new Error("Public key signature missing"));
      return;
    }
    callback(null, key.getPublicKey());
  });
}

function verifyAppleIdToken(idToken: string, audience: string) {
  return new Promise<jwt.JwtPayload>((resolve, reject) => {
    jwt.verify(
      idToken,
      getAppleSigningKey,
      {
        algorithms: ["RS256"],
        audience,
        issuer: APPLE_ISSUER,
      },
      (err, decoded) => {
        if (err || !decoded || typeof decoded === "string") {
          reject(err || new Error("Apple token verification failed."));
          return;
        }
        resolve(decoded);
      },
    );
  });
}

function parseAppleUserPayload(raw: AppleCallbackBody["user"]): AppleUserPayload | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as AppleUserPayload;
    } catch {
      return null;
    }
  }
  return raw;
}

function resolveFullName(userPayload: AppleUserPayload | null, email: string) {
  const name = userPayload?.name;
  if (!name) {
    const local = email.split("@")[0] || "";
    return local ? local.replace(/[._-]+/g, " ") : "SitGuru Member";
  }

  const first = cleanText(name.firstName || name.first_name);
  const last = cleanText(name.lastName || name.last_name);
  const combined = `${first} ${last}`.trim();
  return combined || "SitGuru Member";
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
          source: "apple_signin",
        }),
      },
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      console.error(
        "Apple Sign-In provision-signup failed:",
        payload?.error || response.status,
      );
    }
  } catch (error) {
    console.error("Apple Sign-In provision-signup exception:", error);
  }
}

async function logSignupEvent(options: {
  origin: string;
  email: string;
  role: OneTapRole;
  referralCode: string;
  isNewUser: boolean;
}) {
  try {
    await fetch(`${options.origin}/api/analytics/event-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "user_registered_completed",
        role: options.role,
        provider: "apple",
        isNewUser: options.isNewUser,
        userEmail: options.email,
        ambassadorCodeApplied: options.referralCode || null,
        campaignSource: options.referralCode ? "ambassador_referral" : "direct",
      }),
    });
  } catch (error) {
    console.warn("Apple signup analytics postback dropped:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getAppleClientId();
    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Apple Client ID is not configured. Set APPLE_CLIENT_ID (Services ID).",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as AppleCallbackBody;
    const idToken =
      cleanText(body.id_token) || cleanText(body.identityToken);
    const targetRole: OneTapRole = normalizeOneTapRole(
      body.role || request.nextUrl.searchParams.get("role") || "pet_parent",
    );
    const userProfilePayload = parseAppleUserPayload(body.user);

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Missing identity token" },
        { status: 400 },
      );
    }

    const decodedToken = jwt.decode(idToken, { complete: true });
    if (!decodedToken || typeof decodedToken === "string" || !decodedToken.header) {
      return NextResponse.json(
        { success: false, error: "Malformed identity structure" },
        { status: 400 },
      );
    }

    const payload = await verifyAppleIdToken(idToken, clientId);
    const email =
      cleanText(payload.email) ||
      cleanText(userProfilePayload?.email);
    const appleUserId = cleanText(payload.sub);

    if (!email || !appleUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Apple token did not include a usable email/sub. Ensure email scope is enabled.",
        },
        { status: 401 },
      );
    }

    const fullName = resolveFullName(userProfilePayload, email);
    const intent = intentFromOneTapRole(targetRole);
    const redirectUrl = redirectUrlForRole(targetRole);
    const referralCode = readReferralCode(request);

    const cookieStore = await cookies();
    const supabase = createClientFromCookieStore(cookieStore);

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: idToken,
      });

    if (signInError || !signInData.user || !signInData.session) {
      return NextResponse.json(
        {
          success: false,
          error:
            signInError?.message ||
            "Unable to establish a SitGuru session from Apple Sign-In.",
        },
        { status: 401 },
      );
    }

    const user = signInData.user;
    const accessToken = signInData.session.access_token;
    const createdAtMs = user.created_at
      ? new Date(user.created_at).getTime()
      : 0;
    const isNewUser =
      Boolean(createdAtMs) && Date.now() - createdAtMs < 2 * 60 * 1000;

    try {
      const admin = createSupabaseAdminClient();
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata || {}),
          full_name: fullName || user.user_metadata?.full_name || null,
          apple_id: appleUserId,
          account_intent: intent,
          signup_intent: intent,
          signup_role: intent === "pet_parent" ? "customer" : intent,
          signup_source: "apple_signin",
        },
      });

      await admin.from("profiles").upsert(
        {
          id: user.id,
          email: email.toLowerCase(),
          full_name: fullName || null,
          role: intent === "pet_parent" ? "customer" : intent,
        },
        { onConflict: "id" },
      );
    } catch (profileError) {
      console.error("Apple Sign-In profile upsert soft-fail:", profileError);
    }

    const origin = request.nextUrl.origin;
    await provisionWorkspace({
      origin,
      accessToken,
      userId: user.id,
      email: email.toLowerCase(),
      intent,
      referralCode,
      fullName,
    });

    await logSignupEvent({
      origin,
      email: email.toLowerCase(),
      role: targetRole,
      referralCode,
      isNewUser,
    });

    return NextResponse.json({
      success: true,
      redirectUrl,
      userEmail: email.toLowerCase(),
      role: targetRole,
      isNewUser,
    });
  } catch (error) {
    console.error("Apple secure identity handshake validation failure:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to complete Apple Sign-In.",
      },
      { status: 500 },
    );
  }
}
