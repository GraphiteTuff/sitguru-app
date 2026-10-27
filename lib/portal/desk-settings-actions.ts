"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { findInternByAccount } from "@/lib/internship/queries";
import { uploadInternshipAsset } from "@/lib/internship/storage";

function safeReturn(value: FormDataEntryValue | null) {
  return value === "/intern/settings" ? "/intern/settings" : "/manager/settings";
}

export async function saveDeskProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const back = safeReturn(formData.get("returnTo"));
  const fullName = String(formData.get("fullName") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  if (!fullName) redirect(`${back}?error=Add the name that should appear on SitGuru.`);

  await supabaseAdmin.from("profiles").update({ full_name: fullName }).eq("id", user.id);
  const intern = await findInternByAccount({ userId: user.id, email: user.email });
  if (intern?.id) {
    await supabaseAdmin
      .from("internship_interns")
      .update({
        full_name: fullName,
        preferred_name: fullName.split(/\s+/)[0] || fullName,
        bio,
        updated_at: new Date().toISOString(),
      })
      .eq("id", intern.id);
  }
  redirect(`${back}?ok=Profile saved`);
}

export async function saveDeskPreferences(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const back = safeReturn(formData.get("returnTo"));
  const desk_settings = {
    mentions: formData.get("mentions") === "on",
    assignments: formData.get("assignments") === "on",
    checkins: formData.get("checkins") === "on",
    events: formData.get("events") === "on",
    marketing: formData.get("marketing") === "on",
    product: formData.get("product") === "on",
    landing: String(formData.get("landing") || ""),
    timezone: String(formData.get("timezone") || "America/New_York"),
    emailFrequency: String(formData.get("emailFrequency") || "weekly"),
    dateFormat: String(formData.get("dateFormat") || "MDY"),
    appearance: String(formData.get("appearance") || "light"),
    profileVisibility: String(formData.get("profileVisibility") || "team"),
    activityVisibility: String(formData.get("activityVisibility") || "team"),
    analyticsInReports: formData.get("analyticsInReports") === "on",
    mfaRequested: formData.get("mfaRequested") === "on",
  };
  const { error } = await supabase.auth.updateUser({ data: { desk_settings } });
  if (error) redirect(`${back}?error=${encodeURIComponent(error.message)}`);
  redirect(`${back}?ok=Preferences saved`);
}

export async function saveInternSchoolLogo(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/intern/login?next=/intern/settings");
  const intern = await findInternByAccount({ userId: user.id, email: user.email });
  if (!intern?.universityId) {
    redirect("/intern/settings?error=Your school is not on file yet, so a logo cannot be saved.");
  }
  const file = formData.get("logo");
  if (!file || typeof file === "string" || file.size <= 0) {
    redirect("/intern/settings?error=Choose a school logo image to upload.");
  }
  const uploaded = await uploadInternshipAsset({
    file,
    pathPrefix: `universities/${intern.universityId}/logo`,
  });
  if (uploaded.error) redirect(`/intern/settings?error=${encodeURIComponent(uploaded.error)}`);
  const { error } = await supabaseAdmin
    .from("internship_universities")
    .update({
      logo_url: uploaded.url,
      logo_storage_path: uploaded.path,
      logo_permission_granted: true,
      logo_permission_notes: "Uploaded by the intern for the portal sidebar.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", intern.universityId);
  if (error) redirect(`/intern/settings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/intern", "layout");
  redirect("/intern/settings?ok=School logo saved. It now shows under Settings.");
}
