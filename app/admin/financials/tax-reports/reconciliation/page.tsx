import Link from "next/link";
import { Landmark, RefreshCw, Wallet } from "lucide-react";
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

export default async function TaxReconciliationPage() {
  const actor = await getFinanceAdminIdentity();
  if (!actor) return <TaxDeskDenied />;

  const bundle = await loadTaxCenterBundle();

  return (
    <TaxDeskShell
      kicker="Tax Center / Reconciliation"
      title="Stripe, NFCU, and tax-collection backup."
      detail="Match Stripe payouts and collected sales tax to SitGuru cash. Full matching stays on the Reconciliation desk."
      actorEmail={actor.email}
      exportHref="/api/admin/financials/tax-reports/export?format=csv&section=reconciliation"
    >
      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        <AdminThemeCard
          label="Stripe payouts"
          value={taxMoney(bundle.totals.stripePayoutTotal)}
          helper={`${bundle.totals.stripePayoutCount.toLocaleString()} batches`}
          tone="violet"
          icon={<RefreshCw size={18} />}
        />
        <AdminThemeCard
          label="NFCU cash"
          value={taxMoney(bundle.totals.liveCash)}
          helper={`${bundle.totals.connectedBusinessAccounts} business account${bundle.totals.connectedBusinessAccounts === 1 ? "" : "s"}`}
          tone="emerald"
          icon={<Wallet size={18} />}
        />
        <AdminThemeCard
          label="Sales tax collected"
          value={taxMoney(bundle.totals.tax)}
          helper="Hold on SitGuru books until remitted"
          tone="sky"
          icon={<Landmark size={18} />}
        />
        <AdminThemeCard
          label="Gross bookings"
          value={taxMoney(bundle.totals.gross)}
          helper={`${bundle.totals.paidBookingCount.toLocaleString()} paid payments`}
          tone="amber"
        />
      </section>

      <GrowthCard>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">Recent Stripe payouts</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Use the live Reconciliation module to match each batch to an NFCU deposit.
            </p>
          </div>
          <Link
            href="/admin/financials/reconciliation"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-black !text-white"
            style={{ background: "#0D5C3A" }}
          >
            Open reconciliation
          </Link>
        </div>
        {bundle.reconItems.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["When", "Payout", "Status", "Amount"].map((heading) => (
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
                {bundle.reconItems.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 font-bold text-slate-600">{when(row.date)}</td>
                    <td className="px-3 py-3 font-black text-slate-950">{row.label}</td>
                    <td className="px-3 py-3 font-bold text-slate-700">{row.status}</td>
                    <td className="px-3 py-3 font-black text-slate-950">{taxMoney(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm font-semibold text-slate-600">
            No stripe_payouts rows yet. Sync Stripe from Payment Gateway.
          </p>
        )}
      </GrowthCard>
    </TaxDeskShell>
  );
}
