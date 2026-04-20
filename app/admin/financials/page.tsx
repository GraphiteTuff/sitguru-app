import Link from "next/link";

export default function AdminFinancialsPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Admin / Financials
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Financials
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Central financial reporting hub for SitGuru. Use this section for
            balance sheet, profit and loss, cash flow, pro forma reporting,
            exports, and accounting integrations.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { label: "Profit & Loss", href: "/admin/financials/profit-loss" },
            { label: "Balance Sheet", href: "/admin/financials/balance-sheet" },
            { label: "Cash Flow", href: "/admin/financials/cash-flow" },
            { label: "Pro Forma", href: "/admin/financials/pro-forma" },
            { label: "Exports", href: "/admin/financials/exports" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-semibold">{item.label}</span>
                <span className="text-emerald-300">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}