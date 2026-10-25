import Link from "next/link";
import { redirect } from "next/navigation";
import ManagerInternDashboard from "@/components/internship/ManagerInternDashboard";
import { getAdminIdentity } from "@/lib/admin/access";
import { canEditRequirements, canGiveCeoReview, internshipActorKind, isPortalUserId } from "@/lib/internship/manager-access";
import { loadManagerDashboard } from "@/lib/internship/manager-data";
import { internReadiness } from "@/lib/onboarding/data";
import { saveMessagingPermission } from "@/lib/messaging/staff-actions";
import { reviewInternWeek } from "@/lib/timekeeper/actions";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function InternManagerPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor) redirect("/intern/login?next=/intern/manage");
  const kind = internshipActorKind({ role: actor.role, isSuperUser: actor.isSuperUser });
  if (kind !== "manager" && kind !== "supervisor") {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <section className="rounded-[1.6rem] border border-rose-100 bg-white p-5">
          <h1 className="text-2xl font-black text-slate-950">Manager access required</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            This desk is for assigned intern managers and the formal supervisor. Intern records stay private.
          </p>
          <Link href="/intern" className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-[#166534] px-4 text-sm font-black !text-white">
            Intern portal
          </Link>
        </section>
      </main>
    );
  }

  const params = searchParams ? await searchParams : {};
  const requestedManager = kind === "supervisor" ? first(params.manager) : "";
  const managerFilter = isPortalUserId(requestedManager) ? requestedManager : "";
  const managerProfile = managerFilter
    ? await supabaseAdmin.from("profiles").select("full_name,email").eq("id", managerFilter).maybeSingle()
    : { data: null };
  const managerName = String(managerProfile.data?.full_name || managerProfile.data?.email || "this manager");
  const data = await loadManagerDashboard({
    actorUserId: actor.id,
    actorKind: kind,
    managerUserId: managerFilter || null,
  });
  const ok = first(params.ok);
  const error = first(params.error);
  const readiness = await Promise.all(
    data.interns.map(async (intern) => ({
      id: intern.id,
      name: intern.fullName,
      userId: intern.userId,
      onboarding: intern.userId ? await internReadiness(intern.userId) : null,
    })),
  );
  const internIds = data.interns.map((intern) => intern.id);
  const waiting = internIds.length
    ? await supabaseAdmin.from("timekeeper_weeks").select("intern_id,week_number,status").eq("status", "submitted").in("intern_id", internIds)
    : { data: [] };

  return (
    <main className="mx-auto w-full max-w-[1100px] overflow-x-hidden px-3 py-4 sm:px-5">
      {managerFilter ? (
        <p className="mb-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          {managerName}&apos;s intern desk.{" "}
          <Link href="/intern/manage" className="font-black text-emerald-900">Show every intern</Link>
        </p>
      ) : kind === "supervisor" ? (
        <p className="mb-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950">
          Every intern desk is open. Pick one manager from the intern team page to see only their interns.
        </p>
      ) : null}
      <section className="mb-4 grid gap-3">
        <h2 className="text-lg font-black text-slate-950">Intern time and onboarding</h2>
        <article className="rounded-2xl border border-emerald-100 bg-[#FAF6EE] p-4">
          <h3 className="font-black text-slate-950">Creative freedom</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">Most meaningful intern work should be Explore or Guided. Planner holds the assignment. You coach the thinking.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            <li className="rounded-2xl bg-white p-3"><p className="font-black text-slate-950">Explore</p><p className="mt-1 text-sm font-semibold text-slate-600">Give the problem and the guardrails. The intern proposes the approach.</p></li>
            <li className="rounded-2xl bg-white p-3"><p className="font-black text-slate-950">Guided</p><p className="mt-1 text-sm font-semibold text-slate-600">Give the objective and audience. The intern owns the creative execution.</p></li>
            <li className="rounded-2xl bg-white p-3"><p className="font-black text-slate-950">Directed</p><p className="mt-1 text-sm font-semibold text-slate-600">Use only when compliance, a deadline, or an approved output must be followed exactly.</p></li>
          </ul>
        </article>
        {readiness.map((intern) => (
          <article key={intern.id} className="rounded-2xl border border-emerald-100 bg-white p-4">
            <p className="font-black text-slate-950">{intern.name}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {intern.onboarding ? `Onboarding ${intern.onboarding.percent}% · status only, no personnel files` : "Onboarding package not assigned"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/intern?view=${intern.id}`} className="inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">Open portal</Link>
              <Link href={`/intern/time?view=${intern.id}`} className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900">Open time</Link>
            </div>
            {intern.onboarding?.items.map((item) => (
              <p key={item.title} className="text-xs font-semibold text-slate-500">{item.title}: {item.status}</p>
            ))}
            {intern.userId ? (
              <form action={saveMessagingPermission} className="mt-3 grid gap-2 sm:grid-cols-3">
                <input type="hidden" name="userId" value={intern.userId} />
                <select name="level" className="min-h-11 rounded-xl border border-emerald-100 px-2 text-sm font-semibold">
                  <option value="none">No community messaging</option>
                  <option value="view">View only</option>
                  <option value="reply_assigned">Reply to assigned</option>
                  <option value="initiate_approved">Start approved chats</option>
                  <option value="full">Full authorized messaging</option>
                </select>
                <select name="review" className="min-h-11 rounded-xl border border-emerald-100 px-2 text-sm font-semibold">
                  <option value="all">All messages need review</option>
                  <option value="selected">Selected messages need review</option>
                  <option value="independent">Independent within guardrails</option>
                </select>
                <button className="min-h-11 rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">Save messaging</button>
              </form>
            ) : null}
          </article>
        ))}
        {(waiting.data || []).map((week) => (
          <form key={`${week.intern_id}-${week.week_number}`} action={reviewInternWeek} className="grid gap-2 rounded-2xl bg-emerald-50 p-3 sm:grid-cols-[1fr_auto_auto]">
            <input type="hidden" name="internId" value={String(week.intern_id)} />
            <input type="hidden" name="weekNumber" value={String(week.week_number)} />
            <p className="text-sm font-black text-slate-950">Week {String(week.week_number)} is ready for review</p>
            <button name="action" value="recommend" className="min-h-11 rounded-2xl bg-[#0D5C3A] px-3 text-sm font-black !text-white">Recommend approval</button>
            <button name="action" value="return" className="min-h-11 rounded-2xl border border-amber-300 bg-white px-3 text-sm font-black text-amber-950">Return</button>
          </form>
        ))}
      </section>
      <ManagerInternDashboard
        cards={data.cards}
        reviews={data.reviews}
        questions={data.questions}
        interns={data.interns}
        notices={data.notices}
        canEdit={canEditRequirements(kind)}
        canCeo={canGiveCeoReview(kind)}
        notice={ok ? { kind: "ok", message: ok } : error ? { kind: "error", message: error } : null}
      />
    </main>
  );
}
