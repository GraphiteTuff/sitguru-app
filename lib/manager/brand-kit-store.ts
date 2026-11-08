import { getAdminIdentity } from "@/lib/admin/access";
import { canUseGrowthPortal } from "@/lib/admin/growth/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";
import { findInternByAccount } from "@/lib/internship/queries";
import {
  BRAND_KIT_BUCKET,
  assessBrandUploadClaim,
  brandKitCapabilities,
  brandPreviewKind,
  inspectBrandBytes,
  isBrandCategory,
  isBrandStatus,
  sanitizeBrandTags,
  sanitizeBrandText,
  type BrandActor,
  type BrandAssetRecord,
  type BrandCapabilities,
  type BrandStatus,
} from "@/lib/manager/brand-kit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ResolvedBrandActor = BrandActor & {
  id: string;
  email: string;
  name: string;
  capabilities: BrandCapabilities;
};

type AssetRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[] | null;
  approval_status: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  storage_bucket: string;
  storage_path: string;
  version: number;
  version_group: string;
  replaces_id: string | null;
  verified: boolean;
  uploaded_by: string;
  uploaded_by_name: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapAsset(row: AssetRow): BrandAssetRecord {
  const status = isBrandStatus(row.approval_status) ? row.approval_status : "draft";
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    category: row.category,
    tags: Array.isArray(row.tags) ? row.tags : [],
    approvalStatus: status,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: Number(row.file_size || 0),
    version: Number(row.version || 1),
    createdAt: "",
    uploadedByName: row.uploaded_by_name || "SitGuru",
    previewKind: brandPreviewKind(row.mime_type),
  };
}

async function withCreatedAt(row: AssetRow & { created_at?: string }): Promise<BrandAssetRecord> {
  return { ...mapAsset(row), createdAt: text(row.created_at) };
}

export async function resolveBrandActor(): Promise<ResolvedBrandActor | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = await getAdminIdentity();
  if (admin && canUseGrowthPortal(admin)) {
    const actor: BrandActor = {
      canAccessAdmin: true,
      isSuperUser: admin.isSuperUser,
      growthOnly: isGrowthOnlyRole(admin.role),
      intern: false,
    };
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", admin.id)
      .maybeSingle();
    return {
      ...actor,
      id: admin.id,
      email: admin.email,
      name: text(profile?.full_name) || "SitGuru",
      capabilities: brandKitCapabilities(actor),
    };
  }

  const intern = await findInternByAccount({ userId: user.id, email: user.email });
  if (!intern?.userId) return null;
  const actor: BrandActor = {
    canAccessAdmin: false,
    isSuperUser: false,
    growthOnly: false,
    intern: true,
  };
  return {
    ...actor,
    id: intern.userId,
    email: intern.email || "",
    name: intern.preferredName || intern.fullName || "Intern",
    capabilities: brandKitCapabilities(actor),
  };
}

async function recordEvent(input: {
  assetId: string | null;
  title: string;
  actorId: string;
  action: string;
  detail?: string;
}) {
  await supabaseAdmin.from("growth_brand_asset_events").insert({
    asset_id: input.assetId,
    asset_title: input.title.slice(0, 180),
    actor_id: input.actorId,
    action: input.action,
    detail: String(input.detail || "").slice(0, 500),
  });
}

function libraryError(error: { message?: string; code?: string } | null) {
  if (!error) return "";
  if (error.code === "42P01" || /growth_brand_assets/i.test(error.message || "")) {
    return "Brand Kit storage is not ready yet.";
  }
  return error.message || "Brand Kit could not be loaded.";
}

export async function listBrandAssets(input: {
  actor: ResolvedBrandActor;
  query?: string;
  category?: string;
  status?: string;
}) {
  const editor = input.actor.capabilities.viewLibrary;
  if (!editor && !input.actor.capabilities.viewApproved) {
    return { assets: [] as BrandAssetRecord[], error: "Not allowed." };
  }
  const { data, error } = await supabaseAdmin
    .from("growth_brand_assets")
    .select(
      "id,title,description,category,tags,approval_status,file_name,mime_type,file_size,storage_bucket,storage_path,version,version_group,replaces_id,verified,uploaded_by,uploaded_by_name,created_at",
    )
    .eq("verified", true)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return { assets: [] as BrandAssetRecord[], error: libraryError(error) };

  const needle = String(input.query || "").trim().toLowerCase();
  const category = String(input.category || "");
  const status = String(input.status || "");
  const assets: BrandAssetRecord[] = [];
  for (const row of (data || []) as Array<AssetRow & { created_at?: string }>) {
    if (!editor && row.approval_status !== "approved") continue;
    if (!editor && row.approval_status === "archived") continue;
    if (category && category !== "all" && row.category !== category) continue;
    if (status === "archived" && row.approval_status !== "archived") continue;
    if (status && status !== "all" && status !== "archived" && row.approval_status !== status) continue;
    if (!status && row.approval_status === "archived") continue;
    const mapped = await withCreatedAt(row);
    if (!editor) mapped.uploadedByName = "SitGuru";
    const blob = `${mapped.title} ${mapped.description} ${mapped.fileName} ${mapped.tags.join(" ")}`.toLowerCase();
    if (needle && !blob.includes(needle)) continue;
    assets.push(mapped);
  }
  return { assets, error: "" };
}

export async function prepareBrandUpload(input: {
  actor: ResolvedBrandActor;
  fileName: string;
  declaredMime: string;
  declaredSize: number;
  category: string;
  title: string;
  description: string;
  tags: unknown;
  replacesId?: string;
}) {
  if (!input.actor.capabilities.upload) return { error: "You cannot upload brand files." };
  const claim = assessBrandUploadClaim({
    fileName: input.fileName,
    declaredMime: input.declaredMime,
    declaredSize: input.declaredSize,
  });
  if (!claim.ok) return { error: claim.error };
  if (!isBrandCategory(input.category)) return { error: "Choose a brand category." };
  const title = sanitizeBrandText(input.title || claim.safeName, 140);
  if (!title) return { error: "Add a name for this file." };

  let version = 1;
  let versionGroup = "";
  let replacesId: string | null = null;
  if (input.replacesId) {
    const { data: previous } = await supabaseAdmin
      .from("growth_brand_assets")
      .select("id,version,version_group,uploaded_by,title")
      .eq("id", input.replacesId)
      .eq("verified", true)
      .maybeSingle();
    if (!previous) return { error: "The file you are replacing is not in the library." };
    const owns = previous.uploaded_by === input.actor.id || input.actor.capabilities.approve;
    if (!owns) return { error: "You can replace files you uploaded. A Super Admin can replace any file." };
    version = Number(previous.version || 1) + 1;
    versionGroup = text(previous.version_group);
    replacesId = text(previous.id);
  }

  const id = crypto.randomUUID();
  const storagePath = `library/${id}/${claim.safeName}`;
  const { error: insertError } = await supabaseAdmin.from("growth_brand_assets").insert({
    id,
    title,
    description: sanitizeBrandText(input.description, 2000),
    category: input.category,
    tags: sanitizeBrandTags(input.tags),
    approval_status: "draft",
    file_name: claim.safeName,
    mime_type: claim.mime,
    file_size: claim.size,
    storage_bucket: BRAND_KIT_BUCKET,
    storage_path: storagePath,
    version,
    version_group: versionGroup || id,
    replaces_id: replacesId,
    verified: false,
    uploaded_by: input.actor.id,
    uploaded_by_name: input.actor.name,
  });
  if (insertError) return { error: libraryError(insertError) };

  const signed = await supabaseAdmin.storage.from(BRAND_KIT_BUCKET).createSignedUploadUrl(storagePath);
  if (signed.error || !signed.data?.signedUrl) {
    await supabaseAdmin.from("growth_brand_assets").delete().eq("id", id);
    return { error: signed.error?.message || "Upload could not be started." };
  }
  return { error: "", id, signedUrl: signed.data.signedUrl, token: signed.data.token };
}

export async function verifyBrandUpload(input: { actor: ResolvedBrandActor; id: string }) {
  if (!input.actor.capabilities.upload) return { error: "You cannot upload brand files." };
  const { data: row } = await supabaseAdmin
    .from("growth_brand_assets")
    .select("id,title,file_name,mime_type,file_size,storage_path,uploaded_by,verified")
    .eq("id", input.id)
    .maybeSingle();
  if (!row) return { error: "That upload was not found." };
  if (row.uploaded_by !== input.actor.id && !input.actor.capabilities.approve) {
    return { error: "You cannot finish someone else's upload." };
  }
  if (row.verified) return { error: "", id: row.id };

  const signed = await supabaseAdmin.storage.from(BRAND_KIT_BUCKET).createSignedUrl(row.storage_path, 60);
  if (signed.error || !signed.data?.signedUrl) {
    return { error: "The uploaded file could not be checked." };
  }
  const head = await fetch(signed.data.signedUrl, { method: "HEAD" });
  const length = Number(head.headers.get("content-length") || row.file_size || 0);
  const svg = row.mime_type === "image/svg+xml";
  if (svg && length > 512 * 1024) {
    await discardUpload(row.id, row.storage_path);
    return { error: "SVG files must be 512KB or smaller." };
  }
  const fetched = svg
    ? await fetch(signed.data.signedUrl)
    : await fetch(signed.data.signedUrl, { headers: { Range: "bytes=0-262143" } });
  if (!fetched.ok && fetched.status !== 206) {
    await discardUpload(row.id, row.storage_path);
    return { error: "The uploaded file could not be checked." };
  }
  const bytes = new Uint8Array(await fetched.arrayBuffer());
  const inspected = inspectBrandBytes({
    bytes,
    fileName: row.file_name,
    declaredMime: row.mime_type,
    byteLength: length || Number(row.file_size || 0),
  });
  if (!inspected.ok) {
    await discardUpload(row.id, row.storage_path);
    return { error: inspected.error };
  }
  const { error } = await supabaseAdmin
    .from("growth_brand_assets")
    .update({
      verified: true,
      mime_type: inspected.mime,
      file_size: length || row.file_size,
      updated_at: new Date().toISOString(),
      updated_by: input.actor.id,
    })
    .eq("id", row.id);
  if (error) return { error: libraryError(error) };
  await recordEvent({
    assetId: row.id,
    title: row.title,
    actorId: input.actor.id,
    action: "created",
    detail: row.file_name,
  });
  return { error: "", id: row.id };
}

async function discardUpload(id: string, path: string) {
  await supabaseAdmin.storage.from(BRAND_KIT_BUCKET).remove([path]);
  await supabaseAdmin.from("growth_brand_assets").delete().eq("id", id).eq("verified", false);
}

export async function abandonBrandUpload(input: { actor: ResolvedBrandActor; id: string }) {
  const { data: row } = await supabaseAdmin
    .from("growth_brand_assets")
    .select("id,storage_path,uploaded_by,verified,title")
    .eq("id", input.id)
    .maybeSingle();
  if (!row || row.verified) return { error: "" };
  if (row.uploaded_by !== input.actor.id && !input.actor.capabilities.delete) {
    return { error: "Not allowed." };
  }
  await discardUpload(row.id, row.storage_path);
  return { error: "" };
}

export async function updateBrandAsset(input: {
  actor: ResolvedBrandActor;
  id: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: unknown;
  approvalStatus?: string;
}) {
  if (!input.actor.capabilities.edit) return { error: "You cannot edit brand files." };
  const { data: row } = await supabaseAdmin
    .from("growth_brand_assets")
    .select("id,title,approval_status,uploaded_by,verified")
    .eq("id", input.id)
    .eq("verified", true)
    .maybeSingle();
  if (!row) return { error: "That file is not in the library." };

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: input.actor.id,
  };
  const notes: string[] = [];
  if (input.title !== undefined) {
    const title = sanitizeBrandText(input.title, 140);
    if (!title) return { error: "Add a name for this file." };
    patch.title = title;
    notes.push("renamed");
  }
  if (input.description !== undefined) {
    patch.description = sanitizeBrandText(input.description, 2000);
    notes.push("described");
  }
  if (input.category !== undefined) {
    if (!isBrandCategory(input.category)) return { error: "Choose a brand category." };
    patch.category = input.category;
    notes.push("recategorized");
  }
  if (input.tags !== undefined) {
    patch.tags = sanitizeBrandTags(input.tags);
    notes.push("tagged");
  }
  if (input.approvalStatus !== undefined) {
    if (!isBrandStatus(input.approvalStatus)) return { error: "Choose a valid status." };
    if (input.approvalStatus === "approved" && !input.actor.capabilities.approve) {
      return { error: "A Super Admin approves brand files." };
    }
    if (input.approvalStatus === "archived" && !input.actor.capabilities.archive) {
      return { error: "You cannot archive this file." };
    }
    if (
      (input.approvalStatus === "draft" || input.approvalStatus === "pending_review") &&
      !input.actor.capabilities.edit
    ) {
      return { error: "You cannot change this file." };
    }
    patch.approval_status = input.approvalStatus;
    notes.push(input.approvalStatus);
  }
  const { error } = await supabaseAdmin.from("growth_brand_assets").update(patch).eq("id", row.id);
  if (error) return { error: libraryError(error) };
  await recordEvent({
    assetId: row.id,
    title: String(patch.title || row.title),
    actorId: input.actor.id,
    action: notes.includes("approved") ? "approval" : notes[0] || "updated",
    detail: notes.join(", "),
  });
  return { error: "" };
}

export async function deleteBrandAsset(input: { actor: ResolvedBrandActor; id: string }) {
  if (!input.actor.capabilities.delete) return { error: "A Super Admin deletes master brand files. You can archive a file instead." };
  const { data: row } = await supabaseAdmin
    .from("growth_brand_assets")
    .select("id,title,storage_path,file_name")
    .eq("id", input.id)
    .maybeSingle();
  if (!row) return { error: "That file is not in the library." };
  await recordEvent({
    assetId: row.id,
    title: row.title,
    actorId: input.actor.id,
    action: "deleted",
    detail: row.file_name,
  });
  await supabaseAdmin.storage.from(BRAND_KIT_BUCKET).remove([row.storage_path]);
  const { error } = await supabaseAdmin.from("growth_brand_assets").delete().eq("id", row.id);
  if (error) return { error: libraryError(error) };
  return { error: "" };
}

export async function openBrandAssetFile(input: { actor: ResolvedBrandActor; id: string }) {
  const { data: row } = await supabaseAdmin
    .from("growth_brand_assets")
    .select("id,title,file_name,mime_type,approval_status,storage_path,verified")
    .eq("id", input.id)
    .maybeSingle();
  if (!row || !row.verified) return { error: "File not found.", status: 404 as const };
  const editor = input.actor.capabilities.viewLibrary;
  if (!editor && (row.approval_status !== "approved" || !input.actor.capabilities.viewApproved)) {
    return { error: "Not allowed.", status: 403 as const };
  }
  const attachment = row.mime_type === "image/svg+xml" || row.mime_type === "application/pdf" || row.mime_type === "application/zip";
  if (attachment) {
    const downloaded = await supabaseAdmin.storage.from(BRAND_KIT_BUCKET).download(row.storage_path);
    if (downloaded.error || !downloaded.data) return { error: "File not found.", status: 404 as const };
    const bytes = Buffer.from(await downloaded.data.arrayBuffer());
    return {
      error: "",
      status: 200 as const,
      bytes,
      mimeType: row.mime_type,
      fileName: row.file_name,
    };
  }
  const signed = await supabaseAdmin.storage.from(BRAND_KIT_BUCKET).createSignedUrl(row.storage_path, 60);
  if (signed.error || !signed.data?.signedUrl) return { error: "File not found.", status: 404 as const };
  return { error: "", status: 200 as const, redirectUrl: signed.data.signedUrl };
}
