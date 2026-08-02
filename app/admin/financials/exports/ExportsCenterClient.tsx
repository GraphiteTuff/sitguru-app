"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  appendDateRange,
  getLaunchToDatePeriod,
  getMonthPeriod,
  getQuarterPeriod,
  getYearPeriod,
  getYtdPeriod,
} from "@/lib/admin/financials/periods";

type ExportFormatValue = "pdf" | "xlsx" | "csv" | "zip" | "word";
type ExportStatusValue = "ready" | "processing" | "sent" | "needs_review" | "failed";
type Tone = "green" | "blue" | "amber" | "purple" | "rose" | "slate";
type ReadinessStatus = "Ready" | "Linked" | "Coming Soon" | "Setup Needed";

type ReportCard = {
  title: string;
  description: string;
  openHref: string;
  csvHref?: string;
  excelHref?: string;
  wordHref?: string;
};

type ReadinessItem = {
  label: string;
  status: ReadinessStatus;
  detail: string;
};

type ExportPackage = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  packageType: string;
  reportType: string;
  periodLabel: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  exportFormat: ExportFormatValue;
  exportStatus: ExportStatusValue;
  tone: Tone;
  included: string[];
};

type FormatCard = {
  title: string;
  description: string;
  fileType: string;
  exportFormat: ExportFormatValue;
  href: string;
  tone: "green" | "blue" | "amber" | "purple";
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

type GrowthFinancialSummaryRow = {
  financial_category: string;
  financial_statement_section: string;
  row_count: number;
  total_amount: number;
  first_activity_date: string | null;
  last_activity_date: string | null;
  source: string;
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

type CreateExportRecordInput = {
  title: string;
  packageType: string;
  reportType: string;
  periodLabel: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  exportFormat: ExportFormatValue;
  exportStatus: ExportStatusValue;
  notes?: string;
  metadata?: Record<string, unknown>;
  openAfterCreate?: boolean;
};

type DeliveryOption = {
  title: string;
  description: string;
  status: "Ready" | "Coming Soon" | "Setup Needed";
  href: string;
};

const SITGURU_COMPANY = "SitGuru";
const SITGURU_EMAIL = "billing@sitguru.com";
const SITGURU_PHONE = "(855) 474-8738";
const SITGURU_WEBSITE = "www.SitGuru.com";
const SITGURU_ADDRESS = "1036 Mariwill Dr. Quakertown, PA 18951";
const SITGURU_LOGO_SRC = "/images/sitguru-logo-cropped.png";

const fallbackGrowthReferralFinancials: GrowthReferralFinancialsResponse = {
  ok: true,
  isLive: false,
  generatedAt: new Date().toISOString(),
  message: "Growth, referral, and marketing ROI export data is loading.",
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

const monthPeriod = getMonthPeriod();
const quarterPeriod = getQuarterPeriod();
const yearPeriod = getYearPeriod();
const ytdPeriod = getYtdPeriod();
const launchPeriod = getLaunchToDatePeriod();

function datedExport(path: string, format: string, start = monthPeriod.start, end = monthPeriod.end) {
  return appendDateRange(`${path}?format=${format}`, start, end);
}

const REPORTS: ReportCard[] = [
  {
    title: "Profit & Loss",
    description: "Revenue, growth marketing expenses, issued referral rewards, operating expenses, margins, and net income / loss.",
    openHref: "/admin/financials/profit-loss",
    csvHref: datedExport("/api/admin/financials/profit-loss/export", "csv"),
    excelHref: datedExport("/api/admin/financials/profit-loss/export", "excel"),
    wordHref: datedExport("/api/admin/financials/profit-loss/export", "word"),
  },
  {
    title: "Balance Sheet",
    description: "Assets, liabilities, equity, pending referral reward liabilities, and balance check at a specific point in time.",
    openHref: "/admin/financials/balance-sheet",
    csvHref: datedExport("/api/admin/financials/balance-sheet/export", "csv"),
    excelHref: datedExport("/api/admin/financials/balance-sheet/export", "excel"),
    wordHref: datedExport("/api/admin/financials/balance-sheet/export", "word"),
  },
  {
    title: "Cash Flow Statement",
    description: "Operating, investing, and financing cash movement including growth spend and issued reward cash outflows.",
    openHref: "/admin/financials/cash-flow",
    csvHref: datedExport("/api/admin/financials/cash-flow/export", "csv"),
    excelHref: datedExport("/api/admin/financials/cash-flow/export", "excel"),
    wordHref: datedExport("/api/admin/financials/cash-flow/export", "word"),
  },
  {
    title: "Pro Forma Forecast",
    description: "Forward-looking revenue, growth acquisition costs, campaign ROI assumptions, cash, and break-even modeling.",
    openHref: "/admin/financials/pro-forma",
    csvHref: datedExport("/api/admin/financials/pro-forma/export", "csv"),
    excelHref: datedExport("/api/admin/financials/pro-forma/export", "excel"),
    wordHref: datedExport("/api/admin/financials/pro-forma/export", "word"),
  },
  {
    title: "Commissions / Referral Rewards",
    description: "Referral rewards, ambassador payouts, partner commissions, Guru referral rewards, and payout eligibility review.",
    openHref: "/admin/financials/commissions",
    csvHref: datedExport("/api/admin/commissions/export", "csv"),
    excelHref: datedExport("/api/admin/commissions/export", "excel"),
    wordHref: datedExport("/api/admin/commissions/export", "word"),
  },
  {
    title: "Payout Analytics",
    description: "Guru payouts, partner payouts, PawPerks reward payouts, payout exceptions, and accounting-ready payout reporting.",
    openHref: "/admin/payouts",
    csvHref: datedExport("/api/admin/financials/payouts/export", "csv"),
  },
  {
    title: "General Ledger",
    description: "Audit-ready transaction detail including growth marketing debits, reward expense, and reward payable entries.",
    openHref: "/admin/financials/general-ledger",
    csvHref: datedExport("/api/admin/financials/general-ledger/export", "csv"),
    excelHref: datedExport("/api/admin/financials/general-ledger/export", "excel"),
    wordHref: datedExport("/api/admin/financials/general-ledger/export", "word"),
  },
  {
    title: "Reconciliation",
    description: "Reconcile Stripe, Plaid/NFCU, campaign costs, issued rewards, payouts, and bank activity.",
    openHref: "/admin/financials/reconciliation",
    csvHref: datedExport("/api/admin/financials/reconciliation/export", "csv"),
    excelHref: datedExport("/api/admin/financials/reconciliation/export", "excel"),
    wordHref: datedExport("/api/admin/financials/reconciliation/export", "word"),
  },
  {
    title: "Tax Center",
    description: "Federal, quarterly, annual, state/local, city/county, deduction, 1099, and CPA tax package support.",
    openHref: "/admin/financials/tax-reports",
    csvHref: datedExport("/api/admin/financials/tax-reports/export", "csv", yearPeriod.start, yearPeriod.end),
    excelHref: datedExport("/api/admin/financials/tax-reports/export", "excel", yearPeriod.start, yearPeriod.end),
    wordHref: datedExport("/api/admin/financials/tax-reports/export", "word", yearPeriod.start, yearPeriod.end),
  },
  {
    title: "Stripe",
    description: "Stripe balances, booking_payments marketplace fees, payouts, and clearing support.",
    openHref: "/admin/financials/stripe",
    csvHref: datedExport("/api/admin/financials/stripe/export", "csv"),
  },
  {
    title: "Banking (Plaid / NFCU)",
    description: "Live NFCU business account balances and transaction export for reconciliation backup.",
    openHref: "/admin/financials/plaid",
    csvHref: datedExport("/api/admin/financials/plaid/export", "csv"),
  },
];

const exportPackages: ExportPackage[] = [
  {
    eyebrow: "CPA Handoff",
    title: "Monthly CPA Package",
    description: "Monthly close package with statements, ledger detail, reconciliations, Stripe backup, payouts, commissions, growth/referral activity, expenses, and CPA notes.",
    href: `/admin/financials/cpa-handoff?period=${monthPeriod.start.slice(0, 7)}`,
    packageType: "monthly-cpa",
    reportType: "cpa",
    periodLabel: monthPeriod.label,
    periodStart: monthPeriod.start,
    periodEnd: monthPeriod.end,
    exportFormat: "zip",
    exportStatus: "needs_review",
    tone: "green",
    included: [
      "Profit & Loss",
      "Balance Sheet",
      "Cash Flow",
      "General Ledger",
      "Bank Reconciliation",
      "Growth Marketing Costs",
      "Referral Reward Liability",
      "Campaign ROI Backup",
    ],
  },
  {
    eyebrow: "Quarterly Review",
    title: "Quarterly CPA Package",
    description: "Quarterly package for CPA review, estimated taxes, business planning, investor/lender reporting, and management review.",
    href: "/admin/financials/cpa-handoff?section=quarterly",
    packageType: "quarterly-cpa",
    reportType: "cpa",
    periodLabel: quarterPeriod.label,
    periodStart: quarterPeriod.start,
    periodEnd: quarterPeriod.end,
    exportFormat: "zip",
    exportStatus: "processing",
    tone: "blue",
    included: [
      "Quarterly Statements",
      "Estimated Tax Support",
      "Tax Category Summary",
      "Deductible Marketing",
      "1099 Support",
      "Payout Review",
      "Reward Liability",
      "Campaign ROI Review",
    ],
  },
  {
    eyebrow: "Tax Prep",
    title: "Annual Tax Package",
    description: "Year-end tax package for CPA preparation, deductible expenses, 1099 support, federal/state/local readiness, audit backup, and reconciliation support.",
    href: `/admin/financials/tax-reports?period=${yearPeriod.start.slice(0, 4)}`,
    packageType: "annual-tax",
    reportType: "tax",
    periodLabel: yearPeriod.label,
    periodStart: yearPeriod.start,
    periodEnd: yearPeriod.end,
    exportFormat: "zip",
    exportStatus: "processing",
    tone: "amber",
    included: [
      "Annual Financial Statements",
      "Tax Center Summary",
      "Deduction Detail",
      "1099 Review",
      "Marketing Expenses",
      "Issued Referral Rewards",
      "Partner / Ambassador Rewards",
      "Audit Backup Index",
    ],
  },
  {
    eyebrow: "Growth ROI",
    title: "Growth & Referral ROI Package",
    description: "Export campaign ROI, channel performance, marketing costs, PawPerks rewards, Ambassador rewards, Partner rewards, and referral payout backup.",
    href: "/admin/referrals",
    packageType: "growth-referrals-roi",
    reportType: "growth",
    periodLabel: launchPeriod.label,
    periodStart: launchPeriod.start,
    periodEnd: launchPeriod.end,
    exportFormat: "xlsx",
    exportStatus: "ready",
    tone: "purple",
    included: [
      "Campaign ROI",
      "Clicks / Leads / Signups / Bookings",
      "Cost per Signup",
      "Cost per Booking",
      "PawPerks Rewards",
      "Guru Referral Rewards",
      "Ambassador Rewards",
      "Partner Rewards",
    ],
  },
  {
    eyebrow: "Management",
    title: "Daily / Weekly Reports",
    description: "Operational finance packages for daily and weekly owner review, exceptions, cash movement, bookings, payouts, commissions, growth signals, and Stripe activity.",
    href: "/admin/financials/reports/daily",
    packageType: "daily-weekly-reports",
    reportType: "management",
    periodLabel: `MTD · ${monthPeriod.label}`,
    periodStart: monthPeriod.start,
    periodEnd: monthPeriod.end,
    exportFormat: "zip",
    exportStatus: "ready",
    tone: "slate",
    included: [
      "Daily Snapshot",
      "Weekly Summary",
      "Booking Activity",
      "Growth Activity",
      "Payout Watch",
      "Reward Liability Watch",
      "Exceptions",
      "Management Notes",
    ],
  },
  {
    eyebrow: "Custom",
    title: "Custom / YTD Package",
    description: "Custom date range report package for CPA questions, investor reporting, lender requests, audit support, owner review, or tax planning.",
    href: "/admin/financials/reports/custom",
    packageType: "custom-ytd",
    reportType: "financial",
    periodLabel: ytdPeriod.label,
    periodStart: ytdPeriod.start,
    periodEnd: ytdPeriod.end,
    exportFormat: "zip",
    exportStatus: "needs_review",
    tone: "rose",
    included: [
      "Selected Date Range",
      "Selected Statements",
      "Growth / Referral Schedules",
      "Reconciliations",
      "Tax Categories",
      "Audit Detail",
      "Exceptions",
      "Notes",
    ],
  },
];

const formatCards: FormatCard[] = [
  {
    title: "PDF Tax Sample",
    description: "Single-file tax support PDF for the current year. Use Prepare Package on a saved record for multi-statement linked exports.",
    fileType: "PDF",
    exportFormat: "pdf",
    href: datedExport("/api/admin/financials/tax-reports/export", "pdf", yearPeriod.start, yearPeriod.end),
    tone: "green",
  },
  {
    title: "Excel P&L Sample",
    description: "Month-to-date Profit & Loss workbook sample. Save a CPA package record to prepare the full linked statement set.",
    fileType: "XLSX",
    exportFormat: "xlsx",
    href: datedExport("/api/admin/financials/profit-loss/export", "excel"),
    tone: "blue",
  },
  {
    title: "CSV Ledger Sample",
    description: "Month-to-date General Ledger CSV for accounting imports. Pair with payout and commission CSVs from Individual Reports.",
    fileType: "CSV",
    exportFormat: "csv",
    href: datedExport("/api/admin/financials/general-ledger/export", "csv"),
    tone: "amber",
  },
  {
    title: "Linked Export Bundle",
    description: "Open CPA Handoff to review and prepare linked statement downloads. Multi-file ZIP storage upload is the next upgrade.",
    fileType: "LINKED",
    exportFormat: "zip",
    href: "/admin/financials/cpa-handoff",
    tone: "purple",
  },
];

const starterTemplates: ExportHistoryItem[] = [
  {
    id: "template-monthly-cpa",
    title: "Monthly CPA Package template",
    period: monthPeriod.label,
    format: "Linked exports",
    status: "Needs Review",
    createdBy: "SitGuru Admin",
    createdAt: "Save a record to start history",
    href: `/admin/financials/cpa-handoff?period=${monthPeriod.start.slice(0, 7)}`,
  },
  {
    id: "template-growth-roi",
    title: "Growth & Referral ROI template",
    period: launchPeriod.label,
    format: "Excel / CSV",
    status: "Ready",
    createdBy: "SitGuru Admin",
    createdAt: "Open Growth hub or save a record",
    href: "/admin/referrals",
  },
  {
    id: "template-annual-tax",
    title: "Annual Tax Package template",
    period: yearPeriod.label,
    format: "Linked exports",
    status: "Processing",
    createdBy: "SitGuru Admin",
    createdAt: "Open Tax Center or save a record",
    href: `/admin/financials/tax-reports?period=${yearPeriod.start.slice(0, 4)}`,
  },
];

const deliveryOptions: DeliveryOption[] = [
  {
    title: "Download to Device",
    description: "Use Individual Reports or Prepare Package links for live CSV / Excel / Word / PDF downloads.",
    status: "Ready",
    href: "#individual-reports",
  },
  {
    title: "Save to Export History",
    description: "Store generated packages with period, format, creator, timestamp, and package status.",
    status: "Ready",
    href: "#export-history",
  },
  {
    title: "Email to CPA",
    description: "Send selected export packages to your CPA, bookkeeper, or internal finance contact.",
    status: "Coming Soon",
    href: "/admin/financials/cpa-handoff",
  },
  {
    title: "Text Management",
    description: "Text management when an export is ready, sent, reviewed, or needs corrections.",
    status: "Setup Needed",
    href: "/admin/financials/cpa-handoff#management-alerts",
  },
];

function getReadinessItems(input: {
  historyLive: boolean;
  historyCount: number;
  growthLive: boolean;
}): ReadinessItem[] {
  return [
    {
      label: "Export history table",
      status: input.historyLive ? "Ready" : "Setup Needed",
      detail: input.historyLive
        ? `${input.historyCount} saved package record${input.historyCount === 1 ? "" : "s"}.`
        : "Save a package record once financial_export_history is available.",
    },
    {
      label: "Statement exports",
      status: "Ready",
      detail: `P&L, Balance Sheet, Cash Flow, GL, and Reconciliation downloads for ${monthPeriod.label}.`,
    },
    {
      label: "Growth & referrals",
      status: input.growthLive ? "Ready" : "Linked",
      detail: input.growthLive
        ? "Live campaign ROI, marketing costs, and reward liability connected."
        : "Growth API connected in preview until campaign costs populate.",
    },
    {
      label: "Payouts & commissions",
      status: "Ready",
      detail: "CSV exports available from payouts and commissions ledgers.",
    },
    {
      label: "Stripe & banking",
      status: "Ready",
      detail: "Stripe and Plaid/NFCU CSV backup exports available.",
    },
    {
      label: "Package prepare",
      status: "Linked",
      detail: "Prepare Package builds linked statement downloads. Multi-file ZIP storage is next.",
    },
    {
      label: "CPA email delivery",
      status: "Coming Soon",
      detail: "Email handoff stays on CPA Handoff until outbound delivery is wired.",
    },
    {
      label: "Invoice / PO docs",
      status: "Coming Soon",
      detail: "Print previews only — not connected to live invoice or vendor records yet.",
    },
  ];
}

const exportChecklist = [
  "Choose report period: daily, weekly, monthly, quarterly, annual, YTD, launch-to-date, or custom.",
  "Select report package: CPA handoff, tax, management, growth/referral ROI, custom, or audit backup.",
  "Select export format: PDF, Excel workbook, CSV package, ZIP archive, Word document, or all formats.",
  "Review statements, reconciliations, payout schedules, commissions, reward liabilities, campaign costs, tax categories, and exceptions.",
  "Generate package and save to export history.",
  "Download or send the finalized package to CPA/bookkeeper after owner review.",
];

function formatCurrency(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value || 0));

  return value < 0 ? `(${formatted})` : formatted;
}

function safeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeStatus(status: ExportStatusValue): ExportHistoryItem["status"] {
  if (status === "ready") return "Ready";
  if (status === "processing") return "Processing";
  if (status === "sent") return "Sent";
  if (status === "failed") return "Failed";
  return "Needs Review";
}

function toneClasses(tone: Tone | FormatCard["tone"]) {
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

function statusClasses(
  status: ExportHistoryItem["status"] | DeliveryOption["status"] | ReadinessStatus,
) {
  const statuses: Record<string, string> = {
    Ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Linked: "border-blue-200 bg-blue-50 text-blue-800",
    Processing: "border-blue-200 bg-blue-50 text-blue-800",
    Sent: "border-emerald-200 bg-emerald-50 text-emerald-800",
    "Needs Review": "border-amber-200 bg-amber-50 text-amber-800",
    Failed: "border-rose-200 bg-rose-50 text-rose-800",
    "Coming Soon": "border-blue-200 bg-blue-50 text-blue-800",
    "Setup Needed": "border-amber-200 bg-amber-50 text-amber-800",
  };

  return statuses[status] || "border-slate-200 bg-slate-50 text-slate-700";
}

function formatRoiPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Need cost";
  return `${value.toFixed(1)}%`;
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

function ActionLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
          : "inline-flex items-center justify-center rounded-full border border-emerald-100 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
      }
    >
      {label}
    </Link>
  );
}

function GenerateRecordButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-full border border-emerald-100 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}

function GrowthExportSupportPanel({
  financials,
}: {
  financials: GrowthReferralFinancialsResponse;
}) {
  const totals = financials.totals;
  const roiRows = Array.isArray(financials.roiRows) ? financials.roiRows : [];
  const summaryRows = Array.isArray(financials.summaryRows)
    ? financials.summaryRows
    : [];

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
            Growth, Referrals, PawPerks & Marketing ROI Export Support
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Export-ready growth backup for CPA, tax, and management packages
          </h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
            This section pulls from the same Growth & Referrals financial views used
            across the dashboard, statements, reports, CPA Handoff, Tax Center,
            payouts, reconciliation, and analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
              financials.isLive
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {financials.isLive ? "Live Supabase Views" : "Preview / Offline"}
          </span>

          <ActionLink href="/admin/referrals" label="Open Growth & Referrals" primary />
        </div>
      </div>

      {financials.message ? (
        <div
          className={`mb-5 rounded-[1.25rem] border p-4 ${
            financials.isLive
              ? "border-emerald-100 bg-emerald-50"
              : "border-amber-100 bg-amber-50"
          }`}
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">
            Growth Export Feed
          </p>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
            {financials.message}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          ["Marketing Expense", formatCurrency(totals.marketingExpense), "Campaign costs"],
          ["Reward Liability", formatCurrency(totals.pendingRewardLiability), "Pending rewards"],
          ["Issued Rewards", formatCurrency(totals.issuedReferralRewards), "Expensed rewards"],
          ["Attributed Revenue", formatCurrency(totals.totalAttributedRevenue), "Campaign revenue"],
          ["Growth ROI", formatRoiPercent(totals.overallRoiPercent), "Revenue vs cost"],
          ["Campaigns", totals.campaignsTracked.toLocaleString(), "ROI rows"],
        ].map(([label, value, helper]) => (
          <div key={label} className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              {label}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
            <p className="mt-1 text-xs font-bold text-slate-600">{helper}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Export funnel backup
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

          <div className="mt-5 flex flex-wrap gap-2">
            <ActionLink href={datedExport("/api/admin/financials/tax-reports/export", "excel", yearPeriod.start, yearPeriod.end)} label="Excel Tax Support" />
            <ActionLink href={datedExport("/api/admin/financials/tax-reports/export", "csv", yearPeriod.start, yearPeriod.end)} label="CSV Tax Support" />
            <ActionLink href="/admin/referrals" label="Open Growth Hub" primary />
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Campaign ROI export rows
            </p>
          </div>

          <div className="max-h-[360px] overflow-auto">
            {roiRows.length > 0 ? (
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {[
                      "Campaign",
                      "Channel",
                      "Bookings",
                      "Revenue",
                      "Cost",
                      "ROI",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roiRows.slice(0, 8).map((row) => (
                    <tr
                      key={`${row.campaign_slug || row.campaign_name}-${row.channel}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950">{row.campaign_name}</p>
                        <p className="text-xs font-bold text-slate-500">
                          {row.growth_signal || "Growth signal pending"}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {row.channel || "unknown"}
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
                  No campaign ROI rows yet. Add campaign events and costs for QR
                  codes, flyers, paid ads, partner links, Ambassador links, and
                  referral campaigns to populate export-ready ROI tables.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {summaryRows.length > 0 ? (
        <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Export category rollup
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

function InvoicePreview() {
  return (
    <div id="invoice-preview" className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <img src={SITGURU_LOGO_SRC} alt="SitGuru" className="h-16 w-auto" />
          <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
            {SITGURU_COMPANY}
            <br />
            {SITGURU_ADDRESS}
            <br />
            {SITGURU_PHONE} · {SITGURU_EMAIL}
            <br />
            {SITGURU_WEBSITE}
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4 text-right">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Invoice Preview
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">INV-PREVIEW</p>
          <p className="mt-1 text-sm font-bold text-slate-600">Sample draft · not live</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Bill To
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
            Customer / Partner Name
            <br />
            customer@example.com
            <br />
            Service address or billing address
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Export Includes
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
            Services, booking fees, credits, referral rewards, discounts, taxes if
            applicable, payment status, and notes.
          </p>
        </div>
      </div>
    </div>
  );
}

function PurchaseOrderPreview() {
  return (
    <div id="purchase-order-preview" className="rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <img src={SITGURU_LOGO_SRC} alt="SitGuru" className="h-16 w-auto" />
          <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
            {SITGURU_COMPANY}
            <br />
            {SITGURU_ADDRESS}
            <br />
            {SITGURU_PHONE} · {SITGURU_EMAIL}
            <br />
            {SITGURU_WEBSITE}
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4 text-right">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Purchase Order Preview
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">PO-PREVIEW</p>
          <p className="mt-1 text-sm font-bold text-slate-600">Sample draft · not live</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Vendor / Payee
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
            Vendor, contractor, Ambassador, Partner, or service provider
            <br />
            vendor@example.com
            <br />
            Payment method and approval notes
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            PO Includes
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
            Campaign costs, vendor expenses, supplies, software, partner services,
            approved referral program spend, and management notes.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FinancialExportCenterPage() {
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);
  const [historyMessage, setHistoryMessage] = useState("Loading export history...");
  const [historyLive, setHistoryLive] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [growthFinancials, setGrowthFinancials] = useState<GrowthReferralFinancialsResponse>(fallbackGrowthReferralFinancials);

  const hasLiveGrowthData = growthFinancials.isLive;
  const displayHistory = history.length ? history : starterTemplates;
  const showingTemplates = history.length === 0;
  const latestHistory = useMemo(() => displayHistory.slice(0, 6), [displayHistory]);
  const readinessItems = useMemo(
    () =>
      getReadinessItems({
        historyLive,
        historyCount: history.length,
        growthLive: hasLiveGrowthData,
      }),
    [historyLive, history.length, hasLiveGrowthData],
  );

  async function loadHistory() {
    setHistoryLoading(true);

    try {
      const response = await fetch("/api/admin/financials/export-history", {
        cache: "no-store",
      });
      const json = (await response.json()) as ExportHistoryResponse;

      if (!response.ok || !json.ok) {
        setHistory([]);
        setHistoryLive(false);
        setHistoryMessage(json.message || "Unable to load live export history. Starter templates are shown.");
        return;
      }

      const rows = Array.isArray(json.history) ? json.history : [];
      setHistory(rows);
      setHistoryLive(Boolean(json.isLive && rows.length));
      setHistoryMessage(
        rows.length
          ? json.message || "Live export history connected."
          : json.message || "No saved export records yet. Use Save record on a package to start history.",
      );
    } catch (error) {
      setHistory([]);
      setHistoryLive(false);
      setHistoryMessage(
        error instanceof Error
          ? error.message
          : "Unable to load live export history. Starter templates are shown.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadGrowthFinancials() {
    try {
      const response = await fetch("/api/admin/financials/growth-referrals", {
        cache: "no-store",
      });
      const json = (await response.json()) as GrowthReferralFinancialsResponse;

      if (!response.ok || !json.ok) {
        setGrowthFinancials({
          ...fallbackGrowthReferralFinancials,
          message: json.message || "Unable to load Growth & Referrals export support.",
        });
        return;
      }

      setGrowthFinancials(json);
    } catch (error) {
      setGrowthFinancials({
        ...fallbackGrowthReferralFinancials,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load Growth & Referrals export support.",
      });
    }
  }

  async function createExportRecord(input: CreateExportRecordInput) {
    const key = `${input.packageType}-${input.exportFormat}`;
    setCreatingKey(key);
    setCreateMessage(null);

    try {
      const response = await fetch("/api/admin/financials/export-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const json = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
        href?: string;
        historyItem?: { href?: string; id?: string };
        export?: { id?: string };
      } | null;

      if (!response.ok || !json?.ok) {
        setCreateMessage(
          json?.message ||
            "Export record could not be saved yet. You can still use the direct report links.",
        );
        return;
      }

      const savedHref =
        json.href ||
        json.historyItem?.href ||
        (json.export?.id
          ? `/admin/financials/exports/${json.export.id}`
          : json.historyItem?.id
            ? `/admin/financials/exports/${json.historyItem.id}`
            : "");

      setCreateMessage("Export record saved to history.");
      await loadHistory();

      if ((input.openAfterCreate ?? true) && savedHref) {
        window.location.href = savedHref;
      }
    } catch (error) {
      setCreateMessage(
        error instanceof Error
          ? error.message
          : "Export record could not be saved yet.",
      );
    } finally {
      setCreatingKey(null);
    }
  }

  function printTarget(target: "invoice" | "purchase-order") {
    const elementId = target === "invoice" ? "invoice-preview" : "purchase-order-preview";
    const element = document.getElementById(elementId);

    if (!element) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=1200");

    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <title>${target === "invoice" ? "SitGuru Invoice" : "SitGuru Purchase Order"}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            img { max-height: 72px; width: auto; }
            .rounded-\\[1\\.75rem\\] { border-radius: 24px; }
            .border { border: 1px solid #dfe7df; }
            .p-6 { padding: 24px; }
            .shadow-sm { box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08); }
          </style>
        </head>
        <body>${element.outerHTML}</body>
      </html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  useEffect(() => {
    void loadHistory();
    void loadGrowthFinancials();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1540px] space-y-6">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link
                href="/admin/financials"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
              >
                ← Back to Financial Overview
              </Link>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight text-slate-950">
                  Financial Export Center
                </h1>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  CPA / Tax / Growth Ready
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                    hasLiveGrowthData
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {hasLiveGrowthData ? "Growth Data Live" : "Growth Preview"}
                </span>
              </div>

              <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Generate export-ready packages for CPA handoff, quarterly and annual tax work,
                Growth & Referrals ROI, PawPerks reward liability, marketing expenses,
                payout records, reconciliation support, invoices, purchase orders, and audit backup.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px]">
              <ActionLink href="/admin/financials/cpa-handoff" label="Open CPA Handoff" primary />
              <ActionLink href="/admin/financials/tax-reports" label="Open Tax Center" />
              <ActionLink href="/admin/referrals" label="Open Growth & Referrals" />
              <ActionLink href="/admin/financials/reconciliation" label="Open Reconciliation" />
              <ActionLink href="/admin/payouts" label="Open Payouts" />
              <ActionLink href="/admin/financials/general-ledger" label="Open Ledger" />
              <ActionLink href="/admin/financials/stripe" label="Open Stripe" />
              <ActionLink href="/admin/financials/plaid" label="Open Banking" />
              <ActionLink href="/admin/audit-trail" label="Open Audit Trail" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            ["Export History", historyLive ? "Live" : showingTemplates ? "Templates" : "Empty", historyMessage],
            ["Growth ROI", formatRoiPercent(growthFinancials.totals.overallRoiPercent), "Campaign revenue versus marketing and reward costs."],
            ["Marketing Costs", formatCurrency(growthFinancials.totals.marketingExpense), "Deductible marketing and campaign spend backup."],
            ["Reward Liability", formatCurrency(growthFinancials.totals.pendingRewardLiability), "Pending PawPerks / referral reward liability."],
            ["Issued Rewards", formatCurrency(growthFinancials.totals.issuedReferralRewards), "Reward expense and payout support."],
          ].map(([label, value, helper]) => (
            <div key={label} className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                {label}
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{helper}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Wiring & Readiness"
            title="Live Export Source Checks"
            description={`Period defaults use ${monthPeriod.label} for statement downloads, ${quarterPeriod.label} for quarterly packages, and ${yearPeriod.label} for annual tax support.`}
          />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {readinessItems.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.35rem] border border-slate-100 bg-[#fbfefd] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-black text-slate-950">{item.label}</p>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusClasses(
                      item.status,
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Export Packages"
            title="Generate CPA, Tax, Growth ROI, Management & Audit Packages"
            description="Each package is organized for a specific workflow. Save records into export history, open related report pages, or prepare download-ready packages by format."
          />

          {createMessage ? (
            <div className="mb-5 rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm font-bold leading-6 text-slate-700">{createMessage}</p>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {exportPackages.map((pkg) => {
              const key = `${pkg.packageType}-${pkg.exportFormat}`;

              return (
                <div
                  key={pkg.packageType}
                  className="flex min-h-[390px] flex-col justify-between rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm"
                >
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${toneClasses(
                        pkg.tone,
                      )}`}
                    >
                      {pkg.eyebrow}
                    </span>

                    <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
                      {pkg.title}
                    </h3>

                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                      {pkg.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600">
                        {pkg.periodLabel}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${statusClasses(normalizeStatus(pkg.exportStatus))}`}>
                        {normalizeStatus(pkg.exportStatus)}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-2">
                      {pkg.included.map((item) => (
                        <p key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                          ✓ {item}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <ActionLink href={pkg.href} label="Open package" primary />
                    <GenerateRecordButton
                      label={creatingKey === key ? "Saving..." : "Save record"}
                      disabled={creatingKey === key}
                      onClick={() =>
                        createExportRecord({
                          title: pkg.title,
                          packageType: pkg.packageType,
                          reportType: pkg.reportType,
                          periodLabel: pkg.periodLabel,
                          periodStart: pkg.periodStart,
                          periodEnd: pkg.periodEnd,
                          exportFormat: pkg.exportFormat,
                          exportStatus: pkg.exportStatus,
                          notes: pkg.description,
                          metadata: {
                            included: pkg.included,
                            growth_referrals_included: true,
                            tax_center_included: pkg.reportType === "tax",
                            cpa_handoff_included: pkg.reportType === "cpa",
                          },
                        })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <GrowthExportSupportPanel financials={growthFinancials} />

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Export Formats"
            title="Sample single-file downloads"
            description="These cards download one live sample file for the active period. Save a package record and use Prepare Package for the full linked statement set. Multi-file ZIP storage is next."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {formatCards.map((card) => (
              <Link
                key={card.fileType}
                href={card.href}
                className="group flex min-h-[220px] flex-col justify-between rounded-[1.5rem] border border-emerald-100 bg-[#fbfefd] p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white hover:shadow-lg"
              >
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${toneClasses(
                      card.tone,
                    )}`}
                  >
                    {card.fileType}
                  </span>

                  <h3 className="mt-4 text-xl font-black text-slate-950">{card.title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    {card.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-black text-emerald-800">
                    {card.exportFormat === "zip" ? "Open workspace" : "Download sample"}
                  </span>
                  <ArrowCircle />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="individual-reports" className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <SectionHeader
              eyebrow="Individual Reports"
              title="Statement and Support Report Shortcuts"
              description={`Open individual reports or download ${monthPeriod.label} exports where live routes exist. Stripe, Plaid, and payouts currently export CSV.`}
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {REPORTS.map((report) => (
                <div key={report.title} className="rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5 shadow-sm">
                  <h3 className="text-lg font-black text-slate-950">{report.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {report.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ActionLink href={report.openHref} label="Open" primary />
                    {report.csvHref ? <ActionLink href={report.csvHref} label="CSV" /> : null}
                    {report.excelHref ? <ActionLink href={report.excelHref} label="Excel" /> : null}
                    {report.wordHref ? <ActionLink href={report.wordHref} label="Word" /> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeader
                eyebrow="Export Checklist"
                title="Before you send files"
                description="Use this checklist before sending packages to CPA, bookkeeper, owner, lender, or tax preparer."
              />

              <div className="space-y-3">
                {exportChecklist.map((item, index) => (
                  <div key={item} className="flex gap-4 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-bold leading-6 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-700">
                Delivery Options
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Download, save, email, or notify
              </h2>

              <div className="mt-5 space-y-3">
                {deliveryOptions.map((item) => (
                  <Link key={item.title} href={item.href} className="block rounded-[1.25rem] border border-blue-100 bg-white p-4 transition hover:bg-blue-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{item.title}</p>
                        <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
                          {item.description}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusClasses(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section id="export-history" className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Recent Export Activity"
            title="Saved Export History"
            description={
              showingTemplates
                ? "No saved records yet. Starter templates open live workflows — use Save record on a package to create durable history entries."
                : "Recent CPA, tax, management, growth ROI, and audit packages saved from the export workflow."
            }
          />

          <div
            className={`mb-5 rounded-[1.25rem] border p-4 ${
              historyLive ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold leading-6 text-slate-700">{historyMessage}</p>
              <button
                type="button"
                onClick={loadHistory}
                disabled={historyLoading}
                className="rounded-full border border-emerald-100 bg-white px-4 py-2.5 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {historyLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {latestHistory.map((item) => (
              <Link key={item.id} href={item.href} className="group flex min-h-[230px] flex-col justify-between rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-lg">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusClasses(item.status)}`}>
                      {item.status}
                    </span>
                    {showingTemplates ? (
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                        Template
                      </span>
                    ) : null}
                  </div>

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
                      <p className="mt-1 text-sm font-black text-slate-700">{item.format}</p>
                    </div>
                    <ArrowCircle />
                  </div>

                  <p className="mt-3 text-[11px] font-bold text-slate-500">
                    {item.createdAt} · {item.createdBy}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <InvoicePreview />
          <PurchaseOrderPreview />
        </section>

        <section id="document-previews" className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Document Actions"
            title="Invoice and Purchase Order Print Previews"
            description="Preview layouts only — not connected to live invoice or vendor records yet. Print for layout review until invoice/PO data is wired."
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => printTarget("invoice")}
              className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
            >
              Print Invoice Preview
            </button>
            <button
              type="button"
              onClick={() => printTarget("purchase-order")}
              className="rounded-full border border-emerald-100 bg-white px-5 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
            >
              Print Purchase Order Preview
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
