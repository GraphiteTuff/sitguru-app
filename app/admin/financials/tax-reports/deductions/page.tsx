import { Receipt, Wallet } from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import { TaxDeskDenied, TaxDeskShell } from "@/components/admin/financials/TaxDeskShell";
import { GrowthCard } from "@/components/admin/growth/GrowthPageFrame";
import { getFinanceAdminIdentity } from "@/lib/admin/financials/access";
import { loadTaxCenterBundle, taxMoney } from "@/lib/admin/financials/tax-center";

export const dynamic = "force-dynamic";

function when(value: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function TaxDeductionsPage() {
  const actor = await getFinanceAdminIdentity();
  if (!actor) return <TaxDeskDenied />;

  const bundle = await loadTaxCenterBundle();

  return (
    <TaxDeskShell
      kicker="Tax Center / Deductions"
      title="Deductible expense detail from SitGuru books."
      detail="expense_ledger and Growth campaign costs. Your CPA confirms what is deductible."
      actorEmail={actor.email}
      exportHref="/api/admin/financials/tax-reports/export?format=csv&section=deductions"
    >
      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        <AdminThemeCard
          label="Expense support"
          value={taxMoney(bundle.totals.expenseTotal)}
          helper={`${bundle.totals.expenseCount.toLocaleString()} rows`}
          tone="emerald"
          icon={<Wallet size={18} />}
        />
        <AdminThemeCard
          label="Categories"
          value={bundle.deductionCategories.length.toLocaleString()}
          helper="Software, marketing, insurance, ops"
          tone="sky"
          icon={<Receipt size={18} />}
        />
        <AdminThemeCard
          label="Issued rewards"
          value={taxMoney(bundle.totals.issuedRewards)}
          helper="Possible expense once paid"
          tone="amber"
        />
        <AdminThemeCard
          label="Pending rewards"
          value={taxMoney(bundle.totals.pendingRewards)}
          helper="Liability, not a deduction yet"
          tone="violet"
        />
      </section>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">By category</h2>
        <div className="mt-4 grid min-w-0 gap-2">
          {bundle.deductionCategories.length ? (
            bundle.deductionCategories.map((row) => (
              <div
                key={row.category}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-black text-slate-950">{row.category}</p>
                  <p className="text-xs font-semibold text-slate-500">
                    {row.count.toLocaleString()} row{row.count === 1 ? "" : "s"}
                  </p>
                </div>
                <p className="text-lg font-black text-slate-950">{taxMoney(row.amount)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm font-semibold text-slate-600">
              No expense_ledger or growth marketing rows yet. Add costs on Profit & Loss.
            </p>
          )}
        </div>
      </GrowthCard>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Line detail</h2>
        {bundle.expenseItems.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["When", "Name", "Category", "Source", "Amount"].map((heading) => (
                    <th
                      key={heading}
                      className="px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bundle.expenseItems.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 font-bold text-slate-600">{when(row.date)}</td>
                    <td className="px-3 py-3 font-black text-slate-950">{row.name}</td>
                    <td className="px-3 py-3 font-bold text-slate-700">{row.category}</td>
                    <td className="px-3 py-3 text-xs font-semibold text-slate-500">{row.source}</td>
                    <td className="px-3 py-3 font-black text-slate-950">{taxMoney(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm font-semibold text-slate-600">No deduction lines yet.</p>
        )}
      </GrowthCard>
    </TaxDeskShell>
  );
}
