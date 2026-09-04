import { AlertTriangle, BadgeDollarSign, Users } from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import { TaxDeskDenied, TaxDeskShell } from "@/components/admin/financials/TaxDeskShell";
import { GrowthCard } from "@/components/admin/growth/GrowthPageFrame";
import { getFinanceAdminIdentity } from "@/lib/admin/financials/access";
import { loadTaxCenterBundle, taxMoney } from "@/lib/admin/financials/tax-center";

export const dynamic = "force-dynamic";

export default async function Tax1099Page() {
  const actor = await getFinanceAdminIdentity();
  if (!actor) return <TaxDeskDenied />;

  const bundle = await loadTaxCenterBundle();
  const missingEmail = bundle.contractors.filter((row) => row.missingEmail).length;

  return (
    <TaxDeskShell
      kicker="Tax Center / 1099"
      title="Guru, contractor, and partner payment review."
      detail="SitGuru payout and commission ledgers. Flag $600+ for 1099-NEC review. Sales tax remitted by SitGuru is not payee income."
      actorEmail={actor.email}
      exportHref="/api/admin/financials/tax-reports/export?format=csv&section=1099"
    >
      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        <AdminThemeCard
          label="Payees"
          value={bundle.totals.contractorCount.toLocaleString()}
          helper="Payouts + commissions"
          tone="emerald"
          icon={<Users size={18} />}
        />
        <AdminThemeCard
          label="Paid out"
          value={taxMoney(bundle.totals.payoutTotal + bundle.totals.commissionTotal)}
          helper="Guru, contractor, partner"
          tone="amber"
          icon={<BadgeDollarSign size={18} />}
        />
        <AdminThemeCard
          label="Review for 1099-NEC"
          value={bundle.totals.review1099Count.toLocaleString()}
          helper="$600 threshold for CPA review"
          tone={bundle.totals.review1099Count > 0 ? "amber" : "emerald"}
        />
        <AdminThemeCard
          label="Missing email"
          value={missingEmail.toLocaleString()}
          helper="Cannot issue a 1099 without it"
          tone={missingEmail > 0 ? "rose" : "emerald"}
          icon={<AlertTriangle size={18} />}
        />
      </section>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Payee ledger</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          1099-NEC is due Feb 1, 2027 for 2026 (Jan 31 is a Sunday). Download CSV for your CPA or e-file
          vendor.
        </p>
        {bundle.contractors.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Payee", "Kind", "Payments", "Total", "Review"].map((heading) => (
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
                {bundle.contractors.map((row) => (
                  <tr key={row.key} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3">
                      <p className="font-black text-slate-950">{row.name}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {row.email || "No email on file"}
                      </p>
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-700">{row.kind}</td>
                    <td className="px-3 py-3 font-bold text-slate-700">{row.paymentCount}</td>
                    <td className="px-3 py-3 font-black text-slate-950">{taxMoney(row.amount)}</td>
                    <td className="px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-amber-800">
                      {row.reviewFor1099 ? "1099-NEC" : row.missingEmail ? "Need email" : "Under $600"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm font-semibold text-slate-600">
            No payout or commission rows yet. Guru payouts will land here after the first paid sit.
          </p>
        )}
      </GrowthCard>
    </TaxDeskShell>
  );
}
