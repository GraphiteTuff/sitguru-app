/**
 * CLI: hard-purge journey / sitguru.local ambassador fixtures.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/purge-test-ambassadors.ts
 */

import { createClient } from "@supabase/supabase-js";

type AnyRow = Record<string, unknown>;

function requireEnv(name: string) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function asString(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return asString(value).toLowerCase();
}

function isTestAmbassadorEmail(email: unknown) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return (
    normalized.includes("sitguru.local") ||
    normalized.includes("journey.amb.")
  );
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => asString(value)).filter(Boolean)),
  );
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const errors: string[] = [];

  async function safeDelete(
    label: string,
    run: () => PromiseLike<{ error: { message?: string } | null }>,
  ) {
    try {
      const { error } = await run();
      if (!error) return;
      const message = String(error.message || "");
      if (
        /relation .* does not exist|could not find the table|column .* does not exist/i.test(
          message,
        )
      ) {
        return;
      }
      errors.push(`${label}: ${message}`);
      console.warn(`soft-fail ${label}:`, message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "delete failed";
      errors.push(`${label}: ${message}`);
      console.warn(`soft-fail ${label}:`, message);
    }
  }

  const authMatches: Array<{ id: string; email: string }> = [];
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      console.warn("listUsers soft-fail:", error.message);
      break;
    }
    const users = data?.users || [];
    for (const user of users) {
      const email = normalizeEmail(user.email);
      if (isTestAmbassadorEmail(email)) {
        authMatches.push({ id: user.id, email });
      }
    }
    if (users.length < 200) break;
  }

  const [ambLocal, ambJourney, profLocal, profJourney, leadLocal, leadJourney] =
    await Promise.all([
      admin
        .from("ambassadors")
        .select("id,user_id,profile_id,email,referral_code,full_name")
        .ilike("email", "%sitguru.local%"),
      admin
        .from("ambassadors")
        .select("id,user_id,profile_id,email,referral_code,full_name")
        .ilike("email", "%journey.amb.%"),
      admin
        .from("profiles")
        .select("id,user_id,email,full_name")
        .ilike("email", "%sitguru.local%"),
      admin
        .from("profiles")
        .select("id,user_id,email,full_name")
        .ilike("email", "%journey.amb.%"),
      admin
        .from("ambassador_leads")
        .select("id,email,converted_profile_id")
        .ilike("email", "%sitguru.local%"),
      admin
        .from("ambassador_leads")
        .select("id,email,converted_profile_id")
        .ilike("email", "%journey.amb.%"),
    ]);

  const ambassadorRows = [
    ...((ambLocal.data || []) as AnyRow[]),
    ...((ambJourney.data || []) as AnyRow[]),
  ].filter((row) => isTestAmbassadorEmail(row.email));

  const profileRows = [
    ...((profLocal.data || []) as AnyRow[]),
    ...((profJourney.data || []) as AnyRow[]),
  ].filter((row) => isTestAmbassadorEmail(row.email));

  const leadRows = [
    ...((leadLocal.data || []) as AnyRow[]),
    ...((leadJourney.data || []) as AnyRow[]),
  ].filter((row) => isTestAmbassadorEmail(row.email));

  const matchedEmails = uniqueStrings([
    ...ambassadorRows.map((row) => normalizeEmail(row.email)),
    ...profileRows.map((row) => normalizeEmail(row.email)),
    ...leadRows.map((row) => normalizeEmail(row.email)),
    ...authMatches.map((row) => row.email),
  ]);

  const ambassadorIds = uniqueStrings(
    ambassadorRows.map((row) => asString(row.id)),
  );
  const userIds = uniqueStrings([
    ...ambassadorRows.map((row) => asString(row.user_id)),
    ...ambassadorRows.map((row) => asString(row.profile_id)),
    ...profileRows.map((row) => asString(row.id)),
    ...profileRows.map((row) => asString(row.user_id)),
    ...leadRows.map((row) => asString(row.converted_profile_id)),
    ...authMatches.map((row) => row.id),
  ]);
  const referralCodes = uniqueStrings(
    ambassadorRows.map((row) => asString(row.referral_code)),
  );

  console.log("Matched emails:", matchedEmails);
  console.log("Ambassador ids:", ambassadorIds);
  console.log("User ids:", userIds);

  if (!matchedEmails.length && !userIds.length && !ambassadorIds.length) {
    console.log("Nothing to purge.");
    return;
  }

  for (const ambassadorId of ambassadorIds) {
    await safeDelete("ambassador_activity_log", () =>
      admin
        .from("ambassador_activity_log")
        .delete()
        .eq("ambassador_id", ambassadorId),
    );
    await safeDelete("ambassador_document_submissions", () =>
      admin
        .from("ambassador_document_submissions")
        .delete()
        .eq("ambassador_id", ambassadorId),
    );
    await safeDelete("ambassador_onboarding_packets", () =>
      admin
        .from("ambassador_onboarding_packets")
        .delete()
        .eq("ambassador_id", ambassadorId),
    );
    await safeDelete("ambassador_training_progress", () =>
      admin
        .from("ambassador_training_progress")
        .delete()
        .eq("ambassador_id", ambassadorId),
    );
  }

  for (const userId of userIds) {
    await safeDelete("ambassador_profiles", () =>
      admin.from("ambassador_profiles").delete().eq("user_id", userId),
    );
    await safeDelete("ambassador_clicks", () =>
      admin.from("ambassador_clicks").delete().eq("user_id", userId),
    );
    await safeDelete("ambassador_referrals", () =>
      admin
        .from("ambassador_referrals")
        .delete()
        .eq("ambassador_user_id", userId),
    );
    await safeDelete("ambassador_rewards", () =>
      admin
        .from("ambassador_rewards")
        .delete()
        .eq("ambassador_user_id", userId),
    );
    await safeDelete("referral_codes", () =>
      admin.from("referral_codes").delete().eq("user_id", userId),
    );
    await safeDelete("user_roles", () =>
      admin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "ambassador"),
    );
    await safeDelete("academy_assignments", () =>
      admin
        .from("academy_assignments")
        .delete()
        .eq("user_id", userId)
        .eq("academy_type", "ambassador"),
    );
  }

  for (const code of referralCodes) {
    await safeDelete("ambassador_profiles.slug", () =>
      admin
        .from("ambassador_profiles")
        .delete()
        .eq("referral_code_slug", code),
    );
  }

  for (const email of matchedEmails) {
    await safeDelete("ambassador_leads.email", () =>
      admin.from("ambassador_leads").delete().eq("email", email),
    );
    await safeDelete("ambassadors.email", () =>
      admin.from("ambassadors").delete().eq("email", email),
    );
  }

  for (const ambassadorId of ambassadorIds) {
    await safeDelete("ambassadors.id", () =>
      admin.from("ambassadors").delete().eq("id", ambassadorId),
    );
  }

  for (const userId of userIds) {
    await safeDelete("ambassadors.user", () =>
      admin.from("ambassadors").delete().eq("user_id", userId),
    );
    await safeDelete("profiles", () =>
      admin.from("profiles").delete().eq("id", userId),
    );
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error && !/user not found|not found/i.test(error.message)) {
      errors.push(`auth.deleteUser(${userId}): ${error.message}`);
      console.warn("auth delete soft-fail:", error.message);
    } else if (!error) {
      console.log("Deleted auth user", userId);
    }
  }

  console.log("Purge complete.");
  if (errors.length) {
    console.warn("Non-fatal errors:", errors);
    process.exitCode = 0;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
