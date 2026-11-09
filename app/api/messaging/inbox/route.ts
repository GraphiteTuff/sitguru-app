import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { internshipActorKind } from "@/lib/internship/manager-access";
import { findInternByAccount } from "@/lib/internship/queries";
import { isTestInboxThread } from "@/lib/messaging/staff-directory";
import { resolvePetParentAvatarUrl } from "@/lib/pet-parent-avatar";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function firstName(value: string) {
  return value.split(/\s+/).filter(Boolean)[0] || "SitGuru";
}

export async function GET() {
  const admin = await getAdminIdentity();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !admin) return NextResponse.json({ threads: [] }, { status: 401 });
  const userId = admin?.id || user?.id || "";
  const intern = userId ? await findInternByAccount({ userId, email: user?.email }) : null;
  const kind = internshipActorKind({
    role: admin?.role,
    isSuperUser: admin?.isSuperUser,
    isIntern: Boolean(intern),
  });
  if (kind === "none") return NextResponse.json({ threads: [] }, { status: 403 });

  const { data: memberships } = await supabaseAdmin
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId)
    .limit(80);
  const memberIds = new Set(((memberships || []) as { conversation_id?: string }[]).map((row) => text(row.conversation_id)));

  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("id,subject,conversation_type,workflow_status,last_message_preview,assigned_user_id,started_by_user_id,updated_at")
    .in("conversation_type", ["live_agent", "internal_direct", "community_direct"])
    .order("updated_at", { ascending: false })
    .limit(40);
  if (error) return NextResponse.json({ threads: [] });

  const rows = ((data || []) as Record<string, unknown>[]).filter((row) => {
    const id = text(row.id);
    return text(row.assigned_user_id) === userId || text(row.started_by_user_id) === userId || memberIds.has(id);
  }).slice(0, 20);

  const ids = rows.map((row) => text(row.id)).filter(Boolean);
  const { data: participants } = ids.length
    ? await supabaseAdmin.from("conversation_participants").select("conversation_id,user_id").in("conversation_id", ids)
    : { data: [] };
  const peerByConversation = new Map<string, string>();
  for (const row of (participants || []) as Record<string, unknown>[]) {
    const conversationId = text(row.conversation_id);
    const personId = text(row.user_id);
    if (!conversationId || !personId || personId === userId || peerByConversation.has(conversationId)) continue;
    peerByConversation.set(conversationId, personId);
  }
  for (const row of rows) {
    const id = text(row.id);
    if (peerByConversation.has(id)) continue;
    const assigned = text(row.assigned_user_id);
    const started = text(row.started_by_user_id);
    const peerId = assigned && assigned !== userId ? assigned : started && started !== userId ? started : "";
    if (peerId) peerByConversation.set(id, peerId);
  }
  const peerIds = [...new Set([...peerByConversation.values()].filter(Boolean))];
  const [{ data: profiles }, { data: interns }] = await Promise.all([
    peerIds.length
      ? supabaseAdmin.from("profiles").select("id,first_name,full_name,avatar_url,profile_photo_url,photo_url,image_url").in("id", peerIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    peerIds.length
      ? supabaseAdmin.from("internship_interns").select("user_id,full_name,preferred_name,avatar_url").in("user_id", peerIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);
  const people = new Map(
    ((profiles || []) as Record<string, unknown>[]).map((row) => [text(row.id), row]),
  );
  const internByUser = new Map(
    ((interns || []) as Record<string, unknown>[]).map((row) => [text(row.user_id), row]),
  );

  const { data: unread } = ids.length
    ? await supabaseAdmin
        .from("messages")
        .select("conversation_id,sender_id,status,is_read")
        .in("conversation_id", ids)
        .limit(200)
    : { data: [] };
  const unreadByConversation = new Map<string, number>();
  for (const row of (unread || []) as Record<string, unknown>[]) {
    if (text(row.sender_id) === userId) continue;
    const unreadMessage = row.is_read !== true && text(row.status) !== "read";
    if (!unreadMessage) continue;
    const id = text(row.conversation_id);
    unreadByConversation.set(id, (unreadByConversation.get(id) || 0) + 1);
  }

  const threads = rows.map((row) => {
    const id = text(row.id);
    const peerId = peerByConversation.get(id) || "";
    const peer = people.get(peerId);
    const intern = internByUser.get(peerId);
    const type = text(row.conversation_type);
    const name = peer
      ? firstName(text(peer.first_name) || text(peer.full_name))
      : firstName(text(intern?.preferred_name) || text(intern?.full_name) || text(row.subject)) || "Chat";
    const avatarUrl = (peer ? resolvePetParentAvatarUrl(peer) : "") || text(intern?.avatar_url);
    return {
      id,
      name,
      avatarUrl,
      detail: type === "live_agent" ? "Needs a live answer" : "Chat",
      preview: text(row.last_message_preview),
      unread: unreadByConversation.get(id) || 0,
      recipientId: peerId,
      subject: text(row.subject),
    };
  }).filter((thread) =>
    !isTestInboxThread({
      name: thread.name,
      subject: thread.subject,
      preview: thread.preview,
    }),
  ).map(({ subject: _subject, ...thread }) => thread);
  const waiting = threads.reduce((sum, thread) => sum + (thread.unread > 0 ? 1 : 0), 0);
  return NextResponse.json({ threads, waiting });
}
