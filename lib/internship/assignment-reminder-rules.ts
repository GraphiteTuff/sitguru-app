/**
 * Assignment follow-up settings are SitGuru-managed, not Microsoft Planner alarms.
 * Planner separately offers its own due-date/assignment notifications when a task
 * is assigned to a Microsoft 365 user who enables them.
 */
export const REMINDER_DAY_OPTIONS = [7, 3, 1, 0] as const;
export type ReminderDay = (typeof REMINDER_DAY_OPTIONS)[number];

export type AssignmentReminderSettings = {
  enabled: boolean;
  daysBefore: ReminderDay[];
  notifyIntern: boolean;
  notifyManager: boolean;
  updatedAt?: string;
  updatedBy?: string;
};

export const DEFAULT_ASSIGNMENT_REMINDERS: AssignmentReminderSettings = {
  enabled: false,
  daysBefore: [3, 1, 0],
  notifyIntern: true,
  notifyManager: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function parseAssignmentReminderSettings(briefPayload: unknown): AssignmentReminderSettings {
  const raw = isRecord(briefPayload) && isRecord(briefPayload.managerAutomation)
    ? briefPayload.managerAutomation : {};
  const rawDays = Array.isArray(raw.daysBefore) ? raw.daysBefore : null;
  const days = rawDays
    ? REMINDER_DAY_OPTIONS.filter((day) => rawDays.includes(day))
    : DEFAULT_ASSIGNMENT_REMINDERS.daysBefore;
  return {
    enabled: raw.enabled === true,
    daysBefore: [...days],
    notifyIntern: raw.notifyIntern !== false,
    notifyManager: raw.notifyManager !== false,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    updatedBy: typeof raw.updatedBy === "string" ? raw.updatedBy : undefined,
  };
}

export function safeReminderDayValues(values: unknown[]): ReminderDay[] {
  const parsed = new Set(values.map((value) => Number(value)));
  return REMINDER_DAY_OPTIONS.filter((day) => parsed.has(day));
}

/** UTC calendar arithmetic; a daily cron runs at 14:00 UTC. */
export function daysUntilDue(dueOn: string, today: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueOn) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return null;
  const due = Date.parse(`${dueOn}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(due) || !Number.isFinite(now)) return null;
  if (new Date(due).toISOString().slice(0, 10) !== dueOn || new Date(now).toISOString().slice(0, 10) !== today) return null;
  return Math.round((due - now) / 86_400_000);
}

export function reminderForDate(input: {
  dueOn: string;
  today: string;
  status: string;
  settings: AssignmentReminderSettings;
}): ReminderDay | null {
  if (!input.settings.enabled || !input.settings.daysBefore.length) return null;
  if (!input.settings.notifyIntern && !input.settings.notifyManager) return null;
  if (!["todo", "in_progress", "revision_requested"].includes(input.status)) return null;
  const until = daysUntilDue(input.dueOn, input.today);
  return until !== null && input.settings.daysBefore.includes(until as ReminderDay)
    ? (until as ReminderDay) : null;
}

export function reminderMessage(daysBefore: ReminderDay) {
  if (daysBefore === 0) return "due today";
  if (daysBefore === 1) return "due tomorrow";
  return `due in ${daysBefore} days`;
}
