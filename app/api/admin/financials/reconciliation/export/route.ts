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
  date: string;
  source: string;
  reference: string;
  label: string;
  amount: number;
  status: string;
  matchStatus: string;
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
      console.warn(`Recon export query skipped for ${label}:`, result.error);
      return [];
    }
    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Recon export query skipped for ${label}:`, error);
    return [];
  }
}

function getDate(row: AnyRow) {
  return (
    asTrimmedString(row.date) ||
    asTrimmedString(row.arrival_date) ||
    asTrimmedString(row.available_on) ||
    asTrimmedString(row.created_at) ||
    ""
  );
}

function amountsClose(left: number, right: number, tolerance = 0.51) {
  return Math.abs(Math.abs(left) - Math.abs(right)) <= tolerance;
}

function datesClose(left?: string, right?: string, days = 4) {
  if (!left || !right) return false;
  const a = new Date(left).getTime();
  const b = new Date(right).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return Math.abs(a - b) <= days * 24 * 60 * 60 * 1000;
}

function looksLikeStripeDeposit(row: AnyRow) {
  const text = [
    row.merchant_name,
    row.name,
    row.description,
    row.sitguru_notes,
    row.sitguru_category,
  ]
    .map((value) => asTrimmedString(value).toLowerCase())
    .join(" ");

  return (
    text.includes("stripe") ||
    text.includes("strp") ||
    text.includes("payout") ||
    text.includes("payment processing")
  );
}

async function buildRows(): Promise<ExportRow[]> {
  const plaidEnvironment = getPlaidEnvironment();

  const [accounts, plaidTxns, bookingPayments, payouts, expenses, growth, rewards] =
    await Promise.all([
      safeRows<AnyRow>(
        supabaseAdmin
          .from("admin_plaid_accounts")
          .select("account_id, name, official_name, subtype, plaid_environment")
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
          .from("stripe_payouts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(2000),
        "stripe_payouts",
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
          .limit(2000),
        "admin_growth_marketing_expenses",
      ),
      safeRows<AnyRow>(
        supabaseAdmin
          .from("admin_referral_reward_liability")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(2000),
        "admin_referral_reward_liability",
      ),
    ]);

  const businessIds = new Set(
    accounts
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

  const bankRows = plaidTxns.filter((row) => {
    if (row.is_excluded_from_reports) return false;
    if (!businessIds.size) return true;
    return businessIds.has(asTrimmedString(row.account_id));
  });

  const depositCandidates = bankRows.filter(looksLikeStripeDeposit);
  const used = new Set<string>();
  const rows: ExportRow[] = [];

  for (const row of bankRows) {
    const review = asTrimmedString(row.review_status) || "needs_review";
    const pending = Boolean(row.pending);
    rows.push({
      section: "Bank / NFCU",
      date: getDate(row),
      source: "admin_plaid_transactions",
      reference:
        asTrimmedString(row.transaction_id) || asTrimmedString(row.id),
      label:
        asTrimmedString(row.merchant_name) ||
        asTrimmedString(row.name) ||
        "Bank transaction",
      amount: toNumber(row.amount),
      status: pending ? "Pending" : "Posted",
      matchStatus: review,
      notes:
        asTrimmedString(row.sitguru_category) ||
        asTrimmedString(row.sitguru_notes) ||
        "NFCU/Plaid row",
    });
  }

  for (const row of payouts) {
    const amount =
      centsToDollars(row.amount_cents) ||
      toNumber(row.amount) ||
      toNumber(row.net_amount);
    const explicit =
      asTrimmedString(row.plaid_transaction_id) ||
      asTrimmedString(row.bank_transaction_id) ||
      asTrimmedString(row.matched_bank_transaction_id);
    let matched = Boolean(explicit);
    let method = explicit ? "stored_reference" : "none";

    if (!matched) {
      for (const bank of depositCandidates) {
        const bankId =
          asTrimmedString(bank.transaction_id) || asTrimmedString(bank.id);
        if (!bankId || used.has(bankId)) continue;
        if (!amountsClose(amount, toNumber(bank.amount))) continue;
        if (!datesClose(getDate(row), getDate(bank))) continue;
        used.add(bankId);
        matched = true;
        method = "amount_date";
        break;
      }
    }

    rows.push({
      section: "Stripe Payouts",
      date: getDate(row),
      source: "stripe_payouts",
      reference:
        asTrimmedString(row.stripe_payout_id) || asTrimmedString(row.id),
      label:
        asTrimmedString(row.description) ||
        asTrimmedString(row.bank_description) ||
        "Stripe payout",
      amount,
      status: asTrimmedString(row.status) || "recorded",
      matchStatus: matched ? `matched:${method}` : "unmatched",
      notes: matched
        ? "Matched to NFCU deposit"
        : "Needs Plaid/NFCU deposit match",
    });
  }

  for (const row of bookingPayments) {
    const amount =
      centsToDollars(row.amount_cents) ||
      centsToDollars(row.gross_amount_cents) ||
      centsToDollars(row.marketplace_support_cents);
    if (!amount) continue;

    rows.push({
      section: "Booking Payments",
      date: getDate(row),
      source: "booking_payments",
      reference:
        asTrimmedString(row.payment_intent_id) || asTrimmedString(row.id),
      label:
        asTrimmedString(row.description) ||
        asTrimmedString(row.status) ||
        "Stripe booking payment",
      amount,
      status: asTrimmedString(row.status) || "recorded",
      matchStatus: "stripe_clearing",
      notes: `Platform fee ${money(centsToDollars(row.marketplace_support_cents))}`,
    });
  }

  for (const row of expenses) {
    if (row.is_active === false || row.voided_at || row.archived_at) continue;
    const amount = -Math.abs(
      toNumber(row.amount) || toNumber(row.total_amount),
    );
    if (!amount) continue;
    rows.push({
      section: "Manual Expenses",
      date: getDate(row),
      source: "expense_ledger",
      reference: asTrimmedString(row.id),
      label:
        asTrimmedString(row.description) ||
        asTrimmedString(row.name) ||
        "Manual expense",
      amount,
      status: asTrimmedString(row.status) || "recorded",
      matchStatus: "manual",
      notes: asTrimmedString(row.category) || "Expense ledger",
    });
  }

  for (const row of growth) {
    const amount = -Math.abs(toNumber(row.amount));
    if (!amount) continue;
    rows.push({
      section: "Growth Marketing",
      date: getDate(row),
      source: "admin_growth_marketing_expenses",
      reference: asTrimmedString(row.id),
      label:
        asTrimmedString(row.campaign_name) ||
        asTrimmedString(row.description) ||
        "Growth marketing cost",
      amount,
      status: "recorded",
      matchStatus: "needs_bank_match",
      notes: asTrimmedString(row.financial_category) || "Campaign cost",
    });
  }

  for (const row of rewards) {
    const amount = Math.abs(
      toNumber(row.normalized_amount) || toNumber(row.amount),
    );
    if (!amount) continue;
    const treatment = asTrimmedString(row.financial_treatment).toLowerCase();
    rows.push({
      section: "Referral Rewards",
      date: getDate(row),
      source: "admin_referral_reward_liability",
      reference: asTrimmedString(row.id),
      label:
        asTrimmedString(row.financial_category) ||
        asTrimmedString(row.description) ||
        "Referral reward",
      amount: treatment.includes("issued") ? -amount : amount,
      status: asTrimmedString(row.normalized_status) || "recorded",
      matchStatus: treatment || "reward",
      notes: treatment.includes("pending")
        ? "Pending liability"
        : "Issued/paid reward support",
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

function buildCsv(rows: ExportRow[]) {
  const header = [
    "Section",
    "Date",
    "Source",
    "Reference",
    "Label",
    "Amount",
    "Status",
    "Match Status",
    "Notes",
  ];

  return [
    header.join(","),
    ...rows.map((row) =>
      [
        row.section,
        row.date,
        row.source,
        row.reference,
        row.label,
        row.amount.toFixed(2),
        row.status,
        row.matchStatus,
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
  <title>SitGuru Reconciliation Export</title>
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
  <h1>SitGuru Reconciliation Export</h1>
  <p class="meta">Format: ${htmlEscape(mode)} · Rows: ${rows.length} · Generated ${htmlEscape(new Date().toISOString())}</p>
  <table>
    <thead>
      <tr>
        <th>Section</th>
        <th>Date</th>
        <th>Label</th>
        <th>Source</th>
        <th class="right">Amount</th>
        <th>Status</th>
        <th>Match</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `<tr>
        <td>${htmlEscape(row.section)}</td>
        <td>${htmlEscape(row.date.slice(0, 10))}</td>
        <td>${htmlEscape(row.label)}</td>
        <td>${htmlEscape(row.source)}</td>
        <td class="right">${htmlEscape(money(row.amount))}</td>
        <td>${htmlEscape(row.status)}</td>
        <td>${htmlEscape(row.matchStatus)}</td>
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

  const filename = `sitguru-reconciliation-${new Date()
    .toISOString()
    .slice(0, 10)}.${getExtension(format)}`;

  try {
    await supabaseAdmin.from("financial_audit_logs").insert({
      actor_id: financeCheck.identity.id,
      actor_email: financeCheck.identity.email,
      actor_role: financeCheck.identity.role,
      action: "export_reconciliation",
      area: "financials.reconciliation.export",
      target_type: "reconciliation",
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
