"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ApplicationStatus = "approved" | "rejected" | "needs_review";

type PartnerApplication = {
  id: string;
  applicant_user_id: string | null;
  applicant_type: "local_partner" | "national_partner" | "affiliate" | "ambassador";
  business_name: string | null;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  social_url: string | null;
  business_type: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected" | "needs_review";
};

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isValidStatus(value: string): value is ApplicationStatus {
  return (
    value === "approved" ||
    value === "rejected" ||
    value === "needs_review"
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function randomCodeSegment() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function normalizePartnerType(application: PartnerApplication) {
  const type = (application.business_type || "").toLowerCase();

  if (application.applicant_type === "national_partner") {
    if (type.includes("insurance")) return "insurance";
    if (type.includes("wellness")) return "pet_wellness";
    if (type.includes("food") || type.includes("supplies")) {
      return "pet_food_supplies";
    }
    if (type.includes("tech")) return "pet_tech";
    if (type.includes("pharmacy")) return "pet_pharmacy";
    if (type.includes("lifestyle")) return "lifestyle_brand";
    if (type.includes("travel")) return "pet_travel";
    if (type.includes("safety")) return "pet_safety";

    return "national_partner";
  }

  if (application.applicant_type === "affiliate") {
    return "other";
  }

  if (type.includes("pet store")) return "pet_store";
  if (type.includes("groom")) return "groomer";
  if (type.includes("train")) return "trainer";
  if (type.includes("rescue")) return "rescue";
  if (type.includes("vet")) return "vet";
  if (type.includes("apartment")) return "apartment";
  if (type.includes("daycare")) return "dog_daycare";
  if (type.includes("photographer")) return "pet_photographer";
  if (type.includes("event")) return "pet_event_organizer";

  return "local_partner";
}

function normalizeAmbassadorType(application: PartnerApplication) {
  const type = (application.business_type || "").toLowerCase();

  if (type.includes("local partner")) return "local_partner_ambassador";
  if (type.includes("city captain")) return "city_captain_interest";
  if (type.includes("campus")) return "campus_ambassador";
  if (type.includes("neighborhood")) return "neighborhood_ambassador";
  if (type.includes("event")) return "pet_event_ambassador";
  if (type.includes("rescue")) return "rescue_ambassador";
  if (type.includes("other")) return "other";

  return "community_ambassador";
}

function referralOwnerType(application: PartnerApplication) {
  if (application.applicant_type === "ambassador") return "ambassador";
  if (application.applicant_type === "affiliate") return "affiliate";
  return "partner";
}

function referralCampaignType(application: PartnerApplication) {
  if (application.applicant_type === "ambassador") return "ambassador";
  if (application.applicant_type === "affiliate") return "affiliate";
  return "partner_referral";
}

function buildBaseName(application: PartnerApplication) {
  return (
    application.business_name ||
    application.contact_name ||
    application.email.split("@")[0] ||
    "sitguru-partner"
  );
}

async function makeUniqueSlug(
  supabase: SupabaseServerClient,
  baseName: string
) {
  const baseSlug = slugify(baseName) || "sitguru-partner";

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug =
      attempt === 0
        ? baseSlug
        : `${baseSlug}-${randomCodeSegment().toLowerCase()}`;

    const { data: partnerMatch } = await supabase
      .from("partners")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    const { data: codeMatch } = await supabase
      .from("referral_codes")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!partnerMatch && !codeMatch) {
      return slug;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

async function makeUniqueReferralCode(
  supabase: SupabaseServerClient,
  baseName: string
) {
  const base = slugify(baseName)
    .replace(/-/g, "")
    .slice(0, 10)
    .toUpperCase();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `${base || "SITGURU"}${randomCodeSegment()}`;

    const { data } = await supabase
      .from("referral_codes")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (!data) {
      return code;
    }
  }

  return `SITGURU${Date.now()}`;
}

async function createApprovedPartnerRecord({
  supabase,
  application,
  adminUserId,
}: {
  supabase: SupabaseServerClient;
  application: PartnerApplication;
  adminUserId: string;
}) {
  const { data: existingPartner } = await supabase
    .from("partners")
    .select("id, referral_code, slug")
    .eq("application_id", application.id)
    .maybeSingle();

  if (existingPartner) {
    return {
      partnerId: existingPartner.id as string,
      referralCode: existingPartner.referral_code as string,
      slug: existingPartner.slug as string,
    };
  }

  const baseName = buildBaseName(application);
  const slug = await makeUniqueSlug(supabase, baseName);
  const referralCode = await makeUniqueReferralCode(supabase, baseName);

  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .insert({
      application_id: application.id,
      owner_user_id: application.applicant_user_id,
      partner_type: normalizePartnerType(application),
      business_name: application.business_name || application.contact_name,
      contact_name: application.contact_name,
      email: application.email,
      phone: application.phone,
      website: application.website,
      social_url: application.social_url,
      business_type: application.business_type,
      city: application.city,
      state: application.state,
      zip_code: application.zip_code,
      slug,
      referral_code: referralCode,
      commission_type:
        normalizePartnerType(application) === "rescue" ? "donation" : "fixed",
      status: "active",
      approved_by: adminUserId,
      approved_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (partnerError || !partner) {
    throw new Error(partnerError?.message || "Could not create partner record.");
  }

  const { error: referralError } = await supabase.from("referral_codes").insert({
    owner_user_id: application.applicant_user_id,
    owner_type: referralOwnerType(application),
    partner_id: partner.id,
    code: referralCode,
    slug,
    campaign_type: referralCampaignType(application),
    status: "active",
  });

  if (referralError) {
    throw new Error(referralError.message);
  }

  return {
    partnerId: partner.id as string,
    referralCode,
    slug,
  };
}

async function createApprovedAmbassadorRecord({
  supabase,
  application,
  adminUserId,
}: {
  supabase: SupabaseServerClient;
  application: PartnerApplication;
  adminUserId: string;
}) {
  const { data: existingAmbassador } = await supabase
    .from("ambassadors")
    .select("id, referral_code")
    .eq("application_id", application.id)
    .maybeSingle();

  if (existingAmbassador) {
    return {
      ambassadorId: existingAmbassador.id as string,
      referralCode: existingAmbassador.referral_code as string,
    };
  }

  const baseName = buildBaseName(application);
  const slug = await makeUniqueSlug(supabase, baseName);
  const referralCode = await makeUniqueReferralCode(supabase, baseName);

  const customerReferralUrl = `/r/${slug}`;
  const guruReferralUrl = `/g/${slug}`;
  const partnerReferralUrl = `/p/${slug}`;

  const { data: ambassador, error: ambassadorError } = await supabase
    .from("ambassadors")
    .insert({
      user_id: application.applicant_user_id,
      application_id: application.id,
      display_name: application.contact_name,
      email: application.email,
      phone: application.phone,
      city: application.city,
      state: application.state,
      zip_code: application.zip_code,
      territory: [application.city, application.state].filter(Boolean).join(", "),
      ambassador_type: normalizeAmbassadorType(application),
      tier: "bronze",
      points: 0,
      referral_code: referralCode,
      customer_referral_url: customerReferralUrl,
      guru_referral_url: guruReferralUrl,
      partner_referral_url: partnerReferralUrl,
      status: "active",
      approved_by: adminUserId,
      approved_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (ambassadorError || !ambassador) {
    throw new Error(
      ambassadorError?.message || "Could not create ambassador record."
    );
  }

  const { error: referralError } = await supabase.from("referral_codes").insert({
    owner_user_id: application.applicant_user_id,
    owner_type: "ambassador",
    ambassador_id: ambassador.id,
    code: referralCode,
    slug,
    campaign_type: "ambassador",
    status: "active",
  });

  if (referralError) {
    throw new Error(referralError.message);
  }

  return {
    ambassadorId: ambassador.id as string,
    referralCode,
  };
}

export async function updatePartnerApplicationStatus(formData: FormData) {
  const applicationId = cleanText(formData.get("application_id"));
  const status = cleanText(formData.get("status"));
  const adminNotes = cleanText(formData.get("admin_notes"));

  if (!applicationId) {
    throw new Error("Missing application ID.");
  }

  if (!isValidStatus(status)) {
    throw new Error("Invalid application status.");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in as Admin to update applications.");
  }

  const { data: applicationData, error: applicationError } = await supabase
    .from("partner_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (applicationError || !applicationData) {
    throw new Error(
      applicationError?.message || "Could not load application for review."
    );
  }

  const application = applicationData as PartnerApplication;

  let updatedNotes = adminNotes || null;

  if (status === "approved") {
    if (application.applicant_type === "ambassador") {
      const created = await createApprovedAmbassadorRecord({
        supabase,
        application,
        adminUserId: user.id,
      });

      updatedNotes = [
        adminNotes,
        `Approved as Ambassador. Referral code: ${created.referralCode}.`,
      ]
        .filter(Boolean)
        .join("\n\n");
    } else {
      const created = await createApprovedPartnerRecord({
        supabase,
        application,
        adminUserId: user.id,
      });

      updatedNotes = [
        adminNotes,
        `Approved as Partner/Affiliate. Referral code: ${created.referralCode}. Partner slug: ${created.slug}.`,
      ]
        .filter(Boolean)
        .join("\n\n");
    }
  }

  const { error } = await supabase
    .from("partner_applications")
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      admin_notes: updatedNotes,
    })
    .eq("id", applicationId);

  if (error) {
    console.error("Partner application status update error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/partners");
  revalidatePath("/admin/partners/applications");
  revalidatePath(`/admin/partners/applications/${applicationId}`);
  revalidatePath("/admin/partners/active");
  revalidatePath("/admin/partners/ambassadors");
  revalidatePath("/admin/partners/affiliates");

  redirect(`/admin/partners/applications/${applicationId}`);
}