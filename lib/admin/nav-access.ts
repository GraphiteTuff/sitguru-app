/**
 * Sidebar sections as job-level on/off switches.
 * Super Admins see every module. Other HQ jobs only see their work.
 */

export const ADMIN_NAV_MODULES = [
  "social_media",
  "operations",
  "growth_marketing",
  "financials",
  "analytics_admin",
] as const;

export type AdminNavModule = (typeof ADMIN_NAV_MODULES)[number];

export type AdminNavAccess = Record<AdminNavModule, boolean>;

export const NAV_SECTION_MODULE: Record<string, AdminNavModule> = {
  "Social Media Manager": "social_media",
  "Growth Portal": "social_media",
  Operations: "operations",
  "Growth & Marketing": "growth_marketing",
  Financials: "financials",
  "Analytics & Admin": "analytics_admin",
};

const ALL_ON = Object.fromEntries(
  ADMIN_NAV_MODULES.map((key) => [key, true]),
) as AdminNavAccess;

function only(keys: AdminNavModule[]): AdminNavAccess {
  const next = Object.fromEntries(
    ADMIN_NAV_MODULES.map((key) => [key, false]),
  ) as AdminNavAccess;
  for (const key of keys) next[key] = true;
  return next;
}

const ROLE_MODULES: Record<string, AdminNavModule[]> = {
  founder: [...ADMIN_NAV_MODULES],
  owner: [...ADMIN_NAV_MODULES],
  super_admin: [...ADMIN_NAV_MODULES],
  super_user: [...ADMIN_NAV_MODULES],
  admin: [...ADMIN_NAV_MODULES],
  executive_viewer: [...ADMIN_NAV_MODULES],

  operations: ["operations"],
  operations_admin: ["operations"],

  hr_admin: ["operations", "analytics_admin"],

  finance_admin: ["financials", "analytics_admin"],
  billing_admin: ["financials", "analytics_admin"],
  finance_viewer: ["financials", "analytics_admin"],

  sales_admin: ["social_media", "growth_marketing"],
  marketing_admin: ["social_media", "growth_marketing"],
  marketing_viewer: ["social_media", "growth_marketing"],
  social_community_manager: ["social_media"],
  partner_admin: ["growth_marketing"],

  support_admin: ["operations"],
  customer_service: ["operations"],
  support_viewer: ["operations"],

  trust_safety_admin: ["operations"],
  guru_approvals_admin: ["operations"],

  tech_support_admin: ["operations", "analytics_admin"],
  technical_support: ["operations", "analytics_admin"],
  systems_admin: [...ADMIN_NAV_MODULES],
  developer_admin: [...ADMIN_NAV_MODULES],
};

export function getAdminNavAccess(
  role: string | null | undefined,
  isSuperUser = false,
): AdminNavAccess {
  if (isSuperUser) return { ...ALL_ON };
  const normalized = String(role || "")
    .trim()
    .toLowerCase();
  const keys = ROLE_MODULES[normalized];
  if (!keys?.length) return only(["operations"]);
  return only(keys);
}

export function isNavSectionOn(
  title: string,
  access: AdminNavAccess | null | undefined,
) {
  if (!access) return true;
  const moduleKey = NAV_SECTION_MODULE[title];
  if (!moduleKey) return true;
  return access[moduleKey];
}
