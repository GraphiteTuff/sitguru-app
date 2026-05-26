import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id?: string | null;
  email?: string | null;
  phone?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  account_type?: string | null;
  user_role?: string | null;
  type?: string | null;
};

type GuruRow = {
  id?: string | number | null;
  user_id?: string | null;
  email?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  phone?: string | null;
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

type AlertProfileSnapshot = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRole(value?: string | null) {
  const role = String(value || "").trim().toLowerCase();

  if (role === "provider" || role === "sitter") return "guru";
  if (role === "pet_parent" || role === "pet parent" || role === "client") {
    return "customer";
  }

  if (
    role === "super-admin" ||
    role === "super_admin" ||
    role === "site-admin" ||
    role === "site_admin" ||
    role === "admin_user" ||
    role === "admin-user" ||
    role === "founder" ||
    role === "owner" ||
    role.includes("admin")
  ) {
    return "admin";
  }

  return role;
}

function roleLabel(role?: string | null) {
  const normalized = normalizeRole(role);

  if (normalized === "guru") return "Guru";
  if (normalized === "customer") return "Pet Parent";
  if (normalized === "admin") return "Admin";

  return "SitGuru User";
}

function isAdminRole(role?: string | null) {
  return normalizeRole(role) === "admin";
}

function getMissingColumnFromError(message?: string) {
  if (!message) return "";

  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column "([^"]+)" of relation/i,
    /column "([^"]+)" does not exist/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "";
}

function getParticipantUserId(participant: ConversationParticipantRow) {
  return safeString(participant.user_id || participant.profile_id || "");
}

function getProfileName(profile?: ProfileRow | GuruRow | null) {
  const fullName = safeString(profile?.full_name);
  const displayName = safeString(profile?.display_name);
  const firstName =
    "first_name" in (profile || {})
      ? safeString((profile as ProfileRow).first_name)
      : "";
  const lastName =
    "last_name" in (profile || {})
      ? safeString((profile as ProfileRow).last_name)
      : "";
  const email = safeString(profile?.email);

  return (
    displayName ||
    fullName ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    email ||
    "SitGuru User"
  );
}

function getProfileRole(profile?: ProfileRow | null) {
  return normalizeRole(
    profile?.role ||
      profile?.account_type ||
      profile?.user_role ||
      profile?.type,
  );
}

async function getCurrentProfile({
  userId,
  email,
}: {
  userId: string;
  email?: string | null;
}) {
  const profileSelect =
    "id, email, phone, full_name, display_name, first_name, last_name, role, account_type, user_role, type";

  const byId = await supabaseAdmin
    .from("profiles")
    .select(profileSelect)
    .eq("id", userId)
    .maybeSingle();

  if (!byId.error && byId.data) {
    return byId.data as ProfileRow;
  }

  if (email) {
    const byEmail = await supabaseAdmin
      .from("profiles")
      .select(profileSelect)
      .eq("email", email)
      .maybeSingle();

    if (!byEmail.error && byEmail.data) {
      return byEmail.data as ProfileRow;
    }
  }

  return null;
}

async function getGuruByIdOrUserId(value: string) {
  if (!value) return null;

  const select = "id, user_id, email, phone, full_name, display_name";

  const byUserId = await supabaseAdmin
    .from("gurus")
    .select(select)
    .eq("user_id", value)
    .maybeSingle();

  if (!byUserId.error && byUserId.data) {
    return byUserId.data as GuruRow;
  }

  const byId = await supabaseAdmin
    .from("gurus")
    .select(select)
    .eq("id", value)
    .maybeSingle();

  if (!byId.error && byId.data) {
    return byId.data as GuruRow;
  }

  return null;
}

async function getSnapshotForUser({
  userId,
  roleHint,
}: {
  userId: string;
  roleHint?: string | null;
}): Promise<AlertProfileSnapshot> {
  const profile = await getCurrentProfile({ userId });
  const profileRole = getProfileRole(profile);
  const normalizedRole = normalizeRole(roleHint) || profileRole;
  const guru =
    normalizedRole === "guru" ? await getGuruByIdOrUserId(userId) : null;

  return {
    id: userId,
    name: getProfileName(guru || profile) || roleLabel(normalizedRole),
    email: safeString(guru?.email || profile?.email),
    phone: safeString(guru?.phone || profile?.phone),
    role: normalizedRole || "user",
  };
}

async function insertMessageWithColumnFallback(payload: Record<string, unknown>) {
  const workingPayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from("messages")
      .insert(workingPayload)
      .select("*")
      .single();

    if (!error) {
      if (removedColumns.length > 0) {
        console.warn(
          "Message insert succeeded after removing missing optional columns:",
          removedColumns,
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
        "Unable to insert message after removing optional missing columns.",
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
          removedColumns,
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
      "Unable to update conversation after removing optional missing columns.",
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
    (item) => getParticipantUserId(item) === userId,
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

  const profileRole = getProfileRole(profile);
  if (profileRole) return profileRole;

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
    isAdminRole(item.role),
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
      recipientRole: firstParticipantRecipient.role || "user",
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
    recipientRole: fallbackRecipient?.role || "user",
  };
}

function shouldAlertSupport({
  senderRole,
  recipientRole,
}: {
  senderRole: string;
  recipientRole: string;
}) {
  const sender = normalizeRole(senderRole);
  const recipient = normalizeRole(recipientRole);

  if (sender === "admin") return false;
  if (recipient === "admin") return true;

  return sender === "customer" || sender === "guru";
}

function buildAdminMessagesUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITGURU_SITE_URL ||
    "https://www.sitguru.com";

  return `${baseUrl.replace(/\/$/, "")}/admin/messages`;
}

function buildMessageAlertText({
  sender,
  recipient,
  topic,
  body,
  conversationId,
}: {
  sender: AlertProfileSnapshot;
  recipient: AlertProfileSnapshot;
  topic: string;
  body: string;
  conversationId: string;
}) {
  const adminUrl = buildAdminMessagesUrl();
  const preview = body.length > 220 ? `${body.slice(0, 220)}...` : body;

  return {
    subject: `New SitGuru message from ${sender.name}`,
    sms: `SitGuru: New ${roleLabel(sender.role)} message from ${
      sender.name
    }. Open Admin Messages: ${adminUrl}`,
    text: [
      "New SitGuru Message",
      "",
      `From: ${sender.name}`,
      `From role: ${roleLabel(sender.role)}`,
      sender.email ? `From email: ${sender.email}` : "From email: not available",
      sender.phone ? `From phone: ${sender.phone}` : "From phone: not available",
      `To: ${recipient.name}`,
      `To role: ${roleLabel(recipient.role)}`,
      `Topic: ${topic || "General"}`,
      `Conversation ID: ${conversationId}`,
      "",
      "Message preview:",
      preview,
      "",
      `Open Admin Messages: ${adminUrl}`,
    ].join("\n"),
  };
}

async function sendEmailAlert({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.SITGURU_ALERT_FROM_EMAIL ||
    "SitGuru Alerts <support@sitguru.com>";

  if (!resendApiKey || !to) return;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
      }),
    });

    if (!response.ok) {
      console.warn("SitGuru message email alert failed:", await response.text());
    }
  } catch (error) {
    console.warn("SitGuru message email alert error:", error);
  }
}

async function sendSmsAlert({ to, body }: { to: string; body: string }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !to || (!messagingServiceSid && !fromPhone)) {
    return;
  }

  const form = new URLSearchParams();
  form.set("To", to);
  form.set("Body", body.slice(0, 1500));

  if (messagingServiceSid) {
    form.set("MessagingServiceSid", messagingServiceSid);
  } else if (fromPhone) {
    form.set("From", fromPhone);
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      },
    );

    if (!response.ok) {
      console.warn("SitGuru message SMS alert failed:", await response.text());
    }
  } catch (error) {
    console.warn("SitGuru message SMS alert error:", error);
  }
}

async function notifySupportOfNewMessage({
  sender,
  recipient,
  senderRole,
  recipientRole,
  topic,
  body,
  conversationId,
}: {
  sender: AlertProfileSnapshot;
  recipient: AlertProfileSnapshot;
  senderRole: string;
  recipientRole: string;
  topic: string;
  body: string;
  conversationId: string;
}) {
  if (!shouldAlertSupport({ senderRole, recipientRole })) return;

  const supportEmail = process.env.SITGURU_SUPPORT_EMAIL || "support@sitguru.com";
  const supportSmsTo = process.env.SITGURU_SUPPORT_SMS_TO || "";
  const alert = buildMessageAlertText({
    sender,
    recipient,
    topic,
    body,
    conversationId,
  });

  await Promise.allSettled([
    sendEmailAlert({
      to: supportEmail,
      subject: alert.subject,
      text: alert.text,
    }),
    sendSmsAlert({
      to: supportSmsTo,
      body: alert.sms,
    }),
  ]);
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      route: "/api/messages/send",
      message:
        "Customer/Guru message send API route is active with snapshot preservation and support alerts.",
    },
    { status: 200 },
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
        { status: 400 },
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
        { status: 404 },
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
        { status: 500 },
      );
    }

    const safeParticipants =
      (participants || []) as ConversationParticipantRow[];

    const senderId = user.id;

    const senderIsAllowed =
      senderId === safeString(safeConversation.customer_id) ||
      senderId === safeString(safeConversation.guru_id) ||
      safeParticipants.some(
        (participant) => getParticipantUserId(participant) === senderId,
      );

    if (!senderIsAllowed) {
      return NextResponse.json(
        { error: "You are not a participant in this conversation." },
        { status: 403 },
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
        { status: 403 },
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
        { status: 400 },
      );
    }

    const senderSnapshot = await getSnapshotForUser({
      userId: senderId,
      roleHint: senderRole,
    });

    const recipientSnapshot = await getSnapshotForUser({
      userId: recipientId,
      roleHint: recipientRole,
    });

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
        recipient_role: recipientRole || "user",
        sender_name_snapshot: senderSnapshot.name,
        sender_email_snapshot: senderSnapshot.email || null,
        sender_phone_snapshot: senderSnapshot.phone || null,
        sender_role_snapshot: senderSnapshot.role || senderRole || "customer",
        recipient_name_snapshot: recipientSnapshot.name,
        recipient_email_snapshot: recipientSnapshot.email || null,
        recipient_phone_snapshot: recipientSnapshot.phone || null,
        recipient_role_snapshot:
          recipientSnapshot.role || recipientRole || "user",
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
        { status: 500 },
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
        conversationUpdateError.message,
      );
    }

    await notifySupportOfNewMessage({
      sender: senderSnapshot,
      recipient: recipientSnapshot,
      senderRole,
      recipientRole,
      topic,
      body,
      conversationId,
    });

    return NextResponse.json(
      {
        ok: true,
        message: insertedMessage,
        conversationId,
        topic,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Send message route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to send message.",
      },
      { status: 500 },
    );
  }
}