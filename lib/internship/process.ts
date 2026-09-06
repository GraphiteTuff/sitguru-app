import {
  capstoneWeekForNumber,
  type CapstoneWeek,
} from "@/lib/internship/final-project";
import type { InternshipWorkspaceData } from "@/lib/internship/types";

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function internshipWeekNumber(startDate?: string | null, today = new Date()) {
  if (!startDate) return 1;
  const start = startOfDay(new Date(`${startDate}T12:00:00`));
  if (Number.isNaN(start.getTime())) return 1;
  const now = startOfDay(today);
  const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
  if (diff < 0) return 1;
  return Math.min(16, Math.floor(diff / 7) + 1);
}

export function currentCapstoneWeek(startDate?: string | null, today = new Date()): CapstoneWeek {
  return capstoneWeekForNumber(internshipWeekNumber(startDate, today));
}

export function currentSemesterDeliverable(startDate?: string | null, today = new Date()) {
  const week = currentCapstoneWeek(startDate, today);
  return {
    id: week.section,
    timing: `Week ${week.week}`,
    title: week.work,
    demonstrates: week.buildsToward,
  };
}

export function buildInternshipProcess(data: InternshipWorkspaceData, today = new Date()) {
  const startDate =
    data.intern.academicStartDate || data.cohort?.startsOn || null;
  const deliverable = currentSemesterDeliverable(startDate, today);
  const pendingApprovals =
    data.tasks.filter((row) => row.status === "submitted").length +
    data.content.filter((row) => row.status === "submitted").length;
  const unverifiedMetrics = (data.metrics || []).filter((row) => !row.isVerified).length;
  const verifiedMetrics = (data.metrics || []).filter((row) => row.isVerified).length;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekKey = weekStart.toISOString().slice(0, 10);
  const weeklyThisWeek = (data.weeklyReviews || []).some((row) => row.weekOf >= weekKey);
  const relevantMilestones = (data.milestones || []).filter(
    (row) => !row.universityId || row.universityId === data.intern.universityId,
  );

  return {
    weekNumber: internshipWeekNumber(startDate, today),
    deliverable,
    pendingApprovals,
    unverifiedMetrics,
    verifiedMetrics,
    smartGoalCount: (data.smartGoals || []).length,
    experimentCount: (data.experiments || []).length,
    campaignCount: (data.campaigns || []).length,
    weeklyThisWeek,
    toolsGranted: (data.accessGrants || []).filter((row) => row.granted).length,
    relevantMilestones,
  };
}
