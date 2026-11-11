import { GROWTH_HIRE_ROLE } from "@/lib/admin/growth/hire";
import { isHardcodedSuperUserEmail } from "@/lib/admin/super-users";
import { listInterns } from "@/lib/internship/queries";
import { excludeFromInternPortalList } from "@/lib/internship/team-roster";
import {
  hideFromInternDirectory,
  isGrowthManagerSeat,
  isLiveAgentSeat,
  sortStaffDirectoryPeople,
} from "@/lib/messaging/chat-library";
import { mapUsersOnline } from "@/lib/messaging/presence";
import {
  AVA_STAFF_EMAIL,
  AVA_STAFF_USER_ID,
  DANETTE_STAFF_EMAIL,
  DANETTE_STAFF_USER_ID,
  JASON_STAFF_EMAIL,
  JASON_STAFF_USER_ID,
  KNOWN_STAFF_CHAT_SEATS,
  staffAvatarFallback,
} from "@/lib/messaging/staff-avatars";
import { resolvePetParentAvatarUrl } from "@/lib/pet-parent-avatar";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type StaffDirectoryPerson = {
  id: string;
  firstName: string;
  avatarUrl: string;
  detail: string;
  online?: boolean;
  canChat: boolean;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function firstName(value: string) {
  return value.split(/\s+/).filter(Boolean)[0] || "SitGuru";
}

/** Hide QA / placeholder seats from Staff and Inbox. */
export function isTestDirectoryPerson(input: {
  firstName?: string | null;
  fullName?: string | null;
  email?: string | null;
  subject?: string | null;
  preview?: string | null;
}) {
  const name = `${input.firstName || ""} ${input.fullName || ""}`.trim().toLowerCase();
  const email = text(input.email).toLowerCase();
  const subject = text(input.subject).toLowerCase();
  const preview = text(input.preview).toLowerCase();
  if (name === "test" || name.startsWith("test ")) return true;
  if (email.startsWith("test@") || email.includes("+test@")) return true;
  if (subject === "test" || subject === "test message") return true;
  if (preview === "test" || preview === "test message") return true;
  return false;
}

export function isTestInboxThread(input: {
  name?: string | null;
  subject?: string | null;
  preview?: string | null;
  email?: string | null;
}) {
  return isTestDirectoryPerson({
    firstName: input.name,
    fullName: input.name,
    subject: input.subject,
    preview: input.preview,
    email: input.email,
  });
}

function profileAvatar(row: Record<string, unknown>, extras?: Record<string, unknown> | null) {
  return (
    resolvePetParentAvatarUrl(row) ||
    resolvePetParentAvatarUrl({
      profile_photo_url: text(extras?.ambassador_photo_url) || null,
      photo_url: text(extras?.ambassador_photo_path) || null,
      avatar_url: text(extras?.avatar_url) || null,
    }) ||
    staffAvatarFallback({ email: text(row.email), userId: text(row.id) }) ||
    ""
  );
}

async function loadProfileMap(ids: string[]) {
  const unique = [...new Set(ids.map((id) => text(id)).filter(Boolean))];
  if (!unique.length) return new Map<string, Record<string, unknown>>();
  const { data } = await supabaseAdmin
    .from("profiles")
    .select(
      "id,email,first_name,full_name,last_name,avatar_url,profile_photo_url,photo_url,image_url,role,account_type,signup_role",
    )
    .in("id", unique);
  return new Map(((data || []) as Record<string, unknown>[]).map((row) => [text(row.id), row]));
}

async function loadAmbassadorPhotos(ids: string[]) {
  const unique = [...new Set(ids.map((id) => text(id)).filter(Boolean))];
  if (!unique.length) return new Map<string, Record<string, unknown>>();
  const { data } = await supabaseAdmin
    .from("ambassadors")
    .select("user_id,ambassador_photo_url,ambassador_photo_path")
    .in("user_id", unique);
  return new Map(
    ((data || []) as Record<string, unknown>[])
      .map((row) => [text(row.user_id), row] as const)
      .filter(([id]) => Boolean(id)),
  );
}

/** Same Staff roster for Admin, Ava, and interns across web + mobile clients. */
export async function loadSharedStaffDirectory(input: {
  actorUserId: string;
  query?: string;
  /** People → Staff should be managers/admins only. Interns use the Interns tab. */
  includeInterns?: boolean;
}) {
  const query = text(input.query).toLowerCase();
  const includeInterns = input.includeInterns !== false;
  const people: StaffDirectoryPerson[] = [];
  const seen = new Set<string>();

  const push = (person: StaffDirectoryPerson) => {
    if (!person.id || seen.has(person.id)) return;
    if (person.id === input.actorUserId) return;
    if (
      isTestDirectoryPerson({
        firstName: person.firstName,
        email: "",
      })
    ) {
      return;
    }
    if (query && !person.firstName.toLowerCase().includes(query)) return;
    seen.add(person.id);
    people.push(person);
  };

  const staffIds = new Set<string>();
  /** Seat from access/roles wins over marketplace profile.role (Ava is also ambassador). */
  const seatById = new Map<string, "admin" | "manager">();

  const markSeat = (id: string, seat: "admin" | "manager") => {
    if (!id) return;
    staffIds.add(id);
    const existing = seatById.get(id);
    if (existing === "admin" || seat === "admin") seatById.set(id, "admin");
    else seatById.set(id, "manager");
  };

  // Hard-include HQ supers + Ava so Staff never depends only on join coverage.
  markSeat(JASON_STAFF_USER_ID, "admin");
  markSeat(DANETTE_STAFF_USER_ID, "admin");
  markSeat(AVA_STAFF_USER_ID, "manager");

  const [{ data: accessRows }, { data: roleRows }, { data: eligibilityRows }, { data: adminProfiles }] =
    await Promise.all([
      supabaseAdmin
        .from("admin_user_access")
        .select("user_id,email,role_key,is_active")
        .eq("is_active", true)
        .limit(100),
      supabaseAdmin
        .from("user_roles")
        .select("user_id,role")
        .in("role", [
          GROWTH_HIRE_ROLE,
          "social_growth_manager",
          "growth_manager",
          "admin",
          "founder",
          "owner",
          "super_admin",
        ])
        .limit(100),
      supabaseAdmin
        .from("internship_staff_eligibility")
        .select("user_id,can_manage_interns,can_supervise_interns")
        .or("can_manage_interns.eq.true,can_supervise_interns.eq.true")
        .limit(100),
      supabaseAdmin
        .from("profiles")
        .select(
          "id,email,first_name,full_name,last_name,avatar_url,profile_photo_url,photo_url,image_url,role,account_type,signup_role",
        )
        .or(
          `role.ilike.%admin%,role.ilike.%founder%,role.ilike.%owner%,role.ilike.%super%,signup_role.ilike.%social_community%,signup_role.ilike.%growth%,account_type.ilike.%social_community%,account_type.ilike.%growth%,email.eq.${AVA_STAFF_EMAIL},email.eq.${JASON_STAFF_EMAIL},email.eq.${DANETTE_STAFF_EMAIL},email.ilike.%@sitguru.com`,
        )
        .limit(80),
    ]);

  for (const row of (accessRows || []) as Record<string, unknown>[]) {
    const id = text(row.user_id);
    if (!id) continue;
    const roleKey = text(row.role_key);
    const email = text(row.email);
    if (
      isLiveAgentSeat({ email, role: roleKey }) ||
      isHardcodedSuperUserEmail(email)
    ) {
      markSeat(id, "admin");
    } else if (
      isGrowthManagerSeat({ email, role: roleKey, accountType: roleKey, signupRole: roleKey }) ||
      roleKey === GROWTH_HIRE_ROLE
    ) {
      markSeat(id, "manager");
    }
  }
  for (const row of (roleRows || []) as Record<string, unknown>[]) {
    const id = text(row.user_id);
    const role = text(row.role);
    if (!id) continue;
    if (isLiveAgentSeat({ role }) || role === "super_admin" || role === "founder" || role === "owner") {
      markSeat(id, "admin");
    } else if (isGrowthManagerSeat({ role, signupRole: role })) {
      markSeat(id, "manager");
    } else {
      staffIds.add(id);
    }
  }
  for (const row of (eligibilityRows || []) as Record<string, unknown>[]) {
    const id = text(row.user_id);
    if (id) markSeat(id, "manager");
  }
  for (const row of (adminProfiles || []) as Record<string, unknown>[]) {
    const id = text(row.id);
    const email = text(row.email);
    if (!id) continue;
    if (
      isHardcodedSuperUserEmail(email) ||
      isLiveAgentSeat({
        email,
        role: text(row.role) || text(row.signup_role),
        accountType: text(row.account_type) || text(row.signup_role),
      })
    ) {
      markSeat(id, "admin");
    } else if (
      isGrowthManagerSeat({
        email,
        role: text(row.role),
        accountType: text(row.account_type),
        signupRole: text(row.signup_role),
      })
    ) {
      markSeat(id, "manager");
    }
  }

  const profileById = await loadProfileMap([...staffIds]);
  const ambassadorById = await loadAmbassadorPhotos([...staffIds]);

  for (const id of staffIds) {
    const row = profileById.get(id);
    if (!row) continue;
    const email = text(row.email);
    const role = text(row.role);
    const signupRole = text(row.signup_role);
    const accountType = text(row.account_type);
    if (
      isTestDirectoryPerson({
        firstName: text(row.first_name),
        fullName: text(row.full_name),
        email,
      })
    ) {
      continue;
    }
    const forced = seatById.get(id);
    const adminSeat =
      forced === "admin" ||
      isLiveAgentSeat({ email, role: role || signupRole, accountType }) ||
      isHardcodedSuperUserEmail(email);
    const managerSeat =
      forced === "manager" ||
      isGrowthManagerSeat({ email, role, accountType, signupRole }) ||
      email.toLowerCase() === AVA_STAFF_EMAIL ||
      id === AVA_STAFF_USER_ID;
    if (!adminSeat && !managerSeat) continue;
    const known = KNOWN_STAFF_CHAT_SEATS.find((seat) => seat.id === id);
    push({
      id,
      firstName: firstName(
        known?.firstName ||
          text(row.first_name) ||
          text(row.full_name) ||
          email,
      ),
      avatarUrl: profileAvatar(row, ambassadorById.get(id)),
      detail: adminSeat ? "Admin" : "Manager",
      canChat: true,
    });
  }

  // Guarantee Jason, Danette, Ava even when profile/access joins miss a row.
  for (const seat of KNOWN_STAFF_CHAT_SEATS) {
    if (seen.has(seat.id) || seat.id === input.actorUserId) continue;
    const row = profileById.get(seat.id);
    push({
      id: seat.id,
      firstName: firstName(
        seat.firstName || text(row?.first_name) || text(row?.full_name),
      ),
      avatarUrl:
        profileAvatar(row || { email: seat.email, id: seat.id }, ambassadorById.get(seat.id)) ||
        seat.avatarUrl,
      detail: seat.detail,
      canChat: true,
    });
  }

  if (includeInterns) {
    const interns = await listInterns();
    for (const row of interns) {
      if (excludeFromInternPortalList({ email: row.email, isTest: Boolean(row.isTest) })) continue;
      if (
        hideFromInternDirectory({
          email: row.email,
          userId: row.userId || undefined,
          actorUserId: input.actorUserId,
        })
      ) {
        continue;
      }
      if (
        isTestDirectoryPerson({
          firstName: row.preferredName || row.fullName,
          fullName: row.fullName,
          email: row.email,
        })
      ) {
        continue;
      }
      const status = text(row.status).toLowerCase();
      if (!["accepted", "active", "approved"].includes(status)) continue;

      const chatId = text(row.userId);
      push({
        id: chatId || `pending:${row.id}`,
        firstName: firstName(row.preferredName || row.fullName),
        avatarUrl: row.avatarUrl || "",
        detail: chatId ? "Intern" : "Intern · Invite pending",
        canChat: Boolean(chatId),
      });
    }
  }

  const onlineIds = people.filter((person) => person.canChat).map((person) => person.id);
  const onlineById = await mapUsersOnline(onlineIds);
  return sortStaffDirectoryPeople(
    people.map((person) => ({
      ...person,
      online: person.canChat ? onlineById.get(person.id) === true : false,
    })),
  ).slice(0, 40);
}
