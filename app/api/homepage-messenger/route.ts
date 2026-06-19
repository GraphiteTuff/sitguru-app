import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type HomepageMessengerPayload = {
  conversationId?: unknown;
  token?: unknown;
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  topic?: unknown;
  programInterest?: unknown;
  message?: unknown;
  source?: unknown;
  pagePath?: unknown;
  referrer?: unknown;
  trafficSource?: unknown;
};

type HomepageMessengerSessionRow = {
  id: string;
  conversation_id: string;
  visitor_token: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  topic?: string | null;
};

type MessageRow = {
  id: string;
  content?: string | null;
  body?: string | null;
  sender_role?: string | null;
  sender_role_snapshot?: string | null;
  sender_name_snapshot?: string | null;
  created_at?: string | null;
};

type AdminProfileRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  role?: string | null;
  account_type?: string | null;
  created_at?: string | null;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function truncate(value: string, maxLength: number) {
  const clean = asString(value);
  return clean.length <= maxLength ? clean : `${clean.slice(0, maxLength - 1)}…`;
}

function splitList(value?: string | null) {
  return String(value || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeUsPhone(phone: string) {
  const clean = asString(phone);
  if (!clean) return "";
  if (clean.startsWith("+")) return clean;
  const digits = clean.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return "";
}

function normalizeTopic(value: string) {
  const clean = asString(value).toLowerCase();
  if (clean === "pet-parent" || clean === "pet_parent") return "pet-parent";
  if (clean === "guru") return "guru";
  if (clean === "ambassador" || clean === "ambassadors") return "ambassador";
  if (clean === "partner" || clean === "partners") return "partner";
  if (clean === "support") return "support";
  return "general";
}

function getTopicLabel(topic: string) {
  if (topic === "pet-parent") return "Pet Parent";
  if (topic === "guru") return "Guru";
  if (topic === "ambassador") return "Ambassador";
  if (topic === "partner") return "Partner";
  if (topic === "support") return "Support";
  return "General";
}

function getMessageContent(message: MessageRow) {
  return asString(message.content) || asString(message.body);
}

function getBaseUrl() {
  const configured =
    asString(process.env.NEXT_PUBLIC_SITE_URL) ||
    asString(process.env.NEXT_PUBLIC_APP_URL) ||
    "https://www.sitguru.com";

  if (configured.startsWith("http://") || configured.startsWith("https://")) {
    return configured.replace(/\/+$/, "");
  }

  return `https://${configured.replace(/\/+$/, "")}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getAdminAlertEmails() {
  const configured =
    asString(process.env.SITGURU_ADMIN_ALERT_EMAILS) ||
    asString(process.env.ADMIN_ALERT_EMAILS) ||
    asString(process.env.SIGNUP_ALERT_EMAILS) ||
    asString(process.env.SIGNUP_ALERT_EMAIL_TO) ||
    asString(process.env.ADMIN_EMAIL) ||
    asString(process.env.SITGURU_SUPPORT_EMAIL) ||
    "support@sitguru.com";

  return Array.from(new Set(splitList(configured)));
}

function getAdminAlertPhones() {
  const configured =
    asString(process.env.SITGURU_ADMIN_ALERT_PHONES) ||
    asString(process.env.ADMIN_ALERT_PHONES) ||
    asString(process.env.SIGNUP_ALERT_SMS_TO) ||
    asString(process.env.SIGNUP_ALERT_PHONE_TO) ||
    asString(process.env.ADMIN_PHONE) ||
    "";

  return Array.from(new Set(splitList(configured).map(normalizeUsPhone).filter(Boolean)));
}

function getFromEmail() {
  return (
    asString(process.env.SITGURU_SUPPORT_FROM) ||
    asString(process.env.SITGURU_ALERT_FROM_EMAIL) ||
    asString(process.env.RESEND_FROM_EMAIL) ||
    "SitGuru <support@sitguru.com>"
  );
}

function getReplyToEmail() {
  return (
    asString(process.env.RESEND_REPLY_TO_EMAIL) ||
    asString(process.env.SITGURU_SUPPORT_EMAIL) ||
    "support@sitguru.com"
  );
}

function makeVisitorToken() {
  return `${crypto.randomUUID()}-${crypto.randomUUID()}`;
}

function mapMessages(messages: MessageRow[]) {
  return messages.map((message) => {
    const role = asString(message.sender_role || message.sender_role_snapshot).toLowerCase();
    const senderRole = role.includes("admin") ? "admin" : role ? "visitor" : "user";

    return {
      id: String(message.id),
      content: getMessageContent(message),
      senderRole,
      senderName:
        senderRole === "admin"
          ? "SitGuru Admin"
          : asString(message.sender_name_snapshot) || "You",
      createdAt: message.created_at || new Date().toISOString(),
    };
  });
}

async function getPrimaryAdminProfile() {
  const { data: roleAdminRows } = await supabaseAdmin
    .from("profiles")
    .select("id,email,full_name,first_name,role,account_type,created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: true })
    .limit(1);

  if (roleAdminRows?.[0]?.id) return roleAdminRows[0] as AdminProfileRow;

  const adminEmails = getAdminAlertEmails();
  if (adminEmails.length === 0) return null;

  const { data: emailAdminRows } = await supabaseAdmin
    .from("profiles")
    .select("id,email,full_name,first_name,role,account_type,created_at")
    .in("email", adminEmails)
    .limit(1);

  return (emailAdminRows?.[0] as AdminProfileRow | undefined) || null;
}

async function getSession(conversationId: string, token: string) {
  if (!conversationId || !token) return null;

  const { data, error } = await supabaseAdmin
    .from("homepage_messenger_sessions")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("visitor_token", token)
    .maybeSingle();

  if (error || !data?.id) return null;

  const session = data as HomepageMessengerSessionRow;

  const { data: conversation } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("id", session.conversation_id)
    .maybeSingle();

  if (!conversation?.id) {
    await supabaseAdmin
      .from("homepage_messenger_sessions")
      .delete()
      .eq("conversation_id", session.conversation_id)
      .eq("visitor_token", session.visitor_token);

    return null;
  }

  return session;
}

async function loadConversationMessages(conversationId: string) {
  const { data } = await supabaseAdmin
    .from("messages")
    .select("id,content,body,sender_role,sender_role_snapshot,sender_name_snapshot,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100);

  return mapMessages((data || []) as MessageRow[]);
}

async function sendAdminEmail(params: {
  conversationId: string;
  fullName: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  source: string;
}) {
  try {
    const apiKey = asString(process.env.RESEND_API_KEY);
    const to = getAdminAlertEmails();

    if (!apiKey || to.length === 0) return false;

    const topicLabel = getTopicLabel(params.topic);
    const adminUrl = `${getBaseUrl()}/admin/messages/${params.conversationId}`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromEmail(),
        to,
        reply_to: params.email || getReplyToEmail(),
        subject: `New SitGuru Homepage Messenger: ${topicLabel}`,
        html: `
          <div style="font-family: Arial, sans-serif; background: #f6fbf7; padding: 24px;">
            <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #dcefe2; border-radius: 18px; overflow: hidden;">
              <div style="background: #0f5132; color: #ffffff; padding: 24px;">
                <h1 style="margin: 0; font-size: 24px;">New Homepage Messenger Reply</h1>
                <p style="margin: 8px 0 0; color: #d9f7e5;">SitGuru Messenger</p>
              </div>
              <div style="padding: 24px; color: #123524;">
                <p><strong>Topic:</strong> ${escapeHtml(topicLabel)}</p>
                <p><strong>Name:</strong> ${escapeHtml(params.fullName || "Not provided")}</p>
                <p><strong>Email:</strong> ${escapeHtml(params.email || "Not provided")}</p>
                <p><strong>Phone:</strong> ${escapeHtml(params.phone || "Not provided")}</p>
                <p><strong>Source:</strong> ${escapeHtml(params.source || "homepage")}</p>
                <div style="margin-top: 18px; padding: 16px; border-radius: 14px; background: #ecfdf5; border: 1px solid #bbf7d0;">
                  <p style="margin: 0 0 8px; font-weight: 700;">Message</p>
                  <div style="line-height: 1.6;">${escapeHtml(params.message).replaceAll("\n", "<br />")}</div>
                </div>
                <p style="margin: 22px 0 0;">
                  <a href="${adminUrl}" style="display: inline-block; background: #0f8f4f; color: #ffffff; text-decoration: none; padding: 13px 20px; border-radius: 999px; font-weight: 700;">Open Admin Thread</a>
                </p>
              </div>
            </div>
          </div>
        `,
        text: [
          "New Homepage Messenger Reply",
          `Topic: ${topicLabel}`,
          `Name: ${params.fullName || "Not provided"}`,
          `Email: ${params.email || "Not provided"}`,
          `Phone: ${params.phone || "Not provided"}`,
          "",
          params.message,
          "",
          adminUrl,
        ].join("\n"),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Homepage messenger admin email error:", error);
    return false;
  }
}

async function sendAdminSms(params: {
  conversationId: string;
  fullName: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  source: string;
}) {
  const accountSid = asString(process.env.TWILIO_ACCOUNT_SID);
  const authToken = asString(process.env.TWILIO_AUTH_TOKEN);
  const messagingServiceSid = asString(process.env.TWILIO_MESSAGING_SERVICE_SID);
  const fromPhone = asString(process.env.TWILIO_PHONE_NUMBER);
  const recipients = getAdminAlertPhones();

  if (!accountSid || !authToken || recipients.length === 0 || (!messagingServiceSid && !fromPhone)) {
    return 0;
  }

  const topicLabel = getTopicLabel(params.topic);
  const adminUrl = `${getBaseUrl()}/admin/messages/${params.conversationId}`;
  const contactLine = params.fullName || params.email || params.phone || "No contact provided";
  const smsBody = truncate(
    `New SitGuru homepage messenger ${topicLabel}: ${contactLine} - ${params.message} ${adminUrl}`,
    300,
  );

  let sentCount = 0;

  for (const toPhone of recipients) {
    try {
      const body = new URLSearchParams({ To: toPhone, Body: smsBody });

      if (messagingServiceSid) body.set("MessagingServiceSid", messagingServiceSid);
      else body.set("From", fromPhone);

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

      if (response.ok) sentCount += 1;
    } catch (error) {
      console.error("Homepage messenger admin SMS error:", error);
    }
  }

  return sentCount;
}

async function createHomepageMessengerSession(params: {
  adminUserId: string;
  fullName: string;
  email: string;
  phone: string;
  topic: string;
  source: string;
  pagePath: string;
  referrer: string;
  trafficSource: string;
  message: string;
}) {
  const now = new Date().toISOString();
  const token = makeVisitorToken();
  const topicLabel = getTopicLabel(params.topic);
  const visitorName = params.fullName || params.email || params.phone || "Homepage Visitor";
  const preview = truncate(params.message, 240);

  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from("conversations")
    .insert({
      subject: `Homepage Messenger · ${topicLabel}`,
      status: "open",
      topic: "homepage_messenger",
      started_by_user_id: params.adminUserId,
      last_message_at: now,
      last_message_preview: preview || "Homepage messenger conversation",
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (conversationError || !conversation?.id) {
    throw new Error(conversationError?.message || "Unable to create homepage messenger conversation.");
  }

  const conversationId = String(conversation.id);

  await supabaseAdmin.from("conversation_participants").upsert(
    {
      conversation_id: conversationId,
      user_id: params.adminUserId,
      role: "admin",
      created_at: now,
      updated_at: now,
    },
    {
      onConflict: "conversation_id,user_id",
      ignoreDuplicates: false,
    },
  );

  const { error: sessionError } = await supabaseAdmin
    .from("homepage_messenger_sessions")
    .insert({
      conversation_id: conversationId,
      visitor_token: token,
      full_name: params.fullName || null,
      email: params.email || null,
      phone: params.phone || null,
      topic: params.topic,
      source: params.source,
      page_path: params.pagePath || null,
      referrer: params.referrer || null,
      traffic_source: params.trafficSource || null,
      created_at: now,
      updated_at: now,
      last_seen_at: now,
    });

  if (sessionError) {
    console.error("Homepage messenger session insert failed:", sessionError);
    throw new Error("Unable to create homepage messenger session.");
  }

  return { conversationId, token, visitorName };
}

async function insertVisitorMessage(params: {
  conversationId: string;
  adminUserId: string;
  fullName: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
}) {
  const now = new Date().toISOString();
  const visitorName = params.fullName || params.email || params.phone || "Homepage Visitor";

  const { error } = await supabaseAdmin.from("messages").insert({
    conversation_id: params.conversationId,
    sender_id: null,
    recipient_id: params.adminUserId,
    sender_role: "visitor",
    recipient_role: "admin",
    sender_name_snapshot: visitorName,
    sender_email_snapshot: params.email || null,
    sender_phone_snapshot: params.phone || null,
    sender_role_snapshot: "visitor",
    recipient_name_snapshot: "SitGuru Admin",
    recipient_role_snapshot: "admin",
    content: params.message,
    body: params.message,
    message_type: "homepage_messenger",
    topic: params.topic,
    status: "unread",
    is_read: false,
    created_at: now,
    updated_at: now,
  });

  if (error) throw new Error(error.message);

  await supabaseAdmin
    .from("conversations")
    .update({
      last_message_preview: truncate(params.message, 240),
      last_message_at: now,
      updated_at: now,
      status: "open",
      topic: "homepage_messenger",
    })
    .eq("id", params.conversationId);

  await supabaseAdmin
    .from("homepage_messenger_sessions")
    .update({ updated_at: now, last_seen_at: now })
    .eq("conversation_id", params.conversationId);

  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${params.conversationId}`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const conversationId = asString(url.searchParams.get("conversationId"));
  const token = asString(url.searchParams.get("token"));

  const session = await getSession(conversationId, token);

  if (!session) {
    return NextResponse.json({ error: "Messenger session not found." }, { status: 404 });
  }

  const messages = await loadConversationMessages(conversationId);

  return NextResponse.json({ ok: true, conversationId, token, messages });
}

export async function POST(request: Request) {
  let payload: HomepageMessengerPayload;

  try {
    payload = (await request.json()) as HomepageMessengerPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = truncate(asString(payload.message), 4000);
  const fullName = truncate(asString(payload.fullName), 120);
  const email = truncate(asString(payload.email).toLowerCase(), 180);
  const phone = truncate(asString(payload.phone), 40);
  const topic = normalizeTopic(asString(payload.topic));
  const source = truncate(asString(payload.source) || "homepage-messenger", 120);
  const pagePath = truncate(asString(payload.pagePath), 500);
  const referrer = truncate(asString(payload.referrer), 500);
  const trafficSource = truncate(asString(payload.trafficSource), 120);
  const requestedConversationId = asString(payload.conversationId);
  const requestedToken = asString(payload.token);

  if (!message) {
    return NextResponse.json({ error: "Please type a message so SitGuru can help." }, { status: 400 });
  }

  const adminProfile = await getPrimaryAdminProfile();

  if (!adminProfile?.id) {
    return NextResponse.json({ error: "SitGuru Admin is not available right now." }, { status: 503 });
  }

  let conversationId = requestedConversationId;
  let token = requestedToken;
  let existingSession = await getSession(conversationId, token);

  if (!existingSession) {
    const createdSession = await createHomepageMessengerSession({
      adminUserId: adminProfile.id,
      fullName,
      email,
      phone,
      topic,
      source,
      pagePath,
      referrer,
      trafficSource,
      message,
    });

    conversationId = createdSession.conversationId;
    token = createdSession.token;
  } else {
    await supabaseAdmin
      .from("homepage_messenger_sessions")
      .update({
        full_name: fullName || existingSession.full_name || null,
        email: email || existingSession.email || null,
        phone: phone || existingSession.phone || null,
        topic,
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId)
      .eq("visitor_token", token);
  }

  await insertVisitorMessage({
    conversationId,
    adminUserId: adminProfile.id,
    fullName,
    email,
    phone,
    topic,
    message,
  });

  const [emailSent, smsSent, messages] = await Promise.all([
    sendAdminEmail({ conversationId, fullName, email, phone, topic, message, source }),
    sendAdminSms({ conversationId, fullName, email, phone, topic, message, source }),
    loadConversationMessages(conversationId),
  ]);

  return NextResponse.json({
    ok: true,
    conversationId,
    token,
    messages,
    alerts: {
      emailSent,
      smsSent,
    },
  });
}
