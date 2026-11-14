import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolvePetParentAvatarUrl } from "@/lib/pet-parent-avatar";
import { findInternByAccount } from "@/lib/internship/queries";

export const dynamic = "force-dynamic";

function text(value: unknown) {
  return String(value ?? "").trim();
}

export async function GET(request: Request) {
  const admin = await getAdminIdentity();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = admin?.id || user?.id || "";
  if (!userId) return NextResponse.json({ messages: [] }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ messages: [] });
  const { data: member } = await supabaseAdmin
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", id)
    .eq("user_id", userId)
    .maybeSingle();
  const { data: owned } = member?.user_id
    ? { data: member }
    : await supabaseAdmin.from("conversations").select("id").eq("id", id).or(`started_by_user_id.eq.${userId},assigned_user_id.eq.${userId}`).maybeSingle();
  if (!owned && !admin?.isSuperUser) return NextResponse.json({ messages: [] }, { status: 403 });
  const { data } = await supabaseAdmin
    .from("messages")
    .select("id,sender_id,body,content,visibility,sender_name_snapshot,deleted_at,media_urls,media_mime_types,created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: false })
    .limit(150);
  const intern = await findInternByAccount({ userId, email: user?.email });
  const visibleRows = ((data || []) as Record<string, unknown>[])
    .filter(row => !intern || admin?.isSuperUser || text(row.visibility) !== "internal_note")
    .reverse();
  const senderIds = [...new Set(visibleRows.map(row => text(row.sender_id)).filter(Boolean))];
  const { data: profiles } = senderIds.length
    ? await supabaseAdmin.from("profiles").select("id,first_name,full_name,avatar_url,profile_photo_url,photo_url,image_url").in("id", senderIds)
    : { data: [] };
  const people = new Map(((profiles || []) as Record<string, unknown>[]).map((row) => [text(row.id), row]));
  const messages = visibleRows.map((row) => {
    const person = people.get(text(row.sender_id));
    const name = text(person?.first_name) || text(person?.full_name).split(/\s+/)[0] || text(row.sender_name_snapshot) || "SitGuru";
    return {
      id: text(row.id),
      author: name,
      avatarUrl: person ? resolvePetParentAvatarUrl(person) : "",
      body: row.deleted_at ? "Message removed" : text(row.body || row.content),
      createdAt: text(row.created_at),
      internal: text(row.visibility) === "internal_note",
      own: text(row.sender_id) === userId,
      attachments: (Array.isArray(row.media_urls) ? row.media_urls : [])
        .map((url, index) => ({
          url: String(url),
          mimeType: String(Array.isArray(row.media_mime_types) ? row.media_mime_types[index] || "" : ""),
          name: "Attachment",
        })),
    };
  });
  return NextResponse.json({ messages });
}
