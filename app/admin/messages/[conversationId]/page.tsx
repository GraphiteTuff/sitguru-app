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
  userId: string;
  role: string;
  name: string;
  email: string;
  phone: string;
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

  return value;
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

async function getConversationRecipient({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [{ data: conversation }, { data: participants }] = await Promise.all([
    supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle<ConversationRow>(),
    supabaseAdmin
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", conversationId),
  ]);

  const participantRows = (participants || []) as ParticipantRow[];

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

  if (!recipientUserId) {
    return null;
  }

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
    preferredRecipient?.role || profileRow?.role || (guruRow?.user_id ? "guru" : "user"),
  );

  const recipientName =
    getGuruName(guruRow) ||
    getProfileName(profileRow) ||
    "SitGuru User";

  const recipientEmail =
    safeString(profileRow?.email) ||
    safeString(guruRow?.email);

  const recipientPhone =
    getProfilePhone(profileRow) ||
    getGuruPhone(guruRow);

  return {
    userId: recipientUserId,
    role: recipientRole,
    name: recipientName,
    email: recipientEmail,
    phone: recipientPhone,
  } satisfies RecipientContact;
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

  const recipient = await getConversationRecipient({
    conversationId,
    currentUserId: user.id,
  });

  if (!recipient) {
    redirect(`/admin/messages/${conversationId}?error=recipient`);
  }

  const now = new Date().toISOString();
  const preview = messageBody.slice(0, 240);

  const { error: messageError } = await supabaseAdmin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    recipient_id: recipient.userId,
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
    message_type: "admin_reply",
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

  await supabaseAdmin.from("conversation_participants").upsert(
    [
      {
        conversation_id: conversationId,
        user_id: user.id,
        role: "admin",
        updated_at: now,
      },
      {
        conversation_id: conversationId,
        user_id: recipient.userId,
        role: recipient.role || "user",
        updated_at: now,
      },
    ],
    {
      onConflict: "conversation_id,user_id",
      ignoreDuplicates: false,
    },
  );

  const notificationSent = await createRecipientNotification({
    userId: recipient.userId,
    conversationId,
    preview,
  });

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
}: {
  name: string;
  src?: string | null;
  role?: string | null;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="h-11 w-11 rounded-full border border-green-100 object-cover shadow-sm"
      />
    );
  }

  const normalizedRole = normalizeRole(role);

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-green-100 bg-green-50 text-xs font-black text-green-800 shadow-sm">
      {normalizedRole === "admin" ? (
        <ShieldCheck className="h-5 w-5" />
      ) : normalizedRole === "guru" ? (
        <UsersRound className="h-5 w-5" />
      ) : (
        getInitials(name) || <UserRound className="h-5 w-5" />
      )}
    </div>
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
      <section className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-sm">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
          <div>
            <h2 className="text-lg font-black">Message sent</h2>
            <p className="mt-1 text-sm font-semibold leading-6">
              SitGuru saved the message and attempted delivery alerts.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-green-900 ring-1 ring-green-100">
                <Bell className="h-3.5 w-3.5" />
                In-app notification {parts.includes("app") ? "sent" : "not sent"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-green-900 ring-1 ring-green-100">
                <Mail className="h-3.5 w-3.5" />
                Email {parts.includes("email") ? "sent" : "not sent"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-green-900 ring-1 ring-green-100">
                <Smartphone className="h-3.5 w-3.5" />
                Text {parts.includes("sms") ? "sent" : "not sent"}
              </span>
            </div>
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
    <section className="rounded-[26px] border border-rose-200 bg-rose-50 p-5 text-rose-950 shadow-sm">
      <h2 className="text-lg font-black">Message was not sent</h2>
      <p className="mt-1 text-sm font-semibold leading-6">{message}</p>
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

export default async function AdminMessageThreadPage({
  params,
  searchParams,
}: PageProps) {
  const { conversationId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

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

  const [
    { data: conversation },
    { data: participants },
    { data: messages },
  ] = await Promise.all([
    supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle<ConversationRow>(),
    supabaseAdmin
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
  ]);

  if (!conversation) {
    redirect("/admin/messages");
  }

  const participantRows = (participants || []) as ParticipantRow[];
  const messageRows = (messages || []) as MessageRow[];

  const profileIds = Array.from(
    new Set(
      [
        conversation.customer_id,
        conversation.guru_id,
        conversation.started_by_user_id,
        ...participantRows.map((participant) => participant.user_id),
        ...messageRows.flatMap((message) => [
          message.sender_id || "",
          message.recipient_id || "",
        ]),
      ].filter(Boolean) as string[],
    ),
  );

  const [{ data: profiles }, { data: gurus }] = await Promise.all([
    profileIds.length
      ? supabaseAdmin.from("profiles").select("*").in("id", profileIds)
      : Promise.resolve({ data: [] }),
    profileIds.length
      ? supabaseAdmin.from("gurus").select("*").in("user_id", profileIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map<string, ProfileRow>();
  const guruMap = new Map<string, GuruRow>();

  ((profiles || []) as ProfileRow[]).forEach((profile) => {
    profileMap.set(profile.id, profile);
  });

  ((gurus || []) as GuruRow[]).forEach((guru) => {
    if (guru.user_id) guruMap.set(guru.user_id, guru);
  });

  const participantCards = participantRows.map((participant) => {
    const profile = profileMap.get(participant.user_id) || null;
    const guru = guruMap.get(participant.user_id) || null;
    const role = normalizeRole(participant.role || profile?.role);

    const name =
      role === "guru"
        ? getGuruName(guru) || getProfileName(profile)
        : role === "admin"
          ? "SitGuru Admin"
          : getProfileName(profile);

    const avatar =
      role === "guru"
        ? getGuruAvatar(guru) || getProfileAvatar(profile)
        : role === "admin"
          ? defaultAdminAvatar
          : getProfileAvatar(profile);

    return {
      ...participant,
      role,
      name,
      avatar,
      email: profile?.email || guru?.email || "",
      phone: getProfilePhone(profile) || getGuruPhone(guru),
    };
  });

  const unreadCount = messageRows.filter(isUnreadMessage).length;
  const threadType =
    participantCards.some((participant) => participant.role === "guru") &&
    participantCards.some((participant) => participant.role === "admin")
      ? "Guru → Admin"
      : participantCards.some((participant) => participant.role === "customer") &&
          participantCards.some((participant) => participant.role === "admin")
        ? "Pet Parent → Admin"
        : "SitGuru Thread";

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <Link
            href="/admin/messages"
            className="inline-flex items-center gap-2 text-sm font-black text-green-800 transition hover:text-green-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Message Center
          </Link>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-800 text-white">
                <MessageCircle className="h-7 w-7" />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                  Admin / Message Thread
                </p>
                <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                  {conversation.subject || "SitGuru Message Thread"}
                </h1>
                <p className="mt-1 text-sm font-black text-slate-600">
                  Clean SitGuru message history · {threadType} · Last activity{" "}
                  {formatDateTime(conversation.last_message_at || conversation.updated_at)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-green-50 px-4 py-2 text-xs font-black text-green-800 ring-1 ring-green-100">
                {conversation.status || "open"}
              </span>
              <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-800 ring-1 ring-blue-100">
                {conversation.topic || "Other"}
              </span>
            </div>
          </div>
        </section>

        <DeliveryBanner
          sent={resolvedSearchParams.sent}
          delivery={resolvedSearchParams.delivery}
          error={resolvedSearchParams.error}
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Messages"
            value={String(messageRows.length)}
            icon={<MessageCircle className="h-4 w-4" />}
          />
          <StatCard
            label="Unread"
            value={String(unreadCount)}
            icon={<Bell className="h-4 w-4" />}
          />
          <StatCard
            label="Participants"
            value={String(participantCards.length)}
            icon={<UsersRound className="h-4 w-4" />}
          />
          <StatCard
            label="Thread Type"
            value={threadType}
            icon={<ShieldCheck className="h-4 w-4" />}
          />
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black text-green-950">
            Thread Participants
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            People connected to this conversation. Avatars and role labels are
            kept clear for Admin, Gurus, Pet Parents, and Ambassadors.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {participantCards.map((participant) => (
              <div
                key={participant.user_id}
                className="flex items-center gap-3 rounded-2xl border border-[#e3ece5] bg-[#fbfcf9] px-4 py-3 shadow-sm"
              >
                <Avatar
                  name={participant.name}
                  src={participant.avatar}
                  role={participant.role}
                />
                <div>
                  <p className="text-sm font-black text-green-950">
                    {participant.name}
                  </p>
                  <p className="text-xs font-bold capitalize text-slate-500">
                    {participant.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-green-950">
                Message History
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Mobile-friendly bubble view with avatars, party labels,
                timestamps, and preserved message history.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-green-50 px-4 py-2 text-xs font-black text-green-800 ring-1 ring-green-100">
                Topic: {conversation.topic || "Other"}
              </span>
              <span className="rounded-full bg-slate-50 px-4 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-100">
                Conversation ID: {conversation.id}
              </span>
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-[#edf3ee] bg-[#fbfcf9] p-4">
            {messageRows.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-10 text-center">
                <MessageCircle className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                <h3 className="text-xl font-black text-slate-950">
                  No messages yet
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  This thread exists, but no messages have been sent yet.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {messageRows.map((message) => {
                  const senderRole = normalizeRole(
                    message.sender_role || message.sender_role_snapshot,
                  );
                  const senderProfile = message.sender_id
                    ? profileMap.get(message.sender_id)
                    : null;
                  const senderGuru = message.sender_id
                    ? guruMap.get(message.sender_id)
                    : null;

                  const senderName =
                    safeString(message.sender_name_snapshot) ||
                    (senderRole === "guru"
                      ? getGuruName(senderGuru)
                      : senderRole === "admin"
                        ? "SitGuru Admin"
                        : getProfileName(senderProfile));

                  const senderAvatar =
                    senderRole === "guru"
                      ? getGuruAvatar(senderGuru) || getProfileAvatar(senderProfile)
                      : senderRole === "admin"
                        ? defaultAdminAvatar
                        : getProfileAvatar(senderProfile);

                  const isAdmin = senderRole === "admin";
                  const body = getMessageBody(message);

                  return (
                    <div
                      key={message.id}
                      className={`flex items-end gap-3 ${
                        isAdmin ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isAdmin ? (
                        <Avatar
                          name={senderName}
                          src={senderAvatar}
                          role={senderRole}
                        />
                      ) : null}

                      <div
                        className={`max-w-3xl rounded-[28px] px-5 py-4 shadow-sm ${
                          isAdmin
                            ? "bg-green-800 text-white"
                            : "border border-[#e3ece5] bg-white text-slate-900"
                        }`}
                      >
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black">
                            {senderName}
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                              isAdmin
                                ? "bg-white/15 text-white"
                                : "bg-green-50 text-green-800"
                            }`}
                          >
                            {senderRole}
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              isAdmin ? "text-white/80" : "text-slate-500"
                            }`}
                          >
                            {formatDateTime(message.created_at)}
                          </span>
                        </div>

                        <div className="whitespace-pre-wrap text-sm font-semibold leading-7">
                          {body}
                        </div>
                      </div>

                      {isAdmin ? (
                        <Avatar
                          name={senderName}
                          src={senderAvatar}
                          role={senderRole}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[30px] border border-green-200 bg-green-50 p-5 shadow-sm">
          <h2 className="text-2xl font-black text-green-950">
            Send Admin Message
          </h2>
          <p className="mt-1 text-sm font-semibold text-green-900">
            Reply as SitGuru Admin. This saves the message, creates an in-app
            notification, sends an email, and sends a text alert when a phone
            number is available.
          </p>

          <form
            action={sendAdminMessage.bind(null, conversation.id)}
            className="mt-5 rounded-[26px] border border-green-200 bg-white p-4"
          >
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                  Topic / Subject
                </span>
                <select
                  name="topic"
                  defaultValue={conversation.topic || "other"}
                  className="min-h-12 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
                >
                  <option value="direct_message">Direct Message</option>
                  <option value="guru_support">Guru Support</option>
                  <option value="customer_support">Pet Parent Support</option>
                  <option value="ambassador_support">Ambassador Support</option>
                  <option value="payment">Payment / Payout</option>
                  <option value="technical">Technical Support</option>
                  <option value="safety">Trust & Safety</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                  Admin Message
                </span>
                <textarea
                  name="message"
                  rows={7}
                  placeholder="Write your Admin reply..."
                  className="rounded-2xl border border-green-200 bg-white px-4 py-3 text-base font-semibold leading-7 text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
                />
              </label>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
                >
                  <Send className="h-4 w-4" />
                  Send Message
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold leading-6 text-slate-500 shadow-sm">
          <span className="font-black text-green-900">
            Supabase coordination:
          </span>{" "}
          this thread page reads `conversations`, `conversation_participants`,
          `profiles`, `gurus`, and `messages`. Admin replies write to
          `messages`, update `conversations`, create `notifications`, and attempt
          personal email/SMS delivery using Resend and Twilio environment
          variables.
        </section>
      </div>
    </main>
  );
}