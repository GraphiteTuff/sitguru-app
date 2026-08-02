import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import { getPlaidEnvironment } from "@/lib/plaid";

function getErrorMessage(error: unknown) {
  if (!error) return "Unable to load Plaid accounts.";

  if (typeof error === "string") return error;

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unable to load Plaid accounts.";
}

export async function GET() {
  const financeCheck = await requireFinanceAdminApi();

  if (!financeCheck.identity) {
    return financeCheck.response;
  }

  const plaidEnvironment = getPlaidEnvironment();

  const { data: accounts, error } = await supabaseAdmin
    .from("admin_plaid_accounts")
    .select("*")
    .eq("plaid_environment", plaidEnvironment)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Plaid accounts load error:", error);

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({
    accounts: accounts || [],
    plaid_environment: plaidEnvironment,
    org_wide: true,
  });
}
