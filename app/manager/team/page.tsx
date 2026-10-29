import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadManagerDeskBundle } from "@/lib/admin/growth/manager-desk-data";
import { listGrowthTeamSummary } from "@/lib/admin/growth/team-summary";
import { buildManagerDeskReviewQueue } from "@/lib/admin/growth/manager-desk-model";
import ManagerTeamHome from "@/components/manager/ManagerTeamHome";

export const dynamic = "force-dynamic";

export default async function ManagerTeamPage() {
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

  return (
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
  );
}
