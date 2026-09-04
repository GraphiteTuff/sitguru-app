import Link from "next/link";
import {
  BadgeDollarSign,
  BookOpen,
  CalendarClock,
  Landmark,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import { MarketplaceSalesTaxStates } from "@/components/admin/financials/MarketplaceSalesTaxStates";
import { TaxFilingCalendar } from "@/components/admin/financials/TaxFilingCalendar";
import { marketplaceSalesTaxStateLabel } from "@/lib/admin/financials/marketplace-sales-tax-states";
import {
  AdminWorkplaceActions,
  AdminWorkplaceDenied,
  AdminWorkplaceHealth,
  GrowthCard,
  GrowthPageFrame,
} from "@/components/admin/growth/GrowthPageFrame";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getFinanceAdminIdentity } from "@/lib/admin/financials/access";
import { getPlaidEnvironment } from "@/lib/plaid";

export const dynamic = "force-dynamic";

type TaxSummaryCard = {
  label: string;
  value: string;
  helper: string;
  tone: "green" | "blue" | "amber" | "rose" | "slate" | "purple";
};

type TaxReportCard = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  tone: "green" | "blue" | "amber" | "purple" | "rose" | "slate";
  included: string[];
  liveHint: string;
};

type TaxChecklistItem = {
  step: string;
  title: string;
  description: string;
  status: "Ready" | "Review" | "Pending";
};

type TaxAuthorityCard = {
  title: string;
  level: "Federal" | "State" | "County" | "City / Local" | "Marketplace";
  description: string;
  cadence: string;
  action: string;
  href: string;
};

type AnyRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type ReadinessStatus = "ready" | "needs_review" | "missing";

type ReadinessItem = {
  label: string;
  status: ReadinessStatus;
  detail: string;
};

type GrowthFinancialSummaryRow = {
  financial_category?: string | null;
  financial_statement_section?: string | null;
  row_count?: number | null;
  total_amount?: number | null;
  first_activity_date?: string | null;
  last_activity_date?: string | null;
  source?: string | null;
};

type GrowthCampaignRoiRow = {
  campaign_name?: string | null;
  channel?: string | null;
  campaign_type?: string | null;
  clicks?: number | null;
  leads?: number | null;
  signups?: number | null;
  bookings?: number | null;
  attributed_revenue?: number | null;
  total_cost?: number | null;
  net_growth_return?: number | null;
  roi_percent?: number | null;
  cost_per_signup?: number | null;
  cost_per_booking?: number | null;
  growth_signal?: string | null;
  admin_recommendation?: string | null;
};

type ReferralRewardLiabilityRow = {
  reward_category?: string | null;
  reward_status?: string | null;
  financial_statement_section?: string | null;
  amount?: number | null;
  reward_amount?: number | null;
  total_amount?: number | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  source?: string | null;
  created_at?: string | null;
  issued_at?: string | null;
  paid_at?: string | null;
};

type TaxSourceHealth = {
  id: string;
  label: string;
  ok: boolean;
  rowCount: number;
};

type TaxLiveTotals = {
  paidBookingCount: number;
  bookingCount: number;
  bookingPaymentCount: number;
  referralEventCount: number;
  sourceHealth: TaxSourceHealth[];
  grossBookingVolume: number;
  platformRevenue: number;
  taxCollectedSupport: number;
  refundSupport: number;
  expenseLedgerTotal: number;
  expenseCount: number;
  growthMarketingTotal: number;
  marketingSummaryTotal: number;
  payoutTotal: number;
  payoutCount: number;
  commissionTotal: number;
  commissionCount: number;
  stripePayoutCount: number;
  stripePayoutTotal: number;
  liveCashBalance: number;
  connectedBusinessAccounts: number;
  pendingRewardLiability: number;
  issuedReferralRewards: number;
  campaignCount: number;
  totalCampaignCost: number;
  totalAttributedRevenue: number;
  totalBookings: number;
  overallRoi: number | null;
};

const taxReports: TaxReportCard[] = [
  {
    eyebrow: "Income Tax",
    title: "Annual Tax Summary",
    description:
      "Year-end summary of SitGuru revenue, expenses, net income, deductions, credits, payments, and CPA review notes.",
    href: "/admin/financials/tax-reports/annual-summary",
    tone: "green",
    included: [
      "Gross bookings",
      "Platform revenue",
      "Refunds and chargebacks",
      "Stripe fees",
      "Net income",
      "Owner contributions",
      "Owner distributions",
    ],
    liveHint: "Live desk: annual tax summary + CSV/PDF",
  },
  {
    eyebrow: "Deductions",
    title: "Deductible Expense Detail",
    description:
      "Categorized expense support for software, insurance, marketing, professional fees, background checks, banking fees, Growth campaigns, and operations.",
    href: "/admin/financials/tax-reports/deductions",
    tone: "blue",
    included: [
      "Software subscriptions",
      "Insurance",
      "Marketing and advertising",
      "Growth campaign costs",
      "Background checks",
      "Banking and card fees",
      "Office and admin expenses",
    ],
    liveHint: "Live desk: expense_ledger + growth costs",
  },
  {
    eyebrow: "1099 Support",
    title: "Contractor, Guru & Partner Payments",
    description:
      "Payment review package for Guru payouts, contractor payments, vendor payments, referral rewards, Ambassador rewards, and partner commission review.",
    href: "/admin/financials/tax-reports/1099",
    tone: "amber",
    included: [
      "Guru payout totals",
      "Partner commissions",
      "Ambassador rewards",
      "Contractor payments",
      "Vendor payment totals",
      "1099 threshold review",
      "Exception list",
    ],
    liveHint: "Live desk: payouts + commissions · 1099-NEC Feb 1, 2027",
  },
  {
    eyebrow: "Sales / Local Tax",
    title: "Marketplace Tax Review",
    description:
      "SitGuru collects sales tax on the booking and remits it. Tips stay nontaxable optional gratuity and go 100% to the Guru.",
    href: "/admin/financials/tax-reports/marketplace-tax",
    tone: "purple",
    included: [
      "Sales tax collected",
      "Tips excluded from tax",
      "Service-location activity",
      "Stripe Tax address collection",
      "Marketplace fee review",
      "PayPal tax gap",
      "CPA remittance notes",
    ],
    liveHint: "Live desk: bookings + booking_payments tax",
  },
  {
    eyebrow: "Reconciliation",
    title: "Bank, Stripe & Card Tax Backup",
    description:
      "Backup package for bank statements, Stripe payouts, processing fees, refunds, disputes, chargebacks, and card transactions.",
    href: "/admin/financials/tax-reports/reconciliation",
    tone: "slate",
    included: [
      "Stripe payout summary",
      "Stripe fee detail",
      "Refunds and disputes",
      "Bank reconciliation",
      "Credit card reconciliation",
      "Deposit matching",
      "Unmatched transactions",
    ],
    liveHint: "Live desk: stripe_payouts + NFCU",
  },
  {
    eyebrow: "Audit Support",
    title: "Tax Audit Backup Index",
    description:
      "Organized index of tax support files, transaction exports, reconciliation schedules, vendor details, receipts, campaign backup, and CPA notes.",
    href: "/admin/financials/tax-reports/audit-backup",
    tone: "rose",
    included: [
      "General ledger export",
      "Transaction backup",
      "Receipt index",
      "Vendor files",
      "Payout support",
      "Campaign and referral support",
      "CPA questions log",
    ],
    liveHint: "Live desk: download each tax schedule",
  },
  {
    eyebrow: "QuickBooks",
    title: "QuickBooks Tax Season Feed",
    description:
      "Push Graff Enterprises LLC books into QuickBooks Online or Desktop, then hand the same package to your CPA. Sales tax stays a payable. Tips stay out of income.",
    href: "/admin/financials/tax-reports/quickbooks",
    tone: "blue",
    included: [
      "QBO journal CSV",
      "Desktop IIF import",
      "Account mapping",
      "Sales tax payable",
      "Guru 1099 payouts",
      "Expense and reward lines",
      "CPA handoff",
    ],
    liveHint: "Live desk: /admin/financials/tax-reports/quickbooks",
  },
];

const taxAuthorityCards: TaxAuthorityCard[] = [
  {
    title: "Federal Estimated Tax",
    level: "Federal",
    description:
      "Track federal estimated tax planning, income tax reserve support, quarterly payment reminders, and annual CPA handoff readiness.",
    cadence: "Quarterly and annual",
    action: "Review IRS payment options",
    href: "https://www.irs.gov/payments",
  },
  {
    title: "Federal Business Tax Center",
    level: "Federal",
    description:
      "Use this for federal business tax categories, filing considerations, employment tax, estimated taxes, and entity-specific CPA review.",
    cadence: "Quarterly and annual",
    action: "Open IRS business tax center",
    href: "https://www.irs.gov/businesses",
  },
  {
    title: "Pennsylvania Business Tax",
    level: "State",
    description:
      "Track Pennsylvania business tax payment support, state tax registration, state-level income or business obligations, and CPA review notes.",
    cadence: "Quarterly, annual, and as required",
    action: "Open PA business tax payments",
    href: "https://www.pa.gov/services/revenue/make-a-business-tax-payment",
  },
  {
    title: "Pet-care sales tax states",
    level: "Marketplace",
    description:
      "Collect and remit in AR, CT, DC, HI, KY, MN, NE, NJ, NM, RI, SD, and WV. Scope differs by state (all services, boarding/daycare only, or fees only). Tips are never taxed.",
    cadence: "As collected, then each state's remittance calendar",
    action: "Open all required states",
    href: "/admin/financials/tax-reports/marketplace-tax#sales-tax-states",
  },
  {
    title: "New Jersey Tax Payments",
    level: "State",
    description:
      "Track New Jersey tax payment support for cross-market activity, state obligations, payment confirmations, and CPA review.",
    cadence: "Quarterly, annual, and as required",
    action: "Open NJ tax payment portal",
    href: "https://www.nj.gov/treasury/taxation/payments-notices.shtml",
  },
  {
    title: "County Review",
    level: "County",
    description:
      "Capture county-specific business, payroll, licensing, or local operating tax questions for CPA confirmation by service market.",
    cadence: "As required by location",
    action: "Add county review to CPA package",
    href: "/admin/financials/cpa-handoff?section=local-tax",
  },
  {
    title: "City / Local Review",
    level: "City / Local",
    description:
      "Track city, township, borough, local services, payroll locality, and operating license questions that may apply by location.",
    cadence: "As required by local rule",
    action: "Open local review checklist",
    href: "/admin/financials/tax-reports?section=local",
  },
  {
    title: "Marketplace Tax Exposure",
    level: "Marketplace",
    description:
      "SitGuru is the collector: tax on service + fee, remitted by HQ. Gurus do not calculate or file sales tax. Tips are excluded.",
    cadence: "Review after each taxed market and annually",
    action: "Open marketplace tax review",
    href: "/admin/financials/tax-reports/marketplace-tax",
  },
];

const exportCards = [
  {
    title: "Tax Center CSV",
    description:
      "Live tax support rollup from booking_payments, expenses, payouts, commissions, rewards, Stripe payouts, and NFCU cash.",
    href: "/api/admin/financials/tax-reports/export?format=csv",
  },
  {
    title: "Tax Center Excel",
    description:
      "Spreadsheet-ready tax support schedule for CPA analysis and QuickBooks-style review.",
    href: "/api/admin/financials/tax-reports/export?format=excel",
  },
  {
    title: "Tax Center Word / PDF",
    description:
      "Printable HTML package for owner records, CPA review packets, and audit backup notes.",
    href: "/api/admin/financials/tax-reports/export?format=pdf",
  },
  {
    title: "Export Center Packages",
    description:
      "Prepare broader annual tax PDF, Excel, CSV, and ZIP packages from the Export Center workflow.",
    href: "/admin/financials/exports?type=tax&period=annual",
  },
  {
    title: "QuickBooks Online journal",
    description:
      "Import SitGuru tax-year journal entries into QuickBooks Online. Balanced debits and credits with Sales Tax Payable.",
    href: "/api/admin/financials/tax-reports/quickbooks?format=qbo",
  },
  {
    title: "QuickBooks Desktop IIF",
    description:
      "Classic IIF for QuickBooks Desktop. File → Utilities → Import → IIF Files.",
    href: "/api/admin/financials/tax-reports/quickbooks?format=iif",
  },
];

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,%\s,()]/g, "");
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

function moneyExact(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value || 0));

  return value < 0 ? `(${formatted})` : formatted;
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "Needs cost data";
  }

  return `${Number(value).toFixed(1)}%`;
}

function toneClasses(tone: TaxSummaryCard["tone"] | TaxReportCard["tone"]) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    purple: "border-purple-200 bg-purple-50 text-purple-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return tones[tone];
}

function statusClasses(status: TaxChecklistItem["status"]) {
  const statuses = {
    Ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Review: "border-blue-200 bg-blue-50 text-blue-800",
    Pending: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return statuses[status];
}

function authorityClasses(level: TaxAuthorityCard["level"]) {
  const levels = {
    Federal: "border-blue-200 bg-blue-50 text-blue-800",
    State: "border-emerald-200 bg-emerald-50 text-emerald-800",
    County: "border-amber-200 bg-amber-50 text-amber-800",
    "City / Local": "border-purple-200 bg-purple-50 text-purple-800",
    Marketplace: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return levels[level];
}

function readinessClasses(status: ReadinessStatus) {
  if (status === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "needs_review") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-rose-200 bg-rose-50 text-rose-800";
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Tax Center query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Tax Center query skipped for ${label}:`, error);
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

async function getTaxCenterData() {
  const plaidEnvironment = getPlaidEnvironment();

  const [
    summaryRows,
    roiRows,
    rewardRows,
    bookingPayments,
    expenseRows,
    growthMarketingRows,
    payoutRows,
    commissionRows,
    guruPayoutRows,
    bookingRows,
    referralEventRows,
    stripePayouts,
    plaidAccounts,
  ] = await Promise.all([
    safeRows<GrowthFinancialSummaryRow>(
      supabaseAdmin
        .from("admin_growth_financial_summary")
        .select(
          "financial_category,financial_statement_section,row_count,total_amount,first_activity_date,last_activity_date,source",
        )
        .limit(100),
      "admin_growth_financial_summary",
    ),
    safeRows<GrowthCampaignRoiRow>(
      supabaseAdmin
        .from("admin_growth_campaign_roi")
        .select(
          "campaign_name,channel,campaign_type,clicks,leads,signups,bookings,attributed_revenue,total_cost,net_growth_return,roi_percent,cost_per_signup,cost_per_booking,growth_signal,admin_recommendation",
        )
        .limit(100),
      "admin_growth_campaign_roi",
    ),
    safeRows<ReferralRewardLiabilityRow>(
      supabaseAdmin.from("admin_referral_reward_liability").select("*").limit(2500),
      "admin_referral_reward_liability",
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
        .from("admin_growth_marketing_expenses")
        .select("*")
        .order("cost_date", { ascending: false })
        .limit(1000),
      "admin_growth_marketing_expenses",
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
      supabaseAdmin.from("guru_payouts").select("*").limit(2500),
      "guru_payouts",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("bookings")
        .select(
          "id,status,payment_status,total_amount,sales_tax_amount,tip_amount,marketplace_fee_amount",
        )
        .limit(2500),
      "bookings",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("pawperks_referral_events").select("id").limit(5000),
      "pawperks_referral_events",
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

  let grossBookingVolume = 0;
  let platformRevenue = 0;
  let taxCollectedSupport = 0;
  let refundSupport = 0;

  for (const row of paid) {
    grossBookingVolume += Math.abs(paymentGross(row));
    platformRevenue += Math.abs(paymentFee(row));
    taxCollectedSupport += Math.abs(paymentTax(row));
    refundSupport += Math.abs(paymentRefund(row));
  }

  const expenseLedgerTotal = expenseRows.reduce(
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
        toNumber(row.amount) || toNumber(row.total_cost) || toNumber(row.cost),
      ),
    0,
  );

  const marketingSummaryTotal = summaryRows
    .filter((row) =>
      `${row.financial_category || ""} ${row.financial_statement_section || ""}`
        .toLowerCase()
        .includes("marketing"),
    )
    .reduce((sum, row) => sum + Math.abs(toNumber(row.total_amount)), 0);

  const pendingRewardLiability = rewardRows.reduce((sum, row) => {
    const status = `${row.reward_status || ""} ${row.financial_statement_section || ""}`.toLowerCase();
    const isPending =
      status.includes("pending") ||
      status.includes("liability") ||
      status.includes("payable");
    if (!isPending) return sum;
    return sum + Math.abs(toNumber(row.amount || row.reward_amount || row.total_amount));
  }, 0);

  const issuedReferralRewards = rewardRows.reduce((sum, row) => {
    const status = `${row.reward_status || ""} ${row.financial_statement_section || ""}`.toLowerCase();
    const isIssued =
      status.includes("issued") ||
      status.includes("paid") ||
      status.includes("credited") ||
      status.includes("expense");
    if (!isIssued) return sum;
    return sum + Math.abs(toNumber(row.amount || row.reward_amount || row.total_amount));
  }, 0);

  const payoutRowsForTotals = payoutRows.length ? payoutRows : guruPayoutRows;
  const payoutTotal = payoutRowsForTotals.reduce(
    (sum, row) =>
      sum +
      Math.abs(
        toNumber(row.amount) ||
          toNumber(row.payout_amount) ||
          toNumber(row.net_amount) ||
          toNumber(row.gross_amount) ||
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
  const liveCashBalance = businessAccounts.reduce(
    (sum, row) => sum + toNumber(row.current_balance),
    0,
  );

  const totalCampaignCost = roiRows.reduce(
    (sum, row) => sum + toNumber(row.total_cost),
    0,
  );
  const totalAttributedRevenue = roiRows.reduce(
    (sum, row) => sum + toNumber(row.attributed_revenue),
    0,
  );
  const totalBookings = roiRows.reduce(
    (sum, row) => sum + toNumber(row.bookings),
    0,
  );
  const overallRoi =
    totalCampaignCost > 0
      ? ((totalAttributedRevenue - totalCampaignCost) / totalCampaignCost) * 100
      : null;

  const sourceHealth: TaxSourceHealth[] = [
    {
      id: "bookings",
      label: "Bookings / payments",
      ok: bookingRows.length > 0 || bookingPayments.length > 0,
      rowCount: Math.max(bookingRows.length, bookingPayments.length),
    },
    {
      id: "deductions",
      label: "Deduction support",
      ok: expenseRows.length > 0 || growthMarketingRows.length > 0,
      rowCount: expenseRows.length + growthMarketingRows.length,
    },
    {
      id: "payouts",
      label: "1099 / guru_payouts",
      ok: payoutRowsForTotals.length > 0 || commissionRows.length > 0,
      rowCount: payoutRowsForTotals.length + commissionRows.length,
    },
    {
      id: "reconciliation",
      label: "Bank / Stripe reconciliation",
      ok: businessAccounts.length > 0 || stripePayouts.length > 0,
      rowCount: stripePayouts.length + businessAccounts.length,
    },
    {
      id: "referrals",
      label: "Referral / PawPerks events",
      ok: referralEventRows.length > 0 || rewardRows.length > 0,
      rowCount: Math.max(referralEventRows.length, rewardRows.length),
    },
    {
      id: "marketplace",
      label: "Marketplace sales tax",
      ok: taxCollectedSupport > 0,
      rowCount: bookingRows.length + paid.length,
    },
    {
      id: "campaigns",
      label: "Growth campaign ROI",
      ok: roiRows.length > 0,
      rowCount: roiRows.length,
    },
    {
      id: "quickbooks",
      label: "QuickBooks tax feed",
      ok: true,
      rowCount: 1,
    },
  ];

  const live: TaxLiveTotals = {
    paidBookingCount: paid.length,
    bookingCount: bookingRows.length,
    bookingPaymentCount: stripePayments.length,
    referralEventCount: referralEventRows.length,
    sourceHealth,
    grossBookingVolume,
    platformRevenue,
    taxCollectedSupport,
    refundSupport,
    expenseLedgerTotal,
    expenseCount: expenseRows.length,
    growthMarketingTotal,
    marketingSummaryTotal,
    payoutTotal,
      payoutCount: payoutRowsForTotals.length,
    commissionTotal,
    commissionCount: commissionRows.length,
    stripePayoutCount: stripePayouts.length,
    stripePayoutTotal,
    liveCashBalance,
    connectedBusinessAccounts: businessAccounts.length,
    pendingRewardLiability,
    issuedReferralRewards,
    campaignCount: roiRows.length,
    totalCampaignCost,
    totalAttributedRevenue,
    totalBookings,
    overallRoi,
  };

  return {
    summaryRows,
    roiRows,
    rewardRows,
    live,
    plaidEnvironment,
  };
}

function getReadinessItems(live: TaxLiveTotals): ReadinessItem[] {
  return [
    {
      label: "Bookings / payments",
      status: live.bookingCount > 0 || live.paidBookingCount > 0 ? "ready" : "needs_review",
      detail: live.paidBookingCount
        ? `${live.paidBookingCount.toLocaleString()} paid payments · platform fees ${moneyExact(live.platformRevenue)} · tax support ${moneyExact(live.taxCollectedSupport)}.`
        : `${live.bookingCount.toLocaleString()} booking row${live.bookingCount === 1 ? "" : "s"} on SitGuru. booking_payments is still empty until checkout completes.`,
    },
    {
      label: "Deduction support",
      status:
        live.expenseCount > 0 || live.growthMarketingTotal > 0
          ? "ready"
          : "needs_review",
      detail: `${live.expenseCount.toLocaleString()} expense_ledger rows (${moneyExact(live.expenseLedgerTotal)}) · growth marketing ${moneyExact(live.growthMarketingTotal + live.marketingSummaryTotal)}.`,
    },
    {
      label: "1099 / guru_payouts",
      status:
        live.payoutCount > 0 || live.commissionCount > 0
          ? "ready"
          : "needs_review",
      detail: `${live.payoutCount.toLocaleString()} payouts (${moneyExact(live.payoutTotal)}) · ${live.commissionCount.toLocaleString()} commissions (${moneyExact(live.commissionTotal)}).`,
    },
    {
      label: "Bank / Stripe reconciliation",
      status:
        live.connectedBusinessAccounts > 0 && live.stripePayoutCount > 0
          ? "ready"
          : "needs_review",
      detail: `${live.connectedBusinessAccounts} NFCU business account${live.connectedBusinessAccounts === 1 ? "" : "s"} · ${live.stripePayoutCount.toLocaleString()} Stripe payouts · cash ${moneyExact(live.liveCashBalance)}.`,
    },
    {
      label: "Referral / PawPerks events",
      status:
        live.referralEventCount > 0 ||
        live.pendingRewardLiability > 0 ||
        live.issuedReferralRewards > 0
          ? "ready"
          : "needs_review",
      detail: `${live.referralEventCount.toLocaleString()} live hits · pending ${moneyExact(live.pendingRewardLiability)} · issued ${moneyExact(live.issuedReferralRewards)}.`,
    },
    {
      label: "Growth campaign ROI",
      status: live.campaignCount > 0 ? "ready" : "needs_review",
      detail: live.campaignCount
        ? `${live.campaignCount.toLocaleString()} campaigns · ROI ${formatPercent(live.overallRoi)}.`
        : "No campaign ROI rows yet for marketing deduction backup.",
    },
    {
      label: "Marketplace sales tax",
      status: live.taxCollectedSupport > 0 ? "ready" : "needs_review",
      detail: live.taxCollectedSupport
        ? `Stripe collected ${moneyExact(live.taxCollectedSupport)}. Tips stay optional gratuity and are not taxed.`
        : `Automatic Tax is on. Register Stripe Tax in ${marketplaceSalesTaxStateLabel()} — not MN only. Collected tax is still $0 until a paid checkout in those states.`,
    },
    {
      label: "QuickBooks tax feed",
      status: "ready",
      detail:
        "QBO journal CSV and Desktop IIF are live from SitGuru ledgers. Import, then send the package through CPA Handoff.",
    },
  ];
}

function buildQuarterlyChecklist(live: TaxLiveTotals): TaxChecklistItem[] {
  const hasRevenue = live.paidBookingCount > 0;
  const hasSpend =
    live.expenseCount > 0 ||
    live.growthMarketingTotal > 0 ||
    live.issuedReferralRewards > 0;
  const hasCash = live.connectedBusinessAccounts > 0;

  return [
    {
      step: "Q1",
      title: "January – March estimated tax review",
      description:
        "Review revenue, deductible expenses, cash reserves, prior-year CPA advice, and Q1 payment support.",
      status: hasRevenue || hasSpend ? "Review" : "Pending",
    },
    {
      step: "Q2",
      title: "April – May / June estimated tax review",
      description:
        "Review launch ramp, marketing spend, startup costs, payout obligations, and quarterly reserve needs.",
      status: hasSpend ? "Review" : "Pending",
    },
    {
      step: "Q3",
      title: "June – August / September estimated tax review",
      description:
        "Review soft-launch revenue, Guru payouts, referral rewards, marketing ROI, and tax reserve changes.",
      status:
        hasRevenue && (live.payoutCount > 0 || live.campaignCount > 0)
          ? "Review"
          : "Pending",
    },
    {
      step: "Q4",
      title: "September – December year-end tax planning",
      description:
        "Review full-year taxable income, deductions, contractor support, local tax exposure, and CPA package readiness.",
      status: hasRevenue && hasSpend && hasCash ? "Ready" : "Pending",
    },
  ];
}

function buildAnnualChecklist(live: TaxLiveTotals): TaxChecklistItem[] {
  return [
    {
      step: "01",
      title: "Confirm launch-year period",
      description:
        "Confirm the first SitGuru tax package covers Jun 1–Dec 31, 2026, unless your CPA requests a different treatment.",
      status: "Review",
    },
    {
      step: "02",
      title: "Review revenue categories",
      description:
        "Validate gross bookings, platform revenue, service fees, refunds, chargebacks, and Stripe activity.",
      status: live.paidBookingCount > 0 ? "Ready" : "Pending",
    },
    {
      step: "03",
      title: "Review payout categories",
      description:
        "Separate Guru payouts, partner commissions, Ambassador rewards, referral rewards, contractor payments, payroll, vendor expenses, and owner distributions.",
      status:
        live.payoutCount > 0 || live.commissionCount > 0 ? "Ready" : "Pending",
    },
    {
      step: "04",
      title: "Review deductible expenses",
      description:
        "Categorize software, marketing, advertising, growth campaigns, insurance, background checks, banking fees, legal, professional, and admin expenses.",
      status:
        live.expenseCount > 0 || live.growthMarketingTotal > 0
          ? "Ready"
          : "Pending",
    },
    {
      step: "05",
      title: "Review referral rewards and PawPerks",
      description:
        "Confirm issued rewards as expense support and pending rewards as liability support before CPA review.",
      status:
        live.pendingRewardLiability > 0 || live.issuedReferralRewards > 0
          ? "Ready"
          : "Pending",
    },
    {
      step: "06",
      title: "Complete reconciliations",
      description:
        "Match Stripe payouts, bank deposits, credit card charges, refunds, disputes, vendor transactions, campaign costs, and reward payouts.",
      status:
        live.stripePayoutCount > 0 && live.connectedBusinessAccounts > 0
          ? "Ready"
          : "Pending",
    },
    {
      step: "07",
      title: "Generate annual tax package",
      description:
        "Export annual statements, tax schedules, CSV files, Excel workbook, PDF packet, and full ZIP archive.",
      status: "Review",
    },
    {
      step: "08",
      title: "Send to CPA",
      description:
        "Send the tax package, notes, open questions, and supporting files to your CPA or bookkeeper.",
      status: "Pending",
    },
  ];
}

function ArrowCircle() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-emerald-700 shadow-sm transition group-hover:border-emerald-200 group-hover:bg-emerald-700 group-hover:text-white">
      →
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
        {title}
      </h2>
      <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function ChecklistBlock({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: TaxChecklistItem[];
}) {
  return (
    <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <SectionHeader eyebrow="Tax Close" title={title} description={description} />

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={`${item.step}-${item.title}`}
            className="grid gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
              {item.step}
            </span>

            <div>
              <h3 className="text-base font-black text-slate-950">{item.title}</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                {item.description}
              </p>
            </div>

            <span
              className={`w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${statusClasses(
                item.status,
              )}`}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminFinancialsTaxReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    section?: string;
    period?: string;
  }>;
}) {
  const actor = await getFinanceAdminIdentity();

  if (!actor) {
    return (
      <AdminWorkplaceDenied detail="Sign in with a finance-enabled admin account to view SitGuru Tax Center records." />
    );
  }

  const params = (await searchParams) || {};
  const section = asTrimmedString(params.section).toLowerCase();
  const period = asTrimmedString(params.period) || "2026";

  const taxData = await getTaxCenterData();
  const { live } = taxData;
  const readinessItems = getReadinessItems(live);
  const quarterlyChecklist = buildQuarterlyChecklist(live);
  const annualChecklist = buildAnnualChecklist(live);
  const marketingDeductions =
    live.marketingSummaryTotal +
    live.growthMarketingTotal +
    live.totalCampaignCost;

  const topCampaigns = [...taxData.roiRows].sort(
    (a, b) =>
      toNumber(b.bookings) - toNumber(a.bookings) ||
      toNumber(b.attributed_revenue) - toNumber(a.attributed_revenue),
  );
  return (
    <GrowthPageFrame
      kicker="Tax Center"
      title="SitGuru collects sales tax. Gurus keep the tip."
      detail="Organize quarterly and annual tax records from live Stripe bookings, NFCU cash, payouts, and campaigns. Sales tax is a SitGuru remittance job — not something Gurus add to their rates."
      action={
        <Link
          href="/admin/financials/tax-reports/marketplace-tax"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-black text-green-950"
        >
          Marketplace tax
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/financials"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
        >
          Financials
        </Link>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
          {actor.email}
        </span>
        <span className="rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800">
          Tax year {period === "annual" ? "2026" : period}
        </span>
      </div>

      {section === "local" ? (
        <GrowthCard>
          <p className="text-sm font-black text-slate-950">Local tax review mode</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Capture city, township, borough, payroll locality, and operating
            license questions by market, then send them through CPA Handoff.
          </p>
        </GrowthCard>
      ) : null}

      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        <AdminThemeCard
          label="Platform revenue"
          value={moneyExact(live.platformRevenue)}
          helper={`${live.paidBookingCount.toLocaleString()} paid payments · gross ${moneyExact(live.grossBookingVolume)}`}
          tone="emerald"
          icon={<Receipt size={18} />}
        />
        <AdminThemeCard
          label="Sales tax collected"
          value={moneyExact(live.taxCollectedSupport)}
          helper="SitGuru remits. Tips are optional gratuity and are not in this total."
          tone="violet"
          icon={<Landmark size={18} />}
        />
        <AdminThemeCard
          label="1099 payout support"
          value={moneyExact(live.payoutTotal + live.commissionTotal)}
          helper={`${live.payoutCount.toLocaleString()} payouts · ${live.commissionCount.toLocaleString()} commissions`}
          tone="amber"
          icon={<BadgeDollarSign size={18} />}
        />
        <AdminThemeCard
          label="NFCU cash"
          value={moneyExact(live.liveCashBalance)}
          helper={`${live.connectedBusinessAccounts} business account${live.connectedBusinessAccounts === 1 ? "" : "s"} · Plaid ${taxData.plaidEnvironment}`}
          tone={live.connectedBusinessAccounts > 0 ? "emerald" : "rose"}
          icon={<ShieldCheck size={18} />}
        />
      </section>

      <AdminWorkplaceActions
        actions={[
          {
            href: "#filings",
            label: "IRS & PA filings",
            detail: "Graff Enterprises LLC due dates",
            icon: CalendarClock,
            primary: true,
          },
          {
            href: "/admin/financials/tax-reports/annual-summary",
            label: "Annual summary",
            detail: "Live 2026 income and tax rollup",
            icon: Receipt,
          },
          {
            href: "/admin/financials/tax-reports/quickbooks",
            label: "QuickBooks feed",
            detail: "QBO journal + Desktop IIF for CPA",
            icon: BookOpen,
          },
        ]}
      />

      <TaxFilingCalendar />

      <MarketplaceSalesTaxStates />

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Guru-easy sales tax</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Checkout collects a service address and marks tips as optional
          gratuity. Register every required state in Stripe Tax — not Minnesota
          only — before promising a Guru that SitGuru remits for them.
        </p>
        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-3">
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">Guru lists the rate</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Tax is exclusive. A $40 walk stays $40 on the Guru&apos;s card.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">Tips are not taxed</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Pet parent generosity is not a taxable service line.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">SitGuru remits</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Sales tax payable stays on SitGuru books, not the Guru 1099.
            </p>
          </div>
        </div>
      </GrowthCard>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Tax Package Readiness"
            title="Live source wiring for CPA package support"
            description="These checks use the same finance sources already wired into P&L, Cash Flow, Balance Sheet, General Ledger, Reconciliation, Stripe, and Banking."
          />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {readinessItems.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-950">{item.label}</p>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${readinessClasses(
                      item.status,
                    )}`}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Tax Payment Workflow"
            title="How SitGuru should organize quarterly, annual, and local tax readiness"
            description="Use this as the admin tax dashboard. It does not replace CPA advice or file returns automatically, but it keeps each tax area organized, linked, and supported with the financial records already wired into SitGuru."
          />

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {taxAuthorityCards.map((card) => (
              <Link
                key={`${card.level}-${card.title}`}
                href={card.href}
                target={card.href.startsWith("http") ? "_blank" : undefined}
                rel={card.href.startsWith("http") ? "noreferrer" : undefined}
                className="group flex min-h-[250px] flex-col justify-between rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
              >
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${authorityClasses(
                      card.level,
                    )}`}
                  >
                    {card.level}
                  </span>

                  <h3 className="mt-4 text-xl font-black text-slate-950">
                    {card.title}
                  </h3>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {card.description}
                  </p>

                  <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    {card.cadence}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-black text-emerald-800">
                    {card.action}
                  </span>
                  <ArrowCircle />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Tax Package"
            title="Annual Tax Report Builder"
            description="Use these reports to organize the tax package before CPA review. Dedicated schedules are shipping next; each card already links to live sibling modules and Tax Center exports."
          />

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {taxReports.map((report) => (
              <Link
                key={report.title}
                href={report.href}
                className="group flex min-h-[360px] flex-col justify-between rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
              >
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${toneClasses(
                      report.tone,
                    )}`}
                  >
                    {report.eyebrow}
                  </span>

                  <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
                    {report.title}
                  </h3>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    {report.description}
                  </p>

                  <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                    {report.liveHint}
                  </p>

                  <div className="mt-5 grid gap-2">
                    {report.included.map((item) => (
                      <p
                        key={item}
                        className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"
                      >
                        ✓ {item}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-black text-emerald-800">
                    Open tax report
                  </span>
                  <ArrowCircle />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <ChecklistBlock
            title="Quarterly Estimated Tax Checklist"
            description="Statuses update from live Stripe, expense, payout, campaign, and bank wiring so quarterly reviews stay grounded in current SitGuru books."
            items={quarterlyChecklist}
          />

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-700">
                CPA Review Note
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Confirm final tax treatment before paying or filing
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                This Tax Center helps organize tax-ready reports and supporting
                records. Your CPA should confirm final treatment for deductions,
                1099 reporting, marketplace tax exposure, payroll, sales tax,
                estimated taxes, local taxes, and entity-specific filing
                requirements.
              </p>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Live Tax Support Totals
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Current books snapshot
              </h2>

              <div className="mt-5 grid gap-2 text-sm font-bold text-slate-600">
                {[
                  `Platform revenue: ${moneyExact(live.platformRevenue)}`,
                  `Refund / dispute support: ${moneyExact(live.refundSupport)}`,
                  `Expense ledger: ${moneyExact(live.expenseLedgerTotal)}`,
                  `Marketing deductions: ${moneyExact(marketingDeductions)}`,
                  `Pending reward liability: ${moneyExact(live.pendingRewardLiability)}`,
                  `Issued referral rewards: ${moneyExact(live.issuedReferralRewards)}`,
                  `Stripe payouts: ${moneyExact(live.stripePayoutTotal)}`,
                  `Campaign ROI: ${formatPercent(live.overallRoi)}`,
                ].map((item) => (
                  <p
                    key={item}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    ✓ {item}
                  </p>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <ChecklistBlock
          title="Annual Tax Preparation Checklist"
          description="Checklist statuses now reflect live revenue, payout, deduction, reward, and reconciliation readiness before CPA handoff."
          items={annualChecklist}
        />

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Growth, Referrals & Tax Backup"
            title="Campaign ROI and reward liability support"
            description="These rows come from the same Growth & Referrals financial views already wired into P&L, Cash Flow, Balance Sheet, General Ledger, Reconciliation, CPA Handoff, Payouts, and Analytics."
          />

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Campaign ROI support
                </p>
              </div>

              <div className="max-h-[420px] overflow-auto">
                {topCampaigns.length ? (
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {["Campaign", "Bookings", "Revenue", "Cost", "ROI"].map(
                          (heading) => (
                            <th
                              key={heading}
                              className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400"
                            >
                              {heading}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {topCampaigns.slice(0, 10).map((row, index) => (
                        <tr
                          key={`${row.campaign_name}-${row.channel}-${index}`}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-5 py-4">
                            <p className="font-black text-slate-950">
                              {row.campaign_name || "Unassigned Campaign"}
                            </p>
                            <p className="text-xs font-bold text-slate-500">
                              {row.channel || "unknown"} ·{" "}
                              {row.growth_signal || "needs_more_data"}
                            </p>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-700">
                            {toNumber(row.bookings).toLocaleString()}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-700">
                            {moneyExact(toNumber(row.attributed_revenue))}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-700">
                            {moneyExact(toNumber(row.total_cost))}
                          </td>
                          <td className="px-5 py-4 font-black text-emerald-700">
                            {formatPercent(row.roi_percent)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-5">
                    <p className="text-sm font-bold leading-6 text-slate-600">
                      No campaign ROI rows yet. Add campaign events and costs for
                      QR codes, flyers, paid ads, partner links, Ambassador links,
                      and referral campaigns to populate this tax support table.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Financial category support
              </p>

              <div className="mt-4 grid gap-3">
                {taxData.summaryRows.length ? (
                  taxData.summaryRows.slice(0, 10).map((row, index) => (
                    <div
                      key={`${row.financial_category}-${row.source}-${index}`}
                      className="rounded-[1.25rem] border border-slate-100 bg-white p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-950">
                            {row.financial_category || "Growth / Referral Category"}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            {row.financial_statement_section || "Tax support"} ·{" "}
                            {row.source || "growth"}
                          </p>
                        </div>

                        <p className="text-xl font-black text-emerald-800">
                          {moneyExact(toNumber(row.total_amount))}
                        </p>
                      </div>

                      <p className="mt-2 text-xs font-bold text-slate-500">
                        {toNumber(row.row_count).toLocaleString()} support row(s)
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-slate-100 bg-white p-4 text-sm font-bold text-slate-600">
                    No financial category rollup rows yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Export Tax Files"
            title="Download Tax Support Package"
            description="Export live tax support totals now, or open Export Center for broader annual package workflows."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {exportCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group flex min-h-[220px] flex-col justify-between rounded-[1.5rem] border border-emerald-100 bg-[#fbfefd] p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white hover:shadow-lg"
              >
                <div>
                  <h3 className="text-xl font-black text-slate-950">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    {card.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-black text-emerald-800">
                    Prepare export
                  </span>
                  <ArrowCircle />
                </div>
              </Link>
            ))}
          </div>
        </section>

      <AdminWorkplaceHealth
        sources={live.sourceHealth}
        helper={`${live.sourceHealth.filter((item) => item.ok).length} of ${live.sourceHealth.length} SitGuru sources connected`}
        links={
          <>
            <Link
              href="/admin/financials/payment-gateway"
              className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900"
            >
              Payment gateway
            </Link>
            <Link
              href="/api/admin/financials/tax-reports/export?format=pdf"
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              Tax PDF
            </Link>
          </>
        }
      />
    </GrowthPageFrame>
  );
}
