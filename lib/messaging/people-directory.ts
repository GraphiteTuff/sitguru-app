import { getGuruProfilePhotoUrl } from "@/lib/gurus/profile-photo";
import { listInterns } from "@/lib/internship/queries";
import { canReadPrivateInternRecord, type InternshipActorKind } from "@/lib/internship/manager-access";
import {
  hideFromInternDirectory,
  isLiveAgentSeat,
  sortStaffDirectoryPeople,
} from "@/lib/messaging/chat-library";
import { mapUsersOnline } from "@/lib/messaging/presence";
import { chatDisplayName } from "@/lib/messaging/chat-display-name";
import {
  KNOWN_STAFF_CHAT_SEATS,
  staffAvatarFallback,
} from "@/lib/messaging/staff-avatars";
import {
  isTestDirectoryPerson,
  loadSharedStaffDirectory,
  type StaffDirectoryPerson,
} from "@/lib/messaging/staff-directory";
import { excludeFromInternPortalList } from "@/lib/internship/team-roster";
import { resolvePetParentAvatarUrl } from "@/lib/pet-parent-avatar";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ChatAudience =
  | "staff"
  | "admin"
  | "intern"
  | "guru"
  | "ambassador"
  | "parent";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function matchesQuery(name: string, query: string) {
  if (!query) return true;
  return name.toLowerCase().includes(query);
}

async function withPresence(people: StaffDirectoryPerson[]) {
  const onlineIds = people.filter((person) => person.canChat).map((person) => person.id);
  const onlineById = await mapUsersOnline(onlineIds);
  return sortStaffDirectoryPeople(
    people.map((person) => ({
      ...person,
      online: person.canChat ? onlineById.get(person.id) === true : false,
    })),
  );
}

async function loadProfilePhotoMap(userIds: string[]) {
  const unique = [...new Set(userIds.map((id) => text(id)).filter(Boolean))];
  if (!unique.length) return new Map<string, string>();
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id,email,avatar_url,profile_photo_url,photo_url,image_url")
    .in("id", unique);
  const map = new Map<string, string>();
  for (const row of (data || []) as Record<string, unknown>[]) {
    const id = text(row.id);
    const url =
      resolvePetParentAvatarUrl(row) ||
      staffAvatarFallback({ email: text(row.email), userId: id });
    if (id && url) map.set(id, url);
  }
  return map;
}

/** Admins tab — only Jason Graff and Danette Graff. */
export async function loadAdminChatPeople(input: {
  actorUserId: string;
  query?: string;
}) {
  const query = text(input.query).toLowerCase();
  const adminSeats = KNOWN_STAFF_CHAT_SEATS.filter((item) => item.detail === "Admin");
  const photoById = await loadProfilePhotoMap(adminSeats.map((seat) => seat.id));
  const people = adminSeats
    .filter((seat) => seat.id !== input.actorUserId && matchesQuery(seat.firstName, query))
    .map((seat) => ({
      id: seat.id,
      firstName: seat.firstName,
      avatarUrl: photoById.get(seat.id) || seat.avatarUrl,
      detail: "Admin" as const,
      canChat: true,
    }));

  return withPresence(people);
}

export async function loadInternChatPeople(input: {
  actorUserId: string;
  actorKind: InternshipActorKind;
  query?: string;
}) {
  const query = text(input.query).toLowerCase();
  const interns = (await listInterns()).filter((row) =>
    canReadPrivateInternRecord({
      actor: input.actorKind,
      actorUserId: input.actorUserId,
      targetInternId: row.id,
      managerUserId: row.managerUserId,
    }),
  );
  const ids = interns.map((row) => row.userId).filter(Boolean) as string[];
  const photoById = await loadProfilePhotoMap(ids);

  const people = interns
    .map((row) => {
      const chatId = text(row.userId);
      return {
        id: chatId || `pending:${row.id}`,
        firstName: chatDisplayName({
          fullName: row.fullName,
          preferredName: row.preferredName,
          email: row.email,
        }),
        avatarUrl:
          row.avatarUrl ||
          (chatId ? photoById.get(chatId) || "" : "") ||
          staffAvatarFallback({ email: row.email, userId: chatId || null }),
        detail: chatId ? "Intern" : "Intern · Invite pending",
        canChat: Boolean(chatId),
        email: row.email,
        isTest: Boolean(row.isTest),
      };
    })
    .filter(
      (row) =>
        row.id !== input.actorUserId &&
        !excludeFromInternPortalList({ email: row.email, isTest: row.isTest }) &&
        !hideFromInternDirectory({
          email: row.email,
          userId: row.canChat ? row.id : undefined,
          actorUserId: input.actorUserId,
        }) &&
        !isTestDirectoryPerson({ firstName: row.firstName, email: row.email }) &&
        matchesQuery(row.firstName, query),
    )
    .slice(0, 40)
    .map(({ email: _email, isTest: _test, ...person }) => person);

  return withPresence(people);
}

export async function loadGuruChatPeople(input: {
  actorUserId: string;
  query?: string;
}) {
  const query = text(input.query).toLowerCase();
  const { data, error } = await supabaseAdmin
    .from("gurus")
    .select(
      "id,user_id,email,full_name,name,avatar_url,profile_photo_url,photo_url,image_url,is_active,status,is_test_account",
    )
    .not("user_id", "is", null)
    .limit(120);
  if (error) {
    console.warn("[messaging/people] gurus", error.message);
    return [] as StaffDirectoryPerson[];
  }

  const rows = ((data || []) as Record<string, unknown>[]).filter((row) => {
    if (row.is_test_account === true) return false;
    const status = text(row.status).toLowerCase();
    if (status && ["archived", "rejected", "deleted"].includes(status)) return false;
    if (row.is_active === false) return false;
    return Boolean(text(row.user_id));
  });

  const userIds = rows.map((row) => text(row.user_id));
  const photoById = await loadProfilePhotoMap(userIds);

  const people = rows
    .map((row) => {
      const id = text(row.user_id);
      return {
        id,
        firstName: chatDisplayName({
          fullName: text(row.full_name) || text(row.name),
          email: text(row.email),
        }),
        avatarUrl: getGuruProfilePhotoUrl(row) || photoById.get(id) || "",
        detail: "Guru",
        canChat: Boolean(id),
        email: text(row.email),
      };
    })
    .filter(
      (row) =>
        row.id &&
        row.id !== input.actorUserId &&
        row.canChat &&
        !isTestDirectoryPerson({ firstName: row.firstName, email: row.email }) &&
        matchesQuery(row.firstName, query),
    )
    .slice(0, 40)
    .map(({ email: _email, ...person }) => person);

  return withPresence(people);
}

export async function loadAmbassadorChatPeople(input: {
  actorUserId: string;
  query?: string;
}) {
  const query = text(input.query).toLowerCase();
  const { data, error } = await supabaseAdmin
    .from("ambassadors")
    .select("id,user_id,email,full_name,ambassador_photo_url,ambassador_photo_path,status")
    .not("user_id", "is", null)
    .limit(120);
  if (error) {
    console.warn("[messaging/people] ambassadors", error.message);
    return [] as StaffDirectoryPerson[];
  }

  const rows = ((data || []) as Record<string, unknown>[]).filter((row) => {
    const status = text(row.status).toLowerCase();
    if (status && ["archived", "rejected", "deleted", "inactive"].includes(status)) return false;
    return Boolean(text(row.user_id));
  });
  const userIds = rows.map((row) => text(row.user_id));
  const photoById = await loadProfilePhotoMap(userIds);

  const people = rows
    .map((row) => {
      const id = text(row.user_id);
      return {
        id,
        firstName: chatDisplayName({
          fullName: text(row.full_name),
          email: text(row.email),
        }),
        avatarUrl:
          resolvePetParentAvatarUrl({
            profile_photo_url: text(row.ambassador_photo_url) || null,
            photo_url: text(row.ambassador_photo_path) || null,
          }) ||
          photoById.get(id) ||
          "",
        detail: "Ambassador",
        canChat: Boolean(id),
        email: text(row.email),
      };
    })
    .filter(
      (row) =>
        row.id &&
        row.id !== input.actorUserId &&
        row.canChat &&
        !isTestDirectoryPerson({ firstName: row.firstName, email: row.email }) &&
        matchesQuery(row.firstName, query),
    )
    .slice(0, 40)
    .map(({ email: _email, ...person }) => person);

  return withPresence(people);
}

export async function loadPetParentChatPeople(input: {
  actorUserId: string;
  query?: string;
}) {
  const query = text(input.query).toLowerCase();
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(
      "id,email,first_name,last_name,full_name,avatar_url,profile_photo_url,photo_url,image_url,role,account_type,signup_role",
    )
    .limit(200);
  if (error) {
    console.warn("[messaging/people] parents", error.message);
    return [] as StaffDirectoryPerson[];
  }

  const people = ((data || []) as Record<string, unknown>[])
    .filter((row) => {
      if (
        isLiveAgentSeat({
          email: text(row.email),
          role: text(row.role) || text(row.signup_role),
          accountType: text(row.account_type),
        })
      ) {
        return false;
      }
      const role = `${text(row.role)} ${text(row.account_type)} ${text(row.signup_role)}`.toLowerCase();
      const looksParent =
        role.includes("parent") ||
        role.includes("customer") ||
        role.includes("pet_parent") ||
        (!role.includes("guru") &&
          !role.includes("ambassador") &&
          !role.includes("admin") &&
          !role.includes("intern") &&
          !role.includes("manager"));
      if (!looksParent) return false;
      return !isTestDirectoryPerson({
        firstName: text(row.first_name),
        fullName: text(row.full_name),
        email: text(row.email),
      });
    })
    .map((row) => ({
      id: text(row.id),
      firstName: chatDisplayName({
        firstName: text(row.first_name),
        lastName: text(row.last_name),
        fullName: text(row.full_name),
        email: text(row.email),
      }),
      avatarUrl: resolvePetParentAvatarUrl(row),
      detail: "Pet Parent",
      canChat: true,
    }))
    .filter(
      (row) =>
        row.id &&
        row.id !== input.actorUserId &&
        matchesQuery(row.firstName, query),
    )
    .slice(0, 40);

  return withPresence(people);
}

export async function loadChatPeople(input: {
  audience: ChatAudience;
  actorUserId: string;
  actorKind: InternshipActorKind;
  query?: string;
}) {
  if (input.audience === "staff") {
    return loadSharedStaffDirectory({
      actorUserId: input.actorUserId,
      query: input.query,
      includeInterns: false,
    });
  }
  if (input.audience === "admin") {
    return loadAdminChatPeople(input);
  }
  if (input.audience === "intern") {
    return loadInternChatPeople(input);
  }
  if (input.audience === "guru") {
    return loadGuruChatPeople(input);
  }
  if (input.audience === "ambassador") {
    return loadAmbassadorChatPeople(input);
  }
  return loadPetParentChatPeople(input);
}
