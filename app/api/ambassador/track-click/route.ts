// app/api/ambassador/track-click/route.ts
/**
 * Non-blocking referral traffic ingestion for ?ref=CODE landing visits.
 */

import { NextRequest, NextResponse } from "next/server";
import { recordAmbassadorClick } from "@/lib/ambassador/ledger";
import {
  readTrustedReferralCapture,
  referralCaptureTimestamp,
  sealReferralOnResponse,
  signReferralCapture,
  trustedClientIp,
  trustedUserAgent,
} from "@/lib/ambassador/referral-capture";

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

    const header = (name: string) => req.headers.get(name);
    const result = await recordAmbassadorClick({
      slug,
      ipAddress: trustedClientIp(header),
      userAgent: trustedUserAgent(header),
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

    const cookieHeader = req.headers.get("cookie");
    const existing = await readTrustedReferralCapture(cookieHeader);
    const capturedAt = referralCaptureTimestamp({
      incomingCode: result.referralCode,
      existingCode: existing?.code,
      existingCapturedAt: existing?.capturedAt,
      existingTrusted: Boolean(existing),
    });
    const captureMac = await signReferralCapture(result.referralCode, capturedAt);
    const response = NextResponse.json({
      ok: true,
      referralCode: result.referralCode,
      capturedAt,
      captureMac,
    });
    await sealReferralOnResponse(
      response,
      result.referralCode,
      capturedAt,
      cookieHeader,
    );
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Track click failed.";
    console.error("[ambassador/track-click]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
