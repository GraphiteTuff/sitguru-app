import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
  Smartphone,
  UserRound,
  UsersRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mergeAdminBcc } from "@/lib/email/admin-bcc";
import MessageRealtimeRefresh from "@/components/MessageRealtimeRefresh";
import DismissibleFixedChat from "@/components/messaging/DismissibleFixedChat";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    conversationId: string;
  }>;
  searchParams?: Promise<{
    sent?: string;
    delivery?: string;
    error?: string;
  }>;
};

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  booking_id?: string | null;
  community_event_id?: string | null;
  started_by_user_id?: string | null;
  subject?: string | null;
  status?: string | null;
  topic?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
};

type MessageRow = {
  id: string;
  conversation_id?: string | null;
  sender_id?: string | null;
  recipient_id?: string | null;
  sender_role?: string | null;
  recipient_role?: string | null;
  sender_name_snapshot?: string | null;
  sender_email_snapshot?: string | null;
  sender_phone_snapshot?: string | null;
  sender_role_snapshot?: string | null;
  recipient_name_snapshot?: string | null;
  recipient_email_snapshot?: string | null;
  recipient_phone_snapshot?: string | null;
  recipient_role_snapshot?: string | null;
  content?: string | null;
  body?: string | null;
  message_type?: string | null;
  topic?: string | null;
  status?: string | null;
  read_at?: string | null;
  is_read?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  edited_at?: string | null;
};

type ParticipantRow = {
  conversation_id: string;
  user_id: string;
  role?: string | null;
  last_read_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  mobile_phone?: string | null;
  cell_phone?: string | null;
  role?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  profile_picture_url?: string | null;
  photo_url?: string | null;
};

type GuruRow = {
  id?: string | number | null;
  user_id?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  mobile_phone?: string | null;
  cell_phone?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
};

type RecipientContact = {
  userId: string | null;
  role: string;
  name: string;
  email: string;
  phone: string;
  isSnapshotOnly?: boolean;
};

type ParticipantCard = {
  user_id: string;
  role: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  isSnapshotOnly?: boolean;
};

const SUPER_USER_EMAILS = new Set(["jason@sitguru.com", "nette@sitguru.com"]);

const defaultAdminAvatar = "/images/sitguru-message-avatar.jpg";

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isSuperUserEmail(email: string | null | undefined) {
  return SUPER_USER_EMAILS.has((email || "").toLowerCase());
}

function getBaseUrl() {
  const raw =
    safeString(process.env.NEXT_PUBLIC_APP_URL) ||
    safeString(process.env.NEXT_PUBLIC_SITE_URL) ||
    "https://www.sitguru.com";

  return raw.replace(/\/+$/, "");
}

function getSupportFromEmail() {
  return (
    safeString(process.env.SITGURU_SUPPORT_FROM) ||
    safeString(process.env.RESEND_FROM_EMAIL) ||
    "SitGuru <support@sitguru.com>"
  );
}

function getSupportReplyToEmail() {
  return (
    safeString(process.env.RESEND_REPLY_TO_EMAIL) ||
    safeString(process.env.SITGURU_SUPPORT_EMAIL) ||
    "support@sitguru.com"
  );
}

function normalizeRole(role?: string | null) {
  const value = safeString(role).toLowerCase();

  if (!value) return "user";
  if (value === "provider" || value === "sitter") return "guru";
  if (value === "pet_parent" || value === "pet parent" || value === "client") {
    return "customer";
  }
  if (value.includes("admin") || value === "founder" || value === "owner") {
    return "admin";
  }
  if (value.includes("ambassador")) return "ambassador";
  if (value.includes("visitor") || value.includes("homepage")) return "visitor";

  return value;
}

function getRoleLabel(role?: string | null) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "admin") return "Admin";
  if (normalizedRole === "guru") return "Guru";
  if (normalizedRole === "customer") return "Pet Parent";
  if (normalizedRole === "ambassador") return "Ambassador";
  if (normalizedRole === "visitor") return "Website Visitor";

  return "SitGuru User";
}


function getDirectMessageTypeForRole(role?: string | null) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "ambassador") return "direct_ambassador";
  if (normalizedRole === "guru") return "direct_guru";
  if (normalizedRole === "customer") return "direct_customer";
  if (normalizedRole === "admin") return "direct_admin";
  if (normalizedRole === "visitor") return "homepage_messenger";

  return "direct_message";
}

function getSnapshotContactKey(message: MessageRow, direction: "sender" | "recipient") {
  const email =
    direction === "sender"
      ? safeString(message.sender_email_snapshot)
      : safeString(message.recipient_email_snapshot);
  const name =
    direction === "sender"
      ? safeString(message.sender_name_snapshot)
      : safeString(message.recipient_name_snapshot);
  const role =
    direction === "sender"
      ? normalizeRole(message.sender_role || message.sender_role_snapshot)
      : normalizeRole(message.recipient_role || message.recipient_role_snapshot);

  return `${direction}:${role}:${email || name}`.toLowerCase();
}

function getProfileName(profile?: ProfileRow | null) {
  if (!profile) return "SitGuru User";

  return (
    safeString(profile.full_name) ||
    safeString(profile.display_name) ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    safeString(profile.email).split("@")[0] ||
    "SitGuru User"
  );
}

function getProfileAvatar(profile?: ProfileRow | null) {
  if (!profile) return "";

  return (
    safeString(profile.avatar_url) ||
    safeString(profile.profile_photo_url) ||
    safeString(profile.profile_picture_url) ||
    safeString(profile.photo_url)
  );
}

function getProfilePhone(profile?: ProfileRow | null) {
  if (!profile) return "";

  return (
    safeString(profile.phone) ||
    safeString(profile.phone_number) ||
    safeString(profile.mobile_phone) ||
    safeString(profile.cell_phone)
  );
}

function getGuruName(guru?: GuruRow | null) {
  if (!guru) return "";

  return (
    safeString(guru.display_name) ||
    safeString(guru.full_name) ||
    safeString(guru.email).split("@")[0]
  );
}

function getGuruAvatar(guru?: GuruRow | null) {
  if (!guru) return "";

  return safeString(guru.avatar_url) || safeString(guru.profile_photo_url);
}

function getGuruPhone(guru?: GuruRow | null) {
  if (!guru) return "";

  return (
    safeString(guru.phone) ||
    safeString(guru.phone_number) ||
    safeString(guru.mobile_phone) ||
    safeString(guru.cell_phone)
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDateTime(value?: string | null) {
  if (!value) return "No recent activity";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No recent activity";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getMessageBody(message: MessageRow) {
  return safeString(message.content) || safeString(message.body);
}

function isUnreadMessage(message: MessageRow) {
  const status = safeString(message.status).toLowerCase();

  if (message.is_read === false) return true;
  if (!message.read_at && status !== "read" && status !== "archived") return true;

  return false;
}

function normalizeUsPhone(phone: string) {
  const clean = safeString(phone);
  if (!clean) return "";

  if (clean.startsWith("+")) return clean;

  const digits = clean.replace(/\D/g, "");

  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;

  return "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildThreadUrl(conversationId: string) {
  return `${getBaseUrl()}/messages/${conversationId}`;
}


function getDirectMessageIdFromThreadKey(threadKey: string) {
  const decodedThreadKey = decodeURIComponent(safeString(threadKey));

  if (!decodedThreadKey.startsWith("direct-message-")) return "";

  return decodedThreadKey.replace(/^direct-message-/, "").trim();
}

function getConversationRoleId(params: {
  message: MessageRow;
  role: "customer" | "guru";
}) {
  const senderRole = normalizeRole(
    params.message.sender_role || params.message.sender_role_snapshot,
  );
  const recipientRole = normalizeRole(
    params.message.recipient_role || params.message.recipient_role_snapshot,
  );

  if (senderRole === params.role) return safeString(params.message.sender_id);
  if (recipientRole === params.role) return safeString(params.message.recipient_id);

  return "";
}

async function recoverOrphanMessageThread(params: {
  threadKey: string;
  adminUserId: string;
}) {
  const messageId = getDirectMessageIdFromThreadKey(params.threadKey);

  if (!messageId) return "";

  const { data: orphanMessage, error: orphanMessageError } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .maybeSingle<MessageRow>();

  if (orphanMessageError) {
    console.error("Admin message orphan lookup failed:", orphanMessageError.message);
    return "";
  }

  if (!orphanMessage?.id) return "";

  const existingConversationId = safeString(orphanMessage.conversation_id);

  if (existingConversationId) return existingConversationId;

  const now = new Date().toISOString();
  const bodyPreview = getMessageBody(orphanMessage).slice(0, 240);
  const senderRole = normalizeRole(
    orphanMessage.sender_role || orphanMessage.sender_role_snapshot,
  );
  const recipientRole = normalizeRole(
    orphanMessage.recipient_role || orphanMessage.recipient_role_snapshot,
  );
  const topic =
    safeString(orphanMessage.topic) ||
    safeString(orphanMessage.message_type) ||
    getDirectMessageTypeForRole(senderRole === "admin" ? recipientRole : senderRole);

  const conversationPayload: Record<string, unknown> = {
    subject: "SitGuru Message Thread",
    status: "open",
    topic,
    started_by_user_id: safeString(orphanMessage.sender_id) || params.adminUserId,
    last_message_at: orphanMessage.created_at || now,
    last_message_preview: bodyPreview || "SitGuru message thread",
    created_at: orphanMessage.created_at || now,
    updated_at: now,
  };

  const customerId = getConversationRoleId({
    message: orphanMessage,
    role: "customer",
  });
  const guruId = getConversationRoleId({ message: orphanMessage, role: "guru" });

  if (customerId) conversationPayload.customer_id = customerId;
  if (guruId) conversationPayload.guru_id = guruId;

  const { data: createdConversation, error: conversationError } = await supabaseAdmin
    .from("conversations")
    .insert(conversationPayload)
    .select("id")
    .single();

  if (conversationError || !createdConversation?.id) {
    console.error("Admin message orphan conversation recovery failed:", conversationError);
    return "";
  }

  const recoveredConversationId = String(createdConversation.id);

  const participantRows: ParticipantRow[] = [];

  if (orphanMessage.sender_id) {
    participantRows.push({
      conversation_id: recoveredConversationId,
      user_id: orphanMessage.sender_id,
      role: senderRole || "user",
      created_at: now,
      updated_at: now,
    });
  }

  if (orphanMessage.recipient_id && orphanMessage.recipient_id !== orphanMessage.sender_id) {
    participantRows.push({
      conversation_id: recoveredConversationId,
      user_id: orphanMessage.recipient_id,
      role: recipientRole || "user",
      created_at: now,
      updated_at: now,
    });
  }

  if (
    params.adminUserId &&
    !participantRows.some((participant) => participant.user_id === params.adminUserId)
  ) {
    participantRows.push({
      conversation_id: recoveredConversationId,
      user_id: params.adminUserId,
      role: "admin",
      created_at: now,
      updated_at: now,
    });
  }

  if (participantRows.length > 0) {
    const { error: participantError } = await supabaseAdmin
      .from("conversation_participants")
      .upsert(participantRows, {
        onConflict: "conversation_id,user_id",
        ignoreDuplicates: false,
      });

    if (participantError) {
      console.warn(
        "Admin message orphan participant recovery skipped:",
        participantError.message,
      );
    }
  }

  const { error: messageUpdateError } = await supabaseAdmin
    .from("messages")
    .update({
      conversation_id: recoveredConversationId,
      updated_at: now,
    })
    .eq("id", orphanMessage.id);

  if (messageUpdateError) {
    console.error("Admin message orphan update failed:", messageUpdateError.message);
  }

  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${recoveredConversationId}`);

  return recoveredConversationId;
}

async function sendRecipientEmail(params: {
  toEmail: string;
  recipientName: string;
  senderName: string;
  conversationId: string;
}) {
  try {
    const apiKey = safeString(process.env.RESEND_API_KEY);
    const toEmail = safeString(params.toEmail);

    if (!apiKey || !toEmail) {
      return false;
    }

    const resend = new Resend(apiKey);
    const threadUrl = buildThreadUrl(params.conversationId);
    const safeRecipientName = escapeHtml(params.recipientName || "there");
    const safeSenderName = escapeHtml(params.senderName || "SitGuru Admin");

    const result = await resend.emails.send({
      from: getSupportFromEmail(),
      to: [toEmail],
      bcc: mergeAdminBcc(toEmail),
      replyTo: getSupportReplyToEmail(),
      subject: "New SitGuru Message",
      html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; background: #f6fbf7; padding: 24px;">
          <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #dcefe2; border-radius: 18px; overflow: hidden;">
            <div style="background: #0f5132; color: #ffffff; padding: 24px;">
              <h1 style="margin: 0; font-size: 24px;">New SitGuru Message</h1>
              <p style="margin: 8px 0 0; color: #d9f7e5;">Trusted Pet Care. Simplified.</p>
            </div>
            <div style="padding: 24px; color: #123524;">
              <p style="font-size: 16px; line-height: 1.6;">Hi ${safeRecipientName},</p>
              <p style="font-size: 16px; line-height: 1.6;">
                You have a new message from ${safeSenderName} in your SitGuru account.
              </p>
              <p style="margin: 24px 0;">
                <a href="${threadUrl}" style="display: inline-block; background: #0f8f4f; color: #ffffff; text-decoration: none; padding: 13px 20px; border-radius: 999px; font-weight: 700;">
                  Open SitGuru Message
                </a>
              </p>
              <p style="font-size: 13px; color: #607568; line-height: 1.6;">
                Please log in to SitGuru to read and reply to this message.
              </p>
            </div>
          </div>
        </div>
      `,
      text: [
        `Hi ${params.recipientName || "there"},`,
        "",
        `You have a new message from ${params.senderName || "SitGuru Admin"} in your SitGuru account.`,
        "",
        `Open your message here: ${threadUrl}`,
        "",
        "Thank you,",
        "SitGuru",
        "Trusted Pet Care. Simplified.",
      ].join("\n"),
    });

    if (result.error) {
      console.error("Recipient email delivery failed:", result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Recipient email delivery error:", error);
    return false;
  }
}

async function sendRecipientSms(params: {
  toPhone: string;
  conversationId: string;
}) {
  try {
    const accountSid = safeString(process.env.TWILIO_ACCOUNT_SID);
    const authToken = safeString(process.env.TWILIO_AUTH_TOKEN);
    const messagingServiceSid = safeString(process.env.TWILIO_MESSAGING_SERVICE_SID);
    const fromPhone = safeString(process.env.TWILIO_PHONE_NUMBER);
    const toPhone = normalizeUsPhone(params.toPhone);

    if (!accountSid || !authToken || !toPhone || (!messagingServiceSid && !fromPhone)) {
      return false;
    }

    const threadUrl = buildThreadUrl(params.conversationId);
    const messageBody = `SitGuru: You have a new message from SitGuru Admin. Log in to view and reply: ${threadUrl}`;

    const body = new URLSearchParams({
      To: toPhone,
      Body: messageBody,
    });

    if (messagingServiceSid) {
      body.set("MessagingServiceSid", messagingServiceSid);
    } else {
      body.set("From", fromPhone);
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString(
            "base64",
          )}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("Recipient SMS delivery failed:", response.status, text);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Recipient SMS delivery error:", error);
    return false;
  }
}

async function createRecipientNotification(params: {
  userId: string;
  conversationId: string;
  preview: string;
}) {
  try {
    const now = new Date().toISOString();
    const threadHref = `/messages/${params.conversationId}`;

    const { error } = await supabaseAdmin.from("notifications").insert({
      user_id: params.userId,
      title: "New SitGuru Message",
      body: params.preview || "You have a new message from SitGuru Admin.",
      type: "message",
      href: threadHref,
      link: threadHref,
      is_read: false,
      created_at: now,
      updated_at: now,
    });

    if (error) {
      console.error("Recipient notification insert failed:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Recipient notification insert error:", error);
    return false;
  }
}


function getFallbackRecipientFromForm(formData: FormData) {
  const userId = safeString(formData.get("fallbackRecipientUserId"));
  const role = normalizeRole(safeString(formData.get("fallbackRecipientRole")));
  const name = safeString(formData.get("fallbackRecipientName"));
  const email = safeString(formData.get("fallbackRecipientEmail"));
  const phone = safeString(formData.get("fallbackRecipientPhone"));

  if (!userId && !name && !email && !phone) return null;

  return {
    userId: userId || null,
    role: role === "admin" ? "user" : role || "user",
    name: name || email || "SitGuru Contact",
    email,
    phone,
    isSnapshotOnly: !userId,
  } satisfies RecipientContact;
}

function getReplyRecipientFallbackFromMessages(messageRows: MessageRow[]) {
  const candidates = [...messageRows].reverse().flatMap((message) => [
    {
      userId: safeString(message.sender_id),
      role: normalizeRole(message.sender_role || message.sender_role_snapshot),
      name: safeString(message.sender_name_snapshot),
      email: safeString(message.sender_email_snapshot),
      phone: safeString(message.sender_phone_snapshot),
    },
    {
      userId: safeString(message.recipient_id),
      role: normalizeRole(message.recipient_role || message.recipient_role_snapshot),
      name: safeString(message.recipient_name_snapshot),
      email: safeString(message.recipient_email_snapshot),
      phone: safeString(message.recipient_phone_snapshot),
    },
  ]);

  const match = candidates.find(
    (candidate) =>
      candidate.role !== "admin" &&
      Boolean(candidate.userId || candidate.name || candidate.email || candidate.phone),
  );

  if (!match) return null;

  return {
    userId: match.userId || null,
    role: match.role || "user",
    name: match.name || match.email || "SitGuru Contact",
    email: match.email,
    phone: match.phone,
    isSnapshotOnly: !match.userId,
  } satisfies RecipientContact;
}

async function getConversationRecipient({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [{ data: conversation }, { data: participants }, { data: messages }] =
    await Promise.all([
      supabaseAdmin
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle<ConversationRow>(),
      supabaseAdmin
        .from("conversation_participants")
        .select("*")
        .eq("conversation_id", conversationId),
      supabaseAdmin
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true }),
    ]);

  const participantRows = (participants || []) as ParticipantRow[];
  const messageRows = (messages || []) as MessageRow[];

  const preferredRecipient =
    participantRows.find(
      (participant) =>
        participant.user_id !== currentUserId &&
        normalizeRole(participant.role) !== "admin",
    ) || participantRows.find((participant) => participant.user_id !== currentUserId);

  const recipientUserId =
    preferredRecipient?.user_id ||
    conversation?.guru_id ||
    conversation?.customer_id ||
    "";

  if (recipientUserId) {
    const [{ data: profile }, { data: guru }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", recipientUserId)
        .maybeSingle<ProfileRow>(),
      supabaseAdmin
        .from("gurus")
        .select("*")
        .eq("user_id", recipientUserId)
        .maybeSingle<GuruRow>(),
    ]);

    const profileRow = profile as ProfileRow | null;
    const guruRow = guru as GuruRow | null;

    const recipientRole = normalizeRole(
      preferredRecipient?.role ||
        profileRow?.role ||
        (guruRow?.user_id ? "guru" : "user"),
    );

    const recipientName =
      getGuruName(guruRow) || getProfileName(profileRow) || "SitGuru User";

    const recipientEmail =
      safeString(profileRow?.email) || safeString(guruRow?.email);

    const recipientPhone = getProfilePhone(profileRow) || getGuruPhone(guruRow);

    return {
      userId: recipientUserId,
      role: recipientRole,
      name: recipientName,
      email: recipientEmail,
      phone: recipientPhone,
      isSnapshotOnly: false,
    } satisfies RecipientContact;
  }

  const snapshotRecipient = [...messageRows].reverse().find((message) => {
    const recipientRole = normalizeRole(
      message.recipient_role || message.recipient_role_snapshot,
    );
    const hasRecipientSnapshot =
      safeString(message.recipient_name_snapshot) ||
      safeString(message.recipient_email_snapshot);

    return recipientRole !== "admin" && Boolean(hasRecipientSnapshot);
  });

  if (snapshotRecipient) {
    return {
      userId: null,
      role: normalizeRole(
        snapshotRecipient.recipient_role || snapshotRecipient.recipient_role_snapshot,
      ),
      name:
        safeString(snapshotRecipient.recipient_name_snapshot) ||
        safeString(snapshotRecipient.recipient_email_snapshot) ||
        "SitGuru Contact",
      email: safeString(snapshotRecipient.recipient_email_snapshot),
      phone: safeString(snapshotRecipient.recipient_phone_snapshot),
      isSnapshotOnly: true,
    } satisfies RecipientContact;
  }

  const snapshotSender = [...messageRows].reverse().find((message) => {
    const senderRole = normalizeRole(message.sender_role || message.sender_role_snapshot);
    const hasSenderSnapshot =
      safeString(message.sender_name_snapshot) ||
      safeString(message.sender_email_snapshot);

    return senderRole !== "admin" && Boolean(hasSenderSnapshot);
  });

  if (snapshotSender) {
    return {
      userId: null,
      role: normalizeRole(snapshotSender.sender_role || snapshotSender.sender_role_snapshot),
      name:
        safeString(snapshotSender.sender_name_snapshot) ||
        safeString(snapshotSender.sender_email_snapshot) ||
        "SitGuru Contact",
      email: safeString(snapshotSender.sender_email_snapshot),
      phone: safeString(snapshotSender.sender_phone_snapshot),
      isSnapshotOnly: true,
    } satisfies RecipientContact;
  }

  return null;
}

async function writeAdminAuditLog(params: {
  actorId: string;
  actorEmail: string | null;
  conversationId: string;
  recipient: RecipientContact;
  notificationSent: boolean;
  emailSent: boolean;
  smsSent: boolean;
}) {
  try {
    const { error } = await supabaseAdmin.from("admin_audit_logs").insert({
      actor_id: params.actorId,
      actor_email: params.actorEmail || null,
      action: "admin_message_sent",
      area: "admin.messages",
      target_type: "conversation",
      target_id: params.conversationId,
      metadata: {
        recipient_user_id: params.recipient.userId,
        recipient_role: params.recipient.role,
        recipient_email_available: Boolean(params.recipient.email),
        recipient_phone_available: Boolean(params.recipient.phone),
        notification_sent: params.notificationSent,
        email_sent: params.emailSent,
        sms_sent: params.smsSent,
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Admin audit log insert failed:", error.message);
    }
  } catch (error) {
    console.error("Admin audit log insert error:", error);
  }
}

async function sendAdminMessage(conversationId: string, formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  if (!isSuperUserEmail(user.email)) {
    redirect("/admin/login");
  }

  const messageBody = safeString(formData.get("message"));
  const topic = safeString(formData.get("topic")) || "other";

  if (!messageBody || messageBody.length < 2) {
    redirect(`/admin/messages/${conversationId}?error=empty`);
  }

  const recipient =
    (await getConversationRecipient({
      conversationId,
      currentUserId: user.id,
    })) || getFallbackRecipientFromForm(formData);

  if (!recipient) {
    redirect(`/admin/messages/${conversationId}?error=recipient`);
  }

  const now = new Date().toISOString();
  const preview = messageBody.slice(0, 240);

  const { error: messageError } = await supabaseAdmin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    recipient_id: recipient.userId || null,
    sender_role: "admin",
    recipient_role: recipient.role || "user",
    sender_name_snapshot: "SitGuru Admin",
    sender_email_snapshot: user.email || null,
    sender_role_snapshot: "admin",
    recipient_name_snapshot: recipient.name,
    recipient_email_snapshot: recipient.email || null,
    recipient_phone_snapshot: recipient.phone || null,
    recipient_role_snapshot: recipient.role || "user",
    content: messageBody,
    body: messageBody,
    message_type: getDirectMessageTypeForRole(recipient.role),
    topic,
    status: "unread",
    is_read: false,
    created_at: now,
    updated_at: now,
  });

  if (messageError) {
    console.error("Admin message insert failed:", messageError);
    redirect(`/admin/messages/${conversationId}?error=message`);
  }

  await supabaseAdmin
    .from("conversations")
    .update({
      last_message_preview: preview,
      last_message_at: now,
      updated_at: now,
      topic,
      status: "open",
    })
    .eq("id", conversationId);

  const participantUpserts: ParticipantRow[] = [
    {
      conversation_id: conversationId,
      user_id: user.id,
      role: "admin",
      updated_at: now,
    },
  ];

  if (recipient.userId) {
    participantUpserts.push({
      conversation_id: conversationId,
      user_id: recipient.userId,
      role: recipient.role || "user",
      updated_at: now,
    });
  }

  await supabaseAdmin.from("conversation_participants").upsert(participantUpserts, {
    onConflict: "conversation_id,user_id",
    ignoreDuplicates: false,
  });

  const notificationSent = recipient.userId
    ? await createRecipientNotification({
        userId: recipient.userId,
        conversationId,
        preview,
      })
    : false;

  const emailSent = await sendRecipientEmail({
    toEmail: recipient.email,
    recipientName: recipient.name,
    senderName: "SitGuru Admin",
    conversationId,
  });

  const smsSent = await sendRecipientSms({
    toPhone: recipient.phone,
    conversationId,
  });

  await writeAdminAuditLog({
    actorId: user.id,
    actorEmail: user.email || null,
    conversationId,
    recipient,
    notificationSent,
    emailSent,
    smsSent,
  });

  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${conversationId}`);
  revalidatePath(`/messages/${conversationId}`);

  const delivery = [
    notificationSent ? "app" : "",
    emailSent ? "email" : "",
    smsSent ? "sms" : "",
  ]
    .filter(Boolean)
    .join("_");

  redirect(`/admin/messages/${conversationId}?sent=1&delivery=${delivery || "none"}`);
}

function Avatar({
  name,
  src,
  role,
  isActive = false,
}: {
  name: string;
  src?: string | null;
  role?: string | null;
  isActive?: boolean;
}) {
  const normalizedRole = normalizeRole(role);

  return (
    <span className="relative inline-flex h-11 w-11 shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-11 w-11 rounded-full border border-green-100 object-cover shadow-sm"
        />
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-green-100 bg-green-50 text-xs font-black text-green-800 shadow-sm">
          {normalizedRole === "admin" ? (
            <ShieldCheck className="h-5 w-5" />
          ) : normalizedRole === "guru" ? (
            <UsersRound className="h-5 w-5" />
          ) : (
            getInitials(name) || <UserRound className="h-5 w-5" />
          )}
        </span>
      )}

      {isActive ? (
        <span
          aria-label="Active thread"
          title="Active thread"
          className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm"
        />
      ) : null}
    </span>
  );
}

function DeliveryBanner({
  sent,
  delivery,
  error,
}: {
  sent?: string;
  delivery?: string;
  error?: string;
}) {
  if (sent === "1") {
    const parts = safeString(delivery).split("_");

    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <h2 className="text-base font-black">Message sent</h2>
              <p className="text-xs font-semibold text-emerald-900">
                Saved to the thread and delivery alerts were attempted.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-green-900 ring-1 ring-green-100">
              <Bell className="h-3 w-3" />
              In-app {parts.includes("app") ? "sent" : "not sent"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-green-900 ring-1 ring-green-100">
              <Mail className="h-3 w-3" />
              Email {parts.includes("email") ? "sent" : "not sent"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-green-900 ring-1 ring-green-100">
              <Smartphone className="h-3 w-3" />
              Text {parts.includes("sms") ? "sent" : "not sent"}
            </span>
          </div>
        </div>
      </section>
    );
  }

  if (!error) return null;

  const message =
    error === "empty"
      ? "Please type a message before sending."
      : error === "recipient"
        ? "SitGuru could not find the other participant for this thread."
        : "The admin message could not be saved. Please check the messages table and try again.";

  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-950 shadow-sm">
      <h2 className="text-base font-black">Message was not sent</h2>
      <p className="mt-1 text-xs font-semibold leading-5">{message}</p>
    </section>
  );
}


function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#e3ece5] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-green-800">{icon}</span>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          {label}
        </p>
      </div>
      <p className="mt-2 text-2xl font-black text-green-950">{value}</p>
    </div>
  );
}

function AdminQuickChatBox({
  conversation,
  messageRows,
  replyRecipientFallback,
  participantCards,
}: {
  conversation: ConversationRow;
  messageRows: MessageRow[];
  replyRecipientFallback: RecipientContact | null;
  participantCards: ParticipantCard[];
}) {
  const recentMessages = messageRows.slice(-3);
  const contactCard =
    participantCards.find((participant) => normalizeRole(participant.role) !== "admin") ||
    participantCards[0] ||
    null;
  const contactName =
    contactCard?.name || replyRecipientFallback?.name || "SitGuru Contact";
  const contactRole =
    contactCard?.role || replyRecipientFallback?.role || "user";
  const contactAvatar = contactCard?.avatar || "";

  return (
    <DismissibleFixedChat
      label="Admin Quick Chat"
      storageKey={`admin-quick-chat:${conversation.id}`}
      className="fixed bottom-4 right-4 z-40 w-[min(430px,calc(100vw-2rem))]"
    >
    <aside className="overflow-hidden rounded-[1.5rem] border border-green-100 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.22)]">
      <div className="border-b border-green-100 bg-green-50 p-4">
        <div className="flex items-start justify-between gap-3 pl-12">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              name="SitGuru Admin"
              src={defaultAdminAvatar}
              role="admin"
              isActive
            />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-green-700">
                Admin Quick Chat
              </p>
              <h2 className="truncate text-lg font-black leading-tight text-green-950">
                SitGuru Admin
              </h2>
              <p className="truncate text-xs font-bold text-slate-600">
                Admin · Active thread
              </p>
            </div>
          </div>

          <Link
            href="/admin/messages"
            className="rounded-full border border-green-200 bg-white px-3 py-1 text-xs font-black text-green-800 transition hover:bg-green-50"
          >
            Inbox
          </Link>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-green-100 bg-white/80 p-3">
          <Avatar
            name={contactName}
            src={contactAvatar}
            role={contactRole}
            isActive
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">
              {contactName}
            </p>
            <p className="truncate text-xs font-bold text-slate-500">
              {getRoleLabel(contactRole)}
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-64 space-y-3 overflow-y-auto bg-white p-4">
        {recentMessages.length ? (
          recentMessages.map((message) => {
            const senderRole = normalizeRole(message.sender_role || message.sender_role_snapshot);
            const isAdmin = senderRole === "admin";
            const senderCard = message.sender_id
              ? participantCards.find((participant) => participant.user_id === message.sender_id)
              : null;
            const senderName = isAdmin
              ? "Admin"
              : safeString(message.sender_name_snapshot) ||
                senderCard?.name ||
                contactName ||
                getRoleLabel(senderRole);
            const senderAvatar = isAdmin ? defaultAdminAvatar : senderCard?.avatar || contactAvatar;

            return (
              <div
                key={`admin-quick-${message.id}`}
                className={`flex items-end gap-2 ${isAdmin ? "justify-end" : "justify-start"}`}
              >
                {!isAdmin ? (
                  <Avatar
                    name={senderName}
                    src={senderAvatar}
                    role={senderRole}
                    isActive
                  />
                ) : null}

                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm font-semibold leading-5 shadow-sm ${
                    isAdmin
                      ? "rounded-br-md bg-green-800 text-white"
                      : "rounded-bl-md bg-slate-100 text-slate-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {getMessageBody(message) || "Message content unavailable."}
                  </p>
                  <p
                    className={`mt-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                      isAdmin ? "text-green-100" : "text-slate-400"
                    }`}
                  >
                    {senderName} · {formatDateTime(message.created_at)}
                  </p>
                </div>

                {isAdmin ? (
                  <Avatar
                    name="SitGuru Admin"
                    src={defaultAdminAvatar}
                    role="admin"
                    isActive
                  />
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-green-200 bg-green-50 p-4 text-center text-sm font-bold text-slate-700">
            No messages yet. Send the first Admin reply below.
          </div>
        )}
      </div>

      <form
        action={sendAdminMessage.bind(null, conversation.id)}
        className="border-t border-green-100 bg-slate-50 p-4"
      >
        <input type="hidden" name="fallbackRecipientUserId" value={replyRecipientFallback?.userId || ""} />
        <input type="hidden" name="fallbackRecipientRole" value={replyRecipientFallback?.role || ""} />
        <input type="hidden" name="fallbackRecipientName" value={replyRecipientFallback?.name || ""} />
        <input type="hidden" name="fallbackRecipientEmail" value={replyRecipientFallback?.email || ""} />
        <input type="hidden" name="fallbackRecipientPhone" value={replyRecipientFallback?.phone || ""} />
        <input type="hidden" name="topic" value={conversation.topic || "direct_message"} />

        <label className="grid gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-green-800">
            Quick Admin Reply
          </span>
          <textarea
            name="message"
            rows={3}
            placeholder="Type a quick reply..."
            className="rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
          />
        </label>

        <button
          type="submit"
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
        >
          <Send className="h-4 w-4" />
          Send Quick Reply
        </button>

        <a
          href="#admin-reply"
          className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-green-200 bg-white px-4 py-2 text-xs font-black text-green-800 transition hover:bg-green-50"
        >
          Open full reply form
        </a>
      </form>
    </aside>
    </DismissibleFixedChat>
  );
}


export default async function AdminMessageThreadPage({
  params,
}: PageProps) {
  const { conversationId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  if (!isSuperUserEmail(user.email)) {
    redirect("/admin/login");
  }

  const { data: conversation } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .maybeSingle<ConversationRow>();

  if (!conversation) {
    const recoveredConversationId = await recoverOrphanMessageThread({
      threadKey: conversationId,
      adminUserId: user.id,
    });

    if (recoveredConversationId) {
      redirect(`/admin/messages?c=${encodeURIComponent(recoveredConversationId)}`);
    }

    redirect("/admin/messages?compose_error=missing_conversation");
  }

  redirect(`/admin/messages?c=${encodeURIComponent(conversation.id)}`);
}
