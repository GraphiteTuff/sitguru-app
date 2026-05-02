"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type PartnerApplicantType =
  | "local_partner"
  | "national_partner"
  | "affiliate"
  | "ambassador";

export type PartnerApplicationState = {
  ok: boolean;
  message: string;
};

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeWebsite(value: string) {
  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

function isValidApplicantType(value: string): value is PartnerApplicantType {
  return (
    value === "local_partner" ||
    value === "national_partner" ||
    value === "affiliate" ||
    value === "ambassador"
  );
}

export async function submitPartnerApplication(
  _previousState: PartnerApplicationState,
  formData: FormData
): Promise<PartnerApplicationState> {
  const applicantType = cleanText(formData.get("applicant_type"));
  const businessName = cleanText(formData.get("business_name"));
  const contactName = cleanText(formData.get("contact_name"));
  const email = cleanText(formData.get("email")).toLowerCase();
  const phone = cleanText(formData.get("phone"));
  const website = normalizeWebsite(cleanText(formData.get("website")));
  const socialUrl = normalizeWebsite(cleanText(formData.get("social_url")));
  const businessType = cleanText(formData.get("business_type"));
  const city = cleanText(formData.get("city"));
  const state = cleanText(formData.get("state")).toUpperCase();
  const zipCode = cleanText(formData.get("zip_code"));
  const message = cleanText(formData.get("message"));

  if (!isValidApplicantType(applicantType)) {
    return {
      ok: false,
      message: "Please choose a valid application type.",
    };
  }

  if (!contactName) {
    return {
      ok: false,
      message: "Please enter your name.",
    };
  }

  if (!email || !email.includes("@")) {
    return {
      ok: false,
      message: "Please enter a valid email address.",
    };
  }

  if (!city) {
    return {
      ok: false,
      message: "Please enter your city.",
    };
  }

  if (
    (applicantType === "local_partner" ||
      applicantType === "national_partner") &&
    !businessName
  ) {
    return {
      ok: false,
      message: "Please enter your business or brand name.",
    };
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("partner_applications").insert({
    applicant_user_id: user?.id ?? null,
    applicant_type: applicantType,
    business_name: businessName || null,
    contact_name: contactName,
    email,
    phone: phone || null,
    website: website || null,
    social_url: socialUrl || null,
    business_type: businessType || null,
    city,
    state: state || null,
    zip_code: zipCode || null,
    message: message || null,
    status: "pending",
  });

  if (error) {
    console.error("Partner application submit error:", error);

    return {
      ok: false,
      message:
        "Something went wrong while submitting your application. Please try again.",
    };
  }

  revalidatePath("/partners");
  revalidatePath("/partners/local");
  revalidatePath("/partners/national");
  revalidatePath("/partners/affiliates");
  revalidatePath("/partners/ambassadors");

  return {
    ok: true,
    message:
      "Application submitted successfully. SitGuru Admin will review it soon.",
  };
}