import { supabaseAdmin } from "@/lib/supabase/admin";

export type AdminPersonRole =
  | "guru"
  | "pet_parent"
  | "ambassador"
  | "admin"
  | "unknown";

export type AdminPersonSource =
  | "gurus"
  | "profiles"
  | "ambassadors"
  | "auth.users"
  | "merged";

export type AdminPerson = {
  userId: string;
  profileId: string;
  guruId: string;
  ambassadorId: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  role: AdminPersonRole;
  roleLabel: string;
  avatarUrl: string;
  city: string;
  state: string;
  joinedAt: string;
  source: AdminPersonSource;
  sourceLabel: string;
  isIncomplete: boolean;
  isUnknown: boolean;
  initials: string;
};

type SourceRow = Record<string, unknown>;

type AuthUserRow = {
  id: string;
  email?: string;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
};

export function adminString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function lower(value: unknown) {
  return adminString(value).toLowerCase();
}

function firstNonEmpty(...values: unknown[]) {
  return values.map(adminString).find(Boolean) || "";
}

function normalizeRole(value: unknown): AdminPersonRole {
  const role = lower(value).replace(/[\s-]+/g, "_");

  if (["guru", "sitter", "provider", "walker", "dog_walker"].includes(role)) {
    return "guru";
  }

  if (["ambassador", "sitguru_rep", "representative", "rep"].includes(role)) {
    return "ambassador";
  }

  if (["pet_parent", "customer", "client", "parent"].includes(role)) {
    return "pet_parent";
  }

  if (["admin", "super_admin", "owner"].includes(role)) {
    return "admin";
  }

  return "unknown";
}

function roleLabel(role: AdminPersonRole) {
  switch (role) {
    case "guru":
      return "Guru";
    case "pet_parent":
      return "Pet Parent";
    case "ambassador":
      return "Ambassador";
    case "admin":
      return "Admin";
    default:
      return "Unknown";
  }
}

function cleanEmailNameFallback(email: string) {
  const local = adminString(email).split("@")[0] || "";

  return local
    .replace(/[._-]+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function initialsFromName(name: string, email: string) {
  const candidate = adminString(name) || cleanEmailNameFallback(email) || "SG";

  return candidate
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "SG";
}

function getMetadataString(
  source: Record<string, unknown> | null | undefined,
  key: string,
) {
  return adminString(source?.[key]);
}

function getAuthRole(user: AuthUserRow) {
  return firstNonEmpty(
    getMetadataString(user.user_metadata, "role"),
    getMetadataString(user.user_metadata, "user_role"),
    getMetadataString(user.user_metadata, "account_role"),
    getMetadataString(user.app_metadata, "role"),
    getMetadataString(user.app_metadata, "user_role"),
    getMetadataString(user.app_metadata, "account_role"),
  );
}

function getPersonIdentityKeys(person: AdminPerson) {
  return Array.from(
    new Set(
      [
        person.userId,
        person.profileId,
        person.guruId,
        person.ambassadorId,
        person.email.toLowerCase(),
      ].filter(Boolean),
    ),
  );
}

function chooseRole(current: AdminPersonRole, incoming: AdminPersonRole) {
  const rank: Record<AdminPersonRole, number> = {
    unknown: 0,
    pet_parent: 1,
    ambassador: 2,
    guru: 3,
    admin: 4,
  };

  return rank[incoming] > rank[current] ? incoming : current;
}

function mergePeople(existing: AdminPerson, incoming: AdminPerson): AdminPerson {
  const role = chooseRole(existing.role, incoming.role);
  const source = existing.source === incoming.source ? existing.source : "merged";

  const merged: AdminPerson = {
    userId: firstNonEmpty(existing.userId, incoming.userId),
    profileId: firstNonEmpty(existing.profileId, incoming.profileId),
    guruId: firstNonEmpty(existing.guruId, incoming.guruId),
    ambassadorId: firstNonEmpty(existing.ambassadorId, incoming.ambassadorId),
    email: firstNonEmpty(existing.email, incoming.email),
    displayName: firstNonEmpty(existing.displayName, incoming.displayName),
    firstName: firstNonEmpty(existing.firstName, incoming.firstName),
    lastName: firstNonEmpty(existing.lastName, incoming.lastName),
    role,
    roleLabel: roleLabel(role),
    avatarUrl: firstNonEmpty(existing.avatarUrl, incoming.avatarUrl),
    city: firstNonEmpty(existing.city, incoming.city),
    state: firstNonEmpty(existing.state, incoming.state),
    joinedAt: firstNonEmpty(existing.joinedAt, incoming.joinedAt),
    source,
    sourceLabel: source === "merged" ? "Merged" : incoming.sourceLabel || existing.sourceLabel,
    isIncomplete: false,
    isUnknown: false,
    initials: "",
  };

  const fallbackName = cleanEmailNameFallback(merged.email);
  merged.displayName = firstNonEmpty(
    merged.displayName,
    `${merged.firstName} ${merged.lastName}`.trim(),
    fallbackName,
    merged.email,
    merged.userId,
    "Unknown User",
  );
  merged.initials = initialsFromName(merged.displayName, merged.email);
  merged.isUnknown =
    !merged.email &&
    !merged.firstName &&
    !merged.lastName &&
    (!merged.displayName || merged.displayName === merged.userId || merged.displayName === "Unknown User");
  merged.isIncomplete = !merged.email || merged.isUnknown;

  return merged;
}

function addPersonToMap(map: Map<string, AdminPerson>, person: AdminPerson) {
  const keys = getPersonIdentityKeys(person);
  const primaryKey = keys[0];

  if (!primaryKey) return;

  const matchedKey = keys.find((key) => map.has(key));

  if (matchedKey) {
    const existing = map.get(matchedKey) || person;
    const merged = mergePeople(existing, person);
    const mergedKeys = Array.from(
      new Set([
        ...getPersonIdentityKeys(existing),
        ...keys,
        ...getPersonIdentityKeys(merged),
      ]),
    );

    for (const key of mergedKeys) {
      map.set(key, merged);
    }

    return;
  }

  for (const key of keys) {
    map.set(key, person);
  }
}

function buildPersonFromProfile(row: SourceRow): AdminPerson | null {
  const profileId = firstNonEmpty(row.id, row.user_id, row.profile_id);
  if (!profileId) return null;

  const firstName = adminString(row.first_name);
  const lastName = adminString(row.last_name);
  const email = adminString(row.email);
  const role = normalizeRole(firstNonEmpty(row.role, row.account_type));
  const displayName = firstNonEmpty(
    row.full_name,
    row.display_name,
    row.name,
    `${firstName} ${lastName}`.trim(),
    cleanEmailNameFallback(email),
    email,
    profileId,
  );

  const person: AdminPerson = {
    userId: profileId,
    profileId,
    guruId: "",
    ambassadorId: "",
    email,
    displayName,
    firstName,
    lastName,
    role,
    roleLabel: roleLabel(role),
    avatarUrl: firstNonEmpty(row.profile_photo_url, row.photo_url, row.avatar_url, row.image_url),
    city: firstNonEmpty(row.city, row.service_city),
    state: firstNonEmpty(row.state, row.service_state, row.state_code),
    joinedAt: adminString(row.created_at),
    source: "profiles",
    sourceLabel: "Profile",
    isIncomplete: false,
    isUnknown: false,
    initials: "",
  };

  return mergePeople(person, person);
}

function buildPersonFromGuru(row: SourceRow): AdminPerson | null {
  const guruId = adminString(row.id);
  const userId = firstNonEmpty(row.user_id, row.profile_id, guruId);
  if (!userId && !guruId) return null;

  const firstName = adminString(row.first_name);
  const lastName = adminString(row.last_name);
  const email = adminString(row.email);
  const displayName = firstNonEmpty(
    row.display_name,
    row.full_name,
    row.name,
    `${firstName} ${lastName}`.trim(),
    cleanEmailNameFallback(email),
    email,
    userId,
  );

  const person: AdminPerson = {
    userId,
    profileId: firstNonEmpty(row.profile_id, row.user_id),
    guruId,
    ambassadorId: "",
    email,
    displayName,
    firstName,
    lastName,
    role: "guru",
    roleLabel: "Guru",
    avatarUrl: firstNonEmpty(row.profile_photo_url, row.photo_url, row.avatar_url, row.image_url, row.headshot_url),
    city: firstNonEmpty(row.city, row.service_city),
    state: firstNonEmpty(row.state, row.service_state, row.state_code),
    joinedAt: adminString(row.created_at),
    source: "gurus",
    sourceLabel: "Guru",
    isIncomplete: false,
    isUnknown: false,
    initials: "",
  };

  return mergePeople(person, person);
}

function buildPersonFromAmbassador(row: SourceRow): AdminPerson | null {
  const ambassadorId = adminString(row.id);
  const userId = firstNonEmpty(row.user_id, row.profile_id, ambassadorId);
  if (!userId && !ambassadorId) return null;

  const firstName = adminString(row.first_name);
  const lastName = adminString(row.last_name);
  const email = adminString(row.email);
  const displayName = firstNonEmpty(
    row.display_name,
    row.full_name,
    row.name,
    `${firstName} ${lastName}`.trim(),
    cleanEmailNameFallback(email),
    email,
    userId,
  );

  const person: AdminPerson = {
    userId,
    profileId: firstNonEmpty(row.profile_id, row.user_id),
    guruId: "",
    ambassadorId,
    email,
    displayName,
    firstName,
    lastName,
    role: "ambassador",
    roleLabel: "Ambassador",
    avatarUrl: firstNonEmpty(row.profile_photo_url, row.photo_url, row.avatar_url, row.image_url),
    city: firstNonEmpty(row.city, row.service_city),
    state: firstNonEmpty(row.state, row.service_state, row.state_code),
    joinedAt: adminString(row.created_at),
    source: "ambassadors",
    sourceLabel: "Ambassador",
    isIncomplete: false,
    isUnknown: false,
    initials: "",
  };

  return mergePeople(person, person);
}

function buildPersonFromAuthUser(user: AuthUserRow): AdminPerson | null {
  if (!user.id) return null;

  const firstName = firstNonEmpty(
    getMetadataString(user.user_metadata, "first_name"),
    getMetadataString(user.app_metadata, "first_name"),
  );
  const lastName = firstNonEmpty(
    getMetadataString(user.user_metadata, "last_name"),
    getMetadataString(user.app_metadata, "last_name"),
  );
  const email = adminString(user.email);
  const role = normalizeRole(getAuthRole(user));
  const displayName = firstNonEmpty(
    getMetadataString(user.user_metadata, "full_name"),
    getMetadataString(user.user_metadata, "display_name"),
    getMetadataString(user.user_metadata, "name"),
    getMetadataString(user.app_metadata, "full_name"),
    getMetadataString(user.app_metadata, "display_name"),
    getMetadataString(user.app_metadata, "name"),
    `${firstName} ${lastName}`.trim(),
    cleanEmailNameFallback(email),
    email,
    user.id,
  );

  const person: AdminPerson = {
    userId: user.id,
    profileId: user.id,
    guruId: "",
    ambassadorId: "",
    email,
    displayName,
    firstName,
    lastName,
    role,
    roleLabel: roleLabel(role),
    avatarUrl: firstNonEmpty(
      getMetadataString(user.user_metadata, "picture"),
      getMetadataString(user.user_metadata, "avatar_url"),
      getMetadataString(user.app_metadata, "picture"),
      getMetadataString(user.app_metadata, "avatar_url"),
    ),
    city: "",
    state: "",
    joinedAt: adminString(user.created_at),
    source: "auth.users",
    sourceLabel: "Auth User",
    isIncomplete: false,
    isUnknown: false,
    initials: "",
  };

  return mergePeople(person, person);
}

async function safeRows<T>(
  query: PromiseLike<{ data: unknown; error: unknown }>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin people resolver skipped ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Admin people resolver skipped ${label}:`, error);
    return [];
  }
}

async function getAuthUsers() {
  const users: AuthUserRow[] = [];
  let page = 1;
  const perPage = 1000;

  try {
    while (page <= 5) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.warn("Admin people resolver skipped auth.users:", error);
        break;
      }

      const pageUsers = Array.isArray(data?.users) ? data.users : [];
      users.push(...(pageUsers as AuthUserRow[]));

      if (pageUsers.length < perPage) break;
      page += 1;
    }
  } catch (error) {
    console.warn("Admin people resolver skipped auth.users:", error);
  }

  return users;
}

function personMatchesQuery(person: AdminPerson, query: string) {
  if (!query) return true;

  const searchable = [
    person.userId,
    person.profileId,
    person.guruId,
    person.ambassadorId,
    person.displayName,
    person.email,
    person.roleLabel,
    person.city,
    person.state,
    person.sourceLabel,
  ]
    .join(" ")
    .toLowerCase();

  return searchable.includes(query.toLowerCase());
}

function sortPeople(people: AdminPerson[]) {
  return [...people].sort((left, right) => {
    const leftIncomplete = left.isIncomplete ? 1 : 0;
    const rightIncomplete = right.isIncomplete ? 1 : 0;

    return (
      leftIncomplete - rightIncomplete ||
      left.displayName.localeCompare(right.displayName, undefined, {
        sensitivity: "base",
      })
    );
  });
}

export async function getAdminPeopleDirectory({
  query = "",
  limit = 75,
  includeUserIds = [],
}: {
  query?: string;
  limit?: number;
  includeUserIds?: string[];
} = {}) {
  const [profiles, gurus, ambassadors, authUsers] = await Promise.all([
    safeRows<SourceRow>(
      supabaseAdmin.from("profiles").select("*").limit(2000),
      "profiles",
    ),
    safeRows<SourceRow>(
      supabaseAdmin.from("gurus").select("*").limit(2000),
      "gurus",
    ),
    safeRows<SourceRow>(
      supabaseAdmin.from("ambassadors").select("*").limit(2000),
      "ambassadors",
    ),
    getAuthUsers(),
  ]);

  const map = new Map<string, AdminPerson>();

  profiles.forEach((row) => {
    const person = buildPersonFromProfile(row);
    if (person) addPersonToMap(map, person);
  });

  gurus.forEach((row) => {
    const person = buildPersonFromGuru(row);
    if (person) addPersonToMap(map, person);
  });

  ambassadors.forEach((row) => {
    const person = buildPersonFromAmbassador(row);
    if (person) addPersonToMap(map, person);
  });

  authUsers.forEach((user) => {
    const person = buildPersonFromAuthUser(user);
    if (person) addPersonToMap(map, person);
  });

  const seenObjects = new Set<AdminPerson>();
  const people = Array.from(map.values()).filter((person) => {
    if (seenObjects.has(person)) return false;
    seenObjects.add(person);
    return true;
  });

  const includeSet = new Set(includeUserIds.map((id) => adminString(id)).filter(Boolean));
  const normalizedQuery = adminString(query);

  const filtered = people.filter(
    (person) => includeSet.has(person.userId) || personMatchesQuery(person, normalizedQuery),
  );

  return sortPeople(filtered).slice(0, Math.max(limit, includeSet.size));
}
