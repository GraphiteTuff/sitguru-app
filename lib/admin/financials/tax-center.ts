import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPlaidEnvironment } from "@/lib/plaid";
import { loadMarketplaceTaxReport } from "@/lib/admin/financials/marketplace-tax";

type AnyRow = Record<string, unknown>;

export type TaxLine = {
  section: string;
  category: string;
  source: string;
  count: number;
  amount: number;
  treatment: string;
  notes: string;
};

export type TaxExpenseItem = {
  id: string;
  date: string;
  name: string;
  category: string;
  source: string;
  amount: number;
};

export type TaxContractor = {
  key: string;
  name: string;
  email: string;
  kind: string;
  paymentCount: number;
  amount: number;
  missingEmail: boolean;
  reviewFor1099: boolean;
};

export type TaxReconItem = {
  id: string;
  source: string;
  label: string;
  amount: number;
  date: string;
  status: string;
};

export type TaxAuditItem = {
  id: string;
  title: string;
  source: string;
  count: number;
  amount: number;
  href: string;
  exportHref: string;
  ready: boolean;
};

const NEC_REVIEW_THRESHOLD = 600;

function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function taxMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(value) ? value : 0);
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,%\s,()]/g, ""));
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

function rowAmount(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const centsKey = `${key}_cents`;
    if (row[centsKey] != null && toNumber(row[centsKey]) !== 0) {
      return Math.abs(centsToDollars(row[centsKey]));
    }
    const value = toNumber(row[key]);
    if (value) return Math.abs(value);
  }
  return 0;
}

function isPaid(row: AnyRow) {
  const status = `${asTrimmed(row.status)} ${asTrimmed(row.payment_status)}`.toLowerCase();
  return (
    status.includes("paid") ||
    status.includes("succeeded") ||
    status.includes("complete") ||
    status.includes("confirmed")
  );
}

function firstText(row: AnyRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asTrimmed(row[key]);
    if (value) return value;
  }
  return fallback;
}

function rowDate(row: AnyRow) {
  return firstText(row, ["created_at", "date", "expense_date", "cost_date", "paid_at", "arrival_date"]);
}

async function safeRows(query: PromiseLike<{ data: unknown; error: unknown }>, label: string) {
  try {
    const result = await query;
    if (result.error) {
      console.warn(`Tax Center query skipped for ${label}:`, result.error);
      return [] as AnyRow[];
    }
    return Array.isArray(result.data) ? (result.data as AnyRow[]) : [];
  } catch (error) {
    console.warn(`Tax Center query skipped for ${label}:`, error);
    return [] as AnyRow[];
  }
}

function addContractor(
  map: Map<string, TaxContractor>,
  kind: string,
  row: AnyRow,
  amount: number,
) {
  if (amount <= 0) return;
  const name = firstText(
    row,
    ["recipient_name", "guru_name", "ambassador_name", "partner_name", "display_name", "full_name", "name"],
    kind,
  );
  const email = firstText(row, [
    "recipient_email",
    "guru_email",
    "ambassador_email",
    "partner_email",
    "email",
  ]).toLowerCase();
  const key = email || name.toLowerCase();
  const current = map.get(key) || {
    key,
    name,
    email,
    kind,
    paymentCount: 0,
    amount: 0,
    missingEmail: !email,
    reviewFor1099: false,
  };
  current.paymentCount += 1;
  current.amount += amount;
  current.reviewFor1099 = current.amount >= NEC_REVIEW_THRESHOLD;
  if (!current.email && email) current.email = email;
  current.missingEmail = !current.email;
  map.set(key, current);
}

export async function loadTaxCenterBundle() {
  const plaidEnvironment = getPlaidEnvironment();
  const [
    bookingPayments,
    expenses,
    growthExpenses,
    growthSummary,
    rewards,
    payouts,
    commissions,
    stripePayouts,
    plaidAccounts,
    marketplace,
  ] = await Promise.all([
    safeRows(
      supabaseAdmin.from("booking_payments").select("*").order("created_at", { ascending: false }).limit(5000),
      "booking_payments",
    ),
    safeRows(
      supabaseAdmin.from("expense_ledger").select("*").order("created_at", { ascending: false }).limit(2500),
      "expense_ledger",
    ),
    safeRows(
      supabaseAdmin
        .from("admin_growth_marketing_expenses")
        .select("*")
        .order("cost_date", { ascending: false })
        .limit(1000),
      "admin_growth_marketing_expenses",
    ),
    safeRows(
      supabaseAdmin.from("admin_growth_financial_summary").select("*").limit(250),
      "admin_growth_financial_summary",
    ),
    safeRows(
      supabaseAdmin.from("admin_referral_reward_liability").select("*").limit(2500),
      "admin_referral_reward_liability",
    ),
    safeRows(supabaseAdmin.from("payouts").select("*").limit(2500), "payouts"),
    safeRows(supabaseAdmin.from("commissions").select("*").limit(2500), "commissions"),
    safeRows(
      supabaseAdmin.from("stripe_payouts").select("*").order("created_at", { ascending: false }).limit(1000),
      "stripe_payouts",
    ),
    safeRows(
      supabaseAdmin
        .from("admin_plaid_accounts")
        .select("account_id, name, official_name, subtype, current_balance, plaid_environment")
        .eq("plaid_environment", plaidEnvironment)
        .limit(500),
      "admin_plaid_accounts",
    ),
    loadMarketplaceTaxReport(),
  ]);

  const paid = bookingPayments.filter((row) => {
    const provider = firstText(row, ["provider", "payment_provider"]).toLowerCase();
    return (!provider || provider === "stripe") && isPaid(row);
  });

  let gross = 0;
  let fees = 0;
  let tax = 0;
  let refunds = 0;
  for (const row of paid) {
    gross += rowAmount(row, ["amount", "gross_amount", "total"]);
    if (!rowAmount(row, ["amount", "gross_amount", "total"])) {
      gross += centsToDollars(row.amount_cents || row.gross_amount_cents || row.total_cents);
    }
    fees +=
      centsToDollars(row.marketplace_support_cents) ||
      centsToDollars(row.platform_fee_cents) ||
      rowAmount(row, ["platform_fee"]);
    tax +=
      centsToDollars(row.tax_cents) ||
      centsToDollars(row.sales_tax_cents) ||
      rowAmount(row, ["tax_amount"]);
    refunds +=
      centsToDollars(row.refund_amount_cents) ||
      centsToDollars(row.dispute_amount_cents) ||
      rowAmount(row, ["refund_amount"]);
  }

  const expenseItems: TaxExpenseItem[] = expenses.map((row, index) => ({
    id: firstText(row, ["id"], `expense-${index}`),
    date: rowDate(row),
    name: firstText(row, ["name", "description"], "Expense"),
    category: firstText(row, ["category", "sitguru_category"], "Other Expense"),
    source: "expense_ledger",
    amount: rowAmount(row, ["amount", "total_amount", "expense_amount", "cost"]),
  }));

  for (const [index, row] of growthExpenses.entries()) {
    expenseItems.push({
      id: firstText(row, ["id", "campaign_id"], `growth-${index}`),
      date: rowDate(row),
      name: firstText(row, ["campaign_name", "financial_category"], "Growth campaign"),
      category: "Marketing / Advertising",
      source: "admin_growth_marketing_expenses",
      amount: rowAmount(row, ["amount", "total_cost", "cost"]),
    });
  }

  const deductionCategories = new Map<string, { category: string; count: number; amount: number }>();
  for (const item of expenseItems) {
    const current = deductionCategories.get(item.category) || {
      category: item.category,
      count: 0,
      amount: 0,
    };
    current.count += 1;
    current.amount += item.amount;
    deductionCategories.set(item.category, current);
  }

  const expenseTotal = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  const marketingSummary = growthSummary
    .filter((row) =>
      `${firstText(row, ["financial_category"])} ${firstText(row, ["financial_statement_section"])}`
        .toLowerCase()
        .includes("marketing"),
    )
    .reduce((sum, row) => sum + Math.abs(toNumber(row.total_amount)), 0);

  const issuedRewards = rewards
    .filter((row) =>
      `${firstText(row, ["reward_status"])} ${firstText(row, ["financial_statement_section"])}`
        .toLowerCase()
        .match(/issued|paid|credited|expense/),
    )
    .reduce((sum, row) => sum + rowAmount(row, ["amount", "reward_amount", "total_amount"]), 0);

  const pendingRewards = rewards
    .filter((row) =>
      `${firstText(row, ["reward_status"])} ${firstText(row, ["financial_statement_section"])}`
        .toLowerCase()
        .match(/pending|liability|payable/),
    )
    .reduce((sum, row) => sum + rowAmount(row, ["amount", "reward_amount", "total_amount"]), 0);

  const contractors = new Map<string, TaxContractor>();
  for (const row of payouts) {
    addContractor(
      contractors,
      "Guru / contractor",
      row,
      rowAmount(row, ["amount", "payout_amount"]),
    );
  }
  for (const row of commissions) {
    addContractor(
      contractors,
      "Partner commission",
      row,
      rowAmount(row, ["amount", "commission_amount"]),
    );
  }
  const contractorRows = [...contractors.values()].sort((a, b) => b.amount - a.amount);
  const payoutTotal = contractorRows
    .filter((row) => row.kind.startsWith("Guru"))
    .reduce((sum, row) => sum + row.amount, 0);
  const commissionTotal = contractorRows
    .filter((row) => row.kind.startsWith("Partner"))
    .reduce((sum, row) => sum + row.amount, 0);

  const stripePayoutTotal = stripePayouts.reduce(
    (sum, row) =>
      sum +
      Math.abs(
        centsToDollars(row.amount_cents) ||
          (toNumber(row.amount) > 1000 ? centsToDollars(row.amount) : toNumber(row.amount)),
      ),
    0,
  );

  const businessAccounts = plaidAccounts.filter((row) => {
    const name = `${firstText(row, ["name"])} ${firstText(row, ["official_name"])}`.toLowerCase();
    const subtype = firstText(row, ["subtype"]).toLowerCase();
    return (subtype === "checking" || subtype === "savings") && name.includes("business");
  });
  const liveCash = businessAccounts.reduce((sum, row) => sum + toNumber(row.current_balance), 0);

  const annualLines: TaxLine[] = [
    {
      section: "Income",
      category: "Gross booking volume",
      source: "booking_payments",
      count: paid.length,
      amount: gross,
      treatment: "Marketplace volume. Not SitGuru net income.",
      notes: "Paid Stripe booking payments.",
    },
    {
      section: "Income",
      category: "Platform / marketplace fees",
      source: "booking_payments",
      count: paid.length,
      amount: fees,
      treatment: "Operating revenue candidate.",
      notes: "SitGuru fee kept from paid bookings.",
    },
    {
      section: "Liability",
      category: "Sales tax collected",
      source: "booking_payments + bookings",
      count: marketplace.taxedBookingCount,
      amount: marketplace.taxCollected || tax,
      treatment: "SitGuru remits. Not Guru income. Tips excluded.",
      notes: `${taxMoney(marketplace.tipsExcluded)} tips left out of the taxable base.`,
    },
    {
      section: "Contra",
      category: "Refunds / disputes",
      source: "booking_payments",
      count: paid.filter((row) => rowAmount(row, ["refund_amount"]) > 0).length,
      amount: refunds,
      treatment: "Offset revenue or expense. CPA review.",
      notes: "Refund and dispute support.",
    },
    {
      section: "Deductions",
      category: "Operating + growth expenses",
      source: "expense_ledger + growth",
      count: expenseItems.length,
      amount: expenseTotal + marketingSummary,
      treatment: "Deductibility depends on category and receipts.",
      notes: "Includes campaign spend.",
    },
    {
      section: "1099",
      category: "Guru, contractor, and partner payments",
      source: "payouts + commissions",
      count: contractorRows.length,
      amount: payoutTotal + commissionTotal,
      treatment: "Review $600+ for 1099-NEC. Sales tax is not included.",
      notes: `${contractorRows.filter((row) => row.reviewFor1099).length} recipients at or over $600.`,
    },
    {
      section: "Liability",
      category: "Pending referral rewards",
      source: "admin_referral_reward_liability",
      count: rewards.length,
      amount: pendingRewards,
      treatment: "Liability until paid.",
      notes: `Issued/paid rewards ${taxMoney(issuedRewards)}.`,
    },
    {
      section: "Cash",
      category: "NFCU business cash",
      source: "admin_plaid_accounts",
      count: businessAccounts.length,
      amount: liveCash,
      treatment: "Balance-sheet cash. Not income.",
      notes: `Plaid ${plaidEnvironment}.`,
    },
  ];

  const reconItems: TaxReconItem[] = stripePayouts.slice(0, 25).map((row, index) => ({
    id: firstText(row, ["id", "stripe_payout_id"], `payout-${index}`),
    source: "stripe_payouts",
    label: firstText(row, ["description", "stripe_payout_id"], "Stripe payout"),
    amount:
      centsToDollars(row.amount_cents) ||
      (toNumber(row.amount) > 1000 ? centsToDollars(row.amount) : toNumber(row.amount)),
    date: rowDate(row),
    status: firstText(row, ["status", "payout_status"], "recorded"),
  }));

  const auditIndex: TaxAuditItem[] = [
    {
      id: "annual",
      title: "Annual tax summary",
      source: "booking_payments + expenses + payouts",
      count: annualLines.length,
      amount: fees,
      href: "/admin/financials/tax-reports/annual-summary",
      exportHref: "/api/admin/financials/tax-reports/export?format=csv&section=annual",
      ready: paid.length > 0 || expenseItems.length > 0,
    },
    {
      id: "deductions",
      title: "Deductible expense detail",
      source: "expense_ledger + growth marketing",
      count: expenseItems.length,
      amount: expenseTotal,
      href: "/admin/financials/tax-reports/deductions",
      exportHref: "/api/admin/financials/tax-reports/export?format=csv&section=deductions",
      ready: expenseItems.length > 0,
    },
    {
      id: "1099",
      title: "1099 contractor support",
      source: "payouts + commissions",
      count: contractorRows.length,
      amount: payoutTotal + commissionTotal,
      href: "/admin/financials/tax-reports/1099",
      exportHref: "/api/admin/financials/tax-reports/export?format=csv&section=1099",
      ready: contractorRows.length > 0,
    },
    {
      id: "marketplace",
      title: "Marketplace sales tax",
      source: "bookings + booking_payments",
      count: marketplace.paidBookingCount,
      amount: marketplace.taxCollected || tax,
      href: "/admin/financials/tax-reports/marketplace-tax",
      exportHref: "/api/admin/financials/tax-reports/export?format=csv&section=marketplace",
      ready: marketplace.paidBookingCount > 0,
    },
    {
      id: "reconciliation",
      title: "Bank / Stripe tax backup",
      source: "stripe_payouts + NFCU",
      count: stripePayouts.length,
      amount: stripePayoutTotal,
      href: "/admin/financials/tax-reports/reconciliation",
      exportHref: "/api/admin/financials/tax-reports/export?format=csv&section=reconciliation",
      ready: stripePayouts.length > 0 || businessAccounts.length > 0,
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    plaidEnvironment,
    totals: {
      paidBookingCount: paid.length,
      gross,
      fees,
      tax: marketplace.taxCollected || tax,
      tipsExcluded: marketplace.tipsExcluded,
      refunds,
      expenseTotal: expenseTotal + marketingSummary,
      expenseCount: expenseItems.length,
      payoutTotal,
      commissionTotal,
      contractorCount: contractorRows.length,
      review1099Count: contractorRows.filter((row) => row.reviewFor1099).length,
      pendingRewards,
      issuedRewards,
      stripePayoutTotal,
      stripePayoutCount: stripePayouts.length,
      liveCash,
      connectedBusinessAccounts: businessAccounts.length,
    },
    annualLines,
    deductionCategories: [...deductionCategories.values()].sort((a, b) => b.amount - a.amount),
    expenseItems: expenseItems.slice(0, 80),
    contractors: contractorRows,
    reconItems,
    auditIndex,
    marketplace,
    sourceHealth: [
      { id: "booking_payments", label: "Paid booking payments", ok: paid.length > 0, rowCount: paid.length },
      { id: "expenses", label: "Expense + growth rows", ok: expenseItems.length > 0, rowCount: expenseItems.length },
      { id: "payouts", label: "1099 payees", ok: contractorRows.length > 0, rowCount: contractorRows.length },
      {
        id: "tax",
        label: "Sales tax collected",
        ok: (marketplace.taxCollected || tax) > 0,
        rowCount: marketplace.taxedBookingCount,
      },
      {
        id: "cash",
        label: "NFCU business cash",
        ok: businessAccounts.length > 0,
        rowCount: businessAccounts.length,
      },
    ],
  };
}

export type TaxCenterBundle = Awaited<ReturnType<typeof loadTaxCenterBundle>>;
