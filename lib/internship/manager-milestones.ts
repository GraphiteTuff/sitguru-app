import type { InternshipMilestone, InternshipIntern } from "@/lib/internship/types";

export type ManagerMilestone = InternshipMilestone & {
  assignedInterns: Array<{ id: string; name: string; avatarUrl: string }>;
  displayStatus: "completed" | "blocked" | "in_progress" | "overdue" | "scheduled";
  applicableTo: "cohort" | "university";
};

export type ManagerMilestoneSummary = {
  rows: ManagerMilestone[];
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  blocked: number;
  scheduled: number;
  percentComplete: number | null;
  totalInterns: number;
};

const COMPLETED = new Set(["done", "complete", "completed", "approved"]);
const BLOCKED = new Set(["blocked", "paused", "on_hold"]);
const IN_PROGRESS = new Set(["in_progress", "active", "started"]);

export function milestoneDisplayStatus(milestone: InternshipMilestone, today: string): ManagerMilestone["displayStatus"] {
  const status = String(milestone.status || "scheduled").toLowerCase();
  if (COMPLETED.has(status)) return "completed";
  if (BLOCKED.has(status)) return "blocked";
  if (milestone.dueOn && milestone.dueOn < today) return "overdue";
  if (IN_PROGRESS.has(status)) return "in_progress";
  return "scheduled";
}

export function buildManagerMilestones(input: {
  milestones: InternshipMilestone[];
  interns: InternshipIntern[];
  assignedInternIds: string[];
  cohortId?: string;
  today: string;
}): ManagerMilestoneSummary {
  const assigned = new Set(input.assignedInternIds);
  const internRows = input.interns.filter(intern => assigned.has(intern.id));
  const rows: ManagerMilestone[] = input.milestones
    .filter(milestone => !input.cohortId || milestone.cohortId === input.cohortId)
    .map(milestone => {
      const affected = internRows.filter(intern =>
        !milestone.universityId || intern.universityId === milestone.universityId
      );
      return {
        ...milestone,
        assignedInterns: affected.map(intern => ({
          id: intern.id,
          name: intern.preferredName || intern.fullName,
          avatarUrl: intern.avatarUrl || "",
        })),
        applicableTo: milestone.universityId ? "university" as const : "cohort" as const,
        displayStatus: milestoneDisplayStatus(milestone, input.today),
      };
    })
    .filter(milestone => milestone.assignedInterns.length > 0)
    .sort((a, b) => (a.dueOn || "9999").localeCompare(b.dueOn || "9999"));

  const count = (status: ManagerMilestone["displayStatus"]) =>
    rows.filter(milestone => milestone.displayStatus === status).length;
  const completed = count("completed");
  return {
    rows,
    total: rows.length,
    completed,
    inProgress: count("in_progress"),
    overdue: count("overdue"),
    blocked: count("blocked"),
    scheduled: count("scheduled"),
    percentComplete: rows.length ? Math.round(completed / rows.length * 100) : null,
    totalInterns: internRows.length,
  };
}
