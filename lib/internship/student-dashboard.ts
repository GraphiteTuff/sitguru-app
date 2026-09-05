import type { InternshipWorkspaceData } from "@/lib/internship/types";

export type InternCalendarEvent = {
  id: string;
  date: string;
  title: string;
  kind: "task" | "content" | "milestone" | "checkin";
  status?: string;
};

function dateKey(value: string | null | undefined) {
  const raw = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

export function internCalendarEvents(
  data: InternshipWorkspaceData,
): InternCalendarEvent[] {
  const events: InternCalendarEvent[] = [];

  for (const task of data.tasks || []) {
    const date = dateKey(task.dueOn);
    if (!date) continue;
    events.push({
      id: `task-${task.id}`,
      date,
      title: task.title,
      kind: "task",
      status: task.status,
    });
  }

  for (const item of data.content || []) {
    const date = dateKey(item.dueOn);
    if (!date) continue;
    events.push({
      id: `content-${item.id}`,
      date,
      title: item.title,
      kind: "content",
      status: item.status,
    });
  }

  for (const milestone of data.milestones || []) {
    const date = dateKey(milestone.dueOn);
    if (!date) continue;
    if (milestone.universityId && milestone.universityId !== data.intern.universityId) {
      continue;
    }
    events.push({
      id: `milestone-${milestone.id}`,
      date,
      title: milestone.title,
      kind: "milestone",
      status: milestone.status,
    });
  }

  for (const review of data.weeklyReviews || []) {
    const date = dateKey(review.weekOf);
    if (!date) continue;
    events.push({
      id: `checkin-${review.id}`,
      date,
      title: "Weekly check-in",
      kind: "checkin",
      status: review.upcomingApproved ? "approved" : "logged",
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export function internHourPacing(input: {
  requiredHours: number | null;
  startDate: string | null;
  endDate: string | null;
  today?: Date;
}) {
  const requiredHours = Number(input.requiredHours);
  const start = input.startDate ? new Date(`${input.startDate}T12:00:00`) : null;
  const end = input.endDate ? new Date(`${input.endDate}T12:00:00`) : null;
  const today = input.today || new Date();
  const todayNoon = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    12,
  );

  if (!Number.isFinite(requiredHours) || requiredHours <= 0 || !start || !end) {
    return null;
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }

  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const remainingDays = Math.max(
    0,
    Math.round((end.getTime() - todayNoon.getTime()) / 86400000),
  );
  const elapsedDays = Math.max(0, totalDays - remainingDays);
  const weeksRemaining = remainingDays / 7;
  const totalWeeks = totalDays / 7;
  const requiredWeeklyPace = requiredHours / Math.max(totalWeeks, 1 / 7);

  return {
    requiredHours,
    weeksRemaining: Math.round(weeksRemaining * 10) / 10,
    remainingDays,
    elapsedDays,
    requiredWeeklyPace: Math.round(requiredWeeklyPace * 10) / 10,
    status:
      remainingDays <= 0
        ? "window_closed"
        : elapsedDays <= 7
          ? "getting_started"
          : "in_progress",
  };
}

export function internFirstName(fullName: string) {
  return String(fullName || "").trim().split(/\s+/)[0] || "there";
}
