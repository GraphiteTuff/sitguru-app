"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";
import { canEditRequirements, internshipActorKind } from "@/lib/internship/manager-access";
import { canAccessConversation, canModerate, scanSensitive } from "@/lib/messaging/staff-policy";
import { findInternByAccount } from "@/lib/internship/queries";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function bounce(path: string, kind: "ok" | "error", message: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(message)}`);
}

/** Manager Portal or Admin Growth messages — never arbitrary returnTo. */
function messagesHome(formData?: FormData) {
  const raw = formData ? field(formData, "returnTo") : "";
  if (raw === "/manager/messages" || raw.startsWith("/manager/messages?")) {
    return "/manager/messages";
  }
  if (raw === "/intern/messages" || raw.startsWith("/intern/messages?")) {
    return "/intern/messages";
  }
  return "/admin/growth/messages";
}

function refreshMessages(path: string) {
  revalidatePath("/admin/growth/messages");
  revalidatePath("/manager/messages");
  revalidatePath("/intern/messages");
  revalidatePath(path);
}

async function actor() {
  const admin = await getAdminIdentity();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = admin?.id || user?.id || "";
  const intern = userId ? await findInternByAccount({ userId, email: user?.email }) : null;
  const kind = internshipActorKind({
    role: admin?.role,
    isSuperUser: admin?.isSuperUser,
    isIntern: Boolean(intern),
  });
  const founder = canEditRequirements(kind);
  const growth = Boolean(admin && (isGrowthOnlyRole(admin.role) || founder));
  const role = founder ? "founder" as const : growth ? "growth" as const : intern ? "intern" as const : "none" as const;
  return { userId, founder, growth, intern, role, kind };
}

export async function saveStaffMessage(input: {
  conversationId?: string;
  subject?: string;
  body?: string;
  visibility?: string;
  media?: { url: string; mimeType?: string; name?: string }[];
  recipientId?: string;
  audience?: string;
}) {
  const who = await actor();
  if (who.role === "none" || !who.userId) return { ok: false as const, error: "Sign in to send a SitGuru message." };
  const body = String(input.body || "").trim();
  const media = (input.media || []).filter((item) => String(item.url || "").startsWith("https://"));
  if (body.length < 1 && !media.length) return { ok: false as const, error: "Write a message or attach a file." };
  const sensitive = scanSensitive(body);
  if (sensitive.flag) return { ok: false as const, error: sensitive.message };
  const visibility = who.role === "intern" ? "participant" : input.visibility === "internal_note" ? "internal_note" : "participant";
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("first_name, full_name, avatar_url, profile_photo_url")
    .eq("id", who.userId)
    .maybeSingle();
  const firstName = String(profile?.first_name || profile?.full_name || "").trim().split(/\s+/)[0] || "SitGuru";
  const avatarUrl = String(profile?.avatar_url || profile?.profile_photo_url || "");
  const preview = (body || (media[0]?.name ? `Attached ${media[0].name}` : "Attachment")).slice(0, 140);
  let conversationId = String(input.conversationId || "");
  let peerName = "";
  let peerAvatar = "";
  const recipientId = String(input.recipientId || "");

  if (recipientId && recipientId !== who.userId) {
    if (who.role === "intern" && recipientId !== who.intern?.managerUserId) {
      return { ok: false as const, error: "You can message your manager from here." };
    }
    const { data: mine } = await supabaseAdmin.from("conversation_participants").select("conversation_id").eq("user_id", who.userId).limit(100);
    const mineIds = (mine || []).map((row) => String(row.conversation_id || "")).filter(Boolean);
    if (mineIds.length) {
      const { data: shared } = await supabaseAdmin
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", recipientId)
        .in("conversation_id", mineIds)
        .limit(1)
        .maybeSingle();
      if (shared?.conversation_id) conversationId = String(shared.conversation_id);
    }
    const { data: peer } = await supabaseAdmin.from("profiles").select("first_name, full_name, avatar_url, profile_photo_url").eq("id", recipientId).maybeSingle();
    peerName = String(peer?.first_name || peer?.full_name || "").trim().split(/\s+/)[0] || "SitGuru";
    peerAvatar = String(peer?.avatar_url || peer?.profile_photo_url || "");
  }

  if (conversationId && who.role === "intern") {
    const { data: existing } = await supabaseAdmin
      .from("conversations")
      .select("id,conversation_type,assigned_user_id,started_by_user_id")
      .eq("id", conversationId)
      .maybeSingle();
    const allowed = existing && canAccessConversation({
      actor: "intern",
      actorId: who.userId,
      type: String(existing.conversation_type || "internal_direct") as "internal_direct",
      participantIds: [who.userId],
      assignedUserId: String(existing.assigned_user_id || ""),
    });
    const started = String(existing?.started_by_user_id || "") === who.userId;
    if (!allowed && !started) return { ok: false as const, error: "That conversation is not yours." };
  }

  if (!conversationId) {
    const managerId = who.role === "intern" ? who.intern?.managerUserId || null : recipientId || null;
    const audience = String(input.audience || "");
    const { data, error } = await supabaseAdmin
      .from("conversations")
      .insert({
        subject: String(input.subject || "").trim() || peerName || (who.role === "intern" ? "Note for my manager" : "SitGuru chat"),
        conversation_type: audience === "intern" || who.role === "intern" ? "internal_direct" : "community_direct",
        workflow_status: "open",
        started_by_user_id: who.userId,
        assigned_user_id: managerId,
        last_message_preview: preview,
        last_message_at: new Date().toISOString(),
        retention_class: "standard_internal",
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false as const, error: "The conversation could not be started." };
    conversationId = String(data.id);
    await supabaseAdmin.from("conversation_participants").insert([
      { conversation_id: conversationId, user_id: who.userId, role: who.role },
      ...(managerId ? [{ conversation_id: conversationId, user_id: managerId, role: audience || "growth" }] : []),
    ]);
  }

  const now = new Date().toISOString();
  const textBody = body || (media[0]?.name ? `Attached ${media[0].name}` : "Attachment");
  const { data: saved, error } = await supabaseAdmin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: who.userId,
    recipient_id: recipientId || who.userId,
    content: textBody,
    body: textBody,
    visibility,
    media_urls: media.map((item) => item.url),
    media_mime_types: media.map((item) => item.mimeType || "application/octet-stream"),
    sender_name_snapshot: firstName,
    status: "unread",
    created_at: now,
  }).select("id").single();
  if (error || !saved?.id) return { ok: false as const, error: "The message could not be saved." };
  await supabaseAdmin.from("conversations").update({
    last_message_preview: preview,
    last_message_at: now,
    updated_at: now,
  }).eq("id", conversationId);
  refreshMessages("/manager/messages");
  return {
    ok: true as const,
    conversationId,
    peerName,
    peerAvatar,
    message: {
      id: String(saved.id),
      author: firstName,
      avatarUrl,
      body: textBody,
      createdAt: now,
      internal: visibility === "internal_note",
      attachments: media.map((item) => ({ url: item.url, mimeType: item.mimeType || "", name: item.name || "Attachment" })),
    },
  };
}

export async function postStaffMessage(formData: FormData) {
  const home = messagesHome(formData);
  let media: { url: string; mimeType?: string; name?: string }[] = [];
  try {
    const parsed = JSON.parse(field(formData, "media") || "[]");
    if (Array.isArray(parsed)) media = parsed;
  } catch {
    media = [];
  }
  const saved = await saveStaffMessage({
    conversationId: field(formData, "conversationId"),
    subject: field(formData, "subject"),
    body: field(formData, "body"),
    visibility: field(formData, "visibility"),
    media,
  });
  if (!saved.ok) bounce(home, "error", saved.error);
  bounce(home, "ok", "Message sent.");
}

export async function resolveMessageReport(formData: FormData) {
  const who = await actor();
  if (!canModerate(who.role)) bounce("/admin/messages/moderation", "error", "Only the founder can review message reports.");
  const reportId = field(formData, "reportId");
  const action = field(formData, "action") || "resolve";
  await supabaseAdmin.from("message_reports").update({ status: "resolved" }).eq("id", reportId);
  await supabaseAdmin.from("messaging_moderation_events").insert({
    actor_id: who.userId,
    actor_role: "founder",
    action,
    report_id: reportId,
    note: field(formData, "note"),
  });
  revalidatePath("/admin/messages/moderation");
  bounce("/admin/messages/moderation", "ok", "Report updated. The original message was not rewritten.");
}

export async function assignConversation(formData: FormData) {
  const who = await actor();
  const home = messagesHome(formData);
  if (who.role === "none") bounce(home, "error", "You cannot assign this conversation.");
  const conversationId = field(formData, "conversationId");
  const assignee = field(formData, "assigneeId");
  await supabaseAdmin.from("conversations").update({
    assigned_user_id: assignee || null,
    assigned_by: who.userId,
    assigned_at: new Date().toISOString(),
    workflow_status: assignee ? "assigned" : "unassigned",
  }).eq("id", conversationId);
  refreshMessages(home);
  bounce(home, "ok", assignee ? "Conversation assigned." : "Conversation is unassigned.");
}

export async function saveMessagingPermission(formData: FormData) {
  const who = await actor();
  if (who.role === "none") bounce("/intern/manage", "error", "You cannot change messaging permissions.");
  const userId = field(formData, "userId");
  const level = field(formData, "level") || "none";
  const review = field(formData, "review") || "all";
  await supabaseAdmin.from("messaging_permissions").upsert({
    user_id: userId,
    permission_level: level,
    review_level: review,
    audiences: field(formData, "audiences"),
    updated_by: who.userId,
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/intern/manage");
  bounce("/intern/manage", "ok", "Messaging permission saved.");
}

export async function reportMessage(formData: FormData) {
  const who = await actor();
  if (!who.userId) bounce(field(formData, "returnTo") || "/admin/messages", "error", "Sign in to report a message.");
  const route = who.role === "none" ? "founder" : "moderation_queue";
  await supabaseAdmin.from("message_reports").insert({
    message_id: field(formData, "messageId") || null,
    conversation_id: field(formData, "conversationId") || null,
    reporter_id: who.userId,
    reason: field(formData, "reason") || "Other",
    status: "open",
    route_to: field(formData, "targetIsManager") === "yes" ? "founder" : route,
  });
  bounce(field(formData, "returnTo") || "/admin/growth/messages", "ok", "Report sent to the founder review queue.");
}
