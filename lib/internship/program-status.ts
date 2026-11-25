export type ProgramStatus = "pre_launch" | "active" | "paused" | "completed";

export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  pre_launch: "Pre-Launch",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

export const PROGRAM_TRANSITIONS = {
  pre_launch: ["activate"],
  active: ["pause", "complete"],
  paused: ["resume", "complete"],
  completed: [],
} as const;

export const PROGRAM_ACTION_LABELS = {
  activate: "Activate semester",
  pause: "Pause semester",
  resume: "Resume semester",
  complete: "Complete semester",
} as const;

export function isProgramStatus(value: unknown): value is ProgramStatus {
  return typeof value === "string" && Object.hasOwn(PROGRAM_STATUS_LABELS, value);
}
