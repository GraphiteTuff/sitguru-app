import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatUsPhoneDisplay, normalizeE164Phone } from "@/lib/sms/phone";
import {
  buildWelcomeSms,
  firstNameFromDisplayName,
  normalizeWelcomeRoles,
} from "@/lib/sms/welcome-message";

const BLOCKED_STATUSES = [
  "deleted",
  "suspended",
  "deactivated",
  "archived",
  "banned",
];

export type WelcomeSmsEligibility = {
  userId: string;
  displayName: string;
  firstName: string;
  roles: string[];
  displayPhone: string;
  e164Phone: string;
  eligible: boolean;
  reason: string | null;
  consentRecorded: boolean;
  optedOut: boolean;
  lastWelcomeSentAt: string | null;
  defaultMessage: string;
};

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown) {
  return String(value || "").trim();
}

function isBlockedStatus(...values: unknown[]) {
  return values.some((value) =>
    BLOCKED_STATUSES.includes(text(value).toLowerCase()),
  );
}

function collectPhones(...values: unknown[]) {
  for (const value of values) {
    const e164 = normalizeE164Phone(value);
    if (e164) return e164;
  }
  return "";
}

function mapRoleRow(role: string) {
  const normalized = role.trim().toLowerCase();
  if (normalized === "guru" || normalized === "both") return ["Guru"];
  if (
    normalized === "customer" ||
    normalized === "pet_parent" ||
    normalized === "petparent"
  ) {
    return ["Pet Parent"];
  }
  if (normalized === "ambassador") return ["Ambassador"];
  return [];
}

export async function loadWelcomeSmsEligibility(
  userId: string,
): Promise<WelcomeSmsEligibility | null> {
  const id = text(userId);
  if (!id) return null;

  const [
    profileResult,
    rolesResult,
    prefsResult,
    guruResult,
    welcomeLogResult,
    authUserResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select(
        "id, first_name, full_name, phone, role, signup_role, account_status, admin_status, deleted_at, is_archived, is_test_account",
      )
      .eq("id", id)
      .maybeSingle(),
    supabaseAdmin.from("user_roles").select("role").eq("user_id", id),
    supabaseAdmin
      .from("notification_preferences")
      .select("sms_enabled, sms_consent_at, sms_opted_out_at, transactional_enabled")
      .eq("user_id", id)
      .maybeSingle(),
    supabaseAdmin
      .from("gurus")
      .select("phone, phone_number, mobile_phone, contact_phone, user_id, id")
      .or(`id.eq.${id},user_id.eq.${id}`)
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("communication_logs")
      .select("created_at, sent_at, status")
      .eq("user_id", id)
      .eq("channel", "sms")
      .contains("metadata", { message_type: "welcome" })
      .in("status", ["queued", "sent", "delivered"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin.auth.admin.getUserById(id),
  ]);

  const profile = asRecord(profileResult.data);
  if (!profile.id) return null;

  const prefs = asRecord(prefsResult.data);
  const guru = asRecord(guruResult.data);
  const metadata = asRecord(authUserResult.data?.user?.user_metadata);
  const displayName =
    text(profile.full_name) ||
    text(profile.first_name) ||
    "SitGuru member";
  const firstName =
    text(profile.first_name) || firstNameFromDisplayName(displayName);

  const roles = normalizeWelcomeRoles([
    ...(rolesResult.data || []).flatMap((row) => mapRoleRow(text(row.role))),
    text(profile.role),
    text(profile.signup_role),
    guru.id ? "Guru" : "",
  ]);

  const e164Phone = collectPhones(
    profile.phone,
    guru.phone,
    guru.phone_number,
    guru.mobile_phone,
    guru.contact_phone,
    authUserResult.data?.user?.phone,
    metadata.phone,
  );

  const optedOut = Boolean(prefs.sms_opted_out_at);
  const consentRecorded = Boolean(
    prefs.sms_consent_at ||
      prefs.sms_enabled === true ||
      metadata.sms_consent === true ||
      metadata.sms_opt_in === true ||
      metadata.transactional_sms_opt_in === true ||
      metadata.phone_notifications_enabled === true,
  );

  let reason: string | null = null;
  if (profile.deleted_at || profile.is_archived === true) {
    reason = "SMS unavailable — account is deleted or archived";
  } else if (isBlockedStatus(profile.account_status, profile.admin_status)) {
    reason = "SMS unavailable — account is suspended";
  } else if (!e164Phone) {
    reason = "No valid mobile number";
  } else if (optedOut) {
    reason = "SMS unavailable — user opted out";
  }

  const lastWelcomeSentAt =
    text(welcomeLogResult.data?.sent_at) ||
    text(welcomeLogResult.data?.created_at) ||
    null;

  return {
    userId: id,
    displayName,
    firstName,
    roles,
    displayPhone: formatUsPhoneDisplay(e164Phone),
    e164Phone,
    eligible: !reason,
    reason,
    consentRecorded,
    optedOut,
    lastWelcomeSentAt,
    defaultMessage: buildWelcomeSms({ firstName, roles }),
  };
}
