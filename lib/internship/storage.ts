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
  if (blocked) return { error: blocked, path: "" };

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

  if (error) return { error: error.message, path: "" };
  return { error: "", path };
}

export async function signedInternshipConfidentialUrl(path: string) {
  if (!path) return "";
  const { data, error } = await supabaseAdmin.storage
    .from(INTERNSHIP_CONFIDENTIAL_BUCKET)
    .createSignedUrl(path, 60 * 10);
  if (error) return "";
  return data.signedUrl;
}
