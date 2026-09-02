import { supabaseAdmin } from "@/lib/supabase/admin";

type AnyRow = Record<string, unknown>;

export type PetParentRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  source: string;
  createdAt: string | null;
  lastSeenAt: string | null;
  petCount: number;
  bookingCount: number;
  incomplete: boolean;
};

export type PetParentSummary = {
  total: number;
  new24h: number;
  new7d: number;
  new30d: number;
  withPets: number;
  withBookings: number;
  withPhone: number;
  withLocation: number;
  incomplete: number;
  newest: PetParentRecord[];
};

const PARENT_ROLES = new Set([
  "customer",
  "pet_parent",
  "pet-parent",
  "pet parent",
  "parent",
  "client",
]);

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function withinDays(value: string | null, days: number) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
}

export function isPetParentRole(role: string, accountType = "", signupRole = "") {
  const primary = role.toLowerCase().replace(/[_-]+/g, " ").trim();
  if (["guru", "admin", "ambassador"].includes(primary)) return false;
  if (PARENT_ROLES.has(primary)) return true;
  const fallback = accountType.toLowerCase().replace(/[_-]+/g, " ").trim();
  if (!primary && PARENT_ROLES.has(fallback)) return true;
  const signup = signupRole.toLowerCase().replace(/[_-]+/g, " ").trim();
  return !primary && !fallback && PARENT_ROLES.has(signup);
}

export function isLivePetParentProfile(row: AnyRow) {
  if (row.deleted_at || row.archived_at) return false;
  if (row.is_archived === true || row.is_demo === true || row.is_test_account === true) {
    return false;
  }
  const adminStatus = text(row.admin_status).toLowerCase();
  if (["archived", "spam", "likely_spam", "deleted", "test"].some((status) =>
    adminStatus.includes(status),
  )) {
    return false;
  }
  return isPetParentRole(
    text(row.role),
    text(row.account_type),
    text(row.signup_role),
  );
}

function displayName(row: AnyRow) {
  return (
    text(row.full_name) ||
    [text(row.first_name), text(row.last_name)].filter(Boolean).join(" ") ||
    text(row.email).split("@")[0] ||
    "Pet Parent"
  );
}

function ownerKey(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = text(row[key]);
    if (value) return value;
  }
  return "";
}

async function safeRows(table: string, columns: string, limit = 4000) {
  try {
    const result = await supabaseAdmin
      .from(table)
      .select(columns)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (result.error) {
      console.warn(`Pet Parent query skipped ${table}:`, result.error);
      return [] as AnyRow[];
    }
    return (result.data || []) as AnyRow[];
  } catch (error) {
    console.warn(`Pet Parent query skipped ${table}:`, error);
    return [] as AnyRow[];
  }
}

export async function listLivePetParents(): Promise<PetParentRecord[]> {
  const [profiles, pets, bookings] = await Promise.all([
    safeRows(
      "profiles",
      "id,full_name,first_name,last_name,email,phone,role,account_type,signup_role,city,state,zip_code,signup_source,source,admin_status,is_demo,is_test_account,is_archived,archived_at,deleted_at,created_at,last_seen_at",
      4000,
    ),
    safeRows("pets", "id,owner_profile_id,owner_id,user_id,customer_id,pet_parent_id", 4000),
    safeRows(
      "bookings",
      "id,customer_id,user_id,pet_owner_id,pet_parent_id,client_id",
      4000,
    ),
  ]);

  const petCounts = new Map<string, number>();
  for (const pet of pets) {
    const id = ownerKey(pet, [
      "owner_profile_id",
      "owner_id",
      "user_id",
      "customer_id",
      "pet_parent_id",
    ]);
    if (!id) continue;
    petCounts.set(id, (petCounts.get(id) || 0) + 1);
  }

  const bookingCounts = new Map<string, number>();
  for (const booking of bookings) {
    const id = ownerKey(booking, [
      "customer_id",
      "user_id",
      "pet_owner_id",
      "pet_parent_id",
      "client_id",
    ]);
    if (!id) continue;
    bookingCounts.set(id, (bookingCounts.get(id) || 0) + 1);
  }

  return profiles
    .filter(isLivePetParentProfile)
    .map((row) => {
      const id = text(row.id);
      const email = text(row.email);
      const phone = text(row.phone);
      const city = text(row.city);
      const zipCode = text(row.zip_code);
      const petCount = petCounts.get(id) || 0;
      const bookingCount = bookingCounts.get(id) || 0;
      return {
        id,
        name: displayName(row),
        email,
        phone,
        city,
        state: text(row.state),
        zipCode,
        source: text(row.signup_source) || text(row.source) || "SitGuru signup",
        createdAt: text(row.created_at) || null,
        lastSeenAt: text(row.last_seen_at) || null,
        petCount,
        bookingCount,
        incomplete: !email || !phone || (!city && !zipCode) || petCount === 0,
      };
    });
}

export async function getPetParentSummary(): Promise<PetParentSummary> {
  const parents = await listLivePetParents();
  return {
    total: parents.length,
    new24h: parents.filter((row) => withinDays(row.createdAt, 1)).length,
    new7d: parents.filter((row) => withinDays(row.createdAt, 7)).length,
    new30d: parents.filter((row) => withinDays(row.createdAt, 30)).length,
    withPets: parents.filter((row) => row.petCount > 0).length,
    withBookings: parents.filter((row) => row.bookingCount > 0).length,
    withPhone: parents.filter((row) => row.phone.length >= 10).length,
    withLocation: parents.filter((row) => row.city || row.zipCode).length,
    incomplete: parents.filter((row) => row.incomplete).length,
    newest: parents.slice(0, 12),
  };
}

export function isNewPetParent(createdAt: string | null, hours = 48) {
  return withinDays(createdAt, hours / 24);
}
