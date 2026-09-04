import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import {
  buildQuickBooksIif,
  buildQuickBooksMappingCsv,
  buildQuickBooksOnlineCsv,
  loadQuickBooksFeed,
} from "@/lib/admin/financials/quickbooks-feed";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function GET(request: Request) {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) return financeCheck.response;

  const format = asTrimmed(new URL(request.url).searchParams.get("format"));
  const { feed } = await loadQuickBooksFeed();

  let body = "";
  let contentType = "text/csv; charset=utf-8";
  let extension = "csv";

  if (format === "iif") {
    body = buildQuickBooksIif(feed);
    contentType = "application/qbooks; charset=utf-8";
    extension = "iif";
  } else if (format === "mapping") {
    body = buildQuickBooksMappingCsv(feed);
    extension = "csv";
  } else {
    body = buildQuickBooksOnlineCsv(feed);
    extension = "csv";
  }

  const filename = `sitguru-quickbooks-tax-feed-${feed.journalNo}.${extension}`;

  try {
    await supabaseAdmin.from("financial_audit_logs").insert({
      actor_id: financeCheck.identity.id,
      actor_email: financeCheck.identity.email,
      actor_role: financeCheck.identity.role,
      action: "export_quickbooks_tax_feed",
      area: "financials.tax_reports.quickbooks",
      target_type: "quickbooks_feed",
      metadata: {
        format: format || "qbo",
        journalNo: feed.journalNo,
        lineCount: feed.lines.length,
        filename,
      },
      created_at: new Date().toISOString(),
    });
  } catch {
    // Audit tables may not exist in every environment.
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
