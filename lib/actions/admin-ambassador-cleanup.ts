/**
 * Admin hard-delete routine for automated ambassador test profiles.
 *
 * Targets records where email contains `sitguru.local` or an identifier
 * string contains `journey.amb.` (journey automation seeds).
 *
 * SERVER ONLY — do not import from client components.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

const TEST_EMAIL_NEEDLE = "sitguru.local";
const TEST_ID_NEEDLE = "journey.amb.";

export type AmbassadorCleanupDeleted = {
  userId: string | null;
  email: string | null;
  ambassadorIds: string[];
  profileIds: string[];
  tablesTouched: string[];
};

export type AmbassadorCleanupResult = {
  ok: boolean;
  matched: number;
  deleted: AmbassadorCleanupDeleted[];
  errors: string[];
  message: string;
};

type AnyRow = Record<string, unknown>;

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isTestEmail(email: string) {
  return email.toLowerCase().includes(TEST_EMAIL_NEEDLE);
}

function isTestIdentifier(...parts: unknown[]) {
  return parts.some((part) =>
    asString(part).toLowerCase().includes(TEST_ID_NEEDLE),
  );
}

function isMissingRelation(message: string) {
  return /does not exist|Could not find|schema cache/i.test(message);
}

async function safeDelete(
  table: string,
  column: string,
  values: string[],
  errors: string[],
  tablesTouched: string[],
) {
  if (!values.length) return;

  const unique = [...new Set(values.filter(Boolean))];
  if (!unique.length) return;

  const { error } = await supabaseAdmin.from(table).delete().in(column, unique);

  if (error) {
    if (!isMissingRelation(error.message || "")) {
      errors.push(`${table}.${column}: ${error.message}`);
    }
    return;
  }

  tablesTouched.push(table);
}

async function collectAmbassadorCandidates(): Promise<{
  rows: AnyRow[];
  errors: string[];
}> {
  const errors: string[] = [];
  const byKey = new Map<string, AnyRow>();

  const queries = [
    supabaseAdmin
      .from("ambassadors")
      .select("id,user_id,profile_id,email,full_name,referral_code,status")
      .ilike("email", `%${TEST_EMAIL_NEEDLE}%`)
      .limit(2000),
    supabaseAdmin
      .from("ambassadors")
      .select("id,user_id,profile_id,email,full_name,referral_code,status")
      .ilike("email", `%${TEST_ID_NEEDLE}%`)
      .limit(2000),
    supabaseAdmin
      .from("ambassadors")
      .select("id,user_id,profile_id,email,full_name,referral_code,status")
      .ilike("full_name", `%${TEST_ID_NEEDLE}%`)
      .limit(2000),
    supabaseAdmin
      .from("ambassadors")
      .select("id,user_id,profile_id,email,full_name,referral_code,status")
      .ilike("referral_code", `%${TEST_ID_NEEDLE}%`)
      .limit(2000),
    supabaseAdmin
      .from("ambassador_profiles")
      .select(
        "id,user_id,ambassador_record_id,display_name,referral_code_slug,email",
      )
      .ilike("referral_code_slug", `%${TEST_ID_NEEDLE}%`)
      .limit(2000),
    supabaseAdmin
      .from("ambassador_profiles")
      .select(
        "id,user_id,ambassador_record_id,display_name,referral_code_slug,email",
      )
      .ilike("display_name", `%${TEST_ID_NEEDLE}%`)
      .limit(2000),
    supabaseAdmin
      .from("profiles")
      .select("id,email,full_name,display_name,role")
      .ilike("email", `%${TEST_EMAIL_NEEDLE}%`)
      .limit(2000),
    supabaseAdmin
      .from("profiles")
      .select("id,email,full_name,display_name,role")
      .or(
        `email.ilike.%${TEST_ID_NEEDLE}%,full_name.ilike.%${TEST_ID_NEEDLE}%,display_name.ilike.%${TEST_ID_NEEDLE}%`,
      )
      .limit(2000),
  ];

  const results = await Promise.all(queries);

  for (const result of results) {
    if (result.error) {
      if (!isMissingRelation(result.error.message || "")) {
        errors.push(result.error.message);
      }
      continue;
    }

    for (const row of (result.data || []) as AnyRow[]) {
      const email = asString(row.email);
      const id = asString(row.id);
      const userId = asString(row.user_id) || asString(row.id);
      const referral =
        asString(row.referral_code) || asString(row.referral_code_slug);
      const name =
        asString(row.full_name) ||
        asString(row.display_name) ||
        asString(row.name);

      if (
        !isTestEmail(email) &&
        !isTestIdentifier(email, referral, name, id, userId)
      ) {
        continue;
      }

      const key = userId || id || email;
      if (!key) continue;
      byKey.set(key, { ...byKey.get(key), ...row, user_id: userId || null });
    }
  }

  // Auth users with sitguru.local / journey.amb. emails (paginated best-effort)
  try {
    for (let page = 1; page <= 10; page += 1) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) {
        errors.push(`auth.listUsers: ${error.message}`);
        break;
      }
      const users = data?.users || [];
      if (!users.length) break;

      for (const user of users) {
        const email = asString(user.email);
        if (!isTestEmail(email) && !isTestIdentifier(email)) continue;
        const key = user.id;
        byKey.set(key, {
          ...byKey.get(key),
          id: user.id,
          user_id: user.id,
          email,
          source: "auth.users",
        });
      }

      if (users.length < 200) break;
    }
  } catch (error) {
    errors.push(
      error instanceof Error
        ? `auth.listUsers: ${error.message}`
        : "auth.listUsers failed",
    );
  }

  return { rows: [...byKey.values()], errors };
}

/**
 * Hard-delete automated ambassador / user test profiles and FK children.
 */
export async function purgeTestAmbassadorProfiles(): Promise<AmbassadorCleanupResult> {
  const deleted: AmbassadorCleanupDeleted[] = [];
  const errors: string[] = [];

  const { rows: candidates, errors: collectErrors } =
    await collectAmbassadorCandidates();
  errors.push(...collectErrors);

  if (!candidates.length) {
    return {
      ok: errors.length === 0,
      matched: 0,
      deleted: [],
      errors,
      message: "No sitguru.local / journey.amb. ambassador test profiles found.",
    };
  }

  for (const candidate of candidates) {
    const tablesTouched: string[] = [];
    const userId =
      asString(candidate.user_id) ||
      (asString(candidate.source) === "auth.users"
        ? asString(candidate.id)
        : "");
    const email = asString(candidate.email) || null;
    const ambassadorIds: string[] = [];
    const profileIds: string[] = [];

    try {
      // Resolve ambassador + ledger profile ids for this identity
      if (userId) {
        const { data: ambRows } = await supabaseAdmin
          .from("ambassadors")
          .select("id,profile_id,user_id,email")
          .eq("user_id", userId)
          .limit(50);
        for (const row of (ambRows || []) as AnyRow[]) {
          const id = asString(row.id);
          if (id) ambassadorIds.push(id);
          const profileId = asString(row.profile_id);
          if (profileId) profileIds.push(profileId);
        }

        const { data: ledgerRows } = await supabaseAdmin
          .from("ambassador_profiles")
          .select("id,user_id,ambassador_record_id")
          .eq("user_id", userId)
          .limit(50);
        for (const row of (ledgerRows || []) as AnyRow[]) {
          const id = asString(row.id);
          if (id) profileIds.push(id);
          const ambId = asString(row.ambassador_record_id);
          if (ambId) ambassadorIds.push(ambId);
        }
      }

      // Also match by email when user_id is missing
      if (email) {
        const { data: ambByEmail } = await supabaseAdmin
          .from("ambassadors")
          .select("id,profile_id,user_id,email")
          .ilike("email", email)
          .limit(50);
        for (const row of (ambByEmail || []) as AnyRow[]) {
          const id = asString(row.id);
          if (id) ambassadorIds.push(id);
          const profileId = asString(row.profile_id);
          if (profileId) profileIds.push(profileId);
        }
      }

      const candidateAmbId = asString(candidate.id);
      if (
        candidateAmbId &&
        !asString(candidate.source) &&
        !ambassadorIds.includes(candidateAmbId)
      ) {
        // Candidate may itself be an ambassadors / ambassador_profiles row
        if (asString(candidate.referral_code_slug) || asString(candidate.ambassador_record_id)) {
          profileIds.push(candidateAmbId);
          const ambId = asString(candidate.ambassador_record_id);
          if (ambId) ambassadorIds.push(ambId);
        } else if (asString(candidate.referral_code) || asString(candidate.status)) {
          ambassadorIds.push(candidateAmbId);
        }
      }

      const uniqueAmbIds = [...new Set(ambassadorIds.filter(Boolean))];
      const uniqueProfileIds = [...new Set(profileIds.filter(Boolean))];
      const userIds = userId ? [userId] : [];

      // Child rows first (ledger / validation / rewards) to avoid FK violations
      await safeDelete(
        "ambassador_clicks",
        "ambassador_profile_id",
        uniqueProfileIds,
        errors,
        tablesTouched,
      );
      await safeDelete(
        "ambassador_clicks",
        "ambassador_id",
        uniqueAmbIds,
        errors,
        tablesTouched,
      );
      await safeDelete(
        "ambassador_clicks",
        "user_id",
        userIds,
        errors,
        tablesTouched,
      );

      await safeDelete(
        "ambassador_referrals",
        "ambassador_profile_id",
        uniqueProfileIds,
        errors,
        tablesTouched,
      );
      await safeDelete(
        "ambassador_referrals",
        "ambassador_id",
        uniqueAmbIds,
        errors,
        tablesTouched,
      );
      await safeDelete(
        "ambassador_referrals",
        "user_id",
        userIds,
        errors,
        tablesTouched,
      );

      await safeDelete(
        "ambassador_rewards",
        "ambassador_id",
        uniqueAmbIds,
        errors,
        tablesTouched,
      );
      await safeDelete(
        "ambassador_rewards",
        "user_id",
        userIds,
        errors,
        tablesTouched,
      );
      await safeDelete(
        "ambassador_rewards",
        "ambassador_profile_id",
        uniqueProfileIds,
        errors,
        tablesTouched,
      );

      await safeDelete(
        "referral_clicks",
        "ambassador_id",
        uniqueAmbIds,
        errors,
        tablesTouched,
      );
      await safeDelete(
        "referral_clicks",
        "user_id",
        userIds,
        errors,
        tablesTouched,
      );

      await safeDelete(
        "commission_ledger",
        "ambassador_id",
        uniqueAmbIds,
        errors,
        tablesTouched,
      );
      await safeDelete(
        "commission_ledger",
        "user_id",
        userIds,
        errors,
        tablesTouched,
      );

      await safeDelete(
        "ambassador_training_progress",
        "user_id",
        userIds,
        errors,
        tablesTouched,
      );
      await safeDelete(
        "ambassador_training_progress",
        "ambassador_id",
        uniqueAmbIds,
        errors,
        tablesTouched,
      );

      await safeDelete(
        "user_roles",
        "user_id",
        userIds,
        errors,
        tablesTouched,
      );

      // Child profile / ledger validation rows
      await safeDelete(
        "ambassador_profiles",
        "id",
        uniqueProfileIds,
        errors,
        tablesTouched,
      );
      await safeDelete(
        "ambassador_profiles",
        "user_id",
        userIds,
        errors,
        tablesTouched,
      );
      await safeDelete(
        "ambassador_profiles",
        "ambassador_record_id",
        uniqueAmbIds,
        errors,
        tablesTouched,
      );

      await safeDelete(
        "ambassadors",
        "id",
        uniqueAmbIds,
        errors,
        tablesTouched,
      );
      await safeDelete("ambassadors", "user_id", userIds, errors, tablesTouched);

      if (userId) {
        await safeDelete("profiles", "id", [userId], errors, tablesTouched);

        const { error: authError } =
          await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authError) {
          if (!/User not found|not found/i.test(authError.message || "")) {
            errors.push(`auth.deleteUser(${userId}): ${authError.message}`);
          }
        } else {
          tablesTouched.push("auth.users");
        }
      }

      deleted.push({
        userId: userId || null,
        email,
        ambassadorIds: uniqueAmbIds,
        profileIds: uniqueProfileIds,
        tablesTouched: [...new Set(tablesTouched)],
      });
    } catch (error) {
      errors.push(
        error instanceof Error
          ? `purge ${email || userId || "unknown"}: ${error.message}`
          : `purge ${email || userId || "unknown"} failed`,
      );
    }
  }

  return {
    ok: errors.length === 0,
    matched: candidates.length,
    deleted,
    errors,
    message: `Hard-deleted ${deleted.length} of ${candidates.length} matched test ambassador/user profile(s).`,
  };
}
