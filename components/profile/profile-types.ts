/**
 * Shared types for the role-independent profile settings engine.
 */

export type ProfileRole = "parent" | "guru" | "ambassador";

export type ProfileTabId = "contact" | "security" | "ecosystem";

export type UnifiedProfileDraft = {
  fullName: string;
  email: string;
  phone: string;
  zip: string;
  activitySyncLogs: boolean;
  urgentSmsFallback: boolean;
};

export type PauseReasonId =
  | "seasonal_break"
  | "pricing"
  | "temporary_sabbatical"
  | "too_busy"
  | "other";

export type PauseDurationDays = 30 | 60 | 90;

export type DeletionReasonId =
  | "no_longer_need"
  | "found_another"
  | "bad_experience"
  | "privacy"
  | "too_many_emails"
  | "account_trouble"
  | "role_exit"
  | "other";

export const PAUSE_REASONS: ReadonlyArray<{
  id: PauseReasonId;
  label: string;
  helper: string;
}> = [
  {
    id: "seasonal_break",
    label: "Seasonal Break",
    helper: "Travel, holidays, or pet-care off-season",
  },
  {
    id: "pricing",
    label: "Pricing",
    helper: "Need a pause while reviewing rates",
  },
  {
    id: "temporary_sabbatical",
    label: "Temporary Sabbatical",
    helper: "Stepping away for personal reasons",
  },
  {
    id: "too_busy",
    label: "Schedule overload",
    helper: "Too many commitments right now",
  },
  {
    id: "other",
    label: "Other",
    helper: "Something else is going on",
  },
];

export const PAUSE_DURATIONS: ReadonlyArray<{
  days: PauseDurationDays;
  label: string;
}> = [
  { days: 30, label: "30 days" },
  { days: 60, label: "60 days" },
  { days: 90, label: "90 days" },
];

export const DELETION_REASONS: ReadonlyArray<{
  id: DeletionReasonId;
  label: string;
}> = [
  { id: "no_longer_need", label: "I no longer need SitGuru" },
  { id: "found_another", label: "I found another service" },
  { id: "bad_experience", label: "I had a bad experience" },
  { id: "privacy", label: "I’m concerned about privacy" },
  { id: "too_many_emails", label: "I’m receiving too many emails" },
  { id: "account_trouble", label: "I’m having trouble with my account" },
  { id: "role_exit", label: "I’m leaving this SitGuru role" },
  { id: "other", label: "Other" },
];

export const ROLE_LABELS: Record<ProfileRole, string> = {
  parent: "Pet Parent",
  guru: "Guru",
  ambassador: "Ambassador",
};

export const ROLE_DASHBOARD_HREF: Record<ProfileRole, string> = {
  parent: "/customer/dashboard",
  guru: "/guru/dashboard",
  ambassador: "/ambassador/dashboard",
};

export const ROLE_SERVICE_PROFILE_HREF: Partial<Record<ProfileRole, string>> = {
  parent: "/customer/dashboard/profile/setup",
  guru: "/guru/dashboard/profile/services",
};

export function addDaysIso(days: number, from = new Date()) {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

export function formatResumeDate(days: PauseDurationDays) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(addDaysIso(days)));
}

export function passwordStrength(password: string) {
  const value = String(password || "");
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  const pct = Math.min(100, (score / 5) * 100);
  const label =
    score <= 1 ? "Weak" : score <= 3 ? "Fair" : score === 4 ? "Strong" : "Excellent";
  return { score, pct, label, meetsMinimum: value.length >= 8 };
}

export function filterZipDigits(value: string) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 5);
}
