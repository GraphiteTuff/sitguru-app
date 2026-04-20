import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type GuruLookupRow = {
  id?: string | number | null;
  user_id?: string | null;
  slug?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  email?: string | null;
};

type ProfileLookupRow = {
  id?: string | null;
  slug?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  email?: string | null;
  role?: string | null;
};

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  booking_id?: string | null;
  status?: string | null;
};

type ConversationParticipantRow = {
  conversation_id: string;
  user_id: string;
  role?: string | null;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildMessageThreadHref(conversationId: string) {
  return `/messages/${conversationId}`;
}

function normalizeRole(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getDisplayName(profile?: {
  full_name?: string | null;
  display_name?: string | null;
  email?: string | null;
}) {
  return (
    safeString(profile?.display_name) ||
    safeString(profile?.full_name) ||
    safeString(profile?.email) ||
    "SitGuru User"
  );
}

async function getProfileById(userId: string) {
  if (!userId) return null;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, slug, full_name, display_name, email, role")
    .eq("id", userId)
    .maybeSingle<ProfileLookupRow>();

  if (error) {
    console.error("Profile lookup by id error:", error.message);
    return null;
  }

  return data ?? null;
}

async function isGuruUser(userId: string) {
  if (!userId) return false;

  const [byUserId, byId] = await Promise.all([
    supabaseAdmin.from("gurus").select("id").eq("user_id", userId).limit(1),
    supabaseAdmin.from("gurus").select("id").eq("id", userId).limit(1),
  ]);

  return (byUserId.data?.length ?? 0) > 0 || (byId.data?.length ?? 0) > 0;
}

async function resolveUserRole(userId: string, roleHint?: string | null) {
  const hinted = normalizeRole(roleHint);

  if (hinted) {
    if (hinted === "sitter" || hinted === "provider") return "guru";
    return hinted;
  }

  const profile = await getProfileById(userId);
  const profileRole = normalizeRole(profile?.role);

  if (profileRole) {
    if (profileRole === "sitter" || profileRole === "provider") return "guru";
    return profileRole;
  }

  if (await isGuruUser(userId)) {
    return "guru";
  }

  return "customer";
}

async function findGuruBySlugOrId(guruSlugOrId: string) {
  const directBySlug = await supabaseAdmin
    .from("gurus")
    .select("id, user_id, slug, full_name, display_name, email")
    .eq("slug", guruSlugOrId)
    .maybeSingle<GuruLookupRow>();

  if (!directBySlug.error && directBySlug.data) {
    return directBySlug.data;
  }

  const directById = await supabaseAdmin
    .from("gurus")
    .select("id, user_id, slug, full_name, display_name, email")
    .eq("id", guruSlugOrId)
    .maybeSingle<GuruLookupRow>();

  if (!directById.error && directById.data) {
    return directById.data;
  }

  const profileBySlug = await supabaseAdmin
    .from("profiles")
    .select("id, slug, full_name, display_name, email")
    .eq("slug", guruSlugOrId)
    .maybeSingle<ProfileLookupRow>();

  if (!profileBySlug.error && profileBySlug.data?.id) {
    return {
      id: profileBySlug.data.id,
      user_id: profileBySlug.data.id,
      slug: profileBySlug.data.slug ?? guruSlugOrId,
      full_name: profileBySlug.data.full_name ?? null,
      display_name: profileBySlug.data.display_name ?? null,
      email: profileBySlug.data.email ?? null,
    } satisfies GuruLookupRow;
  }

  return null;
}

async function findAdminUser(adminUserId?: string) {
  const explicitAdminId = safeString(adminUserId);

  if (explicitAdminId) {
    const explicitProfile = await getProfileById(explicitAdminId);
    if (explicitProfile?.id) {
      return explicitProfile;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, slug, full_name, display_name, email, role")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle<ProfileLookupRow>();

  if (error) {
    console.error("Admin profile lookup error:", error.message);
    return null;
  }

  return data ?? null;
}

async function getTargetUser(params: {
  guruSlug: string;
  guruId: string;
  targetUserId: string;
  targetRole: string;
  adminUserId: string;
}) {
  const normalizedTargetRole = normalizeRole(params.targetRole);
  const directTargetUserId = safeString(params.targetUserId);

  const wantsAdmin =
    normalizedTargetRole === "admin" ||
    normalizedTargetRole === "support" ||
    normalizeRole(params.guruSlug) === "admin" ||
    normalizeRole(params.guruId) === "admin";

  if (wantsAdmin) {
    const adminProfile = await findAdminUser(params.adminUserId);

    if (!adminProfile?.id) {
      return null;
    }

    return {
      userId: adminProfile.id,
      role: "admin",
      profile: adminProfile,
    };
  }

  if (directTargetUserId) {
    const targetProfile = await getProfileById(directTargetUserId);

    if (!targetProfile?.id) {
      return null;
    }

    const resolvedRole = await resolveUserRole(
      directTargetUserId,
      normalizedTargetRole || targetProfile.role || null
    );

    return {
      userId: directTargetUserId,
      role: resolvedRole,
      profile: targetProfile,
    };
  }

  const guruLookupValue = safeString(params.guruSlug) || safeString(params.guruId);

  if (!guruLookupValue) {
    return null;
  }

  const guru = await findGuruBySlugOrId(guruLookupValue);

  if (!guru?.user_id) {
    return null;
  }

  return {
    userId: guru.user_id,
    role: "guru",
    profile: {
      id: guru.user_id,
      slug: safeString(guru.slug) || null,
      full_name: safeString(guru.full_name) || null,
      display_name: safeString(guru.display_name) || null,
      email: safeString(guru.email) || null,
      role: "guru",
    } satisfies ProfileLookupRow,
  };
}

async function findExistingConversationByParticipants(
  userA: string,
  userB: string,
  bookingId: string | null
) {
  const { data: participantRows, error: participantError } = await supabaseAdmin
    .from("conversation_participants")
    .select("conversation_id, user_id, role")
    .in("user_id", [userA, userB]);

  if (participantError) {
    console.error("Existing participant conversation lookup error:", participantError.message);
    return null;
  }

  const counts = new Map<string, Set<string>>();

  for (const row of (participantRows ?? []) as ConversationParticipantRow[]) {
    const set = counts.get(row.conversation_id) ?? new Set<string>();
    set.add(row.user_id);
    counts.set(row.conversation_id, set);
  }

  const candidateIds = Array.from(counts.entries())
    .filter(([, users]) => users.has(userA) && users.has(userB))
    .map(([conversationId]) => conversationId);

  if (candidateIds.length === 0) {
    return null;
  }

  let query = supabaseAdmin
    .from("conversations")
    .select("id, customer_id, guru_id, booking_id, status")
    .in("id", candidateIds)
    .eq("status", "open")
    .limit(25);

  if (bookingId) {
    query = query.eq("booking_id", bookingId);
  }

  const { data, error } = await query.returns<ConversationRow[]>();

  if (error) {
    console.error("Existing conversation detail lookup error:", error.message);
    return null;
  }

  const exact =
    (data ?? []).find((row) => {
      if (bookingId) {
        return row.booking_id === bookingId;
      }
      return true;
    }) ?? null;

  return exact;
}

async function createConversation(params: {
  customerUserId: string;
  guruUserId: string;
  startedByUserId: string;
  bookingId: string | null;
  subject: string | null;
}) {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("conversations")
    .insert({
      customer_id: params.customerUserId,
      guru_id: params.guruUserId,
      started_by_user_id: params.startedByUserId,
      booking_id: params.bookingId,
      subject: params.subject,
      status: "open",
      created_at: nowIso,
      updated_at: nowIso,
      last_message_at: null,
      last_message_preview: null,
    })
    .select("id, customer_id, guru_id, booking_id, status")
    .single<ConversationRow>();

  if (error) {
    throw new Error(error.message || "Unable to create conversation.");
  }

  return data;
}

async function ensureParticipants(
  conversationId: string,
  participants: Array<{ userId: string; role: string }>
) {
  const nowIso = new Date().toISOString();

  const rows = participants.map((participant) => ({
    conversation_id: conversationId,
    user_id: participant.userId,
    role: participant.role,
    created_at: nowIso,
    updated_at: nowIso,
  }));

  const { error } = await supabaseAdmin.from("conversation_participants").upsert(rows, {
    onConflict: "conversation_id,user_id",
    ignoreDuplicates: false,
  });

  if (error) {
    throw new Error(error.message || "Unable to create conversation participants.");
  }
}

async function createNotification(params: {
  recipientUserId: string;
  conversationId: string;
  senderName: string;
  senderRole: string;
  subject: string;
}) {
  const labelRole =
    params.senderRole === "guru"
      ? "Guru"
      : params.senderRole === "admin"
        ? "Admin"
        : "Customer";

  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: params.recipientUserId,
    type: "new_message",
    title: `New message from ${params.senderName || labelRole}`,
    body: params.subject
      ? `${labelRole} started a message thread: ${params.subject}`
      : `${labelRole} started a new message thread.`,
    link: buildMessageThreadHref(params.conversationId),
    is_read: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Message notification insert error:", error.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    const guruSlug = safeString(body?.guruSlug);
    const guruId = safeString(body?.guruId);
    const targetUserId = safeString(body?.targetUserId);
    const targetRole = safeString(body?.targetRole);
    const adminUserId = safeString(body?.adminUserId);
    const bookingIdRaw = safeString(body?.bookingId);
    const subjectRaw = safeString(body?.subject);

    const currentProfile = await getProfileById(user.id);
    const currentUserRole = await resolveUserRole(user.id, currentProfile?.role || null);

    const target = await getTargetUser({
      guruSlug,
      guruId,
      targetUserId,
      targetRole,
      adminUserId,
    });

    if (!target?.userId) {
      return NextResponse.json(
        { error: "Target user not found." },
        { status: 404 }
      );
    }

    if (target.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot message yourself." },
        { status: 400 }
      );
    }

    const bookingId = bookingIdRaw || null;

    const subject =
      subjectRaw ||
      (target.role === "admin" ? "Direct Admin Support" : "Direct conversation");

    const existingConversation = await findExistingConversationByParticipants(
      user.id,
      target.userId,
      bookingId
    );

    let conversationId = existingConversation?.id ?? null;

    if (!conversationId) {
      const guruUserId =
        currentUserRole === "guru"
          ? user.id
          : target.role === "guru"
            ? target.userId
            : user.id;

      const customerUserId = guruUserId === user.id ? target.userId : user.id;

      const createdConversation = await createConversation({
        customerUserId,
        guruUserId,
        startedByUserId: user.id,
        bookingId,
        subject,
      });

      conversationId = createdConversation.id;
    }

    await ensureParticipants(conversationId, [
      { userId: user.id, role: currentUserRole || "customer" },
      { userId: target.userId, role: target.role || "user" },
    ]);

    await createNotification({
      recipientUserId: target.userId,
      conversationId,
      senderName:
        getDisplayName(currentProfile) ||
        safeString(user.user_metadata?.full_name) ||
        safeString(user.email) ||
        "SitGuru User",
      senderRole: currentUserRole || "customer",
      subject,
    });

    return NextResponse.json(
      {
        ok: true,
        conversationId,
        redirectTo: buildMessageThreadHref(conversationId),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Message start route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start conversation.",
      },
      { status: 500 }
    );
  }
}