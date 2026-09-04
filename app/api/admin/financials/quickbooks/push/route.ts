import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import { loadQuickBooksFeed } from "@/lib/admin/financials/quickbooks-feed";
import { markQuickBooksPush, loadQuickBooksConnection } from "@/lib/admin/financials/quickbooks-online";
import { pushQuickBooksJournal } from "@/lib/admin/financials/quickbooks-push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) return financeCheck.response;

  const { feed } = await loadQuickBooksFeed();

  try {
    const result = await pushQuickBooksJournal(feed);

    try {
      await supabaseAdmin.from("financial_audit_logs").insert({
        actor_id: financeCheck.identity.id,
        actor_email: financeCheck.identity.email,
        actor_role: financeCheck.identity.role,
        action: "push_quickbooks_journal",
        area: "financials.tax_reports.quickbooks",
        target_type: "quickbooks_journal",
        target_id: result.journalId,
        metadata: result,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Audit tables may not exist in every environment.
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "QuickBooks push failed.";
    const connection = await loadQuickBooksConnection();
    if (connection) {
      await markQuickBooksPush({
        connectionId: connection.id,
        docNumber: feed.journalNo,
        error: message,
      });
    }
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
