"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";
import { GROWTH_HIRE_ROLE } from "@/lib/admin/growth/hire";
import { canEditRequirements, internshipActorKind } from "@/lib/internship/manager-access";
import {
  acknowledgmentUnlocked,
  adminSignatureTransition,
  confirmReview,
  followSigningLink,
  normalizeProvider,
  onboardingProgress,
  openForReview,
  referencedVersionSnapshot,
  type OnboardingItemState,
  type OnboardingKind,
} from "@/lib/onboarding/domain";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function bounce(path: string, kind: "ok" | "error", message: string): never {
  const [base, existing] = path.split("?");
  const params = new URLSearchParams(existing || "");
  params.set(kind, message);
  redirect(`${base}?${params.toString()}`);
}

async function actor() {
  const admin = await getAdminIdentity();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = admin?.id || user?.id || "";
  const kind = internshipActorKind({
    role: admin?.role,
    isSuperUser: admin?.isSuperUser,
  });
  return {
    userId,
    email: admin?.email || user?.email || "",
    role: admin?.role || "",
    founder: canEditRequirements(kind),
    growth: Boolean(admin && isGrowthOnlyRole(admin.role)),
  };
}

async function audit(input: {
  instanceId?: string | null;
  itemId?: string | null;
  actorId: string;
  actorRole: string;
  subjectUserId?: string | null;
  action: string;
  previous?: string;
  next?: string;
  versionId?: string | null;
  note?: string;
}) {
  await supabaseAdmin.from("onboarding_audit_events").insert({
    instance_id: input.instanceId || null,
    item_id: input.itemId || null,
    actor_id: input.actorId || null,
    actor_role: input.actorRole,
    subject_user_id: input.subjectUserId || null,
    action: input.action,
    previous_status: input.previous || "",
    new_status: input.next || "",
    document_version_id: input.versionId || null,
    note: input.note || "",
  });
}

async function loadItem(itemId: string) {
  const { data } = await supabaseAdmin
    .from("onboarding_items")
    .select("id,instance_id,kind,requirement,status,version_id,signing_url,provider,referenced_versions")
    .eq("id", itemId)
    .maybeSingle();
  return data;
}

async function instanceFor(item: { instance_id?: string | null }) {
  const { data } = await supabaseAdmin
    .from("onboarding_instances")
    .select("id,subject_user_id,subject_role,status,template_id")
    .eq("id", item.instance_id || "")
    .maybeSingle();
  return data;
}

async function siblingStates(instanceId: string): Promise<OnboardingItemState[]> {
  const { data } = await supabaseAdmin
    .from("onboarding_items")
    .select("id,kind,requirement,status,version_id")
    .eq("instance_id", instanceId);
  const rows = (data || []) as Record<string, unknown>[];
  const versionIds = rows.map((row) => String(row.version_id || "")).filter(Boolean);
  const { data: versions } = versionIds.length
    ? await supabaseAdmin.from("onboarding_document_versions").select("id,version_label,document_id").in("id", versionIds)
    : { data: [] };
  const versionMap = new Map((versions || []).map((row) => [String(row.id), row]));
  const documentIds = (versions || []).map((row) => String(row.document_id || "")).filter(Boolean);
  const { data: documents } = documentIds.length
    ? await supabaseAdmin.from("onboarding_documents").select("id,title").in("id", documentIds)
    : { data: [] };
  const titles = new Map((documents || []).map((row) => [String(row.id), String(row.title || "")]));
  return rows.map((row) => {
    const version = versionMap.get(String(row.version_id || ""));
    return {
      id: String(row.id),
      kind: String(row.kind) as OnboardingKind,
      requirement: String(row.requirement) === "optional" ? "optional" as const : "required" as const,
      status: String(row.status || "assigned"),
      title: titles.get(String(version?.document_id || "")) || "Document",
      versionId: String(row.version_id || ""),
      versionLabel: String(version?.version_label || "v1.0"),
    };
  });
}

async function refreshCompletion(instanceId: string) {
  const states = await siblingStates(instanceId);
  const progress = onboardingProgress(states);
  await supabaseAdmin
    .from("onboarding_instances")
    .update({
      status: progress.complete ? "complete" : "in_progress",
      completed_at: progress.complete ? new Date().toISOString() : null,
    })
    .eq("id", instanceId);
}

function refreshPaths() {
  revalidatePath("/admin/growth/onboarding");
  revalidatePath("/admin/hr/onboarding");
  revalidatePath("/admin/growth");
  revalidatePath("/intern/manage");
}

export async function assignGrowthOnboarding(formData: FormData) {
  const who = await actor();
  if (!who.founder) bounce("/admin/hr/onboarding", "error", "Only the founder can assign onboarding.");
  const userId = text(formData, "userId");
  const { data: access } = await supabaseAdmin
    .from("admin_user_access")
    .select("user_id,role_key,is_active")
    .eq("user_id", userId)
    .eq("role_key", GROWTH_HIRE_ROLE)
    .eq("is_active", true)
    .maybeSingle();
  if (!access?.user_id) {
    bounce("/admin/hr/onboarding", "error", "Choose an active Social & Growth Manager login.");
  }
  const { data: existing } = await supabaseAdmin
    .from("onboarding_instances")
    .select("id,status")
    .eq("subject_user_id", userId)
    .neq("status", "complete")
    .limit(1)
    .maybeSingle();
  if (existing?.id) bounce("/admin/hr/onboarding", "error", "That person already has onboarding in progress.");

  const { data: template } = await supabaseAdmin
    .from("onboarding_templates")
    .select("id,role_key")
    .eq("slug", "social-community-growth-manager")
    .maybeSingle();
  if (!template?.id) bounce("/admin/hr/onboarding", "error", "The Growth Manager package is not ready yet.");

  const { data: settings } = await supabaseAdmin.from("onboarding_settings").select("key,value");
  const flags = new Map((settings || []).map((row) => [String(row.key), String(row.value)]));
  const { data: templateItems } = await supabaseAdmin
    .from("onboarding_template_items")
    .select("document_id,kind,requirement,sort_order,feature_key")
    .eq("template_id", template.id)
    .order("sort_order");
  const visible = (templateItems || []).filter((row) => {
    const feature = String(row.feature_key || "");
    return !feature || flags.get(feature) === "true";
  });
  const documentIds = visible.map((row) => String(row.document_id));
  const { data: versions } = await supabaseAdmin
    .from("onboarding_document_versions")
    .select("id,document_id,version_label,published_at")
    .in("document_id", documentIds)
    .eq("status", "published");
  const latest = new Map<string, { id: string }>();
  for (const version of versions || []) {
    const key = String(version.document_id);
    const current = latest.get(key);
    if (!current) latest.set(key, { id: String(version.id) });
  }

  const { data: created, error } = await supabaseAdmin
    .from("onboarding_instances")
    .insert({
      template_id: template.id,
      subject_user_id: userId,
      subject_role: GROWTH_HIRE_ROLE,
      status: "assigned",
      assigned_by: who.userId,
    })
    .select("id")
    .single();
  if (error || !created) bounce("/admin/hr/onboarding", "error", "Onboarding could not be assigned.");

  const items = visible
    .map((row) => {
      const version = latest.get(String(row.document_id));
      if (!version) return null;
      return {
        instance_id: created.id,
        document_id: row.document_id,
        version_id: version.id,
        kind: row.kind,
        requirement: row.requirement,
        sort_order: row.sort_order,
        status: "assigned",
      };
    })
    .filter(Boolean);
  if (items.length) await supabaseAdmin.from("onboarding_items").insert(items);
  await audit({
    instanceId: created.id,
    actorId: who.userId,
    actorRole: "founder",
    subjectUserId: userId,
    action: "package_assigned",
    next: "assigned",
    note: "Social Media & Community Growth Manager package",
  });
  refreshPaths();
  bounce("/admin/hr/onboarding", "ok", "Onboarding package assigned.");
}

export async function startOnboardingReview(formData: FormData) {
  const who = await actor();
  const row = await loadItem(text(formData, "itemId"));
  const instance = row ? await instanceFor(row) : null;
  if (!row || !instance || instance.subject_user_id !== who.userId || row.kind !== "review") {
    bounce("/admin/growth/onboarding", "error", "That document is not on your onboarding.");
  }
  const next = openForReview(String(row.status));
  if (next.status !== row.status) {
    await supabaseAdmin.from("onboarding_items").update({ status: next.status, viewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", row.id);
    await audit({ instanceId: instance.id, itemId: row.id, actorId: who.userId, actorRole: who.role || "growth", subjectUserId: who.userId, action: "document_opened", previous: String(row.status), next: next.status, versionId: String(row.version_id) });
  }
  refreshPaths();
  bounce("/admin/growth/onboarding", "ok", "Document opened. Confirm the review when you are finished.");
}

export async function openOnboardingDocument(formData: FormData) {
  const who = await actor();
  const row = await loadItem(text(formData, "itemId"));
  const instance = row ? await instanceFor(row) : null;
  if (!row || !instance || instance.subject_user_id !== who.userId) {
    bounce("/admin/growth/onboarding", "error", "That document is not on your onboarding.");
  }
  if (row.kind === "review") {
    const next = openForReview(String(row.status));
    if (next.status !== row.status) {
      await supabaseAdmin.from("onboarding_items").update({ status: next.status, viewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", row.id);
      await audit({ instanceId: instance.id, itemId: row.id, actorId: who.userId, actorRole: who.role || "growth", subjectUserId: who.userId, action: "document_opened", previous: String(row.status), next: next.status, versionId: String(row.version_id) });
    }
  }
  refreshPaths();
  redirect(`/api/onboarding/file?version=${row.version_id}`);
}

export async function confirmOnboardingReview(formData: FormData) {
  const who = await actor();
  const row = await loadItem(text(formData, "itemId"));
  const instance = row ? await instanceFor(row) : null;
  if (!row || !instance || instance.subject_user_id !== who.userId || row.kind !== "review") {
    bounce("/admin/growth/onboarding", "error", "You can only review your own assigned documents.");
  }
  const next = confirmReview(String(row.status));
  if (!next.ok) bounce("/admin/growth/onboarding", "error", next.error);
  await supabaseAdmin.from("onboarding_items").update({ status: next.status, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", row.id);
  await audit({ instanceId: instance.id, itemId: row.id, actorId: who.userId, actorRole: who.role || "growth", subjectUserId: who.userId, action: "document_acknowledged", previous: String(row.status), next: next.status, versionId: String(row.version_id) });
  await refreshCompletion(instance.id);
  refreshPaths();
  bounce("/admin/growth/onboarding", "ok", "Marked as reviewed.");
}

export async function followOnboardingSignature(formData: FormData) {
  const who = await actor();
  const row = await loadItem(text(formData, "itemId"));
  const instance = row ? await instanceFor(row) : null;
  if (!row || !instance || instance.subject_user_id !== who.userId) {
    bounce("/admin/growth/onboarding", "error", "That signing request is not yours.");
  }
  if (row.kind === "acknowledgment") {
    const siblings = await siblingStates(instance.id);
    if (!acknowledgmentUnlocked(siblings)) {
      bounce("/admin/growth/onboarding", "error", "Review the required documents before the acknowledgment.");
    }
  }
  const next = followSigningLink(String(row.status));
  if (!next.ok) bounce("/admin/growth/onboarding", "error", next.error);
  const url = String(row.signing_url || "");
  if (!url.startsWith("https://")) bounce("/admin/growth/onboarding", "error", "The signing link is not ready yet.");
  await supabaseAdmin.from("onboarding_items").update({ status: next.status, viewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", row.id);
  await audit({ instanceId: instance.id, itemId: row.id, actorId: who.userId, actorRole: who.role || "growth", subjectUserId: who.userId, action: "signing_link_opened", previous: String(row.status), next: next.status, versionId: String(row.version_id) });
  refreshPaths();
  redirect(url);
}

export async function sendForSignature(formData: FormData) {
  const who = await actor();
  if (!who.founder) bounce("/admin/hr/onboarding", "error", "Only the founder can send a document for signature.");
  const row = await loadItem(text(formData, "itemId"));
  const instance = row ? await instanceFor(row) : null;
  if (!row || !instance) bounce("/admin/hr/onboarding", "error", "That onboarding item was not found.");
  const provider = normalizeProvider(text(formData, "provider"));
  if (!provider.ok) bounce("/admin/hr/onboarding", "error", provider.error);
  const url = text(formData, "signingUrl");
  if (url && !url.startsWith("https://")) bounce("/admin/hr/onboarding", "error", "The signing link must start with https://");
  if (row.kind === "acknowledgment") {
    const siblings = await siblingStates(instance.id);
    if (!acknowledgmentUnlocked(siblings)) bounce("/admin/hr/onboarding", "error", "Required reviews are not finished.");
  }
  const next = adminSignatureTransition({ status: String(row.status), action: "send" });
  if (!next.ok) bounce("/admin/hr/onboarding", "error", next.error);
  const referenced = row.kind === "acknowledgment" ? referencedVersionSnapshot(await siblingStates(instance.id)) : [];
  await supabaseAdmin.from("onboarding_items").update({
    status: next.status,
    provider: provider.provider,
    signing_url: url,
    external_request_id: text(formData, "requestId"),
    external_agreement_id: text(formData, "agreementId"),
    referenced_versions: referenced,
    sent_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", row.id);
  await audit({ instanceId: instance.id, itemId: row.id, actorId: who.userId, actorRole: "founder", subjectUserId: String(instance.subject_user_id), action: "signature_requested", previous: String(row.status), next: next.status, versionId: String(row.version_id), note: provider.provider });
  refreshPaths();
  bounce("/admin/hr/onboarding", "ok", "Sent for signature.");
}

export async function recordContractorSigned(formData: FormData) {
  const who = await actor();
  if (!who.founder) bounce("/admin/hr/onboarding", "error", "Only the founder can record an external signature.");
  const row = await loadItem(text(formData, "itemId"));
  const instance = row ? await instanceFor(row) : null;
  if (!row || !instance) bounce("/admin/hr/onboarding", "error", "That onboarding item was not found.");
  const next = adminSignatureTransition({ status: String(row.status), action: "record_signed" });
  if (!next.ok) bounce("/admin/hr/onboarding", "error", next.error);
  await supabaseAdmin.from("onboarding_items").update({ status: next.status, signed_at: new Date().toISOString(), provider_status: "signed_by_contractor", updated_at: new Date().toISOString() }).eq("id", row.id);
  await audit({ instanceId: instance.id, itemId: row.id, actorId: who.userId, actorRole: "founder", subjectUserId: String(instance.subject_user_id), action: "contractor_signed", previous: String(row.status), next: next.status, versionId: String(row.version_id) });
  refreshPaths();
  bounce("/admin/hr/onboarding", "ok", "Signature recorded. SitGuru countersignature is still required.");
}

export async function verifyExternalCompletion(formData: FormData) {
  const who = await actor();
  if (!who.founder) bounce("/admin/hr/onboarding", "error", "Only the founder can verify a completed signature.");
  const row = await loadItem(text(formData, "itemId"));
  const instance = row ? await instanceFor(row) : null;
  if (!row || !instance) bounce("/admin/hr/onboarding", "error", "That onboarding item was not found.");
  const next = adminSignatureTransition({ status: String(row.status), action: "verify" });
  if (!next.ok) bounce("/admin/hr/onboarding", "error", next.error);
  const finalRef = text(formData, "finalRef");
  const now = new Date().toISOString();
  await supabaseAdmin.from("onboarding_items").update({
    status: next.status,
    completed_at: now,
    final_document_ref: finalRef,
    audit_certificate_ref: text(formData, "certificateRef"),
    provider_status: "fully_executed",
    admin_note: text(formData, "note"),
    updated_at: now,
  }).eq("id", row.id);
  const siblings = await siblingStates(instance.id);
  await supabaseAdmin.from("onboarding_acknowledgments").insert({
    item_id: row.id,
    user_id: instance.subject_user_id,
    role_at_time: instance.subject_role,
    document_version_id: row.version_id,
    referenced_versions: row.kind === "acknowledgment" ? referencedVersionSnapshot(siblings) : row.referenced_versions || [],
    provider: String(row.provider || ""),
    provider_ref: text(formData, "certificateRef"),
    final_document_ref: finalRef,
  });
  await audit({ instanceId: instance.id, itemId: row.id, actorId: who.userId, actorRole: "founder", subjectUserId: String(instance.subject_user_id), action: "externally_verified", previous: String(row.status), next: next.status, versionId: String(row.version_id), note: finalRef });
  await refreshCompletion(instance.id);
  refreshPaths();
  bounce("/admin/hr/onboarding", "ok", "External completion verified. The executed copy stays in the restricted personnel folder.");
}
