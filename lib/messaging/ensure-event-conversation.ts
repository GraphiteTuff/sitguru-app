import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPartnerByIdAdmin } from "@/lib/community/partner-access";

export type EnsureEventConversationInput = {
  eventId: string;
  initiatedByUserId: string;
  initiatedByRole?: "admin" | "partner" | "customer" | "guru" | "ambassador";
  opener?: string;
};

export type EnsureEventConversationResult = {
  ok: true;
  conversationId: string;
  created: boolean;
  eventTitle: string;
  partnerName: string | null;
  hrefAdmin: string;
  hrefPartner: string;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function isAdminUser(userId: string) {
  const [adminUsers, profiles] = await Promise.all([
    supabaseAdmin.from("admin_users").select("user_id").eq("user_id", userId).limit(1),
    supabaseAdmin.from("profiles").select("role").eq("id", userId).limit(1),
  ]);

  if (adminUsers.data?.length) return true;

  const role = safeString(
    (profiles.data?.[0] as { role?: string } | undefined)?.role,
  ).toLowerCase();

  return role.includes("admin");
}

async function loadCommunityDepartmentAdminIds(excludeUserId: string) {
  const { data } = await supabaseAdmin
    .from("admin_user_access")
    .select("user_id,is_active")
    .eq("department_key", "community")
    .limit(50);

  return (data || [])
    .map((row) => {
      const userId = safeString((row as { user_id?: string }).user_id);
      const active =
        (row as { is_active?: boolean }).is_active === undefined
          ? true
          : Boolean((row as { is_active?: boolean }).is_active);
      if (!active || !userId || userId === excludeUserId) return null;
      return userId;
    })
    .filter(Boolean) as string[];
}

export async function ensureCommunityEventConversation(
  input: EnsureEventConversationInput,
): Promise<EnsureEventConversationResult | { ok: false; error: string }> {
  const eventId = safeString(input.eventId);
  const initiatedByUserId = safeString(input.initiatedByUserId);

  if (!eventId || !initiatedByUserId) {
    return { ok: false, error: "Event and user are required." };
  }

  const { data: event, error: eventError } = await supabaseAdmin
    .from("community_events")
    .select("id, title, slug, partner_id, created_by, status")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !event) {
    return { ok: false, error: "Community event not found." };
  }

  const partner = event.partner_id
    ? await getPartnerByIdAdmin(String(event.partner_id))
    : null;

  const partnerManagerUserId =
    safeString(partner?.owner_user_id) || safeString(event.created_by) || "";

  const requesterIsAdmin = await isAdminUser(initiatedByUserId);
  const requesterIsPartner =
    partnerManagerUserId && initiatedByUserId === partnerManagerUserId;

  if (!requesterIsAdmin && !requesterIsPartner) {
    const { data: partnerRow } = partner?.id
      ? await supabaseAdmin
          .from("partners")
          .select("owner_user_id")
          .eq("id", partner.id)
          .maybeSingle()
      : { data: null };

    const ownerId = safeString((partnerRow as { owner_user_id?: string } | null)?.owner_user_id);
    if (ownerId !== initiatedByUserId) {
      return { ok: false, error: "You do not have access to this event thread." };
    }
  }

  const { data: existing } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("community_event_id", eventId)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const now = new Date().toISOString();
  const partnerName = partner?.business_name || null;
  const subject = `${event.title} · Pet Event`;
  const preview =
    safeString(input.opener) ||
    `Event coordination thread for ${event.title}${partnerName ? ` (${partnerName})` : ""}.`;

  let conversationId = safeString(existing?.id);
  let created = false;

  if (!conversationId) {
    const insertPayload: Record<string, unknown> = {
      community_event_id: eventId,
      started_by_user_id: initiatedByUserId,
      subject,
      status: "open",
      topic: "community_event",
      last_message_at: now,
      last_message_preview: preview.slice(0, 240),
      created_at: now,
      updated_at: now,
    };

    if (partnerManagerUserId) {
      insertPayload.customer_id = partnerManagerUserId;
    }

    const { data: createdRow, error: createError } = await supabaseAdmin
      .from("conversations")
      .insert(insertPayload)
      .select("id")
      .maybeSingle();

    if (createError || !createdRow?.id) {
      return {
        ok: false,
        error: createError?.message || "Could not create event conversation.",
      };
    }

    conversationId = String(createdRow.id);
    created = true;
  }

  const participantRows: Array<Record<string, unknown>> = [];

  if (partnerManagerUserId) {
    participantRows.push({
      conversation_id: conversationId,
      user_id: partnerManagerUserId,
      role: "ambassador",
      created_at: now,
      updated_at: now,
    });
  }

  if (requesterIsAdmin) {
    participantRows.push({
      conversation_id: conversationId,
      user_id: initiatedByUserId,
      role: "admin",
      created_at: now,
      updated_at: now,
    });
  } else if (initiatedByUserId !== partnerManagerUserId) {
    participantRows.push({
      conversation_id: conversationId,
      user_id: initiatedByUserId,
      role: input.initiatedByRole || "ambassador",
      created_at: now,
      updated_at: now,
    });
  }

  const departmentAdmins = await loadCommunityDepartmentAdminIds(initiatedByUserId);
  for (const adminId of departmentAdmins) {
    participantRows.push({
      conversation_id: conversationId,
      user_id: adminId,
      role: "admin",
      created_at: now,
      updated_at: now,
    });
  }

  const uniqueParticipants = Array.from(
    new Map(
      participantRows.map((row) => [safeString(row.user_id), row]),
    ).values(),
  );

  if (uniqueParticipants.length) {
    await supabaseAdmin.from("conversation_participants").upsert(uniqueParticipants, {
      onConflict: "conversation_id,user_id",
    });
  }

  if (created && preview) {
    await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      sender_id: initiatedByUserId,
      sender_role: requesterIsAdmin ? "admin" : "ambassador",
      sender_role_snapshot: requesterIsAdmin ? "admin" : "partner",
      sender_name_snapshot: requesterIsAdmin ? "SitGuru Admin" : partnerName || "Event Manager",
      content: preview,
      body: preview,
      message_type: "community_event",
      topic: "community_event",
      status: "unread",
      is_read: false,
      created_at: now,
    });
  }

  await supabaseAdmin
    .from("conversations")
    .update({
      subject,
      topic: "community_event",
      community_event_id: eventId,
      updated_at: now,
      status: "open",
    })
    .eq("id", conversationId);

  return {
    ok: true,
    conversationId,
    created,
    eventTitle: String(event.title),
    partnerName,
    hrefAdmin: `/admin/messages/${encodeURIComponent(conversationId)}`,
    hrefPartner: `/messages/${encodeURIComponent(conversationId)}`,
  };
}
