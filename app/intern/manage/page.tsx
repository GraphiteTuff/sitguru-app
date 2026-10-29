import Link from "next/link";
import { redirect } from "next/navigation";
import InternTeamDeskHome from "@/components/internship/InternTeamDeskHome";
import ManagerInternDashboard from "@/components/internship/ManagerInternDashboard";
import { getAdminIdentity } from "@/lib/admin/access";
import { isFounderPersonalMarketplaceEmail } from "@/lib/admin/super-users";
import { canEditRequirements, canGiveCeoReview, internshipActorKind, isPortalUserId } from "@/lib/internship/manager-access";
import { loadManagerDashboard } from "@/lib/internship/manager-data";
import { internReadiness } from "@/lib/onboarding/data";
import { saveMessagingPermission } from "@/lib/messaging/staff-actions";
import { reviewInternWeek } from "@/lib/timekeeper/actions";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Growth Manager login used for Ava's assigned intern desk preview. */
const AVA_MANAGER_EMAIL = "ava@sitguru.com";

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
  const founderPersonal = isFounderPersonalMarketplaceEmail(actor.email);
  // Founder personal marketplace preview uses supervisor visibility so Jason can
  // open Ava's assigned desk (manager filter) without becoming HQ Super Admin.
  const kind = founderPersonal
    ? "supervisor"
    : internshipActorKind({ role: actor.role, isSuperUser: actor.isSuperUser });
  if (kind !== "manager" && kind !== "supervisor") {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <section className="overflow-hidden rounded-[2rem] border border-rose-100 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <h1 className="text-2xl font-black text-slate-950">Manager access required</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            This desk is for assigned intern managers and the formal supervisor. Intern records stay private.
          </p>
          <Link href="/intern" className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-[#166534] px-4 text-sm font-black !text-white transition hover:bg-[#102417]">
            Intern portal
          </Link>
        </section>
      </main>
    );
  }

  const params = searchParams ? await searchParams : {};
  let requestedManager = kind === "supervisor" ? first(params.manager) : "";
  if (founderPersonal && !requestedManager) {
    const { data: avaProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", AVA_MANAGER_EMAIL)
      .maybeSingle();
    if (avaProfile?.id && isPortalUserId(String(avaProfile.id))) {
      redirect(`/intern/manage?manager=${avaProfile.id}`);
    }
  }
  const managerFilter = isPortalUserId(requestedManager) ? requestedManager : "";
  const managerProfile = managerFilter
    ? await supabaseAdmin.from("profiles").select("full_name,email").eq("id", managerFilter).maybeSingle()
    : { data: null };
  const managerName = String(managerProfile.data?.full_name || managerProfile.data?.email || "this manager");
  const viewerProfile = managerFilter
    ? null
    : await supabaseAdmin.from("profiles").select("full_name,first_name").eq("id", actor.id).maybeSingle();
  const welcomeSource = managerFilter
    ? managerName
    : String(viewerProfile?.data?.first_name || viewerProfile?.data?.full_name || "there");
  const welcomeName = welcomeSource.split(/\s+/).filter(Boolean)[0] || "there";
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
        <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950 shadow-sm">
          {managerName}&apos;s intern desk.{" "}
          <Link href="/intern/manage" className="font-black text-emerald-900 underline-offset-2 hover:underline">Show every intern</Link>
        </p>
      ) : kind === "supervisor" ? (
        <p className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950 shadow-sm">
          Every intern desk is open. Pick one manager from the intern team page to see only their interns.
        </p>
      ) : null}
      <InternTeamDeskHome
        firstName={welcomeName}
        activeInterns={data.interns.length}
        pendingReviews={(waiting.data || []).length + data.reviews.filter((item) => !item.ceo).length}
        weeklyCheckIns={data.reviews.filter((item) => item.targetType === "weekly").length}
        onboardingItems={readiness.reduce(
          (sum, intern) =>
            sum +
            (intern.onboarding?.items.filter((item) => !/reviewed|executed|complete/i.test(item.status)).length || 0),
          0,
        )}
        questionsWaiting={data.questions.filter((item) => item.status === "open").length}
        interns={readiness.map((intern) => ({
          id: intern.id,
          name: intern.name,
          detail: intern.onboarding
            ? `Onboarding ${intern.onboarding.percent}%`
            : "Onboarding package not assigned",
        }))}
        activity={[
          ...data.reviews.slice(0, 3).map((item) => ({
            id: item.id,
            title: `${item.internName} · ${item.title}`,
            detail: item.statusLabel,
            href: "#desk-reviews",
          })),
          ...data.questions.filter((item) => item.status === "open").slice(0, 2).map((item) => ({
            id: item.id,
            title: item.internName,
            detail: item.question,
            href: "#desk-reviews",
          })),
        ]}
      />
      <section id="onboarding" className="mb-4 grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-800">Coach the week</p>
            <h2 className="text-lg font-black text-slate-950">Intern time and onboarding</h2>
          </div>
        </div>
        <article className="overflow-hidden rounded-[2rem] border border-amber-100 bg-[#FAF6EE] p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-5">
          <h3 className="font-black text-slate-950">Creative freedom</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">Most meaningful intern work should be Explore or Guided. Planner holds the assignment. You coach the thinking.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            <li className="rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm"><p className="font-black text-emerald-900">Explore</p><p className="mt-1 text-sm font-semibold text-slate-600">Give the problem and the guardrails. The intern proposes the approach.</p></li>
            <li className="rounded-2xl border border-sky-100 bg-white p-3 shadow-sm"><p className="font-black text-sky-900">Guided</p><p className="mt-1 text-sm font-semibold text-slate-600">Give the objective and audience. The intern owns the creative execution.</p></li>
            <li className="rounded-2xl border border-amber-100 bg-white p-3 shadow-sm"><p className="font-black text-amber-950">Directed</p><p className="mt-1 text-sm font-semibold text-slate-600">Use only when compliance, a deadline, or an approved output must be followed exactly.</p></li>
          </ul>
        </article>
        {readiness.map((intern) => (
          <article key={intern.id} className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-800">Intern</p>
            <p className="mt-1 font-black text-slate-950">{intern.name}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {intern.onboarding ? `Onboarding ${intern.onboarding.percent}% · status only, no personnel files` : "Onboarding package not assigned"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/intern?view=${intern.id}`} className="inline-flex min-h-11 items-center rounded-2xl bg-[#166534] px-4 text-sm font-black !text-white transition hover:bg-[#102417]">Open portal</Link>
              <Link href={`/intern/time?view=${intern.id}`} className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-900 transition hover:border-emerald-400 hover:bg-emerald-50">Open time</Link>
            </div>
            {intern.onboarding?.items.map((item) => (
              <p key={item.title} className="mt-1 text-xs font-semibold text-slate-500">{item.title}: {item.status}</p>
            ))}
            {intern.userId ? (
              <form action={saveMessagingPermission} className="mt-3 grid gap-2 rounded-2xl border border-amber-100 bg-[#FAF6EE]/70 p-3 sm:grid-cols-3">
                <input type="hidden" name="userId" value={intern.userId} />
                <select name="level" className="min-h-11 rounded-xl border border-amber-100 bg-white px-2 text-sm font-semibold">
                  <option value="none">No community messaging</option>
                  <option value="view">View only</option>
                  <option value="reply_assigned">Reply to assigned</option>
                  <option value="initiate_approved">Start approved chats</option>
                  <option value="full">Full authorized messaging</option>
                </select>
                <select name="review" className="min-h-11 rounded-xl border border-amber-100 bg-white px-2 text-sm font-semibold">
                  <option value="all">All messages need review</option>
                  <option value="selected">Selected messages need review</option>
                  <option value="independent">Independent within guardrails</option>
                </select>
                <button className="min-h-11 rounded-2xl bg-[#166534] text-sm font-black !text-white transition hover:bg-[#102417]">Save messaging</button>
              </form>
            ) : null}
          </article>
        ))}
        {(waiting.data || []).map((week) => (
          <form key={`${week.intern_id}-${week.week_number}`} action={reviewInternWeek} className="grid gap-2 rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-3 shadow-sm sm:grid-cols-[1fr_auto_auto]">
            <input type="hidden" name="internId" value={String(week.intern_id)} />
            <input type="hidden" name="weekNumber" value={String(week.week_number)} />
            <p className="text-sm font-black text-slate-950">Week {String(week.week_number)} is ready for review</p>
            <button name="action" value="recommend" className="min-h-11 rounded-2xl bg-[#166534] px-3 text-sm font-black !text-white transition hover:bg-[#102417]">Recommend approval</button>
            <button name="action" value="return" className="min-h-11 rounded-2xl border border-amber-300 bg-amber-50 px-3 text-sm font-black text-amber-950">Return</button>
          </form>
        ))}
      </section>
      <div id="desk-reviews">
      <ManagerInternDashboard
        cards={data.cards}
        reviews={data.reviews}
        questions={data.questions}
        interns={data.interns}
        notices={data.notices}
        canEdit={!founderPersonal && canEditRequirements(kind)}
        canCeo={!founderPersonal && canGiveCeoReview(kind)}
        actorEmail={actor.email}
        notice={ok ? { kind: "ok", message: ok } : error ? { kind: "error", message: error } : null}
      />
      </div>
    </main>
  );
}
