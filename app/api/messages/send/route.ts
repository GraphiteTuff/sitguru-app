import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  booking_id?: string | null;
  started_by_user_id?: string | null;
  subject?: string | null;
  status?: string | null;
  topic?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
};

type ConversationParticipantRow = {
  conversation_id: string;
  user_id: string;
  role?: string | null;
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
  user_role?: string | null;
  account_type?: string | null;
  type?: string | null;
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
};

type UserRoleRow = {
  role?: string | null;
};

type RecipientContact = {
  userId: string;
  role: string;
  name: string;
  email: string;
  phone: string;
};

type DeliveryResult = {
  messageSaved: boolean;
  recipientFound: boolean;
  notificationCreated: boolean;
  emailSent: boolean;
  smsSent: boolean;
  warnings: string[];
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRole(role?: string | null) {
  const value = safeString(role).toLowerCase();

  if (!value) return "user";
  if (value === "provider" || value === "sitter") return "guru";
  if (value === "pet_parent" || value === "pet parent" || value === "pet-parent") {
    return "customer";
  }
  if (value === "owner" || value === "pet_owner" || value === "pet-owner") {
    return "customer";
  }
  if (
    value === "admin" ||
    value === "super_admin" ||
    value === "super-admin" ||
    value === "site_admin" ||
    value === "site-admin" ||
    value.includes("admin") ||
    value === "founder" ||
    value === "owner"
  ) {
    return "admin";
  }
  if (value.includes("ambassador")) return "ambassador";

  return value;
}

function isAdminRole(role?: string | null) {
  return normalizeRole(role) === "admin";
}

function getBaseUrl() {
  const raw =
    safeString(process.env.NEXT_PUBLIC_APP_URL) ||
    safeString(process.env.NEXT_PUBLIC_SITE_URL) ||
    "https://www.sitguru.com";

  return raw.replace(/\/+$/, "");
}

function buildThreadHref(conversationId: string) {
  return `/messages/${conversationId}`;
}

function buildPublicThreadUrl(conversationId: string) {
  return `${getBaseUrl()}${buildThreadHref(conversationId)}`;
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function getMessageText(body: Record<string, unknown> | null) {
  return (
    safeString(body?.message) ||
    safeString(body?.body) ||
    safeString(body?.content) ||
    safeString(body?.text)
  );
}

function getMessagePreview(message: string) {
  const cleanMessage = message.replace(/\s+/g, " ").trim();
  return cleanMessage.length <= 180 ? cleanMessage : `${cleanMessage.slice(0, 177)}...`;
}

function getProfileName(profile?: ProfileRow | null) {
  if (!profile) return "SitGuru User";

  const candidate =
    profile.full_name ||
    profile.display_name ||
    (profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : null) ||
    profile.first_name ||
    profile.last_name ||
    profile.email?.split("@")[0] ||
    "SitGuru User";

  return String(candidate).trim() || "SitGuru User";
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

  return safeString(guru.display_name) || safeString(guru.full_name) || safeString(guru.email).split("@")[0];
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

async function safeRows<T>(
  query: PromiseLike<{ data: unknown; error: unknown }>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Message send query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Message send query failed for ${label}:`, error);
    return [];
  }
}

async function getProfile(userId: string) {
  if (!userId) return null;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) {
    console.warn("Message send profile lookup failed:", error.message);
    return null;
  }

  return data || null;
}

async function getGuru(userId: string) {
  if (!userId) return null;

  const { data, error } = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<GuruRow>();

  if (error) {
    console.warn("Message send guru lookup failed:", error.message);
    return null;
  }

  return data || null;
}

async function getUserRoles(userId: string) {
  return safeRows<UserRoleRow>(
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
    "user_roles",
  );
}

async function resolveRole(params: {
  userId: string;
  participantRole?: string | null;
  conversation?: ConversationRow | null;
}) {
  const participantRole = normalizeRole(params.participantRole);
  if (participantRole && participantRole !== "user") return participantRole;

  const profile = await getProfile(params.userId);
  const profileRole = normalizeRole(
    profile?.role || profile?.user_role || profile?.account_type || profile?.type,
  );

  if (profileRole && profileRole !== "user") return profileRole;

  const roles = await getUserRoles(params.userId);
  const roleFromRows = roles.map((row) => normalizeRole(row.role)).find((role) => role && role !== "user");
  if (roleFromRows) return roleFromRows;

  if (params.conversation?.guru_id === params.userId) return "guru";
  if (params.conversation?.customer_id === params.userId) return "customer";
  if (params.conversation?.started_by_user_id === params.userId) return "admin";

  const guru = await getGuru(params.userId);
  if (guru?.user_id) return "guru";

  return "customer";
}

async function buildContact(userId: string, role: string): Promise<RecipientContact> {
  const [profile, guru] = await Promise.all([getProfile(userId), getGuru(userId)]);

  return {
    userId,
    role,
    name: role === "guru" ? getGuruName(guru) || getProfileName(profile) : getProfileName(profile),
    email: safeString(profile?.email) || safeString(guru?.email),
    phone: getProfilePhone(profile) || getGuruPhone(guru),
  };
}

async function createNotification(params: {
  recipient: RecipientContact;
  conversationId: string;
  preview: string;
}) {
  try {
    if (!params.recipient.userId) return false;

    const now = new Date().toISOString();
    const href = buildThreadHref(params.conversationId);

    const { error } = await supabaseAdmin.from("notifications").insert({
      user_id: params.recipient.userId,
      title: "New SitGuru Message",
      body: params.preview || "You have a new SitGuru message.",
      type: "message",
      href,
      link: href,
      is_read: false,
      created_at: now,
      updated_at: now,
    });

    if (error) {
      console.error("Message notification insert failed:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Message notification insert error:", error);
    return false;
  }
}

async function sendRecipientEmail(params: {
  recipient: RecipientContact;
  senderName: string;
  conversationId: string;
}) {
  try {
    const apiKey = safeString(process.env.RESEND_API_KEY);
    const toEmail = safeString(params.recipient.email);

    if (!apiKey || !toEmail) return false;

    const resend = new Resend(apiKey);
    const threadUrl = buildPublicThreadUrl(params.conversationId);
    const recipientName = escapeHtml(params.recipient.name || "there");
    const senderName = escapeHtml(params.senderName || "SitGuru");

    const result = await resend.emails.send({
      from: getSupportFromEmail(),
      to: [toEmail],
      replyTo: getSupportReplyToEmail(),
      subject: "New SitGuru Message",
      html: `
        <div style="font-family: Arial, sans-serif; background: #f6fbf7; padding: 24px;">
          <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #dcefe2; border-radius: 18px; overflow: hidden;">
            <div style="background: #0f5132; color: #ffffff; padding: 24px;">
              <h1 style="margin: 0; font-size: 24px;">New SitGuru Message</h1>
              <p style="margin: 8px 0 0; color: #d9f7e5;">Trusted Pet Care. Simplified.</p>
            </div>
            <div style="padding: 24px; color: #123524;">
              <p style="font-size: 16px; line-height: 1.6;">Hi ${recipientName},</p>
              <p style="font-size: 16px; line-height: 1.6;">
                You have a new message from ${senderName} in SitGuru.
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
        `Hi ${params.recipient.name || "there"},`,
        "",
        `You have a new message from ${params.senderName || "SitGuru"} in SitGuru.`,
        "",
        `Open your message here: ${threadUrl}`,
        "",
        "Thank you,",
        "SitGuru",
        "Trusted Pet Care. Simplified.",
      ].join("\n"),
    });

    if (result.error) {
      console.error("Message email delivery failed:", result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Message email delivery error:", error);
    return false;
  }
}

async function sendRecipientSms(params: {
  recipient: RecipientContact;
  senderName: string;
  conversationId: string;
}) {
  try {
    const accountSid = safeString(process.env.TWILIO_ACCOUNT_SID);
    const authToken = safeString(process.env.TWILIO_AUTH_TOKEN);
    const messagingServiceSid = safeString(process.env.TWILIO_MESSAGING_SERVICE_SID);
    const fromPhone = safeString(process.env.TWILIO_PHONE_NUMBER);
    const toPhone = normalizeUsPhone(params.recipient.phone);

    if (!accountSid || !authToken || !toPhone || (!messagingServiceSid && !fromPhone)) {
      return false;
    }

    const threadUrl = buildPublicThreadUrl(params.conversationId);
    const body = new URLSearchParams({
      To: toPhone,
      Body: `SitGuru: You have a new message from ${params.senderName || "SitGuru"}. Log in to view and reply: ${threadUrl}`,
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
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("Message SMS delivery failed:", response.status, text);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Message SMS delivery error:", error);
    return false;
  }
}

async function auditMessageSend(params: {
  actorId: string;
  actorEmail: string | null;
  conversationId: string;
  recipient: RecipientContact;
  delivery: DeliveryResult;
}) {
  try {
    await supabaseAdmin.from("admin_audit_logs").insert({
      actor_id: params.actorId,
      actor_email: params.actorEmail,
      action: "message_sent",
      area: "messages",
      target_type: "conversation",
      target_id: params.conversationId,
      metadata: {
        recipient_user_id: params.recipient.userId,
        recipient_role: params.recipient.role,
        recipient_email_available: Boolean(params.recipient.email),
        recipient_phone_available: Boolean(params.recipient.phone),
        notification_created: params.delivery.notificationCreated,
        email_sent: params.delivery.emailSent,
        sms_sent: params.delivery.smsSent,
        warnings: params.delivery.warnings,
      },
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn("Message audit log skipped:", error);
  }
}

function chooseRecipient(params: {
  currentUserId: string;
  currentUserRole: string;
  conversation: ConversationRow;
  participants: ConversationParticipantRow[];
}) {
  const roleByUserId = new Map<string, string>();

  params.participants.forEach((participant) => {
    const userId = safeString(participant.user_id);
    if (!userId) return;
    roleByUserId.set(userId, normalizeRole(participant.role));
  });

  const candidates = Array.from(
    new Set(
      [
        params.conversation.customer_id || "",
        params.conversation.guru_id || "",
        params.conversation.started_by_user_id || "",
        ...params.participants.map((participant) => participant.user_id || ""),
      ].filter(Boolean),
    ),
  ).filter((userId) => userId !== params.currentUserId);

  if (isAdminRole(params.currentUserRole)) {
    return (
      candidates.find((userId) => !isAdminRole(roleByUserId.get(userId))) ||
      candidates[0] ||
      ""
    );
  }

  return (
    candidates.find((userId) => isAdminRole(roleByUserId.get(userId))) ||
    candidates[0] ||
    ""
  );
}

export async function POST(req: NextRequest) {
  const delivery: DeliveryResult = {
    messageSaved: false,
    recipientFound: false,
    notificationCreated: false,
    emailSent: false,
    smsSent: false,
    warnings: [],
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Please log in to send a message.", delivery },
        { status: 401 },
      );
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const conversationId = safeString(body?.conversationId);
    const messageText = getMessageText(body);
    const topic = safeString(body?.topic) || "direct_message";

    if (!conversationId) {
      return NextResponse.json(
        { ok: false, error: "Conversation ID is required.", delivery },
        { status: 400 },
      );
    }

    if (!messageText || messageText.length < 1) {
      return NextResponse.json(
        { ok: false, error: "Please enter a message before sending.", delivery },
        { status: 400 },
      );
    }

    if (messageText.length > 5000) {
      return NextResponse.json(
        { ok: false, error: "Please keep messages under 5,000 characters.", delivery },
        { status: 400 },
      );
    }

    const [{ data: conversation, error: conversationError }, participants] = await Promise.all([
      supabaseAdmin
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle<ConversationRow>(),
      safeRows<ConversationParticipantRow>(
        supabaseAdmin
          .from("conversation_participants")
          .select("*")
          .eq("conversation_id", conversationId),
        "conversation_participants",
      ),
    ]);

    if (conversationError || !conversation) {
      return NextResponse.json(
        { ok: false, error: "Message thread was not found.", delivery },
        { status: 404 },
      );
    }

    const participantRole = participants.find((participant) => participant.user_id === user.id)?.role;
    const currentUserRole = await resolveRole({
      userId: user.id,
      participantRole,
      conversation,
    });

    const allowedUserIds = new Set(
      [
        conversation.customer_id || "",
        conversation.guru_id || "",
        conversation.started_by_user_id || "",
        ...participants.map((participant) => participant.user_id || ""),
      ].filter(Boolean),
    );

    if (!allowedUserIds.has(user.id) && !isAdminRole(currentUserRole)) {
      return NextResponse.json(
        { ok: false, error: "You do not have access to this message thread.", delivery },
        { status: 403 },
      );
    }

    const recipientUserId = chooseRecipient({
      currentUserId: user.id,
      currentUserRole,
      conversation,
      participants,
    });

    if (!recipientUserId) {
      return NextResponse.json(
        { ok: false, error: "SitGuru could not find the other participant for this thread.", delivery },
        { status: 400 },
      );
    }

    const recipientRole = await resolveRole({
      userId: recipientUserId,
      participantRole: participants.find((participant) => participant.user_id === recipientUserId)?.role,
      conversation,
    });
    const recipient = await buildContact(recipientUserId, recipientRole);
    const senderProfile = await getProfile(user.id);
    const senderGuru = await getGuru(user.id);
    const senderName =
      currentUserRole === "guru"
        ? getGuruName(senderGuru) || getProfileName(senderProfile)
        : isAdminRole(currentUserRole)
          ? "SitGuru Admin"
          : getProfileName(senderProfile);
    const preview = getMessagePreview(messageText);
    const now = new Date().toISOString();

    delivery.recipientFound = true;

    const { data: messageRow, error: messageError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        recipient_id: recipient.userId,
        sender_role: currentUserRole,
        recipient_role: recipient.role,
        sender_name_snapshot: senderName,
        sender_email_snapshot: safeString(user.email) || safeString(senderProfile?.email) || null,
        sender_phone_snapshot: null,
        sender_role_snapshot: currentUserRole,
        recipient_name_snapshot: recipient.name,
        recipient_email_snapshot: recipient.email || null,
        recipient_phone_snapshot: recipient.phone || null,
        recipient_role_snapshot: recipient.role,
        content: messageText,
        body: messageText,
        topic,
        message_type: isAdminRole(currentUserRole) ? `direct_${recipient.role}` : `direct_${currentUserRole}`,
        status: "unread",
        is_read: false,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (messageError || !messageRow?.id) {
      return NextResponse.json(
        {
          ok: false,
          error: messageError?.message || "Unable to save message.",
          delivery,
        },
        { status: 500 },
      );
    }

    delivery.messageSaved = true;

    await supabaseAdmin
      .from("conversations")
      .update({
        topic,
        status: "open",
        last_message_at: now,
        last_message_preview: preview,
        updated_at: now,
      })
      .eq("id", conversation.id);

    await supabaseAdmin.from("conversation_participants").upsert(
      [
        {
          conversation_id: conversation.id,
          user_id: user.id,
          role: currentUserRole,
          created_at: now,
          updated_at: now,
        },
        {
          conversation_id: conversation.id,
          user_id: recipient.userId,
          role: recipient.role,
          created_at: now,
          updated_at: now,
        },
      ],
      {
        onConflict: "conversation_id,user_id",
        ignoreDuplicates: false,
      },
    );

    delivery.notificationCreated = await createNotification({
      recipient,
      conversationId: conversation.id,
      preview,
    });

    if (!delivery.notificationCreated) {
      delivery.warnings.push("In-app notification was not created.");
    }

    delivery.emailSent = await sendRecipientEmail({
      recipient,
      senderName,
      conversationId: conversation.id,
    });

    if (!delivery.emailSent) {
      delivery.warnings.push(
        recipient.email
          ? "Email notification was not sent."
          : "No recipient email was available.",
      );
    }

    delivery.smsSent = await sendRecipientSms({
      recipient,
      senderName,
      conversationId: conversation.id,
    });

    if (!delivery.smsSent) {
      delivery.warnings.push(
        recipient.phone
          ? "SMS notification was not sent."
          : "No recipient phone number was available.",
      );
    }

    await auditMessageSend({
      actorId: user.id,
      actorEmail: user.email || safeString(senderProfile?.email) || null,
      conversationId: conversation.id,
      recipient,
      delivery,
    });

    return NextResponse.json({
      ok: true,
      messageId: messageRow.id,
      conversationId: conversation.id,
      recipient: {
        userId: recipient.userId,
        role: recipient.role,
        name: recipient.name,
        emailAvailable: Boolean(recipient.email),
        phoneAvailable: Boolean(recipient.phone),
      },
      delivery,
    });
  } catch (error) {
    console.error("Message send route failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to send message.",
        delivery,
      },
      { status: 500 },
    );
  }
}
