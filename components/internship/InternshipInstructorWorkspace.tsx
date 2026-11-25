import { GROWTH_PILLARS } from "@/lib/internship/university-syllabus";
import { listCohortMilestones } from "@/lib/internship/queries";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { publishInternAnnouncement } from "@/lib/internship/announcement-actions";
import { getAdminIdentity } from "@/lib/admin/access";
import { canGiveCeoReview, internshipActorKind } from "@/lib/internship/manager-access";
import { loadManagerDashboard } from "@/lib/internship/manager-data";
import { reviewPortalSubmission } from "@/lib/internship/portal-actions";
import type { ManagerReviewItem } from "@/lib/internship/manager-dashboard";

const baseCard = "min-w-0 rounded-2xl border border-emerald-950/10 bg-white p-4 sm:p-6";
const button = "inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-800 px-4 py-2 text-center text-sm font-bold text-emerald-900 hover:bg-emerald-50";

function reviewLink(item: ManagerReviewItem) {
  if (item.targetType === "task") return `/manager/assignments/${encodeURIComponent(item.id)}`;
  if (item.targetType === "weekly") return "/manager/check-ins";
  if (item.targetType === "content") return "/manager/content";
  return "/intern/manage?tab=reviews";
}

function ReviewControls({ item, returnTo, canCeo }: {
  item: ManagerReviewItem;
  returnTo: string;
  canCeo: boolean;
}) {
  if (item.targetType === "hours" || item.targetType === "content" || (item.ceo && !canCeo)) return null;

  return (
    <form action={reviewPortalSubmission} className="mt-3 space-y-2">
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="internId" value={item.internId} />
      <input type="hidden" name="targetId" value={item.id} />
      <input type="hidden" name="targetType" value={item.targetType} />
      <input type="hidden" name="presentedAt" value={item.submittedAt} />
      <label className="block text-sm font-semibold text-slate-800">
        Feedback
        <textarea name="comment" maxLength={2000} rows={2} className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-base" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button name="reviewAction" value={item.ceo ? "ceo_approve" : "approve"} type="submit" className={button}>Approve</button>
        <button name="reviewAction" value={item.ceo ? "ceo_request_changes" : "request_changes"} type="submit" className={button}>Request revisions</button>
        {!item.ceo ? <button name="reviewAction" value="escalate" type="submit" className={button}>Escalate to supervisor</button> : null}
      </div>
    </form>
  );
}

export default async function InternshipInstructorWorkspace({ mode, searchParams, speedReview = false }: {
  mode: "manager" | "admin";
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  speedReview?: boolean;
}) {
  const actor = await getAdminIdentity();
  const kind = internshipActorKind({ role: actor?.role, isSuperUser: actor?.isSuperUser });
  if (!actor || (kind !== "manager" && kind !== "supervisor") ||
    (mode === "admin" && (!actor.canAccessAdmin || kind !== "supervisor"))) {
    return <p className={baseCard}>Instructor access required.</p>;
  }

  const data = await loadManagerDashboard({ actorKind: kind, actorUserId: actor.id });
  const flash = searchParams ? await searchParams : {};
  const canCeo = canGiveCeoReview(kind);
  const returnTo = speedReview ? "/manager/speed-review" : mode === "admin" ? "/admin/internship/instructor" : "/manager/instructor";
  const parameter = (name: string) => {
    const value = flash[name];
    return (Array.isArray(value) ? value[0] : value) || "";
  };
  const pendingAssignments = data.reviews.filter((item) => item.targetType === "task");
  const cohortForIntern = new Map(data.interns.map((intern) => [intern.id, intern.cohortId]));
  const cohortIds = [...new Set(data.interns.map((intern) => intern.cohortId).filter(Boolean))];
  const [cohorts, milestones] = speedReview && cohortIds.length
    ? await Promise.all([
      supabaseAdmin.from("internship_cohorts").select("id,name").in("id", cohortIds),
      Promise.all(cohortIds.map((id) => listCohortMilestones(id))),
    ])
    : [{ data: [] }, []];
  const activeMilestones = new Set(pendingAssignments.map((item) => item.milestoneId).filter(Boolean));
  const filters = [
    { key: "intern", label: "Intern", options: data.cards.map(({ id, name }) => ({ id, name })) },
    { key: "cohort", label: "Cohort", options: cohorts.data || [] },
    { key: "assignment", label: "Assignment", options: pendingAssignments.map(({ id, title }) => ({ id, name: title })) },
    { key: "milestone", label: "Milestone", options: milestones.flat().filter((item) => activeMilestones.has(item.id)).map(({ id, title }) => ({ id, name: title })) },
    { key: "pillar", label: "Growth pillar", options: GROWTH_PILLARS.map(({ id, label }) => ({ id, name: label })) },
  ];
  const matches = (name: string, value?: string | null) => !parameter(name) || parameter(name) === value;
  const queue = speedReview ? pendingAssignments.filter((item) =>
    matches("intern", item.internId) && matches("cohort", cohortForIntern.get(item.internId)) &&
    matches("assignment", item.id) && matches("milestone", item.milestoneId) && matches("pillar", item.pillarId),
  ) : data.reviews;
  const destinations = [
    ["/manager/assignments?create=true", "Create assignment"],
    ["/manager/assignments", "Manage assignments"],
    ["/manager/speed-review", "SitGuru Speed Review"],
    ["/manager/milestones", "Modules & milestones"],
    ["/manager/calendar", "Calendar & deadlines"],
    ["/manager/check-ins", "Weekly check-ins"],
    ["/intern/manage?tab=reviews", "Intern Team Desk & hours"],
    ["/manager/results", "Growth results"],
    ...(mode === "admin" ? [["/admin/internship/playbook", "Official syllabus"]] : []),
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-3 pb-8 sm:px-5">
      <header className="rounded-3xl bg-[#10583f] p-5 sm:p-7" data-brand-green>
        <h1 className="text-2xl font-black !text-white sm:text-3xl">{speedReview ? "SitGuru Speed Review" : "Instructor & Supervisor Center"}</h1>
        <p className="mt-2 text-sm !text-white">{speedReview ? "Pending assignment submissions" : mode === "admin" ? "Internship oversight and employer review" : "Assigned interns, coursework, and submissions"}</p>
      </header>
      {parameter("error") ? <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-900">{parameter("error")}</p> : null}
      {parameter("ok") ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">{parameter("ok")}</p> : null}
      {!speedReview ? <nav aria-label="Instructor tools" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {destinations.map(([href, label]) => <Link key={href} href={href} className={`bg-white ${button}`}>{label}</Link>)}
      </nav> : (
        <form action="/manager/speed-review" className={baseCard}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filters.map((filter) => (
              <label key={filter.key} className="block min-w-0 text-sm font-semibold text-slate-800">
                {filter.label}
                <select name={filter.key} defaultValue={parameter(filter.key)} className="mt-1 block min-h-12 w-full rounded-xl border border-slate-300 px-3 text-base">
                  <option value="">All</option>
                  {filter.options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                </select>
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={button}>Filter submissions</button>
            <Link href="/manager/speed-review" className={button}>Clear filters</Link>
          </div>
        </form>
      )}
      <section aria-labelledby="instructor-review-heading" className={baseCard}>
        <h2 id="instructor-review-heading" className="text-xl font-black text-emerald-950">Pending reviews</h2>
        {queue.length ? (
          <ul className="mt-3 grid gap-3 xl:grid-cols-2">
            {queue.map((item) => (
              <li key={`${item.targetType}-${item.id}`} className="min-w-0 rounded-xl border border-slate-200 p-4">
                <h3 className="break-words font-bold text-slate-950">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-700">{item.internName} · {item.statusLabel}</p>
                <Link href={reviewLink(item)} className="inline-flex min-h-12 items-center text-sm font-bold text-emerald-900 hover:underline">
                  {item.targetType === "hours" ? "Open hours review" : "Open submission"}
                </Link>
                <ReviewControls item={item} canCeo={canCeo} returnTo={returnTo} />
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-slate-600">No submissions waiting for review.</p>}
      </section>
      {!speedReview && data.cards.length ? (
        <section aria-labelledby="instructor-announcement-heading" className={baseCard}>
          <h2 id="instructor-announcement-heading" className="text-xl font-black text-emerald-950">Publish an announcement</h2>
          <form action={publishInternAnnouncement} className="mt-3 space-y-3">
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="requestId" value={randomUUID()} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block min-w-0 text-sm font-semibold text-slate-800">
                Intern
                <select name="internId" required defaultValue="" className="mt-1 block min-h-12 w-full rounded-xl border border-slate-300 px-3 text-base">
                  <option value="" disabled>Choose an intern</option>
                  {data.cards.map((intern) => <option key={intern.id} value={intern.id}>{intern.name}</option>)}
                </select>
              </label>
              <label className="block min-w-0 text-sm font-semibold text-slate-800">
                Title
                <input name="title" required maxLength={140} className="mt-1 block min-h-12 w-full rounded-xl border border-slate-300 px-3 text-base" />
              </label>
            </div>
            <label className="block text-sm font-semibold text-slate-800">
              Announcement
              <textarea name="body" required maxLength={4000} rows={4} className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-base" />
            </label>
            <button type="submit" className={button}>Publish announcement</button>
          </form>
        </section>
      ) : null}
      {!speedReview ? <section aria-labelledby="instructor-roster-heading" className={baseCard}>
        <h2 id="instructor-roster-heading" className="text-xl font-black text-emerald-950">Intern progress</h2>
        {data.cards.length ? (
          <ul className="mt-3 divide-y divide-slate-100">
            {data.cards.map((intern) => (
              <li key={intern.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="break-words font-bold text-slate-950">{intern.name}</p>
                  <p className="text-sm text-slate-700">{intern.summary.approvedHours} hours approved · {intern.paceLabel}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mode === "admin" ? <Link href={`/admin/internship/interns/${intern.id}`} className={button}>Intern record</Link> : null}
                  <Link href={`/intern?view=${encodeURIComponent(intern.id)}`} className={button}>Student preview</Link>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-slate-600">No active interns assigned to this workspace.</p>}
      </section> : null}
    </div>
  );
}
