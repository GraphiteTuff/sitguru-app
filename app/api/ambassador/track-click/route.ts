// app/api/ambassador/track-click/route.ts
/**
 * Non-blocking referral traffic ingestion for ?ref=CODE landing visits.
 */

import { NextRequest, NextResponse } from "next/server";
import { recordAmbassadorClick } from "@/lib/ambassador/ledger";
import {
  AMBASSADOR_CODE_COOKIE,
  AMBASSADOR_REF_COOKIE,
  AMBASSADOR_REF_COOKIE_MAX_AGE_SEC,
} from "@/lib/ambassador/ledger-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    const slug =
      safeString(body?.ref) ||
      safeString(body?.code) ||
      safeString(body?.referralCode);

    if (!slug) {
      return NextResponse.json(
        { ok: false, error: "Missing referral code." },
        { status: 400 },
      );
    }

    const forwarded = req.headers.get("x-forwarded-for") || "";
    const ipAddress =
      safeString(body?.ipAddress) ||
      forwarded.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const result = await recordAmbassadorClick({
      slug,
      ipAddress,
      userAgent:
        safeString(body?.userAgent) || req.headers.get("user-agent") || null,
      landingPath: safeString(body?.landingPath) || null,
      referrer: safeString(body?.referrer) || null,
      utmSource: safeString(body?.utmSource) || null,
      utmMedium: safeString(body?.utmMedium) || null,
      utmCampaign: safeString(body?.utmCampaign) || null,
      sessionId: safeString(body?.sessionId) || null,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 404 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      clickId: result.clickId,
      ambassadorId: result.ambassadorId,
      referralCode: result.referralCode,
    });

    const cookieOpts = {
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AMBASSADOR_REF_COOKIE_MAX_AGE_SEC,
    };

    // Ledger cookie (httpOnly) + canonical signup cookie used by /r/ and signup
    response.cookies.set({
      name: AMBASSADOR_REF_COOKIE,
      value: result.referralCode,
      httpOnly: true,
      ...cookieOpts,
    });
    response.cookies.set({
      name: AMBASSADOR_CODE_COOKIE,
      value: result.referralCode,
      httpOnly: false,
      ...cookieOpts,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Track click failed.";
    console.error("[ambassador/track-click]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
