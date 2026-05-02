 "use client";

import Link from "next/link";
import { useState } from "react";

type ReportCard = {
  title: string;
  description: string;
  openHref: string;
  csvHref?: string;
  excelHref?: string;
  wordHref?: string;
};

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

function ActionLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  if (primary) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:border-emerald-300/30 hover:bg-white/10"
    >
      {label}
    </Link>
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
          ? "inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
          : "inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:border-emerald-300/30 hover:bg-white/10"
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
              src="/sitguru-logo-dark.png"
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
            <TextField label="Company" defaultValue="SitGuru" />
            <TextField label="Email" defaultValue="support@sitguru.com" />
            <TextField label="Website" defaultValue="SitGuru.com" />
            <TextField label="Address" placeholder="Business address" />
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
          <p>SitGuru.com</p>
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
              src="/sitguru-logo-dark.png"
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
            <TextField label="Company" defaultValue="SitGuru" />
            <TextField label="Email" defaultValue="support@sitguru.com" />
            <TextField label="Website" defaultValue="SitGuru.com" />
            <TextField label="Address" placeholder="Business address" />
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
          <p>SitGuru.com</p>
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

  function printDocument(target: "invoice" | "purchase-order") {
    setActivePrintDoc(target);

    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => setActivePrintDoc(null), 500);
    }, 100);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_30%),radial-gradient(circle_at_right,_rgba(14,165,233,0.10),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <style>{`
        .document-sheet {
          width: 8.5in;
          min-height: 11in;
          margin: 0 auto;
          background: white;
          color: #0f172a;
          padding: 0.55in;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
        }

        .document-logo {
          width: 150px;
          max-height: 70px;
          object-fit: contain;
        }

        .document-title {
          font-size: 44px;
          line-height: 1;
          font-weight: 900;
          color: #0f172a;
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

      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-sky-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Admin / Financials / Exports
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Financial Exports.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Central export hub for SitGuru financial reports, printable
                documents, invoice generation, purchase orders, and
                accounting-ready download flows.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin/financials" label="Financials" />
              <ActionLink href="/admin/financials/profit-loss" label="P&L" />
              <ActionLink href="/admin/financials/balance-sheet" label="Balance Sheet" />
              <ActionLink href="/admin/financials/cash-flow" label="Cash Flow" primary />
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {REPORTS.map((report) => (
            <div
              key={report.title}
              className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Report Export
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                {report.title}
              </h2>
              <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-400">
                {report.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <ActionLink href={report.openHref} label="Open" primary />
                {report.csvHref ? (
                  <ActionLink href={report.csvHref} label="CSV" />
                ) : null}
                {report.excelHref ? (
                  <ActionLink href={report.excelHref} label="Excel" />
                ) : null}
                {report.wordHref ? (
                  <ActionLink href={report.wordHref} label="Word" />
                ) : null}
              </div>

              {!report.csvHref ? (
                <p className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3 text-xs leading-5 text-sky-100">
                  Open this report and use Ctrl + P to save as PDF. Dedicated
                  CSV / Excel routes can be added next.
                </p>
              ) : null}
            </div>
          ))}
        </section>

        <section className="grid gap-8 xl:grid-cols-2">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Invoice Generator
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Printable SitGuru invoice.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Fill in the invoice fields below, then print to a standard 8.5&quot;
              × 11&quot; document with the SitGuru logo.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <PrintButton
                label="Print Invoice"
                printTarget="invoice"
                onPrint={printDocument}
                primary
              />
              <ActionLink href="/admin/bookings" label="Open Bookings" />
              <ActionLink href="/admin/payments" label="Open Payments" />
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Purchase Order Generator
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Printable SitGuru purchase order.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Create a purchase order for vendors, software, marketing,
              professional services, supplies, or other business purchases.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <PrintButton
                label="Print Purchase Order"
                printTarget="purchase-order"
                onPrint={printDocument}
                primary
              />
              <ActionLink href="/admin/financials/profit-loss" label="Open P&L" />
              <ActionLink href="/admin/financials/balance-sheet" label="Balance Sheet" />
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Invoice Preview
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                  Fillable 8.5&quot; × 11&quot; invoice sheet.
                </h2>
              </div>

              <PrintButton
                label="Print Invoice"
                printTarget="invoice"
                onPrint={printDocument}
              />
            </div>

            <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/60 p-4">
              <InvoiceDocument active={activePrintDoc === "invoice"} />
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Purchase Order Preview
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                  Fillable 8.5&quot; × 11&quot; purchase order sheet.
                </h2>
              </div>

              <PrintButton
                label="Print Purchase Order"
                printTarget="purchase-order"
                onPrint={printDocument}
              />
            </div>

            <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/60 p-4">
              <PurchaseOrderDocument
                active={activePrintDoc === "purchase-order"}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
