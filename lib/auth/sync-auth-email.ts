/**
 * Idempotent repair: copy auth.users.email into profiles/gurus.email when empty.
 * Never overwrites a non-empty contact_email or an existing login email.
 *
 * Server-side only — uses service role via supabaseAdmin.
 */

import { normalizeEmail } from "@/lib/auth/apple-email";
import { shouldBackfillAuthEmail } from "@/lib/auth/account-email";

type AdminClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        maybeSingle: () => Promise<{
          data: Record<string, unknown> | null;
          error: unknown;
        }>;
      };
    };
    update: (payload: Record<string, unknown>) => {
      eq: (
        column: string,
        value: string,
      ) => Promise<{ error: unknown }>;
    };
  };
};

function readEmail(row: Record<string, unknown> | null | undefined, key: string) {
  const value = row?.[key];
  return typeof value === "string" ? value : null;
}

async function backfillTableEmail(input: {
  admin: AdminClient;
  table: "profiles" | "gurus";
  userId: string;
  authEmail: string;
}): Promise<boolean> {
  const { data, error } = await input.admin
    .from(input.table)
    .select("id, email, user_id")
    .eq("user_id", input.userId)
    .maybeSingle();

  // profiles often key by id === auth user id
  let row = data;
  if ((!row || error) && input.table === "profiles") {
    const byId = await input.admin
      .from(input.table)
      .select("id, email, user_id")
      .eq("id", input.userId)
      .maybeSingle();
    row = byId.data;
  }

  if (!row) return false;

  const existingEmail = readEmail(row, "email");
  if (
    !shouldBackfillAuthEmail({
      existingEmail,
      authEmail: input.authEmail,
    })
  ) {
    return false;
  }

  const idColumn =
    input.table === "profiles" && typeof row.id === "string"
      ? "id"
      : "user_id";
  const idValue =
    idColumn === "id" && typeof row.id === "string"
      ? row.id
      : input.userId;

  const { error: updateError } = await input.admin
    .from(input.table)
    .update({
      email: input.authEmail,
      updated_at: new Date().toISOString(),
    })
    .eq(idColumn, idValue);

  return !updateError;
}

/**
 * If the authenticated user has an email and SitGuru profile/guru email is
 * blank, populate it once. Safe to call on every session init.
 */
export async function syncAuthEmailToSitGuruRecords(input: {
  admin: AdminClient;
  userId: string;
  authEmail: string | null | undefined;
}): Promise<{ profilesUpdated: boolean; gurusUpdated: boolean }> {
  const authEmail = normalizeEmail(input.authEmail);
  if (!authEmail || !input.userId) {
    return { profilesUpdated: false, gurusUpdated: false };
  }

  const profilesUpdated = await backfillTableEmail({
    admin: input.admin,
    table: "profiles",
    userId: input.userId,
    authEmail,
  });

  const gurusUpdated = await backfillTableEmail({
    admin: input.admin,
    table: "gurus",
    userId: input.userId,
    authEmail,
  });

  return { profilesUpdated, gurusUpdated };
}
