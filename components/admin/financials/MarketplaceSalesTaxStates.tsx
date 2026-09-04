import Link from "next/link";
import {
  MARKETPLACE_SALES_TAX_STATES,
  type MarketplaceSalesTaxState,
} from "@/lib/admin/financials/marketplace-sales-tax-states";
import { GrowthCard } from "@/components/admin/growth/GrowthPageFrame";

function scopeTone(scope: MarketplaceSalesTaxState["scope"]) {
  if (scope === "all_pet_care") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (scope === "boarding_daycare") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-sky-200 bg-sky-50 text-sky-800";
}

export function MarketplaceSalesTaxStates({
  activity,
}: {
  activity?: Record<string, { bookingCount: number; taxCollected: number }>;
}) {
  return (
    <GrowthCard id="sales-tax-states">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
            Marketplace collection states
          </p>
          <h2 className="mt-1 text-lg font-black text-slate-950">
            All {MARKETPLACE_SALES_TAX_STATES.length} states that tax pet-care bookings
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            SitGuru should collect and remit in every market below — not Minnesota
            only. Tips stay optional gratuity. Register these in Stripe Tax before
            promising a Guru coverage.
          </p>
        </div>
        <Link
          href="/admin/financials/tax-reports/marketplace-tax"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-black !text-white"
          style={{ background: "#0D5C3A" }}
        >
          Marketplace tax desk
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {["State", "What is taxed", "State rate", "Local", "SitGuru books", "File / pay"].map(
                (heading) => (
                  <th
                    key={heading}
                    className="px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {MARKETPLACE_SALES_TAX_STATES.map((row) => {
              const live = activity?.[row.state];
              return (
                <tr key={row.state} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-3">
                    <p className="font-black text-slate-950">{row.stateName}</p>
                    <p className="text-xs font-bold text-slate-500">{row.state}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${scopeTone(row.scope)}`}
                    >
                      {row.scopeLabel}
                    </span>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{row.notes}</p>
                  </td>
                  <td className="px-3 py-3 font-black text-slate-950">{row.rate}</td>
                  <td className="px-3 py-3 font-bold text-slate-700">{row.local}</td>
                  <td className="px-3 py-3 text-xs font-semibold text-slate-500">
                    {live
                      ? `${live.bookingCount.toLocaleString()} booking${live.bookingCount === 1 ? "" : "s"} · tax $${live.taxCollected.toFixed(2)}`
                      : "No taxed bookings yet"}
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={row.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-black text-emerald-800"
                    >
                      {row.taxName}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GrowthCard>
  );
}
