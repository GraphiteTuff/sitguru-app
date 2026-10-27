import { supabaseAdmin } from "@/lib/supabase/admin";
import type { InternshipIntern } from "@/lib/internship/types";
import { uniqueUserIds } from "@/lib/realtime/pure";

export { uniqueUserIds };

/** Core stakeholders for one intern record (single source of truth views). */
export function recipientsForIntern(intern: Pick<
  InternshipIntern,
  "userId" | "managerUserId" | "supervisorUserId"
>): string[] {
  return uniqueUserIds([
    intern.userId,
    intern.managerUserId,
    intern.supervisorUserId,
  ]);
}

/**
 * Active HQ users who oversee Growth / Internship (Admin View-As + dashboards).
 * Scoped roles only — never broadcast to every authenticated user.
 */
export async function listGrowthOversightRecipientIds(): Promise<string[]> {
  const roles = [
    "founder",
    "owner",
    "super_admin",
    "super_user",
    "operations",
    "operations_admin",
    "hr_admin",
    "marketing_admin",
    "social_community_manager",
  ];

  const { data, error } = await supabaseAdmin
    .from("admin_user_access")
    .select("user_id")
    .eq("is_active", true)
    .in("role_key", roles)
    .not("user_id", "is", null);

  if (error) {
    console.warn("[realtime] growth oversight recipients", error.message);
    return [];
  }

  return uniqueUserIds(
    (data || []).map((row) => (row as { user_id?: string | null }).user_id),
  );
}

export async function recipientsForInternWorkspace(
  intern: Pick<InternshipIntern, "userId" | "managerUserId" | "supervisorUserId">,
  options?: { includeOversight?: boolean },
): Promise<string[]> {
  const base = recipientsForIntern(intern);
  if (!options?.includeOversight) return base;
  const oversight = await listGrowthOversightRecipientIds();
  return uniqueUserIds([...base, ...oversight]);
}

export async function recipientsForGrowthWorkspace(
  extra?: Array<string | null | undefined>,
): Promise<string[]> {
  const oversight = await listGrowthOversightRecipientIds();
  return uniqueUserIds([...(extra || []), ...oversight]);
}
