import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadManagerDeskBundle } from "@/lib/admin/growth/manager-desk-data";
import { listGrowthTeamSummary } from "@/lib/admin/growth/team-summary";
import { buildManagerDeskReviewQueue } from "@/lib/admin/growth/manager-desk-model";
import ManagerGrowthWorkspaceHome from "@/components/manager/ManagerGrowthWorkspaceHome";

export const dynamic = "force-dynamic";

export default async function ManagerGrowthWorkspacePage() {
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
        <h1 className="text-2xl font-black text-slate-950">Growth Workspace unavailable</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Sign in with a Social Media & Community Growth Manager account to open this desk.
        </p>
      </div>
    );
  }

  const queue = buildManagerDeskReviewQueue(desk.reviews, desk.questions);
  const checkInCount = queue.find((item) => item.id === "weekly")?.count || 0;
  const hoursSubmissionCount = queue.find((item) => item.id === "hours")?.count || 0;
  const assignmentCount = queue.find((item) => item.id === "assignments")?.count || 0;
  const reviewCount = checkInCount + hoursSubmissionCount + assignmentCount;

  const teamHoursThisWeek = desk.cards.reduce(
    (sum, card) => sum + (card.summary.loggedThisWeek || 0),
    0,
  );
  const teamHoursPlanned = desk.cards.reduce(
    (sum, card) => sum + (card.summary.plannedWeeklyHours || 0),
    0,
  );

  const deadlines = [
    ...desk.cards
      .filter((card) => card.nextDeadline)
      .slice(0, 3)
      .map((card) => ({
        title: `${card.name} · ${card.milestone || "Milestone"}`,
        when: card.nextDeadline,
        kind: "Milestone",
      })),
    ...(reviewCount
      ? [
          {
            title: "Weekly check-ins",
            when: "This week",
            kind: "Check-in",
          },
        ]
      : []),
  ];

  const activity = [
    ...desk.reviews.slice(0, 3).map((item) => ({
      title: `${item.internName} · ${item.title}`,
      detail: `${item.statusLabel} · ${item.weekLabel}`,
    })),
    ...desk.questions.slice(0, 2).map((item) => ({
      title: `Help from ${item.internName}`,
      detail: item.question,
    })),
  ];

  return (
    <ManagerGrowthWorkspaceHome
      firstName={desk.firstName}
      team={
        team.length
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
            }))
      }
      initiatives={desk.initiatives}
      reviewCount={reviewCount}
      checkInCount={checkInCount}
      assignmentCount={assignmentCount}
      hoursSubmissionCount={hoursSubmissionCount}
      teamHoursThisWeek={Math.round(teamHoursThisWeek * 10) / 10}
      teamHoursPlanned={Math.round(teamHoursPlanned * 10) / 10}
      deadlines={deadlines}
      activity={activity}
    />
  );
}
