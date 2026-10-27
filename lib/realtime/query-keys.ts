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
  internGrowth: "/intern/growth",
  internHelp: "/intern/help",
  internOnboarding: "/intern/onboarding",
  adminInternship: "/admin/internship",
  adminGrowth: "/admin/growth",
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
    WORKSPACE_REFRESH_PATHS.internHelp,
    WORKSPACE_REFRESH_PATHS.managerDesk,
    WORKSPACE_REFRESH_PATHS.adminInternship,
  ];
}

export function pathsForManagerDesk() {
  return [
    WORKSPACE_REFRESH_PATHS.managerDesk,
    WORKSPACE_REFRESH_PATHS.internPortal,
    WORKSPACE_REFRESH_PATHS.adminInternship,
  ];
}

export function pathsForGrowthWorkspace() {
  return [
    WORKSPACE_REFRESH_PATHS.adminGrowth,
    WORKSPACE_REFRESH_PATHS.adminMyTime,
    WORKSPACE_REFRESH_PATHS.adminMyPayments,
    WORKSPACE_REFRESH_PATHS.internGrowth,
    WORKSPACE_REFRESH_PATHS.internPortal,
    WORKSPACE_REFRESH_PATHS.managerDesk,
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
