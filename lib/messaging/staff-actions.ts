"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";
import { canEditRequirements, internshipActorKind } from "@/lib/internship/manager-access";
import { canModerate, scanSensitive } from "@/lib/messaging/staff-policy";
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
  return "/admin/growth/messages";
}

function refreshMessages(path: string) {
  revalidatePath("/admin/growth/messages");
  revalidatePath("/manager/messages");
  revalidatePath(path);
}

async function actor() {
  const admin = await getAdminIdentity();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = admin?.id || user?.id || "";
  const kind = internshipActorKind({ role: admin?.role, isSuperUser: admin?.isSuperUser });
  const founder = canEditRequirements(kind);
  const growth = Boolean(admin && (isGrowthOnlyRole(admin.role) || founder));
  return { userId, founder, growth, role: founder ? "founder" as const : growth ? "growth" as const : "none" as const };
}

export async function postStaffMessage(formData: FormData) {
  const who = await actor();
  const home = messagesHome(formData);
  if (who.role === "none" || !who.userId) bounce(home, "error", "Sign in with a growth or founder login.");
  const body = field(formData, "body");
  const visibility = field(formData, "visibility") === "internal_note" ? "internal_note" : "participant";
  let media: { url: string; mimeType?: string; name?: string }[] = [];
  try {
    const parsed = JSON.parse(field(formData, "media") || "[]");
    if (Array.isArray(parsed)) {
      media = parsed.filter((item) => String(item?.url || "").startsWith("https://"));
    }
  } catch {
    media = [];
  }
  if (body.length < 1 && !media.length) bounce(home, "error", "Write a message or attach a file.");
  const sensitive = scanSensitive(body);
  if (sensitive.flag) bounce(home, "error", sensitive.message);
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("first_name, full_name, avatar_url")
    .eq("id", who.userId)
    .maybeSingle();
  const firstName =
    String(profile?.first_name || profile?.full_name || "")
      .trim()
      .split(/\s+/)[0] || "SitGuru";
  const preview = (body || (media[0]?.name ? `Attached ${media[0].name}` : "Attachment")).slice(0, 140);

  let conversationId = field(formData, "conversationId");
  if (!conversationId) {
    const { data, error } = await supabaseAdmin
      .from("conversations")
      .insert({
        subject: field(formData, "subject") || "Internal note",
        conversation_type: "internal_direct",
        workflow_status: "open",
        started_by_user_id: who.userId,
        last_message_preview: preview,
        last_message_at: new Date().toISOString(),
        retention_class: "standard_internal",
      })
      .select("id")
      .single();
    if (error || !data) bounce(home, "error", "The conversation could not be started.");
    conversationId = String(data.id);
    await supabaseAdmin.from("conversation_participants").insert({
      conversation_id: conversationId,
      user_id: who.userId,
      role: who.role,
    });
  }

  const { error } = await supabaseAdmin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: who.userId,
    recipient_id: who.userId,
    content: body || (media[0]?.name ? `Attached ${media[0].name}` : "Attachment"),
    body: body || (media[0]?.name ? `Attached ${media[0].name}` : "Attachment"),
    visibility,
    media_urls: media.map((item) => item.url),
    media_mime_types: media.map((item) => item.mimeType || "application/octet-stream"),
    sender_name_snapshot: firstName,
    status: "unread",
    created_at: new Date().toISOString(),
  });
  if (error) bounce(home, "error", "The message could not be saved.");
  refreshMessages(home);
  bounce(home, "ok", visibility === "internal_note" ? "Internal note saved." : "Message sent.");
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
