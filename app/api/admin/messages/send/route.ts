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

function isAdminProfile(profile?: ProfileRow | null) {
  if (!profile) return false;

  return isAdminRole(profile.role) || isAdminRole(profile.account_type);
}

function getMissingColumnFromError(message?: string) {
  if (!message) return "";

  const match = message.match(/Could not find the '([^']+)' column/i);
  return match?.[1] || "";
}

async function getCurrentAdminProfile({
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

  if (!byId.error && byId.data && isAdminProfile(byId.data as ProfileRow)) {
    return byId.data as ProfileRow;
  }

  if (email) {
    const byEmail = await supabaseAdmin
      .from("profiles")
      .select("id, email, role, account_type")
      .eq("email", email)
      .maybeSingle();

    if (
      !byEmail.error &&
      byEmail.data &&
      isAdminProfile(byEmail.data as ProfileRow)
    ) {
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
          "Admin message insert succeeded after removing missing optional columns:",
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
      message:
        "Unable to insert admin message after removing optional missing columns.",
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
          "Admin conversation update succeeded after removing missing optional columns:",
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
    message:
      "Unable to update admin conversation after removing optional missing columns.",
  };
}

function getParticipantUserId(participant: ConversationParticipantRow) {
  return safeString(participant.user_id || participant.profile_id || "");
}

function getPrimaryRecipient({
  participants,
  conversation,
  senderId,
  adminProfileId,
}: {
  participants: ConversationParticipantRow[];
  conversation: ConversationRow;
  senderId: string;
  adminProfileId?: string | null;
}) {
  const adminIds = new Set(
    [senderId, safeString(adminProfileId)].filter(Boolean)
  );

  const nonAdminParticipants = participants
    .map((participant) => ({
      id: getParticipantUserId(participant),
      role: normalizeRole(participant.role),
    }))
    .filter((participant) => participant.id && !adminIds.has(participant.id))
    .filter((participant) => !isAdminRole(participant.role));

  const customerParticipant = nonAdminParticipants.find(
    (participant) => participant.role === "customer"
  );

  if (customerParticipant?.id) {
    return {
      recipientId: customerParticipant.id,
      recipientRole: "customer",
    };
  }

  const guruParticipant = nonAdminParticipants.find(
    (participant) => participant.role === "guru"
  );

  if (guruParticipant?.id) {
    return {
      recipientId: guruParticipant.id,
      recipientRole: "guru",
    };
  }

  const firstParticipant = nonAdminParticipants[0];

  if (firstParticipant?.id) {
    return {
      recipientId: firstParticipant.id,
      recipientRole: firstParticipant.role || "",
    };
  }

  const fallbackRecipients = [
    {
      id: safeString(conversation.customer_id),
      role: "customer",
    },
    {
      id: safeString(conversation.guru_id),
      role: "guru",
    },
  ]
    .filter((candidate) => candidate.id)
    .filter((candidate) => !adminIds.has(candidate.id));

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
      route: "/api/admin/messages/send",
      message:
        "Admin message send API route is active. Use POST to send a message.",
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

    const adminProfile = await getCurrentAdminProfile({
      userId: user.id,
      email: user.email,
    });

    if (!adminProfile) {
      return NextResponse.json(
        {
          error:
            "Admin access required. Your logged-in user must match a public.profiles row with role='admin' or account_type='admin'.",
        },
        { status: 403 }
      );
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

    const { recipientId, recipientRole } = getPrimaryRecipient({
      participants: safeParticipants,
      conversation: safeConversation,
      senderId,
      adminProfileId: adminProfile.id,
    });

    if (!recipientId) {
      return NextResponse.json(
        {
          error:
            "Unable to send admin message. No customer or Guru recipient was found for this conversation.",
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
        sender_role: "admin",
        recipient_role: recipientRole || "customer",
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
            "Unable to send admin message because the database insert failed.",
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
        "Admin conversation update error:",
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
    console.error("Admin send message route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send admin message.",
      },
      { status: 500 }
    );
  }
}
