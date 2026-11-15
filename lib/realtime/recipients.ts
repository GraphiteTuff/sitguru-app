import { supabaseAdmin } from "@/lib/supabase/admin";
import type { InternshipIntern } from "@/lib/internship/types";
import { uniqueUserIds } from "@/lib/realtime/pure";
import { SUPER_USER_EMAILS } from "@/lib/admin/super-users";

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

/**
 * Contractor timesheet recipients are the authorized HR/Finance/Founder
 * accounts, not every Growth manager. HQ assignments can have a null user_id;
 * resolve those emails against authenticated profile/user records as well.
 */
export async function listContractorHoursApproverIds(): Promise<string[]> {
  const roles = ["founder", "owner", "super_admin", "super_user", "hr_admin", "finance_admin", "billing_admin", "operations_admin"];
  const [hq, admins] = await Promise.all([
    supabaseAdmin.from("admin_user_access")
      .select("user_id,email,role_key")
      .eq("is_active", true).in("role_key", roles),
    supabaseAdmin.from("admin_users")
      .select("user_id,email,role,is_active")
      .eq("is_active", true).in("role", roles),
  ]);
  for (const [label, result] of [["hq", hq], ["admin", admins]] as const) {
    if (result.error) console.warn("[contractor-alerts] approver lookup", label, result.error.message);
  }
  const ids: Array<string | null | undefined> = [
    ...(hq.data || []).map((row) => row.user_id),
    ...(admins.data || []).map((row) => row.user_id),
  ];
  const emails = [...new Set([
    ...SUPER_USER_EMAILS,
    ...(hq.data || []).map((row) => String(row.email || "").trim().toLowerCase()),
    ...(admins.data || []).map((row) => String(row.email || "").trim().toLowerCase()),
  ].filter(Boolean))];
  const foundFounderEmails = new Set<string>();
  if (emails.length) {
    const [profiles, users] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,email").in("email", emails),
      supabaseAdmin.from("users").select("id,email").in("email", emails),
    ]);
    if (profiles.error) console.warn("[contractor-alerts] profile mapping", profiles.error.message);
    if (users.error) console.warn("[contractor-alerts] user mapping", users.error.message);
    for (const row of [...(profiles.data || []), ...(users.data || [])]) {
      ids.push(row.id);
      if (row.email) foundFounderEmails.add(String(row.email).toLowerCase());
    }
  }
  const missingFounders = new Set(SUPER_USER_EMAILS.filter((email) => !foundFounderEmails.has(email)));
  if (missingFounders.size) {
    for (let page = 1; page <= 5; page++) {
      const { data: directory, error: directoryError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (directoryError) {
        console.warn("[contractor-alerts] founder auth directory", directoryError.message);
        break;
      }
      const authUsers = directory?.users || [];
      for (const user of authUsers) {
        const email = String(user.email || "").toLowerCase();
        if (missingFounders.has(email)) {
          ids.push(user.id);
          missingFounders.delete(email as (typeof SUPER_USER_EMAILS)[number]);
        }
      }
      if (!missingFounders.size || authUsers.length < 200) break;
    }
  }
  const recipients = uniqueUserIds(ids);
  if (!recipients.length) {
    console.warn("[contractor-alerts] No founder/HR approver ID resolved; Admin action queue remains the fallback.");
  }
  return recipients;
}
