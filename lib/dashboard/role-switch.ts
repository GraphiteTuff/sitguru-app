/**
 * Shared dashboard role-switch targets and helpers.
 * Pet Parent always maps to `/customer/dashboard` (never profile).
 */

export type DashboardSwitchRole =
  | "parent"
  | "guru"
  | "ambassador"
  | "admin";

export type DashboardSwitchTarget = {
  id: DashboardSwitchRole;
  label: string;
  shortLabel: string;
  path: string;
  helper: string;
};

export const DASHBOARD_SWITCH_TARGETS: readonly DashboardSwitchTarget[] = [
  {
    id: "parent",
    label: "Switch to Pet Parent",
    shortLabel: "Pet Parent",
    path: "/customer/dashboard",
    helper: "Pets, bookings, PawPerks, and care details",
  },
  {
    id: "guru",
    label: "Switch to Guru",
    shortLabel: "Guru",
    path: "/guru/dashboard",
    helper: "Services, bookings, messages, and earnings",
  },
  {
    id: "ambassador",
    label: "Switch to Ambassador",
    shortLabel: "Ambassador",
    path: "/ambassador/dashboard",
    helper: "Referrals, training, rewards, and outreach",
  },
  {
    id: "admin",
    label: "Admin Dashboard",
    shortLabel: "Admin",
    path: "/admin",
    helper: "Operations, growth, and platform controls",
  },
] as const;

export type DashboardAccessFlags = {
  parent?: boolean;
  guru?: boolean;
  ambassador?: boolean;
  admin?: boolean;
};

/** Infer active workspace from the current pathname. */
export function resolveDashboardRoleFromPath(
  pathname: string | null | undefined,
): DashboardSwitchRole | null {
  const path = String(pathname || "");
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/ambassador")) return "ambassador";
  if (path.startsWith("/guru")) return "guru";
  if (
    path.startsWith("/customer") ||
    path.startsWith("/parent") ||
    path.startsWith("/pet-parents")
  ) {
    return "parent";
  }
  return null;
}

/** Available switch targets excluding the active workspace. */
export function getAvailableDashboardSwitches(options: {
  currentRole: DashboardSwitchRole | null;
  access?: DashboardAccessFlags | null;
  includeAdmin?: boolean;
}): DashboardSwitchTarget[] {
  const access = options.access || {};
  const includeAdmin = options.includeAdmin !== false;

  return DASHBOARD_SWITCH_TARGETS.filter((target) => {
    if (target.id === options.currentRole) return false;
    if (target.id === "admin" && !includeAdmin) return false;

    if (target.id === "parent") return Boolean(access.parent);
    if (target.id === "guru") return Boolean(access.guru);
    if (target.id === "ambassador") return Boolean(access.ambassador);
    if (target.id === "admin") return Boolean(access.admin);
    return false;
  });
}
