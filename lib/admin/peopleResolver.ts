import { supabaseAdmin } from "@/lib/supabase/admin";

export type AdminPersonRole =
  | "guru"
  | "pet_parent"
  | "ambassador"
  | "admin"
  | "unknown";

export type AdminPersonSource =
  | "profiles"
  | "gurus"
  | "ambassadors"
  | "pet_parents"
  | "auth.users"
  | "merged";

export type AdminPerson = {
  userId: string;
  profileId: string;
  guruId: string;
  ambassadorId: string;
  petParentId: string;
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
  email?: string | null;
  created_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
};

export function adminString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstNonEmpty(...values: unknown[]) {
  return values.map(adminString).find(Boolean) || "";
}

function lower(value: unknown) {
  return adminString(value).toLowerCase();
}

function normalizeRole(value: unknown): AdminPersonRole {
  const role = lower(value).replace(/[\s-]+/g, "_");

  if (["guru", "sitter", "provider", "walker", "dog_walker"].includes(role)) {
    return "guru";
  }

  if (["ambassador", "sitguru_rep", "representative", "rep"].includes(role)) {
    return "ambassador";
  }

  if (["pet_parent", "customer", "client", "parent", "petparent"].includes(role)) {
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

function cleanNameFromEmail(email: string) {
  const localPart = adminString(email).split("@")[0] || "";

  return localPart
    .replace(/[._-]+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function isIdLike(value: string) {
  const normalized = adminString(value);

  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized) ||
    /^[0-9a-f]{24,}$/i.test(normalized)
  );
}

function getInitials(name: string, email: string) {
  const source = adminString(name) || cleanNameFromEmail(email) || "SitGuru";

  return (
    source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "SG"
  );
}

function metadataValue(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
) {
  return adminString(metadata?.[key]);
}

function authMetadataValue(user: AuthUserRow, keys: string[]) {
  for (const key of keys) {
    const userValue = metadataValue(user.user_metadata, key);
    if (userValue) return userValue;

    const appValue = metadataValue(user.app_metadata, key);
    if (appValue) return appValue;
  }

  return "";
}

function getKeys(person: AdminPerson) {
  return Array.from(
    new Set(
      [
        person.userId,
        person.profileId,
        person.guruId,
        person.ambassadorId,
        person.petParentId,
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

function finalizePerson(person: AdminPerson): AdminPerson {
  const fallbackName = cleanNameFromEmail(person.email);
  const candidateName = firstNonEmpty(
    person.displayName,
    `${person.firstName} ${person.lastName}`.trim(),
    fallbackName,
    person.email,
  );
  const displayName = candidateName && !isIdLike(candidateName) ? candidateName : "Needs Cleanup";
  const isUnknown = displayName === "Needs Cleanup";

  return {
    ...person,
    displayName,
    roleLabel: roleLabel(person.role),
    initials: getInitials(displayName, person.email),
    isUnknown,
    isIncomplete: isUnknown || !person.email,
  };
}

function mergePeople(existing: AdminPerson, incoming: AdminPerson): AdminPerson {
  const role = chooseRole(existing.role, incoming.role);
  const source = existing.source === incoming.source ? existing.source : "merged";

  return finalizePerson({
    userId: firstNonEmpty(existing.userId, incoming.userId),
    profileId: firstNonEmpty(existing.profileId, incoming.profileId),
    guruId: firstNonEmpty(existing.guruId, incoming.guruId),
    ambassadorId: firstNonEmpty(existing.ambassadorId, incoming.ambassadorId),
    petParentId: firstNonEmpty(existing.petParentId, incoming.petParentId),
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
    sourceLabel: source === "merged" ? "Merged" : firstNonEmpty(incoming.sourceLabel, existing.sourceLabel),
    isIncomplete: false,
    isUnknown: false,
    initials: "",
  });
}

function addPerson(map: Map<string, AdminPerson>, person: AdminPerson | null) {
  if (!person) return;

  const keys = getKeys(person);
  const primaryKey = keys[0];
  if (!primaryKey) return;

  const matchedKey = keys.find((key) => map.has(key));

  if (matchedKey) {
    const existing = map.get(matchedKey) || person;
    const merged = mergePeople(existing, person);
    const mergedKeys = Array.from(
      new Set([...getKeys(existing), ...keys, ...getKeys(merged)]),
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

function basePerson(source: AdminPersonSource, sourceLabel: string): AdminPerson {
  return {
    userId: "",
    profileId: "",
    guruId: "",
    ambassadorId: "",
    petParentId: "",
    email: "",
    displayName: "",
    firstName: "",
    lastName: "",
    role: "unknown",
    roleLabel: "Unknown",
    avatarUrl: "",
    city: "",
    state: "",
    joinedAt: "",
    source,
    sourceLabel,
    isIncomplete: false,
    isUnknown: false,
    initials: "SG",
  };
}

function buildProfilePerson(row: SourceRow): AdminPerson | null {
  const profileId = firstNonEmpty(row.id, row.user_id, row.profile_id);
  if (!profileId) return null;

  const firstName = adminString(row.first_name);
  const lastName = adminString(row.last_name);
  const role = normalizeRole(firstNonEmpty(row.role, row.account_type, row.type));

  return finalizePerson({
    ...basePerson("profiles", "Profile"),
    userId: profileId,
    profileId,
    email: adminString(row.email),
    displayName: firstNonEmpty(row.full_name, row.display_name, row.name),
    firstName,
    lastName,
    role,
    avatarUrl: firstNonEmpty(row.profile_photo_url, row.photo_url, row.avatar_url, row.avatar_path, row.image_url, row.picture, row.picture_url),
    city: firstNonEmpty(row.city, row.service_city),
    state: firstNonEmpty(row.state, row.service_state, row.state_code),
    joinedAt: adminString(row.created_at),
  });
}

function buildGuruPerson(row: SourceRow): AdminPerson | null {
  const guruId = adminString(row.id);
  const userId = firstNonEmpty(row.user_id, row.profile_id, guruId);
  if (!userId && !guruId) return null;

  const firstName = adminString(row.first_name);
  const lastName = adminString(row.last_name);

  return finalizePerson({
    ...basePerson("gurus", "Guru"),
    userId,
    profileId: firstNonEmpty(row.profile_id, row.user_id),
    guruId,
    email: adminString(row.email),
    displayName: firstNonEmpty(row.display_name, row.full_name, row.name),
    firstName,
    lastName,
    role: "guru",
    avatarUrl: firstNonEmpty(row.profile_photo_url, row.photo_url, row.avatar_url, row.avatar_path, row.image_url, row.headshot_url, row.picture, row.picture_url),
    city: firstNonEmpty(row.city, row.service_city),
    state: firstNonEmpty(row.state, row.service_state, row.state_code),
    joinedAt: adminString(row.created_at),
  });
}

function buildAmbassadorPerson(row: SourceRow): AdminPerson | null {
  const ambassadorId = adminString(row.id);
  const userId = firstNonEmpty(row.user_id, row.profile_id, ambassadorId);
  if (!userId && !ambassadorId) return null;

  const firstName = adminString(row.first_name);
  const lastName = adminString(row.last_name);

  return finalizePerson({
    ...basePerson("ambassadors", "Ambassador"),
    userId,
    profileId: firstNonEmpty(row.profile_id, row.user_id),
    ambassadorId,
    email: adminString(row.email),
    displayName: firstNonEmpty(row.display_name, row.full_name, row.name),
    firstName,
    lastName,
    role: "ambassador",
    avatarUrl: firstNonEmpty(
      row.ambassador_photo_url,
      row.ambassador_photo_path,
      row.profile_photo_url,
      row.photo_url,
      row.avatar_url,
      row.avatar_path,
      row.image_url,
      row.picture,
      row.picture_url,
    ),
    city: firstNonEmpty(row.city, row.service_city),
    state: firstNonEmpty(row.state, row.service_state, row.state_code),
    joinedAt: adminString(row.created_at),
  });
}

function buildPetParentPerson(row: SourceRow): AdminPerson | null {
  const petParentId = adminString(row.id);
  const userId = firstNonEmpty(row.user_id, row.profile_id, petParentId);
  if (!userId && !petParentId) return null;

  const firstName = adminString(row.first_name);
  const lastName = adminString(row.last_name);

  return finalizePerson({
    ...basePerson("pet_parents", "Pet Parent"),
    userId,
    profileId: firstNonEmpty(row.profile_id, row.user_id),
    petParentId,
    email: adminString(row.email),
    displayName: firstNonEmpty(row.display_name, row.full_name, row.name, row.parent_name, row.customer_name),
    firstName,
    lastName,
    role: "pet_parent",
    avatarUrl: firstNonEmpty(row.profile_photo_url, row.photo_url, row.avatar_url, row.avatar_path, row.image_url, row.picture, row.picture_url),
    city: firstNonEmpty(row.city, row.service_city),
    state: firstNonEmpty(row.state, row.service_state, row.state_code),
    joinedAt: adminString(row.created_at),
  });
}

function buildAuthPerson(user: AuthUserRow): AdminPerson | null {
  if (!user.id) return null;

  const firstName = authMetadataValue(user, ["first_name", "firstName"]);
  const lastName = authMetadataValue(user, ["last_name", "lastName"]);
  const role = normalizeRole(authMetadataValue(user, ["role", "user_role", "account_type"]));

  return finalizePerson({
    ...basePerson("auth.users", "Auth User"),
    userId: user.id,
    profileId: user.id,
    email: adminString(user.email),
    displayName: firstNonEmpty(
      authMetadataValue(user, ["full_name", "display_name", "name"]),
      `${firstName} ${lastName}`.trim(),
    ),
    firstName,
    lastName,
    role,
    avatarUrl: firstNonEmpty(
      authMetadataValue(user, ["avatar_url", "picture", "profile_photo_url", "photo_url"]),
    ),
    joinedAt: adminString(user.created_at),
  });
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

  const haystack = [
    person.userId,
    person.profileId,
    person.guruId,
    person.ambassadorId,
    person.petParentId,
    person.displayName,
    person.email,
    person.roleLabel,
    person.city,
    person.state,
    person.sourceLabel,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function sortPeople(people: AdminPerson[]) {
  return [...people].sort((a, b) => {
    const aCleanup = a.isIncomplete ? 1 : 0;
    const bCleanup = b.isIncomplete ? 1 : 0;

    return (
      aCleanup - bCleanup ||
      a.displayName.localeCompare(b.displayName, undefined, {
        sensitivity: "base",
      })
    );
  });
}

export function buildAdminPersonLookup(people: AdminPerson[]) {
  const map = new Map<string, AdminPerson>();

  for (const person of people) {
    for (const key of getKeys(person)) {
      map.set(key, person);
      map.set(key.toLowerCase(), person);
    }
  }

  return map;
}

export async function getAdminPeopleDirectory({
  query = "",
  limit = 5000,
  includeUserIds = [],
}: {
  query?: string;
  limit?: number;
  includeUserIds?: string[];
} = {}) {
  const [profiles, gurus, ambassadors, petParents, authUsers] = await Promise.all([
    safeRows<SourceRow>(supabaseAdmin.from("profiles").select("*").limit(5000), "profiles"),
    safeRows<SourceRow>(supabaseAdmin.from("gurus").select("*").limit(5000), "gurus"),
    safeRows<SourceRow>(supabaseAdmin.from("ambassadors").select("*").limit(5000), "ambassadors"),
    safeRows<SourceRow>(supabaseAdmin.from("pet_parents").select("*").limit(5000), "pet_parents"),
    getAuthUsers(),
  ]);

  const map = new Map<string, AdminPerson>();

  profiles.forEach((row) => addPerson(map, buildProfilePerson(row)));
  gurus.forEach((row) => addPerson(map, buildGuruPerson(row)));
  ambassadors.forEach((row) => addPerson(map, buildAmbassadorPerson(row)));
  petParents.forEach((row) => addPerson(map, buildPetParentPerson(row)));
  authUsers.forEach((user) => addPerson(map, buildAuthPerson(user)));

  const seen = new Set<AdminPerson>();
  const people = Array.from(map.values()).filter((person) => {
    if (seen.has(person)) return false;
    seen.add(person);
    return true;
  });

  const includeSet = new Set(includeUserIds.map(adminString).filter(Boolean));
  const search = adminString(query);

  const filtered = people.filter(
    (person) =>
      includeSet.has(person.userId) ||
      includeSet.has(person.profileId) ||
      includeSet.has(person.guruId) ||
      includeSet.has(person.ambassadorId) ||
      includeSet.has(person.petParentId) ||
      includeSet.has(person.email.toLowerCase()) ||
      personMatchesQuery(person, search),
  );

  return sortPeople(filtered).slice(0, Math.max(limit, includeSet.size));
}
