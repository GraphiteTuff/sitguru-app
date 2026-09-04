import { NextResponse } from "next/server";
import { describeWaveWebhookPlan } from "@/lib/admin/financials/accounting/wave/webhooks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Reserved Wave webhook receiver.
 * Acknowledges the URL exists for later Pro-account webhook setup.
 * Does not write financial data yet.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    enabled: false,
    detail: describeWaveWebhookPlan(),
  });
}

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      enabled: false,
      detail: describeWaveWebhookPlan(),
    },
    { status: 202 },
  );
}
