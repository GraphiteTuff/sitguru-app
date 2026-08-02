import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import { getPlaidEnvironment } from "@/lib/plaid";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AnyRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type LedgerExportRow = {
  date: string;
  source: string;
  sourceId: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
  cashImpact: number;
  pnlImpact: number;
  status: string;
  notes: string;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,()]/g, "").trim();
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) {
      return value.includes("(") && value.includes(")") ? -parsed : parsed;
    }
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function centsToDollars(value: unknown) {
  return toNumber(value) / 100;
}

function money(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(value || 0));
  return value < 0 ? `(${formatted})` : formatted;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function htmlEscape(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;
    if (result.error) {
      console.warn(`GL export query skipped for ${label}:`, result.error);
      return [];
    }
    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`GL export query skipped for ${label}:`, error);
    return [];
  }
}

function getRowDate(row: AnyRow) {
  return (
    asTrimmedString(row.date) ||
    asTrimmedString(row.cost_date) ||
    asTrimmedString(row.created_at) ||
    asTrimmedString(row.updated_at) ||
    asTrimmedString(row.posted_at) ||
    asTrimmedString(row.paid_at)
  );
}

function isWithinDateRange(
  row: AnyRow,
  startDate: string | null,
  endDate: string | null,
) {
  const rowDate = getRowDate(row);
  if (!rowDate || (!startDate && !endDate)) return true;

  const parsed = new Date(rowDate);
  if (Number.isNaN(parsed.getTime())) return true;

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    if (parsed < start) return false;
  }

  if (endDate) {
    const end = new Date(`${endDate}T23:59:59.999Z`);
    if (parsed > end) return false;
  }

  return true;
}

function pushSigned(
  rows: LedgerExportRow[],
  input: Omit<LedgerExportRow, "debit" | "credit"> & { amount: number },
) {
  const amount = input.amount;
  rows.push({
    date: input.date,
    source: input.source,
    sourceId: input.sourceId,
    account: input.account,
    description: input.description,
    debit: amount >= 0 ? amount : 0,
    credit: amount < 0 ? Math.abs(amount) : 0,
    cashImpact: input.cashImpact,
    pnlImpact: input.pnlImpact,
    status: input.status,
    notes: input.notes,
  });
}

async function buildLedgerRows({
  startDate,
  endDate,
}: {
  startDate: string | null;
  endDate: string | null;
}) {
  const plaidEnvironment = getPlaidEnvironment();

  const [
    plaidAccounts,
    plaidTransactions,
    bookingPayments,
    expenses,
    cashFlowLines,
    statementLines,
    growthExpenses,
    referralRewards,
    stripeBalance,
    payouts,
  ] = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_plaid_accounts")
        .select(
          "account_id, name, official_name, subtype, plaid_environment",
        )
        .eq("plaid_environment", plaidEnvironment)
        .limit(500),
      "admin_plaid_accounts",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_plaid_transactions")
        .select("*")
        .is("removed_at", null)
        .order("date", { ascending: false })
        .limit(5000),
      "admin_plaid_transactions",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("booking_payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "booking_payments",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("expense_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2500),
      "expense_ledger",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("cash_flow_lines")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(1000),
      "cash_flow_lines",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("financial_statement_lines")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(1000),
      "financial_statement_lines",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_growth_marketing_expenses")
        .select("*")
        .order("cost_date", { ascending: false })
        .limit(2500),
      "admin_growth_marketing_expenses",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_referral_reward_liability")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2500),
      "admin_referral_reward_liability",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("stripe_balance_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2500),
      "stripe_balance_transactions",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("guru_payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2500),
      "guru_payouts",
    ),
  ]);

  const businessAccountIds = new Set(
    plaidAccounts
      .filter((account) => {
        const name =
          `${asTrimmedString(account.name)} ${asTrimmedString(account.official_name)}`.toLowerCase();
        const subtype = asTrimmedString(account.subtype).toLowerCase();
        return (
          (subtype === "checking" || subtype === "savings") &&
          name.includes("business")
        );
      })
      .map((account) => asTrimmedString(account.account_id))
      .filter(Boolean),
  );

  const rows: LedgerExportRow[] = [];

  for (const row of plaidTransactions) {
    if (!businessAccountIds.has(asTrimmedString(row.account_id))) continue;
    if (row.is_excluded_from_reports) continue;
    if (!isWithinDateRange(row, startDate, endDate)) continue;

    const amount = Math.abs(toNumber(row.amount));
    const type = asTrimmedString(row.sitguru_category_type).toLowerCase();
    const signed =
      type === "income" || type === "owner_equity"
        ? amount
        : type === "expense" || type === "owner_draw" || type === "liability"
          ? -amount
          : -amount;

    pushSigned(rows, {
      date: getRowDate(row),
      source: "admin_plaid_transactions",
      sourceId:
        asTrimmedString(row.transaction_id) || asTrimmedString(row.id),
      account:
        asTrimmedString(row.sitguru_category) || "Uncategorized Bank Activity",
      description:
        asTrimmedString(row.merchant_name) ||
        asTrimmedString(row.name) ||
        "Plaid/NFCU transaction",
      amount: signed,
      cashImpact: signed,
      pnlImpact: type === "income" ? amount : type === "expense" ? -amount : 0,
      status: asTrimmedString(row.review_status) || "needs_review",
      notes: asTrimmedString(row.sitguru_notes) || "NFCU/Plaid bank row",
    });
  }

  for (const row of bookingPayments) {
    if (!isWithinDateRange(row, startDate, endDate)) continue;

    const fee = Math.abs(centsToDollars(row.marketplace_support_cents));
    const refund = Math.abs(centsToDollars(row.refund_amount_cents));
    const dispute = Math.abs(centsToDollars(row.dispute_amount_cents));
    const gross =
      Math.abs(centsToDollars(row.amount_cents)) ||
      Math.abs(centsToDollars(row.gross_amount_cents));
    const amount =
      refund > 0 || dispute > 0
        ? -(refund || dispute || fee || gross)
        : fee || gross;

    if (!amount) continue;

    pushSigned(rows, {
      date: getRowDate(row),
      source: "booking_payments",
      sourceId: asTrimmedString(row.id) || asTrimmedString(row.payment_intent_id),
      account:
        amount < 0 ? "Refunds and Allowances" : "Platform Fee Revenue",
      description:
        asTrimmedString(row.description) ||
        `Stripe booking payment · ${asTrimmedString(row.status) || "recorded"}`,
      amount,
      cashImpact: 0,
      pnlImpact: amount,
      status: asTrimmedString(row.status) || "recorded",
      notes:
        "Stripe clearing / marketplace support. Cash lands in NFCU via payout deposits.",
    });
  }

  for (const row of expenses) {
    if (row.is_active === false || row.voided_at || row.archived_at) continue;
    if (!isWithinDateRange(row, startDate, endDate)) continue;

    const amount = -Math.abs(
      toNumber(row.amount) ||
        toNumber(row.total_amount) ||
        toNumber(row.expense_amount),
    );
    if (!amount) continue;

    pushSigned(rows, {
      date: getRowDate(row),
      source: "expense_ledger",
      sourceId: asTrimmedString(row.id),
      account: asTrimmedString(row.category) || "Operating Expenses",
      description:
        asTrimmedString(row.description) ||
        asTrimmedString(row.name) ||
        "Manual operating expense",
      amount,
      cashImpact: amount,
      pnlImpact: amount,
      status: asTrimmedString(row.status) || "recorded",
      notes: "Manual expense ledger row",
    });
  }

  for (const row of cashFlowLines) {
    if (!isWithinDateRange(row, startDate, endDate)) continue;
    const amount = toNumber(row.amount);
    if (!amount) continue;

    pushSigned(rows, {
      date: getRowDate(row),
      source: "cash_flow_lines",
      sourceId: asTrimmedString(row.id),
      account: asTrimmedString(row.label) || "Cash Flow Line",
      description: asTrimmedString(row.notes) || "Manual cash flow line",
      amount,
      cashImpact: amount,
      pnlImpact: 0,
      status: "active",
      notes: `Section: ${asTrimmedString(row.section) || "manual"}`,
    });
  }

  for (const row of statementLines) {
    if (!isWithinDateRange(row, startDate, endDate)) continue;
    const amount = toNumber(row.amount);
    if (!amount) continue;

    pushSigned(rows, {
      date: getRowDate(row),
      source: "financial_statement_lines",
      sourceId: asTrimmedString(row.id),
      account: asTrimmedString(row.label) || "P&L Statement Line",
      description: asTrimmedString(row.notes) || "Manual P&L statement line",
      amount,
      cashImpact: 0,
      pnlImpact: amount,
      status: "active",
      notes: `Section: ${asTrimmedString(row.section) || "manual"}`,
    });
  }

  for (const row of growthExpenses) {
    if (!isWithinDateRange(row, startDate, endDate)) continue;
    const amount = -Math.abs(toNumber(row.amount));
    if (!amount) continue;

    pushSigned(rows, {
      date: getRowDate(row),
      source: "admin_growth_marketing_expenses",
      sourceId: asTrimmedString(row.id),
      account:
        asTrimmedString(row.financial_category) || "Growth Marketing Expense",
      description:
        asTrimmedString(row.description) ||
        asTrimmedString(row.campaign_name) ||
        "Growth marketing cost",
      amount,
      cashImpact: amount,
      pnlImpact: amount,
      status: "recorded",
      notes: "Growth & Referrals campaign cost",
    });
  }

  for (const row of referralRewards) {
    if (!isWithinDateRange(row, startDate, endDate)) continue;
    const amount = Math.abs(
      toNumber(row.normalized_amount) ||
        toNumber(row.amount) ||
        toNumber(row.reward_amount),
    );
    if (!amount) continue;

    const treatment = asTrimmedString(row.financial_treatment).toLowerCase();
    const signed = treatment.includes("pending") ? -amount : amount;

    pushSigned(rows, {
      date: getRowDate(row),
      source: "admin_referral_reward_liability",
      sourceId: asTrimmedString(row.id),
      account:
        asTrimmedString(row.financial_category) || "Referral Reward Activity",
      description:
        asTrimmedString(row.description) ||
        `${asTrimmedString(row.financial_treatment) || "referral reward"}`,
      amount: treatment.includes("issued") ? -amount : signed,
      cashImpact: treatment.includes("issued") ? -amount : 0,
      pnlImpact: treatment.includes("issued") ? -amount : 0,
      status: asTrimmedString(row.normalized_status) || "recorded",
      notes: "Referral reward liability / expense support",
    });
  }

  for (const row of stripeBalance) {
    if (!isWithinDateRange(row, startDate, endDate)) continue;
    const net =
      centsToDollars(row.net) ||
      centsToDollars(row.amount) ||
      toNumber(row.net) ||
      toNumber(row.amount);
    if (!net) continue;

    pushSigned(rows, {
      date: getRowDate(row),
      source: "stripe_balance_transactions",
      sourceId:
        asTrimmedString(row.id) ||
        asTrimmedString(row.balance_transaction_id),
      account: "Stripe Clearing",
      description:
        asTrimmedString(row.description) ||
        asTrimmedString(row.type) ||
        "Stripe balance transaction",
      amount: net,
      cashImpact: 0,
      pnlImpact: 0,
      status: asTrimmedString(row.status) || "recorded",
      notes: "Support schedule for Stripe clearing activity",
    });
  }

  for (const row of payouts) {
    if (!isWithinDateRange(row, startDate, endDate)) continue;
    const amount = -Math.abs(
      toNumber(row.amount) ||
        toNumber(row.net_amount) ||
        toNumber(row.payout_amount) ||
        centsToDollars(row.amount_cents),
    );
    if (!amount) continue;

    pushSigned(rows, {
      date: getRowDate(row),
      source: "guru_payouts",
      sourceId: asTrimmedString(row.id),
      account: "Guru Payouts",
      description:
        asTrimmedString(row.description) ||
        `Guru payout · ${asTrimmedString(row.status) || "recorded"}`,
      amount,
      cashImpact: amount,
      pnlImpact: 0,
      status: asTrimmedString(row.status) || "recorded",
      notes: "Guru payout cash outflow support",
    });
  }

  rows.sort((a, b) => {
    const left = new Date(a.date).getTime() || 0;
    const right = new Date(b.date).getTime() || 0;
    return right - left;
  });

  return rows;
}

function normalizeFormat(format: string | null) {
  const normalized = String(format || "csv").trim().toLowerCase();
  if (["csv", "excel", "xls", "xlsx"].includes(normalized)) {
    return normalized === "csv" ? "csv" : "excel";
  }
  if (["word", "doc", "docx"].includes(normalized)) return "word";
  if (["pdf", "print", "html"].includes(normalized)) return "html";
  return "csv";
}

function buildCsv(rows: LedgerExportRow[]) {
  const header = [
    "Date",
    "Source",
    "Source ID",
    "Account",
    "Description",
    "Debit",
    "Credit",
    "Cash Impact",
    "P&L Impact",
    "Status",
    "Notes",
  ];

  return [
    header.join(","),
    ...rows.map((row) =>
      [
        row.date,
        row.source,
        row.sourceId,
        row.account,
        row.description,
        row.debit.toFixed(2),
        row.credit.toFixed(2),
        row.cashImpact.toFixed(2),
        row.pnlImpact.toFixed(2),
        row.status,
        row.notes,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n");
}

function buildHtml(
  rows: LedgerExportRow[],
  startDate: string | null,
  endDate: string | null,
  mode: "html" | "excel" | "word",
) {
  const totalDebit = rows.reduce((sum, row) => sum + row.debit, 0);
  const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>SitGuru General Ledger</title>
  <style>
    body { font-family: Arial, sans-serif; color: #163127; padding: 24px; }
    h1 { color: #0D5C3A; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 12px; }
    th, td { border: 1px solid #d7e5dc; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #eef7f1; }
    .right { text-align: right; }
    .meta { color: #5b6b63; font-size: 13px; }
  </style>
</head>
<body>
  <h1>SitGuru General Ledger</h1>
  <p class="meta">Period: ${htmlEscape(startDate || "All")} through ${htmlEscape(endDate || "All")} · Format: ${htmlEscape(mode)} · Rows: ${rows.length}</p>
  <p class="meta">Debits ${htmlEscape(money(totalDebit))} · Credits ${htmlEscape(money(totalCredit))} · Difference ${htmlEscape(money(totalDebit - totalCredit))}</p>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Account</th>
        <th>Description</th>
        <th>Source</th>
        <th class="right">Debit</th>
        <th class="right">Credit</th>
        <th class="right">Cash</th>
        <th class="right">P&amp;L</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `<tr>
        <td>${htmlEscape(row.date.slice(0, 10))}</td>
        <td>${htmlEscape(row.account)}</td>
        <td>${htmlEscape(row.description)}</td>
        <td>${htmlEscape(row.source)}</td>
        <td class="right">${row.debit ? htmlEscape(money(row.debit)) : "—"}</td>
        <td class="right">${row.credit ? htmlEscape(money(row.credit)) : "—"}</td>
        <td class="right">${row.cashImpact ? htmlEscape(money(row.cashImpact)) : "—"}</td>
        <td class="right">${row.pnlImpact ? htmlEscape(money(row.pnlImpact)) : "—"}</td>
        <td>${htmlEscape(row.status)}</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>`;
}

function getContentType(format: string) {
  if (format === "csv") return "text/csv; charset=utf-8";
  if (format === "excel") return "application/vnd.ms-excel; charset=utf-8";
  if (format === "word") return "application/msword; charset=utf-8";
  return "text/html; charset=utf-8";
}

function getExtension(format: string) {
  if (format === "csv") return "csv";
  if (format === "excel") return "xls";
  if (format === "word") return "doc";
  return "html";
}

export async function GET(request: Request) {
  const financeCheck = await requireFinanceAdminApi();

  if (!financeCheck.identity) {
    return financeCheck.response;
  }

  const url = new URL(request.url);
  const format = normalizeFormat(url.searchParams.get("format"));
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  const rows = await buildLedgerRows({ startDate, endDate });
  const body =
    format === "csv"
      ? buildCsv(rows)
      : buildHtml(
          rows,
          startDate,
          endDate,
          format === "excel" ? "excel" : format === "word" ? "word" : "html",
        );

  const period = [startDate, endDate].filter(Boolean).join("_to_") || "all";
  const filename = `sitguru-general-ledger-${period}.${getExtension(format)}`;

  try {
    await supabaseAdmin.from("financial_audit_logs").insert({
      actor_id: financeCheck.identity.id,
      actor_email: financeCheck.identity.email,
      actor_role: financeCheck.identity.role,
      action: "export_general_ledger",
      area: "financials.general_ledger.export",
      target_type: "general_ledger",
      metadata: {
        format,
        startDate,
        endDate,
        rowCount: rows.length,
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
      "Content-Type": getContentType(format),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
