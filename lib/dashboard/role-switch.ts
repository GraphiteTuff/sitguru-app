/**
 * Shared dashboard role-switch targets and authorized-role helpers.
 * Pet Parent always maps to `/customer/dashboard`.
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

const ROLE_ORDER: DashboardSwitchRole[] = [
  "parent",
  "guru",
  "ambassador",
  "admin",
];

function normalizeToken(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function expandRoleToken(value: unknown): DashboardSwitchRole[] {
  const raw = normalizeToken(value);
  if (!raw) return [];

  if (
    raw === "both" ||
    raw.includes("pet_parent_and_guru") ||
    raw.includes("customer_guru") ||
    raw.includes("parent_and_guru")
  ) {
    return ["parent", "guru"];
  }

  if (raw.includes("admin") || raw.includes("super_admin")) {
    return ["admin"];
  }

  if (raw.includes("ambassador")) {
    return ["ambassador"];
  }

  if (
    raw.includes("guru") ||
    raw.includes("provider") ||
    raw.includes("sitter")
  ) {
    return ["guru"];
  }

  if (
    raw === "parent" ||
    raw.includes("pet_parent") ||
    raw.includes("petparent") ||
    raw.includes("customer") ||
    raw.includes("pet_owner") ||
    raw.includes("client")
  ) {
    return ["parent"];
  }

  return [];
}

function uniqueOrderedRoles(roles: DashboardSwitchRole[]) {
  const set = new Set(roles);
  return ROLE_ORDER.filter((role) => set.has(role));
}

/** Parse profile.authorizedRoles / authorized_roles (array, CSV, or JSON string). */
export function parseAuthorizedRoles(value: unknown): DashboardSwitchRole[] {
  if (value == null) return [];

  const chunks: unknown[] = [];

  if (Array.isArray(value)) {
    chunks.push(...value);
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        return parseAuthorizedRoles(JSON.parse(trimmed));
      } catch {
        // fall through to CSV split
      }
    }
    chunks.push(...trimmed.split(/[,|;]/).map((part) => part.trim()));
  } else {
    chunks.push(value);
  }

  const roles: DashboardSwitchRole[] = [];
  for (const chunk of chunks) {
    roles.push(...expandRoleToken(chunk));
  }
  return uniqueOrderedRoles(roles);
}

export function accessFlagsFromAuthorizedRoles(
  roles: readonly DashboardSwitchRole[],
): DashboardAccessFlags {
  return {
    parent: roles.includes("parent"),
    guru: roles.includes("guru"),
    ambassador: roles.includes("ambassador"),
    admin: roles.includes("admin"),
  };
}

export function authorizedRolesFromAccessFlags(
  access: DashboardAccessFlags | null | undefined,
): DashboardSwitchRole[] {
  if (!access) return [];
  const roles: DashboardSwitchRole[] = [];
  if (access.parent) roles.push("parent");
  if (access.guru) roles.push("guru");
  if (access.ambassador) roles.push("ambassador");
  if (access.admin) roles.push("admin");
  return roles;
}

/**
 * Resolve the authorized role track list from profile / auth payload sources.
 * Prefers an explicit `authorizedRoles` (or `authorized_roles`) collection when present.
 */
export function resolveAuthorizedRolesFromProfile(input: {
  profile?: Record<string, unknown> | null;
  roleRows?: Array<string | null | undefined> | null;
  metadata?: Record<string, unknown> | null;
  hasGuruRecord?: boolean;
  hasAmbassadorRecord?: boolean;
}): DashboardSwitchRole[] {
  const profile = input.profile || {};
  const metadata = input.metadata || {};

  const explicit = uniqueOrderedRoles([
    ...parseAuthorizedRoles(profile.authorizedRoles),
    ...parseAuthorizedRoles(profile.authorized_roles),
    ...parseAuthorizedRoles(metadata.authorizedRoles),
    ...parseAuthorizedRoles(metadata.authorized_roles),
  ]);

  if (explicit.length) {
    const withRecords = [...explicit];
    if (input.hasGuruRecord && !withRecords.includes("guru")) {
      withRecords.push("guru");
    }
    if (input.hasAmbassadorRecord && !withRecords.includes("ambassador")) {
      withRecords.push("ambassador");
    }
    return uniqueOrderedRoles(withRecords);
  }

  const signals: unknown[] = [
    profile.role,
    profile.account_type,
    profile.signup_role,
    profile.account_intent,
    metadata.role,
    metadata.account_type,
    metadata.signup_role,
    metadata.account_intent,
    ...(input.roleRows || []),
  ];

  const derived: DashboardSwitchRole[] = [];
  for (const signal of signals) {
    derived.push(...expandRoleToken(signal));
  }

  if (profile.is_pet_parent === true || profile.is_customer === true) {
    derived.push("parent");
  }
  if (profile.is_guru === true || profile.is_guru_interested === true) {
    derived.push("guru");
  }
  if (profile.is_ambassador === true) {
    derived.push("ambassador");
  }
  if (input.hasGuruRecord) derived.push("guru");
  if (input.hasAmbassadorRecord) derived.push("ambassador");

  return uniqueOrderedRoles(derived);
}

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

/** Available switch targets for authorized roles, excluding the active workspace. */
export function getAvailableDashboardSwitches(options: {
  currentRole: DashboardSwitchRole | null;
  authorizedRoles?: readonly DashboardSwitchRole[] | null;
  access?: DashboardAccessFlags | null;
  includeAdmin?: boolean;
}): DashboardSwitchTarget[] {
  const includeAdmin = options.includeAdmin !== false;
  const authorized = uniqueOrderedRoles([
    ...(options.authorizedRoles || []),
    ...authorizedRolesFromAccessFlags(options.access),
  ]);

  if (!authorized.length) return [];

  return DASHBOARD_SWITCH_TARGETS.filter((target) => {
    if (target.id === options.currentRole) return false;
    if (target.id === "admin" && !includeAdmin) return false;
    return authorized.includes(target.id);
  });
}

export function toRoleSwitchOptions(
  targets: readonly DashboardSwitchTarget[],
): Array<{ id: DashboardSwitchRole; label: string; href: string; helper: string }> {
  return targets.map((target) => ({
    id: target.id,
    label: target.label,
    href: target.path,
    helper: target.helper,
  }));
}

/** Map signup onboarding intent to the authorized dashboard track list. */
export function authorizedRolesFromSignupIntent(
  intent: string | null | undefined,
): DashboardSwitchRole[] {
  const normalized = normalizeToken(intent);
  if (normalized === "both" || normalized === "pet_parent_and_guru") {
    return ["parent", "guru"];
  }
  if (normalized === "guru" || normalized === "future_guru") {
    return ["guru"];
  }
  if (normalized === "ambassador") {
    return ["ambassador"];
  }
  if (
    normalized === "pet_parent" ||
    normalized === "customer" ||
    normalized === "parent"
  ) {
    return ["parent"];
  }
  return expandRoleToken(intent);
}
