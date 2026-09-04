import { NextResponse } from "next/server";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import { writeAccountingAudit } from "@/lib/admin/financials/accounting/audit";
import {
  loadAccountingConnection,
  toSafeConnection,
} from "@/lib/admin/financials/accounting/connections";
import { createWaveProvider } from "@/lib/admin/financials/accounting/wave/provider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) return financeCheck.response;

  const connection = await loadAccountingConnection("wave");
  if (!connection || connection.status === "disconnected") {
    return NextResponse.json({ error: "Wave is not connected." }, { status: 400 });
  }

  await writeAccountingAudit({
    action: "accounting.wave.sync_started",
    actorId: financeCheck.identity.id,
    actorEmail: financeCheck.identity.email,
    actorRole: financeCheck.identity.role,
  });

  const result = await createWaveProvider().healthCheck();
  await writeAccountingAudit({
    action: result.ok
      ? "accounting.wave.sync_completed"
      : "accounting.wave.sync_failed",
    actorId: financeCheck.identity.id,
    actorEmail: financeCheck.identity.email,
    actorRole: financeCheck.identity.role,
    metadata: { detail: result.detail, readonly: true },
  });

  return NextResponse.json({
    ok: result.ok,
    readonly: true,
    detail: result.detail,
    connection: toSafeConnection(await loadAccountingConnection("wave")),
  });
}
