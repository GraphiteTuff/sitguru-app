import { getAdminIdentity } from "@/lib/admin/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";
import { findInternByAccount, getInternOnboarding } from "@/lib/internship/queries";
import { internOnboardingComplete } from "@/lib/internship/onboarding";
import {
  BRAND_KIT_BUCKET,
  assessBrandUploadClaim,
  brandDownloadFileName,
  brandKitCapabilities,
  brandPreviewKind,
  inspectBrandBytes,
  BRAND_UPLOAD_STATUS,
  BRAND_INITIAL_APPROVAL_CUTOFF_UTC,
  brandSubmissionStatus,
  brandAssetMatchesCategory,
  isBrandCategory,
  isBrandStatus,
  paginateBrandAssets,
  parseSitGuruSharePointUrl,
  resolveBrandLibraryStatus,
  sanitizeBrandTags,
  sanitizeBrandText,
  sortBrandAssets,
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
    updatedAt: "",
    uploadedByName: row.uploaded_by_name || "SitGuru",
    previewKind: brandPreviewKind(row.mime_type),
    sharePointSourceUrl: text((row as AssetRow & { sharepoint_source_url?: string }).sharepoint_source_url),
  };
}

function withTimes(row: AssetRow & { created_at?: string; updated_at?: string }): BrandAssetRecord {
  return { ...mapAsset(row), createdAt: text(row.created_at), updatedAt: text(row.updated_at) || text(row.created_at) };
}

export async function resolveBrandActor(): Promise<ResolvedBrandActor | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = await getAdminIdentity();
  if (admin?.canAccessAdmin) {
    const actor: BrandActor = {
      canAccessAdmin: true,
      isSuperUser: admin.isSuperUser,
      growthOnly: isGrowthOnlyRole(admin.role),
      intern: false,
      brandApprover: String(user.email || "").trim().toLowerCase() === "ava@sitguru.com",
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
  // Match the Intern Portal gate: unpublished or unsigned intern accounts cannot download brand files.
  const onboarding = await getInternOnboarding(intern.id);
  const canSubmitAssets = internOnboardingComplete(onboarding);
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
    capabilities: { ...brandKitCapabilities(actor), upload: canSubmitAssets },
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

function isInitialBrandLibraryAsset(row: {
  approval_status?: string | null;
  created_at?: string | null;
}) {
  return (
    (row.approval_status === "draft" || row.approval_status === "pending_review") &&
    Boolean(row.created_at) &&
    String(row.created_at) <= BRAND_INITIAL_APPROVAL_CUTOFF_UTC
  );
}

export async function listBrandAssets(input: {
  actor: ResolvedBrandActor;
  query?: string;
  category?: string;
  status?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}) {
  const editor = input.actor.capabilities.viewLibrary;
  if (!editor && !input.actor.capabilities.viewApproved) {
    return { assets: [] as BrandAssetRecord[], error: "Not allowed.", page: 1, pages: 1, total: 0 };
  }
  const reviewer = input.actor.capabilities.approve;
  const status = resolveBrandLibraryStatus({
    isSuperUser: reviewer,
    status: input.status,
  });
  let query = supabaseAdmin
    .from("growth_brand_assets")
    .select(
      "id,title,description,category,tags,approval_status,file_name,mime_type,file_size,storage_bucket,storage_path,version,version_group,replaces_id,verified,uploaded_by,uploaded_by_name,sharepoint_source_url,created_at,updated_at",
    )
    .eq("verified", true)
    .limit(500);
  // Non-reviewers use the shared initial approved collection, not the private review queue.
  // Verified assets already present at the founder's approval snapshot are visible now,
  // even if the one-time database approval has not yet been run.
  if (reviewer && status !== "all" && status !== "active" && status !== "approved") query = query.eq("approval_status", status);
  else if (reviewer && status === "active") query = query.neq("approval_status", "archived");
  const { data, error } = await query;
  if (error) return { assets: [] as BrandAssetRecord[], error: libraryError(error), page: 1, pages: 1, total: 0 };

  const needle = String(input.query || "").trim().toLowerCase();
  const category = String(input.category || "");
  const matched: BrandAssetRecord[] = [];
  for (const row of (data || []) as Array<AssetRow & { created_at?: string; updated_at?: string }>) {
    // This grants read-only access to the verified initial collection without treating
    // any newly submitted, unapproved intern files as public team materials.
    const initialCollection = isInitialBrandLibraryAsset(row);
    if ((!reviewer || status === "approved") && row.approval_status !== "approved" && !initialCollection) continue;
    if (!brandAssetMatchesCategory(row.category, category)) continue;
    const mapped = withTimes(row);
    if (!editor) mapped.uploadedByName = "SitGuru";
    const blob = `${mapped.title} ${mapped.description} ${mapped.fileName} ${mapped.tags.join(" ")}`.toLowerCase();
    if (needle && !blob.includes(needle)) continue;
    matched.push(mapped);
  }
  const page = paginateBrandAssets(
    sortBrandAssets(matched, input.sort || "approved_first"),
    Number(input.page || 1),
    input.pageSize,
  );
  return { assets: page.assets, error: "", page: page.page, pages: page.pages, total: page.total };
}

/**
 * Founder-approved, bounded historical backfill.
 * Excludes unverified uploads, archived files, and every file submitted after
 * the snapshot cutoff so newer intern work can never bypass Ava's review.
 */
/** An intern may view the status of their own submissions, never another intern's work. */
export async function listOwnBrandSubmissions(actor: ResolvedBrandActor) {
  if (!actor.intern) return [] as Array<{ id: string; title: string; status: string; submittedAt: string }>;
  const { data, error } = await supabaseAdmin
    .from("growth_brand_assets")
    .select("id,title,approval_status,created_at")
    .eq("uploaded_by", actor.id)
    .eq("verified", true)
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) return [] as Array<{ id: string; title: string; status: string; submittedAt: string }>;
  return (data || []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    status: String(row.approval_status),
    submittedAt: String(row.created_at || ""),
  }));
}

export async function countInitialBrandAssetsToApprove(actor: ResolvedBrandActor) {
  if (!actor.isSuperUser) return { count: 0, error: "Super Admin access required." };
  const { count, error } = await supabaseAdmin
    .from("growth_brand_assets")
    .select("id", { count: "exact", head: true })
    .eq("verified", true)
    .in("approval_status", ["draft", "pending_review"])
    .lte("created_at", BRAND_INITIAL_APPROVAL_CUTOFF_UTC);
  return { count: count || 0, error: error ? libraryError(error) : "" };
}

export async function approveInitialBrandAssets(actor: ResolvedBrandActor) {
  if (!actor.isSuperUser) return { approved: 0, error: "Super Admin access required." };
  let approved = 0;
  // Bounded batches allow a safe retry, with a guard against unbounded work.
  for (let batch = 0; batch < 40; batch += 1) {
    const { data: pending, error: lookupError } = await supabaseAdmin
      .from("growth_brand_assets")
      .select("id,title")
      .eq("verified", true)
      .in("approval_status", ["draft", "pending_review"])
      .lte("created_at", BRAND_INITIAL_APPROVAL_CUTOFF_UTC)
      .order("created_at", { ascending: true })
      .limit(50);
    if (lookupError) return { approved, error: libraryError(lookupError) };
    if (!pending?.length) return { approved, error: "" };
    const ids = pending.map((asset) => asset.id);
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("growth_brand_assets")
      .update({
        approval_status: "approved",
        updated_at: new Date().toISOString(),
        updated_by: actor.id,
      })
      .in("id", ids)
      .eq("verified", true)
      .in("approval_status", ["draft", "pending_review"])
      .lte("created_at", BRAND_INITIAL_APPROVAL_CUTOFF_UTC)
      .select("id,title");
    if (updateError) return { approved, error: libraryError(updateError) };
    if (updated?.length) {
      const { error: auditError } = await supabaseAdmin
        .from("growth_brand_asset_events")
        .insert(updated.map((asset) => ({
          asset_id: asset.id,
          asset_title: String(asset.title).slice(0, 180),
          actor_id: actor.id,
          action: "approval",
          detail: "Founder-directed approval of verified assets existing at initial Nov 13 snapshot",
        })));
      approved += updated.length;
      if (auditError) return { approved, error: "Assets were approved, but their audit entries need reconciliation." };
    }
  }
  return { approved, error: "Approval exceeded batch limit. Run again to finish remaining verified assets." };
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

  const version = await nextVersion(input.actor, input.replacesId);
  if (version.error) return { error: version.error };
  const versionGroup = version.versionGroup;
  const replacesId = version.replacesId;

  const id = crypto.randomUUID();
  const storagePath = `library/${id}/${claim.safeName}`;
  const { error: insertError } = await supabaseAdmin.from("growth_brand_assets").insert({
    id,
    title,
    description: sanitizeBrandText(input.description, 2000),
    category: input.category,
    tags: sanitizeBrandTags(input.tags),
    approval_status: BRAND_UPLOAD_STATUS,
    file_name: claim.safeName,
    mime_type: claim.mime,
    file_size: claim.size,
    storage_bucket: BRAND_KIT_BUCKET,
    storage_path: storagePath,
    version: version.version,
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

async function nextVersion(actor: ResolvedBrandActor, replacesId?: string) {
  if (!replacesId) return { error: "", version: 1, versionGroup: "", replacesId: null as string | null };
  const { data: previous } = await supabaseAdmin
    .from("growth_brand_assets")
    .select("id,version,version_group,uploaded_by")
    .eq("id", replacesId)
    .eq("verified", true)
    .maybeSingle();
  if (!previous) return { error: "The file you are replacing is not in the library.", version: 1, versionGroup: "", replacesId: null as string | null };
  const owns = previous.uploaded_by === actor.id || actor.capabilities.approve;
  if (!owns) {
    return {
      error: "You can replace files you uploaded. A Super Admin can replace any file.",
      version: 1,
      versionGroup: "",
      replacesId: null as string | null,
    };
  }
  return {
    error: "",
    version: Number(previous.version || 1) + 1,
    versionGroup: text(previous.version_group),
    replacesId: text(previous.id),
  };
}

/** Same-origin save for logos and other files that fit in a server request. */
export async function saveBrandFile(input: {
  actor: ResolvedBrandActor;
  bytes: Uint8Array;
  fileName: string;
  declaredMime: string;
  category: string;
  title: string;
  description: string;
  tags: unknown;
  replacesId?: string;
}) {
  if (!input.actor.capabilities.upload) return { error: "You cannot upload brand files." };
  if (input.bytes.byteLength > 4 * 1024 * 1024) {
    return { error: "Files over 4MB use the large-file upload." };
  }
  const inspected = inspectBrandBytes({
    bytes: input.bytes,
    fileName: input.fileName,
    declaredMime: input.declaredMime,
    byteLength: input.bytes.byteLength,
  });
  if (!inspected.ok) return { error: inspected.error };
  if (!isBrandCategory(input.category)) return { error: "Choose a brand category." };
  const title = sanitizeBrandText(input.title || inspected.safeName, 140);
  if (!title) return { error: "Add a name for this file." };
  const version = await nextVersion(input.actor, input.replacesId);
  if (version.error) return { error: version.error };

  const id = crypto.randomUUID();
  const storagePath = `library/${id}/${inspected.safeName}`;
  const uploaded = await supabaseAdmin.storage.from(BRAND_KIT_BUCKET).upload(storagePath, Buffer.from(input.bytes), {
    contentType: inspected.mime,
    upsert: false,
  });
  if (uploaded.error) return { error: uploaded.error.message || "The file could not be stored." };

  const { error } = await supabaseAdmin.from("growth_brand_assets").insert({
    id,
    title,
    description: sanitizeBrandText(input.description, 2000),
    category: input.category,
    tags: sanitizeBrandTags(input.tags),
    approval_status: brandSubmissionStatus(input.actor),
    file_name: inspected.safeName,
    mime_type: inspected.mime,
    file_size: input.bytes.byteLength,
    storage_bucket: BRAND_KIT_BUCKET,
    storage_path: storagePath,
    version: version.version,
    version_group: version.versionGroup || id,
    replaces_id: version.replacesId,
    verified: true,
    uploaded_by: input.actor.id,
    uploaded_by_name: input.actor.name,
  });
  if (error) {
    await supabaseAdmin.storage.from(BRAND_KIT_BUCKET).remove([storagePath]);
    return { error: libraryError(error) };
  }
  await recordEvent({
    assetId: id,
    title,
    actorId: input.actor.id,
    action: "created",
    detail: inspected.safeName,
  });
  if (brandSubmissionStatus(input.actor) === "approved") {
    await recordEvent({
      assetId: id, title, actorId: input.actor.id,
      action: "approval", detail: "Auto-approved because the creator is an authorized brand approver",
    });
  }
  return { error: "", id };
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
      approval_status: brandSubmissionStatus(input.actor),
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
  if (brandSubmissionStatus(input.actor) === "approved") {
    await recordEvent({
      assetId: row.id, title: row.title, actorId: input.actor.id,
      action: "approval", detail: "Auto-approved after verified upload by an authorized brand approver",
    });
  }
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
  sharePointSourceUrl?: string;
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
      return { error: "Only Ava or a Super Admin may approve brand files." };
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
  if (input.sharePointSourceUrl !== undefined) {
    if (!input.actor.capabilities.approve) return { error: "A Super Admin saves the SharePoint source file." };
    const raw = String(input.sharePointSourceUrl || "").trim();
    if (!raw) {
      patch.sharepoint_source_url = "";
      notes.push("sharepoint cleared");
    } else {
      const parsed = parseSitGuruSharePointUrl(raw);
      if (!parsed.ok) return { error: parsed.error };
      patch.sharepoint_source_url = parsed.href;
      notes.push(parsed.kind === "file" ? "sharepoint file" : "sharepoint folder");
    }
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

export async function openBrandAssetFile(input: { actor: ResolvedBrandActor; id: string; download?: boolean }) {
  const { data: row } = await supabaseAdmin
    .from("growth_brand_assets")
    .select("id,title,file_name,mime_type,approval_status,storage_path,verified,uploaded_by,created_at")
    .eq("id", input.id)
    .maybeSingle();
  if (!row || !row.verified) return { error: "File not found.", status: 404 as const };
  if (row.approval_status === "approved" || isInitialBrandLibraryAsset(row)) {
    if (!input.actor.capabilities.viewApproved) return { error: "Not allowed.", status: 403 as const };
  } else if (
    !input.actor.capabilities.approve &&
    !(input.actor.capabilities.edit && row.uploaded_by === input.actor.id)
  ) {
    return { error: "Not allowed.", status: 403 as const };
  }
  const fileName = brandDownloadFileName(row.file_name);
  const signed = await supabaseAdmin.storage.from(BRAND_KIT_BUCKET).createSignedUrl(
    row.storage_path,
    60,
    input.download ? { download: fileName } : undefined,
  );
  if (signed.error || !signed.data?.signedUrl) return { error: "File not found.", status: 404 as const };
  return {
    error: "",
    status: 200 as const,
    redirectUrl: signed.data.signedUrl,
    fileName,
    mimeType: row.mime_type,
  };
}
