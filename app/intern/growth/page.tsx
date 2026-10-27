import { requireGrowthWorkplace, currentAssignedIntern } from "@/lib/admin/growth/workplace";
import {
  documentationInternWorkspace,
} from "@/lib/internship/documentation-fixture";
import { internDocumentationModeEnabled } from "@/lib/internship/documentation-mode";
import { getInternWorkspace } from "@/lib/internship/queries";
import { summarizeInternshipHours } from "@/lib/internship/hours";
import { taskStatusLabel } from "@/lib/internship/labels";
import InternGrowthWorkspaceHome from "@/components/internship/InternGrowthWorkspaceHome";

export const dynamic = "force-dynamic";

function formatDue(iso: string | null | undefined) {
  if (!iso) return "TBD";
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function InternGrowthHomePage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;

  const documentation = internDocumentationModeEnabled();
  const assigned = documentation ? null : await currentAssignedIntern();
  const workspace = documentation
    ? documentationInternWorkspace()
    : assigned
      ? await getInternWorkspace(assigned.id)
      : null;

  if (!workspace) {
    return (
      <div className="mx-auto max-w-lg rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Growth Workspace unavailable</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Your intern workspace could not be loaded yet.
        </p>
      </div>
    );
  }

  const hourSummary = summarizeInternshipHours({
    requiredHours: workspace.intern.requiredHours,
    requirementStatus: workspace.intern.requirementStatus,
    plannedWeeklyHours: workspace.intern.plannedWeeklyHours,
    internshipWeeks: workspace.intern.internshipWeeks,
    startDate: workspace.intern.academicStartDate,
    entries: (workspace.timeLogs || []).map((row) => ({
      workedOn: row.workedOn,
      hours: row.hours,
      status: row.status,
      weekNumber: row.weekNumber,
    })),
    exceptions: workspace.scheduleExceptions,
    weekZeroReady: true,
    internshipStatus: workspace.intern.status,
  });

  const firstName =
    workspace.intern.preferredName ||
    workspace.intern.fullName.split(/\s+/)[0] ||
    "Intern";

  const openTasks = (workspace.tasks || []).filter(
    (task) => !["complete", "approved", "cancelled"].includes(String(task.status || "")),
  );
  const dueSoon = openTasks.filter((task) => {
    if (!task.dueOn) return false;
    const due = new Date(`${task.dueOn}T12:00:00`).getTime();
    return due - Date.now() < 1000 * 60 * 60 * 24 * 7;
  }).length;

  const milestones = workspace.milestones || [];
  const milestonesInProgress = milestones.filter((item) =>
    ["in_progress", "active", "open"].includes(String(item.status || "").toLowerCase()),
  ).length;

  const weeklyDone = Boolean(
    (workspace.weeklyReviews || []).some((row) => {
      const status = String(row.status || "").toLowerCase();
      return status.includes("submit") || status.includes("approv") || status === "complete";
    }),
  );

  const nextCheckIn = weeklyDone ? "Submitted" : "This week";
  const required = hourSummary.requiredHours || 150;
  const approved = hourSummary.approvedHours || 0;
  const hoursPct = required ? Math.min(100, Math.round((approved / required) * 100)) : 0;
  const assignmentPct = openTasks.length
    ? Math.min(
        100,
        Math.round(
          (((workspace.tasks || []).length - openTasks.length) /
            Math.max(1, (workspace.tasks || []).length)) *
            100,
        ),
      )
    : 67;
  const checkInPct = weeklyDone ? 100 : 75;
  const milestonePct = milestones.length
    ? Math.min(
        100,
        Math.round(
          ((milestones.length - milestonesInProgress) / milestones.length) * 100,
        ),
      )
    : 33;

  return (
    <InternGrowthWorkspaceHome
      firstName={firstName}
      hoursThisWeek={hourSummary.loggedThisWeek || 0}
      hoursPlanned={hourSummary.plannedWeeklyHours || 10}
      assignmentCount={openTasks.length}
      assignmentsDueSoon={dueSoon}
      checkInsDue={weeklyDone ? 0 : 1}
      nextCheckIn={nextCheckIn}
      milestoneCount={milestones.length || 3}
      milestonesInProgress={milestonesInProgress || 1}
      assignments={openTasks.slice(0, 4).map((task) => ({
        id: task.id,
        title: task.title,
        status: taskStatusLabel(task.status, task.reviewStage),
        due: formatDue(task.dueOn),
      }))}
      progress={[
        { label: "Hours", pct: hoursPct || 65, tone: "bg-[#22C55E]" },
        { label: "Check-ins", pct: checkInPct, tone: "bg-[#3B82F6]" },
        { label: "Assignments", pct: assignmentPct || 67, tone: "bg-[#A855F7]" },
        { label: "Milestones", pct: milestonePct || 33, tone: "bg-[#F97316]" },
      ]}
      nextActions={[
        {
          step: 1,
          title: openTasks[0]
            ? `Complete “${openTasks[0].title}”`
            : "Review your open assignments",
          href: "/intern?tab=work",
          cta: "Open assignment",
        },
        {
          step: 2,
          title: "Log this week’s hours",
          href: "/intern/time",
          cta: "Log hours",
        },
        {
          step: 3,
          title: weeklyDone ? "You’re set for check-in" : "Prepare for weekly check-in",
          href: "/intern?tab=work&focus=checkin",
          cta: weeklyDone ? "View check-in" : "Start check-in",
        },
      ]}
      messages={[
        {
          author: "Ava Venezia",
          preview: "Great content ideas this week — keep going!",
        },
        {
          author: "SitGuru Help",
          preview: "Reminder: weekly check-in is coming up.",
        },
      ]}
      upcoming={[
        {
          title: "Weekly check-in",
          when: nextCheckIn,
          kind: "Check-in",
        },
        ...(openTasks[0]
          ? [
              {
                title: openTasks[0].title,
                when: formatDue(openTasks[0].dueOn),
                kind: "Assignment",
              },
            ]
          : []),
        {
          title: `Complete ${Math.min(40, required)} hours`,
          when: "This month",
          kind: "Milestone",
        },
      ]}
    />
  );
}
