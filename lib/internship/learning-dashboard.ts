import { assignmentIsVisibleToIntern, isAssignmentDate, readAssignmentBrief } from "@/lib/internship/manager-assignment";
import type { InternshipTask, InternshipWorkspaceData } from "@/lib/internship/types";
import { GROWTH_PILLARS } from "@/lib/internship/university-syllabus";

type GrowthPillar = (typeof GROWTH_PILLARS)[number]["id"];

const legacyCategoryPillars: ReadonlyMap<string, GrowthPillar> = new Map([
  ["Community Outreach", "community"],
  ["Events", "community"],
  ["Ambassador Program", "community"],
  ["Campus Growth", "community"],
  ["Content", "social"],
  ["Social Media", "social"],
]);

const completed = new Set(["approved", "complete", "completed", "done"]);
const closed = new Set(["cancelled", "canceled", "not_accepted", "excused"]);
const finalReviewStages = new Set(["approved_complete", "ceo_approved"]);

function assignmentComplete(task: InternshipTask) {
  if (task.reviewStage === "submitted_to_jason" || task.reviewStage === "ceo_review_required") {
    return false;
  }
  return completed.has(task.status) || task.supervisorApproved || finalReviewStages.has(task.reviewStage || "");
}

export function buildLearningDashboard(workspace: InternshipWorkspaceData, today: string) {
  const assignments = workspace.tasks.filter(
    (task) => task.internId === workspace.intern.id && assignmentIsVisibleToIntern(task.status),
  );
  const categorized = assignments.filter((task) => !closed.has(task.status));
  const pillars = GROWTH_PILLARS.map((pillar) => {
    const tasks = categorized.filter(
      (task) => legacyCategoryPillars.get(readAssignmentBrief(task.briefPayload).category || "") === pillar.id,
    );
    return { ...pillar, assigned: tasks.length, completed: tasks.filter(assignmentComplete).length };
  });
  const upcoming = [
    ...assignments
      .filter((task): task is InternshipTask & { dueOn: string } => Boolean(
        task.dueOn && isAssignmentDate(task.dueOn) && task.dueOn >= today &&
        !closed.has(task.status) && !assignmentComplete(task),
      ))
      .map((task) => ({ id: task.id, type: "Assignment", title: task.title, date: task.dueOn, href: `/intern/assignments/${encodeURIComponent(task.id)}` })),
    ...workspace.milestones
      .filter((milestone) => isAssignmentDate(milestone.dueOn) && milestone.dueOn >= today &&
        (!milestone.universityId || milestone.universityId === workspace.intern.universityId) &&
        !closed.has(milestone.status) && !completed.has(milestone.status))
      .map((milestone) => ({ id: milestone.id, type: "Milestone", title: milestone.title, date: milestone.dueOn, href: "/intern/milestones" })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)).slice(0, 5);

  return {
    assignments,
    pillars,
    unclassified: categorized.length - pillars.reduce((total, pillar) => total + pillar.assigned, 0),
    upcoming,
  };
}
