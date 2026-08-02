import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessFinancials: boolean;
};

const FINANCE_ROLES = [
  "owner",
  "super_admin",
  "admin",
  "finance_admin",
  "finance",
  "accounting",
  "bookkeeper",
];

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }

  return false;
}

function getEnvAdminEmails() {
  return String(
    process.env.SITGURU_FINANCE_ADMIN_EMAILS ||
      process.env.ADMIN_EMAILS ||
      process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
      "",
  )
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function hasFinancialRole(role: string) {
  return FINANCE_ROLES.includes(role.trim().toLowerCase());
}

async function safeRows<T>(
  query: PromiseLike<{ data: unknown; error: unknown }>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`CPA reminders query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`CPA reminders query skipped for ${label}:`, error);
    return [];
  }
}

async function requireFinancialAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const userEmail = (user.email || "").toLowerCase();
  const envAdminEmails = getEnvAdminEmails();

  const profileChecks = await Promise.all([
    safeRows<AnyRow>(
      supabaseAdmin
        .from("admin_users")
        .select("role,email,is_active,can_access_financials")
        .eq("user_id", user.id)
        .limit(1),
      "admin_users_cpa_reminders_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_cpa_reminders_access",
    ),
    safeRows<AnyRow>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_cpa_reminders_access",
    ),
  ]);

  const profile = profileChecks.flat().find(Boolean) || {};
  const role = asTrimmedString(profile.role) || "admin";
  const active =
    profile.is_active === undefined
      ? true
      : getOptionalBoolean(profile.is_active);
  const explicitFinanceAccess = getOptionalBoolean(
    profile.can_access_financials,
  );
  const envAllowed = envAdminEmails.includes(userEmail);

  const canAccessFinancials =
    active && (hasFinancialRole(role) || explicitFinanceAccess || envAllowed);

  if (!canAccessFinancials) return null;

  return {
    id: user.id,
    email: userEmail,
    role,
    canAccessFinancials,
  } satisfies AdminIdentity;
}

type ReminderSeverity = "critical" | "warning" | "info";

type ReminderRequestBody = {
  alertId?: string;
  title?: string;
  description?: string;
  dueLabel?: string;
  severity?: ReminderSeverity;
};

type SendResult = {
  channel: "email" | "sms";
  status: "sent" | "skipped" | "failed";
  detail: string;
};

function splitList(value?: string | null) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function requireString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function buildReminderMessage(body: Required<ReminderRequestBody>) {
  return [
    `SitGuru CPA Handoff Reminder`,
    ``,
    `${body.title}`,
    ``,
    `${body.description}`,
    ``,
    `Due: ${body.dueLabel}`,
    `Severity: ${body.severity.toUpperCase()}`,
    ``,
    `Open SitGuru Admin → Financials → CPA Handoff Center to review the tracker.`,
  ].join("\n");
}

function buildReminderHtml(body: Required<ReminderRequestBody>) {
  const severityColor =
    body.severity === "critical"
      ? "#be123c"
      : body.severity === "warning"
        ? "#b45309"
        : "#047857";

  return `
    <div style="font-family: Arial, sans-serif; background:#f7fbf8; padding:24px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #d1fae5; border-radius:24px; padding:24px;">
        <p style="margin:0 0 12px 0; font-size:12px; font-weight:800; letter-spacing:0.18em; text-transform:uppercase; color:#047857;">
          SitGuru CPA Handoff Reminder
        </p>

        <div style="display:inline-block; margin-bottom:16px; border:1px solid ${severityColor}; color:${severityColor}; border-radius:999px; padding:6px 12px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.14em;">
          ${body.severity}
        </div>

        <h1 style="margin:0; color:#020617; font-size:28px; line-height:1.15;">
          ${body.title}
        </h1>

        <p style="margin:16px 0 0 0; color:#475569; font-size:15px; line-height:1.7; font-weight:600;">
          ${body.description}
        </p>

        <div style="margin-top:20px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:18px; padding:16px;">
          <p style="margin:0; color:#047857; font-size:12px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase;">
            Due Date
          </p>
          <p style="margin:6px 0 0 0; color:#020617; font-size:18px; font-weight:800;">
            ${body.dueLabel}
          </p>
        </div>

        <p style="margin:20px 0 0 0; color:#475569; font-size:14px; line-height:1.6;">
          Open SitGuru Admin → Financials → CPA Handoff Center to review the tracker, complete close tasks, and prepare the CPA export package.
        </p>
      </div>
    </div>
  `;
}

async function sendEmailReminder(
  body: Required<ReminderRequestBody>,
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.FINANCE_ALERT_FROM_EMAIL || "SitGuru Finance <alerts@sitguru.com>";
  const recipients = splitList(process.env.ADMIN_FINANCE_ALERT_EMAILS);

  if (!apiKey) {
    return {
      channel: "email",
      status: "skipped",
      detail: "RESEND_API_KEY is not configured.",
    };
  }

  if (recipients.length === 0) {
    return {
      channel: "email",
      status: "skipped",
      detail: "ADMIN_FINANCE_ALERT_EMAILS is not configured.",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipients,
        subject: `SitGuru CPA Reminder: ${body.title}`,
        text: buildReminderMessage(body),
        html: buildReminderHtml(body),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      return {
        channel: "email",
        status: "failed",
        detail: errorText || `Email provider returned ${response.status}.`,
      };
    }

    return {
      channel: "email",
      status: "sent",
      detail: `Email reminder sent to ${recipients.length} recipient(s).`,
    };
  } catch (error) {
    return {
      channel: "email",
      status: "failed",
      detail:
        error instanceof Error
          ? error.message
          : "Unknown email reminder error.",
    };
  }
}

async function sendSmsReminder(
  body: Required<ReminderRequestBody>,
): Promise<SendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_FROM_PHONE;
  const recipients = splitList(process.env.ADMIN_FINANCE_ALERT_PHONES);

  if (!accountSid || !authToken || !fromPhone) {
    return {
      channel: "sms",
      status: "skipped",
      detail:
        "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM_PHONE is not configured.",
    };
  }

  if (recipients.length === 0) {
    return {
      channel: "sms",
      status: "skipped",
      detail: "ADMIN_FINANCE_ALERT_PHONES is not configured.",
    };
  }

  const message = [
    `SitGuru CPA Reminder: ${body.title}`,
    `${body.dueLabel}`,
    `Open Admin → Financials → CPA Handoff.`,
  ].join("\n");

  try {
    const results = await Promise.all(
      recipients.map(async (toPhone) => {
        const params = new URLSearchParams();
        params.append("From", fromPhone);
        params.append("To", toPhone);
        params.append("Body", message);

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${accountSid}:${authToken}`,
              ).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `SMS provider returned ${response.status}.`);
        }

        return response.json();
      }),
    );

    return {
      channel: "sms",
      status: "sent",
      detail: `Text reminder sent to ${results.length} recipient(s).`,
    };
  } catch (error) {
    return {
      channel: "sms",
      status: "failed",
      detail:
        error instanceof Error ? error.message : "Unknown text reminder error.",
    };
  }
}

export async function POST(request: Request) {
  const actor = await requireFinancialAdmin();

  if (!actor) {
    return NextResponse.json(
      { ok: false, message: "Not authorized to send CPA reminders." },
      { status: 403 },
    );
  }

  try {
    const incoming = (await request.json()) as ReminderRequestBody;

    const body: Required<ReminderRequestBody> = {
      alertId: requireString(incoming.alertId, "manual-cpa-reminder"),
      title: requireString(incoming.title, "CPA handoff reminder"),
      description: requireString(
        incoming.description,
        "A CPA handoff item needs management review.",
      ),
      dueLabel: requireString(incoming.dueLabel, "Review required"),
      severity: incoming.severity || "info",
    };

    const [email, sms] = await Promise.all([
      sendEmailReminder(body),
      sendSmsReminder(body),
    ]);

    return NextResponse.json({
      ok: true,
      alertId: body.alertId,
      results: [email, sms],
      message:
        "Reminder processed. Some channels may be skipped until provider environment variables are configured.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to process CPA reminder.",
      },
      { status: 500 },
    );
  }
}