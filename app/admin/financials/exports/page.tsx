"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ExportFormatValue = "pdf" | "xlsx" | "csv" | "zip" | "word";
type ExportStatusValue = "ready" | "processing" | "sent" | "needs_review" | "failed";
type Tone = "green" | "blue" | "amber" | "purple" | "rose" | "slate";

type ReportCard = {
  title: string;
  description: string;
  openHref: string;
  csvHref?: string;
  excelHref?: string;
  wordHref?: string;
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

const REPORTS: ReportCard[] = [
  {
    title: "Profit & Loss",
    description: "Revenue, growth marketing expenses, issued referral rewards, operating expenses, margins, and net income / loss.",
    openHref: "/admin/financials/profit-loss",
    csvHref: "/api/admin/financials/profit-loss/export?format=csv",
    excelHref: "/api/admin/financials/profit-loss/export?format=excel",
    wordHref: "/api/admin/financials/profit-loss/export?format=word",
  },
  {
    title: "Balance Sheet",
    description: "Assets, liabilities, equity, pending referral reward liabilities, and balance check at a specific point in time.",
    openHref: "/admin/financials/balance-sheet",
  },
  {
    title: "Cash Flow Statement",
    description: "Operating, investing, and financing cash movement including growth spend and issued reward cash outflows.",
    openHref: "/admin/financials/cash-flow",
  },
  {
    title: "Pro Forma Forecast",
    description: "Forward-looking revenue, growth acquisition costs, campaign ROI assumptions, cash, and break-even modeling.",
    openHref: "/admin/financials/pro-forma",
  },
  {
    title: "Commissions / Referral Rewards",
    description: "Referral rewards, ambassador payouts, partner commissions, Guru referral rewards, and payout eligibility review.",
    openHref: "/admin/financials/commissions",
  },
  {
    title: "Payout Analytics",
    description: "Guru payouts, partner payouts, PawPerks reward payouts, payout exceptions, and accounting-ready payout reporting.",
    openHref: "/admin/financials/payouts",
  },
  {
    title: "General Ledger",
    description: "Audit-ready transaction detail including growth marketing debits, reward expense, and reward payable entries.",
    openHref: "/admin/financials/general-ledger",
  },
  {
    title: "Reconciliation",
    description: "Reconcile Stripe, Plaid/NFCU, campaign costs, issued rewards, payouts, and bank activity.",
    openHref: "/admin/financials/reconciliation",
  },
  {
    title: "Tax Center",
    description: "Federal, quarterly, annual, state/local, city/county, deduction, 1099, and CPA tax package support.",
    openHref: "/admin/financials/tax-reports",
  },
];

const exportPackages: ExportPackage[] = [
  {
    eyebrow: "CPA Handoff",
    title: "Monthly CPA Package",
    description: "Monthly close package with statements, ledger detail, reconciliations, Stripe backup, payouts, commissions, growth/referral activity, expenses, and CPA notes.",
    href: "/admin/financials/exports?package=monthly-cpa",
    packageType: "monthly-cpa",
    reportType: "cpa",
    periodLabel: "Jun 1–Jun 30, 2026",
    periodStart: "2026-06-01",
    periodEnd: "2026-06-30",
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
    href: "/admin/financials/exports?package=quarterly-cpa",
    packageType: "quarterly-cpa",
    reportType: "cpa",
    periodLabel: "Jun 1–Jun 30, 2026",
    periodStart: "2026-06-01",
    periodEnd: "2026-06-30",
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
    href: "/admin/financials/exports?package=annual-tax",
    packageType: "annual-tax",
    reportType: "tax",
    periodLabel: "Jun 1–Dec 31, 2026",
    periodStart: "2026-06-01",
    periodEnd: "2026-12-31",
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
    href: "/admin/financials/exports?package=growth-referrals-roi",
    packageType: "growth-referrals-roi",
    reportType: "growth",
    periodLabel: "Growth / Referral Performance",
    periodStart: null,
    periodEnd: null,
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
    periodLabel: "Daily / Weekly Management Review",
    periodStart: null,
    periodEnd: null,
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
    periodLabel: "Custom / YTD Period",
    periodStart: null,
    periodEnd: null,
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
    title: "PDF Review Packet",
    description: "Clean PDF package for CPA, owner, lender, investor, tax, or management review.",
    fileType: "PDF",
    exportFormat: "pdf",
    href: "/admin/financials/exports?format=pdf",
    tone: "green",
  },
  {
    title: "Excel Workbook",
    description: "Multi-tab workbook with statements, schedules, ledgers, reconciliations, growth ROI, and tax notes.",
    fileType: "XLSX",
    exportFormat: "xlsx",
    href: "/admin/financials/exports?format=xlsx",
    tone: "blue",
  },
  {
    title: "CSV Package",
    description: "QuickBooks-style CSV files for transactions, ledgers, payouts, commissions, tax categories, and campaign activity.",
    fileType: "CSV",
    exportFormat: "csv",
    href: "/admin/financials/exports?format=csv",
    tone: "amber",
  },
  {
    title: "Full ZIP Archive",
    description: "Complete export package with PDF, Excel, CSV files, schedules, growth/referral backup, and supporting tax records.",
    fileType: "ZIP",
    exportFormat: "zip",
    href: "/admin/financials/exports?format=zip",
    tone: "purple",
  },
];

const fallbackExportHistory: ExportHistoryItem[] = [
  {
    id: "preview-june-2026-monthly-cpa",
    title: "June 2026 Monthly CPA Package",
    period: "Jun 1–Jun 30, 2026",
    format: "PDF / Excel / CSV / ZIP",
    status: "Needs Review",
    createdBy: "Admin User",
    createdAt: "Pending first close",
    href: "/admin/financials/cpa-handoff?period=2026-06",
  },
  {
    id: "preview-2026-growth-roi",
    title: "2026 Growth & Referral ROI Package",
    period: "Launch-to-date",
    format: "Excel / CSV / ZIP",
    status: "Ready",
    createdBy: "Admin User",
    createdAt: "Live when campaigns populate",
    href: "/admin/referrals",
  },
  {
    id: "preview-2026-annual-tax",
    title: "2026 Annual Tax Package",
    period: "Jun 1–Dec 31, 2026",
    format: "PDF / Excel / CSV / ZIP",
    status: "Processing",
    createdBy: "Admin User",
    createdAt: "Pending year-end",
    href: "/admin/financials/tax-reports?period=2026",
  },
];

const deliveryOptions: DeliveryOption[] = [
  {
    title: "Download to Device",
    description: "Download the selected report package directly as PDF, Excel, CSV, or ZIP.",
    status: "Ready",
    href: "/admin/financials/exports?delivery=download",
  },
  {
    title: "Save to Export History",
    description: "Store generated packages with period, format, creator, timestamp, and package status.",
    status: "Ready",
    href: "/admin/financials/exports?delivery=history",
  },
  {
    title: "Email to CPA",
    description: "Send selected export packages to your CPA, bookkeeper, or internal finance contact.",
    status: "Coming Soon",
    href: "/admin/financials/exports?delivery=email-cpa",
  },
  {
    title: "Text Management",
    description: "Text management when an export is ready, sent, reviewed, or needs corrections.",
    status: "Setup Needed",
    href: "/admin/financials/cpa-handoff#management-alerts",
  },
];

const exportChecklist = [
  "Choose report period: daily, weekly, monthly, quarterly, annual, YTD, launch-to-date, or custom.",
  "Select report package: CPA handoff, tax, management, growth/referral ROI, custom, or audit backup.",
  "Select export format: PDF, Excel workbook, CSV package, ZIP archive, Word document, or all formats.",
  "Review statements, reconciliations, payout schedules, commissions, reward liabilities, campaign costs, tax categories, and exceptions.",
  "Generate package and save to export history.",
  "Download or send the finalized package to CPA/bookkeeper after owner review.",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
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

function statusClasses(status: ExportHistoryItem["status"] | DeliveryOption["status"]) {
  const statuses = {
    Ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Processing: "border-blue-200 bg-blue-50 text-blue-800",
    Sent: "border-emerald-200 bg-emerald-50 text-emerald-800",
    "Needs Review": "border-amber-200 bg-amber-50 text-amber-800",
    Failed: "border-rose-200 bg-rose-50 text-rose-800",
    "Coming Soon": "border-blue-200 bg-blue-50 text-blue-800",
    "Setup Needed": "border-amber-200 bg-amber-50 text-amber-800",
  };

  return statuses[status];
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
          ["Growth ROI", totals.overallRoiPercent === null ? "Need cost data" : `${Math.round(totals.overallRoiPercent)}%`, "Revenue vs cost"],
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
            <ActionLink href="/admin/financials/exports?package=growth-referrals-roi&format=xlsx" label="Excel ROI Export" />
            <ActionLink href="/admin/financials/exports?package=growth-referrals-roi&format=csv" label="CSV Backup" />
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
          <p className="mt-2 text-2xl font-black text-slate-950">INV-2026-0001</p>
          <p className="mt-1 text-sm font-bold text-slate-600">Due on receipt</p>
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
          <p className="mt-2 text-2xl font-black text-slate-950">PO-2026-0001</p>
          <p className="mt-1 text-sm font-bold text-slate-600">Draft</p>
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
  const [history, setHistory] = useState<ExportHistoryItem[]>(fallbackExportHistory);
  const [historyMessage, setHistoryMessage] = useState("Loading export history...");
  const [historyLive, setHistoryLive] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [growthFinancials, setGrowthFinancials] = useState<GrowthReferralFinancialsResponse>(fallbackGrowthReferralFinancials);

  const hasLiveGrowthData = growthFinancials.isLive;
  const latestHistory = useMemo(() => history.slice(0, 6), [history]);

  async function loadHistory() {
    setHistoryLoading(true);

    try {
      const response = await fetch("/api/admin/financials/export-history", {
        cache: "no-store",
      });
      const json = (await response.json()) as ExportHistoryResponse;

      if (!response.ok || !json.ok) {
        setHistory(fallbackExportHistory);
        setHistoryLive(false);
        setHistoryMessage(json.message || "Unable to load live export history. Preview records are shown.");
        return;
      }

      setHistory(Array.isArray(json.history) && json.history.length ? json.history : fallbackExportHistory);
      setHistoryLive(Boolean(json.isLive));
      setHistoryMessage(
        json.isLive
          ? "Live export history connected."
          : json.message || "Preview export history is shown until saved export records exist.",
      );
    } catch (error) {
      setHistory(fallbackExportHistory);
      setHistoryLive(false);
      setHistoryMessage(
        error instanceof Error
          ? error.message
          : "Unable to load live export history. Preview records are shown.",
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
      } | null;

      if (!response.ok || !json?.ok) {
        setCreateMessage(
          json?.message ||
            "Export record could not be saved yet. You can still use the direct report links.",
        );
        return;
      }

      setCreateMessage("Export record saved to history.");
      await loadHistory();

      if (input.openAfterCreate && json.href) {
        window.location.href = json.href;
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
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            ["Export History", historyLive ? "Live" : "Preview", historyMessage],
            ["Growth ROI", growthFinancials.totals.overallRoiPercent === null ? "Need cost" : `${Math.round(growthFinancials.totals.overallRoiPercent)}%`, "Campaign revenue versus marketing and reward costs."],
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
            title="Choose PDF, Excel, CSV, Word, or ZIP"
            description="Use PDF for review, Excel for CPA analysis, CSV for accounting imports, Word for editable notes, and ZIP for full backup packages."
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
                  <span className="text-sm font-black text-emerald-800">Prepare format</span>
                  <ArrowCircle />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <SectionHeader
              eyebrow="Individual Reports"
              title="Statement and Support Report Shortcuts"
              description="Open individual reports or export common file formats directly where export routes are available."
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

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Recent Export Activity"
            title="Saved Export History"
            description="Recent CPA, tax, management, growth ROI, and audit packages saved from the export workflow."
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
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusClasses(item.status)}`}>
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

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Document Actions"
            title="Invoice and Purchase Order Print Support"
            description="Use these quick print previews for future invoice and purchase order support. They include SitGuru contact information and are ready to connect to live records later."
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
