import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessFinancials: boolean;
};

type Assumptions = {
  id: string;
  scenarioName: string;
  monthlyBookings: number;
  averageBookingValue: number;
  platformFeeRate: number;
  guruPayoutRate: number;
  refundRate: number;
  monthlyMarketingSpend: number;
  monthlySoftwareSpend: number;
  monthlyAdminSpend: number;
  monthlyInsuranceSpend: number;
  monthlyLegalSpend: number;
  otherMonthlyExpenses: number;
  beginningCash: number;
  ownerContribution: number;
  loanProceeds: number;
  loanRepayments: number;
  monthlyGrowthRate: number;
  forecastMonths: number;
};

type ProFormaMonth = {
  monthNumber: number;
  label: string;
  projectedBookings: number;
  grossBookingVolume: number;
  platformRevenue: number;
  guruPayouts: number;
  refunds: number;
  grossProfit: number;
  operatingExpenses: number;
  netIncome: number;
  financingCash: number;
  netCashFlow: number;
  endingCash: number;
};

type ProFormaExportRow = {
  section: string;
  lineItem: string;
  accountingAccount: string;
  quickBooksAccount: string;
  source: string;
  sourceId: string;
  month: string;
  monthNumber: number;
  amount: number;
  debit: number;
  credit: number;
  formattedAmount: string;
  statementImpact: string;
  taxTreatment: string;
  reconciliationStatus: string;
  notes: string;
};

type ProFormaPackage = {
  assumptions: Assumptions;
  forecast: ProFormaMonth[];
  rows: ProFormaExportRow[];
  totals: {
    totalGrossBookingVolume: number;
    totalPlatformRevenue: number;
    totalGuruPayouts: number;
    totalRefunds: number;
    totalOperatingExpenses: number;
    totalNetIncome: number;
    beginningCash: number;
    endingCash: number;
    breakEvenMonth: number | null;
    totalNetCashFlow: number;
  };
  metadata: {
    reportName: string;
    generatedAt: string;
    scenarioName: string;
    forecastMonths: number;
    rowCount: number;
  };
};

const DEFAULT_ASSUMPTIONS: Assumptions = {
  id: "",
  scenarioName: "Base Case",
  monthlyBookings: 25,
  averageBookingValue: 75,
  platformFeeRate: 8,
  guruPayoutRate: 92,
  refundRate: 2,
  monthlyMarketingSpend: 250,
  monthlySoftwareSpend: 100,
  monthlyAdminSpend: 150,
  monthlyInsuranceSpend: 75,
  monthlyLegalSpend: 100,
  otherMonthlyExpenses: 100,
  beginningCash: 0,
  ownerContribution: 0,
  loanProceeds: 0,
  loanRepayments: 0,
  monthlyGrowthRate: 10,
  forecastMonths: 12,
};

const FINANCE_ROLES = [
  "owner",
  "super_admin",
  "admin",
  "finance_admin",
  "finance",
  "accounting",
  "bookkeeper",
];

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

function getOptionalBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }

  return false;
}

function money(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(value || 0));

  return value < 0 ? `(${formatted})` : formatted;
}

function percent(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}%`;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

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
      console.warn(`Pro forma export query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Pro forma export query skipped for ${label}:`, error);
    return [];
  }
}

function getEnvAdminEmails() {
  return String(
    process.env.SITGURU_FINANCE_ADMIN_EMAILS ||
      process.env.ADMIN_EMAILS ||
      process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
      "",
  )
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function hasFinancialRole(role: string) {
  return FINANCE_ROLES.includes(role.trim().toLowerCase());
}

async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const userEmail = (user.email || "").toLowerCase();
  const envAdminEmails = getEnvAdminEmails();

  const profileChecks = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_users")
        .select("role,email,is_active,can_access_financials")
        .eq("user_id", user.id)
        .limit(1),
      "admin_users_finance_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_finance_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_finance_access",
    ),
  ]);

  const profile = profileChecks.flat().find(Boolean) || {};
  const role = asTrimmedString(profile.role) || "admin";
  const active =
    profile.is_active === undefined
      ? true
      : getOptionalBoolean(profile.is_active);
  const explicitFinanceAccess = getOptionalBoolean(
    profile.can_access_financials,
  );
  const envAllowed = envAdminEmails.includes(userEmail);

  return {
    id: user.id,
    email: userEmail,
    role,
    canAccessFinancials:
      active && (hasFinancialRole(role) || explicitFinanceAccess || envAllowed),
  };
}

async function requireFinancialAdmin() {
  const identity = await getAdminIdentity();

  if (!identity?.canAccessFinancials) {
    return null;
  }

  return identity;
}

async function writeFinancialAuditLog({
  actor,
  action,
  metadata,
}: {
  actor: AdminIdentity;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  const payload = {
    actor_id: actor.id,
    actor_email: actor.email,
    actor_role: actor.role,
    action,
    area: "financials.pro_forma.export",
    target_type: "pro_forma_forecast",
    target_id: null,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabaseAdmin
      .from("financial_audit_logs")
      .insert(payload);

    if (!error) return;
  } catch {
    // Keep exports from failing if the audit table has not been created yet.
  }

  try {
    await supabaseAdmin.from("admin_audit_logs").insert(payload);
  } catch (error) {
    console.warn("Pro forma export audit log skipped:", error);
  }
}

function rowToAssumptions(row?: AnyRow): Assumptions {
  if (!row) return DEFAULT_ASSUMPTIONS;

  return {
    id: asTrimmedString(row.id),
    scenarioName: asTrimmedString(row.scenario_name) || "Base Case",
    monthlyBookings: toNumber(row.monthly_bookings),
    averageBookingValue: toNumber(row.average_booking_value),
    platformFeeRate: toNumber(row.platform_fee_rate),
    guruPayoutRate: toNumber(row.guru_payout_rate),
    refundRate: toNumber(row.refund_rate),
    monthlyMarketingSpend: toNumber(row.monthly_marketing_spend),
    monthlySoftwareSpend: toNumber(row.monthly_software_spend),
    monthlyAdminSpend: toNumber(row.monthly_admin_spend),
    monthlyInsuranceSpend: toNumber(row.monthly_insurance_spend),
    monthlyLegalSpend: toNumber(row.monthly_legal_spend),
    otherMonthlyExpenses: toNumber(row.other_monthly_expenses),
    beginningCash: toNumber(row.beginning_cash),
    ownerContribution: toNumber(row.owner_contribution),
    loanProceeds: toNumber(row.loan_proceeds),
    loanRepayments: toNumber(row.loan_repayments),
    monthlyGrowthRate: toNumber(row.monthly_growth_rate),
    forecastMonths: Math.max(
      1,
      Math.min(36, Math.round(toNumber(row.forecast_months) || 12)),
    ),
  };
}

function buildForecast(assumptions: Assumptions): ProFormaMonth[] {
  const forecastMonths = Math.max(
    1,
    Math.min(36, assumptions.forecastMonths || 12),
  );
  const growthRate = assumptions.monthlyGrowthRate / 100;

  let runningCash =
    assumptions.beginningCash +
    assumptions.ownerContribution +
    assumptions.loanProceeds;

  return Array.from({ length: forecastMonths }, (_, index) => {
    const monthNumber = index + 1;
    const growthMultiplier = Math.pow(1 + growthRate, index);
    const projectedBookings = assumptions.monthlyBookings * growthMultiplier;
    const grossBookingVolume =
      projectedBookings * assumptions.averageBookingValue;

    const platformRevenue =
      grossBookingVolume * (assumptions.platformFeeRate / 100);
    const guruPayouts =
      grossBookingVolume * (assumptions.guruPayoutRate / 100);
    const refunds = grossBookingVolume * (assumptions.refundRate / 100);
    const grossProfit = platformRevenue - refunds;

    const operatingExpenses =
      assumptions.monthlyMarketingSpend +
      assumptions.monthlySoftwareSpend +
      assumptions.monthlyAdminSpend +
      assumptions.monthlyInsuranceSpend +
      assumptions.monthlyLegalSpend +
      assumptions.otherMonthlyExpenses;

    const netIncome = grossProfit - operatingExpenses;

    const financingCash =
      index === 0
        ? assumptions.ownerContribution +
          assumptions.loanProceeds -
          assumptions.loanRepayments
        : -assumptions.loanRepayments;

    const netCashFlow = netIncome + financingCash;
    runningCash += netCashFlow;

    return {
      monthNumber,
      label: `Month ${monthNumber}`,
      projectedBookings,
      grossBookingVolume,
      platformRevenue,
      guruPayouts,
      refunds,
      grossProfit,
      operatingExpenses,
      netIncome,
      financingCash,
      netCashFlow,
      endingCash: runningCash,
    };
  });
}

function addRow(
  rows: ProFormaExportRow[],
  input: Omit<ProFormaExportRow, "formattedAmount" | "debit" | "credit">,
) {
  const debit = input.amount > 0 ? input.amount : 0;
  const credit = input.amount < 0 ? Math.abs(input.amount) : 0;

  rows.push({
    ...input,
    debit,
    credit,
    formattedAmount: money(input.amount),
  });
}

function buildRows(forecast: ProFormaMonth[], assumptions: Assumptions) {
  const rows: ProFormaExportRow[] = [];

  for (const month of forecast) {
    addRow(rows, {
      section: "Revenue Forecast",
      lineItem: "Projected Gross Booking Volume",
      accountingAccount: "Gross Booking Volume",
      quickBooksAccount: "Sales / Service Revenue Support",
      source: "proforma_assumptions",
      sourceId: assumptions.id || "default",
      month: month.label,
      monthNumber: month.monthNumber,
      amount: month.grossBookingVolume,
      statementImpact: "Top-line marketplace volume support schedule",
      taxTreatment:
        "Gross marketplace volume; CPA should determine revenue recognition treatment.",
      reconciliationStatus: "Forecast / Not Reconciled",
      notes:
        "Projected customer booking volume before platform-fee revenue recognition.",
    });

    addRow(rows, {
      section: "Revenue Forecast",
      lineItem: "Projected SitGuru Platform Revenue",
      accountingAccount: "Platform Revenue",
      quickBooksAccount: "Service Revenue",
      source: "proforma_assumptions",
      sourceId: assumptions.id || "default",
      month: month.label,
      monthNumber: month.monthNumber,
      amount: month.platformRevenue,
      statementImpact: "Forecasted P&L revenue",
      taxTreatment: "Projected taxable operating revenue; CPA review.",
      reconciliationStatus: "Forecast / Not Reconciled",
      notes: `${percent(assumptions.platformFeeRate)} platform fee assumption.`,
    });

    addRow(rows, {
      section: "Cost of Revenue Forecast",
      lineItem: "Projected Guru Payouts",
      accountingAccount: "Guru Payouts",
      quickBooksAccount: "Contract Labor / Cost of Services",
      source: "proforma_assumptions",
      sourceId: assumptions.id || "default",
      month: month.label,
      monthNumber: month.monthNumber,
      amount: -month.guruPayouts,
      statementImpact: "Forecasted cost of revenue / marketplace payout",
      taxTreatment:
        "Contractor/1099 treatment may apply; CPA should review classification.",
      reconciliationStatus: "Forecast / Not Reconciled",
      notes: `${percent(assumptions.guruPayoutRate)} payout rate assumption.`,
    });

    addRow(rows, {
      section: "Contra-Revenue Forecast",
      lineItem: "Projected Refunds / Customer Credits",
      accountingAccount: "Refunds and Allowances",
      quickBooksAccount: "Refunds and Allowances",
      source: "proforma_assumptions",
      sourceId: assumptions.id || "default",
      month: month.label,
      monthNumber: month.monthNumber,
      amount: -month.refunds,
      statementImpact: "Forecasted revenue reduction or cash outflow",
      taxTreatment: "Contra-revenue or customer credit; CPA review.",
      reconciliationStatus: "Forecast / Not Reconciled",
      notes: `${percent(assumptions.refundRate)} refund rate assumption.`,
    });

    addRow(rows, {
      section: "Gross Profit Forecast",
      lineItem: "Projected Gross Profit",
      accountingAccount: "Gross Profit",
      quickBooksAccount: "Income Statement Summary",
      source: "calculated",
      sourceId: `gross_profit:month_${month.monthNumber}`,
      month: month.label,
      monthNumber: month.monthNumber,
      amount: month.grossProfit,
      statementImpact: "Forecasted gross profit",
      taxTreatment: "Forecast summary; no direct tax category.",
      reconciliationStatus: "Calculated Forecast",
      notes:
        "Platform revenue less projected refunds; guru payouts are shown separately for planning.",
    });

    addRow(rows, {
      section: "Operating Expense Forecast",
      lineItem: "Projected Operating Expenses",
      accountingAccount: "Operating Expenses",
      quickBooksAccount: "Operating Expenses",
      source: "proforma_assumptions",
      sourceId: assumptions.id || "default",
      month: month.label,
      monthNumber: month.monthNumber,
      amount: -month.operatingExpenses,
      statementImpact: "Forecasted operating expense",
      taxTreatment:
        "Deductibility depends on category and substantiation; CPA review.",
      reconciliationStatus: "Forecast / Not Reconciled",
      notes:
        "Marketing, software, admin, insurance, legal, and other monthly expense assumptions.",
    });

    addRow(rows, {
      section: "Net Income Forecast",
      lineItem: "Projected Net Income / Loss",
      accountingAccount: "Net Income",
      quickBooksAccount: "Net Income",
      source: "calculated",
      sourceId: `net_income:month_${month.monthNumber}`,
      month: month.label,
      monthNumber: month.monthNumber,
      amount: month.netIncome,
      statementImpact: "Forecasted net income / loss",
      taxTreatment: "Forecast summary; no direct tax category.",
      reconciliationStatus: "Calculated Forecast",
      notes:
        "Gross profit less operating expenses before financing cash movements.",
    });

    addRow(rows, {
      section: "Cash Flow Forecast",
      lineItem: "Projected Financing Cash Movement",
      accountingAccount: "Owner Equity / Debt Financing",
      quickBooksAccount: "Owner Investment / Loans Payable",
      source: "proforma_assumptions",
      sourceId: assumptions.id || "default",
      month: month.label,
      monthNumber: month.monthNumber,
      amount: month.financingCash,
      statementImpact: "Forecasted financing cash flow",
      taxTreatment:
        "Owner contributions, loan proceeds, and repayments are generally balance sheet/cash-flow items; CPA review.",
      reconciliationStatus: "Forecast / Not Reconciled",
      notes:
        "Includes owner contribution, loan proceeds, and recurring loan repayment assumptions.",
    });

    addRow(rows, {
      section: "Cash Flow Forecast",
      lineItem: "Projected Net Cash Flow",
      accountingAccount: "Cash Flow Forecast",
      quickBooksAccount: "Statement of Cash Flows",
      source: "calculated",
      sourceId: `net_cash_flow:month_${month.monthNumber}`,
      month: month.label,
      monthNumber: month.monthNumber,
      amount: month.netCashFlow,
      statementImpact: "Forecasted period cash movement",
      taxTreatment: "Forecast summary; no direct tax category.",
      reconciliationStatus: "Calculated Forecast",
      notes: "Projected net income plus financing cash movement.",
    });

    addRow(rows, {
      section: "Cash Flow Forecast",
      lineItem: "Projected Ending Cash",
      accountingAccount: "Cash and Cash Equivalents",
      quickBooksAccount: "Cash and Cash Equivalents",
      source: "calculated",
      sourceId: `ending_cash:month_${month.monthNumber}`,
      month: month.label,
      monthNumber: month.monthNumber,
      amount: month.endingCash,
      statementImpact: "Projected ending cash balance",
      taxTreatment: "Forecast balance; no direct tax category.",
      reconciliationStatus: "Calculated Forecast",
      notes:
        "Projected ending cash after operating and financing cash movement.",
    });
  }

  return rows;
}

async function getProFormaPackage(): Promise<ProFormaPackage> {
  const assumptionRows = await safeRows<AnyRow>(
    supabaseAdmin
      .from("proforma_assumptions")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1),
    "proforma_assumptions",
  );

  const assumptions = rowToAssumptions(assumptionRows[0]);
  const forecast = buildForecast(assumptions);
  const rows = buildRows(forecast, assumptions);

  const totalGrossBookingVolume = forecast.reduce(
    (sum, row) => sum + row.grossBookingVolume,
    0,
  );
  const totalPlatformRevenue = forecast.reduce(
    (sum, row) => sum + row.platformRevenue,
    0,
  );
  const totalGuruPayouts = forecast.reduce(
    (sum, row) => sum + row.guruPayouts,
    0,
  );
  const totalRefunds = forecast.reduce((sum, row) => sum + row.refunds, 0);
  const totalOperatingExpenses = forecast.reduce(
    (sum, row) => sum + row.operatingExpenses,
    0,
  );
  const totalNetIncome = forecast.reduce((sum, row) => sum + row.netIncome, 0);
  const endingCash =
    forecast[forecast.length - 1]?.endingCash || assumptions.beginningCash;
  const beginningCash =
    assumptions.beginningCash +
    assumptions.ownerContribution +
    assumptions.loanProceeds;
  const breakEvenMonth =
    forecast.find((row) => row.netIncome >= 0)?.monthNumber || null;

  return {
    assumptions,
    forecast,
    rows,
    totals: {
      totalGrossBookingVolume,
      totalPlatformRevenue,
      totalGuruPayouts,
      totalRefunds,
      totalOperatingExpenses,
      totalNetIncome,
      beginningCash,
      endingCash,
      breakEvenMonth,
      totalNetCashFlow: endingCash - beginningCash,
    },
    metadata: {
      reportName: "SitGuru Pro Forma Forecast",
      generatedAt: new Date().toISOString(),
      scenarioName: assumptions.scenarioName,
      forecastMonths: assumptions.forecastMonths,
      rowCount: rows.length,
    },
  };
}

function getExportHeaders() {
  return [
    "Section",
    "Line Item",
    "Accounting Account",
    "QuickBooks Account",
    "Source",
    "Source ID",
    "Month",
    "Month Number",
    "Amount",
    "Debit",
    "Credit",
    "Formatted Amount",
    "Statement Impact",
    "Tax Treatment",
    "Reconciliation Status",
    "Notes",
  ];
}

function rowToArray(row: ProFormaExportRow) {
  return [
    row.section,
    row.lineItem,
    row.accountingAccount,
    row.quickBooksAccount,
    row.source,
    row.sourceId,
    row.month,
    row.monthNumber,
    row.amount.toFixed(2),
    row.debit.toFixed(2),
    row.credit.toFixed(2),
    row.formattedAmount,
    row.statementImpact,
    row.taxTreatment,
    row.reconciliationStatus,
    row.notes,
  ];
}

function buildCsv(pkg: ProFormaPackage) {
  const rows = [
    ["Report", pkg.metadata.reportName],
    ["Scenario", pkg.metadata.scenarioName],
    ["Generated At", pkg.metadata.generatedAt],
    ["Forecast Months", String(pkg.metadata.forecastMonths)],
    [],
    ["Assumptions"],
    ["Monthly Bookings", pkg.assumptions.monthlyBookings],
    ["Average Booking Value", pkg.assumptions.averageBookingValue],
    ["Platform Fee Rate", `${pkg.assumptions.platformFeeRate}%`],
    ["Guru Payout Rate", `${pkg.assumptions.guruPayoutRate}%`],
    ["Refund Rate", `${pkg.assumptions.refundRate}%`],
    ["Monthly Growth Rate", `${pkg.assumptions.monthlyGrowthRate}%`],
    ["Beginning Cash", pkg.assumptions.beginningCash],
    ["Owner Contribution", pkg.assumptions.ownerContribution],
    ["Loan Proceeds", pkg.assumptions.loanProceeds],
    ["Loan Repayments", pkg.assumptions.loanRepayments],
    [],
    getExportHeaders(),
    ...pkg.rows.map(rowToArray),
    [],
    ["Summary"],
    ["Gross Booking Volume", pkg.totals.totalGrossBookingVolume.toFixed(2)],
    ["Platform Revenue", pkg.totals.totalPlatformRevenue.toFixed(2)],
    ["Guru Payouts", pkg.totals.totalGuruPayouts.toFixed(2)],
    ["Refunds", pkg.totals.totalRefunds.toFixed(2)],
    ["Operating Expenses", pkg.totals.totalOperatingExpenses.toFixed(2)],
    ["Net Income", pkg.totals.totalNetIncome.toFixed(2)],
    ["Beginning Cash", pkg.totals.beginningCash.toFixed(2)],
    ["Ending Cash", pkg.totals.endingCash.toFixed(2)],
    ["Net Cash Flow", pkg.totals.totalNetCashFlow.toFixed(2)],
    ["Break Even Month", pkg.totals.breakEvenMonth || "Not reached"],
  ];

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function buildHtml(
  pkg: ProFormaPackage,
  mode: "html" | "excel" | "word" = "html",
) {
  const tableRows = pkg.rows
    .map(
      (row) => `
        <tr>
          <td>${htmlEscape(row.section)}</td>
          <td><strong>${htmlEscape(row.lineItem)}</strong></td>
          <td>${htmlEscape(row.month)}</td>
          <td>${htmlEscape(row.accountingAccount)}</td>
          <td>${htmlEscape(row.quickBooksAccount)}</td>
          <td>${htmlEscape(row.source)}</td>
          <td class="amount">${htmlEscape(row.formattedAmount)}</td>
          <td>${htmlEscape(row.statementImpact)}</td>
          <td>${htmlEscape(row.notes)}</td>
        </tr>
      `,
    )
    .join("");

  const printScript = mode === "html" ? "<script>window.print?.();</script>" : "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${htmlEscape(pkg.metadata.reportName)}</title>
  <style>
    body {
      margin: 0;
      background: #f7fbf8;
      color: #0f172a;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .page {
      max-width: 1280px;
      margin: 0 auto;
      padding: 32px;
    }
    .hero {
      border: 1px solid #d1fae5;
      background: #ffffff;
      border-radius: 28px;
      padding: 28px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .eyebrow {
      color: #047857;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    h1 {
      margin: 10px 0 6px;
      font-size: 36px;
      line-height: 1;
    }
    .meta {
      color: #64748b;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.6;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-top: 18px;
    }
    .card {
      border: 1px solid #d1fae5;
      background: #ecfdf5;
      border-radius: 18px;
      padding: 16px;
    }
    .card p {
      margin: 0;
    }
    .card .label {
      color: #047857;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .card .value {
      margin-top: 8px;
      font-size: 22px;
      font-weight: 900;
    }
    .assumptions {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin-top: 18px;
    }
    .assumption {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 14px;
      padding: 12px;
      font-size: 12px;
      color: #475569;
    }
    .assumption strong {
      display: block;
      color: #0f172a;
      font-size: 14px;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
      overflow: hidden;
      border-radius: 18px;
      background: #ffffff;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      text-align: left;
      padding: 12px;
    }
    td {
      border-top: 1px solid #e2e8f0;
      color: #334155;
      font-size: 12px;
      line-height: 1.45;
      padding: 12px;
      vertical-align: top;
    }
    .amount {
      text-align: right;
      font-weight: 900;
      color: #0f172a;
      white-space: nowrap;
    }
    @media print {
      body { background: white; }
      .page { max-width: none; padding: 0; }
      .hero { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <p class="eyebrow">SitGuru Financial Forecast</p>
      <h1>${htmlEscape(pkg.metadata.reportName)}</h1>
      <p class="meta">
        Scenario: ${htmlEscape(pkg.metadata.scenarioName)}<br />
        Forecast Months: ${htmlEscape(pkg.metadata.forecastMonths)}<br />
        Generated: ${htmlEscape(pkg.metadata.generatedAt)}
      </p>

      <div class="summary">
        <div class="card">
          <p class="label">Platform Revenue</p>
          <p class="value">${htmlEscape(money(pkg.totals.totalPlatformRevenue))}</p>
        </div>
        <div class="card">
          <p class="label">Net Income</p>
          <p class="value">${htmlEscape(money(pkg.totals.totalNetIncome))}</p>
        </div>
        <div class="card">
          <p class="label">Ending Cash</p>
          <p class="value">${htmlEscape(money(pkg.totals.endingCash))}</p>
        </div>
        <div class="card">
          <p class="label">Break Even</p>
          <p class="value">${htmlEscape(
            pkg.totals.breakEvenMonth ? `Month ${pkg.totals.breakEvenMonth}` : "Not reached",
          )}</p>
        </div>
      </div>

      <div class="assumptions">
        <div class="assumption">Monthly Bookings<strong>${htmlEscape(
          pkg.assumptions.monthlyBookings.toLocaleString(),
        )}</strong></div>
        <div class="assumption">Average Booking Value<strong>${htmlEscape(
          money(pkg.assumptions.averageBookingValue),
        )}</strong></div>
        <div class="assumption">Platform Fee<strong>${htmlEscape(
          percent(pkg.assumptions.platformFeeRate),
        )}</strong></div>
        <div class="assumption">Monthly Growth<strong>${htmlEscape(
          percent(pkg.assumptions.monthlyGrowthRate),
        )}</strong></div>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Section</th>
          <th>Line Item</th>
          <th>Month</th>
          <th>Accounting Account</th>
          <th>QuickBooks Account</th>
          <th>Source</th>
          <th>Amount</th>
          <th>Impact</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>
  ${printScript}
</body>
</html>`;
}

function normalizeFormat(format: string | null) {
  const normalized = (format || "csv").trim().toLowerCase();

  if (["csv"].includes(normalized)) return "csv";
  if (["excel", "xls", "xlsx"].includes(normalized)) return "excel";
  if (["word", "doc", "docx"].includes(normalized)) return "word";
  if (["pdf", "print", "html"].includes(normalized)) return "html";

  return "csv";
}

function getContentType(format: string) {
  if (format === "csv") return "text/csv; charset=utf-8";
  if (format === "excel") return "application/vnd.ms-excel; charset=utf-8";
  if (format === "word") return "application/msword; charset=utf-8";
  return "text/html; charset=utf-8";
}

function getFileExtension(format: string) {
  if (format === "csv") return "csv";
  if (format === "excel") return "xls";
  if (format === "word") return "doc";
  return "html";
}

function getFilename(format: string, scenarioName: string) {
  const scenario = scenarioName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `sitguru-pro-forma-${scenario || "forecast"}.${getFileExtension(format)}`;
}

function buildExportBody(pkg: ProFormaPackage, format: string) {
  if (format === "csv") return buildCsv(pkg);
  if (format === "excel") return buildHtml(pkg, "excel");
  if (format === "word") return buildHtml(pkg, "word");
  return buildHtml(pkg, "html");
}

async function sendWithResend({
  to,
  subject,
  message,
  attachmentBody,
  filename,
  contentType,
}: {
  to: string;
  subject: string;
  message: string;
  attachmentBody: string;
  filename: string;
  contentType: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.FINANCIAL_EXPORT_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "SitGuru Finance <finance@sitguru.com>";

  if (!apiKey) {
    return {
      ok: false,
      configured: false,
      message:
        "RESEND_API_KEY is not configured. Download URL is available instead.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html: `<p>${htmlEscape(message).replace(/\n/g, "<br />")}</p>`,
      attachments: [
        {
          filename,
          content: Buffer.from(attachmentBody).toString("base64"),
          content_type: contentType.split(";")[0],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();

    return {
      ok: false,
      configured: true,
      message: text || "Unable to send email.",
    };
  }

  return {
    ok: true,
    configured: true,
    message: "Pro Forma forecast email sent.",
  };
}

export async function GET(request: Request) {
  const actor = await requireFinancialAdmin();

  if (!actor) {
    return NextResponse.json(
      { ok: false, message: "Not authorized to export pro forma forecasts." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const format = normalizeFormat(url.searchParams.get("format"));

  const pkg = await getProFormaPackage();
  const body = buildExportBody(pkg, format);
  const filename = getFilename(format, pkg.metadata.scenarioName);
  const contentType = getContentType(format);

  await writeFinancialAuditLog({
    actor,
    action: "export_pro_forma_forecast",
    metadata: {
      format,
      filename,
      scenarioName: pkg.metadata.scenarioName,
      forecastMonths: pkg.metadata.forecastMonths,
      rowCount: pkg.rows.length,
      delivery: "download",
    },
  });

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const actor = await requireFinancialAdmin();

  if (!actor) {
    return NextResponse.json(
      { ok: false, message: "Not authorized to email pro forma forecasts." },
      { status: 403 },
    );
  }

  let body: AnyRow = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const to = asTrimmedString(body.to);
  const format = normalizeFormat(asTrimmedString(body.format) || "excel");
  const subject =
    asTrimmedString(body.subject) || "SitGuru Pro Forma Forecast";
  const message =
    asTrimmedString(body.message) ||
    "Attached is the SitGuru Pro Forma forecast for review.";

  if (!to || !to.includes("@")) {
    return NextResponse.json(
      { ok: false, message: "A valid recipient email is required." },
      { status: 400 },
    );
  }

  const pkg = await getProFormaPackage();
  const attachmentBody = buildExportBody(pkg, format);
  const filename = getFilename(format, pkg.metadata.scenarioName);
  const contentType = getContentType(format);

  const emailResult = await sendWithResend({
    to,
    subject,
    message,
    attachmentBody,
    filename,
    contentType,
  });

  await writeFinancialAuditLog({
    actor,
    action: "email_pro_forma_forecast",
    metadata: {
      format,
      filename,
      scenarioName: pkg.metadata.scenarioName,
      forecastMonths: pkg.metadata.forecastMonths,
      rowCount: pkg.rows.length,
      delivery: "email",
      recipient: to,
      emailConfigured: emailResult.configured,
      emailOk: emailResult.ok,
    },
  });

  if (!emailResult.ok) {
    const searchParams = new URLSearchParams({ format });

    return NextResponse.json(
      {
        ok: false,
        message: emailResult.message,
        downloadUrl: `/api/admin/financials/pro-forma/export?${searchParams.toString()}`,
      },
      { status: emailResult.configured ? 502 : 200 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: emailResult.message,
    filename,
    rowCount: pkg.rows.length,
  });
}
