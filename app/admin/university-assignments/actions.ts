"use server";

import { revalidatePath } from "next/cache";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  normalizeAcademyType,
  type AcademyType,
} from "@/app/admin/university-assignments/types";

const UNIVERSITY_ASSIGNMENTS_PATH = "/admin/university-assignments";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function requireUniversityAdmin() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    throw new Error("Unauthorized");
  }

  return actor;
}

function revalidateAcademyPaths() {
  revalidatePath(UNIVERSITY_ASSIGNMENTS_PATH);
  revalidatePath("/customer/dashboard");
  revalidatePath("/guru/dashboard");
  revalidatePath("/ambassador/dashboard");
}

async function ensureAcademyAssigned(
  userId: string,
  academyType: AcademyType,
  assignedBy: string,
) {
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("academy_assignments")
    .select("id,is_active")
    .eq("user_id", userId)
    .eq("academy_type", academyType)
    .limit(1);

  if (lookupError) {
    throw new Error(lookupError.message || "Unable to look up academy assignment");
  }

  const row = existing?.[0];
  const now = new Date().toISOString();

  if (row?.id) {
    if (row.is_active === false) {
      const { error: updateError } = await supabaseAdmin
        .from("academy_assignments")
        .update({
          is_active: true,
          assigned_by: assignedBy,
          assigned_at: now,
          updated_at: now,
        })
        .eq("id", row.id);

      if (updateError) {
        throw new Error(updateError.message || "Unable to reactivate academy assignment");
      }
    }
    return;
  }

  const { error: insertError } = await supabaseAdmin
    .from("academy_assignments")
    .insert({
      user_id: userId,
      academy_type: academyType,
      assigned_by: assignedBy,
      assigned_at: now,
      is_active: true,
      certificate_issued: false,
      created_at: now,
      updated_at: now,
    });

  if (insertError) {
    throw new Error(insertError.message || "Unable to assign academy");
  }
}

export async function assignAcademy(userId: string, academyType: string) {
  const adminUser = await requireUniversityAdmin();
  const cleanUserId = asString(userId);
  const cleanAcademy = normalizeAcademyType(academyType);

  if (!cleanUserId) {
    return { ok: false as const, message: "Missing user" };
  }

  try {
    await ensureAcademyAssigned(cleanUserId, cleanAcademy, adminUser.id);
    revalidateAcademyPaths();
    return { ok: true as const };
  } catch (error) {
    console.warn("assignAcademy failed:", error);
    return {
      ok: false as const,
      message:
        error instanceof Error ? error.message : "Unable to assign academy",
    };
  }
}

export async function unassignAcademy(userId: string, academyType: string) {
  await requireUniversityAdmin();
  const cleanUserId = asString(userId);
  const cleanAcademy = normalizeAcademyType(academyType);

  if (!cleanUserId) {
    return { ok: false as const, message: "Missing user" };
  }

  const { error } = await supabaseAdmin
    .from("academy_assignments")
    .delete()
    .eq("user_id", cleanUserId)
    .eq("academy_type", cleanAcademy);

  if (error) {
    console.warn("unassignAcademy failed:", error);
    return { ok: false as const, message: error.message || "Unable to unassign" };
  }

  revalidateAcademyPaths();
  return { ok: true as const };
}

export async function bulkAssignAcademy(userIds: string[], academyType: string) {
  const adminUser = await requireUniversityAdmin();
  const cleanAcademy = normalizeAcademyType(academyType);
  const uniqueIds = Array.from(
    new Set(userIds.map(asString).filter(Boolean)),
  );

  if (!uniqueIds.length) {
    return { ok: false as const, message: "No users selected", assigned: 0 };
  }

  let assigned = 0;
  const failures: string[] = [];

  for (const userId of uniqueIds) {
    try {
      await ensureAcademyAssigned(userId, cleanAcademy, adminUser.id);
      assigned += 1;
    } catch (error) {
      failures.push(
        error instanceof Error ? error.message : `Failed for ${userId}`,
      );
    }
  }

  revalidateAcademyPaths();

  if (failures.length && assigned === 0) {
    return {
      ok: false as const,
      message: failures[0] || "Bulk assign failed",
      assigned,
    };
  }

  return {
    ok: true as const,
    assigned,
    message:
      failures.length > 0
        ? `Assigned ${assigned}; ${failures.length} failed`
        : undefined,
  };
}

export async function toggleAcademyAssignment(
  userId: string,
  academyType: string,
  shouldAssign: boolean,
) {
  if (shouldAssign) {
    return assignAcademy(userId, academyType);
  }

  return unassignAcademy(userId, academyType);
}
