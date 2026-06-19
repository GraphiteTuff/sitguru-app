import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ContactPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  topic?: string;
  programInterest?: string;
  message?: string;
  source?: string;
  pagePath?: string;
  referrer?: string;
  trafficSource?: string;
};

type NormalizedContactPayload = Required<ContactPayload>;

type InsertResult = {
  ok: boolean;
  table: string;
  id: string | number | null;
  error: string | null;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function truncate(value: string, maxLength: number) {
  const clean = cleanText(value);
  return clean.length <= maxLength ? clean : `${clean.slice(0, maxLength - 1)}…`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function splitList(value?: string | null) {
  return String(value || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeUsPhone(phone: string) {
  const clean = cleanText(phone);
  if (!clean) return "";
  if (clean.startsWith("+")) return clean;
  const digits = clean.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return "";
}

function normalizeTopic(value: string) {
  const allowedTopics = new Set([
    "general",
    "pet-parent",
    "guru",
    "programs",
    "ambassadors",
    "ambassador",
    "partners",
    "partner",
    "investors",
    "press",
    "support",
  ]);

  const normalized = value.trim().toLowerCase();
  if (normalized === "ambassador") return "ambassadors";
  if (normalized === "partner") return "partners";
  return allowedTopics.has(normalized) ? normalized : "general";
}

function getTopicLabel(topic: string) {
  if (topic === "pet-parent") return "Pet Parent";
  if (topic === "guru") return "Guru";
  if (topic === "programs") return "Programs";
  if (topic === "ambassadors") return "Ambassador";
  if (topic === "partners") return "Partner";
  if (topic === "investors") return "Investor";
  if (topic === "press") return "Press";
  if (topic === "support") return "Support";
  return "General";
}

function getInquiryType(topic: string) {
  if (topic === "pet-parent") return "customer-support";
  if (topic === "guru") return "guru-support";
  if (topic === "programs") return "programs";
  if (topic === "ambassadors") return "ambassador";
  if (topic === "partners") return "partner";
  if (topic === "investors") return "investor";
  if (topic === "press") return "press";
  if (topic === "support") return "support";
  return "general";
}

function buildSubject(topic: string, programInterest: string) {
  const topicLabel = getTopicLabel(topic);
  return programInterest
    ? `Contact Inquiry: ${topicLabel} / ${programInterest}`
    : `Contact Inquiry: ${topicLabel}`;
}

function getBaseUrl() {
  const configuredUrl =
    cleanText(process.env.NEXT_PUBLIC_SITE_URL) ||
    cleanText(process.env.NEXT_PUBLIC_APP_URL) ||
    cleanText(process.env.NEXT_PUBLIC_VERCEL_URL) ||
    cleanText(process.env.VERCEL_URL) ||
    "https://www.sitguru.com";

  if (configuredUrl.startsWith("http://") || configuredUrl.startsWith("https://")) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return `https://${configuredUrl.replace(/\/+$/, "")}`;
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
    cleanText(process.env.SITGURU_ADMIN_ALERT_EMAILS) ||
    cleanText(process.env.ADMIN_ALERT_EMAILS) ||
    cleanText(process.env.SIGNUP_ALERT_EMAILS) ||
    cleanText(process.env.SIGNUP_ALERT_EMAIL_TO) ||
    cleanText(process.env.ADMIN_EMAIL) ||
    cleanText(process.env.SITGURU_SUPPORT_EMAIL) ||
    "support@sitguru.com";

  return Array.from(new Set(splitList(configured)));
}

function getAdminAlertPhones() {
  const configured =
    cleanText(process.env.SITGURU_ADMIN_ALERT_PHONES) ||
    cleanText(process.env.ADMIN_ALERT_PHONES) ||
    cleanText(process.env.SIGNUP_ALERT_SMS_TO) ||
    cleanText(process.env.SIGNUP_ALERT_PHONE_TO) ||
    cleanText(process.env.ADMIN_PHONE) ||
    "";

  return Array.from(new Set(splitList(configured).map(normalizeUsPhone).filter(Boolean)));
}

function getFromEmail() {
  return (
    cleanText(process.env.SITGURU_SUPPORT_FROM) ||
    cleanText(process.env.SITGURU_ALERT_FROM_EMAIL) ||
    cleanText(process.env.RESEND_FROM_EMAIL) ||
    "SitGuru <support@sitguru.com>"
  );
}

function getReplyToEmail() {
  return (
    cleanText(process.env.RESEND_REPLY_TO_EMAIL) ||
    cleanText(process.env.SITGURU_SUPPORT_EMAIL) ||
    "support@sitguru.com"
  );
}

function createContactRow(payload: NormalizedContactPayload) {
  const topic = normalizeTopic(payload.topic);
  const inquiryType = getInquiryType(topic);
  const subject = buildSubject(topic, payload.programInterest);

  return {
    full_name: payload.fullName || null,
    name: payload.fullName || null,
    email: payload.email || null,
    phone: payload.phone || null,
    topic,
    inquiry_type: inquiryType,
    category: inquiryType,
    program_interest: payload.programInterest || null,
    subject,
    message: payload.message,
    body: payload.message,
    notes: payload.message,
    source: payload.source || "contact-page",
    status: "new",
    created_at: new Date().toISOString(),
  };
}

async function tryInsert(table: string, row: Record<string, unknown>): Promise<InsertResult> {
  try {
    const result = await supabaseAdmin.from(table).insert(row).select("id").maybeSingle();

    if (result.error) {
      console.warn(`Contact insert skipped for ${table}:`, result.error);
      return { ok: false, table, id: null, error: result.error.message };
    }

    return { ok: true, table, id: result.data?.id || null, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown insert error";
    console.warn(`Contact insert failed for ${table}:`, message);
    return { ok: false, table, id: null, error: message };
  }
}

async function sendAdminEmail(payload: NormalizedContactPayload) {
  try {
    const apiKey = cleanText(process.env.RESEND_API_KEY);
    const to = getAdminAlertEmails();
    if (!apiKey || to.length === 0) return false;

    const topic = normalizeTopic(payload.topic);
    const topicLabel = getTopicLabel(topic);
    const baseUrl = getBaseUrl();
    const safeMessage = escapeHtml(payload.message).replaceAll("\n", "<br />");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromEmail(),
        to,
        reply_to: payload.email || getReplyToEmail(),
        subject: `New SitGuru ${topicLabel} Response`,
        html: `
          <div style="font-family: Arial, sans-serif; background: #f6fbf7; padding: 24px;">
            <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #dcefe2; border-radius: 18px; overflow: hidden;">
              <div style="background: #0f5132; color: #ffffff; padding: 24px;">
                <h1 style="margin: 0; font-size: 24px;">New SitGuru Response</h1>
                <p style="margin: 8px 0 0; color: #d9f7e5;">${escapeHtml(payload.source || "contact-page")}</p>
              </div>
              <div style="padding: 24px; color: #123524;">
                <p><strong>Topic:</strong> ${escapeHtml(topicLabel)}</p>
                <p><strong>Name:</strong> ${escapeHtml(payload.fullName || "Not provided")}</p>
                <p><strong>Email:</strong> ${escapeHtml(payload.email || "Not provided")}</p>
                <p><strong>Phone:</strong> ${escapeHtml(payload.phone || "Not provided")}</p>
                <p><strong>Program Interest:</strong> ${escapeHtml(payload.programInterest || "Not provided")}</p>
                <p><strong>Source:</strong> ${escapeHtml(payload.source || "contact-page")}</p>
                <p><strong>Traffic Source:</strong> ${escapeHtml(payload.trafficSource || "unknown")}</p>
                <p><strong>Page:</strong> ${escapeHtml(payload.pagePath || "/")}</p>
                <p><strong>Referrer:</strong> ${escapeHtml(payload.referrer || "Not provided")}</p>
                <div style="margin-top: 18px; padding: 16px; border-radius: 14px; background: #ecfdf5; border: 1px solid #bbf7d0;">
                  <p style="margin: 0 0 8px; font-weight: 700;">Message</p>
                  <div style="line-height: 1.6;">${safeMessage}</div>
                </div>
                <p style="margin: 22px 0 0;">
                  <a href="${baseUrl}/admin/messages" style="display: inline-block; background: #0f8f4f; color: #ffffff; text-decoration: none; padding: 13px 20px; border-radius: 999px; font-weight: 700;">Open Admin Messages</a>
                </p>
              </div>
            </div>
          </div>
        `,
        text: [
          "New SitGuru Response",
          "",
          `Topic: ${topicLabel}`,
          `Name: ${payload.fullName || "Not provided"}`,
          `Email: ${payload.email || "Not provided"}`,
          `Phone: ${payload.phone || "Not provided"}`,
          `Program Interest: ${payload.programInterest || "Not provided"}`,
          `Source: ${payload.source || "contact-page"}`,
          `Traffic Source: ${payload.trafficSource || "unknown"}`,
          `Page: ${payload.pagePath || "/"}`,
          `Referrer: ${payload.referrer || "Not provided"}`,
          "",
          "Message:",
          payload.message,
          "",
          `${baseUrl}/admin/messages`,
        ].join("\n"),
      }),
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      console.error("Contact admin email failed:", response.status, responseText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Contact admin email error:", error);
    return false;
  }
}

async function sendAdminSms(payload: NormalizedContactPayload) {
  const accountSid = cleanText(process.env.TWILIO_ACCOUNT_SID);
  const authToken = cleanText(process.env.TWILIO_AUTH_TOKEN);
  const messagingServiceSid = cleanText(process.env.TWILIO_MESSAGING_SERVICE_SID);
  const fromPhone = cleanText(process.env.TWILIO_PHONE_NUMBER);
  const recipients = getAdminAlertPhones();

  if (!accountSid || !authToken || recipients.length === 0 || (!messagingServiceSid && !fromPhone)) {
    return 0;
  }

  const topicLabel = getTopicLabel(normalizeTopic(payload.topic));
  const contactLine = payload.fullName || payload.email || payload.phone || "No contact provided";
  const messageBody = truncate(
    `New SitGuru ${topicLabel} response (${payload.source || "contact-page"}): ${contactLine} - ${payload.message}`,
    300,
  );

  let sentCount = 0;

  for (const toPhone of recipients) {
    try {
      const body = new URLSearchParams({ To: toPhone, Body: messageBody });

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
      else {
        const responseText = await response.text().catch(() => "");
        console.error("Contact admin SMS failed:", response.status, responseText);
      }
    } catch (error) {
      console.error("Contact admin SMS error:", error);
    }
  }

  return sentCount;
}

export async function POST(request: Request) {
  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fullName = truncate(cleanText(payload.fullName), 120);
  const email = truncate(cleanText(payload.email).toLowerCase(), 180);
  const phone = truncate(cleanText(payload.phone), 40);
  const topic = normalizeTopic(cleanText(payload.topic));
  const programInterest = truncate(cleanText(payload.programInterest), 160);
  const message = truncate(cleanText(payload.message), 4000);
  const source = truncate(cleanText(payload.source) || "contact-page", 120);
  const pagePath = truncate(cleanText(payload.pagePath), 500);
  const referrer = truncate(cleanText(payload.referrer), 500);
  const trafficSource = truncate(cleanText(payload.trafficSource), 120);
  const isHomepagePopup = source === "homepage-assist-popup";

  if (!isHomepagePopup && !fullName) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }

  if (!isHomepagePopup && (!email || !isValidEmail(email))) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const normalizedPayload: NormalizedContactPayload = {
    fullName,
    email,
    phone,
    topic,
    programInterest,
    message,
    source,
    pagePath,
    referrer,
    trafficSource,
  };

  const row = createContactRow(normalizedPayload);
  const [emailSent, smsSent] = await Promise.all([
    sendAdminEmail(normalizedPayload),
    sendAdminSms(normalizedPayload),
  ]);

  const insertResults: InsertResult[] = [];

  const contactInsert = await tryInsert("contact_submissions", row);
  insertResults.push(contactInsert);

  if (!contactInsert.ok) {
    const fallbackInsert = await tryInsert("network_partner_leads", {
      ...row,
      lead_type: row.inquiry_type,
      company_name: null,
      contact_name: fullName || null,
    });
    insertResults.push(fallbackInsert);
  }

  if (!insertResults.some((result) => result.ok)) {
    const messageFallbackInsert = await tryInsert("messages", {
      sender_id: null,
      recipient_id: null,
      conversation_id: null,
      content: message,
      body: message,
      message_type: row.inquiry_type,
      topic: row.subject,
      status: "new",
      is_read: false,
      created_at: new Date().toISOString(),
    });
    insertResults.push(messageFallbackInsert);
  }

  const successfulInsert = insertResults.find((result) => result.ok) || null;

  if (successfulInsert || emailSent || smsSent > 0) {
    return NextResponse.json({
      ok: true,
      table: successfulInsert?.table || null,
      id: successfulInsert?.id || null,
      alerts: {
        emailSent,
        smsSent,
      },
      inserts: insertResults,
    });
  }

  return NextResponse.json(
    {
      error:
        "Unable to save or notify SitGuru about this contact message. Please check Supabase, Resend, and Twilio settings.",
      alerts: {
        emailSent,
        smsSent,
      },
      inserts: insertResults,
    },
    { status: 500 },
  );
}
