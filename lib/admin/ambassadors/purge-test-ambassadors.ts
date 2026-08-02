/**
 * Hard-purge automated ambassador test fixtures.
 *
 * Targets emails containing `sitguru.local` or `journey.amb.` (journey seed
 * accounts like journey.amb.<runId>@sitguru.local / "Ambassador Mark").
 *
 * Soft archive is not enough — these rows must leave auth, profiles, and
 * orphaned ambassador dependency tables entirely.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type PurgeTestAmbassadorResult = {
  ok: boolean;
  matchedEmails: string[];
  purgedUserIds: string[];
  purgedAmbassadorIds: string[];
  deletedAuthUsers: number;
  errors: string[];
  message: string;
};

type AnyRow = Record<string, unknown>;

const SUPER_USER_EMAILS = new Set(["jason@sitguru.com", "nette@sitguru.com"]);

function asString(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return asString(value).toLowerCase();
}

/** True for automated journey / local fixture ambassador emails. */
export function isTestAmbassadorEmail(email: unknown) {
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

async function safeDelete(
  label: string,
  run: () => PromiseLike<{ error: { message?: string } | null }>,
  errors: string[],
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
  } catch (error) {
    errors.push(
      `${label}: ${error instanceof Error ? error.message : "delete failed"}`,
    );
  }
}

async function collectAuthTestUsers() {
  const matches: Array<{ id: string; email: string }> = [];

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) break;

    const users = data?.users || [];
    for (const user of users) {
      const email = normalizeEmail(user.email);
      if (isTestAmbassadorEmail(email)) {
        matches.push({ id: user.id, email });
      }
    }

    if (users.length < 200) break;
  }

  return matches;
}

async function wipeAmbassadorGraph(options: {
  userIds: string[];
  ambassadorIds: string[];
  emails: string[];
  referralCodes: string[];
  errors: string[];
}) {
  const { userIds, ambassadorIds, emails, referralCodes, errors } = options;

  for (const ambassadorId of ambassadorIds) {
    await safeDelete(
      "ambassador_activity_log",
      () =>
        supabaseAdmin
          .from("ambassador_activity_log")
          .delete()
          .eq("ambassador_id", ambassadorId),
      errors,
    );
    await safeDelete(
      "ambassador_document_submissions",
      () =>
        supabaseAdmin
          .from("ambassador_document_submissions")
          .delete()
          .eq("ambassador_id", ambassadorId),
      errors,
    );
    await safeDelete(
      "ambassador_onboarding_packets",
      () =>
        supabaseAdmin
          .from("ambassador_onboarding_packets")
          .delete()
          .eq("ambassador_id", ambassadorId),
      errors,
    );
    await safeDelete(
      "ambassador_required_documents",
      () =>
        supabaseAdmin
          .from("ambassador_required_documents")
          .delete()
          .eq("ambassador_id", ambassadorId),
      errors,
    );
    await safeDelete(
      "ambassador_training_progress",
      () =>
        supabaseAdmin
          .from("ambassador_training_progress")
          .delete()
          .eq("ambassador_id", ambassadorId),
      errors,
    );
  }

  for (const userId of userIds) {
    await safeDelete(
      "ambassador_training_progress.user",
      () =>
        supabaseAdmin
          .from("ambassador_training_progress")
          .delete()
          .eq("user_id", userId),
      errors,
    );
    await safeDelete(
      "ambassador_document_submissions.user",
      () =>
        supabaseAdmin
          .from("ambassador_document_submissions")
          .delete()
          .eq("user_id", userId),
      errors,
    );
    await safeDelete(
      "ambassador_onboarding_packets.user",
      () =>
        supabaseAdmin
          .from("ambassador_onboarding_packets")
          .delete()
          .eq("user_id", userId),
      errors,
    );
    await safeDelete(
      "ambassador_clicks.user",
      () =>
        supabaseAdmin.from("ambassador_clicks").delete().eq("user_id", userId),
      errors,
    );
    await safeDelete(
      "ambassador_referrals.ambassador_user",
      () =>
        supabaseAdmin
          .from("ambassador_referrals")
          .delete()
          .eq("ambassador_user_id", userId),
      errors,
    );
    await safeDelete(
      "ambassador_referrals.user",
      () =>
        supabaseAdmin
          .from("ambassador_referrals")
          .delete()
          .eq("user_id", userId),
      errors,
    );
    await safeDelete(
      "ambassador_rewards.ambassador_user",
      () =>
        supabaseAdmin
          .from("ambassador_rewards")
          .delete()
          .eq("ambassador_user_id", userId),
      errors,
    );
    await safeDelete(
      "ambassador_rewards.user",
      () =>
        supabaseAdmin
          .from("ambassador_rewards")
          .delete()
          .eq("user_id", userId),
      errors,
    );
    await safeDelete(
      "referral_rewards",
      () =>
        supabaseAdmin
          .from("referral_rewards")
          .delete()
          .eq("referrer_user_id", userId),
      errors,
    );
    await safeDelete(
      "referral_events",
      () =>
        supabaseAdmin
          .from("referral_events")
          .delete()
          .eq("referrer_user_id", userId),
      errors,
    );
    await safeDelete(
      "referral_codes",
      () => supabaseAdmin.from("referral_codes").delete().eq("user_id", userId),
      errors,
    );
    await safeDelete(
      "pawperks_account_referral_codes",
      () =>
        supabaseAdmin
          .from("pawperks_account_referral_codes")
          .delete()
          .eq("user_id", userId),
      errors,
    );
    await safeDelete(
      "ambassador_profiles.user",
      () =>
        supabaseAdmin
          .from("ambassador_profiles")
          .delete()
          .eq("user_id", userId),
      errors,
    );
    await safeDelete(
      "academy_assignments",
      () =>
        supabaseAdmin
          .from("academy_assignments")
          .delete()
          .eq("user_id", userId)
          .eq("academy_type", "ambassador"),
      errors,
    );
    await safeDelete(
      "user_roles",
      () =>
        supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "ambassador"),
      errors,
    );
    await safeDelete(
      "ambassador_leads.converted",
      () =>
        supabaseAdmin
          .from("ambassador_leads")
          .delete()
          .eq("converted_profile_id", userId),
      errors,
    );
  }

  for (const code of referralCodes) {
    await safeDelete(
      "ambassador_clicks.code",
      () =>
        supabaseAdmin
          .from("ambassador_clicks")
          .delete()
          .eq("referral_code", code),
      errors,
    );
    await safeDelete(
      "ambassador_clicks.amb_code",
      () =>
        supabaseAdmin
          .from("ambassador_clicks")
          .delete()
          .eq("ambassador_code", code),
      errors,
    );
    await safeDelete(
      "ambassador_profiles.slug",
      () =>
        supabaseAdmin
          .from("ambassador_profiles")
          .delete()
          .eq("referral_code_slug", code),
      errors,
    );
    await safeDelete(
      "referral_codes.code",
      () => supabaseAdmin.from("referral_codes").delete().eq("code", code),
      errors,
    );
  }

  for (const email of emails) {
    await safeDelete(
      "ambassador_leads.email",
      () => supabaseAdmin.from("ambassador_leads").delete().eq("email", email),
      errors,
    );
    await safeDelete(
      "ambassador_leads_archive.email",
      () =>
        supabaseAdmin
          .from("ambassador_leads_archive")
          .delete()
          .eq("email", email),
      errors,
    );
    await safeDelete(
      "ambassadors.email",
      () => supabaseAdmin.from("ambassadors").delete().eq("email", email),
      errors,
    );
  }

  for (const ambassadorId of ambassadorIds) {
    await safeDelete(
      "ambassadors.id",
      () => supabaseAdmin.from("ambassadors").delete().eq("id", ambassadorId),
      errors,
    );
    await safeDelete(
      "ambassador_profiles.record",
      () =>
        supabaseAdmin
          .from("ambassador_profiles")
          .delete()
          .eq("ambassador_record_id", ambassadorId),
      errors,
    );
  }

  for (const userId of userIds) {
    await safeDelete(
      "ambassadors.user",
      () => supabaseAdmin.from("ambassadors").delete().eq("user_id", userId),
      errors,
    );
    await safeDelete(
      "ambassadors.profile",
      () => supabaseAdmin.from("ambassadors").delete().eq("profile_id", userId),
      errors,
    );
    await safeDelete(
      "profiles",
      () => supabaseAdmin.from("profiles").delete().eq("id", userId),
      errors,
    );
    await safeDelete(
      "users",
      () => supabaseAdmin.from("users").delete().eq("id", userId),
      errors,
    );
  }
}

/**
 * Deep-delete every ambassador / auth / profile fixture matching test emails.
 */
export async function purgeTestAmbassadors(): Promise<PurgeTestAmbassadorResult> {
  const errors: string[] = [];

  const [
    ambassadorsByLocal,
    ambassadorsByJourney,
    profilesByLocal,
    profilesByJourney,
    leadsByLocal,
    leadsByJourney,
    authMatches,
  ] = await Promise.all([
    supabaseAdmin
      .from("ambassadors")
      .select("id,user_id,profile_id,email,referral_code,full_name")
      .ilike("email", "%sitguru.local%"),
    supabaseAdmin
      .from("ambassadors")
      .select("id,user_id,profile_id,email,referral_code,full_name")
      .ilike("email", "%journey.amb.%"),
    supabaseAdmin
      .from("profiles")
      .select("id,user_id,email,full_name")
      .ilike("email", "%sitguru.local%"),
    supabaseAdmin
      .from("profiles")
      .select("id,user_id,email,full_name")
      .ilike("email", "%journey.amb.%"),
    supabaseAdmin
      .from("ambassador_leads")
      .select("id,email,converted_profile_id")
      .ilike("email", "%sitguru.local%"),
    supabaseAdmin
      .from("ambassador_leads")
      .select("id,email,converted_profile_id")
      .ilike("email", "%journey.amb.%"),
    collectAuthTestUsers(),
  ]);

  for (const result of [
    ambassadorsByLocal,
    ambassadorsByJourney,
    profilesByLocal,
    profilesByJourney,
    leadsByLocal,
    leadsByJourney,
  ]) {
    if (result.error) {
      const message = String(result.error.message || "");
      if (
        !/relation .* does not exist|could not find the table/i.test(message)
      ) {
        errors.push(message);
      }
    }
  }

  const ambassadorRows = [
    ...((ambassadorsByLocal.data || []) as AnyRow[]),
    ...((ambassadorsByJourney.data || []) as AnyRow[]),
  ].filter((row) => isTestAmbassadorEmail(row.email));

  const profileRows = [
    ...((profilesByLocal.data || []) as AnyRow[]),
    ...((profilesByJourney.data || []) as AnyRow[]),
  ].filter((row) => isTestAmbassadorEmail(row.email));

  const leadRows = [
    ...((leadsByLocal.data || []) as AnyRow[]),
    ...((leadsByJourney.data || []) as AnyRow[]),
  ].filter((row) => isTestAmbassadorEmail(row.email));

  const matchedEmails = uniqueStrings([
    ...ambassadorRows.map((row) => normalizeEmail(row.email)),
    ...profileRows.map((row) => normalizeEmail(row.email)),
    ...leadRows.map((row) => normalizeEmail(row.email)),
    ...authMatches.map((row) => row.email),
  ]);

  const purgedAmbassadorIds = uniqueStrings(
    ambassadorRows.map((row) => asString(row.id)),
  );

  const purgedUserIds = uniqueStrings([
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

  if (
    matchedEmails.length === 0 &&
    purgedUserIds.length === 0 &&
    purgedAmbassadorIds.length === 0
  ) {
    return {
      ok: true,
      matchedEmails: [],
      purgedUserIds: [],
      purgedAmbassadorIds: [],
      deletedAuthUsers: 0,
      errors,
      message: "No sitguru.local / journey.amb. ambassador fixtures found.",
    };
  }

  await wipeAmbassadorGraph({
    userIds: purgedUserIds,
    ambassadorIds: purgedAmbassadorIds,
    emails: matchedEmails,
    referralCodes,
    errors,
  });

  for (const lead of leadRows) {
    const leadId = asString(lead.id);
    if (!leadId) continue;
    await safeDelete(
      "ambassador_leads.id",
      () => supabaseAdmin.from("ambassador_leads").delete().eq("id", leadId),
      errors,
    );
  }

  let deletedAuthUsers = 0;
  for (const userId of purgedUserIds) {
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) {
        const message = String(error.message || "");
        if (!/user not found|not found/i.test(message)) {
          errors.push(`auth.deleteUser(${userId}): ${message}`);
        }
      } else {
        deletedAuthUsers += 1;
      }
    } catch (error) {
      errors.push(
        `auth.deleteUser(${userId}): ${
          error instanceof Error ? error.message : "failed"
        }`,
      );
    }
  }

  return {
    ok: errors.length === 0,
    matchedEmails,
    purgedUserIds,
    purgedAmbassadorIds,
    deletedAuthUsers,
    errors,
    message: `Purged ${matchedEmails.length} test ambassador email(s), ${purgedAmbassadorIds.length} ambassador row(s), ${deletedAuthUsers} auth user(s).`,
  };
}

async function assertPurgeActor() {
  const actor = await getAdminIdentity();
  if (actor?.canManageUsers || actor?.isSuperUser) {
    return actor;
  }

  if (actor && SUPER_USER_EMAILS.has(actor.email)) {
    return actor;
  }

  return null;
}

/** Server action — form POST from Ambassadors HQ. */
export async function purgeTestAmbassadorsAction() {
  "use server";

  const actor = await assertPurgeActor();
  if (!actor) {
    redirect("/admin/login");
  }

  const result = await purgeTestAmbassadors();

  revalidatePath("/admin/ambassadors");
  revalidatePath("/admin/ambassadors/ledger");
  revalidatePath("/admin/ambassador-leads");
  revalidatePath("/admin/partners/ambassadors");
  revalidatePath("/admin/hr");
  revalidatePath("/admin/users");

  const params = new URLSearchParams();
  params.set("purged", result.ok ? "success" : "error");
  params.set("count", String(result.matchedEmails.length));

  redirect(`/admin/ambassadors?${params.toString()}`);
}

/**
 * Hard-delete one ambassador when it is a known test fixture.
 * Returns true if a deep purge ran; false if caller should soft-archive.
 */
export async function hardDeleteAmbassadorIfTestFixture(options: {
  ambassadorId: string;
}): Promise<{ handled: boolean; result?: PurgeTestAmbassadorResult }> {
  const ambassadorId = asString(options.ambassadorId);
  if (!ambassadorId || ambassadorId.startsWith("pending:")) {
    return { handled: false };
  }

  const { data, error } = await supabaseAdmin
    .from("ambassadors")
    .select("id,user_id,profile_id,email,referral_code")
    .eq("id", ambassadorId)
    .maybeSingle();

  if (error || !data) {
    return { handled: false };
  }

  const row = data as AnyRow;
  if (!isTestAmbassadorEmail(row.email)) {
    return { handled: false };
  }

  const errors: string[] = [];
  const email = normalizeEmail(row.email);
  const userIds = uniqueStrings([
    asString(row.user_id),
    asString(row.profile_id),
  ]);
  const referralCodes = uniqueStrings([asString(row.referral_code)]);

  await wipeAmbassadorGraph({
    userIds,
    ambassadorIds: [ambassadorId],
    emails: email ? [email] : [],
    referralCodes,
    errors,
  });

  let deletedAuthUsers = 0;
  for (const userId of userIds) {
    try {
      const { error: authError } =
        await supabaseAdmin.auth.admin.deleteUser(userId);
      if (!authError) deletedAuthUsers += 1;
      else if (!/user not found|not found/i.test(String(authError.message))) {
        errors.push(`auth.deleteUser(${userId}): ${authError.message}`);
      }
    } catch (authError) {
      errors.push(
        `auth.deleteUser(${userId}): ${
          authError instanceof Error ? authError.message : "failed"
        }`,
      );
    }
  }

  return {
    handled: true,
    result: {
      ok: errors.length === 0,
      matchedEmails: email ? [email] : [],
      purgedUserIds: userIds,
      purgedAmbassadorIds: [ambassadorId],
      deletedAuthUsers,
      errors,
      message: `Hard-deleted test ambassador ${email || ambassadorId}.`,
    },
  };
}
