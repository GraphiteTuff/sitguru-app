import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";

const allowedCategoryTypes = new Set([
  "income",
  "expense",
  "transfer",
  "owner_equity",
  "liability",
  "ignore",
  "uncategorized",
]);

type CategoryBody = {
  transaction_id?: string;
  sitguru_category?: string;
  sitguru_category_type?: string;
  sitguru_report_section?: string;
  sitguru_notes?: string;
  is_excluded_from_reports?: boolean;
};

export async function POST(request: NextRequest) {
  const financeCheck = await requireFinanceAdminApi();

  if (!financeCheck.identity) {
    return financeCheck.response;
  }

  const body = (await request.json().catch(() => ({}))) as CategoryBody;

  const transactionId = String(body.transaction_id || "").trim();
  const category = String(body.sitguru_category || "").trim();
  const categoryType = String(body.sitguru_category_type || "").trim();
  const reportSection = String(body.sitguru_report_section || "").trim();
  const notes = String(body.sitguru_notes || "").trim();

  if (!transactionId) {
    return NextResponse.json(
      { error: "Missing transaction_id." },
      { status: 400 },
    );
  }

  if (!category) {
    return NextResponse.json(
      { error: "Missing SitGuru category." },
      { status: 400 },
    );
  }

  if (!allowedCategoryTypes.has(categoryType)) {
    return NextResponse.json(
      { error: `Invalid SitGuru category type: ${categoryType}` },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("admin_plaid_transactions")
    .update({
      sitguru_category: category,
      sitguru_category_type: categoryType,
      sitguru_report_section: reportSection || "Needs Review",
      sitguru_notes: notes || null,
      is_excluded_from_reports: Boolean(body.is_excluded_from_reports),
      review_status: "reviewed",
      manually_categorized: true,
      categorized_at: new Date().toISOString(),
      categorized_by: financeCheck.identity.id,
      updated_at: new Date().toISOString(),
    })
    .eq("transaction_id", transactionId)
    .select(
      "transaction_id, sitguru_category, sitguru_category_type, sitguru_report_section, review_status, manually_categorized",
    )
    .maybeSingle();

  if (error) {
    console.error("Manual transaction category update error:", error);

    return NextResponse.json(
      { error: "Unable to update transaction category." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Transaction not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Transaction category updated.",
    transaction: data,
  });
}
