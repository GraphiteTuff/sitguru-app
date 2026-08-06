import { requireSupportDashboardAccess } from "@/lib/admin/support/access";
import { getSupportData } from "@/lib/admin/support/data";
import {
  getSearchValue,
  parseSupportFilters,
} from "@/lib/admin/support/utils";
import SupportDashboardClient from "@/components/admin/support/SupportDashboardClient";
import SupportIntakeForm from "@/components/admin/support/SupportIntakeForm";
import {
  ActionLink,
  QueueCard,
  StatCard,
  SupportAccessBanner,
  SupportNotice,
} from "@/components/admin/support/SupportChrome";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await requireSupportDashboardAccess();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filters = parseSupportFilters(resolvedSearchParams);
  const updated = getSearchValue(resolvedSearchParams, "updated");
  const action = getSearchValue(resolvedSearchParams, "action");
  const emailStatus = getSearchValue(resolvedSearchParams, "emailStatus");

  const data = await getSupportData(filters);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_30%),radial-gradient(circle_at_right,_rgba(168,85,247,0.12),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <SupportNotice
          updated={updated}
          action={action}
          emailStatus={emailStatus}
        />

        <SupportAccessBanner
          email={identity.email}
          role={identity.role}
          isSuperUser={identity.isSuperUser}
        />

        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-violet-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                SitGuru Admin · Support Dashboard
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Support intake for support@sitguru.com.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Dense triage for Pet Parent, Pet Guru, and Ambassador inquiries —
                open the ticket workspace, dispatch replies, and apply quick
                status modifiers without leaving the queue.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin/disputes" label="Disputes" />
              <ActionLink href="/admin/bookings" label="Bookings" />
              <ActionLink href="/admin/moderation" label="Moderation" primary />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Open Cases"
              value={data.totals.open.toLocaleString()}
              detail="New and open tickets awaiting action."
              tone="emerald"
            />
            <StatCard
              label="Urgent"
              value={data.totals.urgent.toLocaleString()}
              detail="Urgent / high-priority tickets in queue."
              tone="rose"
            />
            <StatCard
              label="Resolved Today"
              value={data.totals.resolvedToday.toLocaleString()}
              detail="Closed or converted tickets today."
              tone="sky"
            />
            <StatCard
              label="Converted"
              value={data.totals.converted.toLocaleString()}
              detail="Escalated into dispute cases."
              tone="violet"
            />
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <SupportIntakeForm assignees={data.assignees} />

          <div className="space-y-8">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Support Queues
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Live intake categories.
              </h2>

              <div className="mt-6 grid gap-4">
                <QueueCard
                  title="Customer Support"
                  description="Booking, payment, refund, and Pet Parent account questions."
                  count={data.customerSupport.length}
                  href="/admin/support?type=customer"
                />
                <QueueCard
                  title="Pet Guru Support"
                  description="Guru onboarding, profile, booking, and payout questions."
                  count={data.guruSupport.length}
                  href="/admin/support?type=guru"
                />
                <QueueCard
                  title="Platform Issues"
                  description="Bug reports, broken flows, upload problems, and dashboard friction."
                  count={data.platformIssues.length}
                  href="/admin/support?type=platform"
                />
                <QueueCard
                  title="Escalated Cases"
                  description="Refund, dispute, trust, and safety-related intake cases."
                  count={data.escalatedCases.length}
                  href="/admin/support?type=escalated"
                />
              </div>
            </div>

            <div className="rounded-[32px] border border-sky-400/20 bg-sky-400/10 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                Operator notes
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-sky-50/90">
                <p>
                  Super User access only. For live-site safety, manage fields
                  with discretion.
                </p>
                <p>
                  Click any ticket row to open the side workspace: conversation
                  history, account summary, and message dispatch.
                </p>
                <p>
                  Use Resolved / Escalate / Reassign quick actions for no-reload
                  updates. Realtime watches the intake table for peer changes.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Support Ticket Queue
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Scannable intake grid.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Ticket ID · Sender Type · Category · Priority · Status · Last
                Action Time
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin/disputes" label="Disputes" />
              <ActionLink href="/admin/bookings" label="Bookings" />
            </div>
          </div>

          <SupportDashboardClient
            initialCases={data.cases}
            assignees={data.assignees}
            filters={filters}
            filteredTotal={data.totals.filtered}
            total={data.totals.all}
          />
        </section>
      </div>
    </div>
  );
}
