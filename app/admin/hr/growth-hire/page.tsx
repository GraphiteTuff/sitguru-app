import Link from "next/link";
import { getAdminIdentity } from "@/lib/admin/access";
import { hireGrowthManager, removeGrowthManager } from "@/lib/admin/growth/hire-actions";
import { GROWTH_HIRE_TITLE, listGrowthHires } from "@/lib/admin/growth/hire";

export const dynamic = "force-dynamic";

export default async function HrGrowthHirePage({
  searchParams,
}: {
  searchParams?: Promise<{ ok?: string; error?: string }>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canManageUsers) {
    return (
      <div className="mx-auto max-w-xl rounded-[1.75rem] border border-rose-100 bg-white p-6">
        <h1 className="text-2xl font-black text-slate-950">HR access required.</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Super Admins hire the Social & Community Manager from Human Resources.
        </p>
      </div>
    );
  }

  const query = (await searchParams) || {};
  const hires = await listGrowthHires();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section
        className="public-dark-section rounded-[1.75rem] p-5 sm:p-7"
        data-brand-green
        style={{ background: "#0D5C3A" }}
      >
        <Link href="/admin/hr" className="text-xs font-black !text-white/80">
          ← Human Resources
        </Link>
        <h1 className="mt-3 text-3xl font-black !text-white sm:text-4xl">
          Hire Social & Community
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 !text-white/90">
          Contractor, 10–15 hours, $20–$30/hr, 30-day trial. They get the Growth
          Portal only — not Financials, Users, or private messages. Super Admins
          keep the same portal.
        </p>
      </section>

      {query.ok ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          {query.ok}
        </p>
      ) : null}
      {query.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
          {query.error}
        </p>
      ) : null}

      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Grant portal access</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          If they already have a SitGuru login, we attach the role. Check Invite
          to email a new contractor into `/admin/growth`.
        </p>
        <form action={hireGrowthManager} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Name
            </span>
            <input
              name="name"
              required
              placeholder="First and last name"
              className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Work email
            </span>
            <input
              type="email"
              name="email"
              required
              placeholder="name@email.com"
              className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Start date
            </span>
            <input
              type="date"
              name="startDate"
              className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Location
            </span>
            <input
              name="location"
              defaultValue="Remote US"
              className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Notes
            </span>
            <textarea
              name="notes"
              rows={3}
              defaultValue="30-day contractor trial. Measure Pet Parent and Guru signups, not followers."
              className="mt-2 w-full rounded-2xl border border-emerald-100 px-4 py-3 text-sm font-semibold"
            />
          </label>
          <label className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" name="invite" defaultChecked className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-700">
              Email an invite to the Growth Portal
            </span>
          </label>
          <button
            type="submit"
            className="min-h-12 rounded-2xl px-5 text-sm font-black text-white sm:col-span-2"
            style={{ background: "#0D5C3A" }}
          >
            Hire and open Growth Portal
          </button>
        </form>
      </section>

      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-950">{GROWTH_HIRE_TITLE}s</h2>
          <Link
            href="/admin/growth"
            className="text-sm font-black text-emerald-800"
          >
            Open portal →
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {hires.map((hire) => (
            <div
              key={hire.id}
              className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-black text-slate-950">{hire.email}</p>
                <p className="text-xs font-semibold text-slate-500">
                  {hire.status}
                  {hire.assignedAt
                    ? ` · ${new Date(hire.assignedAt).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              {hire.status === "active" ? (
                <form action={removeGrowthManager}>
                  <input type="hidden" name="email" value={hire.email} />
                  <button className="min-h-11 rounded-2xl border border-rose-200 px-4 text-sm font-black text-rose-800">
                    Remove access
                  </button>
                </form>
              ) : null}
            </div>
          ))}
          {hires.length === 0 ? (
            <p className="text-sm font-semibold text-slate-600">
              Nobody has this role yet. Hire from the form above when the
              contractor is ready.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
