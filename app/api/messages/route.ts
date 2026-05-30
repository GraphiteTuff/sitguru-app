import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type GuruLookupRow = {
  id?: string | number | null;
  user_id?: string | null;
  display_name?: string | null;
};

type ProfileLookupRow = {
  id?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
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

type TargetUserResult = {
  userId: string;
  role: string;
  profile: ProfileLookupRow;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRole(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeSearchValue(value: unknown) {
  return safeString(value).toLowerCase();
}

function slugify(value: unknown) {
  return safeString(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildMessageThreadHref(conversationId: string) {
  return `/messages/${conversationId}`;
}

function getDisplayName(profile?: ProfileLookupRow | null) {
  const fullName = safeString(profile?.full_name);
  const firstName = safeString(profile?.first_name);
  const lastName = safeString(profile?.last_name);
  const combinedName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return (
    fullName ||
    combinedName ||
    safeString(profile?.email) ||
    "SitGuru User"
  );
}

function getMessagePreview(message: string) {
  const cleanMessage = message.replace(/\s+/g, " ").trim();

  if (cleanMessage.length <= 140) {
    return cleanMessage;
  }

  return `${cleanMessage.slice(0, 137)}...`;
}

function getMessageText(body: Record<string, unknown> | null) {
  return (
    safeString(body?.message) ||
    safeString(body?.body) ||
    safeString(body?.content) ||
    safeString(body?.text)
  );
}

function getSubject(body: Record<string, unknown> | null, targetRole: string) {
  const subject =
    safeString(body?.subject) ||
    safeString(body?.topic) ||
    safeString(body?.category);

  if (subject) {
    return subject;
  }

  return targetRole === "admin" ? "Direct Admin Support" : "Direct conversation";
}

async function getProfileById(userId: string): Promise<ProfileLookupRow | null> {
  if (!userId) return null;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, first_name, last_name, email, role")
    .eq("id", userId)
    .maybeSingle<ProfileLookupRow>();

  if (error) {
    console.error("Profile lookup by id error:", error.message);
    return null;
  }

  return data ?? null;
}

async function getProfileByEmail(email: string): Promise<ProfileLookupRow | null> {
  const cleanEmail = safeString(email).toLowerCase();

  if (!cleanEmail) return null;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, first_name, last_name, email, role")
    .ilike("email", cleanEmail)
    .maybeSingle<ProfileLookupRow>();

  if (error) {
    console.error("Profile lookup by email error:", error.message);
    return null;
  }

  return data ?? null;
}

async function isGuruUser(userId: string) {
  if (!userId) return false;

  const { data, error } = await supabaseAdmin
    .from("gurus")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (error) {
    console.error("Guru user lookup error:", error.message);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

async function resolveUserRole(userId: string, roleHint?: string | null) {
  const hinted = normalizeRole(roleHint);

  if (hinted) {
    if (hinted === "sitter" || hinted === "provider") return "guru";
    if (hinted === "pet_parent" || hinted === "pet parent") return "customer";
    return hinted;
  }

  const profile = await getProfileById(userId);
  const profileRole = normalizeRole(profile?.role);

  if (profileRole) {
    if (profileRole === "sitter" || profileRole === "provider") return "guru";
    if (profileRole === "pet_parent" || profileRole === "pet parent") return "customer";
    return profileRole;
  }

  if (await isGuruUser(userId)) {
    return "guru";
  }

  return "customer";
}

async function findGuruByIdOrUserId(value: string) {
  if (!value) return null;

  const byId = await supabaseAdmin
    .from("gurus")
    .select("id, user_id, display_name")
    .eq("id", value)
    .maybeSingle<GuruLookupRow>();

  if (!byId.error && byId.data?.user_id) {
    return byId.data;
  }

  const byUserId = await supabaseAdmin
    .from("gurus")
    .select("id, user_id, display_name")
    .eq("user_id", value)
    .maybeSingle<GuruLookupRow>();

  if (!byUserId.error && byUserId.data?.user_id) {
    return byUserId.data;
  }

  return null;
}

async function findGuruByDisplaySlug(value: string) {
  const searchValue = safeString(value);

  if (!searchValue) return null;

  const normalizedValue = normalizeSearchValue(searchValue);
  const slugValue = slugify(searchValue);

  const { data, error } = await supabaseAdmin
    .from("gurus")
    .select("id, user_id, display_name")
    .limit(500)
    .returns<GuruLookupRow[]>();

  if (error) {
    console.error("Guru display lookup error:", error.message);
    return null;
  }

  const gurus = data ?? [];

  return (
    gurus.find((guru) => {
      const displayName = safeString(guru.display_name);

      return (
        normalizeSearchValue(displayName) === normalizedValue ||
        slugify(displayName) === slugValue ||
        normalizeSearchValue(guru.user_id) === normalizedValue
      );
    }) ?? null
  );
}

async function findGuruByProfileName(value: string) {
  const searchValue = safeString(value);

  if (!searchValue) return null;

  const normalizedValue = normalizeSearchValue(searchValue);
  const slugValue = slugify(searchValue);

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, first_name, last_name, email, role")
    .limit(1000)
    .returns<ProfileLookupRow[]>();

  if (error) {
    console.error("Profile name lookup error:", error.message);
    return null;
  }

  const profiles = data ?? [];

  const matchedProfile =
    profiles.find((profile) => {
      const fullName = getDisplayName(profile);
      const email = safeString(profile.email);

      return (
        normalizeSearchValue(profile.id) === normalizedValue ||
        normalizeSearchValue(fullName) === normalizedValue ||
        slugify(fullName) === slugValue ||
        normalizeSearchValue(email) === normalizedValue ||
        slugify(email.split("@")[0]) === slugValue
      );
    }) ?? null;

  if (!matchedProfile?.id) {
    return null;
  }

  const guru = await findGuruByIdOrUserId(matchedProfile.id);

  if (!guru?.user_id) {
    return null;
  }

  return guru;
}

async function findGuruBySlugOrId(value: string) {
  const cleanValue = safeString(value);

  if (!cleanValue) return null;

  const directGuru = await findGuruByIdOrUserId(cleanValue);

  if (directGuru?.user_id) {
    return directGuru;
  }

  const byDisplaySlug = await findGuruByDisplaySlug(cleanValue);

  if (byDisplaySlug?.user_id) {
    return byDisplaySlug;
  }

  const byProfileName = await findGuruByProfileName(cleanValue);

  if (byProfileName?.user_id) {
    return byProfileName;
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

  const adminEmails = ["jason@sitguru.com", "nette@sitguru.com", "support@sitguru.com"];

  for (const email of adminEmails) {
    const profile = await getProfileByEmail(email);

    if (profile?.id) {
      return profile;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, first_name, last_name, email, role")
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
}): Promise<TargetUserResult | null> {
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

  const profile = await getProfileById(guru.user_id);

  return {
    userId: guru.user_id,
    role: "guru",
    profile:
      profile ??
      ({
        id: guru.user_id,
        full_name: safeString(guru.display_name) || null,
        first_name: null,
        last_name: null,
        email: null,
        role: "guru",
      } satisfies ProfileLookupRow),
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
  } else {
    query = query.is("booking_id", null);
  }

  const { data, error } = await query.returns<ConversationRow[]>();

  if (error) {
    console.error("Existing conversation detail lookup error:", error.message);
    return null;
  }

  return data?.[0] ?? null;
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

async function insertMessage(params: {
  conversationId: string;
  senderUserId: string;
  recipientUserId: string;
  message: string;
}) {
  const nowIso = new Date().toISOString();

  const messageAttempts = [
    {
      table: "messages",
      payload: {
        conversation_id: params.conversationId,
        sender_id: params.senderUserId,
        recipient_id: params.recipientUserId,
        body: params.message,
        created_at: nowIso,
        updated_at: nowIso,
      },
    },
    {
      table: "messages",
      payload: {
        conversation_id: params.conversationId,
        sender_user_id: params.senderUserId,
        recipient_user_id: params.recipientUserId,
        body: params.message,
        created_at: nowIso,
        updated_at: nowIso,
      },
    },
    {
      table: "messages",
      payload: {
        conversation_id: params.conversationId,
        sender_id: params.senderUserId,
        recipient_id: params.recipientUserId,
        content: params.message,
        created_at: nowIso,
        updated_at: nowIso,
      },
    },
    {
      table: "conversation_messages",
      payload: {
        conversation_id: params.conversationId,
        sender_id: params.senderUserId,
        recipient_id: params.recipientUserId,
        body: params.message,
        created_at: nowIso,
        updated_at: nowIso,
      },
    },
    {
      table: "conversation_messages",
      payload: {
        conversation_id: params.conversationId,
        sender_user_id: params.senderUserId,
        recipient_user_id: params.recipientUserId,
        body: params.message,
        created_at: nowIso,
        updated_at: nowIso,
      },
    },
    {
      table: "conversation_messages",
      payload: {
        conversation_id: params.conversationId,
        sender_id: params.senderUserId,
        recipient_id: params.recipientUserId,
        content: params.message,
        created_at: nowIso,
        updated_at: nowIso,
      },
    },
  ];

  const errors: string[] = [];

  for (const attempt of messageAttempts) {
    const { error } = await supabaseAdmin.from(attempt.table).insert(attempt.payload);

    if (!error) {
      return;
    }

    errors.push(`${attempt.table}: ${error.message}`);
  }

  console.error("Message insert failed on all supported message table shapes:", errors);

  throw new Error(
    "Conversation was prepared, but the first message could not be saved. Check the messages table columns."
  );
}

async function updateConversationLastMessage(params: {
  conversationId: string;
  message: string;
}) {
  const nowIso = new Date().toISOString();

  const attempts = [
    {
      updated_at: nowIso,
      last_message_at: nowIso,
      last_message_preview: getMessagePreview(params.message),
    },
    {
      updated_at: nowIso,
      last_message_at: nowIso,
    },
    {
      updated_at: nowIso,
    },
  ];

  for (const payload of attempts) {
    const { error } = await supabaseAdmin
      .from("conversations")
      .update(payload)
      .eq("id", params.conversationId);

    if (!error) {
      return;
    }

    console.error("Conversation last-message update attempt failed:", error.message);
  }
}

async function createNotification(params: {
  recipientUserId: string;
  conversationId: string;
  senderName: string;
  senderRole: string;
  subject: string;
  message: string;
}) {
  const labelRole =
    params.senderRole === "guru"
      ? "Guru"
      : params.senderRole === "admin"
        ? "Admin"
        : "Pet Parent";

  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: params.recipientUserId,
    type: "new_message",
    title: `New message from ${params.senderName || labelRole}`,
    body: params.subject
      ? `${labelRole} sent a message about ${params.subject}: ${getMessagePreview(params.message)}`
      : `${labelRole} sent a new message: ${getMessagePreview(params.message)}`,
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

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

    const guruSlug =
      safeString(body?.guruSlug) ||
      safeString(body?.guru) ||
      safeString(body?.guruSlugOrId);

    const guruId =
      safeString(body?.guruId) ||
      safeString(body?.guruUserId) ||
      safeString(body?.providerId);

    const targetUserId =
      safeString(body?.targetUserId) ||
      safeString(body?.recipientId) ||
      safeString(body?.recipientUserId) ||
      safeString(body?.toUserId);

    const targetRole =
      safeString(body?.targetRole) ||
      safeString(body?.recipientRole) ||
      safeString(body?.toRole);

    const adminUserId = safeString(body?.adminUserId);
    const bookingIdRaw = safeString(body?.bookingId);
    const message = getMessageText(body);

    if (!message) {
      return NextResponse.json(
        { error: "Missing required message fields." },
        { status: 400 }
      );
    }

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
    const subject = getSubject(body, target.role);

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

    await insertMessage({
      conversationId,
      senderUserId: user.id,
      recipientUserId: target.userId,
      message,
    });

    await updateConversationLastMessage({
      conversationId,
      message,
    });

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
      message,
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