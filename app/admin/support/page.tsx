import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  LifeBuoy,
  MessageSquareWarning,
  ShieldCheck,
} from "lucide-react";
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
    <main className="min-h-screen bg-[#f8fbf6] px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
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

        <section className="rounded-[30px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <Link
                href="/admin"
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-100 sm:text-sm"
              >
                <ArrowLeft size={16} />
                Back to Admin
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-800 text-white">
                  <LifeBuoy size={28} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Admin / Support Desk
                  </p>
                  <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    Support inbox for support@sitguru.com
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
                Triage Pet Parent, Guru, and Ambassador tickets in one place —
                open a case, reply by email, reassign, resolve, or escalate to
                disputes without leaving the queue.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin/disputes" label="Disputes" />
              <ActionLink href="/admin/bookings" label="Bookings" />
              <ActionLink href="/admin/messages" label="Messages" primary />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Open Cases"
              value={data.totals.open.toLocaleString()}
              detail="New and open tickets awaiting action"
              tone="emerald"
            />
            <StatCard
              label="Urgent"
              value={data.totals.urgent.toLocaleString()}
              detail="High-priority tickets in queue"
              tone="rose"
            />
            <StatCard
              label="Resolved Today"
              value={data.totals.resolvedToday.toLocaleString()}
              detail="Closed or converted today"
              tone="sky"
            />
            <StatCard
              label="Converted"
              value={data.totals.converted.toLocaleString()}
              detail="Escalated into dispute cases"
              tone="amber"
            />
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <SupportIntakeForm assignees={data.assignees} />

          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                  <BookOpenCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                    Support queues
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    Jump to a live category
                  </h2>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <QueueCard
                  title="Customer Support"
                  description="Booking, payment, refund, and Pet Parent account questions."
                  count={data.customerSupport.length}
                  href="/admin/support?type=customer"
                />
                <QueueCard
                  title="Guru Support"
                  description="Guru onboarding, profile, booking, and payout questions."
                  count={data.guruSupport.length}
                  href="/admin/support?type=guru"
                />
                <QueueCard
                  title="Platform Issues"
                  description="Bug reports, broken flows, uploads, and dashboard friction."
                  count={data.platformIssues.length}
                  href="/admin/support?type=platform"
                />
                <QueueCard
                  title="Escalated Cases"
                  description="Refund, dispute, trust, and safety-related intake."
                  count={data.escalatedCases.length}
                  href="/admin/support?type=escalated"
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-sky-100 bg-sky-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sky-800">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">
                    Operator notes
                  </p>
                  <div className="mt-3 space-y-2 text-sm font-semibold leading-6 text-sky-950/80">
                    <p>
                      Super User access only — manage live cases carefully.
                    </p>
                    <p>
                      Click any ticket card to open the side workspace for
                      history, account summary, and reply dispatch.
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <MessageSquareWarning size={16} />
                      Use Resolved / Escalate / Reassign for instant updates.
                      Realtime watches the intake table for peer changes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Support ticket queue
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Who needs a reply next?
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Same scannable card layout as the rest of Admin — ticket ID,
                sender, category, priority, status, and quick actions.
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
    </main>
  );
}
