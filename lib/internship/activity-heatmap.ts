export type ActivityHeatmapDay = {
  date: string;
  hours: number;
  approvedHours: number;
  submissions: number;
};

export type ActivityHeatmap = {
  days: ActivityHeatmapDay[];
  totalHours: number;
  approvedHours: number;
  submissions: number;
  activeDays: number;
};

/** Business dates use New York, independent of the server/browser timezone. */
export function activityDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

export function buildActivityHeatmap(input: {
  logs?: Array<{ workedOn: string; hours: number; status: string }>;
  submissions?: Array<{ submittedAt?: string | null }>;
  today?: string;
  weeks?: number;
}): ActivityHeatmap {
  const today = activityDate(input.today || new Date().toISOString());
  if (!today) throw new Error("A valid heatmap date is required.");
  const weeks = Math.max(1, Math.min(26, Math.floor(input.weeks || 8)));
  const end = new Date(`${today}T12:00:00Z`);
  // Full Monday–Sunday columns, ending with the current week.
  end.setUTCDate(end.getUTCDate() + (6 - (end.getUTCDay() + 6) % 7));
  const days: ActivityHeatmapDay[] = Array.from({ length: weeks * 7 }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - (weeks * 7 - 1) + index);
    return { date: date.toISOString().slice(0, 10), hours: 0, approvedHours: 0, submissions: 0 };
  });
  const byDate = new Map(days.map((day) => [day.date, day]));
  for (const log of input.logs || []) {
    // Drafts and returned hours are excluded from performance reporting.
    if (!["submitted", "ava_approved", "supervisor_verified"].includes(log.status)) continue;
    const day = byDate.get(activityDate(log.workedOn));
    if (!day || day.date > today || !Number.isFinite(log.hours) || log.hours <= 0) continue;
    day.hours += log.hours;
    if (log.status !== "submitted") day.approvedHours += log.hours;
  }
  for (const submission of input.submissions || []) {
    if (!submission.submittedAt) continue;
    const day = byDate.get(activityDate(submission.submittedAt));
    if (day && day.date <= today) day.submissions += 1;
  }
  const round = (value: number) => Math.round(value * 100) / 100;
  for (const day of days) {
    day.hours = round(day.hours);
    day.approvedHours = round(day.approvedHours);
  }
  return {
    days,
    totalHours: round(days.reduce((sum, day) => sum + day.hours, 0)),
    approvedHours: round(days.reduce((sum, day) => sum + day.approvedHours, 0)),
    submissions: days.reduce((sum, day) => sum + day.submissions, 0),
    activeDays: days.filter((day) => day.hours > 0 || day.submissions > 0).length,
  };
}
