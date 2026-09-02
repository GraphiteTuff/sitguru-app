export type DirectoryRoleFilter =
  | "all"
  | "pet_parent"
  | "guru"
  | "admin"
  | "vendor"
  | "educator"
  | "medical"
  | "lead";

export type DirectoryStatusFilter =
  | "all"
  | "active"
  | "verified"
  | "pending"
  | "suspended"
  | "blocked"
  | "guest"
  | "lead";

export type DirectorySourceFilter = "all" | "profile" | "guru" | "launch" | "hq";

export type DirectoryFilters = {
  q: string;
  role: DirectoryRoleFilter;
  status: DirectoryStatusFilter;
  source: DirectorySourceFilter;
  page: number;
  pageSize: number;
};

export type DirectoryUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  role: string;
  hqRole?: string;
  status: string;
  risk: string;
  joined: string;
  joinedAt: string | null;
  source: string;
  settingsHref?: string;
  messageHref: string;
  profileHref: string;
  scopeHref: string;
};

export type DirectoryTotals = {
  totalUsers: number;
  filteredTotal: number;
  newThisWeek: number;
  verifiedGurus: number;
  flaggedAccounts: number;
  healthScore: number;
  launchLeads: number;
  profileCount: number;
  guruCount: number;
};

export type DirectoryRoleCounts = {
  petParents: number;
  gurus: number;
  vendors: number;
  educators: number;
  medical: number;
  admins: number;
  leads: number;
};

export type DirectoryPageResult = {
  users: DirectoryUser[];
  totals: DirectoryTotals;
  roleCounts: DirectoryRoleCounts;
  filters: DirectoryFilters;
  pageCount: number;
};

export const DIRECTORY_PAGE_SIZE_OPTIONS = [25, 50, 75] as const;
export const DEFAULT_DIRECTORY_PAGE_SIZE = 25;

export const DIRECTORY_ROLE_OPTIONS: Array<{
  value: DirectoryRoleFilter;
  label: string;
}> = [
  { value: "all", label: "All roles" },
  { value: "pet_parent", label: "Pet Parents" },
  { value: "guru", label: "Gurus" },
  { value: "admin", label: "Admins / HQ" },
  { value: "vendor", label: "Vendors" },
  { value: "educator", label: "Educators" },
  { value: "medical", label: "Medical Pros" },
  { value: "lead", label: "Launch Leads" },
];

export const DIRECTORY_STATUS_OPTIONS: Array<{
  value: DirectoryStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "guest", label: "Guest" },
  { value: "lead", label: "Lead" },
  { value: "suspended", label: "Suspended" },
  { value: "blocked", label: "Blocked" },
];
