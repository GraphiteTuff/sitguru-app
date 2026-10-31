import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadManagerDeskBundle } from "@/lib/admin/growth/manager-desk-data";
import { listGrowthTeamSummary } from "@/lib/admin/growth/team-summary";
import { buildManagerDeskReviewQueue } from "@/lib/admin/growth/manager-desk-model";
import ManagerTeamHome from "@/components/manager/ManagerTeamHome";
import { escalateInternToSuperAdmin } from "@/lib/internship/onboarding-assign-actions";

export const dynamic = "force-dynamic";

export default async function ManagerTeamPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;

  const [desk, team] = await Promise.all([
    loadManagerDeskBundle(),
    listGrowthTeamSummary({
      actorUserId: access.actor.id,
      isSuperUser: access.actor.isSuperUser,
    }),
  ]);

  if (!desk) {
    return (
      <div className="mx-auto max-w-lg rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">My Team unavailable</h1>
      </div>
    );
  }

  const queue = buildManagerDeskReviewQueue(desk.reviews, desk.questions);
  const checkInCount = queue.find((item) => item.id === "weekly")?.count || 0;
  const hoursSubmissionCount = queue.find((item) => item.id === "hours")?.count || 0;
  const assignmentCount = queue.find((item) => item.id === "assignments")?.count || 0;
  const members =
    team.length > 0
      ? team
      : desk.cards.map((card) => ({
          id: card.id,
          name: card.name,
          status: card.paceTone,
          statusLabel: card.paceLabel,
          school: card.school,
          program: card.school,
          hoursSubmitted: card.summary.submittedHours || 0,
          hoursApproved: card.summary.approvedHours || 0,
          managerDeskHref: `/intern/manage?intern=${card.id}`,
          avatarUrl: card.avatarUrl || "",
        }));

  const params = searchParams ? await searchParams : {};
  const note = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const ok = note(params.ok);
  const error = note(params.error);

  return (
    <div className="space-y-4">
    {ok ? <p className="mx-auto max-w-3xl rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{ok}</p> : null}
    {error ? <p className="mx-auto max-w-3xl rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p> : null}
    <ManagerTeamHome
      team={members}
      reviewCount={checkInCount + hoursSubmissionCount + assignmentCount}
      checkInCount={checkInCount}
      assignmentCount={assignmentCount}
      hoursSubmissionCount={hoursSubmissionCount}
      teamHoursThisWeek={Math.round(
        desk.cards.reduce((sum, card) => sum + (card.summary.loggedThisWeek || 0), 0) * 10,
      ) / 10}
      teamHoursPlanned={Math.round(
        desk.cards.reduce((sum, card) => sum + (card.summary.plannedWeeklyHours || 0), 0) * 10,
      ) / 10}
      milestones={desk.cards.slice(0, 4).map((card) => ({
        title: card.milestone || "Milestone",
        owner: card.name,
        when: card.nextDeadline || "Soon",
      }))}
      checkIns={desk.reviews
        .filter((item) => item.targetType === "weekly")
        .slice(0, 4)
        .map((item) => ({
          name: item.internName,
          detail: `${item.title} · ${item.weekLabel}`,
        }))}
      assignments={desk.reviews
        .filter((item) => item.targetType === "task" || item.targetType === "content")
        .slice(0, 4)
        .map((item) => ({
          title: item.title,
          owner: item.internName,
          status: item.statusLabel,
        }))}
      messages={desk.messages.slice(0, 4).map((item) => ({
        author: item.author,
        preview: item.preview,
        when: "Recently",
      }))}
    />
    <form action={escalateInternToSuperAdmin} className="mx-auto max-w-3xl rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Escalate to Super Admin</h2>
      <p className="mt-1 text-sm font-semibold text-slate-600">
        Use this for an administrative issue. It does not change onboarding, university requirements, or the assigned manager.
      </p>
      <label className="mt-3 block text-sm font-bold text-slate-700">
        Intern
        <select name="internId" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-base">
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm font-bold text-slate-700">
        Note
        <textarea name="note" required minLength={8} className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-base" />
      </label>
      <button className="mt-3 inline-flex min-h-11 items-center rounded-full border border-emerald-200 px-4 text-sm font-black text-[#0D5C3A]" type="submit">
        Send to Super Admin
      </button>
    </form>
    </div>
  );
}
