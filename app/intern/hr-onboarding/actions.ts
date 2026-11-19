"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const FORM_URL = "/intern/hr-onboarding";

function formText(data: FormData, key: string, max: number) {
  return String(data.get(key) || "").trim().slice(0, max);
}

function errorRedirect(message: string): never {
  redirect(FORM_URL + "?error=" + encodeURIComponent(message));
}

/** Store the signed-in paid intern's personal profile only. No IDs are accepted from the form. */
export async function saveStaffPersonalProfile(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/intern/login?next=/intern/hr-onboarding");
  }

  const [internResult, engagementResult] = await Promise.all([
    supabaseAdmin.from("internship_interns")
      .select("id,status,portal_enabled")
      .eq("user_id", user.id)
      .eq("portal_enabled", true)
      .limit(1).maybeSingle(),
    supabaseAdmin.from("staff_engagements")
      .select("id,status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1).maybeSingle(),
  ]);
  if (internResult.error || engagementResult.error ||
      !internResult.data || !engagementResult.data ||
      !["active", "approved", "accepted"].includes(String(internResult.data.status))) {
    errorRedirect("This form is available only to an authorized paid intern.");
  }

  const legalName = formText(formData, "legalName", 120);
  const preferredName = formText(formData, "preferredName", 100);
  const phone = formText(formData, "phone", 40);
  const address1 = formText(formData, "address1", 180);
  const address2 = formText(formData, "address2", 180);
  const city = formText(formData, "city", 90);
  const state = formText(formData, "state", 2).toUpperCase();
  const zip = formText(formData, "zip", 10);
  const workState = formText(formData, "workState", 2).toUpperCase();
  const emergencyName = formText(formData, "emergencyName", 120);
  const emergencyPhone = formText(formData, "emergencyPhone", 40);
  const emergencyRelationship = formText(formData, "emergencyRelationship", 80);

  if (legalName.length < 3 || phone.replace(/\D/g, "").length < 10 ||
      !address1 || !city || !/^[A-Z]{2}$/.test(state) ||
      !/^\d{5}(-\d{4})?$/.test(zip) || !/^[A-Z]{2}$/.test(workState)) {
    errorRedirect("Please complete your legal name, phone, mailing address, ZIP code and work state.");
  }
  if (emergencyName && emergencyPhone.replace(/\D/g, "").length < 10) {
    errorRedirect("Please provide a valid emergency contact phone or leave the optional contact blank.");
  }
  if (formData.get("confirm") !== "yes") {
    errorRedirect("Please confirm that your information is current.");
  }

  const now = new Date().toISOString();
  const { error: saveError } = await supabaseAdmin
    .from("staff_personal_profiles")
    .upsert({
      user_id: user.id,
      legal_name: legalName,
      preferred_name: preferredName,
      contact_email: String(user.email || "").slice(0, 200),
      phone,
      address_line1: address1,
      address_line2: address2,
      city,
      state,
      postal_code: zip,
      primary_work_state: workState,
      emergency_contact_name: emergencyName,
      emergency_contact_phone: emergencyName ? emergencyPhone : "",
      emergency_contact_relationship: emergencyName ? emergencyRelationship : "",
      submitted_at: now,
      updated_at: now,
    }, { onConflict: "user_id" });

  if (saveError) {
    console.error("[hr-profile] secure profile save failed", saveError.code);
    errorRedirect("Your information could not be saved. Please try again or contact SitGuru support.");
  }

  revalidatePath(FORM_URL);
  revalidatePath("/admin/hr/onboarding");
  redirect(FORM_URL + "?ok=" + encodeURIComponent("Your personal profile sheet was saved securely."));
}
