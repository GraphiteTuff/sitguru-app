import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import { disconnectQuickBooks } from "@/lib/admin/financials/quickbooks-online";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) return financeCheck.response;

  await disconnectQuickBooks();

  try {
    await supabaseAdmin.from("financial_audit_logs").insert({
      actor_id: financeCheck.identity.id,
      actor_email: financeCheck.identity.email,
      actor_role: financeCheck.identity.role,
      action: "disconnect_quickbooks",
      area: "financials.tax_reports.quickbooks",
      target_type: "quickbooks_connection",
      created_at: new Date().toISOString(),
    });
  } catch {
    // Audit tables may not exist in every environment.
  }

  return NextResponse.json({ ok: true });
}
