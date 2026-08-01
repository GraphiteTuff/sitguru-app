import Link from "next/link";

type FinancialModuleComingSoonProps = {
  title: string;
  eyebrow?: string;
  description: string;
  relatedLinks?: Array<{ label: string; href: string }>;
};

export default function FinancialModuleComingSoon({
  title,
  eyebrow = "Financials Wiring",
  description,
  relatedLinks = [
    { label: "Financials Hub", href: "/admin/financials" },
    { label: "Profit & Loss", href: "/admin/financials/profit-loss" },
    { label: "Balance Sheet", href: "/admin/financials/balance-sheet" },
    { label: "Cash Flow", href: "/admin/financials/cash-flow" },
    { label: "General Ledger", href: "/admin/financials/general-ledger" },
  ],
}: FinancialModuleComingSoonProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_30%),linear-gradient(135deg,#ecfdf5_0%,#ffffff_55%,#f8fafc_100%)] p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-700 sm:text-base">
            {description}
          </p>
          <p className="mt-4 inline-flex rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-800">
            Coming next in the financials wiring pass
          </p>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">
            Use these live modules now
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
