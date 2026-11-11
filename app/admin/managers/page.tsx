import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  listActiveEngagements,
  listCompensationRates,
} from "@/lib/staff-time/engagement";
import { currentRate } from "@/lib/staff-time/rates";
import { formatUsdFromCents } from "@/lib/staff-time/money";
import { isoToday } from "@/lib/staff-time/periods";
import { contractorAttentionCounts } from "@/lib/staff-time/attention-counts";
import {
  GrowthCard,
  GrowthPageFrame,
  GrowthPrimaryLink,
} from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

export default async function AdminManagerOversightPage() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login?next=/admin/managers");
  if (!actor.isSuperUser && !actor.canManageUsers) redirect("/admin");

  const [engagements, counts] = await Promise.all([
    listActiveEngagements(),
    contractorAttentionCounts(),
  ]);

  const rows = await Promise.all(
    engagements.map(async (engagement) => {
      const rates = await listCompensationRates(engagement.id);
      const rate = currentRate(rates, isoToday());
      return { engagement, rate };
    }),
  );

  return (
    <GrowthPageFrame
      kicker="People Ops · Manager Oversight"
      title="Inspect Manager Portal activity"
      detail="Read-only supervisory view of contractor engagements, rates, and work queues. This is not account impersonation."
      action={
        <div className="flex flex-wrap gap-2">
          <GrowthPrimaryLink href="/admin/financials/contractor-hours">
            Contractor Hours
          </GrowthPrimaryLink>
          <Link
            href="/admin/hr/people"
            className="inline-flex min-h-11 items-center rounded-2xl border border-white/40 px-4 text-sm font-black !text-white"
          >
            Team Members
          </Link>
        </div>
      }
    >
      <div
        className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950"
        role="status"
      >
        Super Admin Viewing Manager Data — read-only preview links open the manager
        workspace with a visible banner. Workflows stay intact; no fake sessions.
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <GrowthCard>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
            Active engagements
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">{rows.length}</p>
        </GrowthCard>
        <GrowthCard>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">
            Hours awaiting approval
          </p>
          <p className="mt-2 text-3xl font-black text-amber-950">
            {counts.available ? counts.hoursAwaitingApproval : "—"}
          </p>
        </GrowthCard>
        <GrowthCard>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-700">
            Awaiting payment
          </p>
          <p className="mt-2 text-3xl font-black text-sky-950">
            {counts.available ? counts.awaitingPayment : "—"}
          </p>
        </GrowthCard>
      </section>

      <div className="space-y-4">
        {rows.map(({ engagement, rate }) => (
          <GrowthCard key={engagement.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-black text-slate-950">
                  {engagement.displayName}
                </h2>
                <p className="text-sm font-semibold text-slate-600">
                  {engagement.title} · {engagement.email}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {engagement.employmentClassification} · {engagement.paymentCadence} ·
                  expected {engagement.expectedWeeklyMinHours}–
                  {engagement.expectedWeeklyMaxHours} hrs/week
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  Contract rate{" "}
                  {rate
                    ? `${formatUsdFromCents(rate.hourlyRateCents)}/hr (effective ${rate.effectiveOn})`
                    : "Not configured — set on Team Members"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/growth/preview/${encodeURIComponent(engagement.userId)}`}
                  className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900"
                >
                  View Manager Workspace
                </Link>
                <Link
                  href="/manager"
                  className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-800"
                >
                  Open /manager
                </Link>
                <Link
                  href="/admin/financials/contractor-hours"
                  className="inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-black !text-white"
                  style={{ background: "#0D5C3A" }}
                >
                  Review Hours
                </Link>
              </div>
            </div>
          </GrowthCard>
        ))}
        {!rows.length ? (
          <GrowthCard>
            <p className="text-sm font-semibold text-slate-600">
              No active contractor engagements yet. Growth Managers create an engagement
              when they open My Time / My Weekly Hours.
            </p>
          </GrowthCard>
        ) : null}
      </div>
    </GrowthPageFrame>
  );
}
