import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAdminIdentity } from "@/lib/admin/access";
import { isHardcodedSuperUserEmail } from "@/lib/admin/super-users";
import {
  READS_ADMIN_OVERRIDE_ROLES,
  READS_INTERN_ROLES,
  READS_MANAGER_ROLES,
} from "./constants";
import type { ReadsStaffRole } from "./types";

export type ReadsIdentity = {
  id: string;
  email: string;
  role: string;
  staffRole: ReadsStaffRole;
  canCreate: boolean;
  canSubmit: boolean;
  canReview: boolean;
  canPublish: boolean;
  canOverride: boolean;
  canManagePartnerships: boolean;
  canEscalate: boolean;
  canViewAllAnalytics: boolean;
  canViewOwnAnalytics: boolean;
  canManageTaxonomy: boolean;
  canImportYoutube: boolean;
};

function normalizeRole(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function resolveStaffRole(role: string): ReadsStaffRole {
  if (READS_ADMIN_OVERRIDE_ROLES.has(role) || role === "admin") return "admin";
  if (READS_MANAGER_ROLES.has(role)) return "manager";
  if (READS_INTERN_ROLES.has(role)) return "intern";
  return "none";
}

function buildIdentity(
  id: string,
  email: string,
  role: string,
): ReadsIdentity | null {
  const staffRole = resolveStaffRole(role);
  if (staffRole === "none") return null;

  const isAdmin = staffRole === "admin";
  const isManager = staffRole === "manager" || isAdmin;
  const isIntern = staffRole === "intern";

  return {
    id,
    email,
    role,
    staffRole,
    canCreate: true,
    canSubmit: true,
    canReview: isManager,
    canPublish: isManager,
    canOverride: isAdmin,
    canManagePartnerships: isManager,
    canEscalate: isManager,
    canViewAllAnalytics: isManager,
    canViewOwnAnalytics: true,
    canManageTaxonomy: isAdmin || isManager,
    canImportYoutube: isManager || isIntern,
  };
}

/**
 * Resolve Reads staff identity for Manager / Intern / Admin portals.
 * Interns get portal access without requiring full Admin capabilities.
 */
export async function getReadsIdentity(): Promise<ReadsIdentity | null> {
  const admin = await getAdminIdentity();
  if (admin?.canAccessAdmin) {
    const role = normalizeRole(admin.role);
    // Prefer HQ role when present for growth_manager / content_intern nuance.
    const hq = await supabaseAdmin
      .from("admin_user_access")
      .select("role_key,email,is_active")
      .eq("email", admin.email)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const hqRole = normalizeRole(hq.data?.role_key);
    const effective = hqRole && (READS_MANAGER_ROLES.has(hqRole) || READS_INTERN_ROLES.has(hqRole))
      ? hqRole
      : role;

    return buildIdentity(admin.id, admin.email, effective);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const email = String(user.email || "").toLowerCase();
  if (isHardcodedSuperUserEmail(email)) {
    return buildIdentity(user.id, email, "super_admin");
  }

  const [hqAccess, profile] = await Promise.all([
    supabaseAdmin
      .from("admin_user_access")
      .select("role_key,email,is_active")
      .eq("email", email)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("profiles")
      .select("role,email")
      .eq("id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  const role = normalizeRole(
    hqAccess.data?.role_key || profile.data?.role || "",
  );

  return buildIdentity(user.id, email, role);
}

export async function requireReadsStaffApi(
  minimum: ReadsStaffRole = "intern",
): Promise<
  | { identity: ReadsIdentity; response: null }
  | { identity: null; response: NextResponse }
> {
  const identity = await getReadsIdentity();
  if (!identity) {
    return {
      identity: null,
      response: NextResponse.json(
        { error: "Reads staff access required." },
        { status: 403 },
      ),
    };
  }

  const rank: Record<ReadsStaffRole, number> = {
    none: 0,
    intern: 1,
    manager: 2,
    admin: 3,
  };

  if (rank[identity.staffRole] < rank[minimum]) {
    return {
      identity: null,
      response: NextResponse.json(
        { error: "Insufficient Reads permissions." },
        { status: 403 },
      ),
    };
  }

  return { identity, response: null };
}

export function canInternEditContent(
  identity: ReadsIdentity,
  content: { created_by?: string | null; assigned_intern_id?: string | null },
) {
  if (identity.staffRole !== "intern") return true;
  return (
    content.created_by === identity.id ||
    content.assigned_intern_id === identity.id
  );
}

export function assertNoSelfPublish(identity: ReadsIdentity) {
  if (identity.staffRole === "intern") {
    throw new Error("Interns cannot publish or self-approve Reads content.");
  }
}
