import Link from "next/link";
import {
  BadgeDollarSign,
  FileSpreadsheet,
  Landmark,
  MapPin,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import {
  AdminWorkplaceActions,
  AdminWorkplaceDenied,
  AdminWorkplaceHealth,
  GrowthCard,
  GrowthPageFrame,
} from "@/components/admin/growth/GrowthPageFrame";
import { getFinanceAdminIdentity } from "@/lib/admin/financials/access";
import { loadMarketplaceTaxReport } from "@/lib/admin/financials/marketplace-tax";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(value) ? value : 0);
}

function when(value: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function MarketplaceTaxPage() {
  const actor = await getFinanceAdminIdentity();

  if (!actor) {
    return (
      <AdminWorkplaceDenied detail="Sign in with a finance-enabled admin account to review marketplace sales tax." />
    );
  }

  const report = await loadMarketplaceTaxReport();
  const healthy = report.sourceHealth.filter((source) => source.ok).length;

  return (
    <GrowthPageFrame
      kicker="Tax Center / Sales & Local"
      title="SitGuru collects sales tax. Gurus keep the tip."
      detail="Pet parents pay tax on the booking and SitGuru fee. Tips stay optional gratuity and go 100% to the Guru. SitGuru remits — Gurus do not add or file sales tax."
      action={
        <Link
          href="/admin/financials/cpa-handoff?section=local-tax"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-black text-green-950"
        >
          CPA handoff
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/financials/tax-reports"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
        >
          Tax Center
        </Link>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
          {actor.email}
        </span>
      </div>

      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        <AdminThemeCard
          label="Sales tax collected"
          value={money(report.taxCollected)}
          helper={`${report.taxedBookingCount.toLocaleString()} bookings with tax · SitGuru remits`}
          tone="violet"
          icon={<Landmark size={18} />}
        />
        <AdminThemeCard
          label="Tips excluded"
          value={money(report.tipsExcluded)}
          helper="Optional gratuity. Not taxed. 100% Guru payout."
          tone="emerald"
          icon={<BadgeDollarSign size={18} />}
        />
        <AdminThemeCard
          label="Taxable booking base"
          value={money(report.taxableBase)}
          helper={`${report.paidBookingCount.toLocaleString()} paid bookings · service + SitGuru fee`}
          tone="sky"
          icon={<Receipt size={18} />}
        />
        <AdminThemeCard
          label="Need a service address"
          value={report.bookingsMissingLocation.toLocaleString()}
          helper="Checkout now collects ZIP so Stripe Tax can calculate."
          tone={report.bookingsMissingLocation > 0 ? "amber" : "emerald"}
          icon={<MapPin size={18} />}
        />
      </section>

      <AdminWorkplaceActions
        actions={[
          {
            href: "/admin/financials/tax-reports",
            label: "Tax Center",
            detail: "Quarterly, annual, and CPA package desk",
            icon: ShieldCheck,
            primary: true,
          },
          {
            href: "/admin/financials/payment-gateway",
            label: "Payment gateway",
            detail: "Stripe Tax registrations and remittance",
            icon: Landmark,
          },
          {
            href: "/api/admin/financials/tax-reports/export?format=csv",
            label: "Export tax CSV",
            detail: "CPA support from live booking payments",
            icon: FileSpreadsheet,
          },
        ]}
      />

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Guru-easy rule</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Same model Rover uses in Minnesota: platform collects and remits.
        </p>
        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-3">
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">Guru lists the rate</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              A $40 walk stays $40. Tax is added at checkout for the pet parent.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">Tips are not taxed</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Stripe Optional Gratuity (`txcd_90020001`). Guru keeps the full tip.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">SitGuru remits</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Tax stays on SitGuru books. Confirm MN and other Stripe Tax
              registrations before promising a state to a Guru.
            </p>
          </div>
        </div>
        {report.paypalBookingCount > 0 ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {report.paypalBookingCount.toLocaleString()} PayPal booking
            {report.paypalBookingCount === 1 ? "" : "s"} are still outside Stripe
            Automatic Tax. Use Stripe for taxed markets until PayPal matches.
          </p>
        ) : null}
      </GrowthCard>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">By service state</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Tax should follow the sit location, not the pet parent&apos;s billing ZIP.
        </p>
        {report.byState.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["State", "Bookings", "Taxable base", "Tips excluded", "Tax collected"].map(
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
                {report.byState.map((row) => (
                  <tr key={row.state} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3">
                      <p className="font-black text-slate-950">{row.stateName}</p>
                      <p className="text-xs font-bold text-slate-500">
                        {row.missingLocation ? "Needs ZIP" : row.state}
                      </p>
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-700">
                      {row.bookingCount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-700">
                      {money(row.taxableBase)}
                    </td>
                    <td className="px-3 py-3 font-bold text-emerald-800">
                      {money(row.tipsExcluded)}
                    </td>
                    <td className="px-3 py-3 font-black text-slate-950">
                      {money(row.taxCollected)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm font-semibold text-slate-600">
            No paid bookings yet. After the first taxed Stripe checkout, this desk
            will show MN and other markets.
          </p>
        )}
      </GrowthCard>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Recent paid bookings</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Confirm tax landed on the service, not the tip.
        </p>
        {report.recent.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["When", "Guru", "Location", "Taxable", "Tip", "Tax"].map((heading) => (
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
                {report.recent.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 font-bold text-slate-600">
                      {when(row.createdAt)}
                    </td>
                    <td className="px-3 py-3 font-black text-slate-950">
                      {row.guruName}
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-600">
                      {[row.city, row.state, row.zip].filter(Boolean).join(", ") ||
                        "Missing location"}
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-700">
                      {money(row.taxableBase)}
                    </td>
                    <td className="px-3 py-3 font-bold text-emerald-800">
                      {money(row.tipAmount)}
                    </td>
                    <td className="px-3 py-3 font-black text-slate-950">
                      {money(row.taxCollected)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm font-semibold text-slate-600">
            No paid booking rows to review yet.
          </p>
        )}
      </GrowthCard>

      <AdminWorkplaceHealth
        sources={report.sourceHealth}
        helper={`${healthy} of ${report.sourceHealth.length} live`}
        links={
          <>
            <Link
              href="/admin/financials/payouts"
              className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900"
            >
              Guru payouts
            </Link>
            <Link
              href="/admin/financials/balance-sheet"
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              Balance sheet
            </Link>
          </>
        }
      />
    </GrowthPageFrame>
  );
}
