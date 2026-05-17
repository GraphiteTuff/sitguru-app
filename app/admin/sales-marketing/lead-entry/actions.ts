"use server";

import { redirect } from "next/navigation";

import { supabaseAdmin } from "@/lib/supabase/admin";

type EntryKind = "signup_lead" | "outreach_contact" | "referral";

type PetEntry = {
  pet_order: number;
  pet_name: string | null;
  pet_type: string | null;
  pet_breed: string | null;
  pet_birthday_month: string | null;
  pet_birthday_year: string | null;
  pet_notes: string | null;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function normalizeDate(value: string) {
  return value.length > 0 ? value : null;
}

function getFullName(firstName: string, lastName: string, fallback: string) {
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || fallback || null;
}

function getPetEntries(formData: FormData): PetEntry[] {
  return [1, 2, 3]
    .map((index) => {
      const petName = getString(formData, `pet_${index}_name`);
      const petType = getString(formData, `pet_${index}_type`);
      const petBreed = getString(formData, `pet_${index}_breed`);
      const petBirthdayMonth = getString(formData, `pet_${index}_birthday_month`);
      const petBirthdayYear = getString(formData, `pet_${index}_birthday_year`);
      const petNotes = getString(formData, `pet_${index}_notes`);

      const hasAnyPetInfo =
        petName ||
        petType ||
        petBreed ||
        petBirthdayMonth ||
        petBirthdayYear ||
        petNotes;

      if (!hasAnyPetInfo) {
        return null;
      }

      return {
        pet_order: index,
        pet_name: petName || null,
        pet_type: petType || null,
        pet_breed: petBreed || null,
        pet_birthday_month: petBirthdayMonth || null,
        pet_birthday_year: petBirthdayYear || null,
        pet_notes: petNotes || null,
      };
    })
    .filter((pet): pet is PetEntry => Boolean(pet));
}

function getSignupLinkForLeadType(leadType: string, relationshipCategory: string) {
  const normalized = `${leadType} ${relationshipCategory}`.toLowerCase();

  if (normalized.includes("guru")) {
    return "https://www.sitguru.com/guru/signup";
  }

  if (normalized.includes("ambassador")) {
    return "https://www.sitguru.com/ambassadors";
  }

  if (normalized.includes("partner")) {
    return "https://www.sitguru.com/partners";
  }

  if (normalized.includes("program")) {
    return "https://www.sitguru.com/programs";
  }

  return "https://www.sitguru.com/signup";
}

function getThankYouMessage({
  firstName,
  leadType,
  relationshipCategory,
  signupLink,
}: {
  firstName: string;
  leadType: string;
  relationshipCategory: string;
  signupLink: string;
}) {
  const displayName = firstName || "there";
  const normalized = `${leadType} ${relationshipCategory}`.toLowerCase();

  if (normalized.includes("guru")) {
    return `Hi ${displayName}, thank you for your interest in becoming a SitGuru Guru. Your next step is to start your Guru application, complete your profile, choose your services, and complete SitGuru’s Trust & Safety steps before becoming bookable. Start here: ${signupLink}. Questions? Visit SitGuru.com or call (855) 474-8738.`;
  }

  if (normalized.includes("ambassador")) {
    return `Hi ${displayName}, thank you for your interest in the SitGuru Ambassador Program. Ambassadors help introduce Pet Parents, Gurus, and local pet-care professionals to SitGuru. Start here: ${signupLink}. Questions? Visit SitGuru.com or call (855) 474-8738.`;
  }

  if (normalized.includes("partner")) {
    return `Hi ${displayName}, thank you for connecting with SitGuru. We are excited to explore ways to grow trusted local pet care together. A SitGuru team member will follow up soon. Learn more at ${signupLink}. Questions? Visit SitGuru.com or call (855) 474-8738.`;
  }

  return `Hi ${displayName}, thank you for your interest in SitGuru. SitGuru helps Pet Parents find trusted local care for their pets, including pet sitting, dog walking, drop-ins, and overnight support. Create your free account here: ${signupLink}. Questions? Visit SitGuru.com or call (855) 474-8738.`;
}

export async function createLeadEntry(formData: FormData) {
  const entryKind = getString(formData, "entry_kind") as EntryKind;

  const firstName = getString(formData, "first_name");
  const lastName = getString(formData, "last_name");
  const contactName = getString(formData, "contact_name");
  const fullName = getFullName(firstName, lastName, contactName);

  const email = getString(formData, "email");
  const phone = getString(formData, "phone");
  const businessName = getString(formData, "business_name");
  const websiteUrl = getString(formData, "website_url");
  const socialHandle = getString(formData, "social_handle");

  const zipCode = getString(formData, "zip_code");
  const city = getString(formData, "city");
  const state = getString(formData, "state");
  const marketArea =
    getString(formData, "market_area") ||
    [city, state].filter(Boolean).join(", ") ||
    "Local launch market";

  const relationshipCategory = getString(formData, "relationship_category");
  const leadType = getString(formData, "lead_type");
  const ambassadorType = getString(formData, "ambassador_type");
  const partnerCategory = getString(formData, "partner_category");
  const growthChannel = getString(formData, "growth_channel");
  const interestedAs = getString(formData, "interested_as");
  const programInterest = getString(formData, "program_interest");
  const referralFocus = getString(formData, "referral_focus");
  const campaignSource = getString(formData, "campaign_source");

  const status = getString(formData, "status") || "New";
  const priorityLevel = getString(formData, "priority_level") || "Medium";
  const referralPotential = getString(formData, "referral_potential") || "Medium";
  const ceoPriority = getBoolean(formData, "ceo_priority");

  const nextFollowUp = normalizeDate(getString(formData, "next_follow_up"));
  const nextAction = getString(formData, "next_action");
  const outcomeGoal = getString(formData, "outcome_goal");
  const notes = getString(formData, "notes");
  const ceoNotes = getString(formData, "ceo_notes");
  const ceoHelp = getString(formData, "ceo_help");

  const ownerName = getString(formData, "owner_name") || "Danette";
  const createdByName = getString(formData, "created_by_name") || "Jason";
  const createdByEmail = getString(formData, "created_by_email") || "jason@sitguru.com";

  const sendThankYouEmail = getBoolean(formData, "send_thank_you_email");
  const prepareSmsMessage = getBoolean(formData, "prepare_sms_message");
  const messageType = getString(formData, "message_type") || leadType || relationshipCategory;
  const signupLink = getSignupLinkForLeadType(leadType || messageType, relationshipCategory);
  const thankYouMessage = getThankYouMessage({
    firstName,
    leadType: leadType || messageType,
    relationshipCategory,
    signupLink,
  });

  const petEntries = getPetEntries(formData);

  const referredFirstName = getString(formData, "referred_first_name");
  const referredLastName = getString(formData, "referred_last_name");
  const referredFullName = getFullName(
    referredFirstName,
    referredLastName,
    getString(formData, "referred_full_name"),
  );
  const referredEmail = getString(formData, "referred_email");
  const referredPhone = getString(formData, "referred_phone");
  const referredType = getString(formData, "referred_type") || "Pet Parent";

  const referrerName = getString(formData, "referrer_name") || fullName || "";
  const referrerEmail = getString(formData, "referrer_email") || email;
  const referrerPhone = getString(formData, "referrer_phone") || phone;
  const referrerType = getString(formData, "referrer_type") || relationshipCategory;
  const referrerRelationship = getString(formData, "referrer_relationship");

  if (entryKind === "referral") {
    const { error } = await supabaseAdmin.from("admin_marketing_referrals").insert({
      referral_status: status,
      referrer_name: referrerName || null,
      referrer_email: referrerEmail || null,
      referrer_phone: referrerPhone || null,
      referrer_type: referrerType || null,
      referrer_relationship: referrerRelationship || null,
      referred_first_name: referredFirstName || null,
      referred_last_name: referredLastName || null,
      referred_full_name: referredFullName,
      referred_email: referredEmail || null,
      referred_phone: referredPhone || null,
      referred_type: referredType,
      zip_code: zipCode || null,
      city: city || null,
      state: state || null,
      market_area: marketArea || null,
      campaign_source: campaignSource || null,
      growth_channel: growthChannel || null,
      program_interest: programInterest || null,
      referral_focus: referralFocus || null,
      reward_eligible: false,
      reward_type: `${referredType} Referral`,
      reward_status: "Not Eligible Yet",
      priority_level: priorityLevel,
      ceo_priority: ceoPriority,
      next_follow_up: nextFollowUp,
      next_action: nextAction || null,
      outcome_goal: outcomeGoal || null,
      notes: notes || null,
      ceo_notes:
        [
          ceoNotes,
          sendThankYouEmail ? "Thank-you email requested for referral workflow." : "",
          prepareSmsMessage ? `SMS-ready message prepared: ${thankYouMessage}` : "",
        ]
          .filter(Boolean)
          .join("\n\n") || null,
      owner_name: ownerName,
      created_by_name: createdByName,
      created_by_email: createdByEmail,
    });

    if (error) {
      throw new Error(`Unable to save referral: ${error.message}`);
    }

    redirect("/admin/sales-marketing/lead-entry?saved=referral");
  }

  if (entryKind === "outreach_contact") {
    const { error } = await supabaseAdmin
      .from("admin_marketing_outreach_contacts")
      .insert({
        contact_name: fullName || contactName || "Unnamed contact",
        business_name: businessName || "No business / organization entered",
        partner_type: getString(formData, "partner_type") || "Other",
        city_state: [city, state].filter(Boolean).join(", ") || marketArea,
        contact_method: getString(formData, "contact_method") || null,
        status,
        referral_potential: referralPotential,
        last_contacted: normalizeDate(getString(formData, "last_contacted")),
        next_follow_up: nextFollowUp,
        notes:
          [
            notes,
            email ? `Email: ${email}` : "",
            phone ? `Phone: ${phone}` : "",
            sendThankYouEmail ? "Thank-you email requested after outreach capture." : "",
            prepareSmsMessage ? `SMS-ready message prepared: ${thankYouMessage}` : "",
          ]
            .filter(Boolean)
            .join("\n\n") || null,
        ceo_help: ceoHelp || ceoNotes || null,
        owner_name: ownerName,
        relationship_category: relationshipCategory || null,
        ambassador_type: ambassadorType || null,
        partner_category: partnerCategory || null,
        growth_channel: growthChannel || null,
        interested_as: interestedAs || null,
        program_interest: programInterest || null,
        referral_focus: referralFocus || null,
        campaign_source: campaignSource || null,
        market_area: marketArea || null,
        social_handle: socialHandle || null,
        website_url: websiteUrl || null,
        priority_level: priorityLevel,
        ceo_priority: ceoPriority,
        outcome_goal: outcomeGoal || null,
        next_action: nextAction || null,
      });

    if (error) {
      throw new Error(`Unable to save outreach contact: ${error.message}`);
    }

    redirect("/admin/sales-marketing/lead-entry?saved=outreach");
  }

  const { data: signupLead, error } = await supabaseAdmin
    .from("admin_marketing_signup_leads")
    .insert({
      lead_type: leadType || relationshipCategory || "General Contact",
      lead_status: status,
      first_name: firstName || null,
      last_name: lastName || null,
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      zip_code: zipCode || null,
      city: city || null,
      state: state || null,
      market_area: marketArea || null,
      business_name: businessName || null,
      website_url: websiteUrl || null,
      social_handle: socialHandle || null,
      relationship_category: relationshipCategory || null,
      ambassador_type: ambassadorType || null,
      partner_category: partnerCategory || null,
      growth_channel: growthChannel || null,
      interested_as: interestedAs || null,
      program_interest: programInterest || null,
      referral_focus: referralFocus || null,
      campaign_source: campaignSource || null,
      source_contact_name: referrerName || null,
      referral_source_name: referrerName || null,
      referral_source_type: referrerType || null,
      pet_parent_interest: getBoolean(formData, "pet_parent_interest"),
      guru_interest: getBoolean(formData, "guru_interest"),
      ambassador_interest: getBoolean(formData, "ambassador_interest"),
      partner_interest: getBoolean(formData, "partner_interest"),
      program_interest_flag: getBoolean(formData, "program_interest_flag"),
      signup_invite_status: sendThankYouEmail
        ? "Email Ready / Not Sent"
        : prepareSmsMessage
          ? "SMS Ready / Not Sent"
          : "Not Sent",
      signup_link: signupLink,
      signup_link_sent_at: null,
      priority_level: priorityLevel,
      referral_potential: referralPotential,
      ceo_priority: ceoPriority,
      next_follow_up: nextFollowUp,
      next_action: nextAction || null,
      outcome_goal: outcomeGoal || null,
      notes:
        [
          notes,
          sendThankYouEmail ? `Email-ready thank-you message: ${thankYouMessage}` : "",
          prepareSmsMessage ? `SMS-ready thank-you message: ${thankYouMessage}` : "",
        ]
          .filter(Boolean)
          .join("\n\n") || null,
      ceo_notes: ceoNotes || null,
      owner_name: ownerName,
      created_by_name: createdByName,
      created_by_email: createdByEmail,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Unable to save signup lead: ${error.message}`);
  }

  if (signupLead?.id && petEntries.length > 0) {
    const petRows = petEntries.map((pet) => ({
      signup_lead_id: signupLead.id,
      ...pet,
      created_by_name: createdByName,
      created_by_email: createdByEmail,
    }));

    const { error: petError } = await supabaseAdmin
      .from("admin_marketing_signup_lead_pets")
      .insert(petRows);

    if (petError) {
      throw new Error(`Lead saved, but pet details could not be saved: ${petError.message}`);
    }
  }

  redirect("/admin/sales-marketing/lead-entry?saved=signup");
}