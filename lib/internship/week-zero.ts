export const WEEK_ZERO_ITEMS = [
  { key: "welcome", label: "Welcome to SitGuru" },
  { key: "role", label: "Review internship role and expectations" },
  { key: "university", label: "Confirm university and program" },
  { key: "credits", label: "Confirm credits" },
  { key: "hours", label: "Confirm required hours" },
  { key: "dates", label: "Confirm internship dates" },
  { key: "privacy", label: "Review privacy and PII requirements" },
  { key: "confidentiality", label: "Review SitGuru confidentiality expectations" },
  { key: "teams", label: "Join Microsoft Teams" },
  { key: "portal", label: "Learn SitGuru Intern Portal" },
  { key: "workplace", label: "Learn Growth Workplace" },
  { key: "planner", label: "Review Planner expectations" },
  { key: "canva", label: "Review Canva and content workflow" },
  { key: "test", label: "Complete test assignment" },
  { key: "meet_ava", label: "Meet with Ava" },
  { key: "schedule", label: "Confirm internship schedule" },
  { key: "ready", label: "Ready to begin" },
] as const;

export type WeekZeroKey = (typeof WEEK_ZERO_ITEMS)[number]["key"];

export function isWeekZeroReady(input: {
  completedKeys?: string[] | null;
  approvedAt?: string | null;
}) {
  if (input.approvedAt) return true;
  const done = new Set(input.completedKeys || []);
  return WEEK_ZERO_ITEMS.every((item) => done.has(item.key));
}

export function weekZeroProgress(completedKeys?: string[] | null) {
  const done = new Set(completedKeys || []);
  const complete = WEEK_ZERO_ITEMS.filter((item) => done.has(item.key)).length;
  return {
    complete,
    total: WEEK_ZERO_ITEMS.length,
    label: `${complete} of ${WEEK_ZERO_ITEMS.length} complete`,
  };
}
