import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type InquiryKey =
  | "booking"
  | "payment"
  | "guru-support"
  | "customer-support"
  | "safety"
  | "technical"
  | "partner"
  | "general";

type AnyRow = Record<string, unknown>;

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

type MessageRow = {
  id?: string | null;
  conversation_id?: string | null;
  sender_id?: string | null;
  recipient_id?: string | null;
  content?: string | null;
  body?: string | null;
  message_type?: string | null;
  topic?: string | null;
  status?: string | null;
  is_read?: boolean | null;
  read_at?: string | null;
  is_deleted?: boolean | null;
  created_at?: string | null;
  edited_at?: string | null;
};

type ConversationRow = {
  id?: string | null;
  customer_id?: string | null;
  guru_id?: string | null;
  booking_id?: string | null;
  started_by_user_id?: string | null;
  status?: string | null;
  subject?: string | null;
  topic?: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProfileRow = {
  id?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: string | null;
  user_role?: string | null;
  account_type?: string | null;
  type?: string | null;
};

type ConversationParticipantRow = {
  conversation_id?: string | null;
  user_id?: string | null;
  role?: string | null;
};

type MessageExportRow = {
  thread_id: string;
  conversation_id: string;
  message_id: string;
  thread_type: string;
  inquiry_type: string;
  topic: string;
  message_type: string;
  subject: string;
  conversation_status: string;
  booking_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  guru_id: string;
  guru_name: string;
  guru_email: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  sender_role: string;
  recipient_id: string;
  recipient_name: string;
  recipient_email: string;
  recipient_role: string;
  message_preview: string;
  content: string;
  body: string;
  is_read: string;
  read_at: string;
  message_status: string;
  created_at: string;
  edited_at: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getText(row: AnyRow | null | undefined, keys: string[], fallback = "") {
  if (!row) return fallback;

  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
}

function normalizeRole(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();

  if (!value) return "";
  if (value === "provider" || value === "sitter") return "guru";
  if (value === "pet_parent" || value === "pet parent" || value === "client") {
    return "customer";
  }
  if (
    value === "admin" ||
    value === "super_admin" ||
    value === "super-admin" ||
    value === "site_admin" ||
    value === "site-admin" ||
    value === "admin_user" ||
    value === "admin-user"
  ) {
    return "admin";
  }

  return value;
}

function getProfileRole(profile?: ProfileRow | null) {
  if (!profile) return "";

  return normalizeRole(
    profile.role || profile.user_role || profile.account_type || profile.type,
  );
}

function getProfileName(profile?: ProfileRow | null) {
  if (!profile) return "";

  const candidate =
    profile.full_name ||
    profile.display_name ||
    (profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : null) ||
    profile.first_name ||
    profile.last_name ||
    profile.email?.split("@")[0] ||
    "";

  return String(candidate).trim();
}

function getMessageBody(message?: MessageRow | null) {
  if (!message) return "";

  return asString(message.content) || asString(message.body);
}

function getMessagePreview(message?: MessageRow | null, fallback = "") {
  const body = getMessageBody(message) || fallback;
  return body.length > 160 ? `${body.slice(0, 157)}...` : body;
}

function getThreadKeyFromMessage(message: MessageRow) {
  return message.conversation_id || `direct-message-${message.id || "unknown"}`;
}

function getStoredInquiryType(
  conversation?: ConversationRow | null,
  message?: MessageRow | null,
): InquiryKey | "" {
  const raw = [
    conversation?.topic,
    message?.topic,
    message?.message_type,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()
    .toLowerCase();

  if (!raw) return "";

  if (
    raw.includes("booking") ||
    raw.includes("schedule") ||
    raw.includes("application question")
  ) {
    return "booking";
  }

  if (
    raw.includes("payment") ||
    raw.includes("refund") ||
    raw.includes("payout") ||
    raw.includes("billing") ||
    raw.includes("dispute") ||
    raw.includes("stripe")
  ) {
    return "payment";
  }

  if (
    raw.includes("identity") ||
    raw.includes("verification") ||
    raw.includes("background") ||
    raw.includes("safety") ||
    raw.includes("trust") ||
    raw.includes("incident")
  ) {
    return "safety";
  }

  if (
    raw.includes("technical") ||
    raw.includes("bug") ||
    raw.includes("login") ||
    raw.includes("upload") ||
    raw.includes("issue")
  ) {
    return "technical";
  }

  if (
    raw.includes("partner") ||
    raw.includes("referral") ||
    raw.includes("affiliate") ||
    raw.includes("ambassador")
  ) {
    return "partner";
  }

  if (raw.includes("guru") || raw.includes("sitter") || raw.includes("provider")) {
    return "guru-support";
  }

  if (
    raw.includes("customer") ||
    raw.includes("pet parent") ||
    raw.includes("client")
  ) {
    return "customer-support";
  }

  if (raw.includes("other")) return "general";

  return "";
}

function classifyInquiryType(
  conversation: ConversationRow | null,
  message: MessageRow | null,
) {
  const storedType = getStoredInquiryType(conversation, message);
  if (storedType) return storedType;

  const search = [
    conversation?.subject,
    conversation?.status,
    conversation?.topic,
    conversation?.last_message_preview,
    message?.topic,
    message?.message_type,
    message?.content,
    message?.body,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    search.includes("refund") ||
    search.includes("payment") ||
    search.includes("charge") ||
    search.includes("billing") ||
    search.includes("invoice") ||
    search.includes("dispute") ||
    search.includes("chargeback") ||
    search.includes("payout") ||
    search.includes("paid") ||
    search.includes("stripe")
  ) {
    return "payment";
  }

  if (
    search.includes("safety") ||
    search.includes("unsafe") ||
    search.includes("incident") ||
    search.includes("emergency") ||
    search.includes("concern") ||
    search.includes("background") ||
    search.includes("checkr") ||
    search.includes("trust") ||
    search.includes("identity") ||
    search.includes("verification") ||
    search.includes("report")
  ) {
    return "safety";
  }

  if (
    search.includes("login") ||
    search.includes("password") ||
    search.includes("bug") ||
    search.includes("error") ||
    search.includes("broken") ||
    search.includes("not working") ||
    search.includes("upload") ||
    search.includes("photo") ||
    search.includes("app") ||
    search.includes("website") ||
    search.includes("button") ||
    search.includes("technical")
  ) {
    return "technical";
  }

  if (
    search.includes("partner") ||
    search.includes("affiliate") ||
    search.includes("ambassador") ||
    search.includes("referral") ||
    search.includes("campaign") ||
    search.includes("reward") ||
    search.includes("network program")
  ) {
    return "partner";
  }

  if (
    search.includes("book") ||
    search.includes("booking") ||
    search.includes("schedule") ||
    search.includes("reschedule") ||
    search.includes("cancel") ||
    search.includes("appointment") ||
    search.includes("availability") ||
    search.includes("confirmed") ||
    search.includes("confirmation") ||
    search.includes("application question")
  ) {
    return "booking";
  }

  if (
    search.includes("guru") ||
    search.includes("sitter") ||
    search.includes("provider") ||
    search.includes("profile") ||
    search.includes("service area") ||
    search.includes("availability")
  ) {
    return "guru-support";
  }

  if (
    search.includes("customer") ||
    search.includes("pet parent") ||
    search.includes("client") ||
    search.includes("account") ||
    search.includes("pet") ||
    search.includes("care")
  ) {
    return "customer-support";
  }

  return "general";
}

function getThreadType({
  conversation,
  senderProfile,
  recipientProfile,
  participants,
}: {
  conversation?: ConversationRow | null;
  senderProfile?: ProfileRow | null;
  recipientProfile?: ProfileRow | null;
  participants: ConversationParticipantRow[];
}) {
  const participantRoles = participants.map((participant) =>
    normalizeRole(participant.role),
  );

  const senderRole = getProfileRole(senderProfile);
  const recipientRole = getProfileRole(recipientProfile);

  const hasAdmin =
    participantRoles.includes("admin") ||
    senderRole === "admin" ||
    recipientRole === "admin";

  const hasGuru =
    participantRoles.includes("guru") ||
    senderRole === "guru" ||
    recipientRole === "guru" ||
    Boolean(conversation?.guru_id);

  const hasCustomer =
    participantRoles.includes("customer") ||
    senderRole === "customer" ||
    recipientRole === "customer" ||
    Boolean(conversation?.customer_id);

  const text = `${conversation?.subject || ""} ${conversation?.status || ""}`.toLowerCase();
  const looksLikeAdminSupport =
    text.includes("admin") ||
    text.includes("support") ||
    text.includes("payout") ||
    text.includes("refund") ||
    text.includes("dispute") ||
    text.includes("escalation");

  if (hasGuru && hasCustomer && !hasAdmin) return "Guru ↔ Customer";
  if (hasGuru && (hasAdmin || looksLikeAdminSupport)) return "Guru ↔ Admin";
  if (hasCustomer && (hasAdmin || looksLikeAdminSupport)) {
    return "Customer ↔ Admin";
  }
  if (hasAdmin || looksLikeAdminSupport) return "Customer ↔ Admin";

  return "General";
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  const escaped = text.replaceAll('"', '""');

  if (
    escaped.includes(",") ||
    escaped.includes("\n") ||
    escaped.includes("\r") ||
    escaped.includes('"')
  ) {
    return `"${escaped}"`;
  }

  return escaped;
}

function toCsv(rows: MessageExportRow[]) {
  const headers: Array<keyof MessageExportRow> = [
    "thread_id",
    "conversation_id",
    "message_id",
    "thread_type",
    "inquiry_type",
    "topic",
    "message_type",
    "subject",
    "conversation_status",
    "booking_id",
    "customer_id",
    "customer_name",
    "customer_email",
    "guru_id",
    "guru_name",
    "guru_email",
    "sender_id",
    "sender_name",
    "sender_email",
    "sender_role",
    "recipient_id",
    "recipient_name",
    "recipient_email",
    "recipient_role",
    "message_preview",
    "content",
    "body",
    "is_read",
    "read_at",
    "message_status",
    "created_at",
    "edited_at",
  ];

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
}

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<SafeAdminQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Message export query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Message export query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}

async function getMessageExportRows() {
  const [messagesResult, conversationsResult, participantsResult] =
    await Promise.all([
      safeAdminQuery(
        supabaseAdmin
          .from("messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10000),
        "messages",
      ),
      safeAdminQuery(
        supabaseAdmin
          .from("conversations")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5000),
        "conversations",
      ),
      safeAdminQuery(
        supabaseAdmin
          .from("conversation_participants")
          .select("*")
          .limit(10000),
        "conversation_participants",
      ),
    ]);

  const messages = ((messagesResult.data || []) as MessageRow[]).filter(
    (message) => Boolean(message) && message.is_deleted !== true,
  );

  const conversations = ((conversationsResult.data || []) as ConversationRow[]).filter(
    Boolean,
  );

  const participants = (
    (participantsResult.data || []) as ConversationParticipantRow[]
  ).filter(Boolean);

  const conversationMap = new Map<string, ConversationRow>();
  const participantMap = new Map<string, ConversationParticipantRow[]>();

  for (const conversation of conversations) {
    if (conversation.id) conversationMap.set(conversation.id, conversation);
  }

  for (const participant of participants) {
    const conversationId = participant.conversation_id || "";
    if (!conversationId) continue;

    const existing = participantMap.get(conversationId) || [];
    existing.push(participant);
    participantMap.set(conversationId, existing);
  }

  const profileIds = Array.from(
    new Set(
      [
        ...messages.flatMap((message) => [
          message.sender_id || "",
          message.recipient_id || "",
        ]),
        ...conversations.flatMap((conversation) => [
          conversation.customer_id || "",
          conversation.guru_id || "",
          conversation.started_by_user_id || "",
        ]),
        ...participants.map((participant) => participant.user_id || ""),
      ].filter(Boolean),
    ),
  );

  const profilesResult = profileIds.length
    ? await safeAdminQuery(
        supabaseAdmin
          .from("profiles")
          .select("*")
          .in("id", profileIds)
          .limit(10000),
        "profiles",
      )
    : { data: [], error: null };

  const profiles = ((profilesResult.data || []) as ProfileRow[]).filter(Boolean);
  const profileMap = new Map<string, ProfileRow>();

  for (const profile of profiles) {
    if (profile.id) profileMap.set(profile.id, profile);
  }

  return messages.map((message) => {
    const conversationId = message.conversation_id || "";
    const threadId = getThreadKeyFromMessage(message);
    const conversation = conversationId ? conversationMap.get(conversationId) : null;
    const threadParticipants = conversationId
      ? participantMap.get(conversationId) || []
      : [];

    const senderProfile = message.sender_id
      ? profileMap.get(message.sender_id)
      : null;
    const recipientProfile = message.recipient_id
      ? profileMap.get(message.recipient_id)
      : null;

    const customerProfile = conversation?.customer_id
      ? profileMap.get(conversation.customer_id)
      : getProfileRole(senderProfile) === "customer"
        ? senderProfile
        : getProfileRole(recipientProfile) === "customer"
          ? recipientProfile
          : null;

    const guruProfile = conversation?.guru_id
      ? profileMap.get(conversation.guru_id)
      : getProfileRole(senderProfile) === "guru"
        ? senderProfile
        : getProfileRole(recipientProfile) === "guru"
          ? recipientProfile
          : null;

    return {
      thread_id: threadId,
      conversation_id: conversationId,
      message_id: message.id || "",
      thread_type: getThreadType({
        conversation,
        senderProfile,
        recipientProfile,
        participants: threadParticipants,
      }),
      inquiry_type: classifyInquiryType(conversation || null, message),
      topic: message.topic || conversation?.topic || "",
      message_type: message.message_type || "",
      subject: conversation?.subject || "",
      conversation_status: conversation?.status || "",
      booking_id: conversation?.booking_id || "",
      customer_id: conversation?.customer_id || customerProfile?.id || "",
      customer_name: getProfileName(customerProfile),
      customer_email: customerProfile?.email || "",
      guru_id: conversation?.guru_id || guruProfile?.id || "",
      guru_name: getProfileName(guruProfile),
      guru_email: guruProfile?.email || "",
      sender_id: message.sender_id || "",
      sender_name: getProfileName(senderProfile),
      sender_email: senderProfile?.email || "",
      sender_role: getProfileRole(senderProfile),
      recipient_id: message.recipient_id || "",
      recipient_name: getProfileName(recipientProfile),
      recipient_email: recipientProfile?.email || "",
      recipient_role: getProfileRole(recipientProfile),
      message_preview: getMessagePreview(
        message,
        conversation?.last_message_preview || "",
      ),
      content: message.content || "",
      body: message.body || "",
      is_read: message.is_read === true ? "true" : "false",
      read_at: message.read_at || "",
      message_status: message.status || "",
      created_at: message.created_at || "",
      edited_at: message.edited_at || "",
    };
  });
}

export async function GET() {
  const rows = await getMessageExportRows();
  const csv = toCsv(rows);
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sitguru-message-center-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}