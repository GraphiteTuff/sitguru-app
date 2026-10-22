/**
 * Server-side companion identity — never trust client-supplied userId/role.
 */

import { resolveRequestUser } from "@/lib/supabase/request-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  normalizeCompanionId,
  type CompanionId,
  type CompanionWorkspaceRole,
} from "@/lib/companions/types";

export type CompanionActor = {
  userId: string | null;
  email: string | null;
  authSource: "bearer" | "cookie" | "guest";
  displayName: string | null;
  firstName: string | null;
  roles: CompanionWorkspaceRole[];
  primaryRole: CompanionWorkspaceRole;
  isAdmin: boolean;
  isGuru: boolean;
  isAmbassador: boolean;
  isPartner: boolean;
  isPetParent: boolean;
  guruId: string | null;
  ambassadorId: string | null;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstNameFrom(fullName: string | null | undefined) {
  const clean = asString(fullName);
  if (!clean) return null;
  return clean.split(/\s+/)[0] || null;
}

/**
 * Derive verified roles from profiles / role tables — not from request body.
 */
export async function loadCompanionActor(
  userId: string,
  email?: string | null,
  authSource: "bearer" | "cookie" = "cookie",
): Promise<CompanionActor> {
  const [
    { data: profile },
    { data: roleRows },
    { data: guru },
    { data: ambassador },
    { data: partner },
  ] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id,full_name,first_name,email,role,account_type,city,state,zip,service_city,service_state,service_zip")
      .eq("id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId),
    supabaseAdmin
      .from("gurus")
      .select("id,full_name,display_name")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("ambassadors")
      .select("id,full_name,status")
      .eq("user_id", userId)
      .maybeSingle(),
    Promise.resolve(
      supabaseAdmin
        .from("partners")
        .select("id,business_name,status")
        .eq("user_id", userId)
        .maybeSingle(),
    )
      .then((result) =>
        result.error ? { data: null as null } : result,
      )
      .catch(() => ({ data: null as null })),
  ]);

  const roles = new Set<CompanionWorkspaceRole>();
  const profileRole = asString(
    (profile as { role?: string } | null)?.role,
  ).toLowerCase();
  const accountType = asString(
    (profile as { account_type?: string } | null)?.account_type,
  ).toLowerCase();

  for (const row of (roleRows as Array<{ role?: string }> | null) || []) {
    const role = asString(row.role).toLowerCase();
    if (role === "admin" || role === "super_admin") roles.add("admin");
    if (role === "guru" || role === "provider") roles.add("guru");
    if (role === "ambassador") roles.add("ambassador");
    if (role === "partner") roles.add("partner");
    if (role === "pet_parent" || role === "parent" || role === "customer") {
      roles.add("pet_parent");
    }
  }

  if (profileRole === "admin" || profileRole === "super_admin") {
    roles.add("admin");
  }
  if (
    profileRole === "guru" ||
    profileRole === "provider" ||
    accountType.includes("guru") ||
    accountType.includes("provider") ||
    Boolean((guru as { id?: string } | null)?.id)
  ) {
    roles.add("guru");
  }
  if (
    profileRole === "ambassador" ||
    accountType.includes("ambassador") ||
    Boolean((ambassador as { id?: string } | null)?.id)
  ) {
    roles.add("ambassador");
  }
  if (
    profileRole === "partner" ||
    accountType.includes("partner") ||
    Boolean((partner as { id?: string } | null)?.id)
  ) {
    roles.add("partner");
  }
  if (
    profileRole === "pet_parent" ||
    profileRole === "parent" ||
    profileRole === "customer" ||
    accountType.includes("parent") ||
    accountType.includes("customer")
  ) {
    roles.add("pet_parent");
  }

  // Signed-in users without a specialist role still get pet-parent basics.
  if (roles.size === 0) roles.add("pet_parent");

  const roleList = Array.from(roles);
  const isAdmin = roleList.includes("admin");
  const isGuru = roleList.includes("guru");
  const isAmbassador = roleList.includes("ambassador");
  const isPartner = roleList.includes("partner");
  const isPetParent = roleList.includes("pet_parent");

  let primaryRole: CompanionWorkspaceRole = "pet_parent";
  if (isAdmin) primaryRole = "admin";
  else if (isGuru) primaryRole = "guru";
  else if (isAmbassador) primaryRole = "ambassador";
  else if (isPartner) primaryRole = "partner";
  else if (isPetParent) primaryRole = "pet_parent";

  const fullName =
    asString((profile as { full_name?: string } | null)?.full_name) ||
    asString((guru as { display_name?: string } | null)?.display_name) ||
    asString((guru as { full_name?: string } | null)?.full_name) ||
    asString((ambassador as { full_name?: string } | null)?.full_name) ||
    null;
  const first =
    asString((profile as { first_name?: string } | null)?.first_name) ||
    firstNameFrom(fullName);

  return {
    userId,
    email: asString(email) || asString((profile as { email?: string } | null)?.email) || null,
    authSource,
    displayName: fullName || first,
    firstName: first,
    roles: roleList,
    primaryRole,
    isAdmin,
    isGuru,
    isAmbassador,
    isPartner,
    isPetParent,
    guruId: asString((guru as { id?: string } | null)?.id) || null,
    ambassadorId: asString((ambassador as { id?: string } | null)?.id) || null,
  };
}

export function guestCompanionActor(): CompanionActor {
  return {
    userId: null,
    email: null,
    authSource: "guest",
    displayName: null,
    firstName: null,
    roles: ["guest"],
    primaryRole: "guest",
    isAdmin: false,
    isGuru: false,
    isAmbassador: false,
    isPartner: false,
    isPetParent: false,
    guruId: null,
    ambassadorId: null,
  };
}

/** Resolve actor from Request (Bearer or cookie). Guests are allowed. */
export async function resolveCompanionActor(
  req: Request,
): Promise<CompanionActor> {
  const resolved = await resolveRequestUser(req).catch(() => null);
  if (!resolved?.user?.id) return guestCompanionActor();
  return loadCompanionActor(
    resolved.user.id,
    resolved.user.email,
    resolved.authSource,
  );
}

/** Audience label for Rogue tone — server-derived only. */
export function companionAudienceLabel(actor: CompanionActor): string {
  if (actor.isAdmin) return "Admin";
  if (actor.isAmbassador) return "Ambassador";
  if (actor.isGuru) return "Guru";
  if (actor.isPartner) return "Partner";
  if (actor.isPetParent) return "Pet Parent";
  return "Guest Pet Parent";
}

/**
 * Dashboard-surface officers require matching roles.
 * Public surfaces remain open for signed-in users of any role.
 */
export function assertCompanionDashboardAccess(
  companionId: CompanionId,
  actor: CompanionActor,
): { ok: true } | { ok: false; status: number; error: string } {
  if (companionId === "taco" && !actor.isAmbassador && !actor.isAdmin) {
    return {
      ok: false,
      status: 403,
      error: "Ambassador access required for Taco dashboard.",
    };
  }
  if (companionId === "scout" && !actor.isGuru && !actor.isAdmin) {
    return {
      ok: false,
      status: 403,
      error: "Guru provider access required for Scout dashboard.",
    };
  }
  return { ok: true };
}

export function parseCompanionFromBody(body: {
  companion?: unknown;
  officer?: unknown;
  officerId?: unknown;
}): CompanionId {
  const raw = body.companion || body.officer || body.officerId || "rogue";
  return normalizeCompanionId(raw, "rogue");
}
