import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { GROWTH_HIRE_ROLE } from "@/lib/admin/growth/hire";
import { canReadPrivateInternRecord, internshipActorKind } from "@/lib/internship/manager-access";
import { findInternByAccount, listInterns } from "@/lib/internship/queries";
import { resolvePetParentAvatarUrl } from "@/lib/pet-parent-avatar";
import {
  hideFromInternDirectory,
  isGrowthManagerSeat,
  isLiveAgentSeat,
  sortStaffDirectoryPeople,
} from "@/lib/messaging/chat-library";
import { mapUsersOnline } from "@/lib/messaging/presence";
import { excludeFromInternPortalList } from "@/lib/internship/team-roster";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function firstName(value: string) {
  return value.split(/\s+/).filter(Boolean)[0] || "SitGuru";
}

type DirectoryPerson = {
  id: string;
  firstName: string;
  avatarUrl: string;
  detail: string;
  online?: boolean;
};

async function loadStaffPeople(input: {
  actorUserId: string;
  actorKind: string;
  query: string;
  includeInterns: boolean;
}) {
  const people: DirectoryPerson[] = [];
  const seen = new Set<string>();

  const push = (person: DirectoryPerson) => {
    if (!person.id || person.id === input.actorUserId || seen.has(person.id)) return;
    if (input.query && !person.firstName.toLowerCase().includes(input.query)) return;
    seen.add(person.id);
    people.push(person);
  };

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id,email,first_name,full_name,display_name,avatar_url,profile_photo_url,photo_url,image_url,role,account_type")
    .limit(120);

  for (const row of (profiles || []) as Record<string, unknown>[]) {
    const seat = {
      email: text(row.email),
      role: text(row.role),
      accountType: text(row.account_type),
    };
    if (isLiveAgentSeat(seat)) {
      push({
        id: text(row.id),
        firstName: firstName(text(row.first_name) || text(row.display_name) || text(row.full_name)),
        avatarUrl: resolvePetParentAvatarUrl(row),
        detail: "Admin",
      });
      continue;
    }
    if (isGrowthManagerSeat(seat)) {
      push({
        id: text(row.id),
        firstName: firstName(text(row.first_name) || text(row.display_name) || text(row.full_name)),
        avatarUrl: resolvePetParentAvatarUrl(row),
        detail: "Manager",
      });
    }
  }

  const { data: accessRows } = await supabaseAdmin
    .from("admin_user_access")
    .select("user_id,email")
    .eq("role_key", GROWTH_HIRE_ROLE)
    .eq("is_active", true)
    .limit(40);

  const accessIds = ((accessRows || []) as Array<{ user_id?: string }>)
    .map((row) => text(row.user_id))
    .filter((id) => id && !seen.has(id));

  if (accessIds.length) {
    const { data: managerProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id,email,first_name,full_name,display_name,avatar_url,profile_photo_url,photo_url,image_url,role,account_type")
      .in("id", accessIds);
    for (const row of (managerProfiles || []) as Record<string, unknown>[]) {
      push({
        id: text(row.id),
        firstName: firstName(text(row.first_name) || text(row.display_name) || text(row.full_name)),
        avatarUrl: resolvePetParentAvatarUrl(row),
        detail: "Manager",
      });
    }
  }

  if (input.includeInterns) {
    const interns = (await listInterns()).filter((row) =>
      canReadPrivateInternRecord({
        actor: input.actorKind as "manager" | "supervisor" | "intern",
        actorUserId: input.actorUserId,
        targetInternId: row.id,
        managerUserId: row.managerUserId,
      }),
    );
    const ids = interns.map((row) => row.userId).filter(Boolean) as string[];
    const { data: internProfiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id,email,role,account_type").in("id", ids)
      : { data: [] as Record<string, unknown>[] };
    const profileById = new Map(
      ((internProfiles || []) as Record<string, unknown>[]).map((row) => [text(row.id), row]),
    );
    for (const row of interns) {
      const profile = row.userId ? profileById.get(row.userId) : undefined;
      const email = row.email || text(profile?.email);
      const role = text(profile?.role);
      const accountType = text(profile?.account_type);
      if (
        !row.userId ||
        excludeFromInternPortalList({ email, isTest: Boolean(row.isTest) }) ||
        hideFromInternDirectory({
          email,
          role,
          accountType,
          userId: row.userId,
          actorUserId: input.actorUserId,
        })
      ) {
        continue;
      }
      push({
        id: row.userId,
        firstName: firstName(row.preferredName || row.fullName),
        avatarUrl: row.avatarUrl || "",
        detail: "Intern",
      });
    }
  }

  const onlineById = await mapUsersOnline(people.map((person) => person.id));
  return sortStaffDirectoryPeople(
    people.map((person) => ({
      ...person,
      online: onlineById.get(person.id) === true,
    })),
  ).slice(0, 40);
}

export async function GET(request: Request) {
  const admin = await getAdminIdentity();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !admin) return NextResponse.json({ people: [] }, { status: 401 });
  const userId = admin?.id || user?.id || "";
  const intern = userId ? await findInternByAccount({ userId, email: user?.email }) : null;
  const kind = internshipActorKind({ role: admin?.role, isSuperUser: admin?.isSuperUser, isIntern: Boolean(intern) });
  const url = new URL(request.url);
  const audience = url.searchParams.get("audience") || "intern";
  const query = (url.searchParams.get("q") || "").trim().toLowerCase();
  if (kind === "intern" && audience !== "admin" && audience !== "staff") {
    return NextResponse.json({ people: [] }, { status: 403 });
  }
  if (kind !== "manager" && kind !== "supervisor" && kind !== "intern") {
    return NextResponse.json({ people: [] }, { status: 403 });
  }

  if (audience === "staff") {
    const people = await loadStaffPeople({
      actorUserId: userId,
      actorKind: kind,
      query,
      includeInterns: kind === "manager" || kind === "supervisor",
    });
    return NextResponse.json({ people });
  }

  if (audience === "admin") {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id,email,first_name,full_name,display_name,avatar_url,profile_photo_url,photo_url,image_url,role,account_type")
      .limit(80);
    if (error) return NextResponse.json({ people: [] });
    const base = ((data || []) as Record<string, unknown>[])
      .filter((row) =>
        isLiveAgentSeat({
          email: text(row.email),
          role: text(row.role),
          accountType: text(row.account_type),
        }),
      )
      .map((row) => ({
        id: text(row.id),
        firstName: firstName(text(row.first_name) || text(row.display_name) || text(row.full_name)),
        avatarUrl: resolvePetParentAvatarUrl(row),
        detail: "Admin",
      }))
      .filter((row) => row.id && row.id !== userId && (!query || row.firstName.toLowerCase().includes(query)))
      .slice(0, 20);
    const onlineById = await mapUsersOnline(base.map((row) => row.id));
    const people = base.map((row) => ({ ...row, online: onlineById.get(row.id) === true }));
    return NextResponse.json({ people });
  }

  if (audience === "intern") {
    const interns = (await listInterns()).filter((row) => canReadPrivateInternRecord({
      actor: kind,
      actorUserId: userId,
      targetInternId: row.id,
      managerUserId: row.managerUserId,
    }));
    const ids = interns.map((row) => row.userId).filter(Boolean) as string[];
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id,email,role,account_type").in("id", ids)
      : { data: [] as Record<string, unknown>[] };
    const profileById = new Map(
      ((profiles || []) as Record<string, unknown>[]).map((row) => [text(row.id), row]),
    );
    const base = interns.map((row) => {
      const profile = row.userId ? profileById.get(row.userId) : undefined;
      return {
        id: row.userId || "",
        firstName: firstName(row.preferredName || row.fullName),
        avatarUrl: row.avatarUrl || "",
        email: row.email || text(profile?.email),
        role: text(profile?.role),
        accountType: text(profile?.account_type),
        isTest: Boolean(row.isTest),
        detail: "Intern",
      };
    }).filter((row) =>
      row.id &&
      row.id !== userId &&
      !excludeFromInternPortalList({ email: row.email, isTest: row.isTest }) &&
      !hideFromInternDirectory({
        email: row.email,
        role: row.role,
        accountType: row.accountType,
        userId: row.id,
        actorUserId: userId,
      }) &&
      (!query || row.firstName.toLowerCase().includes(query)),
    ).slice(0, 20).map(({ email: _email, role: _role, accountType: _account, isTest: _test, ...person }) => person);
    const onlineById = await mapUsersOnline(base.map((row) => row.id));
    const people = base.map((row) => ({ ...row, online: onlineById.get(row.id) === true }));
    return NextResponse.json({ people });
  }

  const table = audience === "guru" ? "gurus" : audience === "ambassador" ? "ambassadors" : "profiles";
  const { data, error } = await supabaseAdmin
    .from(table)
    .select("id,user_id,first_name,full_name,display_name,name,avatar_url,profile_photo_url,photo_url,image_url,role,account_type")
    .limit(40);
  if (error) return NextResponse.json({ people: [] });
  const people = ((data || []) as Record<string, unknown>[])
    .filter((row) => {
      if (isLiveAgentSeat({
        email: text(row.email),
        role: text(row.role),
        accountType: text(row.account_type),
      })) return false;
      if (audience !== "parent") return true;
      const role = `${text(row.role)} ${text(row.account_type)}`.toLowerCase();
      return role.includes("parent") || role.includes("customer") || role.includes("pet");
    })
    .map((row) => ({
      id: text(row.user_id || row.id),
      firstName: firstName(text(row.first_name) || text(row.display_name) || text(row.full_name) || text(row.name)),
      avatarUrl: resolvePetParentAvatarUrl(row),
      detail: audience === "guru" ? "Guru" : audience === "ambassador" ? "Ambassador" : "Pet Parent",
    }))
    .filter((row) => row.id && row.id !== userId && (!query || row.firstName.toLowerCase().includes(query)))
    .slice(0, 20);
  return NextResponse.json({ people });
}
