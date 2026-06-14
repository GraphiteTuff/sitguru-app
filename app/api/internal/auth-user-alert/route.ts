import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: Record<string, unknown> | null;
  old_record?: Record<string, unknown> | null;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseMetadata(value: unknown) {
  if (!value) return {} as Record<string, unknown>;

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {} as Record<string, unknown>;
    }
  }

  return {} as Record<string, unknown>;
}

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  return asString(metadata[key]);
}

function normalizeRole(role: string) {
  const normalized = role.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (["pet_parent", "customer", "client", "parent"].includes(normalized)) {
    return "pet_parent";
  }

  if (["guru", "sitter", "provider", "walker", "dog_walker"].includes(normalized)) {
    return "guru";
  }

  if (["ambassador", "sitguru_rep", "representative"].includes(normalized)) {
    return "ambassador";
  }

  return normalized;
}

function getRoleDisplay(role: string) {
  switch (role) {
    case "guru":
      return "Guru";
    case "pet_parent":
      return "Pet Parent";
    case "ambassador":
      return "Ambassador";
    default:
      return role ? role.replace(/_/g, " ") : "SitGuru User";
  }
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const localDigits = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (localDigits.length !== 10) return value || "Not provided";

  return `(${localDigits.slice(0, 3)}) ${localDigits.slice(3, 6)}-${localDigits.slice(6)}`;
}

function getAccountName(record: Record<string, unknown>, metadata: Record<string, unknown>) {
  const firstName =
    getMetadataString(metadata, "first_name") || asString(record.first_name);
  const lastName =
    getMetadataString(metadata, "last_name") || asString(record.last_name);

  return (
    getMetadataString(metadata, "full_name") ||
    getMetadataString(metadata, "name") ||
    getMetadataString(metadata, "display_name") ||
    asString(record.full_name) ||
    asString(record.name) ||
    asString(record.display_name) ||
    `${firstName} ${lastName}`.trim() ||
    "SitGuru User"
  );
}

function getBaseUrl(request: NextRequest) {
  const explicitUrl = asString(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL);

  if (explicitUrl) return explicitUrl.replace(/\/$/, "");

  const host = request.headers.get("host") || "www.sitguru.com";
  const protocol = host.includes("localhost") ? "http" : "https";

  return `${protocol}://${host}`;
}

function getAdminEmails() {
  return (process.env.ADMIN_ALERT_EMAILS || "jason@sitguru.com,nette@sitguru.com")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function getAdminSmsNumbers() {
  return (process.env.ADMIN_ALERT_SMS_TO || "+12534552377")
    .split(",")
    .map((phone) => phone.trim())
    .filter(Boolean);
}

async function sendEmailAlert({
  subject,
  html,
  text,
}: {
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipients = getAdminEmails();

  if (!apiKey || recipients.length === 0) {
    return { skipped: true, reason: "Missing RESEND_API_KEY or ADMIN_ALERT_EMAILS" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.ALERT_FROM_EMAIL || "SitGuru Alerts <alerts@sitguru.com>",
      to: recipients,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend alert failed: ${response.status} ${body}`);
  }

  return { skipped: false };
}

async function sendSmsAlert(message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const recipients = getAdminSmsNumbers();

  if (!accountSid || !authToken || !fromNumber || recipients.length === 0) {
    return { skipped: true, reason: "Missing Twilio env values or ADMIN_ALERT_SMS_TO" };
  }

  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  await Promise.all(
    recipients.map(async (to) => {
      const body = new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: message,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        },
      );

      if (!response.ok) {
        const responseBody = await response.text();
        throw new Error(`Twilio alert failed: ${response.status} ${responseBody}`);
      }
    }),
  );

  return { skipped: false };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "auth-user-alert",
    accepts: ["POST"],
    message: "SitGuru signup alert endpoint is deployed. Send POST requests from Supabase webhooks.",
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, OPTIONS",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-sitguru-alert-secret",
    },
  });
}

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.SIGNUP_ALERT_SECRET;
  const providedSecret = request.headers.get("x-sitguru-alert-secret") || "";

  if (configuredSecret && providedSecret !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: WebhookPayload;

  try {
    payload = (await request.json()) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const record = payload.record || {};
  const metadata = parseMetadata(record.raw_user_meta_data);
  const role = normalizeRole(
    getMetadataString(metadata, "role") ||
      getMetadataString(metadata, "signup_role") ||
      getMetadataString(metadata, "account_type") ||
      asString(record.role),
  );

  if (!["guru", "pet_parent", "ambassador"].includes(role)) {
    return NextResponse.json({ skipped: true, reason: "Role is not alertable", role });
  }

  const baseUrl = getBaseUrl(request);
  const id = asString(record.id);
  const email = asString(record.email);
  const phone = asString(record.phone);
  const source =
    getMetadataString(metadata, "source") ||
    getMetadataString(metadata, "signup_method") ||
    "signup";
  const name = getAccountName(record, metadata);
  const roleDisplay = getRoleDisplay(role);
  const createdAt = asString(record.created_at) || new Date().toISOString();
  const isPhoneOnly = Boolean(phone && !email);
  const isIncomplete = name === "SitGuru User" || !email;

  const reviewUrl = `${baseUrl}/admin/account-lifecycle?query=${encodeURIComponent(
    id || email || phone,
  )}`;

  const subject = `${roleDisplay} signup started${isPhoneOnly ? " by phone" : ""}: ${name}`;
  const smsMessage = [
    `SitGuru alert: New ${roleDisplay} signup started${isPhoneOnly ? " by phone" : ""}.`,
    `Name: ${name}.`,
    phone ? `Phone: ${formatPhone(phone)}.` : "Phone: not provided.",
    email ? `Email: ${email}.` : "Email: not provided.",
    isIncomplete ? "Profile is incomplete." : "Profile has basic account data.",
    `Review: ${reviewUrl}`,
  ].join(" ");

  const text = [
    `New ${roleDisplay} signup started on SitGuru.`,
    "",
    `Name: ${name}`,
    `Role: ${roleDisplay}`,
    `Email: ${email || "Not provided"}`,
    `Phone: ${formatPhone(phone)}`,
    `Source: ${source}`,
    `User ID: ${id || "Not provided"}`,
    `Created: ${createdAt}`,
    `Incomplete: ${isIncomplete ? "Yes" : "No"}`,
    "",
    `Review: ${reviewUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="margin: 0 0 12px;">New ${roleDisplay} signup started</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Role:</strong> ${roleDisplay}</p>
      <p><strong>Email:</strong> ${email || "Not provided"}</p>
      <p><strong>Phone:</strong> ${formatPhone(phone)}</p>
      <p><strong>Source:</strong> ${source}</p>
      <p><strong>User ID:</strong> ${id || "Not provided"}</p>
      <p><strong>Created:</strong> ${createdAt}</p>
      <p><strong>Incomplete:</strong> ${isIncomplete ? "Yes" : "No"}</p>
      <p>
        <a href="${reviewUrl}" style="display: inline-block; background: #047857; color: #ffffff; padding: 12px 18px; border-radius: 999px; text-decoration: none; font-weight: 700;">
          Review Account
        </a>
      </p>
    </div>
  `;

  try {
    const [emailResult, smsResult] = await Promise.all([
      sendEmailAlert({ subject, html, text }),
      sendSmsAlert(smsMessage),
    ]);

    return NextResponse.json({
      ok: true,
      alert: {
        id,
        role,
        name,
        email: email || null,
        phone: phone || null,
        source,
        incomplete: isIncomplete,
      },
      email: emailResult,
      sms: smsResult,
    });
  } catch (error) {
    console.error("Signup alert failed:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Signup alert failed",
      },
      { status: 500 },
    );
  }
}
