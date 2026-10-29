"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { findInternByAccount } from "@/lib/internship/queries";
import { uploadInternshipAsset } from "@/lib/internship/storage";
import { petParentAvatarWritePayload } from "@/lib/pet-parent-avatar";
import { deskAvatarExtension, deskAvatarFileError } from "@/lib/portal/desk-avatar";

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

const AVATAR_BUCKETS = ["profile-photos", "avatars"] as const;
const AVATAR_COLUMNS = ["profile_photo_url", "photo_url", "avatar_url", "image_url"] as const;

function photoFile(value: FormDataEntryValue | null) {
  if (!value || typeof value === "string") return null;
  return value;
}

async function signedInUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function writeProfilePhoto(userId: string, url: string) {
  const payload = petParentAvatarWritePayload(url);
  const { data, error } = await supabaseAdmin.from("profiles").update(payload).eq("id", userId).select("id");
  if (!error && data?.length) return "";
  if (error) {
    let wrote = false;
    for (const column of AVATAR_COLUMNS) {
      const { error: columnError } = await supabaseAdmin.from("profiles").update({ [column]: url }).eq("id", userId);
      if (!columnError) wrote = true;
    }
    if (wrote) return "";
    return error.message;
  }
  const { error: insertError } = await supabaseAdmin.from("profiles").insert({ id: userId, ...payload });
  return insertError?.message || "";
}

async function clearProfilePhoto(userId: string) {
  const payload = petParentAvatarWritePayload("");
  const { error } = await supabaseAdmin.from("profiles").update(payload).eq("id", userId);
  if (!error) return;
  for (const column of AVATAR_COLUMNS) {
    await supabaseAdmin.from("profiles").update({ [column]: "" }).eq("id", userId);
  }
}

async function uploadDeskPhoto(file: File, userId: string) {
  const problem = deskAvatarFileError(file);
  if (problem) return { error: problem, url: "", bucket: "", path: "" };
  const ext = deskAvatarExtension(file);
  const path = `${userId}/desk-avatar-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type && file.type !== "image/jpg" ? file.type : "image/jpeg";
  let last = "Could not upload the profile photo.";
  for (const bucket of AVATAR_BUCKETS) {
    const { error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
      contentType: ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : contentType,
      upsert: false,
    });
    if (!error) {
      const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
      return { error: "", url: data.publicUrl, bucket, path };
    }
    last = error.message || last;
  }
  return { error: last, url: "", bucket: "", path: "" };
}

async function deleteStoredPhoto(bucket: string, path: string) {
  if (!bucket || !path || path.includes("..")) return;
  await supabaseAdmin.storage.from(bucket).remove([path]);
}

function refreshDesks() {
  revalidatePath("/intern", "layout");
  revalidatePath("/manager", "layout");
  revalidatePath("/intern/settings");
  revalidatePath("/manager/settings");
}

export async function saveDeskAvatar(formData: FormData) {
  const { supabase, user } = await signedInUser();
  const back = safeReturn(formData.get("returnTo"));
  if (!user) redirect("/login");
  const file = photoFile(formData.get("avatar"));
  if (!file) redirect(`${back}?error=${encodeURIComponent("Choose a profile photo.")}`);
  const uploaded = await uploadDeskPhoto(file, user.id);
  if (uploaded.error || !uploaded.url) {
    redirect(`${back}?error=${encodeURIComponent(uploaded.error || "Could not upload the profile photo.")}`);
  }
  const writeError = await writeProfilePhoto(user.id, uploaded.url);
  if (writeError) redirect(`${back}?error=${encodeURIComponent(writeError)}`);

  const intern = await findInternByAccount({ userId: user.id, email: user.email });
  const previousPath = String(intern?.avatarStoragePath || "");
  const previousBucket = String(user.user_metadata?.desk_avatar_bucket || "");
  const previousObject = String(user.user_metadata?.desk_avatar_path || "");
  if (intern?.id) {
    await supabaseAdmin.from("internship_interns").update({
      avatar_url: uploaded.url,
      avatar_storage_path: `${uploaded.bucket}/${uploaded.path}`,
      updated_at: new Date().toISOString(),
    }).eq("id", intern.id);
  }
  await supabase.auth.updateUser({
    data: {
      ...petParentAvatarWritePayload(uploaded.url),
      desk_avatar_bucket: uploaded.bucket,
      desk_avatar_path: uploaded.path,
    },
  });
  if (previousBucket && previousObject) await deleteStoredPhoto(previousBucket, previousObject);
  if (previousPath.startsWith("profile-photos/") || previousPath.startsWith("avatars/")) {
    const [storedBucket, ...rest] = previousPath.split("/");
    await deleteStoredPhoto(storedBucket, rest.join("/"));
  } else if (previousPath.startsWith("interns/")) {
    await deleteStoredPhoto("internship-assets", previousPath);
  }
  refreshDesks();
  redirect(`${back}?ok=${encodeURIComponent("Profile photo saved.")}`);
}

export async function removeDeskAvatar(formData: FormData) {
  const { supabase, user } = await signedInUser();
  const back = safeReturn(formData.get("returnTo"));
  if (!user) redirect("/login");
  await clearProfilePhoto(user.id);
  const intern = await findInternByAccount({ userId: user.id, email: user.email });
  const previousPath = String(intern?.avatarStoragePath || "");
  if (intern?.id) {
    await supabaseAdmin.from("internship_interns").update({
      avatar_url: "",
      avatar_storage_path: "",
      updated_at: new Date().toISOString(),
    }).eq("id", intern.id);
  }
  const bucket = String(user.user_metadata?.desk_avatar_bucket || "");
  const path = String(user.user_metadata?.desk_avatar_path || "");
  await supabase.auth.updateUser({
    data: {
      ...petParentAvatarWritePayload(""),
      picture: "",
      desk_avatar_bucket: "",
      desk_avatar_path: "",
    },
  });
  if (bucket && path) await deleteStoredPhoto(bucket, path);
  if (previousPath.startsWith("profile-photos/") || previousPath.startsWith("avatars/")) {
    const [storedBucket, ...rest] = previousPath.split("/");
    await deleteStoredPhoto(storedBucket, rest.join("/"));
  } else if (previousPath) {
    await deleteStoredPhoto("internship-assets", previousPath);
  }
  refreshDesks();
  redirect(`${back}?ok=${encodeURIComponent("Profile photo removed.")}`);
}
