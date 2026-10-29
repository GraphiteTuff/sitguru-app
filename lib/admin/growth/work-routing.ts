/**
 * One place that decides where a SitGuru assignment belongs in Microsoft 365.
 * Teams discusses it. Planner tracks execution. SharePoint holds the files.
 */

export const GROWTH_TEAMS_CHANNELS = {
  "growth-strategy": {
    label: "Growth and Strategy",
    idEnv: "SITGURU_TEAMS_CHANNEL_GROWTH_STRATEGY_ID",
    urlEnv: "NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_STRATEGY_URL",
  },
  "content-social": {
    label: "Content and Social",
    idEnv: "SITGURU_TEAMS_CHANNEL_CONTENT_SOCIAL_ID",
    urlEnv: "NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_CONTENT_URL",
  },
  "intern-projects": {
    label: "Intern Projects",
    idEnv: "SITGURU_TEAMS_CHANNEL_INTERN_PROJECTS_ID",
    urlEnv: "NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_INTERNS_URL",
  },
  "partnerships-community": {
    label: "Partnerships and Community",
    idEnv: "SITGURU_TEAMS_CHANNEL_PARTNERSHIPS_ID",
    urlEnv: "NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_PARTNERSHIPS_URL",
  },
  "analytics-results": {
    label: "Analytics and Results",
    idEnv: "SITGURU_TEAMS_CHANNEL_ANALYTICS_ID",
    urlEnv: "NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_ANALYTICS_URL",
  },
} as const;

export type GrowthTeamsChannelKey = keyof typeof GROWTH_TEAMS_CHANNELS;

export type AssignmentWorkRoute = {
  channelKey: GrowthTeamsChannelKey;
  channelLabel: string;
  sharePointSection: "Intern Projects";
  plannerPlan: "growth";
  canva: boolean;
};

const CATEGORY_ROUTES: Record<string, AssignmentWorkRoute> = {
  "social media": route("content-social", true),
  content: route("content-social", true),
  creative: route("content-social", true),
  "pet parent growth": route("growth-strategy", false),
  campaign: route("growth-strategy", false),
  growth: route("growth-strategy", false),
  "growth experiment": route("growth-strategy", false),
  planning: route("growth-strategy", false),
  "community outreach": route("partnerships-community", false),
  partnership: route("partnerships-community", false),
  "ambassador program": route("partnerships-community", false),
  event: route("partnerships-community", false),
  events: route("partnerships-community", false),
  analytics: route("analytics-results", false),
  research: route("analytics-results", false),
  "research / results": route("analytics-results", false),
  "internship administration": route("intern-projects", false),
  "internship milestone": route("intern-projects", false),
  "final project": route("intern-projects", false),
  other: route("intern-projects", false),
};

function route(channelKey: GrowthTeamsChannelKey, canva: boolean): AssignmentWorkRoute {
  return {
    channelKey,
    channelLabel: GROWTH_TEAMS_CHANNELS[channelKey].label,
    sharePointSection: "Intern Projects",
    plannerPlan: "growth",
    canva,
  };
}

export function routeAssignmentCategory(category: string): AssignmentWorkRoute {
  const key = category.trim().toLowerCase();
  return CATEGORY_ROUTES[key] || route("intern-projects", false);
}

export function sharePointFolderName(value: string) {
  const cleaned = value
    .replace(/[\\/:*?"<>|#%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || "Assignment").slice(0, 80);
}

export type PlannerOperationalStatus = "not_started" | "in_progress" | "awaiting_review";

/** Planner completion is operational. It never becomes manager or academic approval. */
export function sitguruStatusFromPlannerPercent(percent: number): PlannerOperationalStatus {
  const value = Number.isFinite(percent) ? percent : 0;
  if (value >= 100) return "awaiting_review";
  if (value > 0) return "in_progress";
  return "not_started";
}

export function plannerWriteAfterConflict(attempt: number) {
  return attempt < 1 ? ("refetch" as const) : ("sync_conflict" as const);
}

export function teamsAssignmentMessage(input: {
  title: string;
  internName: string;
  dueOn: string;
  managerName: string;
  freedom: string;
  plannerUrl: string;
  folderUrl: string;
  sitguruUrl: string;
}) {
  return [
    "New Intern Assignment",
    input.title,
    `Assigned to: ${input.internName}`,
    input.dueOn ? `Due: ${input.dueOn}` : "",
    `Manager: ${input.managerName}`,
    `Creative Freedom: ${input.freedom || "Guided"}`,
    input.plannerUrl ? `Planner: ${input.plannerUrl}` : "Planner: pending",
    input.folderUrl ? `Project files: ${input.folderUrl}` : "Project files: pending",
    `SitGuru: ${input.sitguruUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}
