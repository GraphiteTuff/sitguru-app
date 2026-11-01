import {
  ADMIN_NAV_MODULES,
  getAdminNavAccess,
  type AdminNavAccess,
  type AdminNavModule,
} from "@/lib/admin/nav-access";

export const PORTAL_AREA_OPTIONS: {
  key: AdminNavModule;
  label: string;
  detail: string;
}[] = [
  {
    key: "social_media",
    label: "Growth Portal",
    detail: "Campaigns, content, events, partners, and the internship desk.",
  },
  {
    key: "growth_marketing",
    label: "Growth & Marketing",
    detail: "Sales, referrals, programs, email updates, and market growth.",
  },
  {
    key: "operations",
    label: "Operations",
    detail: "Bookings, pet parents, gurus, ambassadors, HR, support, and messages.",
  },
  {
    key: "financials",
    label: "Financials",
    detail: "Books, banking, payouts, tax, and commissions.",
  },
  {
    key: "analytics_admin",
    label: "Analytics & Admin",
    detail: "Reports, insights, audit trail, and settings.",
  },
];

const PORTAL_AREA_PREFIXES: Record<AdminNavModule, readonly string[]> = {
  social_media: ["/admin/growth", "/admin/internship"],
  growth_marketing: [
    "/admin/sales-marketing",
    "/admin/community",
    "/admin/referrals",
    "/admin/market-growth",
    "/admin/partners",
    "/admin/programs",
    "/admin/email-updates",
  ],
  operations: [
    "/admin/dashboard",
    "/admin/bookings",
    "/admin/petparents",
    "/admin/gurus",
    "/admin/ambassadors",
    "/admin/hr",
    "/admin/ambassador-training",
    "/admin/university-assignments",
    "/admin/university-progress",
    "/admin/background-checks",
    "/admin/support",
    "/admin/messages",
    "/admin/customers",
    "/admin/users",
    "/admin/account-lifecycle",
  ],
  financials: [
    "/admin/financials",
    "/admin/commissions",
    "/admin/payouts",
    "/admin/tax",
  ],
  analytics_admin: [
    "/admin/analytics",
    "/admin/insights",
    "/admin/settings",
    "/admin/audit-trail",
    "/admin/security",
    "/admin/exports",
  ],
};

const PORTAL_HOME: { key: AdminNavModule; href: string }[] = [
  { key: "social_media", href: "/manager" },
  { key: "operations", href: "/admin" },
  { key: "growth_marketing", href: "/admin/sales-marketing" },
  { key: "financials", href: "/admin/financials" },
  { key: "analytics_admin", href: "/admin/analytics" },
];

function emptyModules(): AdminNavAccess {
  return Object.fromEntries(
    ADMIN_NAV_MODULES.map((key) => [key, false]),
  ) as AdminNavAccess;
}

export function isPortalAreaKey(value: string): value is AdminNavModule {
  return (ADMIN_NAV_MODULES as readonly string[]).includes(value);
}

/** Null means the role default. An array is an explicit Super Admin choice. */
export function parsePortalAreas(value: unknown): AdminNavModule[] | null {
  if (!Array.isArray(value)) return null;
  const keys = value
    .map((item) => String(item || "").trim())
    .filter(isPortalAreaKey);
  return [...new Set(keys)];
}

export function modulesFromPortalAreas(
  areas: readonly string[] | null | undefined,
): AdminNavAccess {
  const next = emptyModules();
  for (const area of parsePortalAreas(areas) || []) next[area] = true;
  return next;
}

export function effectivePortalModules(input: {
  role: string | null | undefined;
  isSuperUser?: boolean;
  portalAreas: readonly string[] | null;
}): AdminNavAccess {
  if (input.isSuperUser) return getAdminNavAccess(input.role, true);
  if (input.portalAreas) return modulesFromPortalAreas(input.portalAreas);
  return getAdminNavAccess(input.role, false);
}

export function portalAreasIncludeFinancials(
  areas: readonly string[] | null | undefined,
) {
  return Boolean(parsePortalAreas(areas)?.includes("financials"));
}

export function isGrowthWorkspace(
  modules: AdminNavAccess,
  isSuperUser = false,
) {
  if (isSuperUser) return false;
  return (
    modules.social_media &&
    !modules.operations &&
    !modules.growth_marketing &&
    !modules.financials &&
    !modules.analytics_admin
  );
}

export function portalHomePath(areas: readonly string[] | null | undefined) {
  const modules = modulesFromPortalAreas(areas);
  return (
    PORTAL_HOME.find((area) => modules[area.key])?.href || "/manager"
  );
}

export function isAdminPathAllowedForModules(
  pathname: string,
  modules: AdminNavAccess,
) {
  if (pathname === "/admin/login" || pathname === "/") return true;
  if (ADMIN_NAV_MODULES.every((key) => modules[key])) return true;
  if (
    (pathname === "/admin" || pathname === "/admin/") &&
    modules.operations
  ) {
    return true;
  }

  return ADMIN_NAV_MODULES.some((key) => {
    if (!modules[key]) return false;
    return PORTAL_AREA_PREFIXES[key].some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  });
}
