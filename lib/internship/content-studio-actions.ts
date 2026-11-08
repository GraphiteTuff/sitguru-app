"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { canUseGrowthPortal } from "@/lib/admin/growth/access";
import {
  canRecordPublication,
  canReviewAssignedContent,
  contentCreativeKey,
  contentEditResetsApproval,
  studioDecision,
  studioNextAction,
  studioStatusLabel,
  studioSummary,
  type StudioItem,
} from "@/lib/internship/content-studio";
import { findInternByAccount } from "@/lib/internship/queries";
import { statusForStage } from "@/lib/internship/review-flow";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type StudioContentRow = StudioItem & {
  id: string;
  internId: string;
  internName: string;
  title: string;
  contentType: string;
  platform: string;
  caption: string;
  draftUrl: string;
  dueOn: string;
  notes: string;
  feedback: string;
  campaignId: string;
  taskId: string;
  assetIds: string[];
  createdAt: string;
};

export type StudioAssetChoice = {
  id: string;
  title: string;
  category: string;
  mimeType: string;
  fileName: string;
};

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function bounce(path: string, kind: "ok" | "error", message: string): never {
  const params = new URLSearchParams();
  params.set(kind, message);
  redirect(`${path}?${params.toString()}`);
}

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function mapRow(row: Record<string, unknown>, internName: string, assetIds: string[]): StudioContentRow {
  const publishedUrl = String(row.published_url || "");
  const reviewStage = String(row.review_stage || "");
  const status = String(row.status || "");
  return {
    id: String(row.id),
    internId: String(row.intern_id),
    internName,
    title: String(row.title || "Untitled"),
    contentType: String(row.content_type || "social_post"),
    platform: String(row.platform || ""),
    caption: String(row.caption || ""),
    draftUrl: String(row.draft_url || ""),
    publishedUrl,
    dueOn: String(row.due_on || ""),
    plannedAt: String(row.planned_at || ""),
    notes: String(row.student_notes || ""),
    feedback: String(row.supervisor_notes || ""),
    status,
    reviewStage,
    campaignId: String(row.campaign_id || ""),
    taskId: String(row.task_id || ""),
    assetIds,
    createdAt: String(row.created_at || ""),
  };
}

async function assetMap(contentIds: string[]) {
  const grouped = new Map<string, string[]>();
  if (!contentIds.length) return grouped;
  const { data } = await supabaseAdmin
    .from("internship_content_assets")
    .select("content_id,asset_id")
    .in("content_id", contentIds);
  for (const row of data || []) {
    const id = String(row.content_id);
    const list = grouped.get(id) || [];
    list.push(String(row.asset_id));
    grouped.set(id, list);
  }
  return grouped;
}

export async function loadApprovedBrandChoices(): Promise<StudioAssetChoice[]> {
  const { data, error } = await supabaseAdmin
    .from("growth_brand_assets")
    .select("id,title,category,mime_type,file_name")
    .eq("verified", true)
    .eq("approval_status", "approved")
    .order("title")
    .limit(48);
  if (error) return [];
  return (data || []).map((row) => ({
    id: String(row.id),
    title: String(row.title || row.file_name),
    category: String(row.category || ""),
    mimeType: String(row.mime_type || ""),
    fileName: String(row.file_name || ""),
  }));
}

export async function loadManagerContentStudio(actorUserId: string, isSuperUser: boolean) {
  const { data: interns } = await supabaseAdmin
    .from("internship_interns")
    .select("id,full_name,preferred_name,manager_user_id,status")
    .in("status", ["accepted", "active", "approved"]);
  const visible = (interns || []).filter((intern) =>
    isSuperUser ? true : String(intern.manager_user_id || "") === actorUserId,
  );
  const names = new Map(
    visible.map((intern) => [String(intern.id), String(intern.preferred_name || intern.full_name || "Intern")]),
  );
  const ids = [...names.keys()];
  if (!ids.length) {
    return { items: [] as StudioContentRow[], summary: studioSummary([]), escalated: 0 };
  }
  const { data } = await supabaseAdmin
    .from("internship_content")
    .select("*")
    .in("intern_id", ids)
    .order("created_at", { ascending: false })
    .limit(80);
  const links = await assetMap((data || []).map((row) => String(row.id)));
  const items = (data || []).map((row) => mapRow(row, names.get(String(row.intern_id)) || "Intern", links.get(String(row.id)) || []));
  const summary = studioSummary(items);
  return { items, summary, escalated: summary.escalated };
}

export async function countPendingContentReviews(actorUserId: string, isSuperUser: boolean) {
  const studio = await loadManagerContentStudio(actorUserId, isSuperUser);
  return studio.summary.pending;
}

export async function loadInternContentStudio(internId: string) {
  const [{ data }, assets, campaigns, tasks] = await Promise.all([
    supabaseAdmin.from("internship_content").select("*").eq("intern_id", internId).order("created_at", { ascending: false }).limit(40),
    loadApprovedBrandChoices(),
    supabaseAdmin.from("internship_campaigns").select("id,name").eq("intern_id", internId).order("created_at", { ascending: false }).limit(20),
    supabaseAdmin.from("internship_tasks").select("id,title").eq("intern_id", internId).order("due_on", { ascending: true }).limit(20),
  ]);
  const links = await assetMap((data || []).map((row) => String(row.id)));
  const items = (data || []).map((row) => mapRow(row, "You", links.get(String(row.id)) || []));
  return {
    items,
    assets,
    campaigns: (campaigns.data || []).map((row) => ({ id: String(row.id), name: String(row.name) })),
    tasks: (tasks.data || []).map((row) => ({ id: String(row.id), title: String(row.title) })),
    summary: studioSummary(items),
  };
}

async function replaceAssets(contentId: string, assetIds: string[]) {
  await supabaseAdmin.from("internship_content_assets").delete().eq("content_id", contentId);
  const unique = [...new Set(assetIds.filter(Boolean))];
  if (!unique.length) return;
  const { data } = await supabaseAdmin
    .from("growth_brand_assets")
    .select("id")
    .in("id", unique)
    .eq("verified", true)
    .eq("approval_status", "approved");
  const allowed = (data || []).map((row) => String(row.id));
  if (!allowed.length) return;
  await supabaseAdmin.from("internship_content_assets").insert(
    allowed.map((assetId) => ({ content_id: contentId, asset_id: assetId })),
  );
}

export async function saveStudioContent(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/intern/login");
  const intern = await findInternByAccount({ userId: user.id, email: user.email });
  const internId = text(formData, "internId");
  if (!intern || intern.id !== internId) bounce("/intern/content", "error", "This content belongs to another intern.");
  const title = text(formData, "title");
  if (!title) bounce("/intern/content", "error", "Add a content title.");
  const assetIds = formData.getAll("assetId").map((value) => String(value));
  const caption = text(formData, "caption");
  const draftUrl = text(formData, "draftUrl");
  const platform = text(formData, "platform");
  const key = contentCreativeKey({ caption, draftUrl, platform, assetIds });
  const existingId = text(formData, "id");
  const payload = {
    title,
    content_type: text(formData, "contentType") || "social_post",
    platform,
    caption,
    draft_url: draftUrl,
    student_notes: text(formData, "notes"),
    planned_at: text(formData, "plannedAt") || null,
    campaign_id: text(formData, "campaignId") || null,
    task_id: text(formData, "taskId") || null,
    due_on: text(formData, "plannedAt").slice(0, 10) || null,
  };

  let contentId = existingId;
  if (existingId) {
    const { data: existing } = await supabaseAdmin
      .from("internship_content")
      .select("review_stage,approved_snapshot,status")
      .eq("id", existingId)
      .eq("intern_id", internId)
      .maybeSingle();
    if (!existing) bounce("/intern/content", "error", "That draft was not found.");
    const reset = contentEditResetsApproval({
      reviewStage: String(existing.review_stage || existing.status || ""),
      approvedSnapshot: String(existing.approved_snapshot || ""),
      nextKey: key,
    });
    const { error } = await supabaseAdmin
      .from("internship_content")
      .update({
        ...payload,
        ...(reset
          ? { review_stage: "draft", status: "in_progress", supervisor_approved: false, approved_snapshot: "" }
          : {}),
      })
      .eq("id", existingId)
      .eq("intern_id", internId);
    if (error) bounce("/intern/content", "error", error.message);
    if (reset) {
      await supabaseAdmin.from("internship_review_events").insert({
        intern_id: internId,
        target_type: "content",
        target_id: existingId,
        reviewer_id: user.id,
        reviewer_role: "intern",
        review_stage: "draft",
        status: "draft",
        comment: "Approval cleared because the caption, creative, platform, or brand assets changed.",
      });
    }
  } else {
    const { data, error } = await supabaseAdmin
      .from("internship_content")
      .insert({ ...payload, intern_id: internId, status: "in_progress", review_stage: "draft" })
      .select("id")
      .single();
    if (error || !data) bounce("/intern/content", "error", error?.message || "Draft could not be saved.");
    contentId = String(data.id);
  }
  await replaceAssets(contentId, assetIds);

  if (text(formData, "intent") === "submit") {
    const { data: current } = await supabaseAdmin
      .from("internship_content")
      .select("review_stage,status")
      .eq("id", contentId)
      .maybeSingle();
    const decision = studioDecision({
      action: String(current?.review_stage || "") === "changes_requested" ? "resubmit" : "submit",
      stage: String(current?.review_stage || current?.status || "draft"),
      actor: "intern",
      comment: "",
    });
    if (!decision.ok) bounce("/intern/content", "error", decision.error);
    const now = new Date().toISOString();
    await supabaseAdmin.from("internship_content").update({
      review_stage: decision.stage,
      status: statusForStage(decision.stage),
      submitted_at: now,
      supervisor_approved: false,
    }).eq("id", contentId);
    await supabaseAdmin.from("internship_review_events").insert({
      intern_id: internId,
      target_type: "content",
      target_id: contentId,
      reviewer_id: user.id,
      reviewer_role: "intern",
      review_stage: decision.stage,
      status: decision.stage,
      comment: "Submitted for manager review.",
    });
  }

  revalidatePath("/intern/content");
  revalidatePath("/manager/campaigns-content");
  revalidatePath("/manager");
  bounce("/intern/content", "ok", text(formData, "intent") === "submit" ? "Submitted to your manager." : "Draft saved.");
}

export async function reviewStudioContent(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const admin = await getAdminIdentity();
  if (!admin || !canUseGrowthPortal(admin)) bounce("/manager/campaigns-content", "error", "Manager access is required.");
  const contentId = text(formData, "contentId");
  const internId = text(formData, "internId");
  const action = text(formData, "reviewAction");
  const comment = text(formData, "comment");
  if (!["approve", "request_changes", "escalate", "ceo_approve", "ceo_request_changes", "comment"].includes(action)) {
    bounce("/manager/campaigns-content", "error", "That review action is not available.");
  }
  const { data: intern } = await supabaseAdmin
    .from("internship_interns")
    .select("manager_user_id")
    .eq("id", internId)
    .maybeSingle();
  if (!canReviewAssignedContent({
    actorUserId: user.id,
    isSuperUser: admin.isSuperUser,
    managerUserId: intern?.manager_user_id ? String(intern.manager_user_id) : null,
  })) {
    bounce("/manager/campaigns-content", "error", "This intern is not on your team.");
  }
  const { data: current } = await supabaseAdmin
    .from("internship_content")
    .select("review_stage,status,caption,draft_url,platform")
    .eq("id", contentId)
    .eq("intern_id", internId)
    .maybeSingle();
  if (!current) bounce("/manager/campaigns-content", "error", "That content was not found.");
  const actor = admin.isSuperUser && (action === "ceo_approve" || action === "ceo_request_changes") ? "supervisor" : "manager";
  if (action === "comment") {
    if (!comment) bounce("/manager/campaigns-content", "error", "Add a note so the next person knows what to do.");
    await supabaseAdmin.from("internship_content").update({ supervisor_notes: comment }).eq("id", contentId);
    await supabaseAdmin.from("internship_review_events").insert({
      intern_id: internId,
      target_type: "content",
      target_id: contentId,
      reviewer_id: user.id,
      reviewer_role: actor,
      review_stage: String(current.review_stage || current.status || ""),
      status: String(current.status || ""),
      comment,
    });
    revalidatePath("/manager/campaigns-content");
    revalidatePath("/intern/content");
    bounce("/manager/campaigns-content", "ok", "Comment saved.");
  }
  const decision = studioDecision({
    action: action as "approve" | "request_changes" | "escalate" | "ceo_approve" | "ceo_request_changes",
    stage: String(current.review_stage || current.status || ""),
    actor,
    comment,
  });
  if (!decision.ok) bounce("/manager/campaigns-content", "error", decision.error);
  const { data: links } = await supabaseAdmin.from("internship_content_assets").select("asset_id").eq("content_id", contentId);
  const now = new Date().toISOString();
  const approved = decision.stage === "ava_approved" || decision.stage === "ceo_approved";
  const { error } = await supabaseAdmin.from("internship_content").update({
    review_stage: decision.stage,
    status: statusForStage(decision.stage),
    supervisor_notes: comment,
    supervisor_approved: approved,
    approved_at: approved ? now : null,
    approved_by: approved ? user.id : null,
    approved_snapshot: approved
      ? contentCreativeKey({
          caption: String(current.caption || ""),
          draftUrl: String(current.draft_url || ""),
          platform: String(current.platform || ""),
          assetIds: (links || []).map((row) => String(row.asset_id)),
        })
      : "",
  }).eq("id", contentId);
  if (error) bounce("/manager/campaigns-content", "error", error.message);
  await supabaseAdmin.from("internship_review_events").insert({
    intern_id: internId,
    target_type: "content",
    target_id: contentId,
    reviewer_id: user.id,
    reviewer_role: actor,
    review_stage: decision.stage,
    status: decision.stage,
    comment,
  });
  revalidatePath("/manager/campaigns-content");
  revalidatePath("/manager");
  revalidatePath("/intern/content");
  bounce("/manager/campaigns-content", "ok", approved ? "Content approved. It is not published yet." : "Review saved.");
}

export async function recordStudioPublication(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const admin = await getAdminIdentity();
  if (!admin || !canUseGrowthPortal(admin)) bounce("/manager/campaigns-content", "error", "Manager access is required.");
  const contentId = text(formData, "contentId");
  const internId = text(formData, "internId");
  const publishedUrl = text(formData, "publishedUrl");
  const { data: intern } = await supabaseAdmin.from("internship_interns").select("manager_user_id").eq("id", internId).maybeSingle();
  if (!canReviewAssignedContent({
    actorUserId: user.id,
    isSuperUser: admin.isSuperUser,
    managerUserId: intern?.manager_user_id ? String(intern.manager_user_id) : null,
  })) {
    bounce("/manager/campaigns-content", "error", "This intern is not on your team.");
  }
  const { data: current } = await supabaseAdmin.from("internship_content").select("review_stage,status").eq("id", contentId).eq("intern_id", internId).maybeSingle();
  if (!current) bounce("/manager/campaigns-content", "error", "That content was not found.");
  const blocked = canRecordPublication({
    reviewStage: String(current.review_stage || current.status || ""),
    publishedUrl,
  });
  if (blocked) bounce("/manager/campaigns-content", "error", blocked);
  const { error } = await supabaseAdmin.from("internship_content").update({
    published_url: publishedUrl,
    published_at: new Date().toISOString(),
    published_by: user.id,
  }).eq("id", contentId);
  if (error) bounce("/manager/campaigns-content", "error", error.message);
  await supabaseAdmin.from("internship_review_events").insert({
    intern_id: internId,
    target_type: "content",
    target_id: contentId,
    reviewer_id: user.id,
    reviewer_role: admin.isSuperUser ? "supervisor" : "manager",
    review_stage: "published",
    status: "published",
    comment: publishedUrl,
  });
  revalidatePath("/manager/campaigns-content");
  revalidatePath("/intern/content");
  bounce("/manager/campaigns-content", "ok", "Published link recorded. Opening a social app does not count as published.");
}

export function studioRowLabel(row: StudioContentRow) {
  return {
    status: studioStatusLabel(row.status, row.reviewStage, row.publishedUrl),
    action: studioNextAction(row.status, row.reviewStage, row.publishedUrl),
  };
}
