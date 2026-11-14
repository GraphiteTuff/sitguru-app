/**
 * Each intern's SitGuru calendar derives deadline entries from their existing
 * assigned internship_tasks. Planner is a mirror, not a second calendar source.
 * One task ID always corresponds to exactly one deadline entry; changing an
 * assignment due date automatically moves it without a separate sync job.
 */
import { assignmentIsVisibleToIntern } from "@/lib/internship/manager-assignment";
import type { InternshipTask } from "@/lib/internship/types";
import type { ManagerScheduleItem } from "@/lib/internship/manager-dashboard";

export function buildInternAssignmentCalendar(input: {
  internId: string;
  tasks: InternshipTask[];
}): ManagerScheduleItem[] {
  const seen = new Set<string>();
  const entries: ManagerScheduleItem[] = [];
  for (const task of input.tasks) {
    if (!task.id || task.internId !== input.internId || seen.has(task.id)) continue;
    if (!assignmentIsVisibleToIntern(task.status)) continue;
    const dueDate = String(task.dueOn || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) continue;
    const parsed = new Date(`${dueDate}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== dueDate) continue;
    seen.add(task.id);
    entries.push({
      id: `intern-task-${task.id}`,
      date: dueDate,
      title: task.title,
      kind: "assignment",
      time: "",
      href: `/intern/assignments/${encodeURIComponent(task.id)}`,
    });
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}
