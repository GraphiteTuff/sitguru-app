import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  asTrimmedString,
  isWithinLastDays,
  matchesRoleFilter,
  matchesStatusFilter,
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

const PROFILE_COLUMNS = `
  id,
  email,
  role,
  account_status,
  approval_status,
  full_name,
  display_name,
  name,
  first_name,
  last_name,
  phone,
  phone_number,
  avatar_url,
  profile_photo_url,
  is_verified,
  verified,
  is_active,
  active,
  is_suspended,
  suspended,
  suspended_at,
  deactivated_at,
  deleted_at,
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

function roleDbValues(role: DirectoryFilters["role"]) {
  if (role === "pet_parent") return ["customer", "pet_parent", "parent", "client"];
  if (role === "guru") return ["guru", "sitter", "provider"];
  if (role === "admin") return ["admin", "super_admin"];
  if (role === "vendor") return ["vendor"];
  if (role === "educator") return ["educator"];
  if (role === "medical") return ["medical", "vet", "medical_pro"];
  return null;
}

function statusDbValues(status: DirectoryFilters["status"]) {
  if (status === "active") return ["active", "approved"];
  if (status === "pending") return ["pending", "review", "under_review"];
  if (status === "suspended") return ["suspended"];
  if (status === "blocked") return ["deleted", "banned", "blocked"];
  return null;
}

function wantsLaunchOnly(filters: DirectoryFilters) {
  return (
    filters.role === "lead" ||
    filters.status === "lead" ||
    filters.source === "launch"
  );
}

function wantsProfiles(filters: DirectoryFilters) {
  if (wantsLaunchOnly(filters)) return false;
  if (filters.source === "launch") return false;
  return true;
}

async function countExact(
  table: string,
  apply?: (query: any) => any,
): Promise<number> {
  let query = supabaseAdmin
    .from(table)
    .select("id", { count: "exact", head: true });

  if (apply) query = apply(query);

  const result = await safeQuery(query, `${table}_count`);
  return typeof result.count === "number" ? result.count : 0;
}

async function loadProfilePage(filters: DirectoryFilters): Promise<{
  users: DirectoryUser[];
  filteredTotal: number;
}> {
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let query = supabaseAdmin
    .from("profiles")
    .select(PROFILE_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false });

  const roles = roleDbValues(filters.role);
  if (roles) query = query.in("role", roles);

  const statuses = statusDbValues(filters.status);
  if (statuses) query = query.in("account_status", statuses);

  if (filters.status === "verified") {
    query = query.or("is_verified.eq.true,verified.eq.true,account_status.eq.verified");
  }

  if (filters.q) {
    const q = filters.q.replace(/[%_,]/g, " ").trim();
    if (q) {
      query = query.or(
        `full_name.ilike.%${q}%,display_name.ilike.%${q}%,name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`,
      );
    }
  }

  query = query.range(from, to);

  const result = await safeQuery(query, "profiles_page");
  const rows = Array.isArray(result.data) ? (result.data as AnyRow[]) : [];

  let users = rows
    .map((row) => toDirectoryUserFromProfile(row))
    .filter(Boolean) as DirectoryUser[];

  // Guest is derived client-side from incomplete profiles.
  if (filters.status === "guest") {
    users = users.filter((user) => user.status === "Guest");
  } else if (filters.status !== "all" && !statuses && filters.status !== "verified") {
    users = users.filter((user) => matchesStatusFilter(user, filters.status));
  }

  return {
    users,
    filteredTotal:
      typeof result.count === "number" ? result.count : users.length,
  };
}

async function loadLaunchPage(filters: DirectoryFilters): Promise<{
  users: DirectoryUser[];
  filteredTotal: number;
}> {
  const [signups, waitlist] = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin
        .from("launch_signups")
        .select(
          "id,email,name,full_name,phone,phone_number,role,interest_type,joining_as,user_type,segment,source,utm_source,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(500),
      "launch_signups",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("launch_waitlist")
        .select(
          "id,email,name,full_name,phone,phone_number,role,interest_type,joining_as,user_type,segment,source,utm_source,created_at",
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

  const q = filters.q.toLowerCase();
  let filtered = merged;

  if (filters.role !== "all") {
    filtered = filtered.filter((user) => matchesRoleFilter(user, filters.role));
  }

  if (filters.status !== "all") {
    filtered = filtered.filter((user) => matchesStatusFilter(user, filters.status));
  }

  if (q) {
    filtered = filtered.filter((user) => {
      const haystack = `${user.name} ${user.email} ${user.phone} ${user.role}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  filtered.sort((a, b) => {
    const aTime = Date.parse(a.joinedAt || "");
    const bTime = Date.parse(b.joinedAt || "");
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });

  const from = (filters.page - 1) * filters.pageSize;
  const pageRows = filtered.slice(from, from + filters.pageSize);

  return {
    users: pageRows,
    filteredTotal: filtered.length,
  };
}

async function loadGuruOrphans(
  filters: DirectoryFilters,
  knownIds: Set<string>,
): Promise<DirectoryUser[]> {
  if (filters.role !== "all" && filters.role !== "guru") return [];
  if (filters.source === "profile" || filters.source === "launch") return [];
  if (wantsLaunchOnly(filters)) return [];

  const gurus = await safeRows<AnyRow>(
    supabaseAdmin
      .from("gurus")
      .select(
        "id,user_id,profile_id,email,display_name,full_name,name,slug,status,approval_status,is_verified,verified,is_active,active,phone,phone_number,avatar_url,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(250),
    "gurus_orphans",
  );

  const orphans: DirectoryUser[] = [];

  for (const guru of gurus) {
    const id =
      asTrimmedString(guru.user_id) ||
      asTrimmedString(guru.profile_id) ||
      asTrimmedString(guru.id) ||
      asTrimmedString(guru.email).toLowerCase();

    const email = asTrimmedString(guru.email).toLowerCase();
    if (!id) continue;
    if (knownIds.has(id.toLowerCase()) || (email && knownIds.has(email))) {
      continue;
    }

    const mapped = toDirectoryUserFromProfile(
      {
        ...guru,
        id,
        role: "guru",
      },
      { forceRole: "Guru", source: "Guru" },
    );

    if (!mapped) continue;
    if (!matchesStatusFilter(mapped, filters.status)) continue;
    if (filters.q) {
      const haystack =
        `${mapped.name} ${mapped.email} ${mapped.phone}`.toLowerCase();
      if (!haystack.includes(filters.q.toLowerCase())) continue;
    }

    orphans.push(mapped);
  }

  return orphans;
}

async function loadTotals(): Promise<{
  totals: DirectoryTotals;
  roleCounts: DirectoryRoleCounts;
}> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekIso = weekAgo.toISOString();

  const [
    profileCount,
    launchCount,
    waitlistCount,
    guruCount,
    newProfiles,
    newLaunch,
    newWaitlist,
    suspendedCount,
    adminCount,
    customerCount,
    guruRoleCount,
    vendorCount,
    educatorCount,
    medicalCount,
    recentProfiles,
  ] = await Promise.all([
    countExact("profiles"),
    countExact("launch_signups"),
    countExact("launch_waitlist"),
    countExact("gurus"),
    countExact("profiles", (q) => q.gte("created_at", weekIso)),
    countExact("launch_signups", (q) => q.gte("created_at", weekIso)),
    countExact("launch_waitlist", (q) => q.gte("created_at", weekIso)),
    countExact("profiles", (q) => q.eq("account_status", "suspended")),
    countExact("profiles", (q) => q.in("role", ["admin", "super_admin"])),
    countExact("profiles", (q) =>
      q.in("role", ["customer", "pet_parent", "parent", "client"]),
    ),
    countExact("profiles", (q) => q.in("role", ["guru", "sitter", "provider"])),
    countExact("profiles", (q) => q.eq("role", "vendor")),
    countExact("profiles", (q) => q.eq("role", "educator")),
    countExact("profiles", (q) => q.in("role", ["medical", "vet", "medical_pro"])),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("profiles")
        .select("id,role,account_status,is_verified,verified,created_at")
        .order("created_at", { ascending: false })
        .limit(300),
      "recent_profiles_for_kpi",
    ),
  ]);

  const launchLeads = launchCount + waitlistCount;
  const totalUsers = profileCount + launchLeads;
  const newThisWeek = newProfiles + newLaunch + newWaitlist;

  const verifiedGurus = recentProfiles.filter((row) => {
    const role = asTrimmedString(row.role).toLowerCase();
    const isGuru =
      role.includes("guru") || role.includes("sitter") || role.includes("provider");
    return (
      isGuru &&
      (Boolean(row.is_verified || row.verified) ||
        asTrimmedString(row.account_status).toLowerCase() === "verified")
    );
  }).length;

  const flaggedAccounts = Math.max(
    suspendedCount,
    recentProfiles.filter((row) => {
      const status = asTrimmedString(row.account_status).toLowerCase();
      return status === "suspended" || status === "deleted" || status === "blocked";
    }).length,
  );

  const healthScore =
    totalUsers === 0
      ? 0
      : Math.max(
          0,
          Math.min(100, Math.round(100 - (flaggedAccounts / totalUsers) * 100)),
        );

  return {
    totals: {
      totalUsers,
      filteredTotal: totalUsers,
      newThisWeek,
      verifiedGurus: Math.max(verifiedGurus, 0),
      flaggedAccounts,
      healthScore,
      launchLeads,
      profileCount,
      guruCount,
    },
    roleCounts: {
      petParents: customerCount,
      gurus: Math.max(guruRoleCount, guruCount),
      vendors: vendorCount,
      educators: educatorCount,
      medical: medicalCount,
      admins: adminCount,
      leads: launchLeads,
    },
  };
}

export async function getAdminUsersDirectory(
  filters: DirectoryFilters,
): Promise<DirectoryPageResult> {
  const [{ totals, roleCounts }, pageResult] = await Promise.all([
    loadTotals(),
    wantsProfiles(filters) ? loadProfilePage(filters) : loadLaunchPage(filters),
  ]);

  let users = pageResult.users;
  let filteredTotal = pageResult.filteredTotal;

  if (wantsProfiles(filters) && filters.page === 1 && !filters.q) {
    const known = new Set(
      users.flatMap((user) => [
        user.id.toLowerCase(),
        user.email !== "—" ? user.email.toLowerCase() : "",
      ]).filter(Boolean),
    );
    const orphans = await loadGuruOrphans(filters, known);
    if (orphans.length) {
      // Show orphan gurus at the top of page 1 only, without breaking pagination count.
      users = [...orphans.slice(0, 5), ...users].slice(0, filters.pageSize);
    }
  }

  // If user asked for launch mixed into "all", append a small lead sample on page 1.
  if (
    filters.source === "all" &&
    filters.role === "all" &&
    filters.status === "all" &&
    filters.page === 1 &&
    !filters.q
  ) {
    const leads = await loadLaunchPage({
      ...filters,
      role: "lead",
      status: "lead",
      source: "launch",
      page: 1,
      pageSize: 5,
    });
    const known = new Set(
      users.map((user) => `${user.id}|${user.email}`.toLowerCase()),
    );
    const extra = leads.users.filter(
      (user) => !known.has(`${user.id}|${user.email}`.toLowerCase()),
    );
    if (extra.length) {
      users = [...users, ...extra].slice(0, filters.pageSize);
    }
  }

  const pageCount = Math.max(1, Math.ceil(filteredTotal / filters.pageSize));

  return {
    users,
    totals: {
      ...totals,
      filteredTotal,
      // Keep new-this-week honest even when page is filtered.
      newThisWeek: totals.newThisWeek ||
        users.filter((user) => isWithinLastDays(user.joinedAt, 7)).length,
    },
    roleCounts,
    filters,
    pageCount,
  };
}
