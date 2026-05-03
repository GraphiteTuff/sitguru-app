"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  tone: "green" | "blue" | "amber" | "purple" | "rose" | "slate";
  included: string[];
};

type ExportFormatValue = "pdf" | "xlsx" | "csv" | "zip" | "word";
type ExportStatusValue =
  | "ready"
  | "processing"
  | "sent"
  | "needs_review"
  | "failed";

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

const REPORTS: ReportCard[] = [
  {
    title: "Profit & Loss",
    description:
      "Revenue, cost of revenue, expenses, margins, and net income / loss.",
    openHref: "/admin/financials/profit-loss",
    csvHref: "/api/admin/financials/profit-loss/export?format=csv",
    excelHref: "/api/admin/financials/profit-loss/export?format=excel",
    wordHref: "/api/admin/financials/profit-loss/export?format=word",
  },
  {
    title: "Balance Sheet",
    description:
      "Assets, liabilities, equity, and balance check at a specific point in time.",
    openHref: "/admin/financials/balance-sheet",
  },
  {
    title: "Cash Flow Statement",
    description:
      "Operating, investing, and financing cash movement for SitGuru.",
    openHref: "/admin/financials/cash-flow",
  },
  {
    title: "Pro Forma Forecast",
    description:
      "Forward-looking forecast assumptions, future revenue, expenses, cash, and breakeven.",
    openHref: "/admin/financials/pro-forma",
  },
  {
    title: "Commissions / Guru Payouts",
    description:
      "Guru payout queue, SitGuru commission earned, payout status, and payout health.",
    openHref: "/admin/commissions",
  },
  {
    title: "Payments",
    description:
      "Booking payments, payout operations, refund monitoring, and dispute workflow.",
    openHref: "/admin/payments",
  },
];

const exportPackages: ExportPackage[] = [
  {
    eyebrow: "CPA Handoff",
    title: "Monthly CPA Package",
    description:
      "Monthly close package with statements, ledger detail, reconciliations, Stripe backup, payouts, commissions, expenses, and CPA notes.",
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
      "Stripe Reconciliation",
      "Bank Reconciliation",
      "Guru Payouts",
      "Partner Commissions",
    ],
  },
  {
    eyebrow: "Quarterly Review",
    title: "Quarterly CPA Package",
    description:
      "Quarterly package for CPA review, tax estimates, business planning, investor/lender reporting, and management review.",
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
      "Quarterly Ledger",
      "Tax Category Summary",
      "Deductible Expenses",
      "1099 Support",
      "Stripe Activity",
      "Payout Review",
      "Commission Review",
    ],
  },
  {
    eyebrow: "Tax Prep",
    title: "Annual Tax Package",
    description:
      "Year-end tax package for CPA preparation, deductible expenses, 1099 support, tax categories, audit backup, and reconciliation support.",
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
      "Tax Summary",
      "Deduction Detail",
      "1099 Review",
      "General Ledger",
      "Vendor Expenses",
      "Stripe Fees",
      "Audit Backup Index",
    ],
  },
  {
    eyebrow: "Management",
    title: "Daily / Weekly Reports",
    description:
      "Operational finance packages for daily and weekly owner review, exceptions, cash movement, bookings, payouts, commissions, and Stripe activity.",
    href: "/admin/financials/exports?package=management",
    packageType: "management",
    reportType: "financial",
    periodLabel: "Daily / Weekly Management Review",
    periodStart: null,
    periodEnd: null,
    exportFormat: "zip",
    exportStatus: "ready",
    tone: "purple",
    included: [
      "Daily Snapshot",
      "Weekly Summary",
      "Booking Activity",
      "Payment Activity",
      "Payout Watch",
      "Commission Watch",
      "Exceptions",
      "Management Notes",
    ],
  },
  {
    eyebrow: "Custom",
    title: "Custom / YTD Package",
    description:
      "Custom date range report package for CPA questions, investor reporting, lender requests, audit support, owner review, or tax planning.",
    href: "/admin/financials/exports?package=custom",
    packageType: "custom-ytd",
    reportType: "financial",
    periodLabel: "Custom / YTD Period",
    periodStart: null,
    periodEnd: null,
    exportFormat: "zip",
    exportStatus: "needs_review",
    tone: "slate",
    included: [
      "Selected Date Range",
      "Selected Statements",
      "Selected Schedules",
      "Reconciliations",
      "Tax Categories",
      "Audit Detail",
      "Exceptions",
      "Notes",
    ],
  },
  {
    eyebrow: "Audit",
    title: "Audit Backup Package",
    description:
      "Detailed backup package with transaction support, reconciliation schedules, payout support, vendor detail, tax support, and notes.",
    href: "/admin/financials/exports?package=audit",
    packageType: "audit-backup",
    reportType: "audit",
    periodLabel: "Audit Backup Package",
    periodStart: null,
    periodEnd: null,
    exportFormat: "zip",
    exportStatus: "needs_review",
    tone: "rose",
    included: [
      "Transaction Detail",
      "General Ledger",
      "Receipt Index",
      "Stripe Backup",
      "Bank Matching",
      "Vendor Support",
      "Payout Support",
      "CPA Questions Log",
    ],
  },
];

const formatCards: FormatCard[] = [
  {
    title: "PDF Review Packet",
    description:
      "Clean PDF package for CPA, owner, lender, investor, or management review.",
    fileType: "PDF",
    exportFormat: "pdf",
    href: "/admin/financials/exports?format=pdf",
    tone: "green",
  },
  {
    title: "Excel Workbook",
    description:
      "Multi-tab workbook with statements, schedules, ledgers, reconciliations, and notes.",
    fileType: "XLSX",
    exportFormat: "xlsx",
    href: "/admin/financials/exports?format=xlsx",
    tone: "blue",
  },
  {
    title: "CSV Package",
    description:
      "QuickBooks-style CSV files for transactions, ledgers, aging, payouts, commissions, and tax categories.",
    fileType: "CSV",
    exportFormat: "csv",
    href: "/admin/financials/exports?format=csv",
    tone: "amber",
  },
  {
    title: "Full ZIP Archive",
    description:
      "Complete export package with PDF, Excel, CSV files, schedules, and supporting backup.",
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
    id: "preview-q2-2026-partial-quarter",
    title: "Q2 2026 Partial Quarter Package",
    period: "Jun 1–Jun 30, 2026",
    format: "PDF / Excel / CSV / ZIP",
    status: "Processing",
    createdBy: "Admin User",
    createdAt: "Pending launch",
    href: "/admin/financials/cpa-handoff?period=2026-q2",
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
    description:
      "Download the selected report package directly as PDF, Excel, CSV, or ZIP.",
    status: "Ready",
    href: "/admin/financials/exports?delivery=download",
  },
  {
    title: "Save to Export History",
    description:
      "Store generated packages with period, format, creator, timestamp, and package status.",
    status: "Ready",
    href: "/admin/financials/exports?delivery=history",
  },
  {
    title: "Email to CPA",
    description:
      "Send selected export packages to your CPA, bookkeeper, or internal finance contact.",
    status: "Coming Soon",
    href: "/admin/financials/exports?delivery=email-cpa",
  },
  {
    title: "Text Management",
    description:
      "Text management when an export is ready, sent, reviewed, or needs corrections.",
    status: "Setup Needed",
    href: "/admin/financials/cpa-handoff#management-alerts",
  },
];

const exportChecklist = [
  "Choose report period: daily, weekly, monthly, quarterly, annual, YTD, launch-to-date, or custom.",
  "Select report package: CPA handoff, tax, management, custom, or audit backup.",
  "Select export format: PDF, Excel workbook, CSV package, ZIP archive, or all formats.",
  "Review statements, reconciliations, payout schedules, commissions, tax categories, and exceptions.",
  "Generate package and save to export history.",
  "Download or send the finalized package to CPA/bookkeeper after owner review.",
];

function toneClasses(tone: ExportPackage["tone"] | FormatCard["tone"]) {
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
  status: ExportHistoryItem["status"] | DeliveryOption["status"],
) {
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

function PrintButton({
  label,
  printTarget,
  onPrint,
  primary = false,
}: {
  label: string;
  printTarget: "invoice" | "purchase-order";
  onPrint: (target: "invoice" | "purchase-order") => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onPrint(printTarget)}
      className={
        primary
          ? "inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
          : "inline-flex items-center justify-center rounded-full border border-emerald-100 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
      }
    >
      {label}
    </button>
  );
}

function TextField({
  label,
  defaultValue = "",
  placeholder = "",
  className = "",
}: {
  label: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="document-label">{label}</span>
      <input
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="document-input"
      />
    </label>
  );
}

function MoneyField({
  label,
  defaultValue = "",
}: {
  label: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="document-label">{label}</span>
      <input defaultValue={defaultValue} className="document-input text-right" />
    </label>
  );
}

function ExportHistoryCard({ item }: { item: ExportHistoryItem }) {
  return (
    <Link
      href={item.href}
      className="group block rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-lg"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${statusClasses(
              item.status,
            )}`}
          >
            {item.status}
          </span>

          <h3 className="mt-3 text-lg font-black leading-tight text-slate-950">
            {item.title}
          </h3>

          <p className="mt-1 text-xs font-bold text-slate-500">
            Created by {item.createdBy}
          </p>
        </div>

        <ArrowCircle />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Period
          </p>
          <p className="mt-1 text-sm font-black text-slate-700">
            {item.period}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Format
          </p>
          <p className="mt-1 text-sm font-black text-slate-700">
            {item.format}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Created
          </p>
          <p className="mt-1 text-sm font-black text-slate-700">
            {item.createdAt}
          </p>
        </div>
      </div>
    </Link>
  );
}

function InvoiceDocument({ active }: { active: boolean }) {
  return (
    <section
      className={`printable-doc ${active ? "active-print-doc" : ""}`}
      data-print-doc="invoice"
    >
      <div className="document-sheet">
        <div className="document-header">
          <div>
            <img
              src={SITGURU_LOGO_SRC}
              alt="SitGuru"
              className="document-logo"
            />
            <p className="document-muted mt-3">
              Trusted Pet Care. Simplified.
            </p>
          </div>

          <div className="text-right">
            <h2 className="document-title">Invoice</h2>
            <TextField label="Invoice #" defaultValue="SG-INV-0001" />
            <TextField label="Date" defaultValue="April 24, 2026" />
            <TextField label="Due Date" defaultValue="Upon receipt" />
          </div>
        </div>

        <div className="document-grid mt-8">
          <div className="document-box">
            <h3 className="document-section-title">Bill From</h3>
            <TextField label="Company" defaultValue={SITGURU_COMPANY} />
            <TextField label="Email" defaultValue={SITGURU_EMAIL} />
            <TextField label="Phone" defaultValue={SITGURU_PHONE} />
            <TextField label="Website" defaultValue={SITGURU_WEBSITE} />
            <TextField label="Address" defaultValue={SITGURU_ADDRESS} />
          </div>

          <div className="document-box">
            <h3 className="document-section-title">Bill To</h3>
            <TextField label="Customer / Company" placeholder="Customer name" />
            <TextField label="Email" placeholder="Customer email" />
            <TextField label="Phone" placeholder="Customer phone" />
            <TextField label="Address" placeholder="Customer address" />
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-300">
          <table className="document-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {[
                "Pet care booking / service fee",
                "SitGuru platform fee",
                "Additional service / adjustment",
                "Discount / credit",
              ].map((item) => (
                <tr key={item}>
                  <td>
                    <input defaultValue={item} className="document-cell-input" />
                  </td>
                  <td>
                    <input defaultValue="1" className="document-cell-input" />
                  </td>
                  <td>
                    <input defaultValue="$0.00" className="document-cell-input" />
                  </td>
                  <td>
                    <input
                      defaultValue="$0.00"
                      className="document-cell-input text-right"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[1fr_280px]">
          <div className="document-box">
            <h3 className="document-section-title">Notes / Terms</h3>
            <textarea
              defaultValue="Thank you for using SitGuru. Please remit payment according to the terms listed above."
              className="document-textarea"
            />
          </div>

          <div className="document-box space-y-3">
            <MoneyField label="Subtotal" defaultValue="$0.00" />
            <MoneyField label="Tax" defaultValue="$0.00" />
            <MoneyField label="Discount / Credit" defaultValue="$0.00" />
            <MoneyField label="Total Due" defaultValue="$0.00" />
          </div>
        </div>

        <div className="document-footer">
          <p>
            {SITGURU_WEBSITE} • {SITGURU_PHONE}
          </p>
          <p>Generated from SitGuru Admin Financial Exports</p>
        </div>
      </div>
    </section>
  );
}

function PurchaseOrderDocument({ active }: { active: boolean }) {
  return (
    <section
      className={`printable-doc ${active ? "active-print-doc" : ""}`}
      data-print-doc="purchase-order"
    >
      <div className="document-sheet">
        <div className="document-header">
          <div>
            <img
              src={SITGURU_LOGO_SRC}
              alt="SitGuru"
              className="document-logo"
            />
            <p className="document-muted mt-3">
              Trusted Pet Care. Simplified.
            </p>
          </div>

          <div className="text-right">
            <h2 className="document-title">Purchase Order</h2>
            <TextField label="PO #" defaultValue="SG-PO-0001" />
            <TextField label="Date" defaultValue="April 24, 2026" />
            <TextField label="Requested By" placeholder="Admin name" />
          </div>
        </div>

        <div className="document-grid mt-8">
          <div className="document-box">
            <h3 className="document-section-title">Buyer</h3>
            <TextField label="Company" defaultValue={SITGURU_COMPANY} />
            <TextField label="Email" defaultValue={SITGURU_EMAIL} />
            <TextField label="Phone" defaultValue={SITGURU_PHONE} />
            <TextField label="Website" defaultValue={SITGURU_WEBSITE} />
            <TextField label="Address" defaultValue={SITGURU_ADDRESS} />
          </div>

          <div className="document-box">
            <h3 className="document-section-title">Vendor / Supplier</h3>
            <TextField label="Vendor Name" placeholder="Vendor name" />
            <TextField label="Email" placeholder="Vendor email" />
            <TextField label="Phone" placeholder="Vendor phone" />
            <TextField label="Address" placeholder="Vendor address" />
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-300">
          <table className="document-table">
            <thead>
              <tr>
                <th>Item / Service</th>
                <th>Qty</th>
                <th>Unit Cost</th>
                <th className="text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {[
                "Software / subscription",
                "Marketing / advertising",
                "Professional service",
                "Supplies / operations",
                "Other",
              ].map((item) => (
                <tr key={item}>
                  <td>
                    <input defaultValue={item} className="document-cell-input" />
                  </td>
                  <td>
                    <input defaultValue="1" className="document-cell-input" />
                  </td>
                  <td>
                    <input defaultValue="$0.00" className="document-cell-input" />
                  </td>
                  <td>
                    <input
                      defaultValue="$0.00"
                      className="document-cell-input text-right"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[1fr_280px]">
          <div className="document-box">
            <h3 className="document-section-title">Approval / Notes</h3>
            <textarea
              defaultValue="Purchase is authorized for SitGuru business operations, subject to vendor confirmation and final invoice."
              className="document-textarea"
            />
          </div>

          <div className="document-box space-y-3">
            <MoneyField label="Subtotal" defaultValue="$0.00" />
            <MoneyField label="Tax / Fees" defaultValue="$0.00" />
            <MoneyField label="Shipping" defaultValue="$0.00" />
            <MoneyField label="PO Total" defaultValue="$0.00" />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <TextField label="Approved By" placeholder="Name / title" />
          <TextField label="Approval Date" placeholder="Date" />
        </div>

        <div className="document-footer">
          <p>
            {SITGURU_WEBSITE} • {SITGURU_PHONE}
          </p>
          <p>Generated from SitGuru Admin Financial Exports</p>
        </div>
      </div>
    </section>
  );
}

export default function AdminFinancialExportsPage() {
  const [activePrintDoc, setActivePrintDoc] = useState<
    "invoice" | "purchase-order" | null
  >(null);
  const [exportHistory, setExportHistory] =
    useState<ExportHistoryItem[]>(fallbackExportHistory);
  const [isLiveHistory, setIsLiveHistory] = useState(false);
  const [historyMessage, setHistoryMessage] = useState(
    "Loading export history...",
  );
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [actionMessage, setActionMessage] = useState(
    "Select any package or format below to create an export history record.",
  );
  const [actionTone, setActionTone] = useState<"green" | "amber" | "rose">(
    "green",
  );

  async function loadExportHistory() {
    setHistoryLoading(true);

    try {
      const response = await fetch("/api/admin/financials/export-history", {
        cache: "no-store",
      });

      const json = (await response.json()) as ExportHistoryResponse;

      if (!response.ok || !json.ok) {
        setExportHistory(fallbackExportHistory);
        setIsLiveHistory(false);
        setHistoryMessage(
          json.message || "Unable to load live export history.",
        );
        return;
      }

      setExportHistory(
        Array.isArray(json.history) && json.history.length > 0
          ? json.history
          : fallbackExportHistory,
      );
      setIsLiveHistory(Boolean(json.isLive));
      setHistoryMessage(
        json.isLive
          ? "Live Supabase export history is connected."
          : json.message || "Showing preview history until live records exist.",
      );
    } catch (error) {
      setExportHistory(fallbackExportHistory);
      setIsLiveHistory(false);
      setHistoryMessage(
        error instanceof Error
          ? error.message
          : "Unable to load export history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  async function createExportRecord(input: CreateExportRecordInput) {
    setIsCreatingRecord(true);
    setActionTone("amber");
    setActionMessage(`Creating export record for ${input.title}...`);

    try {
      const response = await fetch("/api/admin/financials/export-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          title: input.title,
          packageType: input.packageType,
          reportType: input.reportType,
          periodLabel: input.periodLabel,
          periodStart: input.periodStart || null,
          periodEnd: input.periodEnd || null,
          exportFormat: input.exportFormat,
          exportStatus: input.exportStatus,
          createdBy: "Admin User",
          sentToEmail: null,
          sentToPhone: null,
          fileUrl: null,
          storagePath: null,
          notes: input.notes || null,
          metadata: {
            source: "admin_financial_export_center",
            createdFrom: "app/admin/financials/exports/page.tsx",
            ...input.metadata,
          },
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !json.ok) {
        setActionTone("rose");
        setActionMessage(json.message || "Unable to create export record.");
        return false;
      }

      setActionTone("green");
      setActionMessage(`${input.title} was added to export history.`);
      await loadExportHistory();
      return true;
    } catch (error) {
      setActionTone("rose");
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unable to create export record.",
      );
      return false;
    } finally {
      setIsCreatingRecord(false);
    }
  }

  async function createPackageRecord(item: ExportPackage) {
    await createExportRecord({
      title: item.title,
      packageType: item.packageType,
      reportType: item.reportType,
      periodLabel: item.periodLabel,
      periodStart: item.periodStart || null,
      periodEnd: item.periodEnd || null,
      exportFormat: item.exportFormat,
      exportStatus: item.exportStatus,
      notes: `${item.title} generated from the SitGuru Financial Export Center.`,
      metadata: {
        included: item.included,
        packageHref: item.href,
        packageEyebrow: item.eyebrow,
      },
    });
  }

  async function createFormatRecord(item: FormatCard) {
    await createExportRecord({
      title: `${item.title} Export`,
      packageType: "format-export",
      reportType: "financial",
      periodLabel: "Export Format Request",
      periodStart: null,
      periodEnd: null,
      exportFormat: item.exportFormat,
      exportStatus: "ready",
      notes: `${item.title} format record generated from the SitGuru Financial Export Center.`,
      metadata: {
        formatHref: item.href,
        fileType: item.fileType,
      },
    });
  }

  async function createReportRecord(report: ReportCard, format: ExportFormatValue) {
    await createExportRecord({
      title: `${report.title} ${format.toUpperCase()} Export`,
      packageType: "statement-export",
      reportType: "financial",
      periodLabel: "Statement / Operations Export",
      periodStart: null,
      periodEnd: null,
      exportFormat: format,
      exportStatus: "ready",
      notes: `${report.title} ${format.toUpperCase()} export record generated from the Statement & Operations Export Links section.`,
      metadata: {
        reportTitle: report.title,
        openHref: report.openHref,
      },
    });
  }

  async function printDocument(target: "invoice" | "purchase-order") {
    const isInvoice = target === "invoice";

    await createExportRecord({
      title: isInvoice
        ? "SitGuru Invoice SG-INV-0001"
        : "SitGuru Purchase Order SG-PO-0001",
      packageType: isInvoice ? "invoice" : "purchase-order",
      reportType: isInvoice ? "invoice" : "purchase-order",
      periodLabel: isInvoice ? "Invoice Document" : "Purchase Order Document",
      periodStart: null,
      periodEnd: null,
      exportFormat: "pdf",
      exportStatus: "ready",
      notes: isInvoice
        ? "Printable SitGuru invoice generated from the Financial Export Center."
        : "Printable SitGuru purchase order generated from the Financial Export Center.",
      metadata: {
        documentNumber: isInvoice ? "SG-INV-0001" : "SG-PO-0001",
        billingEmail: SITGURU_EMAIL,
        phone: SITGURU_PHONE,
      },
    });

    setActivePrintDoc(target);

    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => setActivePrintDoc(null), 500);
    }, 100);
  }

  useEffect(() => {
    loadExportHistory();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <style>{`
        .document-sheet {
          width: 8.5in;
          min-height: 11in;
          margin: 0 auto;
          background: white;
          color: #0f172a;
          padding: 0.55in;
          box-shadow: 0 24px 80px rgba(15, 23, 42, 0.18);
        }

        .document-logo {
          width: 170px;
          max-height: 80px;
          object-fit: contain;
        }

        .document-title {
          font-size: 44px;
          line-height: 1;
          font-weight: 900;
          color: #1f352d;
          letter-spacing: -0.04em;
        }

        .document-header {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 32px;
          align-items: start;
          border-bottom: 3px solid #10b981;
          padding-bottom: 24px;
        }

        .document-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .document-box {
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 16px;
          background: #f8fafc;
        }

        .document-section-title {
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #047857;
          margin-bottom: 12px;
        }

        .document-muted {
          color: #475569;
          font-size: 13px;
        }

        .document-label {
          display: block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 4px;
          margin-top: 8px;
        }

        .document-input,
        .document-cell-input,
        .document-textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          background: white;
          color: #0f172a;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 13px;
          font-weight: 600;
          outline: none;
        }

        .document-textarea {
          min-height: 120px;
          resize: vertical;
          font-weight: 500;
          line-height: 1.5;
        }

        .document-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        .document-table th {
          background: #0f172a;
          color: white;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 12px;
          text-align: left;
        }

        .document-table td {
          border-top: 1px solid #cbd5e1;
          padding: 8px;
        }

        .document-footer {
          margin-top: 40px;
          padding-top: 16px;
          border-top: 1px solid #cbd5e1;
          display: flex;
          justify-content: space-between;
          color: #64748b;
          font-size: 11px;
        }

        @media print {
          @page {
            size: letter;
            margin: 0;
          }

          html,
          body {
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .active-print-doc,
          .active-print-doc * {
            visibility: visible !important;
          }

          .active-print-doc {
            position: absolute !important;
            inset: 0 !important;
            display: block !important;
            background: white !important;
          }

          .document-sheet {
            width: 8.5in !important;
            min-height: 11in !important;
            margin: 0 !important;
            box-shadow: none !important;
            padding: 0.5in !important;
          }

          .document-input,
          .document-cell-input,
          .document-textarea {
            border: none !important;
            background: transparent !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1500px] space-y-6">
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
                  PDF / Excel / CSV / ZIP
                </span>
              </div>

              <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Central export hub for CPA handoffs, tax reports, daily reports,
                weekly reports, monthly close packages, quarterly reviews, annual
                tax packages, audit backup, invoice generation, purchase orders,
                and owner financial records.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[560px]">
              <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Export Formats
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">4</p>
              </div>

              <div className="rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                  Package Types
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {exportPackages.length}
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Export History
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {exportHistory.length}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`mt-6 rounded-[1.5rem] border p-4 ${
              actionTone === "green"
                ? "border-emerald-100 bg-emerald-50"
                : actionTone === "amber"
                  ? "border-amber-100 bg-amber-50"
                  : "border-rose-100 bg-rose-50"
            }`}
          >
            <p
              className={`text-xs font-black uppercase tracking-[0.18em] ${
                actionTone === "green"
                  ? "text-emerald-700"
                  : actionTone === "amber"
                    ? "text-amber-700"
                    : "text-rose-700"
              }`}
            >
              Export Action
            </p>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
              {actionMessage}
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Package Builder"
            title="Choose Export Package"
            description="Select the package type that matches the report purpose. This keeps daily, weekly, monthly, quarterly, annual, tax, CPA, and audit exports organized."
          />

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {exportPackages.map((item) => (
              <div
                key={item.title}
                className="flex min-h-[390px] flex-col justify-between rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
              >
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${toneClasses(
                      item.tone,
                    )}`}
                  >
                    {item.eyebrow}
                  </span>

                  <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    {item.description}
                  </p>

                  <div className="mt-5 grid gap-2">
                    {item.included.map((included) => (
                      <p
                        key={included}
                        className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"
                      >
                        ✓ {included}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <ActionLink href={item.href} label="Open package" primary />
                  <GenerateRecordButton
                    label="Generate record"
                    disabled={isCreatingRecord}
                    onClick={() => {
                      void createPackageRecord(item);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <SectionHeader
              eyebrow="Export Format"
              title="Choose File Format"
              description="Prepare files in the format your CPA, bookkeeper, accounting software, banker, investor, or management team needs."
            />

            <div className="grid gap-4 md:grid-cols-2">
              {formatCards.map((format) => (
                <div
                  key={format.title}
                  className="flex min-h-[240px] flex-col justify-between rounded-[1.5rem] border border-emerald-100 bg-[#fbfefd] p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white hover:shadow-lg"
                >
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${toneClasses(
                        format.tone,
                      )}`}
                    >
                      {format.fileType}
                    </span>

                    <h3 className="mt-4 text-xl font-black tracking-tight text-slate-950">
                      {format.title}
                    </h3>

                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {format.description}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    <ActionLink href={format.href} label="Prepare format" />
                    <GenerateRecordButton
                      label="Generate record"
                      disabled={isCreatingRecord}
                      onClick={() => {
                        void createFormatRecord(format);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
              Export Workflow
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Prepare before sending
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Use this checklist before sending any package to a CPA, bookkeeper,
              investor, lender, or internal manager.
            </p>

            <div className="mt-5 space-y-3">
              {exportChecklist.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold leading-6 text-slate-700">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionHeader
            eyebrow="Existing Report Exports"
            title="Statement & Operations Export Links"
            description="These preserve the existing report export links and open actions already built into this page."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {REPORTS.map((report) => (
              <div
                key={report.title}
                className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm"
              >
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-800">
                  Report Export
                </span>

                <h3 className="mt-4 text-xl font-black tracking-tight text-slate-950">
                  {report.title}
                </h3>

                <p className="mt-2 min-h-[72px] text-sm font-semibold leading-6 text-slate-600">
                  {report.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <ActionLink href={report.openHref} label="Open" primary />

                  {report.csvHref ? (
                    <>
                      <ActionLink href={report.csvHref} label="CSV" />
                      <GenerateRecordButton
                        label="Log CSV"
                        disabled={isCreatingRecord}
                        onClick={() => {
                          void createReportRecord(report, "csv");
                        }}
                      />
                    </>
                  ) : null}

                  {report.excelHref ? (
                    <>
                      <ActionLink href={report.excelHref} label="Excel" />
                      <GenerateRecordButton
                        label="Log Excel"
                        disabled={isCreatingRecord}
                        onClick={() => {
                          void createReportRecord(report, "xlsx");
                        }}
                      />
                    </>
                  ) : null}

                  {report.wordHref ? (
                    <>
                      <ActionLink href={report.wordHref} label="Word" />
                      <GenerateRecordButton
                        label="Log Word"
                        disabled={isCreatingRecord}
                        onClick={() => {
                          void createReportRecord(report, "word");
                        }}
                      />
                    </>
                  ) : null}
                </div>

                {!report.csvHref ? (
                  <p className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs font-bold leading-5 text-blue-800">
                    Open this report and use Ctrl + P to save as PDF. Dedicated
                    CSV / Excel routes can be added next.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                  Export History
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  Saved Report Packages
                </h2>
                <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                  Track generated packages, review status, period covered,
                  format, creator, and handoff status. This section loads from
                  the live financial export history API.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
                    isLiveHistory
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  {isLiveHistory ? "Live Supabase" : "Preview Fallback"}
                </span>

                <button
                  type="button"
                  onClick={loadExportHistory}
                  disabled={historyLoading}
                  className="rounded-full border border-emerald-100 bg-white px-4 py-2.5 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {historyLoading ? "Refreshing..." : "Refresh History"}
                </button>
              </div>
            </div>

            <div
              className={`mb-4 rounded-[1.25rem] border p-4 ${
                isLiveHistory
                  ? "border-emerald-100 bg-emerald-50"
                  : "border-amber-100 bg-amber-50"
              }`}
            >
              <p
                className={`text-xs font-black uppercase tracking-[0.18em] ${
                  isLiveHistory ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                Connection Status
              </p>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
                {historyMessage}
              </p>
            </div>

            <div className="space-y-3">
              {exportHistory.map((item) => (
                <ExportHistoryCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Delivery
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Delivery Options
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Choose what happens after an export package is prepared.
              </p>

              <div className="mt-5 space-y-3">
                {deliveryOptions.map((option) => (
                  <Link
                    key={option.title}
                    href={option.href}
                    className="group block rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4 transition hover:bg-white hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusClasses(
                            option.status,
                          )}`}
                        >
                          {option.status}
                        </span>

                        <h3 className="mt-3 text-base font-black text-slate-950">
                          {option.title}
                        </h3>

                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                          {option.description}
                        </p>
                      </div>

                      <ArrowCircle />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-700">
                Integration Note
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Live history is connected
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                Export history is now read from the financial export history API.
                Package, format, invoice, purchase order, and report export
                actions now write new records into Supabase automatically.
              </p>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-emerald-800 p-5 text-white shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-100">
                Owner Control
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Review before sending
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-emerald-50">
                All CPA and tax packages should be reviewed before they are sent
                externally. This prevents wrong categories, missing
                reconciliations, or incomplete payout schedules from being sent.
              </p>

              <Link
                href="/admin/financials/cpa-handoff"
                className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
              >
                Open CPA Handoff →
              </Link>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <SectionHeader
              eyebrow="Invoice Generator"
              title="Printable SitGuru Invoice"
              description="Fill in the invoice fields below, then print to a standard 8.5 × 11 document with the SitGuru logo."
            />

            <div className="flex flex-wrap gap-3">
              <PrintButton
                label="Print Invoice"
                printTarget="invoice"
                onPrint={(target) => {
                  void printDocument(target);
                }}
                primary
              />
              <ActionLink href="/admin/bookings" label="Open Bookings" />
              <ActionLink href="/admin/payments" label="Open Payments" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <SectionHeader
              eyebrow="Purchase Order Generator"
              title="Printable SitGuru Purchase Order"
              description="Create a purchase order for vendors, software, marketing, professional services, supplies, or other business purchases."
            />

            <div className="flex flex-wrap gap-3">
              <PrintButton
                label="Print Purchase Order"
                printTarget="purchase-order"
                onPrint={(target) => {
                  void printDocument(target);
                }}
                primary
              />
              <ActionLink href="/admin/financials/profit-loss" label="Open P&L" />
              <ActionLink
                href="/admin/financials/balance-sheet"
                label="Balance Sheet"
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                eyebrow="Invoice Preview"
                title="Fillable 8.5 × 11 Invoice Sheet"
                description="Preview and edit the printable invoice before sending, saving as PDF, or printing."
              />

              <PrintButton
                label="Print Invoice"
                printTarget="invoice"
                onPrint={(target) => {
                  void printDocument(target);
                }}
              />
            </div>

            <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <InvoiceDocument active={activePrintDoc === "invoice"} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                eyebrow="Purchase Order Preview"
                title="Fillable 8.5 × 11 Purchase Order Sheet"
                description="Preview and edit the printable purchase order before sending, saving as PDF, or printing."
              />

              <PrintButton
                label="Print Purchase Order"
                printTarget="purchase-order"
                onPrint={(target) => {
                  void printDocument(target);
                }}
              />
            </div>

            <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <PurchaseOrderDocument
                active={activePrintDoc === "purchase-order"}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}