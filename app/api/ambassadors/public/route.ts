import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalized(value: unknown) {
  return asString(value).toLowerCase();
}

function getRowId(row: Row) {
  return asString(row.id) || asString(row.user_id) || asString(row.profile_id);
}

function getEmail(row: Row) {
  return asString(row.email) || asString(row.contact_email);
}

function getFirstName(row: Row) {
  return asString(row.first_name) || asString(row.firstName);
}

function getLastName(row: Row) {
  return asString(row.last_name) || asString(row.lastName);
}

function getFullName(row: Row) {
  const firstName = getFirstName(row);
  const lastName = getLastName(row);
  const combinedName = `${firstName} ${lastName}`.trim();

  return (
    asString(row.full_name) ||
    asString(row.display_name) ||
    asString(row.name) ||
    asString(row.candidate_name) ||
    asString(row.contact_name) ||
    combinedName ||
    "SitGuru Ambassador"
  );
}

function getAccountAvatarUrl(row: Row) {
  return asString(row.account_avatar_url);
}

function getPhotoUrl(row: Row) {
  const accountAvatarUrl = getAccountAvatarUrl(row);

  if (accountAvatarUrl) return accountAvatarUrl;

  return (
    asString(row.ambassador_photo_url) ||
    asString(row.ambassador_photo_path) ||
    asString(row.profile_photo_url) ||
    asString(row.photo_url) ||
    asString(row.avatar_url) ||
    asString(row.image_url) ||
    ""
  );
}

function getCity(row: Row) {
  return (
    asString(row.city) ||
    asString(row.service_city) ||
    asString(row.location_city) ||
    asString(row.home_city) ||
    ""
  );
}

function getState(row: Row) {
  return (
    asString(row.state) ||
    asString(row.service_state) ||
    asString(row.location_state) ||
    asString(row.home_state) ||
    ""
  );
}

function getServiceCity(row: Row) {
  return (
    asString(row.service_city) ||
    asString(row.city) ||
    asString(row.location_city) ||
    asString(row.home_city) ||
    ""
  );
}

function getServiceState(row: Row) {
  return (
    asString(row.service_state) ||
    asString(row.state) ||
    asString(row.location_state) ||
    asString(row.home_state) ||
    ""
  );
}

function getAmbassadorType(row: Row) {
  return (
    asString(row.ambassador_type) ||
    asString(row.program_type) ||
    asString(row.hire_type) ||
    asString(row.type) ||
    asString(row.community_type) ||
    "SitGuru Ambassador"
  );
}

function getReferralCode(row: Row) {
  return (
    asString(row.referral_code) ||
    asString(row.ambassador_code) ||
    asString(row.code) ||
    ""
  );
}

function getBio(row: Row) {
  return (
    asString(row.bio) ||
    asString(row.about) ||
    asString(row.notes_public) ||
    asString(row.public_bio) ||
    ""
  );
}

function getMergeKey(row: Row) {
  const email = getEmail(row).toLowerCase();
  if (email) return `email:${email}`;

  const id = getRowId(row);
  if (id) return `id:${id}`;

  const name = getFullName(row).toLowerCase();
  return `name:${name}`;
}

function isNegativeStatus(value: unknown) {
  const status = normalized(value);

  return [
    "deleted",
    "suspended",
    "deactivated",
    "archived",
    "rejected",
    "not moving forward",
    "not_moving_forward",
    "inactive",
    "cancelled",
    "canceled",
  ].includes(status);
}

function isPositiveActiveStatus(value: unknown) {
  const status = normalized(value);

  return [
    "active",
    "approved",
    "signed up",
    "signed_up",
    "converted",
    "ready",
    "live",
  ].includes(status);
}

function isActiveAmbassador(row: Row) {
  const statusFields = [
    row.account_status,
    row.status,
    row.ambassador_status,
    row.profile_status,
    row.approval_status,
    row.lead_status,
  ];

  if (statusFields.some(isNegativeStatus)) return false;
  if (row.is_active === false) return false;
  if (row.is_public === false) return false;

  if (statusFields.some(isPositiveActiveStatus)) return true;

  // Existing SitGuru profiles with role=ambassador are treated as active
  // unless a negative status above says otherwise.
  return normalized(row.role) === "ambassador";
}

function mergeRows(base: Row, incoming: Row): Row {
  return {
    ...base,
    ...incoming,
    id: getRowId(base) || getRowId(incoming),
    email: getEmail(base) || getEmail(incoming),
    full_name:
      getFullName(base) !== "SitGuru Ambassador"
        ? getFullName(base)
        : getFullName(incoming),
    first_name: getFirstName(base) || getFirstName(incoming),
    last_name: getLastName(base) || getLastName(incoming),
    city: getCity(base) || getCity(incoming),
    state: getState(base) || getState(incoming),
    service_city: getServiceCity(base) || getServiceCity(incoming),
    service_state: getServiceState(base) || getServiceState(incoming),
    account_avatar_url:
      getAccountAvatarUrl(incoming) || getAccountAvatarUrl(base),
    profile_photo_url: getPhotoUrl(incoming) || getPhotoUrl(base),
    avatar_url:
      getAccountAvatarUrl(incoming) ||
      asString(incoming.avatar_url) ||
      getAccountAvatarUrl(base) ||
      asString(base.avatar_url),
    image_url:
      getAccountAvatarUrl(incoming) ||
      asString(incoming.image_url) ||
      getAccountAvatarUrl(base) ||
      asString(base.image_url),
    ambassador_photo_url:
      asString(incoming.ambassador_photo_url) || asString(base.ambassador_photo_url),
    ambassador_photo_path:
      asString(incoming.ambassador_photo_path) || asString(base.ambassador_photo_path),
    referral_code: getReferralCode(base) || getReferralCode(incoming),
    ambassador_type: getAmbassadorType(base) || getAmbassadorType(incoming),
    bio: getBio(base) || getBio(incoming),
  };
}

async function safeRows(tableName: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select("*")
      .limit(1000);

    if (error) {
      console.warn(`Public Ambassador route skipped ${tableName}:`, error);
      return [] as Row[];
    }

    return ((data || []) as Row[]).map((row) => ({
      ...row,
      account_avatar_url:
        tableName === "profiles" ? asString(row.avatar_url) : asString(row.account_avatar_url),
      __source_table: tableName,
    }));
  } catch (error) {
    console.warn(`Public Ambassador route skipped ${tableName}:`, error);
    return [] as Row[];
  }
}

function toPublicAmbassador(row: Row) {
  return {
    id: getRowId(row),
    fullName: getFullName(row),
    firstName: getFirstName(row) || null,
    lastName: getLastName(row) || null,
    city: getCity(row) || null,
    state: getState(row) || null,
    serviceCity: getServiceCity(row) || null,
    serviceState: getServiceState(row) || null,
    photoUrl: getPhotoUrl(row) || null,
    referralCode: getReferralCode(row) || null,
    ambassadorType: getAmbassadorType(row) || null,
    bio: getBio(row) || null,
  };
}

export async function GET() {
  const [profileRows, ambassadorRows, ambassadorLeadRows] = await Promise.all([
    safeRows("profiles"),
    safeRows("ambassadors"),
    safeRows("ambassador_leads"),
  ]);

  const activeProfiles = profileRows.filter(
    (row) => normalized(row.role) === "ambassador" && isActiveAmbassador(row),
  );

  const activeAmbassadors = ambassadorRows.filter(isActiveAmbassador);

  const activeAmbassadorLeads = ambassadorLeadRows.filter((row) => {
    const isAmbassador =
      normalized(row.role) === "ambassador" ||
      normalized(row.lead_type) === "ambassador" ||
      normalized(row.candidate_type) === "ambassador" ||
      normalized(row.pipeline_type) === "ambassador";

    return isAmbassador && isActiveAmbassador(row);
  });

  const mergedByKey = new Map<string, Row>();

  // Registry rows first so active Ambassador registry city/state wins.
  [...activeAmbassadorLeads, ...activeAmbassadors, ...activeProfiles].forEach(
    (row) => {
      const key = getMergeKey(row);
      const current = mergedByKey.get(key);

      mergedByKey.set(key, current ? mergeRows(current, row) : row);
    },
  );

  const ambassadors = Array.from(mergedByKey.values())
    .map(toPublicAmbassador)
    .filter((ambassador) => ambassador.id || ambassador.fullName)
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .slice(0, 12);

  return NextResponse.json({ ambassadors });
}
