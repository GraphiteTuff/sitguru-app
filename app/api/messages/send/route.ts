import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id?: string | null;
  email?: string | null;
  role?: string | null;
  account_type?: string | null;
};

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  subject?: string | null;
  topic?: string | null;
  status?: string | null;
};

type ConversationParticipantRow = {
  id?: string | null;
  conversation_id?: string | null;
  user_id?: string | null;
  profile_id?: string | null;
  role?: string | null;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRole(value?: string | null) {
  const role = String(value || "").trim().toLowerCase();

  if (role === "provider" || role === "sitter") return "guru";

  return role;
}

function isAdminRole(role?: string | null) {
  const normalized = normalizeRole(role);

  return (
    normalized === "admin" ||
    normalized === "owner" ||
    normalized === "super_admin"
  );
}

function getMissingColumnFromError(message?: string) {
  if (!message) return "";

  const match = message.match(/Could not find the '([^']+)' column/i);
  return match?.[1] || "";
}

function getParticipantUserId(participant: ConversationParticipantRow) {
  return safeString(participant.user_id || participant.profile_id || "");
}

async function getCurrentProfile({
  userId,
  email,
}: {
  userId: string;
  email?: string | null;
}) {
  const byId = await supabaseAdmin
    .from("profiles")
    .select("id, email, role, account_type")
    .eq("id", userId)
    .maybeSingle();

  if (!byId.error && byId.data) {
    return byId.data as ProfileRow;
  }

  if (email) {
    const byEmail = await supabaseAdmin
      .from("profiles")
      .select("id, email, role, account_type")
      .eq("email", email)
      .maybeSingle();

    if (!byEmail.error && byEmail.data) {
      return byEmail.data as ProfileRow;
    }
  }

  return null;
}

async function insertMessageWithColumnFallback(payload: Record<string, unknown>) {
  const workingPayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from("messages")
      .insert(workingPayload)
      .select("*")
      .single();

    if (!error) {
      if (removedColumns.length > 0) {
        console.warn(
          "Message insert succeeded after removing missing optional columns:",
          removedColumns
        );
      }

      return { data, error: null };
    }

    const missingColumn = getMissingColumnFromError(error.message);

    if (
      missingColumn &&
      Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)
    ) {
      delete workingPayload[missingColumn];
      removedColumns.push(missingColumn);
      continue;
    }

    return { data: null, error };
  }

  return {
    data: null,
    error: {
      message: "Unable to insert message after removing optional missing columns.",
    },
  };
}

async function updateConversationWithColumnFallback({
  conversationId,
  payload,
}: {
  conversationId: string;
  payload: Record<string, unknown>;
}) {
  const workingPayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { error } = await supabaseAdmin
      .from("conversations")
      .update(workingPayload)
      .eq("id", conversationId);

    if (!error) {
      if (removedColumns.length > 0) {
        console.warn(
          "Conversation update succeeded after removing missing optional columns:",
          removedColumns
        );
      }

      return null;
    }

    const missingColumn = getMissingColumnFromError(error.message);

    if (
      missingColumn &&
      Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)
    ) {
      delete workingPayload[missingColumn];
      removedColumns.push(missingColumn);
      continue;
    }

    return error;
  }

  return {
    message: "Unable to update conversation after removing optional missing columns.",
  };
}

function getParticipantRoleForUser({
  participants,
  userId,
}: {
  participants: ConversationParticipantRow[];
  userId: string;
}) {
  const participant = participants.find(
    (item) => getParticipantUserId(item) === userId
  );

  return normalizeRole(participant?.role || null);
}

function getSenderRole({
  senderId,
  profile,
  participants,
  conversation,
}: {
  senderId: string;
  profile?: ProfileRow | null;
  participants: ConversationParticipantRow[];
  conversation: ConversationRow;
}) {
  const participantRole = getParticipantRoleForUser({
    participants,
    userId: senderId,
  });

  if (participantRole) return participantRole;

  const profileRole = normalizeRole(profile?.role);
  if (profileRole) return profileRole;

  const accountType = normalizeRole(profile?.account_type);
  if (accountType) return accountType;

  if (senderId === safeString(conversation.customer_id)) return "customer";
  if (senderId === safeString(conversation.guru_id)) return "guru";

  return "customer";
}

function getPrimaryRecipient({
  participants,
  conversation,
  senderId,
}: {
  participants: ConversationParticipantRow[];
  conversation: ConversationRow;
  senderId: string;
}) {
  const participantRecipients = participants
    .map((participant) => ({
      id: getParticipantUserId(participant),
      role: normalizeRole(participant.role),
    }))
    .filter((participant) => participant.id && participant.id !== senderId);

  const adminRecipient = participantRecipients.find((item) =>
    isAdminRole(item.role)
  );

  if (adminRecipient?.id) {
    return {
      recipientId: adminRecipient.id,
      recipientRole: "admin",
    };
  }

  const firstParticipantRecipient = participantRecipients[0];

  if (firstParticipantRecipient?.id) {
    return {
      recipientId: firstParticipantRecipient.id,
      recipientRole: firstParticipantRecipient.role || "",
    };
  }

  const fallbackRecipients = [
    {
      id: safeString(conversation.guru_id),
      role: "guru",
    },
    {
      id: safeString(conversation.customer_id),
      role: "customer",
    },
  ].filter((candidate) => candidate.id && candidate.id !== senderId);

  const fallbackRecipient = fallbackRecipients[0];

  return {
    recipientId: fallbackRecipient?.id || "",
    recipientRole: fallbackRecipient?.role || "",
  };
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      route: "/api/messages/send",
      message: "Customer/Guru message send API route is active.",
    },
    { status: 200 }
  );
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

    const payload = await req.json().catch(() => null);

    const conversationId = safeString(payload?.conversationId);
    const body = safeString(payload?.body);
    const requestedTopic = safeString(payload?.topic);

    if (!conversationId || !body) {
      return NextResponse.json(
        { error: "Missing required message fields." },
        { status: 400 }
      );
    }

    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from("conversations")
      .select("id, customer_id, guru_id, subject, topic, status")
      .eq("id", conversationId)
      .maybeSingle();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    const safeConversation = conversation as ConversationRow;

    const { data: participants, error: participantsError } = await supabaseAdmin
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", conversationId);

    if (participantsError) {
      return NextResponse.json(
        {
          error: `Unable to load conversation participants: ${participantsError.message}`,
        },
        { status: 500 }
      );
    }

    const safeParticipants =
      (participants || []) as ConversationParticipantRow[];

    const senderId = user.id;

    const senderIsAllowed =
      senderId === safeString(safeConversation.customer_id) ||
      senderId === safeString(safeConversation.guru_id) ||
      safeParticipants.some(
        (participant) => getParticipantUserId(participant) === senderId
      );

    if (!senderIsAllowed) {
      return NextResponse.json(
        { error: "You are not a participant in this conversation." },
        { status: 403 }
      );
    }

    const currentProfile = await getCurrentProfile({
      userId: user.id,
      email: user.email,
    });

    const senderRole = getSenderRole({
      senderId,
      profile: currentProfile,
      participants: safeParticipants,
      conversation: safeConversation,
    });

    if (isAdminRole(senderRole)) {
      return NextResponse.json(
        {
          error: "Admin messages must be sent from /api/admin/messages/send.",
        },
        { status: 403 }
      );
    }

    const { recipientId, recipientRole } = getPrimaryRecipient({
      participants: safeParticipants,
      conversation: safeConversation,
      senderId,
    });

    if (!recipientId) {
      return NextResponse.json(
        {
          error:
            "Unable to send message. No recipient was found for this conversation.",
        },
        { status: 400 }
      );
    }

    const topic =
      requestedTopic ||
      safeString(safeConversation.topic) ||
      safeString(safeConversation.subject) ||
      "Other";

    const nowIso = new Date().toISOString();

    const { data: insertedMessage, error: insertError } =
      await insertMessageWithColumnFallback({
        conversation_id: conversationId,
        sender_id: senderId,
        recipient_id: recipientId,
        sender_role: senderRole || "customer",
        recipient_role: recipientRole || "admin",
        content: body,
        body,
        topic,
        message_type: "text",
        is_deleted: false,
        is_read: false,
        created_at: nowIso,
        updated_at: nowIso,
      });

    if (insertError) {
      return NextResponse.json(
        {
          error:
            insertError.message ||
            "Unable to send message because the database insert failed.",
        },
        { status: 500 }
      );
    }

    const conversationUpdateError = await updateConversationWithColumnFallback({
      conversationId,
      payload: {
        topic,
        subject: safeString(safeConversation.subject) || topic,
        status: safeString(safeConversation.status) || "open",
        last_message_at: nowIso,
        last_message_preview: body.slice(0, 180),
        updated_at: nowIso,
      },
    });

    if (conversationUpdateError) {
      console.error(
        "Conversation update error:",
        conversationUpdateError.message
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: insertedMessage,
        conversationId,
        topic,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send message route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to send message.",
      },
      { status: 500 }
    );
  }
}