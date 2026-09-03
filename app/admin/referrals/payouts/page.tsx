import Link from "next/link";
import {
  ArrowLeft,
  BadgeDollarSign,
  Gift,
  HandCoins,
  Plus,
} from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import {
  AdminWorkplaceActions,
  AdminWorkplaceDenied,
  GrowthCard,
  GrowthPageFrame,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";
import { getAdminIdentity } from "@/lib/admin/access";
import { loadReferralAccounting } from "@/lib/admin/referrals/accounting";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

export default async function AdminReferralPayoutsPage() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    return (
      <AdminWorkplaceDenied
        title="Admin access required."
        detail="Sign in to review referral reward eligibility."
      />
    );
  }

  const desk = await loadReferralAccounting();
  const ready = desk.codes.filter((row) => row.signups > 0);
  const blocked = desk.codes.filter(
    (row) => row.visits + row.scans > 0 && row.signups === 0,
  );

  return (
    <GrowthPageFrame
      kicker="Referral Payouts Workplace"
      title="Pay only after a referred member joins."
      detail="Clicks and QR scans are tracked, but they are not a payout. HQ is alerted when a signup is captured so you can confirm the reward."
      action={
        <Link
          href="/admin/rewards"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-green-950"
        >
          <Gift size={17} />
          Rewards auditor
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/referrals"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
        >
          <ArrowLeft size={14} />
          Referrals workplace
        </Link>
      </div>

      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        <AdminThemeCard
          label="Ready to review"
          value={ready.length}
          helper="Codes with a captured signup"
          tone="emerald"
          icon={<HandCoins size={18} />}
        />
        <AdminThemeCard
          label="Signups captured"
          value={desk.totals.signups}
          helper="First-touch joins"
          tone="sky"
          icon={<Gift size={18} />}
        />
        <AdminThemeCard
          label="Not yet eligible"
          value={blocked.length}
          helper="Traffic without a signup"
          tone="amber"
          icon={<BadgeDollarSign size={18} />}
        />
        <AdminThemeCard
          label="Needs owner"
          value={desk.totals.missingOwners}
          helper="Attach a person first"
          tone="rose"
        />
      </section>

      <AdminWorkplaceActions
        actions={[
          {
            href: "/admin/referrals/codes#generate-code",
            label: "Fix a code",
            detail: "Attach the missing owner",
            icon: Plus,
            primary: desk.totals.missingOwners > 0,
          },
          {
            href: "/admin/rewards",
            label: "Rewards auditor",
            detail: "Leaders and fraud flags",
            icon: Gift,
          },
          {
            href: "/admin/financials/commissions",
            label: "Commissions",
            detail: "Finance payout records",
            icon: HandCoins,
          },
        ]}
      />

      <GrowthCard>
        <h2 className="text-xl font-black text-slate-950">
          Reward-ready referrals
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          These codes have a captured signup. Confirm the person, then pay from
          Financials.
        </p>
        <div className="mt-4 grid min-w-0 gap-3">
          {ready.map((row) => (
            <div
              key={row.code}
              className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <p className="font-black text-slate-950">{row.code}</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-600">
                  {row.ownerName} · {number(row.signups)} signup
                </p>
              </div>
              <StatusPill value="Review payout" />
            </div>
          ))}
          {!ready.length ? (
            <p className="text-sm font-semibold text-slate-500">
              No captured signups yet. Traffic is already tracking — the next
              referred registration will land here and ping HQ.
            </p>
          ) : null}
        </div>
      </GrowthCard>
    </GrowthPageFrame>
  );
}
