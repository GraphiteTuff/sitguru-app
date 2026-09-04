import type {
  DirectoryFilters,
  DirectoryRoleFilter,
  DirectorySourceFilter,
  DirectoryStatusFilter,
  DirectoryUser,
} from "@/lib/admin/users/types";
import {
  DEFAULT_DIRECTORY_PAGE_SIZE,
  DIRECTORY_PAGE_SIZE_OPTIONS,
} from "@/lib/admin/users/types";

export function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function formatDateShort(value?: string | null) {
  const raw = asTrimmedString(value);
  if (!raw) return "—";

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isWithinLastDays(value: unknown, days: number) {
  const dateValue = asTrimmedString(value);
  if (!dateValue) return false;

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return parsed >= cutoff;
}

export function firstSearchParam(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) return String(value[0] || "").trim();
  return String(value || "").trim();
}

export function parseDirectoryFilters(
  params: Record<string, string | string[] | undefined> = {},
): DirectoryFilters {
  const roleRaw = firstSearchParam(params.role).toLowerCase();
  const statusRaw = firstSearchParam(params.status).toLowerCase();
  const sourceRaw = firstSearchParam(params.source).toLowerCase();
  const pageRaw = Number(firstSearchParam(params.page) || "1");
  const pageSizeRaw = Number(
    firstSearchParam(params.pageSize) || String(DEFAULT_DIRECTORY_PAGE_SIZE),
  );

  const role = (
    [
      "all",
      "pet_parent",
      "guru",
      "admin",
      "vendor",
      "educator",
      "medical",
      "lead",
    ].includes(roleRaw)
      ? roleRaw
      : "all"
  ) as DirectoryRoleFilter;

  const status = (
    [
      "all",
      "active",
      "verified",
      "pending",
      "suspended",
      "blocked",
      "guest",
      "lead",
    ].includes(statusRaw)
      ? statusRaw
      : "all"
  ) as DirectoryStatusFilter;

  const source = (
    ["all", "profile", "guru", "launch", "hq"].includes(sourceRaw)
      ? sourceRaw
      : "all"
  ) as DirectorySourceFilter;

  const pageSize = DIRECTORY_PAGE_SIZE_OPTIONS.includes(
    pageSizeRaw as (typeof DIRECTORY_PAGE_SIZE_OPTIONS)[number],
  )
    ? pageSizeRaw
    : DEFAULT_DIRECTORY_PAGE_SIZE;

  return {
    q: firstSearchParam(params.q),
    role,
    status,
    source,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
    pageSize,
  };
}

export function getProfileId(profile: Record<string, unknown>) {
  return (
    asTrimmedString(profile.id) ||
    asTrimmedString(profile.user_id) ||
    asTrimmedString(profile.profile_id) ||
    asTrimmedString(profile.email).toLowerCase()
  );
}

export function getProfileName(profile: Record<string, unknown>) {
  const fullName = asTrimmedString(profile.full_name);
  const displayName = asTrimmedString(profile.display_name);
  const name = asTrimmedString(profile.name);
  const first = asTrimmedString(profile.first_name);
  const last = asTrimmedString(profile.last_name);
  const emailLocal = asTrimmedString(profile.email).split("@")[0] || "";

  return (
    fullName ||
    displayName ||
    name ||
    `${first} ${last}`.trim() ||
    emailLocal ||
    "SitGuru User"
  );
}

export function getProfileEmail(profile: Record<string, unknown>) {
  return asTrimmedString(profile.email) || "—";
}

export function getProfilePhone(profile: Record<string, unknown>) {
  return (
    asTrimmedString(profile.phone) ||
    asTrimmedString(profile.phone_number) ||
    asTrimmedString(profile.mobile) ||
    ""
  );
}

export function getProfileAvatar(profile: Record<string, unknown>) {
  return (
    asTrimmedString(profile.avatar_url) ||
    asTrimmedString(profile.profile_photo_url) ||
    asTrimmedString(profile.photo_url) ||
    ""
  );
}

export function getProfileRole(profile: Record<string, unknown>) {
  const rawRole = (
    asTrimmedString(profile.role) ||
    asTrimmedString(profile.user_role) ||
    asTrimmedString(profile.account_type) ||
    asTrimmedString(profile.user_type) ||
    asTrimmedString(profile.type) ||
    "customer"
  ).toLowerCase();

  if (
    rawRole.includes("social_community") ||
    rawRole.includes("social & community")
  ) {
    return "Social & Community";
  }
  if (rawRole.includes("admin") || rawRole.includes("founder") || rawRole.includes("owner")) {
    return "Admin";
  }
  if (rawRole.includes("guru") || rawRole.includes("sitter")) return "Guru";
  if (rawRole.includes("vendor")) return "Vendor";
  if (rawRole.includes("educator")) return "Educator";
  if (rawRole.includes("medical") || rawRole.includes("vet")) return "Medical Pro";
  if (rawRole.includes("customer") || rawRole.includes("parent")) {
    return "Pet Parent";
  }

  return "Pet Parent";
}

export function getProfileStatus(profile: Record<string, unknown>) {
  const rawStatus = (
    asTrimmedString(profile.status) ||
    asTrimmedString(profile.account_status) ||
    asTrimmedString(profile.approval_status) ||
    ""
  ).toLowerCase();

  const isVerified = Boolean(profile.is_verified || profile.verified);
  const isSuspended = Boolean(
    profile.is_suspended ||
      profile.suspended ||
      asTrimmedString(profile.suspended_at),
  );
  const isDeleted = Boolean(
    profile.deleted_at || rawStatus.includes("deleted"),
  );
  const hasName = Boolean(
    asTrimmedString(profile.full_name) ||
      asTrimmedString(profile.display_name) ||
      asTrimmedString(profile.name),
  );
  const hasEmail = Boolean(asTrimmedString(profile.email));

  if (isDeleted || rawStatus.includes("ban") || rawStatus.includes("block")) {
    return "Blocked";
  }

  if (
    isSuspended ||
    rawStatus.includes("suspend") ||
    asTrimmedString(profile.suspended_at)
  ) {
    return "Suspended";
  }

  if (rawStatus.includes("pending")) return "Pending";
  if (rawStatus.includes("review")) return "Pending";
  if (isVerified || rawStatus.includes("verified")) return "Verified";
  if (!hasName || !hasEmail) return "Guest";
  if (rawStatus.includes("active") || rawStatus === "" || rawStatus === "approved") {
    return "Active";
  }

  return "Active";
}

export function getRiskLabel(row: Record<string, unknown>) {
  const rawRisk = (
    asTrimmedString(row.risk) ||
    asTrimmedString(row.risk_level) ||
    asTrimmedString(row.trust_risk) ||
    ""
  ).toLowerCase();

  const flagged = Boolean(row.flagged || row.is_flagged || row.account_flagged);
  const suspended = Boolean(
    row.suspended ||
      row.is_suspended ||
      asTrimmedString(row.suspended_at) ||
      asTrimmedString(row.account_status).toLowerCase() === "suspended",
  );

  if (suspended || rawRisk.includes("high") || rawRisk.includes("block")) {
    return "High";
  }
  if (flagged || rawRisk.includes("medium") || rawRisk.includes("review")) {
    return "Medium";
  }

  return "Low";
}

export function getLaunchIdentity(row: Record<string, unknown>) {
  return (
    asTrimmedString(row.id) ||
    asTrimmedString(row.email).toLowerCase() ||
    asTrimmedString(row.user_id) ||
    asTrimmedString(row.created_at)
  );
}

export function getLaunchRole(row: Record<string, unknown>) {
  const rawRole = (
    asTrimmedString(row.role) ||
    asTrimmedString(row.interest_type) ||
    asTrimmedString(row.interestType) ||
    asTrimmedString(row.joining_as) ||
    asTrimmedString(row.user_type) ||
    asTrimmedString(row.segment) ||
    "customer"
  ).toLowerCase();

  if (rawRole.includes("both")) return "Customer + Guru Lead";
  if (rawRole.includes("guru")) return "Future Guru Lead";
  return "Pet Parent Lead";
}

export function getLaunchName(row: Record<string, unknown>) {
  return (
    asTrimmedString(row.name) ||
    asTrimmedString(row.full_name) ||
    asTrimmedString(row.fullName) ||
    asTrimmedString(row.email).split("@")[0] ||
    "Launch Signup"
  );
}

export function statusBadgeClass(status: string) {
  const value = asTrimmedString(status).toLowerCase();

  if (value.includes("active") || value.includes("verified")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (value.includes("pending") || value.includes("review") || value.includes("guest")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (value.includes("lead")) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  if (
    value.includes("suspended") ||
    value.includes("blocked") ||
    value.includes("deleted")
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function riskBadgeClass(risk: string) {
  if (risk === "High") return "border-rose-200 bg-rose-50 text-rose-700";
  if (risk === "Medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function getMessageHref(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  source: string;
}) {
  const email = user.email !== "—" ? user.email : "";
  const params = new URLSearchParams({
    threadType: user.source === "Launch" ? "internal" : "internal",
    recipientId: user.id,
    recipientName: user.name || "SitGuru Contact",
    recipientRole: user.role || "user",
    source: user.source || "directory",
  });

  if (email) params.set("recipientEmail", email);

  return `/admin/messages?${params.toString()}`;
}

export function getProfileHref(user: {
  id: string;
  email: string;
  role: string;
  source: string;
}) {
  if (user.role === "Guru" || user.role.includes("Guru")) {
    return `/admin/gurus?guru=${encodeURIComponent(user.id)}`;
  }

  if (user.role.includes("Pet Parent") && !user.role.includes("Lead")) {
    return `/admin/petparents?user=${encodeURIComponent(user.id)}`;
  }

  if (user.source === "Launch" || user.role.includes("Lead")) {
    const email = user.email !== "—" ? user.email : "";
    if (email) {
      return `/admin/launch-signups?email=${encodeURIComponent(email)}`;
    }
    return "/admin/launch-signups";
  }

  return `/admin/petparents/${encodeURIComponent(user.id)}`;
}

export function getSettingsHref(user: {
  email: string;
  id?: string;
}) {
  const email = user.email && user.email !== "—" ? user.email : "";
  const params = new URLSearchParams();
  if (email) params.set("q", email);
  if (user.id) params.set("user", user.id);
  return `/admin/settings?${params.toString()}`;
}

export function getScopeHref(user: {
  id: string;
  email: string;
  name: string;
  role: string;
}) {
  const params = new URLSearchParams();
  if (user.id) params.set("user", user.id);
  if (user.email && user.email !== "—") params.set("email", user.email);
  if (user.name) params.set("name", user.name);
  if (user.role) params.set("scopedRole", user.role);
  return `/admin/users?${params.toString()}`;
}

const HIDDEN_DIRECTORY_EMAILS = new Set(["admin@sitguru.com"]);
const HIDDEN_DIRECTORY_NAMES = new Set([
  "test user",
  "admin user",
  "admin hq",
]);

function directoryRowName(row: Record<string, unknown>) {
  return (
    asTrimmedString(row.display_name) ||
    asTrimmedString(row.full_name) ||
    asTrimmedString(row.name) ||
    `${asTrimmedString(row.first_name)} ${asTrimmedString(row.last_name)}`.trim()
  ).toLowerCase();
}

/** Leftover seed profiles with no Auth login — not real people. */
export function isHiddenDirectoryStub(row: Record<string, unknown>): boolean {
  const source = asTrimmedString(row.directory_source || row.source).toLowerCase();
  if (source === "launch") return false;

  const hasAuth =
    source === "auth_user" || Boolean(asTrimmedString(row.auth_user_id));
  if (hasAuth) return false;

  if (source === "profile_without_auth") return true;

  const email = asTrimmedString(row.email).toLowerCase();
  const name = directoryRowName(row);
  const role = asTrimmedString(row.role).toLowerCase();

  if (HIDDEN_DIRECTORY_EMAILS.has(email)) return true;
  if (HIDDEN_DIRECTORY_NAMES.has(name)) return true;
  if (!email && role.includes("admin")) return true;
  if (row.is_archived === true || row.is_test_account === true) return true;

  return false;
}

export function toDirectoryUserFromProfile(
  profile: Record<string, unknown>,
  options?: { forceRole?: string; source?: string },
): DirectoryUser | null {
  const id = getProfileId(profile);
  if (!id) return null;

  const email = getProfileEmail(profile);
  const name = getProfileName(profile);
  const role = options?.forceRole || getProfileRole(profile);
  const source = options?.source || "Profile";
  const joinedAt = asTrimmedString(profile.created_at) || null;

  const base = { id, email, name, role, source };

  return {
    id,
    name,
    email,
    phone: getProfilePhone(profile),
    avatarUrl: getProfileAvatar(profile),
    role,
    status: getProfileStatus(profile),
    risk: getRiskLabel(profile),
    joined: formatDateShort(joinedAt),
    joinedAt,
    source,
    messageHref: getMessageHref(base),
    profileHref: getProfileHref(base),
    scopeHref: getScopeHref(base),
    settingsHref: getSettingsHref(base),
  };
}

export function toDirectoryUserFromIdentity(
  row: Record<string, unknown>,
): DirectoryUser | null {
  const id =
    asTrimmedString(row.profile_id) ||
    asTrimmedString(row.auth_user_id) ||
    asTrimmedString(row.guru_id) ||
    asTrimmedString(row.email).toLowerCase();

  if (!id) return null;

  const email = asTrimmedString(row.email) || "—";
  const name =
    asTrimmedString(row.display_name) ||
    email.split("@")[0] ||
    "SitGuru User";
  const role = getProfileRole(row);
  const source = asTrimmedString(row.directory_source) || "Profile";
  const joinedAt =
    asTrimmedString(row.profile_created_at) ||
    asTrimmedString(row.auth_created_at) ||
    null;
  const actionNeeded = asTrimmedString(row.admin_action_needed).toLowerCase();
  const guruStatus = asTrimmedString(row.guru_status).toLowerCase();
  const actionIsAlert =
    Boolean(actionNeeded) &&
    !["ok", "none", "n/a", "na", "good", "clear"].includes(actionNeeded);

  // Do not trust admin_identity_directory.is_active — it is text and often
  // "false" for live Pet Parents whose profiles.account_status is active.
  let status = "Active";
  if (actionNeeded.includes("suspend") || guruStatus.includes("suspend")) {
    status = "Suspended";
  } else if (guruStatus.includes("pending") || actionNeeded.includes("review")) {
    status = "Pending";
  } else if (guruStatus.includes("verified") || guruStatus.includes("approved")) {
    status = "Verified";
  } else if (!name || email === "—") {
    status = "Guest";
  }

  const base = { id, email, name, role, source };

  return {
    id,
    name,
    email,
    phone: asTrimmedString(row.phone),
    avatarUrl: "",
    role,
    status,
    risk: actionIsAlert ? "Medium" : "Low",
    joined: formatDateShort(joinedAt),
    joinedAt,
    source,
    messageHref: getMessageHref(base),
    profileHref: getProfileHref(base),
    scopeHref: getScopeHref(base),
    settingsHref: getSettingsHref(base),
  };
}

export function toDirectoryUserFromLaunch(
  row: Record<string, unknown>,
): DirectoryUser | null {
  const id = getLaunchIdentity(row);
  if (!id) return null;

  const email = asTrimmedString(row.email) || "—";
  const name = getLaunchName(row);
  const role = getLaunchRole(row);
  const source =
    asTrimmedString(row.source) ||
    asTrimmedString(row.utm_source) ||
    "Launch";
  const joinedAt = asTrimmedString(row.created_at) || null;
  const base = { id, email, name, role, source: "Launch" };

  return {
    id,
    name,
    email,
    phone:
      asTrimmedString(row.phone) ||
      asTrimmedString(row.phone_number) ||
      "",
    avatarUrl: "",
    role,
    status: "Lead",
    risk: "Low",
    joined: formatDateShort(joinedAt),
    joinedAt,
    source,
    messageHref: getMessageHref(base),
    profileHref: getProfileHref(base),
    scopeHref: getScopeHref(base),
    settingsHref: getSettingsHref(base),
  };
}

export function matchesStatusFilter(
  user: DirectoryUser,
  status: DirectoryStatusFilter,
) {
  if (status === "all") return true;
  const value = user.status.toLowerCase();

  if (status === "active") return value === "active";
  if (status === "verified") return value === "verified";
  if (status === "pending") return value.includes("pending");
  if (status === "guest") return value === "guest";
  if (status === "lead") return value === "lead";
  if (status === "suspended") return value === "suspended";
  if (status === "blocked") return value === "blocked";

  return true;
}

export function matchesRoleFilter(
  user: DirectoryUser,
  role: DirectoryRoleFilter,
) {
  if (role === "all") return true;

  const value = user.role.toLowerCase();

  if (role === "pet_parent") {
    return value.includes("pet parent") || value.includes("customer");
  }
  if (role === "guru") return value.includes("guru");
  if (role === "admin") {
    return (
      value.includes("admin") ||
      value.includes("social") ||
      Boolean(user.hqRole)
    );
  }
  if (role === "vendor") return value.includes("vendor");
  if (role === "educator") return value.includes("educator");
  if (role === "medical") return value.includes("medical");
  if (role === "lead") return value.includes("lead");

  return true;
}

export function buildDirectoryHref(
  filters: Partial<DirectoryFilters> & Record<string, string | number | undefined>,
) {
  const params = new URLSearchParams();

  const q = asTrimmedString(filters.q);
  const role = asTrimmedString(filters.role) || "all";
  const status = asTrimmedString(filters.status) || "all";
  const source = asTrimmedString(filters.source) || "all";
  const page = Number(filters.page || 1);
  const pageSize = Number(filters.pageSize || DEFAULT_DIRECTORY_PAGE_SIZE);

  if (q) params.set("q", q);
  if (role && role !== "all") params.set("role", role);
  if (status && status !== "all") params.set("status", status);
  if (source && source !== "all") params.set("source", source);
  if (Number.isFinite(page) && page > 1) params.set("page", String(page));
  if (
    Number.isFinite(pageSize) &&
    pageSize !== DEFAULT_DIRECTORY_PAGE_SIZE
  ) {
    params.set("pageSize", String(pageSize));
  }
  if (filters.user) params.set("user", String(filters.user));
  if (filters.email) params.set("email", String(filters.email));
  if (filters.name) params.set("name", String(filters.name));
  if (filters.scopedRole) params.set("scopedRole", String(filters.scopedRole));

  const qs = params.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}
