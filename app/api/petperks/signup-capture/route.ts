import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/supabase/admin";

type PetPerksReferralType = "pet_parent" | "guru" | "ambassador" | "community";

type PetPerksSignupSelection =
  | PetPerksReferralType
  | "both"
  | "customer"
  | "future_guru"
  | "future-guru"
  | "pet-parent"
  | "pet_parent";

type SignupCapturePayload = {
  referralCode?: string;
  ambassadorCode?: string;
  ambassadorReferralCode?: string;
  referralType?: string;
  role?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referredName?: string;
  phone?: string;
  city?: string;
  state?: string;
  county?: string;
  country?: string;
};

type AuthenticatedSupabase = Awaited<
  ReturnType<typeof requireAuthenticatedUser>
>["supabaseAdmin"];

type ReferralTrackInput = {
  supabaseAdmin: AuthenticatedSupabase;
  userId: string;
  userEmail: string | null;
  cleanReferralCode: string;
  referralType: PetPerksReferralType;
  referredName: string | null;
  source: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
};

type AmbassadorReferralTrackInput = ReferralTrackInput & {
  phone: string | null;
  city: string | null;
  state: string | null;
  county: string | null;
  country: string | null;
};

function normalizeReferralCode(value: string | undefined | null) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

function normalizePetPerksSignupSelection(
  value: string | undefined,
): PetPerksSignupSelection {
  const normalized = value?.trim().toLowerCase() || "";

  if (
    normalized === "both" ||
    normalized === "pet-parent-and-guru" ||
    normalized === "pet_parent_and_guru" ||
    normalized === "customer-guru" ||
    normalized === "customer_guru"
  ) {
    return "both";
  }

  if (
    normalized === "customer" ||
    normalized === "pet-parent" ||
    normalized === "pet_parent" ||
    normalized === "parent"
  ) {
    return "pet_parent";
  }

  if (
    normalized === "guru" ||
    normalized === "future-guru" ||
    normalized === "future_guru" ||
    normalized === "provider" ||
    normalized === "sitter"
  ) {
    return "guru";
  }

  if (normalized === "ambassador") {
    return "ambassador";
  }

  return "community";
}

function getReferralTracks(
  signupSelection: PetPerksSignupSelection,
): PetPerksReferralType[] {
  if (signupSelection === "both") {
    return ["pet_parent", "guru"];
  }

  if (
    signupSelection === "customer" ||
    signupSelection === "pet-parent" ||
    signupSelection === "pet_parent"
  ) {
    return ["pet_parent"];
  }

  if (
    signupSelection === "future_guru" ||
    signupSelection === "future-guru" ||
    signupSelection === "guru"
  ) {
    return ["guru"];
  }

  if (signupSelection === "ambassador") {
    return ["ambassador"];
  }

  return ["community"];
}

function getInitialPetPerksStatus(referralType: PetPerksReferralType) {
  if (referralType === "guru") {
    return "pending_guru_approval";
  }

  if (referralType === "pet_parent") {
    return "pending_first_booking";
  }

  if (referralType === "ambassador") {
    return "ambassador_signup_captured";
  }

  return "signed_up";
}

function getInitialAmbassadorReferralStatus(referralType: PetPerksReferralType) {
  if (referralType === "guru") {
    return "pending_guru_approval";
  }

  if (referralType === "pet_parent") {
    return "signed_up";
  }

  if (referralType === "ambassador") {
    return "signed_up";
  }

  return "captured";
}

function getInitialAmbassadorBookingStatus(referralType: PetPerksReferralType) {
  if (referralType === "pet_parent") {
    return "booking_needed";
  }

  if (referralType === "guru") {
    return "profile_started";
  }

  return "not_required";
}

function getSignupRule(referralType: PetPerksReferralType) {
  if (referralType === "guru") {
    return "guru_pending_approval_and_first_paid_booking";
  }

  if (referralType === "pet_parent") {
    return "pet_parent_pending_first_paid_booking";
  }

  if (referralType === "ambassador") {
    return "ambassador_signup_capture";
  }

  return "community_signup_capture";
}

async function findAmbassadorByReferralCode({
  supabaseAdmin,
  cleanReferralCode,
}: {
  supabaseAdmin: AuthenticatedSupabase;
  cleanReferralCode: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("ambassadors")
    .select("id, referral_code, full_name, display_name, email, status")
    .ilike("referral_code", cleanReferralCode)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data || null;
}

async function upsertPetPerksReferralTrack({
  supabaseAdmin,
  userId,
  userEmail,
  cleanReferralCode,
  referralType,
  referredName,
  source,
  utmSource,
  utmMedium,
  utmCampaign,
}: ReferralTrackInput) {
  const referralStatus = getInitialPetPerksStatus(referralType);
  const signedUpAt = new Date().toISOString();

  const { data: existingReferral, error: existingReferralError } =
    await supabaseAdmin
      .from("petperks_referrals")
      .select("id")
      .eq("referred_user_id", userId)
      .eq("referral_code", cleanReferralCode)
      .eq("referral_type", referralType)
      .maybeSingle();

  if (existingReferralError) {
    throw new Error(existingReferralError.message);
  }

  if (existingReferral?.id) {
    const { error: updateError } = await supabaseAdmin
      .from("petperks_referrals")
      .update({
        referral_status: referralStatus,
        referred_email: userEmail,
        referred_name: referredName,
        signed_up_at: signedUpAt,
        source,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        metadata: {
          capture_point: "signup_capture_api_existing_referral_update",
          signup_rule: getSignupRule(referralType),
          supports_both_signup: true,
          ambassador_compatible: true,
        },
      })
      .eq("id", existingReferral.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return {
      referralId: existingReferral.id,
      referralType,
      action: "updated" as const,
    };
  }

  const { data: insertedReferral, error: insertError } = await supabaseAdmin
    .from("petperks_referrals")
    .insert({
      referral_code: cleanReferralCode,
      referral_type: referralType,
      referral_status: referralStatus,
      referred_user_id: userId,
      referred_email: userEmail,
      referred_name: referredName,
      source,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      signed_up_at: signedUpAt,
      metadata: {
        capture_point: "signup_capture_api",
        signup_rule: getSignupRule(referralType),
        supports_both_signup: true,
        ambassador_compatible: true,
      },
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return {
    referralId: insertedReferral?.id || null,
    referralType,
    action: "inserted" as const,
  };
}

async function upsertAmbassadorReferralTrack({
  supabaseAdmin,
  userId,
  userEmail,
  cleanReferralCode,
  referralType,
  referredName,
  phone,
  city,
  state,
  county,
  country,
  source,
  utmSource,
  utmMedium,
  utmCampaign,
}: AmbassadorReferralTrackInput) {
  const ambassador = await findAmbassadorByReferralCode({
    supabaseAdmin,
    cleanReferralCode,
  });

  if (!ambassador?.id) {
    return {
      skipped: true as const,
      reason: "Referral code does not belong to an Ambassador.",
      referralType,
      ambassadorId: null,
      referralId: null,
    };
  }

  const signupDate = new Date().toISOString();
  const referralStatus = getInitialAmbassadorReferralStatus(referralType);
  const bookingStatus = getInitialAmbassadorBookingStatus(referralType);

  const { data: existingReferral, error: existingReferralError } =
    await supabaseAdmin
      .from("ambassador_referrals")
      .select("id")
      .eq("ambassador_id", ambassador.id)
      .eq("referred_user_id", userId)
      .eq("referral_type", referralType)
      .maybeSingle();

  if (existingReferralError) {
    throw new Error(existingReferralError.message);
  }

  const payload = {
    ambassador_id: ambassador.id,
    referral_code: cleanReferralCode,
    referral_type: referralType,
    referred_user_id: userId,
    display_name: referredName,
    email: userEmail,
    phone,
    city,
    state,
    county,
    country,
    status: referralStatus,
    booking_status: bookingStatus,
    signup_date: signupDate,
    updated_at: signupDate,
  };

  if (existingReferral?.id) {
    const { error: updateError } = await supabaseAdmin
      .from("ambassador_referrals")
      .update(payload)
      .eq("id", existingReferral.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return {
      skipped: false as const,
      action: "updated" as const,
      referralType,
      ambassadorId: ambassador.id,
      referralId: existingReferral.id,
    };
  }

  const { data: insertedReferral, error: insertError } = await supabaseAdmin
    .from("ambassador_referrals")
    .insert({
      ...payload,
      created_at: signupDate,
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  await supabaseAdmin.from("ambassador_activity_log").insert({
    ambassador_id: ambassador.id,
    activity_type: "referral_signup_capture",
    activity_title: `New ${referralType.replace("_", " ")} referral captured`,
    activity_notes: [
      `${referredName || userEmail || "A new user"} signed up using ${
        ambassador.referral_code || cleanReferralCode
      }.`,
      `Source: ${source}.`,
      `UTM: ${utmSource} / ${utmMedium} / ${utmCampaign}.`,
    ].join(" "),
  });

  return {
    skipped: false as const,
    action: "inserted" as const,
    referralType,
    ambassadorId: ambassador.id,
    referralId: insertedReferral?.id || null,
  };
}

async function updateUserReferralMetadata({
  supabaseAdmin,
  userId,
  cleanReferralCode,
  signupSelection,
  source,
  utmSource,
  utmMedium,
  utmCampaign,
}: {
  supabaseAdmin: AuthenticatedSupabase;
  userId: string;
  cleanReferralCode: string;
  signupSelection: PetPerksSignupSelection;
  source: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
}) {
  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      ambassador_referral_code: cleanReferralCode,
      referral_code_used: cleanReferralCode,
      referral_source: source,
      referral_type: signupSelection,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      updated_at: now,
    })
    .eq("id", userId);

  if (error) {
    console.warn("Unable to update profile referral metadata:", error.message);
  }
}

export async function POST(request: Request) {
  try {
    const { supabaseAdmin, user } = await requireAuthenticatedUser(request);

    const payload = (await request
      .json()
      .catch(() => ({}))) as SignupCapturePayload;

    const cleanReferralCode = normalizeReferralCode(
      payload.ambassadorReferralCode ||
        payload.ambassadorCode ||
        payload.referralCode,
    );

    if (!cleanReferralCode) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "No referral code was provided.",
      });
    }

    const signupSelection = normalizePetPerksSignupSelection(
      payload.referralType || payload.role,
    );
    const referralTracks = getReferralTracks(signupSelection);

    const referredName = String(payload.referredName || "").trim() || null;
    const phone = String(payload.phone || "").trim() || null;
    const city = String(payload.city || "").trim() || null;
    const state = String(payload.state || "").trim() || null;
    const county = String(payload.county || "").trim() || null;
    const country = String(payload.country || "United States").trim() || null;

    const source = String(payload.source || payload.utmSource || "direct").trim();
    const utmSource = String(payload.utmSource || payload.source || source).trim();
    const utmMedium = String(payload.utmMedium || "signup").trim();
    const utmCampaign = String(
      payload.utmCampaign || "sitguru_referrals",
    ).trim();

    await updateUserReferralMetadata({
      supabaseAdmin,
      userId: user.id,
      cleanReferralCode,
      signupSelection,
      source,
      utmSource,
      utmMedium,
      utmCampaign,
    });

    const petPerksResults = [];
    const ambassadorResults = [];

    for (const referralType of referralTracks) {
      const petPerksResult = await upsertPetPerksReferralTrack({
        supabaseAdmin,
        userId: user.id,
        userEmail: user.email || null,
        cleanReferralCode,
        referralType,
        referredName,
        source,
        utmSource,
        utmMedium,
        utmCampaign,
      });

      petPerksResults.push(petPerksResult);

      const ambassadorResult = await upsertAmbassadorReferralTrack({
        supabaseAdmin,
        userId: user.id,
        userEmail: user.email || null,
        cleanReferralCode,
        referralType,
        referredName,
        phone,
        city,
        state,
        county,
        country,
        source,
        utmSource,
        utmMedium,
        utmCampaign,
      });

      ambassadorResults.push(ambassadorResult);
    }

    return NextResponse.json({
      ok: true,
      referralCode: cleanReferralCode,
      signupSelection,
      tracksCreated: petPerksResults.length,
      petPerksReferrals: petPerksResults,
      ambassadorReferrals: ambassadorResults,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to capture referral signup.";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}