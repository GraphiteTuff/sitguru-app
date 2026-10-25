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
  if (who.role === "none" || !who.userId) bounce("/admin/growth/messages", "error", "Sign in with a growth or founder login.");
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
  if (body.length < 1 && !media.length) bounce("/admin/growth/messages", "error", "Write a message or attach a file.");
  const sensitive = scanSensitive(body);
  if (sensitive.flag) bounce("/admin/growth/messages", "error", sensitive.message);
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
    if (error || !data) bounce("/admin/growth/messages", "error", "The conversation could not be started.");
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
  if (error) bounce("/admin/growth/messages", "error", "The message could not be saved.");
  revalidatePath("/admin/growth/messages");
  bounce("/admin/growth/messages", "ok", visibility === "internal_note" ? "Internal note saved." : "Message sent.");
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
