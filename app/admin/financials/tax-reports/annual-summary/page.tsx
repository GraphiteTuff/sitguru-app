import { BadgeDollarSign, Landmark, Receipt, Wallet } from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import { TaxFilingCalendar } from "@/components/admin/financials/TaxFilingCalendar";
import { TaxDeskDenied, TaxDeskShell } from "@/components/admin/financials/TaxDeskShell";
import {
  AdminWorkplaceHealth,
  GrowthCard,
} from "@/components/admin/growth/GrowthPageFrame";
import { getFinanceAdminIdentity } from "@/lib/admin/financials/access";
import { loadTaxCenterBundle, taxMoney } from "@/lib/admin/financials/tax-center";

export const dynamic = "force-dynamic";

export default async function AnnualTaxSummaryPage() {
  const actor = await getFinanceAdminIdentity();
  if (!actor) return <TaxDeskDenied />;

  const bundle = await loadTaxCenterBundle();
  const healthy = bundle.sourceHealth.filter((source) => source.ok).length;

  return (
    <TaxDeskShell
      kicker="Tax Center / Income Tax"
      title="2026 annual tax summary for Graff Enterprises LLC."
      detail="Live SitGuru books for the launch year. This organizes CPA support — it does not file the return."
      actorEmail={actor.email}
      exportHref="/api/admin/financials/tax-reports/export?format=csv&section=annual"
    >
      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        <AdminThemeCard
          label="Platform revenue"
          value={taxMoney(bundle.totals.fees)}
          helper={`${bundle.totals.paidBookingCount.toLocaleString()} paid bookings`}
          tone="emerald"
          icon={<Receipt size={18} />}
        />
        <AdminThemeCard
          label="Sales tax collected"
          value={taxMoney(bundle.totals.tax)}
          helper={`${taxMoney(bundle.totals.tipsExcluded)} tips excluded`}
          tone="violet"
          icon={<Landmark size={18} />}
        />
        <AdminThemeCard
          label="Deductions support"
          value={taxMoney(bundle.totals.expenseTotal)}
          helper={`${bundle.totals.expenseCount.toLocaleString()} expense rows`}
          tone="sky"
          icon={<Wallet size={18} />}
        />
        <AdminThemeCard
          label="1099 payments"
          value={taxMoney(bundle.totals.payoutTotal + bundle.totals.commissionTotal)}
          helper={`${bundle.totals.review1099Count} at or over $600`}
          tone="amber"
          icon={<BadgeDollarSign size={18} />}
        />
      </section>

      <TaxFilingCalendar compact />

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Tax year rollup</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Same totals as the Tax Center CSV / PDF export.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Section", "Category", "Count", "Amount", "Treatment"].map((heading) => (
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
              {bundle.annualLines.map((row) => (
                <tr key={`${row.section}-${row.category}`} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-3 font-bold text-slate-500">{row.section}</td>
                  <td className="px-3 py-3">
                    <p className="font-black text-slate-950">{row.category}</p>
                    <p className="text-xs font-semibold text-slate-500">{row.notes}</p>
                  </td>
                  <td className="px-3 py-3 font-bold text-slate-700">{row.count.toLocaleString()}</td>
                  <td className="px-3 py-3 font-black text-slate-950">{taxMoney(row.amount)}</td>
                  <td className="px-3 py-3 text-xs font-semibold text-slate-500">{row.treatment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GrowthCard>

      <AdminWorkplaceHealth
        sources={bundle.sourceHealth}
        helper={`${healthy} of ${bundle.sourceHealth.length} live`}
      />
    </TaxDeskShell>
  );
}
