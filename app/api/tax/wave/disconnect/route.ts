import { NextResponse } from "next/server";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import { writeAccountingAudit } from "@/lib/admin/financials/accounting/audit";
import { disconnectAccountingConnection } from "@/lib/admin/financials/accounting/connections";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) return financeCheck.response;

  await disconnectAccountingConnection("wave");
  await writeAccountingAudit({
    action: "accounting.wave.disconnected",
    actorId: financeCheck.identity.id,
    actorEmail: financeCheck.identity.email,
    actorRole: financeCheck.identity.role,
  });

  return NextResponse.json({ ok: true });
}
