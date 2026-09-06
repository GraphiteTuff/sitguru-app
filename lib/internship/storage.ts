import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  INTERNSHIP_ASSETS_BUCKET,
  internAllowedUpload,
  internSafeFileName,
  internUploadExtension,
} from "@/lib/internship/portal";
import {
  INTERNSHIP_CONFIDENTIAL_BUCKET,
  internAllowedConfidentialUpload,
  internOnboardingFileHash,
} from "@/lib/internship/onboarding";

export async function uploadInternshipAsset(input: {
  file: File;
  pathPrefix: string;
}) {
  const blocked = internAllowedUpload(input.file);
  if (blocked) return { error: blocked, url: "", path: "" };

  const ext = internUploadExtension(input.file.name, input.file.type);
  const base = internSafeFileName(input.file.name.replace(/\.[^.]+$/, "") || "file");
  const path = `${input.pathPrefix.replace(/^\/+|\/+$/g, "")}/${base}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const { error } = await supabaseAdmin.storage
    .from(INTERNSHIP_ASSETS_BUCKET)
    .upload(path, buffer, {
      contentType: input.file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) return { error: error.message, url: "", path: "" };

  const { data } = supabaseAdmin.storage
    .from(INTERNSHIP_ASSETS_BUCKET)
    .getPublicUrl(path);

  return { error: "", url: data.publicUrl, path };
}

export async function uploadInternshipConfidential(input: {
  file: File;
  internId: string;
}) {
  const blocked = internAllowedConfidentialUpload(input.file);
  if (blocked) return { error: blocked, path: "", hash: "", bytes: Buffer.alloc(0) };

  const ext = internUploadExtension(input.file.name, input.file.type);
  const base = internSafeFileName(input.file.name.replace(/\.[^.]+$/, "") || "signed-page");
  const path = `interns/${input.internId}/confidentiality/${base}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const { error } = await supabaseAdmin.storage
    .from(INTERNSHIP_CONFIDENTIAL_BUCKET)
    .upload(path, buffer, {
      contentType: input.file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) return { error: error.message, path: "", hash: "", bytes: Buffer.alloc(0) };
  return {
    error: "",
    path,
    hash: internOnboardingFileHash(buffer),
    bytes: buffer,
  };
}

export async function signedInternshipConfidentialUrl(path: string) {
  if (!path) return "";
  const { data, error } = await supabaseAdmin.storage
    .from(INTERNSHIP_CONFIDENTIAL_BUCKET)
    .createSignedUrl(path, 60 * 10);
  if (error) return "";
  return data.signedUrl;
}

export async function downloadInternshipConfidential(path: string) {
  if (!path) return { error: "Missing signed page.", bytes: null as Buffer | null, contentType: "" };
  const { data, error } = await supabaseAdmin.storage
    .from(INTERNSHIP_CONFIDENTIAL_BUCKET)
    .download(path);
  if (error || !data) {
    return { error: error?.message || "Could not open the signed page.", bytes: null, contentType: "" };
  }
  const bytes = Buffer.from(await data.arrayBuffer());
  return { error: "", bytes, contentType: data.type || "" };
}
