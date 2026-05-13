import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

async function requireAdminUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Transaction category profile lookup error:", profileError);

    return {
      user: null,
      response: NextResponse.json(
        { error: "Unable to verify admin profile." },
        { status: 500 },
      ),
    };
  }

  if (profile?.role !== "admin") {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      ),
    };
  }

  return {
    user,
    response: null,
  };
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdminUser();

  if (adminCheck.response || !adminCheck.user) {
    return adminCheck.response;
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
      categorized_by: adminCheck.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", adminCheck.user.id)
    .eq("transaction_id", transactionId)
    .select(
      "transaction_id, sitguru_category, sitguru_category_type, sitguru_report_section, review_status, manually_categorized",
    )
    .single();

  if (error) {
    console.error("Manual transaction category update error:", error);

    return NextResponse.json(
      { error: "Unable to update transaction category." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Transaction category updated.",
    transaction: data,
  });
}