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
  referralType?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referredName?: string;
};

type ReferralTrackInput = {
  supabaseAdmin: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabaseAdmin"];
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

  return "signed_up";
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

export async function POST(request: Request) {
  try {
    const { supabaseAdmin, user } = await requireAuthenticatedUser(request);

    const payload = (await request
      .json()
      .catch(() => ({}))) as SignupCapturePayload;

    const cleanReferralCode = String(payload.referralCode || "").trim();

    if (!cleanReferralCode) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "No PetPerks referral code was provided.",
      });
    }

    const signupSelection = normalizePetPerksSignupSelection(
      payload.referralType,
    );
    const referralTracks = getReferralTracks(signupSelection);

    const referredName = String(payload.referredName || "").trim() || null;
    const source = String(payload.source || payload.utmSource || "direct").trim();
    const utmSource = String(
      payload.utmSource || payload.source || source,
    ).trim();
    const utmMedium = String(payload.utmMedium || "signup").trim();
    const utmCampaign = String(
      payload.utmCampaign || "sitguru_petperks",
    ).trim();

    const results = [];

    for (const referralType of referralTracks) {
      const result = await upsertPetPerksReferralTrack({
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

      results.push(result);
    }

    return NextResponse.json({
      ok: true,
      signupSelection,
      tracksCreated: results.length,
      referrals: results,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to capture PetPerks signup.";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}