import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ProfileRow = Record<string, unknown>;

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getFullName(profile: ProfileRow) {
  const firstName = asString(profile.first_name);
  const lastName = asString(profile.last_name);
  const combinedName = `${firstName} ${lastName}`.trim();

  return (
    asString(profile.full_name) ||
    asString(profile.display_name) ||
    asString(profile.name) ||
    combinedName ||
    "SitGuru Ambassador"
  );
}

function getPhotoUrl(profile: ProfileRow) {
  return (
    asString(profile.profile_photo_url) ||
    asString(profile.avatar_url) ||
    asString(profile.image_url) ||
    ""
  );
}

function getAmbassadorType(profile: ProfileRow) {
  return (
    asString(profile.ambassador_type) ||
    asString(profile.program_type) ||
    asString(profile.hire_type) ||
    asString(profile.community_type) ||
    "SitGuru Ambassador"
  );
}

function getReferralCode(profile: ProfileRow) {
  return (
    asString(profile.referral_code) ||
    asString(profile.ambassador_code) ||
    asString(profile.code) ||
    ""
  );
}

function isPublicAmbassador(profile: ProfileRow) {
  const accountStatus = asString(profile.account_status).toLowerCase();
  const status = asString(profile.status).toLowerCase();
  const approvalStatus = asString(profile.approval_status).toLowerCase();

  if (profile.is_public === false) return false;
  if (accountStatus === "deleted" || accountStatus === "suspended") return false;
  if (status === "deleted" || status === "suspended") return false;
  if (approvalStatus === "rejected") return false;

  return true;
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("role", "ambassador")
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(12);

  if (error) {
    console.error("Public Ambassador block load failed:", error);

    return NextResponse.json(
      { ambassadors: [], error: "Unable to load Ambassadors." },
      { status: 200 },
    );
  }

  const ambassadors = ((data || []) as ProfileRow[])
    .filter(isPublicAmbassador)
    .map((profile) => ({
      id: asString(profile.id),
      fullName: getFullName(profile),
      firstName: asString(profile.first_name) || null,
      lastName: asString(profile.last_name) || null,
      city: asString(profile.city) || null,
      state: asString(profile.state) || null,
      serviceCity: asString(profile.service_city) || null,
      serviceState: asString(profile.service_state) || null,
      photoUrl: getPhotoUrl(profile) || null,
      referralCode: getReferralCode(profile) || null,
      ambassadorType: getAmbassadorType(profile) || null,
      bio: asString(profile.bio) || null,
    }));

  return NextResponse.json({ ambassadors });
}
