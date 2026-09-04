import { NextResponse } from "next/server";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import {
  isWaveAccountingEnabled,
  loadProviderCatalog,
} from "@/lib/admin/financials/accounting/catalog";
import {
  loadAccountingConnection,
  toSafeConnection,
} from "@/lib/admin/financials/accounting/connections";
import { getWavePublicStatus } from "@/lib/admin/financials/accounting/wave/config";
import { describeWaveWebhookPlan } from "@/lib/admin/financials/accounting/wave/webhooks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) return financeCheck.response;

  const [connection, catalog] = await Promise.all([
    loadAccountingConnection("wave"),
    loadProviderCatalog(),
  ]);
  const waveCopy = catalog.find((row) => row.provider === "wave");
  const setup = getWavePublicStatus();
  const enabled = isWaveAccountingEnabled();

  return NextResponse.json({
    ok: true,
    enabled,
    comingSoon: !enabled || !setup.configured,
    setup,
    connection: toSafeConnection(connection),
    pricingNote: waveCopy?.pricingNote,
    supportUrl: waveCopy?.supportUrl,
    webhookPlan: describeWaveWebhookPlan(),
  });
}
