import { NextResponse } from "next/server";
import { getReferralReportingEpoch } from "@/lib/referrals/reporting-epoch";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const epoch = await getReferralReportingEpoch();
    return NextResponse.json({
      active: Boolean(epoch),
      startedAt: epoch?.startedAt ?? null,
      label: epoch?.label ?? null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { active: false, error: "Referral reporting baseline is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
