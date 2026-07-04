"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type KpiTone = "green" | "blue" | "red";

type KpiCard = {
  label: string;
  value: string;
  rawValue: number;
  change: string;
  helper: string;
  tone: KpiTone;
};

type ReportCard = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  tone: "green" | "blue" | "purple" | "orange" | "red" | "slate";
};

type PeriodCard = {
  title: string;
  description: string;
  href: string;
};

type FunnelRow = {
  label: string;
  value: string;
  rawValue: number;
  widthClass: string;
};

type PayoutStatus = {
  paid: number;
  processing: number;
  pending: number;
  total: number;
};

type CommissionStatus = {
  paid: number;
  processing: number;
  pending: number;
  total: number;
};

type CashRunway = {
  months: number;
  cashBalance: number;
  monthlyBurn: number;
  runwayEndLabel: string;
};

type RevenueTrendPoint = {
  label: string;
  platformRevenue: number;
  grossBookings: number;
};

type ExpenseTrendPoint = {
  month: string;
  payouts: number;
  commissions: number;
  fees: number;
  other: number;
};

type CashFlowCategory = {
  label: string;
  value: number;
  displayValue: string;
  type: "inflow" | "outflow" | "net";
};

type ManagementAlert = {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical" | "success";
  href: string;
};

type SourceHealth = {
  id?: string;
  table: string;
  ok: boolean;
  rowCount: number;
  message: string;
};

type PlaidBankingSummary = {
  connectedBusinessAccounts: number;
  businessCheckingAccounts: number;
  businessSavingsAccounts: number;
  currentCashBalance: number;
  availableCashBalance: number;
  postedTransactions: number;
  pendingTransactions: number;
  needsReviewTransactions: number;
  manualCategorizedTransactions: number;
  uncategorizedTransactions: number;
  businessOnlyFeed: boolean;
  lastSyncedAt: string | null;
};

type FinancialOverviewResponse = {
  ok: boolean;
  isLive: boolean;
  generatedAt: string;
  filters: {
    range: string;
    startDate: string | null;
    endDate: string | null;
    segment: string;
  };
  sourceHealth: SourceHealth[];
  plaidBanking?: PlaidBankingSummary;
  kpis: KpiCard[];
  breakEven: {
    percent: number;
    target: number;
    currentContribution: number;
    remaining: number;
    runwayMonths: number;
  };
  bookingsToCashFunnel: FunnelRow[];
  guruPayoutStatus: PayoutStatus;
  partnerCommissionStatus: CommissionStatus;
  cashRunway: CashRunway;
  revenueTrend: RevenueTrendPoint[];
  expenseTrend: ExpenseTrendPoint[];
  cashFlowByCategory: CashFlowCategory[];
  managementAlerts: ManagementAlert[];
  fallbackUsed: boolean;
};

type ExportHistoryItem = {
  id: string;
  title: string;
  period: string;
  format: string;
  status: "Ready" | "Processing" | "Sent" | "Needs Review" | "Failed";
  createdBy: string;
  createdAt: string;
  href: string;
};

type ExportHistoryResponse = {
  ok: boolean;
  isLive: boolean;
  history: ExportHistoryItem[];
  message?: string;
};

type TrustSafetyPlanRollup = {
  planKey: string;
  planName: string;
  purchases: number;
  revenueCents: number;
  outstandingCents: number;
  bookingDeductionRemainingCents: number;
  approvalPending: number;
  checkrReady: number;
  clearCount: number;
  bookableCount: number;
};

type TrustSafetyFinancialsResponse = {
  ok: boolean;
  isLive: boolean;
  generatedAt: string;
  message?: string;
  totals: {
    purchases: number;
    revenueCents: number;
    outstandingCents: number;
    bookingDeductionRemainingCents: number;
    approvalPending: number;
    checkrReady: number;
    clearCount: number;
    bookableCount: number;
  };
  plans: TrustSafetyPlanRollup[];
};

type GrowthFinancialSummaryRow = {
  financial_category: string;
  financial_statement_section: string;
  row_count: number;
  total_amount: number;
  first_activity_date: string | null;
  last_activity_date: string | null;
  source: string;
};

type GrowthCampaignRoiRow = {
  campaign_id: string | null;
  campaign_name: string;
  campaign_slug: string | null;
  channel: string;
  campaign_type: string;
  source: string | null;
  clicks: number;
  leads: number;
  signups: number;
  bookings: number;
  attributed_revenue: number;
  total_cost: number;
  net_growth_return: number;
  roi_percent: number | null;
  signup_conversion_percent: number | null;
  booking_conversion_percent: number | null;
  cost_per_signup: number | null;
  cost_per_booking: number | null;
  growth_signal: string;
  admin_recommendation: string;
  last_event_at: string | null;
  last_cost_date: string | null;
};

type GrowthReferralFinancialsResponse = {
  ok: boolean;
  isLive: boolean;
  generatedAt: string;
  message?: string;
  totals: {
    marketingExpense: number;
    pendingRewardLiability: number;
    issuedReferralRewards: number;
    totalAttributedRevenue: number;
    totalGrowthCost: number;
    netGrowthReturn: number;
    overallRoiPercent: number | null;
    campaignsTracked: number;
    clicks: number;
    leads: number;
    signups: number;
    bookings: number;
  };
  summaryRows: GrowthFinancialSummaryRow[];
  roiRows: GrowthCampaignRoiRow[];
};

const fallbackTrustSafetyFinancials: TrustSafetyFinancialsResponse = {
  ok: true,
  isLive: false,
  generatedAt: new Date().toISOString(),
  message: "Trust & Safety financial data is loading.",
  totals: {
    purchases: 0,
    revenueCents: 0,
    outstandingCents: 0,
    bookingDeductionRemainingCents: 0,
    approvalPending: 0,
    checkrReady: 0,
    clearCount: 0,
    bookableCount: 0,
  },
  plans: [
    {
      planKey: "paw_in_full",
      planName: "Paw in Full",
      purchases: 0,
      revenueCents: 0,
      outstandingCents: 0,
      bookingDeductionRemainingCents: 0,
      approvalPending: 0,
      checkrReady: 0,
      clearCount: 0,
      bookableCount: 0,
    },
    {
      planKey: "pawstep_plan",
      planName: "Pawstep Plan",
      purchases: 0,
      revenueCents: 0,
      outstandingCents: 0,
      bookingDeductionRemainingCents: 0,
      approvalPending: 0,
      checkrReady: 0,
      clearCount: 0,
      bookableCount: 0,
    },
    {
      planKey: "book_and_bark_plan",
      planName: "Book & Bark Plan",
      purchases: 0,
      revenueCents: 0,
      outstandingCents: 0,
      bookingDeductionRemainingCents: 0,
      approvalPending: 0,
      checkrReady: 0,
      clearCount: 0,
      bookableCount: 0,
    },
  ],
};

const fallbackGrowthReferralFinancials: GrowthReferralFinancialsResponse = {
  ok: true,
  isLive: false,
  generatedAt: new Date().toISOString(),
  message: "Growth, referral, and marketing ROI financial data is loading.",
  totals: {
    marketingExpense: 0,
    pendingRewardLiability: 0,
    issuedReferralRewards: 0,
    totalAttributedRevenue: 0,
    totalGrowthCost: 0,
    netGrowthReturn: 0,
    overallRoiPercent: null,
    campaignsTracked: 0,
    clicks: 0,
    leads: 0,
    signups: 0,
    bookings: 0,
  },
  summaryRows: [],
  roiRows: [],
};

const fallbackOverview: FinancialOverviewResponse = {
  ok: true,
  isLive: false,
  generatedAt: new Date().toISOString(),
  filters: {
    range: "month",
    startDate: null,
    endDate: null,
    segment: "all",
  },
  sourceHealth: [
    {
      id: "live-data-unavailable-source",
      table: "live_financial_overview",
      ok: false,
      rowCount: 0,
      message:
        "Live financial overview data is unavailable. No preview or estimated financial numbers are being shown.",
    },
  ],
  plaidBanking: {
    connectedBusinessAccounts: 0,
    businessCheckingAccounts: 0,
    businessSavingsAccounts: 0,
    currentCashBalance: 0,
    availableCashBalance: 0,
    postedTransactions: 0,
    pendingTransactions: 0,
    needsReviewTransactions: 0,
    manualCategorizedTransactions: 0,
    uncategorizedTransactions: 0,
    businessOnlyFeed: true,
    lastSyncedAt: null,
  },
  kpis: [
    {
      label: "Gross Bookings",
      value: "$0",
      rawValue: 0,
      change: "Live data unavailable",
      helper: "no fallback shown",
      tone: "green",
    },
    {
      label: "Platform Revenue",
      value: "$0",
      rawValue: 0,
      change: "Live data unavailable",
      helper: "no fallback shown",
      tone: "green",
    },
    {
      label: "Guru Payouts",
      value: "$0",
      rawValue: 0,
      change: "Live data unavailable",
      helper: "no fallback shown",
      tone: "green",
    },
    {
      label: "Partner Commissions",
      value: "$0",
      rawValue: 0,
      change: "Live data unavailable",
      helper: "no fallback shown",
      tone: "blue",
    },
    {
      label: "Stripe Fees",
      value: "$0",
      rawValue: 0,
      change: "Live data unavailable",
      helper: "no fallback shown",
      tone: "blue",
    },
    {
      label: "Refunds / Chargebacks",
      value: "$0",
      rawValue: 0,
      change: "Live data unavailable",
      helper: "no fallback shown",
      tone: "red",
    },
    {
      label: "Net Margin",
      value: "0%",
      rawValue: 0,
      change: "Live data unavailable",
      helper: "no fallback shown",
      tone: "green",
    },
    {
      label: "Cash Balance",
      value: "$0",
      rawValue: 0,
      change: "Live data unavailable",
      helper: "no fallback shown",
      tone: "green",
    },
  ],
  breakEven: {
    percent: 0,
    target: 0,
    currentContribution: 0,
    remaining: 0,
    runwayMonths: 0,
  },
  bookingsToCashFunnel: [
    {
      label: "Gross Bookings",
      value: "$0",
      rawValue: 0,
      widthClass: "w-full",
    },
    {
      label: "Less Cancellations",
      value: "$0",
      rawValue: 0,
      widthClass: "w-full",
    },
    {
      label: "Net Bookings",
      value: "$0",
      rawValue: 0,
      widthClass: "w-full",
    },
    {
      label: "Collected Cash",
      value: "$0",
      rawValue: 0,
      widthClass: "w-full",
    },
    {
      label: "Payouts & Fees",
      value: "$0",
      rawValue: 0,
      widthClass: "w-full",
    },
    {
      label: "Net Cash Retained",
      value: "$0",
      rawValue: 0,
      widthClass: "w-full",
    },
  ],
  guruPayoutStatus: {
    paid: 0,
    processing: 0,
    pending: 0,
    total: 0,
  },
  partnerCommissionStatus: {
    paid: 0,
    pending: 0,
    processing: 0,
    total: 0,
  },
  cashRunway: {
    months: 0,
    cashBalance: 0,
    monthlyBurn: 0,
    runwayEndLabel: "Live data unavailable",
  },
  revenueTrend: [],
  expenseTrend: [],
  cashFlowByCategory: [
    {
      label: "Platform Revenue",
      value: 0,
      displayValue: "$0",
      type: "inflow",
    },
    {
      label: "Payouts",
      value: 0,
      displayValue: "$0",
      type: "outflow",
    },
    {
      label: "Partner Commissions",
      value: 0,
      displayValue: "$0",
      type: "outflow",
    },
    {
      label: "Stripe Fees",
      value: 0,
      displayValue: "$0",
      type: "outflow",
    },
    {
      label: "Refunds / Chargebacks",
      value: 0,
      displayValue: "$0",
      type: "outflow",
    },
    {
      label: "Operating Expenses",
      value: 0,
      displayValue: "$0",
      type: "outflow",
    },
    {
      label: "Net Cash Flow",
      value: 0,
      displayValue: "$0",
      type: "net",
    },
  ],
  managementAlerts: [
    {
      id: "live-financial-data-unavailable",
      title: "Live financial data unavailable",
      description:
        "SitGuru is showing zero-only placeholders because the live financial overview API did not return usable data. No preview, estimated, or make-believe financial numbers are displayed.",
      severity: "warning",
      href: "/admin/financials",
    },
  ],
  fallbackUsed: true,
};

const reportingPeriods: PeriodCard[] = [
  {
    title: "Daily Report",
    description:
      "Today or yesterday owner snapshot, bookings, Stripe activity, refunds, deposits, disputes, and operating activity.",
    href: "/admin/financials/reports/daily",
  },
  {
    title: "Weekly Report",
    description:
      "Weekly performance, guru payouts, partner commissions, cash movement, booking trends, and exceptions.",
    href: "/admin/financials/reports/weekly",
  },
  {
    title: "Monthly CPA Package",
    description:
      "Monthly close package with statements, reconciliations, general ledger, payout records, and CPA checklist.",
    href: "/admin/financials/cpa-handoff?period=monthly",
  },
  {
    title: "Quarterly CPA Package",
    description:
      "Quarterly review package for CPA planning, estimated taxes, 1099 tracking, and owner review.",
    href: "/admin/financials/cpa-handoff?period=quarterly",
  },
  {
    title: "Annual Tax Package",
    description:
      "Year-end tax package with full-year statements, categorized deductions, contractor payments, and export files.",
    href: "/admin/financials/tax-reports?period=annual",
  },
  {
    title: "YTD / Custom Range",
    description:
      "Generate reports for year-to-date, investor review, audit support, lender requests, or custom CPA periods.",
    href: "/admin/financials/reports/custom",
  },
];

const coreStatements: ReportCard[] = [
  {
    eyebrow: "Income Statement",
    title: "Profit & Loss",
    description:
      "Track revenue, refunds, guru payouts, partner commissions, operating expenses, and net income by period.",
    href: "/admin/financials/profit-loss",
    tone: "green",
  },
  {
    eyebrow: "Assets = Liabilities + Equity",
    title: "Balance Sheet",
    description:
      "Review SitGuru assets, liabilities, owner equity, retained earnings, receivables, payables, and cash position.",
    href: "/admin/financials/balance-sheet",
    tone: "blue",
  },
  {
    eyebrow: "Liquidity",
    title: "Cash Flow",
    description:
      "Understand cash coming in and out across operations, investing, financing, Stripe activity, and bank deposits.",
    href: "/admin/financials/cash-flow",
    tone: "blue",
  },
  {
    eyebrow: "Forecasting",
    title: "Pro Forma",
    description:
      "Model projected bookings, platform revenue, Guru payouts, refunds, operating expenses, cash runway, and break-even timing.",
    href: "/admin/financials/pro-forma",
    tone: "green",
  },
  {
    eyebrow: "Ownership",
    title: "Shareholders' Equity",
    description:
      "Track ownership contributions, retained earnings, distributions, equity changes, and founder investment history.",
    href: "/admin/financials/equity",
    tone: "purple",
  },
];

const supportingRecords: ReportCard[] = [
  {
    eyebrow: "A/R Aging",
    title: "Accounts Receivable Aging",
    description:
      "Monitor customer balances, open invoices, unpaid bookings, failed payments, chargebacks, and collection risk.",
    href: "/admin/financials/accounts-receivable",
    tone: "orange",
  },
  {
    eyebrow: "A/P Aging",
    title: "Accounts Payable Aging",
    description:
      "Track vendor bills, platform expenses, contractor obligations, subscription costs, and upcoming payment due dates.",
    href: "/admin/financials/accounts-payable",
    tone: "orange",
  },
  {
    eyebrow: "Variance",
    title: "Budget vs. Actual",
    description:
      "Compare projected revenue, operating spend, partner growth, payroll, marketing, and technology costs against actuals.",
    href: "/admin/financials/budget-vs-actual",
    tone: "blue",
  },
  {
    eyebrow: "Audit Detail",
    title: "General Ledger",
    description:
      "View accounting-ready transaction detail across customers, gurus, partners, admins, vendors, payouts, and adjustments.",
    href: "/admin/financials/general-ledger",
    tone: "slate",
  },
  {
    eyebrow: "Monthly Close",
    title: "Bank & Card Reconciliation",
    description:
      "Reconcile Stripe settlements, NFCU/Plaid business banking, credit card transactions, deposits, and fees.",
    href: "/admin/financials/reconciliation",
    tone: "green",
  },
  {
    eyebrow: "Labor Costs",
    title: "Payroll & Contractor Records",
    description:
      "Separate employee payroll, contractor payments, guru earnings, taxes, benefits, and quarterly reporting support.",
    href: "/admin/financials/payroll",
    tone: "red",
  },
];

const operatingFinance: ReportCard[] = [
  {
    eyebrow: "Guru Payments",
    title: "Guru Payouts",
    description:
      "Track completed stays, payable guru balances, payout batches, payout status, exceptions, and payment references.",
    href: "/admin/financials/payouts",
    tone: "green",
  },
  {
    eyebrow: "Partners",
    title: "Partner Commissions",
    description:
      "Review ambassador payments, affiliate commissions, partner referrals, commission rates, and approved payout batches.",
    href: "/admin/financials/commissions",
    tone: "green",
  },
  {
    eyebrow: "Payments",
    title: "Stripe Transactions",
    description:
      "Track gross payments, fees, refunds, disputes, chargebacks, transfers, payout reconciliation, and customer payment status.",
    href: "/admin/financials/stripe",
    tone: "purple",
  },
  {
    eyebrow: "Checkout Options",
    title: "Payment Options Dashboard",
    description:
      "Review desktop/mobile checkout preferences, wallet options, saved methods, ACH placeholders, PawPerks, referral credits, promo codes, gift/SitGuru credits, and Guru tips.",
    href: "/admin/payments",
    tone: "blue",
  },
  {
    eyebrow: "Banking",
    title: "NFCU / Plaid Business Banking",
    description:
      "Review connected NFCU Business Checking/Savings accounts, masks, balances, posted/pending transactions, review status, and sync health.",
    href: "/admin/financials/plaid",
    tone: "green",
  },
  {
    eyebrow: "Expenses",
    title: "Vendor & Admin Expenses",
    description:
      "Categorize software, insurance, supplies, marketing, background checks, banking fees, and administrative expenses.",
    href: "/admin/financials/vendors",
    tone: "slate",
  },
  {
    eyebrow: "Trust & Safety",
    title: "Screening Plan Financials",
    description:
      "Review Paw in Full, Pawstep, and Book & Bark plan revenue, balances, approvals, and Checkr-ready financial clearance.",
    href: "/admin/background-checks",
    tone: "green",
  },
];

const cpaChecklist = [
  "Review Stripe payments, refunds, fees, disputes, and transfers.",
  "Reconcile Stripe payouts to NFCU/Plaid business banking deposits.",
  "Confirm guru payouts, partner commissions, and payout exceptions.",
  "Categorize vendor expenses by operating, administrative, payroll, contractor, and technology costs.",
  "Review A/R aging, A/P aging, balance sheet accounts, and general ledger detail.",
  "Export CPA-ready CSV files and supporting records for QuickBooks or bookkeeping review.",
];

const statementExportLinks = [
  {
    title: "Profit & Loss Export",
    description: "CSV, Excel, Word, PDF/print, and email-ready P&L statement.",
    href: "/api/admin/financials/profit-loss/export?format=excel",
  },
  {
    title: "Balance Sheet Export",
    description: "Assets, liabilities, equity, reconciliation notes, and CPA-ready account mapping.",
    href: "/api/admin/financials/balance-sheet/export?format=excel",
  },
  {
    title: "Cash Flow Export",
    description: "Operating cash movement, Stripe payout deposits, NFCU/Plaid business activity, and transfers.",
    href: "/api/admin/financials/cash-flow/export?format=excel",
  },
  {
    title: "Pro Forma Export",
    description: "Forecasted bookings, platform revenue, cash runway, net income, and scenario planning.",
    href: "/api/admin/financials/pro-forma/export?format=excel",
  },
];

const rangeFilters = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Quarter", value: "quarter" },
  { label: "Annual", value: "annual" },
  { label: "YTD", value: "ytd" },
];

const segmentFilters = [
  { label: "All", value: "all" },
  { label: "Bookings", value: "bookings" },
  { label: "Gurus", value: "gurus" },
  { label: "Customers", value: "customers" },
  { label: "Partners", value: "partners" },
  { label: "Payouts", value: "payouts" },
  { label: "Banking", value: "banking" },
  { label: "Growth", value: "growth" },
  { label: "Trust & Safety", value: "trust-safety" },
];

function toneClasses(tone: ReportCard["tone"] | KpiTone) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    purple: "border-purple-200 bg-purple-50 text-purple-800",
    orange: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-rose-200 bg-rose-50 text-rose-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return tones[tone];
}

function exportStatusClasses(status: ExportHistoryItem["status"]) {
  const statuses = {
    Ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Processing: "border-blue-200 bg-blue-50 text-blue-800",
    Sent: "border-emerald-200 bg-emerald-50 text-emerald-800",
    "Needs Review": "border-amber-200 bg-amber-50 text-amber-800",
    Failed: "border-rose-200 bg-rose-50 text-rose-800",
  };

  return statuses[status];
}

function alertClasses(severity: ManagementAlert["severity"]) {
  const classes = {
    success: "border-emerald-100 bg-emerald-50 text-emerald-800",
    info: "border-blue-100 bg-blue-50 text-blue-800",
    warning: "border-amber-100 bg-amber-50 text-amber-800",
    critical: "border-rose-100 bg-rose-50 text-rose-800",
  };

  return classes[severity];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

function formatCents(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((value || 0) / 100);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Updated just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function safeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getRangeDates(range: string) {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  if (range === "today") {
    start.setHours(0, 0, 0, 0);
  }

  if (range === "week") {
    start.setDate(now.getDate() - 7);
  }

  if (range === "month") {
    start.setMonth(now.getMonth() - 1);
  }

  if (range === "quarter") {
    start.setMonth(now.getMonth() - 3);
  }

  if (range === "annual") {
    start.setFullYear(now.getFullYear() - 1);
  }

  if (range === "ytd") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function getVisibleKpis(kpis: KpiCard[], segment: string) {
  if (segment === "all") return kpis;

  const allowedBySegment: Record<string, string[]> = {
    bookings: ["Gross Bookings", "Platform Revenue", "Refunds / Chargebacks", "Net Margin"],
    customers: ["Gross Bookings", "Platform Revenue", "Refunds / Chargebacks", "Net Margin"],
    gurus: ["Guru Payouts", "Net Margin"],
    partners: ["Partner Commissions", "Net Margin"],
    payouts: ["Guru Payouts", "Partner Commissions", "Stripe Fees", "Refunds / Chargebacks"],
    banking: ["Cash Balance", "Platform Revenue", "Stripe Fees", "Refunds / Chargebacks", "Net Margin"],
    growth: ["Platform Revenue", "Partner Commissions", "Stripe Fees", "Refunds / Chargebacks", "Net Margin", "Cash Balance"],
    "trust-safety": ["Platform Revenue", "Stripe Fees", "Net Margin", "Cash Balance"],
  };

  const allowed = allowedBySegment[segment] || [];

  return kpis.filter((kpi) => allowed.includes(kpi.label));
}

function sectionVisible(segment: string, allowedSegments: string[]) {
  return segment === "all" || allowedSegments.includes(segment);
}

function getSegmentLabel(segment: string) {
  return segmentFilters.find((filter) => filter.value === segment)?.label || "All";
}

function MiniSparkline({ tone }: { tone: KpiTone }) {
  const stroke =
    tone === "red"
      ? "stroke-rose-500"
      : tone === "blue"
        ? "stroke-sky-500"
        : "stroke-emerald-500";

  return (
    <svg viewBox="0 0 160 40" className="mt-4 h-10 w-full" aria-hidden="true">
      <path
        d="M2 28 C 16 22, 22 26, 34 17 S 56 24, 68 18 S 89 15, 100 22 S 124 27, 138 18 S 150 18, 158 12"
        className={`fill-none ${stroke}`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M2 28 C 16 22, 22 26, 34 17 S 56 24, 68 18 S 89 15, 100 22 S 124 27, 138 18 S 150 18, 158 12 L158 40 L2 40 Z"
        className={
          tone === "red"
            ? "fill-rose-50"
            : tone === "blue"
              ? "fill-sky-50"
              : "fill-emerald-50"
        }
      />
    </svg>
  );
}

function ArrowCircle() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-emerald-700 shadow-sm transition group-hover:border-emerald-200 group-hover:bg-emerald-700 group-hover:text-white">
      →
    </span>
  );
}

function ReportCardTile({ card }: { card: ReportCard }) {
  return (
    <Link
      href={card.href}
      className="group flex min-h-[190px] flex-col justify-between rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
    >
      <div>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${toneClasses(
            card.tone,
          )}`}
        >
          {card.eyebrow}
        </span>

        <h3 className="mt-4 text-xl font-black leading-tight text-slate-950">
          {card.title}
        </h3>

        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          {card.description}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-sm font-black text-emerald-800">Open report</span>
        <ArrowCircle />
      </div>
    </Link>
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

function DonutMetric({
  value,
  label,
  percent = 78,
}: {
  value: string;
  label: string;
  percent?: number;
}) {
  const safePercent = Math.max(0, Math.min(100, percent));

  return (
    <div
      className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#059669 0 ${safePercent}%, #e5e7eb ${safePercent}% 100%)`,
      }}
    >
      <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
        <span className="text-3xl font-black text-slate-950">{value}</span>
        <span className="text-[11px] font-black uppercase tracking-wide text-emerald-700">
          {label}
        </span>
      </div>
    </div>
  );
}

function getLinePoints(values: number[], width: number, height: number) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

function getAreaPoints(values: number[], width: number, height: number) {
  const linePoints = getLinePoints(values, width, height);
  return `0,${height} ${linePoints} ${width},${height}`;
}

function ChartLegend({
  items,
}: {
  items: { label: string; colorClass: string }[];
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-600"
        >
          <span className={`h-2.5 w-2.5 rounded-full ${item.colorClass}`} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

function RevenueTrendChart({ data }: { data: RevenueTrendPoint[] }) {
  const width = 420;
  const height = 180;
  const labels = data.length ? data.map((item) => item.label) : ["No data"];
  const platformValues = data.length ? data.map((item) => item.platformRevenue) : [0];
  const bookingValues = data.length ? data.map((item) => item.grossBookings) : [0];
  const maxValue = Math.max(...platformValues, ...bookingValues, 1);
  const revenueLine = getLinePoints(platformValues, width, height);
  const bookingsLine = getLinePoints(bookingValues, width, height);
  const revenueArea = getAreaPoints(platformValues, width, height);

  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-950">Revenue Trend</h3>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Monthly revenue movement with labeled trend lines
          </p>
        </div>
      </div>

      <ChartLegend
        items={[
          { label: "Platform Revenue", colorClass: "bg-emerald-600" },
          { label: "Gross Bookings", colorClass: "bg-emerald-300" },
        ]}
      />

      <div className="mt-5 grid grid-cols-[56px_1fr] gap-3">
        <div className="flex h-[220px] flex-col justify-between pb-8 text-[11px] font-black text-slate-400">
          {[1, 0.75, 0.5, 0.25, 0].map((multiplier) => (
            <span key={multiplier}>{formatCurrency(maxValue * multiplier)}</span>
          ))}
        </div>

        <div className="relative h-[220px]">
          <div className="absolute inset-0 pb-8">
            <div className="flex h-full flex-col justify-between">
              {[0, 1, 2, 3, 4].map((row) => (
                <div
                  key={row}
                  className="border-t border-dashed border-slate-200"
                />
              ))}
            </div>
          </div>

          <div className="absolute inset-x-0 top-0 bottom-8">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-full w-full"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points={revenueArea} fill="rgba(16,185,129,0.10)" />
              <polyline
                points={bookingsLine}
                fill="none"
                stroke="rgba(110,231,183,1)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={revenueLine}
                fill="none"
                stroke="rgba(5,150,105,1)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div
            className="absolute inset-x-0 bottom-0 grid text-center text-[11px] font-black text-slate-400"
            style={{
              gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))`,
            }}
          >
            {labels.map((month) => (
              <span key={month}>{month}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpenseTrendChart({ data }: { data: ExpenseTrendPoint[] }) {
  const maxTotal = Math.max(
    ...data.map((bar) => bar.payouts + bar.commissions + bar.fees + bar.other),
    1,
  );

  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-950">Expense Trend</h3>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Labeled operating expense categories by month
          </p>
        </div>
      </div>

      <ChartLegend
        items={[
          { label: "Payouts", colorClass: "bg-emerald-500" },
          { label: "Commissions", colorClass: "bg-amber-400" },
          { label: "Fees", colorClass: "bg-sky-400" },
          { label: "Other Expenses", colorClass: "bg-slate-400" },
        ]}
      />

      <div className="mt-5 grid grid-cols-[56px_1fr] gap-3">
        <div className="flex h-[220px] flex-col justify-between pb-8 text-[11px] font-black text-slate-400">
          {[1, 0.8, 0.6, 0.4, 0.2, 0].map((multiplier) => (
            <span key={multiplier}>{formatCurrency(maxTotal * multiplier)}</span>
          ))}
        </div>

        <div className="relative h-[220px]">
          <div className="absolute inset-0 pb-8">
            <div className="flex h-full flex-col justify-between">
              {[0, 1, 2, 3, 4, 5].map((row) => (
                <div
                  key={row}
                  className="border-t border-dashed border-slate-200"
                />
              ))}
            </div>
          </div>

          <div className="absolute inset-x-0 top-0 bottom-8">
            <div className="flex h-full items-end gap-4">
              {data.map((bar) => {
                const total =
                  bar.payouts + bar.commissions + bar.fees + bar.other;
                const scale = maxTotal ? 160 / maxTotal : 1;

                return (
                  <div
                    key={bar.month}
                    className="flex flex-1 items-end justify-center"
                  >
                    <div
                      className="flex w-full max-w-[42px] flex-col overflow-hidden rounded-t-xl"
                      style={{ height: `${Math.max(8, total * scale)}px` }}
                    >
                      <div
                        className="bg-slate-400"
                        style={{ height: `${Math.max(2, bar.other * scale)}px` }}
                      />
                      <div
                        className="bg-sky-400"
                        style={{ height: `${Math.max(2, bar.fees * scale)}px` }}
                      />
                      <div
                        className="bg-amber-400"
                        style={{
                          height: `${Math.max(2, bar.commissions * scale)}px`,
                        }}
                      />
                      <div
                        className="bg-emerald-500"
                        style={{
                          height: `${Math.max(2, bar.payouts * scale)}px`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="absolute inset-x-0 bottom-0 grid text-center text-[11px] font-black text-slate-400"
            style={{
              gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(0, 1fr))`,
            }}
          >
            {data.map((bar) => (
              <span key={bar.month}>{bar.month}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CashFlowByCategoryChart({ data }: { data: CashFlowCategory[] }) {
  const maxAbsValue = Math.max(
    ...data.map((category) => Math.abs(category.value)),
    1,
  );

  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-black text-slate-950">
            Cash Flow by Category
          </h3>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Cash inflows and outflows by source
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
          Live
        </span>
      </div>

      <ChartLegend
        items={[
          { label: "Cash In", colorClass: "bg-emerald-600" },
          { label: "Cash Out", colorClass: "bg-rose-500" },
          { label: "Net Cash Flow", colorClass: "bg-slate-800" },
        ]}
      />

      <div className="mt-5 space-y-3">
        {data.map((category) => {
          const widthPercent = Math.max(
            8,
            Math.round((Math.abs(category.value) / maxAbsValue) * 100),
          );

          const barColor =
            category.type === "inflow"
              ? "bg-emerald-600"
              : category.type === "net"
                ? "bg-slate-800"
                : "bg-rose-500";

          const rowBg =
            category.type === "net"
              ? "bg-slate-50 border-slate-200"
              : "bg-white border-slate-100";

          const valueColor =
            category.type === "inflow"
              ? "text-emerald-700"
              : category.type === "net"
                ? "text-slate-950"
                : "text-rose-600";

          return (
            <div
              key={category.label}
              className={`rounded-xl border px-3 py-2 ${rowBg}`}
            >
              <div className="grid grid-cols-[1fr_auto] gap-3 text-xs font-black">
                <span className="text-slate-600">{category.label}</span>
                <span className={valueColor}>{category.displayValue}</span>
              </div>

              <div className="mt-2 grid grid-cols-[1fr_1fr] items-center gap-0">
                {category.value < 0 ? (
                  <>
                    <div className="flex justify-end border-r border-slate-300 pr-1">
                      <span
                        className={`h-4 rounded-l-full ${barColor}`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                    <div />
                  </>
                ) : (
                  <>
                    <div className="border-r border-slate-300" />
                    <div className="pl-1">
                      <span
                        className={`block h-4 rounded-r-full ${barColor}`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Net Cash Position
            </p>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Live calculated cash flow after payouts, commissions, fees,
              refunds, and operating expenses.
            </p>
          </div>

          <p className="text-2xl font-black text-emerald-800">
            {data.find((item) => item.type === "net")?.displayValue || "$0"}
          </p>
        </div>
      </div>
    </div>
  );
}

function getPlaidBankingSummary(overview: FinancialOverviewResponse): PlaidBankingSummary {
  const kpis = Array.isArray(overview.kpis) ? overview.kpis : [];
  const cashBalance = safeNumber(
    kpis.find((kpi) => kpi.label === "Cash Balance")?.rawValue,
  );
  const availableCash = safeNumber(
    kpis.find((kpi) => kpi.label === "Available Cash")?.rawValue,
    cashBalance,
  );
  const banking = overview.plaidBanking ?? {
    connectedBusinessAccounts: 0,
    businessCheckingAccounts: 0,
    businessSavingsAccounts: 0,
    currentCashBalance: cashBalance,
    availableCashBalance: availableCash,
    postedTransactions: 0,
    pendingTransactions: 0,
    needsReviewTransactions: 0,
    manualCategorizedTransactions: 0,
    uncategorizedTransactions: 0,
    businessOnlyFeed: true,
    lastSyncedAt: null,
  };

  return {
    connectedBusinessAccounts: safeNumber(banking.connectedBusinessAccounts),
    businessCheckingAccounts: safeNumber(banking.businessCheckingAccounts),
    businessSavingsAccounts: safeNumber(banking.businessSavingsAccounts),
    currentCashBalance: safeNumber(banking.currentCashBalance, cashBalance),
    availableCashBalance: safeNumber(
      banking.availableCashBalance,
      availableCash || cashBalance,
    ),
    postedTransactions: safeNumber(banking.postedTransactions),
    pendingTransactions: safeNumber(banking.pendingTransactions),
    needsReviewTransactions: safeNumber(banking.needsReviewTransactions),
    manualCategorizedTransactions: safeNumber(
      banking.manualCategorizedTransactions,
    ),
    uncategorizedTransactions: safeNumber(banking.uncategorizedTransactions),
    businessOnlyFeed:
      typeof banking.businessOnlyFeed === "boolean"
        ? banking.businessOnlyFeed
        : true,
    lastSyncedAt: banking.lastSyncedAt || null,
  };
}

function PlaidBankingSummaryPanel({
  overview,
}: {
  overview: FinancialOverviewResponse;
}) {
  const banking = getPlaidBankingSummary(overview);
  const hasBusinessAccounts = banking.connectedBusinessAccounts > 0;
  const reviewTotal =
    banking.needsReviewTransactions + banking.uncategorizedTransactions;

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
            Plaid / NFCU Business Banking
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Business Checking, Savings & Transaction Feed
          </h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
            This dashboard is wired to the same Plaid/NFCU banking foundation used
            by Banking, P&amp;L, Cash Flow, General Ledger, Balance Sheet,
            Reconciliation, and Pro Forma. It only summarizes business checking
            and business savings activity from the financial overview API.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
              hasBusinessAccounts
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {hasBusinessAccounts ? "Business Feed Connected" : "Needs Banking Review"}
          </span>

          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
              banking.businessOnlyFeed
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {banking.businessOnlyFeed ? "Business Only" : "Review Account Scope"}
          </span>

          <Link
            href="/admin/financials/plaid"
            className="rounded-full bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
          >
            Open Banking
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Business Accounts
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {banking.connectedBusinessAccounts.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-600">
            {banking.businessCheckingAccounts} checking · {banking.businessSavingsAccounts} savings
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
            Current Cash
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {formatCurrency(banking.currentCashBalance)}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-600">
            NFCU business balances
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-sky-100 bg-sky-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">
            Available Cash
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {formatCurrency(banking.availableCashBalance)}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-600">
            Available for operations
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-emerald-100 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Posted Rows
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {banking.postedTransactions.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-600">
            Bank-posted transactions
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
            Pending Rows
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {banking.pendingTransactions.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-600">
            May change when posted
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-rose-100 bg-rose-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">
            Needs Review
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {reviewTotal.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-600">
            Category cleanup queue
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[1.25rem] border border-slate-100 bg-[#fbfefd] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Manual Categorized
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {banking.manualCategorizedTransactions.toLocaleString()}
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            Rows manually assigned to financial report categories and ready to
            feed P&amp;L, Cash Flow, General Ledger, Balance Sheet, and Reconciliation.
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-slate-100 bg-[#fbfefd] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Uncategorized
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {banking.uncategorizedTransactions.toLocaleString()}
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            Rows still needing income, expense, transfer, owner equity, owner draw,
            liability, or ignore classification.
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-slate-100 bg-[#fbfefd] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Last Sync
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {banking.lastSyncedAt ? formatDateTime(banking.lastSyncedAt) : "Not synced"}
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            This should update when the Plaid sync route pulls business banking
            activity into SitGuru.
          </p>
        </div>
      </div>
    </section>
  );
}

function TrustSafetyFinancialsPanel({
  financials,
}: {
  financials: TrustSafetyFinancialsResponse;
}) {
  const safeFinancials = financials ?? fallbackTrustSafetyFinancials;
  const rawTotals = safeFinancials.totals ?? fallbackTrustSafetyFinancials.totals;
  const totals = {
    purchases: safeNumber(rawTotals.purchases),
    revenueCents: safeNumber(rawTotals.revenueCents),
    outstandingCents: safeNumber(rawTotals.outstandingCents),
    bookingDeductionRemainingCents: safeNumber(
      rawTotals.bookingDeductionRemainingCents,
    ),
    approvalPending: safeNumber(rawTotals.approvalPending),
    checkrReady: safeNumber(rawTotals.checkrReady),
    clearCount: safeNumber(rawTotals.clearCount),
    bookableCount: safeNumber(rawTotals.bookableCount),
  };
  const plans = (
    Array.isArray(safeFinancials.plans)
      ? safeFinancials.plans
      : fallbackTrustSafetyFinancials.plans
  ).map((plan) => ({
    planKey: plan.planKey || "unknown-plan",
    planName: plan.planName || "Screening Plan",
    purchases: safeNumber(plan.purchases),
    revenueCents: safeNumber(plan.revenueCents),
    outstandingCents: safeNumber(plan.outstandingCents),
    bookingDeductionRemainingCents: safeNumber(
      plan.bookingDeductionRemainingCents,
    ),
    approvalPending: safeNumber(plan.approvalPending),
    checkrReady: safeNumber(plan.checkrReady),
    clearCount: safeNumber(plan.clearCount),
    bookableCount: safeNumber(plan.bookableCount),
  }));

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
            Trust &amp; Safety Financials
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Screening Plan Revenue, Balances &amp; Recovery
          </h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
            Track Paw in Full, Pawstep Plan, and Book &amp; Bark Plan revenue,
            outstanding balances, booking deduction recovery, management approval
            exposure, and Checkr-ready financial clearance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
              safeFinancials.isLive
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {safeFinancials.isLive ? "Live Supabase" : "Unavailable / Offline"}
          </span>

          <Link
            href="/admin/background-checks"
            className="rounded-full bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
          >
            Open Trust &amp; Safety
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Revenue</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{formatCents(totals.revenueCents)}</p>
          <p className="mt-1 text-xs font-bold text-slate-600">Trust &amp; Safety collected</p>
        </div>

        <div className="rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Purchases</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{totals.purchases.toLocaleString()}</p>
          <p className="mt-1 text-xs font-bold text-slate-600">Plans selected</p>
        </div>

        <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Outstanding</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{formatCents(totals.outstandingCents)}</p>
          <p className="mt-1 text-xs font-bold text-slate-600">Remaining balances</p>
        </div>

        <div className="rounded-[1.25rem] border border-orange-100 bg-orange-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-700">Book &amp; Bark</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{formatCents(totals.bookingDeductionRemainingCents)}</p>
          <p className="mt-1 text-xs font-bold text-slate-600">Booking deduction recovery</p>
        </div>

        <div className="rounded-[1.25rem] border border-rose-100 bg-rose-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">Approval Exposure</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{totals.approvalPending.toLocaleString()}</p>
          <p className="mt-1 text-xs font-bold text-slate-600">Financed plans pending</p>
        </div>

        <div className="rounded-[1.25rem] border border-emerald-100 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Checkr Ready</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{totals.checkrReady.toLocaleString()}</p>
          <p className="mt-1 text-xs font-bold text-slate-600">Financially cleared</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <Link
            key={plan.planKey}
            href={`/admin/background-checks?plan=${encodeURIComponent(plan.planKey)}`}
            className="group rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Plan Performance</p>
                <h3 className="mt-2 text-xl font-black text-slate-950">{plan.planName}</h3>
              </div>
              <ArrowCircle />
            </div>

            <div className="mt-5 grid gap-3 text-sm font-bold text-slate-600">
              <p className="flex justify-between gap-4">
                <span>Purchases</span>
                <span className="text-slate-950">{plan.purchases.toLocaleString()}</span>
              </p>
              <p className="flex justify-between gap-4">
                <span>Revenue</span>
                <span className="text-slate-950">{formatCents(plan.revenueCents)}</span>
              </p>
              <p className="flex justify-between gap-4">
                <span>Outstanding</span>
                <span className="text-slate-950">{formatCents(plan.outstandingCents)}</span>
              </p>
              <p className="flex justify-between gap-4">
                <span>Approvals Pending</span>
                <span className="text-slate-950">{plan.approvalPending.toLocaleString()}</span>
              </p>
              <p className="flex justify-between gap-4">
                <span>Checkr Ready</span>
                <span className="text-slate-950">{plan.checkrReady.toLocaleString()}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function GrowthReferralFinancialsPanel({
  financials,
}: {
  financials: GrowthReferralFinancialsResponse;
}) {
  const safeFinancials = financials ?? fallbackGrowthReferralFinancials;
  const totals = safeFinancials.totals ?? fallbackGrowthReferralFinancials.totals;
  const summaryRows = Array.isArray(safeFinancials.summaryRows)
    ? safeFinancials.summaryRows
    : [];
  const roiRows = Array.isArray(safeFinancials.roiRows)
    ? safeFinancials.roiRows
    : [];

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
            Growth, Referrals &amp; Marketing ROI
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Growth Costs, Reward Liability &amp; Campaign Return
          </h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
            Financials now includes the same Growth &amp; Referrals foundation:
            campaign costs, referral reward liability, issued reward expense,
            attributed revenue, cost per signup, cost per booking, and campaign
            ROI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
              safeFinancials.isLive
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {safeFinancials.isLive ? "Live Supabase Views" : "Unavailable / Offline"}
          </span>

          <Link
            href="/admin/referrals"
            className="rounded-full bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
          >
            Open Growth &amp; Referrals
          </Link>
        </div>
      </div>

      {safeFinancials.message ? (
        <div
          className={`mb-5 rounded-[1.25rem] border p-4 ${
            safeFinancials.isLive
              ? "border-emerald-100 bg-emerald-50"
              : "border-amber-100 bg-amber-50"
          }`}
        >
          <p
            className={`text-xs font-black uppercase tracking-[0.18em] ${
              safeFinancials.isLive ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            Growth Financial Feed
          </p>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
            {safeFinancials.message}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Marketing Expense
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {formatCurrency(totals.marketingExpense)}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-600">
            Campaign costs in financial views
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
            Reward Liability
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {formatCurrency(totals.pendingRewardLiability)}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-600">
            Pending referral reward exposure
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
            Issued Rewards
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {formatCurrency(totals.issuedReferralRewards)}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-600">
            Referral rewards already expensed
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-emerald-100 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Attributed Revenue
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {formatCurrency(totals.totalAttributedRevenue)}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-600">
            Revenue tied to campaign events
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-sky-100 bg-sky-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">
            Growth ROI
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {totals.overallRoiPercent === null
              ? "Need cost data"
              : `${Math.round(totals.overallRoiPercent)}%`}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-600">
            Revenue vs growth costs
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-purple-100 bg-purple-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-700">
            Campaigns
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {totals.campaignsTracked.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-600">
            ROI rows available
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Funnel tracked in financials
          </p>
          <h3 className="mt-2 text-xl font-black text-slate-950">
            Clicks → Leads → Signups → Bookings
          </h3>

          <div className="mt-5 grid gap-3 text-sm font-bold text-slate-600">
            <p className="flex justify-between gap-4">
              <span>Clicks / QR scans</span>
              <span className="text-slate-950">{totals.clicks.toLocaleString()}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span>Leads / applications</span>
              <span className="text-slate-950">{totals.leads.toLocaleString()}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span>Signups</span>
              <span className="text-slate-950">{totals.signups.toLocaleString()}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span>Bookings</span>
              <span className="text-slate-950">{totals.bookings.toLocaleString()}</span>
            </p>
            <p className="flex justify-between gap-4 border-t border-slate-200 pt-3">
              <span>Net growth return</span>
              <span className="text-slate-950">{formatCurrency(totals.netGrowthReturn)}</span>
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Top campaign ROI rows
            </p>
          </div>

          <div className="max-h-[360px] overflow-auto">
            {roiRows.length > 0 ? (
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      Campaign
                    </th>
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      Bookings
                    </th>
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      Revenue
                    </th>
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      Cost
                    </th>
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      ROI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roiRows.slice(0, 8).map((row) => (
                    <tr
                      key={`${row.campaign_slug || row.campaign_name}-${row.channel}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950">
                          {row.campaign_name}
                        </p>
                        <p className="text-xs font-bold text-slate-500">
                          {row.channel || "unknown"} · {row.growth_signal}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {safeNumber(row.bookings).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {formatCurrency(safeNumber(row.attributed_revenue))}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {formatCurrency(safeNumber(row.total_cost))}
                      </td>
                      <td className="px-5 py-4 font-black text-emerald-700">
                        {row.roi_percent === null
                          ? "Need cost"
                          : `${Math.round(safeNumber(row.roi_percent))}%`}
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
                  and referral campaigns to populate this table.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {summaryRows.length > 0 ? (
        <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Financial category rollup
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {summaryRows.slice(0, 8).map((row) => (
              <div
                key={`${row.financial_category}-${row.financial_statement_section}-${row.source}`}
                className="rounded-[1.25rem] border border-slate-100 bg-white p-4"
              >
                <p className="text-sm font-black text-slate-950">
                  {row.financial_category}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {row.financial_statement_section}
                </p>
                <p className="mt-3 text-xl font-black text-emerald-800">
                  {formatCurrency(safeNumber(row.total_amount))}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {safeNumber(row.row_count).toLocaleString()} row(s)
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PaymentOperationsPanel() {
  const paymentOptionRows = [
    {
      title: "Checkout methods",
      value: "Card, wallets, Link, saved method, ACH",
      helper:
        "Admin can verify which desktop/mobile payment preference was selected before Stripe checkout.",
      href: "/admin/payments",
    },
    {
      title: "Credits and codes",
      value: "PawPerks, referral, promo, gift credit",
      helper:
        "Keeps customer credit requests visible before reconciliation, support, refunds, and CPA review.",
      href: "/admin/payments",
    },
    {
      title: "Guru tips",
      value: "100% tip visibility",
      helper:
        "Separates optional tips from marketplace support so Guru payout reviews stay clear.",
      href: "/admin/financials/payouts",
    },
  ];

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
            Payment Options Operations
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Desktop and Mobile Checkout Reconciliation
          </h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
            Financials now points directly to the Admin Payments dashboard so selected
            payment options, wallet choices, PawPerks/referral credits, promo codes,
            gift/SitGuru credits, custom quote requests, Guru tips, refunds, disputes,
            and payout exposure can be reviewed from one operations workflow.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/payments"
            className="rounded-full bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
          >
            Open Admin Payments
          </Link>
          <Link
            href="/admin/bookings"
            className="rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
          >
            Audit Bookings
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {paymentOptionRows.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  {item.title}
                </p>
                <h3 className="mt-2 text-xl font-black text-slate-950">
                  {item.value}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {item.helper}
                </p>
              </div>
              <ArrowCircle />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
          Owner note
        </p>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
          Older bookings may show “Not selected” until the updated desktop/mobile booking
          payload is live. New booking rows should populate selected payment option,
          credit signals, promo/gift code signals, custom quote status, and tip data.
        </p>
      </div>
    </section>
  );
}

function ManagementAlerts({ alerts }: { alerts: ManagementAlert[] }) {
  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
            Management Alerts
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Finance Items Needing Attention
          </h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
            Alerts help management avoid missed CPA handoffs, export reviews,
            failed payouts, failed payments, tax readiness issues, and monthly
            close blockers.
          </p>
        </div>

        <Link
          href="/admin/financials/cpa-handoff"
          className="inline-flex w-fit rounded-full bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
        >
          Open CPA Handoff
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {alerts.map((alert) => (
          <Link
            key={alert.id}
            href={alert.href}
            className={`group rounded-[1.5rem] border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${alertClasses(
              alert.severity,
            )}`}
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">
              {alert.severity}
            </p>
            <h3 className="mt-3 text-lg font-black leading-tight">
              {alert.title}
            </h3>
            <p className="mt-2 text-sm font-bold leading-6 opacity-80">
              {alert.description}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-current/10 pt-4">
              <span className="text-sm font-black">Review</span>
              <ArrowCircle />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecentExportActivity() {
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Loading recent export activity...");

  async function loadHistory() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/financials/export-history", {
        cache: "no-store",
      });

      const json = (await response.json()) as ExportHistoryResponse;

      if (!response.ok || !json.ok) {
        setHistory([]);
        setIsLive(false);
        setMessage(json.message || "Unable to load recent export activity.");
        return;
      }

      setHistory(Array.isArray(json.history) ? json.history.slice(0, 5) : []);
      setIsLive(Boolean(json.isLive));
      setMessage(
        json.isLive
          ? "Live export history connected."
          : json.message || "Export activity is unavailable.",
      );
    } catch (error) {
      setHistory([]);
      setIsLive(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load recent export activity.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
            Recent Export Activity
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Latest CPA, Tax & Financial Exports
          </h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
            View the most recent export records created from the Financial Export
            Center, including CPA packages, tax packages, invoices, purchase
            orders, CSVs, Excel files, PDFs, and ZIP archives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
              isLive
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {isLive ? "Live Supabase" : "Unavailable / Offline"}
          </span>

          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            className="rounded-full border border-emerald-100 bg-white px-4 py-2.5 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <Link
            href="/admin/financials/exports"
            className="rounded-full bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
          >
            Open Export Center
          </Link>
        </div>
      </div>

      <div
        className={`mb-4 rounded-[1.25rem] border p-4 ${
          isLive
            ? "border-emerald-100 bg-emerald-50"
            : "border-amber-100 bg-amber-50"
        }`}
      >
        <p
          className={`text-xs font-black uppercase tracking-[0.18em] ${
            isLive ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          Export Feed Status
        </p>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
          {message}
        </p>
      </div>

      {history.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-5">
          {history.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group flex min-h-[230px] flex-col justify-between rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-lg"
            >
              <div>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${exportStatusClasses(
                    item.status,
                  )}`}
                >
                  {item.status}
                </span>

                <h3 className="mt-3 text-base font-black leading-tight text-slate-950">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                  {item.period}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Format
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-700">
                      {item.format}
                    </p>
                  </div>

                  <ArrowCircle />
                </div>

                <p className="mt-3 text-[11px] font-bold text-slate-500">
                  {item.createdAt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
          <p className="text-sm font-bold text-slate-600">
            No export activity found yet. Open the Export Center and generate a
            package, invoice, purchase order, PDF, Excel, CSV, or ZIP record.
          </p>
        </div>
      )}
    </section>
  );
}

function SourceHealthPanel({
  sources,
  isLive,
  fallbackUsed,
}: {
  sources: SourceHealth[];
  isLive: boolean;
  fallbackUsed: boolean;
}) {
  const normalizedSources = sources.map((source, index) => ({
    ...source,
    uniqueKey:
      source.id ||
      `${source.table}-${source.message}-${source.rowCount}-${source.ok}-${index}`,
  }));

  const goodSources = normalizedSources.filter((source) => source.ok).length;
  const rowsLoaded = normalizedSources.reduce(
    (total, source) => total + source.rowCount,
    0,
  );

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
            Live Data Health
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Supabase Financial Sources
          </h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
            The overview safely checks available tables and keeps the dashboard
            running even when some financial tables are not created yet.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              Mode
            </p>
            <p className="mt-2 text-xl font-black text-slate-950">
              {isLive ? "Live" : "Fallback"}
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
              Sources OK
            </p>
            <p className="mt-2 text-xl font-black text-slate-950">
              {goodSources}/{normalizedSources.length}
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
              Rows Loaded
            </p>
            <p className="mt-2 text-xl font-black text-slate-950">
              {rowsLoaded}
            </p>
          </div>
        </div>
      </div>

      {fallbackUsed ? (
        <div className="mt-5 rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            Live Data Unavailable
          </p>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
            Live financial data is unavailable for this section. SitGuru is showing
            zero-only placeholders so no preview or estimated financial numbers are displayed.
          </p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {normalizedSources.map((source) => (
          <div
            key={source.uniqueKey}
            className={`rounded-[1.25rem] border p-4 ${
              source.ok
                ? "border-emerald-100 bg-emerald-50"
                : "border-slate-100 bg-slate-50"
            }`}
          >
            <p
              className={`text-xs font-black uppercase tracking-[0.16em] ${
                source.ok ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              {source.ok ? "Connected" : "Not Connected"}
            </p>
            <h3 className="mt-2 text-base font-black text-slate-950">
              {source.table}
            </h3>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Rows: {source.rowCount}
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
              {source.message}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdminFinancialsPage() {
  const [overview, setOverview] =
    useState<FinancialOverviewResponse>(fallbackOverview);
  const [trustSafetyFinancials, setTrustSafetyFinancials] =
    useState<TrustSafetyFinancialsResponse>(fallbackTrustSafetyFinancials);
  const [growthReferralFinancials, setGrowthReferralFinancials] =
    useState<GrowthReferralFinancialsResponse>(fallbackGrowthReferralFinancials);
  const [range, setRange] = useState("month");
  const [segment, setSegment] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState(
    "Loading live financial overview...",
  );

  const rangeDates = useMemo(() => getRangeDates(range), [range]);
  const visibleKpis = useMemo(
    () => getVisibleKpis(overview.kpis, segment),
    [overview.kpis, segment],
  );
  const segmentLabel = getSegmentLabel(segment);

  const showBreakEven = sectionVisible(segment, ["bookings", "customers", "banking"]);
  const showBookingsFunnel = sectionVisible(segment, [
    "bookings",
    "customers",
    "banking",
  ]);
  const showGuruPayouts = sectionVisible(segment, ["gurus", "payouts"]);
  const showPartnerCommissions = sectionVisible(segment, ["partners", "payouts"]);
  const showCashRunway = sectionVisible(segment, ["banking", "payouts"]);
  const showRevenueChart = sectionVisible(segment, ["bookings", "customers"]);
  const showExpenseChart = sectionVisible(segment, [
    "gurus",
    "partners",
    "payouts",
    "banking",
  ]);
  const showCashFlowChart = sectionVisible(segment, ["banking", "payouts"]);
  const showReportingCenter = sectionVisible(segment, ["banking", "payouts"]);
  const showStatements = sectionVisible(segment, ["banking"]);
  const showTrustSafetyFinancials = sectionVisible(segment, [
    "trust-safety",
    "gurus",
    "payouts",
    "banking",
  ]);
  const showGrowthReferralFinancials = sectionVisible(segment, [
    "growth",
    "partners",
    "payouts",
    "banking",
  ]);
  const showOperatingFinance = sectionVisible(segment, [
    "bookings",
    "customers",
    "gurus",
    "partners",
    "payouts",
    "banking",
    "growth",
    "trust-safety",
  ]);

  const showPaymentOperations = sectionVisible(segment, [
    "bookings",
    "customers",
    "payouts",
    "banking",
    "growth",
  ]);

  async function loadTrustSafetyFinancials() {
    try {
      const response = await fetch("/api/admin/financials/trust-safety", {
        cache: "no-store",
      });

      const json = (await response.json()) as TrustSafetyFinancialsResponse;

      if (!response.ok || !json.ok) {
        setTrustSafetyFinancials({
          ...fallbackTrustSafetyFinancials,
          message: json.message || "Unable to load Trust & Safety financials.",
        });
        return;
      }

      setTrustSafetyFinancials(json);
    } catch (error) {
      setTrustSafetyFinancials({
        ...fallbackTrustSafetyFinancials,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load Trust & Safety financials.",
      });
    }
  }

  async function loadGrowthReferralFinancials() {
    try {
      const response = await fetch("/api/admin/financials/growth-referrals", {
        cache: "no-store",
      });

      const json = (await response.json()) as GrowthReferralFinancialsResponse;

      if (!response.ok || !json.ok) {
        setGrowthReferralFinancials({
          ...fallbackGrowthReferralFinancials,
          message:
            json.message ||
            "Unable to load Growth & Referrals financial summary.",
        });
        return;
      }

      setGrowthReferralFinancials(json);
    } catch (error) {
      setGrowthReferralFinancials({
        ...fallbackGrowthReferralFinancials,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load Growth & Referrals financial summary.",
      });
    }
  }

  async function loadOverview() {
    setLoading(true);
    setLoadMessage("Loading live financial overview...");

    try {
      const searchParams = new URLSearchParams({
        range,
        segment,
        startDate: rangeDates.startDate,
        endDate: rangeDates.endDate,
      });

      const response = await fetch(
        `/api/admin/financials/overview?${searchParams.toString()}`,
        {
          cache: "no-store",
        },
      );

      const json = (await response.json()) as FinancialOverviewResponse;

      if (!response.ok || !json.ok) {
        setOverview(fallbackOverview);
        setLoadMessage("Unable to load live overview. Showing zero-only placeholders — no fallback financial numbers.");
        return;
      }

      setOverview(json);
      setLoadMessage(
        json.isLive
          ? "Live Supabase financial overview connected."
          : "Live overview API returned unavailable data. Showing zero-only placeholders — no fallback financial numbers.",
      );
    } catch (error) {
      setOverview(fallbackOverview);
      setLoadMessage(
        error instanceof Error
          ? error.message
          : "Unable to load live financial overview.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview();
    void loadTrustSafetyFinancials();
    void loadGrowthReferralFinancials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, segment]);

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-3 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1640px] space-y-6">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight text-slate-950">
                  Financial Overview
                </h1>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                    overview.isLive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {overview.isLive ? "Live" : "Unavailable"}
                </span>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-blue-800">
                  {segmentLabel} View
                </span>
                <span className="text-sm font-bold text-slate-500">
                  {loading
                    ? "Loading..."
                    : `Updated ${formatDateTime(overview.generatedAt)}`}
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Real-time financial performance across all SitGuru operations,
                including Plaid/NFCU business banking, bookings, customers, gurus,
                partners, Stripe, payment options, payouts, expenses, reporting, and CPA export readiness.
              </p>

              <div
                className={`mt-4 rounded-[1.25rem] border p-4 ${
                  overview.isLive
                    ? "border-emerald-100 bg-emerald-50"
                    : "border-amber-100 bg-amber-50"
                }`}
              >
                <p
                  className={`text-xs font-black uppercase tracking-[0.18em] ${
                    overview.isLive ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  Overview Data Status
                </p>
                <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
                  {loadMessage}
                </p>
              </div>
            </div>

            <div className="xl:min-w-[520px]">
              <div className="mb-3 flex flex-wrap gap-2">
                <Link
                  href="/admin/financials/plaid"
                  className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
                >
                  NFCU / Plaid Business Banking →
                </Link>

                <Link
                  href="/admin/financials/reconciliation"
                  className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
                >
                  Bank Reconciliation
                </Link>


                <Link
                  href="/admin/payments"
                  className="rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-black text-blue-800 shadow-sm transition hover:bg-blue-50"
                >
                  Payment Options
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {rangeFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setRange(filter.value)}
                    className={`rounded-full border px-4 py-2 text-xs font-black shadow-sm transition ${
                      range === filter.value
                        ? "border-emerald-700 bg-emerald-700 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {segmentFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setSegment(filter.value)}
                    className={`rounded-full border px-4 py-2 text-xs font-black shadow-sm transition ${
                      segment === filter.value
                        ? "border-emerald-700 bg-emerald-700 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            {visibleKpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-[1.25rem] border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div
                  className={`mb-3 inline-flex rounded-xl border p-2 ${toneClasses(
                    kpi.tone,
                  )}`}
                >
                  <span className="text-sm font-black">$</span>
                </div>
                <p className="text-xs font-black text-slate-600">{kpi.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {kpi.value}
                </p>
                <p
                  className={`mt-1 text-xs font-black ${
                    kpi.tone === "red" ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  {kpi.change}{" "}
                  <span className="font-bold text-slate-500">{kpi.helper}</span>
                </p>
                <MiniSparkline tone={kpi.tone} />
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1.05fr_1fr_1fr_0.85fr]">
            {showBreakEven ? (
              <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-base font-black text-slate-950">
                  Break-even Overview
                </h3>
                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                  <DonutMetric
                    value={`${overview.breakEven.percent}%`}
                    label="to break-even"
                    percent={overview.breakEven.percent}
                  />
                  <div className="space-y-3 text-sm font-bold text-slate-600">
                    <p className="flex justify-between gap-8">
                      <span>Break-even Target</span>
                      <span className="text-slate-950">
                        {formatCurrency(overview.breakEven.target)}
                      </span>
                    </p>
                    <p className="flex justify-between gap-8">
                      <span>Current Contribution</span>
                      <span className="text-slate-950">
                        {formatCurrency(overview.breakEven.currentContribution)}
                      </span>
                    </p>
                    <p className="flex justify-between gap-8">
                      <span>Remaining</span>
                      <span className="text-slate-950">
                        {formatCurrency(overview.breakEven.remaining)}
                      </span>
                    </p>
                    <p className="flex justify-between gap-8">
                      <span>Runway</span>
                      <span className="text-slate-950">
                        {overview.breakEven.runwayMonths} months
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {showBookingsFunnel ? (
              <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-black text-slate-950">
                    Bookings to Cash Funnel
                  </h3>
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-500">
                    {range}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {overview.bookingsToCashFunnel.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[1fr_1.2fr_auto] items-center gap-3 text-xs font-bold text-slate-600"
                    >
                      <span>{row.label}</span>
                      <span
                        className={`h-5 rounded bg-emerald-100 ${row.widthClass}`}
                      >
                        <span className="block h-full rounded bg-emerald-500/70" />
                      </span>
                      <span className="text-slate-950">{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
                  Net Cash Retained:{" "}
                  {overview.bookingsToCashFunnel.find(
                    (item) => item.label === "Net Cash Retained",
                  )?.value || "$0"}
                </div>
              </div>
            ) : null}

            {showGuruPayouts ? (
              <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-base font-black text-slate-950">
                  Guru Payout Status
                </h3>
                <div className="mt-5 flex items-center gap-5">
                  <DonutMetric
                    value={formatCurrency(
                      overview.guruPayoutStatus.total,
                    ).replace(",", "")}
                    label="total"
                    percent={78}
                  />
                  <div className="space-y-3 text-xs font-bold text-slate-600">
                    <p>
                      <span className="text-emerald-700">●</span> Paid{" "}
                      {formatCurrency(overview.guruPayoutStatus.paid)}
                    </p>
                    <p>
                      <span className="text-amber-500">●</span> Processing{" "}
                      {formatCurrency(overview.guruPayoutStatus.processing)}
                    </p>
                    <p>
                      <span className="text-blue-500">●</span> Pending{" "}
                      {formatCurrency(overview.guruPayoutStatus.pending)}
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/financials/payouts"
                  className="mt-4 inline-flex rounded-full border border-emerald-200 px-4 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-50"
                >
                  View Payouts
                </Link>
              </div>
            ) : null}

            {showPartnerCommissions ? (
              <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-base font-black text-slate-950">
                  Partner Commission Status
                </h3>
                <div className="mt-5 flex items-center gap-5">
                  <DonutMetric
                    value={formatCurrency(
                      overview.partnerCommissionStatus.total,
                    ).replace(",", "")}
                    label="total"
                    percent={64}
                  />
                  <div className="space-y-3 text-xs font-bold text-slate-600">
                    <p>
                      <span className="text-emerald-700">●</span> Paid{" "}
                      {formatCurrency(overview.partnerCommissionStatus.paid)}
                    </p>
                    <p>
                      <span className="text-amber-500">●</span> Pending{" "}
                      {formatCurrency(overview.partnerCommissionStatus.pending)}
                    </p>
                    <p>
                      <span className="text-blue-500">●</span> Processing{" "}
                      {formatCurrency(overview.partnerCommissionStatus.processing)}
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/financials/commissions"
                  className="mt-4 inline-flex rounded-full border border-emerald-200 px-4 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-50"
                >
                  View Commissions
                </Link>
              </div>
            ) : null}

            {showCashRunway ? (
              <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-base font-black text-slate-950">
                  Cash Runway
                </h3>
                <p className="mt-4 text-5xl font-black text-slate-950">
                  {overview.cashRunway.months}
                </p>
                <p className="text-sm font-black text-slate-600">
                  months of operating runway
                </p>

                <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
                  <p className="flex justify-between">
                    <span>Cash Balance</span>
                    <span className="text-slate-950">
                      {formatCurrency(overview.cashRunway.cashBalance)}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Monthly Burn</span>
                    <span className="text-slate-950">
                      {formatCurrency(overview.cashRunway.monthlyBurn)}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Runway End</span>
                    <span className="text-slate-950">
                      {overview.cashRunway.runwayEndLabel}
                    </span>
                  </p>
                </div>

                <Link
                  href="/admin/financials/cash-flow"
                  className="mt-5 inline-flex rounded-full bg-emerald-700 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-800"
                >
                  Cash Flow Forecast
                </Link>
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {showRevenueChart ? (
              <RevenueTrendChart data={overview.revenueTrend} />
            ) : null}
            {showExpenseChart ? (
              <ExpenseTrendChart data={overview.expenseTrend} />
            ) : null}
            {showCashFlowChart ? (
              <CashFlowByCategoryChart data={overview.cashFlowByCategory} />
            ) : null}
          </div>
        </section>

        {sectionVisible(segment, ["banking", "payouts", "trust-safety"]) ? (
          <PlaidBankingSummaryPanel overview={overview} />
        ) : null}

        {showTrustSafetyFinancials ? (
          <TrustSafetyFinancialsPanel financials={trustSafetyFinancials} />
        ) : null}

        {showGrowthReferralFinancials ? (
          <GrowthReferralFinancialsPanel financials={growthReferralFinancials} />
        ) : null}

        {showPaymentOperations ? <PaymentOperationsPanel /> : null}

        <ManagementAlerts alerts={overview.managementAlerts} />

        <RecentExportActivity />

        {showReportingCenter ? (
          <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <SectionHeader
              eyebrow="CPA, Tax & Reporting"
              title="CPA Handoff, Tax & Reporting Center"
              description="Generate daily, weekly, monthly, quarterly, annual, year-to-date, and custom reporting packages for CPA review, tax preparation, QuickBooks imports, bookkeeping, audit backup, and owner decision-making."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {reportingPeriods.map((period) => (
                <Link
                  key={period.title}
                  href={period.href}
                  className="group rounded-[1.5rem] border border-emerald-100 bg-[#fbfefd] p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-950">
                        {period.title}
                      </h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                        {period.description}
                      </p>
                    </div>
                    <ArrowCircle />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
              <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                  Export Formats
                </p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">
                  PDF, Excel, CSV & ZIP
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Export clean files for CPA handoff, tax preparation, QuickBooks
                  import, bookkeeping review, and audit backup.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                  Tax Support
                </p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">
                  Deduction & 1099 Tracking
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Track vendor expenses, guru payments, contractor payments,
                  partner commissions, Stripe fees, refunds, and tax categories.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
                  Export History
                </p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">
                  Saved Report Packages
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Keep a history of generated packages by period, report type,
                  export format, user, and timestamp.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {showStatements ? (
          <>
            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <SectionHeader
                eyebrow="Required Statement Package"
                title="Core Financial Statements"
                description="Use these reports to understand profitability, financial position, liquidity, and equity movement. These are the primary statements your CPA or bookkeeper will expect when reviewing SitGuru’s financial performance."
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {coreStatements.map((card) => (
                  <ReportCardTile key={card.title} card={card} />
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <SectionHeader
                eyebrow="Audit-ready support"
                title="Supporting Financial Records"
                description="These records help support monthly close, transaction review, audit readiness, collections, payables, payroll separation, vendor categorization, and CPA review."
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {supportingRecords.map((card) => (
                  <ReportCardTile key={card.title} card={card} />
                ))}
              </div>
            </section>
          </>
        ) : null}

        {showOperatingFinance ? (
          <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <SectionHeader
                eyebrow="SitGuru operating finance"
                title="Marketplace, Guru, Partner, Stripe, Banking & Vendor Tracking"
                description="Drill into the financial areas that matter most to SitGuru operations, including customer payments, guru earnings, partner payouts, affiliate commissions, Plaid bank connections, vendor expenses, and payment exceptions."
              />

              <div className="grid gap-4 md:grid-cols-2">
                {operatingFinance.map((card) => (
                  <ReportCardTile key={card.title} card={card} />
                ))}
              </div>
            </div>

            <aside className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Close Checklist
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Monthly CPA handoff workflow
              </h2>

              <div className="mt-5 space-y-3">
                {cpaChecklist.map((item, index) => (
                  <div
                    key={item}
                    className="flex gap-4 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-bold leading-6 text-slate-700">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </aside>
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Forecast and Export"
            title="CPA-Ready Documents & Business Forecasting"
            description="Generate clean documents and exports that can be sent to your CPA, bookkeeper, investor, lender, or imported into accounting platforms."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-emerald-100 bg-[#fbfefd] p-5">
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">
                PDF / Excel / CSV / ZIP
              </span>
              <h3 className="mt-4 text-2xl font-black text-slate-950">
                Financial Export Center
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Generate CPA packages, tax packages, financial export records,
                invoices, purchase orders, PDF packets, Excel workbooks, CSV
                files, ZIP archives, and saved export history.
              </p>

              <div className="mt-5 grid gap-2 text-sm font-bold text-slate-600 sm:grid-cols-2">
                {[
                  "CPA Handoff Packages",
                  "Tax Prep Packages",
                  "Invoice Documents",
                  "Purchase Orders",
                  "PDF / Excel / CSV / ZIP",
                  "Saved Export History",
                ].map((item) => (
                  <p key={item}>✓ {item}</p>
                ))}
              </div>

              <Link
                href="/admin/financials/exports"
                className="mt-6 inline-flex rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
              >
                Open Financial Export Center →
              </Link>
            </div>

            <div className="rounded-[1.5rem] border border-blue-100 bg-[#fbfdff] p-5">
              <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-800">
                Forecasting
              </span>
              <h3 className="mt-4 text-2xl font-black text-slate-950">
                Pro Forma Reports
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Model projected revenue, guru supply, customer growth, partner
                performance, expenses, profit, and cash runway.
              </p>

              <div className="mt-5 grid gap-2 text-sm font-bold text-slate-600 sm:grid-cols-2">
                {[
                  "Revenue Forecast",
                  "Cash Flow Forecast",
                  "Expense Forecast",
                  "Guru Supply Forecast",
                  "Scenario Modeling",
                  "Runway Planning",
                ].map((item) => (
                  <p key={item}>✓ {item}</p>
                ))}
              </div>

              <Link
                href="/admin/financials/pro-forma"
                className="mt-6 inline-flex rounded-full border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-800 transition hover:bg-blue-50"
              >
                View Forecast Reports →
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Statement Exports"
            title="Core Statement Export Shortcuts"
            description="Download the accounting-ready exports for the completed SitGuru financial statements. These routes match the P&L, Balance Sheet, Cash Flow, and Pro Forma pages that are now wired into the admin financial foundation."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statementExportLinks.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-[1.5rem] border border-emerald-100 bg-[#fbfefd] p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                  <ArrowCircle />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <SourceHealthPanel
          sources={overview.sourceHealth}
          isLive={overview.isLive}
          fallbackUsed={overview.fallbackUsed}
        />
      </div>
    </main>
  );
}