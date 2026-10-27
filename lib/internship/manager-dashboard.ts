import { summarizeInternshipHours, type HourSummary } from "@/lib/internship/hours";
import { isWeekZeroReady } from "@/lib/internship/week-zero";
import {
  displayWorkStatus,
  needsAvaReview,
  needsCeoReview,
} from "@/lib/internship/review-flow";
import { currentSemesterDeliverable, internshipWeekNumber } from "@/lib/internship/process";
import type {
  InternshipContentItem,
  InternshipIntern,
  InternshipQuestion,
  InternshipTask,
  InternshipTimeLog,
  InternshipWeeklyReview,
} from "@/lib/internship/types";

export type ManagerInternCard = {
  id: string;
  name: string;
  school: string;
  weekLabel: string;
  phase: string;
  milestone: string;
  requiredLabel: string;
  expectedLabel: string;
  submittedLabel: string;
  approvedLabel: string;
  remainingLabel: string;
  paceLabel: string;
  paceTone: HourSummary["paceTone"];
  awaitingReview: number;
  questions: number;
  nextDeadline: string;
  lastSubmission: string;
  statuses: string[];
  summary: HourSummary;
  role?: string;
  avatarUrl?: string;
  currentAssignment?: string;
  roster?: "active" | "completed" | "archived";
};

export type ManagerReviewItem = {
  id: string;
  internId: string;
  internName: string;
  targetType: "task" | "content" | "weekly" | "hours" | "milestone";
  title: string;
  weekLabel: string;
  submittedAt: string;
  hours: string;
  reportSection: string;
  statusLabel: string;
  stage: string;
  evidence: string;
  ceo: boolean;
};

export type ManagerQuestion = InternshipQuestion & { internName: string };

export type ManagerScheduleKind =
  | "assignment"
  | "check-in"
  | "milestone"
  | "meeting"
  | "deadline"
  | "training"
  | "event";

export type ManagerScheduleItem = {
  id: string;
  date: string;
  title: string;
  kind: ManagerScheduleKind;
  time: string;
};

function isoDate(value?: string | null) {
  const key = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : "";
}

function addDaysKey(key: string, days: number) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Desk rhythm plus real due dates. Weekly check-ins land on Friday. */
export function buildManagerSchedule(input: {
  tasks: InternshipTask[];
  reviews: InternshipWeeklyReview[];
  names: Map<string, string>;
  today?: string;
}): ManagerScheduleItem[] {
  const today =
    input.today ||
    new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const items: ManagerScheduleItem[] = [];
  const start = addDaysKey(today, -14);
  for (let cursor = start; cursor <= addDaysKey(today, 42); cursor = addDaysKey(cursor, 1)) {
    const [year, month, day] = cursor.split("-").map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (weekday === 5) {
      items.push({
        id: `checkin-${cursor}`,
        date: cursor,
        title: "Weekly check-in",
        kind: "check-in",
        time: "10:00 AM",
      });
      items.push({
        id: `report-${cursor}`,
        date: cursor,
        title: "Weekly report due",
        kind: "deadline",
        time: "5:00 PM",
      });
    }
    if (weekday === 1) {
      items.push({
        id: `desk-${cursor}`,
        date: cursor,
        title: "Manager desk review",
        kind: "meeting",
        time: "1:00 PM",
      });
    }
  }

  for (const task of input.tasks) {
    const date = isoDate(task.dueOn);
    if (!date) continue;
    const submitted = task.status === "submitted" || task.reviewStage === "submitted_to_ava";
    items.push({
      id: task.id,
      date,
      title: task.title,
      kind: submitted ? "deadline" : task.status === "todo" ? "assignment" : "event",
      time: "",
    });
  }

  for (const review of input.reviews) {
    const date = isoDate(review.submittedAt || review.weekOf);
    if (!date) continue;
    items.push({
      id: `review-${review.id}`,
      date,
      title: `${input.names.get(review.internId) || "Intern"} check-in`,
      kind: "check-in",
      time: "",
    });
  }

  return items;
}

function dateLabel(value?: string | null) {
  const key = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return "None yet";
  return new Date(`${key}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function buildInternManagerCard(input: {
  intern: InternshipIntern;
  schoolName?: string;
  tasks: InternshipTask[];
  content: InternshipContentItem[];
  reviews: InternshipWeeklyReview[];
  logs: InternshipTimeLog[];
  questions: InternshipQuestion[];
  startChecks: string[];
  exceptions?: { weekNumber: number; plannedHours: number }[];
  today?: Date;
}): ManagerInternCard {
  const today = input.today || new Date();
  const ready = isWeekZeroReady({
    completedKeys: input.startChecks,
    approvedAt: input.intern.weekZeroApprovedAt,
  });
  const summary = summarizeInternshipHours({
    requiredHours: input.intern.requiredHours,
    requirementStatus: input.intern.requirementStatus,
    plannedWeeklyHours: input.intern.plannedWeeklyHours,
    internshipWeeks: input.intern.internshipWeeks,
    startDate: input.intern.academicStartDate,
    today,
    entries: input.logs.map((row) => ({
      workedOn: row.workedOn,
      hours: row.hours,
      status: row.status,
      weekNumber: row.weekNumber,
    })),
    exceptions: input.exceptions,
    weekZeroReady: ready,
    internshipStatus: input.intern.status,
  });
  const academicWeek = internshipWeekNumber(input.intern.academicStartDate, today);
  const deliverable = currentSemesterDeliverable(input.intern.academicStartDate, today);
  const awaiting = [
    ...input.tasks.filter((row) => needsAvaReview(row.status, row.reviewStage) || needsCeoReview(row.status, row.reviewStage)),
    ...input.content.filter((row) => needsAvaReview(row.status, row.reviewStage) || needsCeoReview(row.status, row.reviewStage)),
    ...input.reviews.filter((row) => row.reviewStatus === "submitted_to_ava" || row.reviewStatus === "submitted_to_jason"),
    ...input.logs.filter((row) => row.status === "submitted"),
  ].length;
  const openQuestions = input.questions.filter((row) => row.status === "open" && row.askedByRole !== "manager").length;
  const nextDue = [...input.tasks]
    .map((row) => row.dueOn)
    .filter((value): value is string => Boolean(value))
    .sort()
    .find((value) => value >= today.toISOString().slice(0, 10));
  const lastSubmission = [
    ...input.tasks.map((row) => row.submittedAt),
    ...input.content.map((row) => row.submittedAt),
    ...input.reviews.map((row) => row.submittedAt),
    ...input.logs.map((row) => row.submittedAt),
  ]
    .filter(Boolean)
    .sort()
    .at(-1);
  const openTask = [...input.tasks]
    .filter((task) => task.status !== "approved" && task.status !== "not_accepted")
    .sort((a, b) => String(a.dueOn || "9999-99-99").localeCompare(String(b.dueOn || "9999-99-99")))[0];
  const roster =
    input.intern.status === "completed"
      ? "completed"
      : input.intern.status === "withdrawn"
        ? "archived"
        : "active";

  const statuses = [
    summary.paceTone === "ahead"
      ? "Ahead"
      : summary.paceTone === "behind"
        ? "Behind"
        : summary.paceTone === "on_pace"
          ? "On pace"
          : summary.paceTone === "pending"
            ? "Pending confirmation"
            : "Hours complete",
  ];
  if (summary.paceTone === "behind" && (openQuestions > 0 || awaiting > 0)) statuses.push("Needs attention");
  if (awaiting > 0) statuses.push("Awaiting review");

  return {
    id: input.intern.id,
    name: input.intern.preferredName || input.intern.fullName,
    school: input.schoolName || "School on file",
    weekLabel: summary.weekLabel,
    phase: academicWeek <= 0 || !ready ? "Start here" : deliverable.timing,
    milestone: academicWeek <= 0 || !ready ? "Ready to begin internship" : deliverable.title,
    requiredLabel: summary.pendingRequirement ? "Pending" : `${summary.requiredHours} hours`,
    expectedLabel: summary.expectedHours == null ? "Pending" : `${summary.expectedHours}`,
    submittedLabel: `${summary.submittedHours}`,
    approvedLabel: `${summary.approvedHours}`,
    remainingLabel: summary.remainingHours == null ? "Pending" : `${summary.remainingHours}`,
    paceLabel: summary.paceLabel,
    paceTone: summary.paceTone,
    awaitingReview: awaiting,
    questions: openQuestions,
    nextDeadline: nextDue ? dateLabel(nextDue) : "No date yet",
    lastSubmission: lastSubmission ? dateLabel(lastSubmission) : "None yet",
    statuses,
    summary,
    role: input.intern.internshipTitle || input.schoolName || "Growth Intern",
    avatarUrl: input.intern.avatarUrl || "",
    currentAssignment: openTask?.title || "",
    roster,
  };
}

export function buildManagerReviewQueue(input: {
  interns: InternshipIntern[];
  tasks: InternshipTask[];
  content: InternshipContentItem[];
  reviews: InternshipWeeklyReview[];
  logs: InternshipTimeLog[];
}): ManagerReviewItem[] {
  const names = new Map(input.interns.map((intern) => [intern.id, intern.preferredName || intern.fullName]));
  const items: ManagerReviewItem[] = [];

  for (const task of input.tasks) {
    const view = displayWorkStatus(task.status, task.reviewStage);
    if (view.stage !== "submitted_to_ava" && view.stage !== "submitted_to_jason") continue;
    items.push({
      id: task.id,
      internId: task.internId,
      internName: names.get(task.internId) || "Intern",
      targetType: "task",
      title: task.title,
      weekLabel: task.weekNumber ? `Week ${task.weekNumber}` : "Assignment",
      submittedAt: task.submittedAt || "",
      hours: "",
      reportSection: task.finalSection || "",
      statusLabel: view.label,
      stage: view.stage,
      evidence: task.workUrl,
      ceo: view.stage === "submitted_to_jason",
    });
  }

  for (const item of input.content) {
    const view = displayWorkStatus(item.status, item.reviewStage);
    if (view.stage !== "submitted_to_ava" && view.stage !== "submitted_to_jason") continue;
    items.push({
      id: item.id,
      internId: item.internId,
      internName: names.get(item.internId) || "Intern",
      targetType: "content",
      title: item.title,
      weekLabel: "Content",
      submittedAt: item.submittedAt || "",
      hours: "",
      reportSection: item.finalSection || "",
      statusLabel: view.label,
      stage: view.stage,
      evidence: item.draftUrl || item.publishedUrl,
      ceo: view.stage === "submitted_to_jason",
    });
  }

  for (const review of input.reviews) {
    if (review.reviewStatus !== "submitted_to_ava" && review.reviewStatus !== "submitted_to_jason") continue;
    items.push({
      id: review.id,
      internId: review.internId,
      internName: names.get(review.internId) || "Intern",
      targetType: "weekly",
      title: "Weekly check-in",
      weekLabel: review.weekOf ? `Week of ${review.weekOf}` : "This week",
      submittedAt: review.submittedAt || review.weekOf,
      hours: review.hoursLogged != null ? String(review.hoursLogged) : "",
      reportSection: review.finalSection || "",
      statusLabel: review.reviewStatus === "submitted_to_jason" ? "Needs CEO Review" : "Needs manager review",
      stage: review.reviewStatus,
      evidence: "",
      ceo: review.reviewStatus === "submitted_to_jason",
    });
  }

  for (const log of input.logs) {
    if (log.status !== "submitted") continue;
    items.push({
      id: log.id,
      internId: log.internId,
      internName: names.get(log.internId) || "Intern",
      targetType: "hours",
      title: log.activity || "Hour entry",
      weekLabel: log.weekNumber ? `Week ${log.weekNumber}` : dateLabel(log.workedOn),
      submittedAt: log.submittedAt || log.workedOn,
      hours: String(log.hours),
      reportSection: "",
      statusLabel: "Needs manager review",
      stage: "submitted_to_ava",
      evidence: log.evidenceUrl,
      ceo: false,
    });
  }

  return items.sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));
}
