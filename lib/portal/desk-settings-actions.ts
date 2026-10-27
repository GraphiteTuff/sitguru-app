"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { findInternByAccount } from "@/lib/internship/queries";

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
