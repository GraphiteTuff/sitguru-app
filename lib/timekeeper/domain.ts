export const DEFAULT_INTERNSHIP_PLAN = {
  credits: 3,
  requiredHours: 150,
  internshipWeeks: 15,
  weeklyTarget: 10,
} as const;

export type PaceStatus = "on_track" | "watch" | "recovery" | "complete";

export type TimeEntryStatus =
  | "draft"
  | "running"
  | "submitted"
  | "returned"
  | "manager_recommended"
  | "founder_approved"
  | "locked";

const OFFICIAL = new Set<TimeEntryStatus>(["founder_approved", "locked"]);

export function roundHours(value: number) {
  return Math.round(value * 100) / 100;
}

export function durationFromRange(startIso: string, endIso: string) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { ok: false as const, error: "End time has to be after the start time." };
  }
  const hours = roundHours((end - start) / 3600000);
  if (hours <= 0 || hours > 14) {
    return { ok: false as const, error: "One entry can be at most 14 hours." };
  }
  return { ok: true as const, hours };
}

export function validateManualHours(value: unknown) {
  const raw = typeof value === "number" ? String(value) : String(value ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    return { ok: false as const, error: "Use hours like 0.5, 1.25, or 2.5." };
  }
  const hours = Number(raw);
  if (hours <= 0 || hours > 14) {
    return { ok: false as const, error: "Hours must be greater than zero and at most 14." };
  }
  return { ok: true as const, hours: roundHours(hours) };
}

export function weekHoursAreFlexible(hours: number, weeklyTarget = DEFAULT_INTERNSHIP_PLAN.weeklyTarget) {
  const parsed = validateManualHours(hours);
  if (!parsed.ok) return parsed;
  return {
    ok: true as const,
    hours: parsed.hours,
    differsFromTarget: Math.abs(parsed.hours - weeklyTarget) > 0.001,
    blocked: false,
  };
}

export function semesterOverage(input: {
  approvedHours: number;
  additionalHours: number;
  requiredHours: number;
}) {
  const total = roundHours(input.approvedHours + input.additionalHours);
  if (total > input.requiredHours + 0.001) {
    return {
      exceeds: true,
      message: `This submission would exceed the approved ${input.requiredHours}-hour internship requirement.`,
      total,
    };
  }
  return { exceeds: false, message: "", total };
}

export function semesterPace(input: {
  requiredHours: number;
  approvedHours: number;
  internshipWeeks: number;
  currentWeek: number;
  weeklyTarget: number;
}) {
  const required = input.requiredHours;
  const approved = roundHours(input.approvedHours);
  const remaining = roundHours(Math.max(0, required - approved));
  const weeksRemaining = Math.max(0, input.internshipWeeks - input.currentWeek);
  const averageNeeded = weeksRemaining === 0 ? remaining : roundHours(remaining / weeksRemaining);
  const projected = weeksRemaining === 0
    ? approved
    : roundHours(approved + averageNeeded * weeksRemaining);
  let status: PaceStatus = "on_track";
  if (approved + 0.001 >= required) status = "complete";
  else if (averageNeeded > input.weeklyTarget * 1.15) status = "recovery";
  else if (averageNeeded > input.weeklyTarget + 0.25) status = "watch";
  return {
    approved,
    remaining,
    weeksRemaining,
    averageNeeded,
    projectedCompletion: Math.min(required, projected),
    status,
    label:
      status === "complete"
        ? "Hours complete"
        : status === "recovery"
          ? "Recovery plan recommended"
          : status === "watch"
            ? "Watch"
            : "On track",
  };
}

export function defaultPlanTotals(weeks = 15, weeklyTarget = 10) {
  return roundHours(weeks * weeklyTarget);
}

export function canUserApproveOwnTime() {
  return false;
}

export function managerCanAccessIntern(input: {
  actor: "intern" | "manager" | "supervisor" | "none";
  actorUserId?: string | null;
  actorInternId?: string | null;
  targetInternId: string;
  managerUserId?: string | null;
}) {
  if (input.actor === "supervisor") return true;
  if (input.actor === "manager") {
    return Boolean(input.managerUserId) && input.managerUserId === input.actorUserId;
  }
  if (input.actor === "intern") return input.actorInternId === input.targetInternId;
  return false;
}

export function nextWeeklyTransition(input: {
  status: string;
  action: "submit" | "return" | "recommend" | "founder_approve" | "resubmit";
  actor: "intern" | "manager" | "supervisor";
}) {
  const status = input.status || "draft";
  if (input.action === "submit" || input.action === "resubmit") {
    if (input.actor !== "intern") return { ok: false as const, error: "Only the intern can submit this week." };
    if (!["draft", "returned", "open"].includes(status)) {
      return { ok: false as const, error: "This week is already with your manager." };
    }
    return { ok: true as const, status: "submitted" };
  }
  if (input.action === "return") {
    if (input.actor === "intern") return { ok: false as const, error: "You can’t return your own time." };
    if (!["submitted", "manager_recommended"].includes(status)) {
      return { ok: false as const, error: "Nothing is waiting to send back." };
    }
    return { ok: true as const, status: "returned" };
  }
  if (input.action === "recommend") {
    if (input.actor !== "manager" && input.actor !== "supervisor") {
      return { ok: false as const, error: "Your manager recommends this week." };
    }
    if (status !== "submitted") return { ok: false as const, error: "Submit the week before review." };
    return { ok: true as const, status: "manager_recommended" };
  }
  if (input.actor !== "supervisor") return { ok: false as const, error: "Only the founder can approve official hours." };
  if (status !== "manager_recommended") {
    return { ok: false as const, error: "Founder approval waits for the manager recommendation." };
  }
  return { ok: true as const, status: "founder_approved" };
}

export function isOfficialHourStatus(status: string) {
  return OFFICIAL.has(status as TimeEntryStatus);
}

export function approvedHours(entries: { hours: number; status: string }[]) {
  return roundHours(
    entries.filter((row) => isOfficialHourStatus(row.status)).reduce((sum, row) => sum + row.hours, 0),
  );
}

export function lockedAfterApproval(status: string) {
  return status === "founder_approved" || status === "locked";
}

export function createAdjustment(input: {
  originalHours: number;
  proposedHours: number;
  reason: string;
}) {
  return {
    originalHours: input.originalHours,
    proposedHours: input.proposedHours,
    reason: input.reason,
    preservesOriginal: true,
  };
}

export function comparePlanToActual(
  planned: { label: string; hours: number }[],
  actual: { label: string; hours: number }[],
) {
  const labels = [...new Set([...planned.map((row) => row.label), ...actual.map((row) => row.label)])];
  return labels.map((label) => ({
    label,
    planned: roundHours(planned.find((row) => row.label === label)?.hours || 0),
    actual: roundHours(actual.find((row) => row.label === label)?.hours || 0),
  }));
}

export function parsePlanItems(value: string) {
  const lines = value.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const items: { label: string; hours: number }[] = [];
  for (const line of lines) {
    const [label, rawHours] = line.split("|").map((part) => part.trim());
    const hours = validateManualHours(rawHours);
    if (!label || !hours.ok) {
      return { ok: false as const, error: "Each plan line needs a name and hours, like Research | 2." };
    }
    items.push({ label, hours: hours.hours });
  }
  return { ok: true as const, items, total: roundHours(items.reduce((sum, item) => sum + item.hours, 0)) };
}

export function creditBearingHours(recordedApproved: number, requiredHours: number) {
  return roundHours(Math.min(Math.max(0, recordedApproved), Math.max(0, requiredHours)));
}

export function invoiceAmount(hours: number, hourlyRate: number | null) {
  if (hourlyRate == null || !Number.isFinite(hourlyRate)) return null;
  return roundHours(hours * hourlyRate);
}

export function canRewriteSubmittedActuals() {
  return false;
}

export function timeReportCsv(rows: {
  date: string;
  week: string;
  hours: number;
  category: string;
  description: string;
  linkedWork: string;
  managerReview: string;
  founderApproval: string;
  cumulativeApproved: number;
}[]) {
  const header = [
    "date",
    "week",
    "hours",
    "category",
    "description",
    "linked work",
    "manager review",
    "founder approval",
    "cumulative approved hours",
  ];
  const escape = (value: string | number) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [header, ...rows.map((row) => [
    row.date,
    row.week,
    row.hours,
    row.category,
    row.description,
    row.linkedWork,
    row.managerReview,
    row.founderApproval,
    row.cumulativeApproved,
  ])].map((line) => line.map(escape).join(",")).join("\n");
}

export function paceLabel(status: PaceStatus) {
  if (status === "complete") return "Hours complete";
  if (status === "recovery") return "Recovery plan recommended";
  if (status === "watch") return "Watch";
  return "On track";
}
