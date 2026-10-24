import { internshipWeekNumber } from "@/lib/internship/process";

export const HOUR_ENTRY_STATUSES = [
  "draft",
  "submitted",
  "changes_requested",
  "ava_approved",
  "supervisor_verified",
] as const;

export type HourEntryStatus = (typeof HOUR_ENTRY_STATUSES)[number];

export type HourLogEntry = {
  id?: string;
  workedOn: string;
  hours: number;
  status: HourEntryStatus | string;
  weekNumber?: number | null;
};

export type ScheduleException = {
  weekNumber: number;
  plannedHours: number;
};

export type HourSummary = {
  pendingRequirement: boolean;
  pendingMessage: string;
  weekNumber: number;
  internshipWeeks: number | null;
  weekLabel: string;
  plannedWeeklyHours: number | null;
  loggedThisWeek: number;
  submittedHours: number;
  approvedHours: number;
  verifiedHours: number;
  expectedHours: number | null;
  requiredHours: number | null;
  remainingHours: number | null;
  paceHours: number | null;
  paceLabel: string;
  paceTone: "ahead" | "on_pace" | "behind" | "pending" | "done";
  progressLabel: string;
  progressPercent: number | null;
};

const SUBMITTED = new Set(["submitted", "ava_approved", "supervisor_verified"]);
const APPROVED = new Set(["ava_approved", "supervisor_verified"]);

export function formatHours(value: number) {
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded);
}

export function requirementIsPending(input: {
  requirementStatus?: string | null;
  requiredHours?: number | null;
}) {
  const status = String(input.requirementStatus || "").toLowerCase();
  if (status === "pending" || status === "unconfirmed") return true;
  if (status === "confirmed" || status === "amended") return false;
  return !(Number(input.requiredHours) > 0);
}

export function validateInternshipHours(value: unknown):
  | { ok: true; hours: number }
  | { ok: false; error: string } {
  const raw = typeof value === "number" ? String(value) : String(value ?? "").trim();
  if (!raw) return { ok: false, error: "Enter how many hours you worked." };
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    return { ok: false, error: "Use a positive number like 0.5, 1.25, or 2.5." };
  }
  const hours = Number(raw);
  if (!Number.isFinite(hours) || hours <= 0) {
    return { ok: false, error: "Hours have to be greater than zero." };
  }
  if (hours > 14) {
    return { ok: false, error: "One entry can be at most 14 hours. Split a longer day." };
  }
  return { ok: true, hours: Math.round(hours * 100) / 100 };
}

export function validateTimeLogDate(input: {
  workedOn: string;
  startDate?: string | null;
  endDate?: string | null;
  today?: Date;
}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.workedOn)) {
    return "Choose the day you did the work.";
  }
  const today = input.today || new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (input.workedOn > todayKey) return "You can’t log hours for a future day.";
  if (input.endDate && input.workedOn > input.endDate) {
    return "That day is after your internship end date.";
  }
  if (input.startDate) {
    const start = new Date(`${input.startDate}T12:00:00`);
    start.setDate(start.getDate() - 30);
    const earliest = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    if (input.workedOn < earliest) return "That day is before your internship window.";
  }
  return null;
}

function roundHours(value: number) {
  return Math.round(value * 100) / 100;
}

export function expectedHoursForWeek(input: {
  weekNumber: number;
  plannedWeeklyHours: number | null;
  internshipWeeks: number | null;
  exceptions?: ScheduleException[];
}) {
  const weekly = Number(input.plannedWeeklyHours);
  if (!Number.isFinite(weekly) || weekly < 0 || input.weekNumber <= 0) return 0;
  const cap = input.internshipWeeks && input.internshipWeeks > 0
    ? Math.min(input.weekNumber, input.internshipWeeks)
    : input.weekNumber;
  let total = 0;
  for (let week = 1; week <= cap; week += 1) {
    const exception = input.exceptions?.find((row) => row.weekNumber === week);
    const planned = exception ? Number(exception.plannedHours) : weekly;
    total += Number.isFinite(planned) && planned > 0 ? planned : 0;
  }
  return roundHours(total);
}

export function summarizeInternshipHours(input: {
  requiredHours?: number | null;
  requirementStatus?: string | null;
  plannedWeeklyHours?: number | null;
  internshipWeeks?: number | null;
  startDate?: string | null;
  today?: Date;
  entries?: HourLogEntry[];
  exceptions?: ScheduleException[];
  weekZeroReady?: boolean;
  internshipStatus?: string | null;
}): HourSummary {
  const today = input.today || new Date();
  const academicWeek = internshipWeekNumber(input.startDate, today, input.internshipStatus);
  const weekNumber = input.weekZeroReady === false ? 0 : academicWeek;
  const weeks = input.internshipWeeks && input.internshipWeeks > 0
    ? input.internshipWeeks
    : null;
  const pending = requirementIsPending({
    requirementStatus: input.requirementStatus,
    requiredHours: input.requiredHours,
  });
  const entries = input.entries || [];
  const loggedThisWeek = roundHours(
    entries
      .filter((row) => (row.weekNumber ?? weekNumberForEntry(input.startDate, row.workedOn)) === weekNumber)
      .reduce((sum, row) => sum + Number(row.hours || 0), 0),
  );
  const submittedHours = roundHours(
    entries
      .filter((row) => SUBMITTED.has(row.status))
      .reduce((sum, row) => sum + Number(row.hours || 0), 0),
  );
  const approvedHours = roundHours(
    entries
      .filter((row) => APPROVED.has(row.status))
      .reduce((sum, row) => sum + Number(row.hours || 0), 0),
  );
  const verifiedHours = roundHours(
    entries
      .filter((row) => row.status === "supervisor_verified")
      .reduce((sum, row) => sum + Number(row.hours || 0), 0),
  );

  if (pending) {
    return {
      pendingRequirement: true,
      pendingMessage: "University hour requirement pending confirmation",
      weekNumber,
      internshipWeeks: weeks,
      weekLabel: weekNumber <= 0 ? "Start here" : `Week ${weekNumber}${weeks ? ` of ${weeks}` : ""}`,
      plannedWeeklyHours: input.plannedWeeklyHours ?? null,
      loggedThisWeek,
      submittedHours,
      approvedHours,
      verifiedHours,
      expectedHours: null,
      requiredHours: null,
      remainingHours: null,
      paceHours: null,
      paceLabel: "Pending confirmation",
      paceTone: "pending",
      progressLabel: "University hour requirement pending confirmation",
      progressPercent: null,
    };
  }

  const required = Number(input.requiredHours);
  const expected = expectedHoursForWeek({
    weekNumber,
    plannedWeeklyHours: input.plannedWeeklyHours ?? null,
    internshipWeeks: weeks,
    exceptions: input.exceptions,
  });
  const remaining = roundHours(Math.max(0, required - approvedHours));
  const pace = roundHours(approvedHours - expected);
  const percent = required > 0 ? Math.round((approvedHours / required) * 1000) / 10 : 0;
  let paceLabel = "On pace";
  let paceTone: HourSummary["paceTone"] = "on_pace";
  if (approvedHours >= required && required > 0) {
    paceLabel = "Hours complete";
    paceTone = "done";
  } else if (pace > 0.25) {
    paceLabel = `${formatHours(pace)} hours ahead`;
    paceTone = "ahead";
  } else if (pace < -0.25) {
    paceLabel = `${formatHours(Math.abs(pace))} hours behind`;
    paceTone = "behind";
  }

  return {
    pendingRequirement: false,
    pendingMessage: "",
    weekNumber,
    internshipWeeks: weeks,
    weekLabel: weekNumber <= 0 ? "Start here" : `Week ${weekNumber}${weeks ? ` of ${weeks}` : ""}`,
    plannedWeeklyHours: input.plannedWeeklyHours ?? null,
    loggedThisWeek,
    submittedHours,
    approvedHours,
    verifiedHours,
    expectedHours: expected,
    requiredHours: required,
    remainingHours: remaining,
    paceHours: pace,
    paceLabel,
    paceTone,
    progressLabel: `${formatHours(approvedHours)} / ${formatHours(required)} approved — ${percent}%`,
    progressPercent: Math.max(0, Math.min(100, percent)),
  };
}

export function weekNumberForEntry(startDate: string | null | undefined, workedOn: string) {
  if (!workedOn) return 0;
  return internshipWeekNumber(startDate, new Date(`${workedOn}T12:00:00`));
}
