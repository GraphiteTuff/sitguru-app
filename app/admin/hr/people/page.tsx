import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  listActiveEngagements,
  listCompensationRates,
} from "@/lib/staff-time/engagement";
import { updateEngagementRate } from "@/lib/staff-time/actions";
import { currentRate } from "@/lib/staff-time/rates";
import { formatUsdFromCents } from "@/lib/staff-time/money";
import { isoToday } from "@/lib/staff-time/periods";
import {
  GrowthCard,
  GrowthPageFrame,
  GrowthPrimaryLink,
} from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function AdminPeoplePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login?next=/admin/hr/people");
  const params = searchParams ? await searchParams : {};
  const engagements = await listActiveEngagements();

  const rows = await Promise.all(
    engagements.map(async (engagement) => {
      const rates = await listCompensationRates(engagement.id);
      const rate = currentRate(rates, isoToday());
      return { engagement, rate };
    }),
  );

  return (
    <GrowthPageFrame
      kicker="People & Administration"
      title="Team Members"
      detail="Engagements, rates, W-9 status (status only), and payment oversight. Restricted tax identifiers are never shown here."
      action={
        <div className="flex flex-wrap gap-2">
          <GrowthPrimaryLink href="/admin/hr/people/payments">Payments</GrowthPrimaryLink>
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center rounded-2xl border border-white/40 px-4 text-sm font-black !text-white"
          >
            Admin Directory
          </Link>
        </div>
      }
    >
      {first(params.ok) ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-950">
          {first(params.ok)}
        </p>
      ) : null}
      {first(params.error) ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-950">
          {first(params.error)}
        </p>
      ) : null}

      <div className="space-y-4">
        {rows.map(({ engagement, rate }) => (
          <GrowthCard key={engagement.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  {engagement.displayName}
                </h2>
                <p className="text-sm font-semibold text-slate-600">
                  {engagement.title} · {engagement.email}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Expected {engagement.expectedWeeklyMinHours}–
                  {engagement.expectedWeeklyMaxHours} hrs/week ·{" "}
                  {engagement.paymentCadence}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  Current rate{" "}
                  {rate
                    ? `${formatUsdFromCents(rate.hourlyRateCents)}/hr`
                    : "Not set"}{" "}
                  · W-9 {engagement.w9Status === "received" ? "Received" : "Not on file"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/growth/preview/${encodeURIComponent(engagement.userId)}`}
                  className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900"
                >
                  View Workspace
                </Link>
                <Link
                  href="/admin/hr/people/payments"
                  className="inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-black !text-white"
                  style={{ background: "#0D5C3A" }}
                >
                  Payments
                </Link>
              </div>
            </div>

            <form
              action={updateEngagementRate}
              className="mt-4 grid gap-3 rounded-2xl bg-[#FAF6EE] p-3 md:grid-cols-4"
            >
              <input type="hidden" name="engagementId" value={engagement.id} />
              <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
                New hourly rate
                <input
                  name="hourlyRateDollars"
                  defaultValue={rate ? (rate.hourlyRateCents / 100).toFixed(2) : "16.75"}
                  className="min-h-11 rounded-2xl border border-emerald-100 px-3 text-sm font-semibold text-slate-900"
                />
              </label>
              <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
                Effective on
                <input
                  type="date"
                  name="effectiveOn"
                  defaultValue={isoToday()}
                  className="min-h-11 rounded-2xl border border-emerald-100 px-3 text-sm font-semibold text-slate-900"
                />
              </label>
              <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-800 md:col-span-2">
                Notes
                <input
                  name="notes"
                  placeholder="Why the rate changed"
                  className="min-h-11 rounded-2xl border border-emerald-100 px-3 text-sm font-semibold text-slate-900"
                />
              </label>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900 md:col-span-4 md:justify-self-start"
              >
                Save effective-dated rate
              </button>
            </form>
          </GrowthCard>
        ))}
        {!rows.length ? (
          <GrowthCard>
            <p className="text-sm font-semibold text-slate-600">
              No active team-member engagements yet. Opening My Time as a Growth Manager
              creates the engagement with configurable weekly range and rate history.
            </p>
          </GrowthCard>
        ) : null}
      </div>
    </GrowthPageFrame>
  );
}
