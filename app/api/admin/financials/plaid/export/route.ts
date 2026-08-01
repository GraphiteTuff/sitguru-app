import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import { getPlaidEnvironment } from "@/lib/plaid";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AnyRow = Record<string, unknown>;

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function isBusinessCheckingOrSavings(account: {
  name?: string | null;
  official_name?: string | null;
  subtype?: string | null;
}) {
  const combinedName = `${account.name || ""} ${
    account.official_name || ""
  }`.toLowerCase();
  const subtype = String(account.subtype || "").toLowerCase();
  const isCheckingOrSavings = subtype === "checking" || subtype === "savings";
  const looksBusiness = combinedName.includes("business");
  return isCheckingOrSavings && looksBusiness;
}

export async function GET(request: NextRequest) {
  const financeCheck = await requireFinanceAdminApi();

  if (!financeCheck.identity) {
    return financeCheck.response;
  }

  const filter = String(request.nextUrl.searchParams.get("filter") || "all")
    .trim()
    .toLowerCase();
  const plaidEnvironment = getPlaidEnvironment();

  const { data: accountRows, error: accountError } = await supabaseAdmin
    .from("admin_plaid_accounts")
    .select("account_id, name, official_name, subtype, mask")
    .eq("plaid_environment", plaidEnvironment);

  if (accountError) {
    return NextResponse.json(
      { error: `Unable to load accounts: ${accountError.message}` },
      { status: 500 },
    );
  }

  const accounts = ((accountRows || []) as AnyRow[]).filter((account) =>
    isBusinessCheckingOrSavings({
      name: String(account.name || ""),
      official_name: String(account.official_name || ""),
      subtype: String(account.subtype || ""),
    }),
  );

  const accountIds = accounts
    .map((account) => String(account.account_id || ""))
    .filter(Boolean);

  if (!accountIds.length) {
    return NextResponse.json(
      { error: "No business checking/savings accounts found." },
      { status: 404 },
    );
  }

  const accountLabelById = new Map(
    accounts.map((account) => [
      String(account.account_id),
      `${account.name || account.official_name || "Account"}${
        account.mask ? ` •••• ${account.mask}` : ""
      }`,
    ]),
  );

  const { data: transactionRows, error: transactionError } = await supabaseAdmin
    .from("admin_plaid_transactions")
    .select(
      "date, name, merchant_name, amount, iso_currency_code, pending, payment_channel, sitguru_category, sitguru_category_type, sitguru_report_section, review_status, manually_categorized, is_excluded_from_reports, sitguru_notes, account_id, transaction_id",
    )
    .in("account_id", accountIds)
    .is("removed_at", null)
    .order("date", { ascending: false })
    .limit(5000);

  if (transactionError) {
    return NextResponse.json(
      { error: `Unable to load transactions: ${transactionError.message}` },
      { status: 500 },
    );
  }

  let rows = (transactionRows || []) as AnyRow[];

  if (filter === "needs_review") {
    rows = rows.filter((row) => {
      const review = String(row.review_status || "").toLowerCase();
      const category = String(row.sitguru_category || "").toLowerCase();
      return (
        review === "needs_review" ||
        !category ||
        category === "uncategorized"
      );
    });
  } else if (filter === "income") {
    rows = rows.filter(
      (row) =>
        String(row.sitguru_category_type || "").toLowerCase() === "income",
    );
  } else if (filter === "expenses") {
    rows = rows.filter(
      (row) =>
        String(row.sitguru_category_type || "").toLowerCase() === "expense",
    );
  } else if (filter === "transfers") {
    rows = rows.filter(
      (row) =>
        String(row.sitguru_category_type || "").toLowerCase() === "transfer",
    );
  }

  const header = [
    "date",
    "account",
    "description",
    "merchant",
    "amount",
    "currency",
    "pending",
    "payment_channel",
    "sitguru_category",
    "sitguru_category_type",
    "sitguru_report_section",
    "review_status",
    "manually_categorized",
    "excluded_from_reports",
    "notes",
    "transaction_id",
  ];

  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.date,
        accountLabelById.get(String(row.account_id)) || row.account_id,
        row.name,
        row.merchant_name,
        row.amount,
        row.iso_currency_code || "USD",
        row.pending ? "true" : "false",
        row.payment_channel,
        row.sitguru_category,
        row.sitguru_category_type,
        row.sitguru_report_section,
        row.review_status,
        row.manually_categorized ? "true" : "false",
        row.is_excluded_from_reports ? "true" : "false",
        row.sitguru_notes,
        row.transaction_id,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];

  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sitguru-plaid-transactions-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
