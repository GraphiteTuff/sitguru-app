import { randomUUID } from "crypto";
import {
  CONTENT_CREATIVE_DIRECT_LIMIT,
  CONTENT_DRAFT_BUCKET,
  assessContentCreative,
  contentCreativeOwned,
  creativeBytesMatch,
} from "@/lib/internship/content-creative";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function saveContentCreative(input: { internId: string; file: File }) {
  const claim = assessContentCreative(input.file);
  if (!claim.ok) return { error: claim.error, path: "", mime: "", name: "" };
  if (!claim.direct) return { error: "This file is too large for a direct upload.", path: "", mime: "", name: "" };
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  if (bytes.byteLength > CONTENT_CREATIVE_DIRECT_LIMIT) {
    return { error: "This file is too large for a direct upload.", path: "", mime: "", name: "" };
  }
  if (!creativeBytesMatch(claim.mime, bytes)) {
    return { error: "That file does not match its type.", path: "", mime: "", name: "" };
  }
  const path = `interns/${input.internId}/content/${randomUUID()}.${claim.ext}`;
  const { error } = await supabaseAdmin.storage.from(CONTENT_DRAFT_BUCKET).upload(path, bytes, {
    contentType: claim.mime,
    upsert: false,
  });
  if (error) return { error: error.message, path: "", mime: "", name: "" };
  return { error: "", path, mime: claim.mime, name: input.file.name };
}

export async function prepareContentCreative(input: { internId: string; name: string; size: number }) {
  const claim = assessContentCreative({ name: input.name, size: input.size, type: "" });
  if (!claim.ok) return { error: claim.error, path: "", signedUrl: "" };
  const path = `interns/${input.internId}/content/${randomUUID()}.${claim.ext}`;
  const signed = await supabaseAdmin.storage.from(CONTENT_DRAFT_BUCKET).createSignedUploadUrl(path);
  if (signed.error || !signed.data?.signedUrl) {
    return { error: signed.error?.message || "Upload could not be started.", path: "", signedUrl: "" };
  }
  return { error: "", path, signedUrl: signed.data.signedUrl, mime: claim.mime };
}

export async function verifyContentCreative(input: { internId: string; path: string; name: string; size: number }) {
  if (!contentCreativeOwned(input.internId, input.path)) return { error: "That file is not on your draft.", mime: "" };
  const claim = assessContentCreative({ name: input.name || input.path, size: input.size, type: "" });
  if (!claim.ok) return { error: claim.error, mime: "" };
  const signed = await supabaseAdmin.storage.from(CONTENT_DRAFT_BUCKET).createSignedUrl(input.path, 60);
  if (signed.error || !signed.data?.signedUrl) return { error: "The uploaded file could not be checked.", mime: "" };
  const head = await fetch(signed.data.signedUrl, { method: "HEAD" });
  const length = Number(head.headers.get("content-length") || 0);
  if (!head.ok || length <= 0 || length > claim.size + 1024) {
    await supabaseAdmin.storage.from(CONTENT_DRAFT_BUCKET).remove([input.path]);
    return { error: "The uploaded file could not be checked.", mime: "" };
  }
  const sample = await fetch(signed.data.signedUrl, { headers: { Range: "bytes=0-31" } });
  if (!sample.ok && sample.status !== 206) {
    await supabaseAdmin.storage.from(CONTENT_DRAFT_BUCKET).remove([input.path]);
    return { error: "The uploaded file could not be checked.", mime: "" };
  }
  const bytes = new Uint8Array(await sample.arrayBuffer());
  if (!creativeBytesMatch(claim.mime, bytes)) {
    await supabaseAdmin.storage.from(CONTENT_DRAFT_BUCKET).remove([input.path]);
    return { error: "That file does not match its type.", mime: "" };
  }
  return { error: "", mime: claim.mime, path: input.path, name: input.name };
}

export async function confirmContentCreative(internId: string, path: string) {
  if (!path) return true;
  if (!contentCreativeOwned(internId, path)) return false;
  const signed = await supabaseAdmin.storage.from(CONTENT_DRAFT_BUCKET).createSignedUrl(path, 60);
  if (signed.error || !signed.data?.signedUrl) return false;
  const head = await fetch(signed.data.signedUrl, { method: "HEAD" });
  return head.ok;
}

export async function openContentCreative(path: string, downloadName = "") {
  const signed = await supabaseAdmin.storage.from(CONTENT_DRAFT_BUCKET).createSignedUrl(
    path,
    60,
    downloadName ? { download: downloadName } : undefined,
  );
  if (signed.error || !signed.data?.signedUrl) return "";
  return signed.data.signedUrl;
}
