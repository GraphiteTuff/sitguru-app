import { NextResponse } from "next/server";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import { writeAccountingAudit } from "@/lib/admin/financials/accounting/audit";
import {
  loadAccountingConnection,
  toSafeConnection,
} from "@/lib/admin/financials/accounting/connections";
import { syncSitGuruBooksToWave } from "@/lib/admin/financials/accounting/wave/sync";

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

  try {
    const result = await syncSitGuruBooksToWave();
    await writeAccountingAudit({
      action: "accounting.wave.sync_completed",
      actorId: financeCheck.identity.id,
      actorEmail: financeCheck.identity.email,
      actorRole: financeCheck.identity.role,
      metadata: {
        postedCount: result.postedCount,
        postedTotal: result.postedTotal,
        readonly: false,
      },
    });
    return NextResponse.json({
      ...result,
      connection: toSafeConnection(await loadAccountingConnection("wave")),
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Wave sync failed.";
    const reconnect = /reconnect/i.test(message) || (caught as { code?: string }).code === "WAVE_RECONNECT_REQUIRED";
    await writeAccountingAudit({
      action: "accounting.wave.sync_failed",
      actorId: financeCheck.identity.id,
      actorEmail: financeCheck.identity.email,
      actorRole: financeCheck.identity.role,
      metadata: { detail: message, reconnect },
    });
    return NextResponse.json(
      {
        ok: false,
        error: message,
        detail: message,
        reconnect,
        connection: toSafeConnection(await loadAccountingConnection("wave")),
      },
      { status: reconnect ? 409 : 400 },
    );
  }
}
