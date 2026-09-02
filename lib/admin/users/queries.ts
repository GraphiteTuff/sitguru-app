import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminRole } from "@/lib/admin/access";
import {
  asTrimmedString,
  getProfilePhone,
  getProfileRole,
  getProfileStatus,
  getRiskLabel,
  isWithinLastDays,
  matchesRoleFilter,
  matchesStatusFilter,
  isHiddenDirectoryStub,
  toDirectoryUserFromIdentity,
  toDirectoryUserFromLaunch,
  toDirectoryUserFromProfile,
} from "@/lib/admin/users/normalize";
import type {
  DirectoryFilters,
  DirectoryPageResult,
  DirectoryRoleCounts,
  DirectoryTotals,
  DirectoryUser,
} from "@/lib/admin/users/types";

type AnyRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
  count?: number | null;
};

/** Columns that actually exist on production `profiles`. */
const PROFILE_COLUMNS = `
  id,
  email,
  role,
  account_type,
  account_status,
  admin_status,
  approval_status,
  full_name,
  first_name,
  last_name,
  phone,
  avatar_url,
  profile_photo_url,
  is_active,
  is_archived,
  is_test_account,
  suspended_at,
  deactivated_at,
  deleted_at,
  signup_source,
  city,
  state,
  created_at
`;

async function safeQuery(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<SafeQueryResponse> {
  try {
    const result = await query;
    if (result.error) {
      console.warn(`Admin users directory skipped ${label}:`, result.error);
      return { data: [], error: result.error, count: 0 };
    }
    return result;
  } catch (error) {
    console.warn(`Admin users directory skipped ${label}:`, error);
    return { data: [], error, count: 0 };
  }
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  const result = await safeQuery(query, label);
  return Array.isArray(result.data) ? (result.data as T[]) : [];
}

function roleKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function isHqRole(value: string) {
  const normalized = roleKey(value);
  return (
    isAdminRole(normalized) ||
    normalized === "social_community_manager" ||
    normalized.includes("social") ||
    normalized.includes("marketing")
  );
}

async function loadHqAssignments() {
  const [accessRows, roleRows] = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_user_access")
        .select("user_id,email,role_key,is_active")
        .eq("is_active", true)
        .limit(4000),
      "admin_user_access_directory",
    ),
    safeRows<AnyRow>(
      supabaseAdmin.from("user_roles").select("user_id,role").limit(8000),
      "user_roles_directory",
    ),
  ]);

  const byId = new Map<string, string>();
  const byEmail = new Map<string, string>();

  for (const row of roleRows) {
    const id = asTrimmedString(row.user_id).toLowerCase();
    const role = asTrimmedString(row.role);
    if (id && isHqRole(role)) byId.set(id, role);
  }

  for (const row of accessRows) {
    const id = asTrimmedString(row.user_id).toLowerCase();
    const email = asTrimmedString(row.email).toLowerCase();
    const role = asTrimmedString(row.role_key);
    if (id && role) byId.set(id, role);
    if (email && role) byEmail.set(email, role);
  }

  return { byId, byEmail };
}

function applyHqRole(
  user: DirectoryUser,
  hq: { byId: Map<string, string>; byEmail: Map<string, string> },
): DirectoryUser {
  const hqRole =
    hq.byId.get(user.id.toLowerCase()) ||
    (user.email !== "—" ? hq.byEmail.get(user.email.toLowerCase()) : "") ||
    "";

  if (!hqRole) return user;

  return {
    ...user,
    hqRole,
    role: user.role === "Pet Parent" || user.role === "Guru" ? user.role : user.role,
  };
}

async function loadIdentityRows(): Promise<DirectoryUser[]> {
  const [identity, profiles] = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_identity_directory")
        .select(
          "directory_source,display_name,role,email,phone,auth_user_id,profile_id,guru_id,guru_status,admin_action_needed,profile_created_at,auth_created_at,auth_last_sign_in_at",
        )
        .limit(4000),
      "admin_identity_directory",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(4000),
      "profiles_directory",
    ),
  ]);

  const profileById = new Map<string, AnyRow>();
  const profileByEmail = new Map<string, AnyRow>();
  for (const profile of profiles) {
    const id = asTrimmedString(profile.id).toLowerCase();
    const email = asTrimmedString(profile.email).toLowerCase();
    if (id) profileById.set(id, profile);
    if (email) profileByEmail.set(email, profile);
  }

  if (identity.length) {
    return identity
      .filter((row) => !isHiddenDirectoryStub(row))
      .map((row) => {
        const user = toDirectoryUserFromIdentity(row);
        if (!user) return null;

        const profile =
          profileById.get(user.id.toLowerCase()) ||
          (user.email !== "—"
            ? profileByEmail.get(user.email.toLowerCase())
            : undefined);

        if (!profile) return user;

        return {
          ...user,
          role: getProfileRole(profile),
          status: getProfileStatus(profile),
          risk: getRiskLabel(profile),
          phone: getProfilePhone(profile) || user.phone,
        };
      })
      .filter(Boolean) as DirectoryUser[];
  }

  return profiles
    .filter((row) => !isHiddenDirectoryStub(row))
    .map((row) => toDirectoryUserFromProfile(row))
    .filter(Boolean) as DirectoryUser[];
}

async function loadLaunchRows(): Promise<DirectoryUser[]> {
  const [signups, waitlist] = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin
        .from("launch_signups")
        .select(
          "id,email,name,full_name,phone,role,interest_type,joining_as,user_type,segment,source,utm_source,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(500),
      "launch_signups",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("launch_waitlist")
        .select(
          "id,email,name,full_name,phone,role,interest_type,joining_as,user_type,segment,source,utm_source,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(500),
      "launch_waitlist",
    ),
  ]);

  const seen = new Set<string>();
  const merged: DirectoryUser[] = [];

  for (const row of [...signups, ...waitlist]) {
    const user = toDirectoryUserFromLaunch(row);
    if (!user) continue;
    const key = `${user.id.toLowerCase()}|${user.email.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(user);
  }

  return merged;
}

function filterDirectoryUsers(
  users: DirectoryUser[],
  filters: DirectoryFilters,
) {
  const q = filters.q.toLowerCase();

  return users.filter((user) => {
    if (filters.role !== "all" && !matchesRoleFilter(user, filters.role)) {
      return false;
    }
    if (filters.status !== "all" && !matchesStatusFilter(user, filters.status)) {
      return false;
    }
    if (filters.source === "profile" && user.source === "Launch") return false;
    if (filters.source === "guru" && user.role !== "Guru") return false;
    if (filters.source === "launch" && user.source !== "Launch") return false;
    if (filters.source === "hq" && !user.hqRole && !isHqRole(user.role)) {
      return false;
    }
    if (!q) return true;

    const haystack =
      `${user.name} ${user.email} ${user.phone} ${user.role} ${user.hqRole || ""} ${user.id}`.toLowerCase();
    return haystack.includes(q);
  });
}

function sortNewest(users: DirectoryUser[]) {
  return [...users].sort((a, b) => {
    const aTime = Date.parse(a.joinedAt || "");
    const bTime = Date.parse(b.joinedAt || "");
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
}

function buildTotals(users: DirectoryUser[]): {
  totals: DirectoryTotals;
  roleCounts: DirectoryRoleCounts;
} {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const profiles = users.filter((user) => user.source !== "Launch");
  const leads = users.filter((user) => user.source === "Launch");
  const gurus = users.filter((user) => user.role === "Guru");
  const flagged = users.filter(
    (user) => user.status === "Suspended" || user.status === "Blocked",
  );
  const verifiedGurus = gurus.filter((user) => user.status === "Verified").length;
  const newThisWeek = users.filter((user) => {
    const time = Date.parse(user.joinedAt || "");
    return Number.isFinite(time) && time >= weekAgo;
  }).length;

  const totalUsers = users.length;
  const flaggedAccounts = flagged.length;
  const healthScore =
    totalUsers === 0
      ? 0
      : Math.max(0, Math.min(100, Math.round(100 - (flaggedAccounts / totalUsers) * 100)));

  return {
    totals: {
      totalUsers,
      filteredTotal: totalUsers,
      newThisWeek,
      verifiedGurus,
      flaggedAccounts,
      healthScore,
      launchLeads: leads.length,
      profileCount: profiles.length,
      guruCount: gurus.length,
    },
    roleCounts: {
      petParents: users.filter((user) => user.role === "Pet Parent").length,
      gurus: gurus.length,
      vendors: users.filter((user) => user.role === "Vendor").length,
      educators: users.filter((user) => user.role === "Educator").length,
      medical: users.filter((user) => user.role === "Medical Pro").length,
      admins: users.filter(
        (user) =>
          Boolean(user.hqRole) ||
          user.role === "Admin" ||
          user.role === "Social & Community",
      ).length,
      leads: leads.length,
    },
  };
}

export async function getAdminUsersDirectory(
  filters: DirectoryFilters,
): Promise<DirectoryPageResult> {
  const [identityUsers, launchUsers, hq] = await Promise.all([
    loadIdentityRows(),
    loadLaunchRows(),
    loadHqAssignments(),
  ]);

  const seen = new Set<string>();
  const merged: DirectoryUser[] = [];

  for (const user of [...identityUsers, ...launchUsers]) {
    const withHq = applyHqRole(user, hq);
    if (isHiddenDirectoryStub({ ...withHq, directory_source: withHq.source })) {
      continue;
    }
    const key = `${withHq.id.toLowerCase()}|${withHq.email.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(withHq);
  }

  const { totals, roleCounts } = buildTotals(merged);
  const filtered = sortNewest(filterDirectoryUsers(merged, filters));
  const from = (filters.page - 1) * filters.pageSize;
  const pageRows = filtered.slice(from, from + filters.pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / filters.pageSize));

  return {
    users: pageRows,
    totals: {
      ...totals,
      filteredTotal: filtered.length,
      newThisWeek:
        totals.newThisWeek ||
        pageRows.filter((user) => isWithinLastDays(user.joinedAt, 7)).length,
    },
    roleCounts,
    filters,
    pageCount,
  };
}
