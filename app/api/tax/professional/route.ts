import { NextResponse } from "next/server";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import {
  loadTaxProfessional,
  markTaxPackageSent,
} from "@/lib/admin/financials/accounting/tax-entity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) return financeCheck.response;
  const record = await loadTaxProfessional();
  return NextResponse.json({ ok: true, professional: record });
}

export async function POST() {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) return financeCheck.response;
  await markTaxPackageSent({
    taxYear: new Date().getFullYear(),
    actorEmail: financeCheck.identity.email,
  });
  return NextResponse.json({ ok: true });
}
