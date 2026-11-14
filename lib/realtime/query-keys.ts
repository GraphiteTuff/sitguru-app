/**
 * Cache / refresh path conventions for SitGuru workspace sync (req 95).
 * TanStack Query is installed but unused — invalidation is path + live-signal based.
 */

export const WORKSPACE_QUERY_KEYS = {
  myTime: "my-time",
  weeklyTimeSummary: "weekly-time-summary",
  paymentPeriodSummary: "payment-period-summary",
  managerSummary: "manager-summary",
  adminTimeSummary: "admin-time-summary",
  internHours: "intern-hours",
  internDashboard: "intern-dashboard",
  managerDesk: "manager-desk",
  growthSnapshot: "growth-snapshot",
  growthCenterV2: "growth-center-v2",
  onboardingStatus: "onboarding-status",
  helpContext: "help-context",
  messagingUnread: "messaging-unread",
  accessNav: "access-nav",
} as const;

export type WorkspaceQueryKey =
  (typeof WORKSPACE_QUERY_KEYS)[keyof typeof WORKSPACE_QUERY_KEYS];

/** Authoritative route prefixes to revalidate after domain mutations. */
export const WORKSPACE_REFRESH_PATHS = {
  internPortal: "/intern",
  managerDesk: "/intern/manage",
  managerPortal: "/manager",
  managerInsights: "/manager/insights",
  internGrowth: "/intern/growth",
  internCheckins: "/intern/check-ins",
  managerCheckins: "/manager/check-ins",
  managerMilestones: "/manager/milestones",
  internMilestones: "/intern/milestones",
  internInsights: "/intern/insights",
  internHelp: "/intern/help",
  internOnboarding: "/intern/onboarding",
  adminInternship: "/admin/internship",
  adminGrowth: "/admin/growth",
  adminGrowthInsights: "/admin/growth/insights",
  adminMyTime: "/admin/growth/my-time",
  adminMyPayments: "/admin/growth/payments",
  adminHr: "/admin/hr",
  adminPeople: "/admin/hr/people",
  adminTeamPayments: "/admin/hr/people/payments",
  adminPayments: "/admin/payments",
  messages: "/messages",
} as const;

export function pathsForInternWorkspace() {
  return [
    WORKSPACE_REFRESH_PATHS.internPortal,
    WORKSPACE_REFRESH_PATHS.internGrowth,
    WORKSPACE_REFRESH_PATHS.internCheckins,
    WORKSPACE_REFRESH_PATHS.managerCheckins,
    WORKSPACE_REFRESH_PATHS.managerMilestones,
    WORKSPACE_REFRESH_PATHS.internMilestones,
    WORKSPACE_REFRESH_PATHS.internInsights,
    WORKSPACE_REFRESH_PATHS.adminGrowth,
    WORKSPACE_REFRESH_PATHS.adminGrowthInsights,
    WORKSPACE_REFRESH_PATHS.managerInsights,
    WORKSPACE_REFRESH_PATHS.internHelp,
    WORKSPACE_REFRESH_PATHS.managerDesk,
    WORKSPACE_REFRESH_PATHS.managerPortal,
    WORKSPACE_REFRESH_PATHS.adminInternship,
  ];
}

export function pathsForManagerDesk() {
  return [
    WORKSPACE_REFRESH_PATHS.managerDesk,
    WORKSPACE_REFRESH_PATHS.managerPortal,
    WORKSPACE_REFRESH_PATHS.managerMilestones,
    WORKSPACE_REFRESH_PATHS.internMilestones,
    WORKSPACE_REFRESH_PATHS.internPortal,
    WORKSPACE_REFRESH_PATHS.adminInternship,
  ];
}

export function pathsForGrowthWorkspace() {
  return [
    WORKSPACE_REFRESH_PATHS.adminGrowth,
    WORKSPACE_REFRESH_PATHS.adminGrowthInsights,
    WORKSPACE_REFRESH_PATHS.adminMyTime,
    WORKSPACE_REFRESH_PATHS.adminMyPayments,
    WORKSPACE_REFRESH_PATHS.internGrowth,
    WORKSPACE_REFRESH_PATHS.internInsights,
    WORKSPACE_REFRESH_PATHS.internPortal,
    WORKSPACE_REFRESH_PATHS.managerDesk,
    WORKSPACE_REFRESH_PATHS.managerPortal,
    WORKSPACE_REFRESH_PATHS.managerInsights,
  ];
}

export function pathsForStaffTimekeeper() {
  return [
    WORKSPACE_REFRESH_PATHS.adminGrowth,
    WORKSPACE_REFRESH_PATHS.adminMyTime,
    WORKSPACE_REFRESH_PATHS.adminMyPayments,
    WORKSPACE_REFRESH_PATHS.adminPeople,
    WORKSPACE_REFRESH_PATHS.adminTeamPayments,
    WORKSPACE_REFRESH_PATHS.adminHr,
  ];
}

export function pathsForOnboarding() {
  return [
    WORKSPACE_REFRESH_PATHS.internOnboarding,
    WORKSPACE_REFRESH_PATHS.internPortal,
    WORKSPACE_REFRESH_PATHS.adminInternship,
    WORKSPACE_REFRESH_PATHS.adminHr,
  ];
}
