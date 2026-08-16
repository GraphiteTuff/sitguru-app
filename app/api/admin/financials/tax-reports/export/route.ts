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

type ExportRow = {
  section: string;
  category: string;
  source: string;
  count: number;
  amount: number;
  taxTreatment: string;
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
      console.warn(`Tax export query skipped for ${label}:`, result.error);
      return [];
    }
    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Tax export query skipped for ${label}:`, error);
    return [];
  }
}

function isPaidPayment(row: AnyRow) {
  const status = asTrimmedString(row.status).toLowerCase();
  return (
    status.includes("paid") ||
    status.includes("succeeded") ||
    status.includes("complete")
  );
}

function paymentGross(row: AnyRow) {
  return (
    centsToDollars(row.amount_cents) ||
    centsToDollars(row.gross_amount_cents) ||
    centsToDollars(row.total_cents) ||
    toNumber(row.amount)
  );
}

function paymentFee(row: AnyRow) {
  return (
    centsToDollars(row.marketplace_support_cents) ||
    centsToDollars(row.platform_fee_cents) ||
    toNumber(row.platform_fee)
  );
}

function paymentTax(row: AnyRow) {
  return (
    centsToDollars(row.tax_cents) ||
    centsToDollars(row.sales_tax_cents) ||
    toNumber(row.tax_amount)
  );
}

function paymentRefund(row: AnyRow) {
  return (
    centsToDollars(row.refund_amount_cents) ||
    centsToDollars(row.dispute_amount_cents) ||
    toNumber(row.refund_amount)
  );
}

function isBusinessBankAccount(row: AnyRow) {
  const name =
    `${asTrimmedString(row.name)} ${asTrimmedString(row.official_name)}`.toLowerCase();
  const subtype = asTrimmedString(row.subtype).toLowerCase();
  return (
    (subtype === "checking" || subtype === "savings") &&
    name.includes("business")
  );
}

async function buildRows(): Promise<ExportRow[]> {
  const plaidEnvironment = getPlaidEnvironment();

  const [
    bookingPayments,
    expenseRows,
    growthMarketingRows,
    growthSummaryRows,
    rewardRows,
    payoutRows,
    commissionRows,
    stripePayouts,
    plaidAccounts,
  ] = await Promise.all([
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
        .from("admin_growth_marketing_expenses")
        .select("*")
        .order("cost_date", { ascending: false })
        .limit(1000),
      "admin_growth_marketing_expenses",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_growth_financial_summary")
        .select("*")
        .limit(250),
      "admin_growth_financial_summary",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_referral_reward_liability")
        .select("*")
        .limit(2500),
      "admin_referral_reward_liability",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("payouts").select("*").limit(2500),
      "payouts",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("commissions").select("*").limit(2500),
      "commissions",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("stripe_payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "stripe_payouts",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_plaid_accounts")
        .select(
          "account_id, name, official_name, subtype, current_balance, available_balance, plaid_environment",
        )
        .eq("plaid_environment", plaidEnvironment)
        .limit(500),
      "admin_plaid_accounts",
    ),
  ]);

  const stripePayments = bookingPayments.filter((row) => {
    const provider = asTrimmedString(row.provider).toLowerCase();
    return !provider || provider === "stripe";
  });
  const paid = stripePayments.filter(isPaidPayment);

  let gross = 0;
  let fees = 0;
  let taxSupport = 0;
  let refunds = 0;
  for (const row of paid) {
    gross += Math.abs(paymentGross(row));
    fees += Math.abs(paymentFee(row));
    taxSupport += Math.abs(paymentTax(row));
    refunds += Math.abs(paymentRefund(row));
  }

  const expenseTotal = expenseRows.reduce(
    (sum, row) =>
      sum +
      Math.abs(
        toNumber(row.amount) ||
          centsToDollars(row.amount_cents) ||
          toNumber(row.total_amount),
      ),
    0,
  );

  const growthMarketingTotal = growthMarketingRows.reduce(
    (sum, row) =>
      sum +
      Math.abs(
        toNumber(row.amount) ||
          toNumber(row.total_cost) ||
          toNumber(row.cost),
      ),
    0,
  );

  const marketingSummary = growthSummaryRows
    .filter((row) =>
      `${asTrimmedString(row.financial_category)} ${asTrimmedString(row.financial_statement_section)}`
        .toLowerCase()
        .includes("marketing"),
    )
    .reduce((sum, row) => sum + Math.abs(toNumber(row.total_amount)), 0);

  const pendingRewards = rewardRows
    .filter((row) => {
      const status =
        `${asTrimmedString(row.reward_status)} ${asTrimmedString(row.financial_statement_section)}`.toLowerCase();
      return (
        status.includes("pending") ||
        status.includes("liability") ||
        status.includes("payable")
      );
    })
    .reduce(
      (sum, row) =>
        sum +
        Math.abs(
          toNumber(row.amount) ||
            toNumber(row.reward_amount) ||
            toNumber(row.total_amount),
        ),
      0,
    );

  const issuedRewards = rewardRows
    .filter((row) => {
      const status =
        `${asTrimmedString(row.reward_status)} ${asTrimmedString(row.financial_statement_section)}`.toLowerCase();
      return (
        status.includes("issued") ||
        status.includes("paid") ||
        status.includes("credited") ||
        status.includes("expense")
      );
    })
    .reduce(
      (sum, row) =>
        sum +
        Math.abs(
          toNumber(row.amount) ||
            toNumber(row.reward_amount) ||
            toNumber(row.total_amount),
        ),
      0,
    );

  const payoutTotal = payoutRows.reduce(
    (sum, row) =>
      sum +
      Math.abs(
        toNumber(row.amount) ||
          toNumber(row.payout_amount) ||
          centsToDollars(row.amount_cents),
      ),
    0,
  );

  const commissionTotal = commissionRows.reduce(
    (sum, row) =>
      sum +
      Math.abs(
        toNumber(row.amount) ||
          toNumber(row.commission_amount) ||
          centsToDollars(row.amount_cents),
      ),
    0,
  );

  const stripePayoutTotal = stripePayouts.reduce(
    (sum, row) =>
      sum +
      Math.abs(
        centsToDollars(row.amount) ||
          centsToDollars(row.amount_cents) ||
          toNumber(row.amount),
      ),
    0,
  );

  const businessAccounts = plaidAccounts.filter(isBusinessBankAccount);
  const liveCash = businessAccounts.reduce(
    (sum, row) => sum + toNumber(row.current_balance),
    0,
  );

  return [
    {
      section: "Income",
      category: "Gross Booking Volume",
      source: "booking_payments",
      count: paid.length,
      amount: gross,
      taxTreatment: "Gross marketplace volume support; not SitGuru net income.",
      notes: "Paid Stripe booking_payments gross totals.",
    },
    {
      section: "Income",
      category: "Platform / Marketplace Support Fees",
      source: "booking_payments.marketplace_support_cents",
      count: paid.length,
      amount: fees,
      taxTreatment: "Operating revenue candidate; CPA review.",
      notes: "Observed marketplace support fees from paid booking payments.",
    },
    {
      section: "Income",
      category: "Customer Tax / Local Charge Support",
      source: "booking_payments.tax_cents",
      count: paid.filter((row) => paymentTax(row) !== 0).length,
      amount: taxSupport,
      taxTreatment: "Possible sales/local tax remittance support; CPA review.",
      notes: "Tax cents captured on booking payments when present.",
    },
    {
      section: "Contra Revenue",
      category: "Refunds / Disputes Support",
      source: "booking_payments",
      count: paid.filter((row) => paymentRefund(row) !== 0).length,
      amount: refunds,
      taxTreatment: "Revenue offset / expense support depending on treatment.",
      notes: "Refund and dispute cents from booking payments.",
    },
    {
      section: "Deductions",
      category: "Manual Expense Ledger",
      source: "expense_ledger",
      count: expenseRows.length,
      amount: expenseTotal,
      taxTreatment: "Deductibility depends on category and substantiation.",
      notes: "Operating expense support from expense_ledger.",
    },
    {
      section: "Deductions",
      category: "Growth Marketing Spend",
      source: "admin_growth_marketing_expenses + summary",
      count: growthMarketingRows.length + growthSummaryRows.length,
      amount: growthMarketingTotal + marketingSummary,
      taxTreatment: "Advertising / marketing deduction support.",
      notes: "Campaign costs and growth financial summary marketing rows.",
    },
    {
      section: "1099 Support",
      category: "Guru / Contractor Payouts",
      source: "payouts",
      count: payoutRows.length,
      amount: payoutTotal,
      taxTreatment: "Contractor / 1099 classification review.",
      notes: "Payout ledger totals for Guru and contractor support.",
    },
    {
      section: "1099 Support",
      category: "Partner Commissions",
      source: "commissions",
      count: commissionRows.length,
      amount: commissionTotal,
      taxTreatment: "Commission expense; CPA review for reporting thresholds.",
      notes: "Commission ledger totals.",
    },
    {
      section: "Liabilities",
      category: "Pending Referral Reward Liability",
      source: "admin_referral_reward_liability",
      count: rewardRows.length,
      amount: pendingRewards,
      taxTreatment: "Liability support until paid/issued.",
      notes: "Pending PawPerks / referral reward exposure.",
    },
    {
      section: "Deductions",
      category: "Issued Referral Rewards",
      source: "admin_referral_reward_liability",
      count: rewardRows.length,
      amount: issuedRewards,
      taxTreatment: "Possible expense once issued/paid; CPA review.",
      notes: "Issued or paid referral reward expense support.",
    },
    {
      section: "Reconciliation",
      category: "Stripe Payouts",
      source: "stripe_payouts",
      count: stripePayouts.length,
      amount: stripePayoutTotal,
      taxTreatment: "Cash movement from Stripe clearing; not additive revenue.",
      notes: "Stripe payout schedule support for bank matching.",
    },
    {
      section: "Cash",
      category: "Live NFCU Business Cash",
      source: "admin_plaid_accounts",
      count: businessAccounts.length,
      amount: liveCash,
      taxTreatment: "Balance sheet cash support.",
      notes: `Plaid environment ${plaidEnvironment}; business checking/savings only.`,
    },
  ];
}

function normalizeFormat(format: string | null) {
  const normalized = asTrimmedString(format).toLowerCase();
  if (["excel", "xls", "xlsx"].includes(normalized)) return "excel";
  if (["word", "doc", "docx"].includes(normalized)) return "word";
  if (["pdf", "html"].includes(normalized)) return "pdf";
  return "csv";
}

function buildCsv(rows: ExportRow[]) {
  const header = [
    "Section",
    "Category",
    "Source",
    "Count",
    "Amount",
    "Tax Treatment",
    "Notes",
  ];

  return [
    header.join(","),
    ...rows.map((row) =>
      [
        row.section,
        row.category,
        row.source,
        row.count,
        row.amount.toFixed(2),
        row.taxTreatment,
        row.notes,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n");
}

function buildHtml(rows: ExportRow[], mode: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>SitGuru Tax Center Export</title>
  <style>
    body { font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; color: #163127; padding: 24px; }
    h1 { color: #0D5C3A; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 12px; }
    th, td { border: 1px solid #d7e5dc; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #eef7f1; }
    .right { text-align: right; }
    .meta { color: #5b6b63; font-size: 13px; }
  </style>
</head>
<body>
  <h1>SitGuru Tax Center Export</h1>
  <p class="meta">Format: ${htmlEscape(mode)} · Rows: ${rows.length} · Generated ${htmlEscape(new Date().toISOString())}</p>
  <p class="meta">CPA note: Confirm final tax treatment before paying or filing. This export organizes support totals only.</p>
  <table>
    <thead>
      <tr>
        <th>Section</th>
        <th>Category</th>
        <th>Source</th>
        <th class="right">Count</th>
        <th class="right">Amount</th>
        <th>Tax Treatment</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `<tr>
        <td>${htmlEscape(row.section)}</td>
        <td>${htmlEscape(row.category)}</td>
        <td>${htmlEscape(row.source)}</td>
        <td class="right">${htmlEscape(row.count)}</td>
        <td class="right">${htmlEscape(money(row.amount))}</td>
        <td>${htmlEscape(row.taxTreatment)}</td>
        <td>${htmlEscape(row.notes)}</td>
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
  if (!financeCheck.identity) return financeCheck.response;

  const url = new URL(request.url);
  const format = normalizeFormat(url.searchParams.get("format"));
  const rows = await buildRows();
  const body =
    format === "csv"
      ? buildCsv(rows)
      : buildHtml(
          rows,
          format === "excel" ? "excel" : format === "word" ? "word" : "html",
        );

  const filename = `sitguru-tax-center-${new Date()
    .toISOString()
    .slice(0, 10)}.${getExtension(format)}`;

  try {
    await supabaseAdmin.from("financial_audit_logs").insert({
      actor_id: financeCheck.identity.id,
      actor_email: financeCheck.identity.email,
      actor_role: financeCheck.identity.role,
      action: "export_tax_reports",
      area: "financials.tax_reports.export",
      target_type: "tax_reports",
      metadata: { format, rowCount: rows.length, filename },
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
