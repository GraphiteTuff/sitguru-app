/** Manager assignment form rules. Stored on the existing internship task row. */

export const ASSIGNMENT_CATEGORIES = [
  "Content",
  "Social Media",
  "Community Outreach",
  "Events",
  "Research",
  "Analytics",
  "Planning",
  "Growth",
  "Ambassador Program",
  "Campus Growth",
  "Other",
] as const;

export const ASSIGNMENT_PRIORITIES = ["Low", "Normal", "High", "Urgent"] as const;
export const ASSIGNMENT_REVIEWS = [
  "Manager Review Required",
  "Manager Review Optional",
  "No Review Required",
] as const;
export const ASSIGNMENT_FREEDOM = ["Explore", "Guided", "Directed"] as const;

export type AssignmentDraft = {
  internId: string;
  title: string;
  category: string;
  milestoneId: string;
  dueOn: string;
  priority: string;
  description: string;
  deliverables: string[];
  review: string;
  freedom: string;
  resources: string[];
  notes: string;
  clientRequestId: string;
};

export type AssignmentErrors = Partial<Record<keyof AssignmentDraft | "form", string>>;

const TITLE_MAX = 140;
const TEXT_MAX = 2000;

export function cleanList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isAssignmentDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateManagerAssignment(input: AssignmentDraft, intent: "draft" | "create") {
  const value: AssignmentDraft = {
    ...input,
    internId: input.internId.trim(),
    title: input.title.trim(),
    category: input.category.trim(),
    milestoneId: input.milestoneId.trim(),
    dueOn: input.dueOn.trim(),
    priority: input.priority.trim() || "Normal",
    description: input.description.trim(),
    deliverables: cleanList(input.deliverables),
    review: input.review.trim() || "Manager Review Required",
    freedom: input.freedom.trim() || "Guided",
    resources: cleanList(input.resources),
    notes: input.notes.trim(),
    clientRequestId: input.clientRequestId.trim(),
  };
  const errors: AssignmentErrors = {};

  if (!value.internId) errors.internId = "Choose an intern on your team.";
  if (!value.title) errors.title = "Add an assignment title.";
  else if (value.title.length > TITLE_MAX) errors.title = `Keep the title under ${TITLE_MAX} characters.`;

  if (intent === "create") {
    if (!ASSIGNMENT_CATEGORIES.includes(value.category as (typeof ASSIGNMENT_CATEGORIES)[number])) {
      errors.category = "Choose a category.";
    }
    if (!value.dueOn) errors.dueOn = "Choose a due date.";
    else if (!isAssignmentDate(value.dueOn)) errors.dueOn = "Use a real calendar date.";
    if (!value.description) errors.description = "Describe the assignment.";
    else if (value.description.length > TEXT_MAX) errors.description = `Keep the description under ${TEXT_MAX} characters.`;
    if (!value.deliverables.length) errors.deliverables = "Add at least one deliverable.";
  } else if (value.description.length > TEXT_MAX) {
    errors.description = `Keep the description under ${TEXT_MAX} characters.`;
  }

  if (value.notes.length > TEXT_MAX) errors.notes = `Keep notes under ${TEXT_MAX} characters.`;
  if (!ASSIGNMENT_PRIORITIES.includes(value.priority as (typeof ASSIGNMENT_PRIORITIES)[number])) {
    errors.priority = "Choose a priority.";
  }
  if (!ASSIGNMENT_REVIEWS.includes(value.review as (typeof ASSIGNMENT_REVIEWS)[number])) {
    errors.review = "Choose a review requirement.";
  }
  if (!ASSIGNMENT_FREEDOM.includes(value.freedom as (typeof ASSIGNMENT_FREEDOM)[number])) {
    errors.freedom = "Choose a creative freedom level.";
  }
  const badLink = value.resources.find((link) => !isHttpUrl(link));
  if (badLink) errors.resources = "Links need to start with http:// or https://.";

  return Object.keys(errors).length
    ? { ok: false as const, errors, value }
    : { ok: true as const, errors, value };
}

export function assignmentIsVisibleToIntern(status: string) {
  return status !== "draft";
}

export function assignmentBrief(value: AssignmentDraft, actorUserId: string) {
  return {
    category: value.category,
    milestoneId: value.milestoneId,
    priority: value.priority,
    review: value.review,
    freedom: value.freedom,
    deliverables: value.deliverables,
    resources: value.resources,
    notes: value.notes,
    description: value.description,
    clientRequestId: value.clientRequestId,
    createdByUserId: actorUserId,
  };
}

export function readAssignmentBrief(payload: unknown): Partial<AssignmentDraft> {
  const row = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const list = (key: string) =>
    Array.isArray(row[key]) ? row[key].map((item) => String(item || "").trim()).filter(Boolean) : [];
  return {
    category: String(row.category || ""),
    milestoneId: String(row.milestoneId || ""),
    priority: String(row.priority || "Normal"),
    review: String(row.review || "Manager Review Required"),
    freedom: String(row.freedom || "Guided"),
    deliverables: list("deliverables"),
    resources: list("resources"),
    notes: String(row.notes || ""),
    description: String(row.description || ""),
    clientRequestId: String(row.clientRequestId || ""),
  };
}
