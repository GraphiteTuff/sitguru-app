import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SupportedRole = "pet_parent" | "guru" | "ambassador";
type ReminderStage =
  | "account_ready"
  | "one_hour"
  | "one_day"
  | "three_days"
  | "seven_days"
  | "account_live";

type ReminderQueueRow = {
  id: string;
  user_id: string;
  role_context: SupportedRole;
  stage: ReminderStage;
  scheduled_for: string;
  status: string;
  attempts: number;
  source: string | null;
};

type CompletionSnapshot = {
  userId: string;
  role: SupportedRole;
  fullName: string;
  firstName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  completionLink: string;
  dashboardLink: string;
  referralCode: string;
  missingFields: string[];
  technicalIssues: string[];
  complete: boolean;
  archivedOrSpam: boolean;
};

type DeliveryResult = {
  channel: "email" | "sms";
  sent: boolean;
  skipped: boolean;
  providerMessageId: string | null;
  error: string | null;
};

type ProcessQueueOptions = {
  limit?: number;
  userId?: string;
  stage?: ReminderStage;
};

type ProcessSummary = {
  claimed: number;
  sent: number;
  skipped: number;
  failed: number;
  technicalIssues: number;
  details: Array<{
    queueId: string;
    userId: string;
    role: string;
    stage: string;
    outcome: "sent" | "skipped" | "failed" | "technical_issue";
    message: string;
  }>;
};

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.sitguru.com").replace(
  /\/$/,
  "",
);
const SUPPORT_EMAIL = process.env.SITGURU_SUPPORT_EMAIL || "support@sitguru.com";
const DEFAULT_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "SitGuru <support@sitguru.com>";
const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || "support@sitguru.com";

const MINIMUM_GAP_HOURS: Record<ReminderStage, number> = {
  account_ready: 0,
  one_hour: 0.75,
  one_day: 20,
  three_days: 40,
  seven_days: 72,
  account_live: 0,
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function booleanValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") return value;
    if (value === 1 || value === "1" || value === "true") return true;
    if (value === 0 || value === "0" || value === "false") return false;
  }

  return false;
}

function normalizeRole(value: unknown): SupportedRole | null {
  const role = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (["pet_parent", "customer", "parent", "petparent"].includes(role)) {
    return "pet_parent";
  }

  if (["guru", "future_guru", "provider", "sitter", "pet_guru"].includes(role)) {
    return "guru";
  }

  if (["ambassador", "partner", "community_ambassador"].includes(role)) {
    return "ambassador";
  }

  if (role === "both") return "guru";

  return null;
}

function roleLabel(role: SupportedRole) {
  if (role === "pet_parent") return "Pet Parent";
  if (role === "guru") return "Guru";
  return "Ambassador";
}

function roleCompletionPath(role: SupportedRole) {
  if (role === "pet_parent") return "/customer/dashboard?setup=1";
  if (role === "guru") return "/guru/dashboard/profile?setup=1";
  return "/ambassador/dashboard?setup=1";
}

function roleDashboardPath(role: SupportedRole) {
  if (role === "pet_parent") return "/customer/dashboard";
  if (role === "guru") return "/guru/dashboard";
  return "/ambassador/dashboard";
}

function firstNameFrom(fullName: string, email: string) {
  const fromName = fullName.split(/\s+/).filter(Boolean)[0];
  if (fromName) return fromName;

  const fromEmail = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return fromEmail || "there";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (value.startsWith("+") && digits.length >= 10) return `+${digits}`;

  return "";
}

function hasPhoto(record: Record<string, unknown>) {
  return Boolean(
    stringValue(record, [
      "avatar_url",
      "profile_photo_url",
      "photo_url",
      "image_url",
      "profile_image_url",
      "ambassador_photo_url",
      "ambassador_photo_path",
    ]),
  );
}

function isArchivedOrSpam(...records: Record<string, unknown>[]) {
  const combined = records
    .map((record) =>
      [
        stringValue(record, ["status"]),
        stringValue(record, ["account_status"]),
        stringValue(record, ["admin_status"]),
        stringValue(record, ["profile_quality_status"]),
      ]
        .join(" ")
        .toLowerCase(),
    )
    .join(" ");

  return (
    combined.includes("archived") ||
    combined.includes("spam") ||
    records.some((record) => booleanValue(record, ["is_archived", "is_spam", "is_test_account"]))
  );
}

async function findRoleWorkspace(
  userId: string,
  email: string,
  role: SupportedRole,
) {
  if (role === "pet_parent") return {};

  const table = role === "guru" ? "gurus" : "ambassadors";
  const supabaseAdmin = createSupabaseAdminClient();

  const byUserId = await supabaseAdmin
    .from(table)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!byUserId.error && byUserId.data) {
    return asRecord(byUserId.data);
  }

  const byId = await supabaseAdmin.from(table).select("*").eq("id", userId).maybeSingle();

  if (!byId.error && byId.data) {
    return asRecord(byId.data);
  }

  if (email) {
    const byEmail = await supabaseAdmin
      .from(table)
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!byEmail.error && byEmail.data) {
      return asRecord(byEmail.data);
    }
  }

  return {};
}

async function findReferralCode(userId: string) {
  const supabaseAdmin = createSupabaseAdminClient();

  const result = await supabaseAdmin
    .from("pawperks_account_referral_codes")
    .select("*")
    .eq("account_id", userId)
    .maybeSingle();

  if (result.error || !result.data) return "";

  return stringValue(asRecord(result.data), ["code", "referral_code"]);
}

async function buildCompletionSnapshot(
  userId: string,
  requestedRole?: SupportedRole,
): Promise<CompletionSnapshot | null> {
  const supabaseAdmin = createSupabaseAdminClient();
  const authResult = await supabaseAdmin.auth.admin.getUserById(userId);

  if (authResult.error || !authResult.data.user) {
    return null;
  }

  const authUser = authResult.data.user;
  const metadata = asRecord(authUser.user_metadata);

  const profileResult = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  const profile = asRecord(profileResult.data);

  const rolesResult = await supabaseAdmin
    .from("user_roles")
    .select("*")
    .eq("user_id", userId);
  const roleRows = Array.isArray(rolesResult.data)
    ? rolesResult.data.map(asRecord)
    : [];

  const role =
    requestedRole ||
    normalizeRole(metadata.account_intent) ||
    normalizeRole(metadata.signup_intent) ||
    normalizeRole(metadata.signup_role) ||
    normalizeRole(metadata.role) ||
    normalizeRole(profile.role) ||
    normalizeRole(profile.account_type) ||
    roleRows.map((row) => normalizeRole(row.role)).find(Boolean) ||
    null;

  if (!role) return null;

  const email =
    stringValue(profile, ["email", "contact_email"]) ||
    String(authUser.email || "").trim().toLowerCase();
  const workspace = await findRoleWorkspace(userId, email, role);

  const fullName =
    stringValue(profile, ["full_name", "display_name", "name"]) ||
    stringValue(workspace, ["full_name", "display_name", "name"]) ||
    stringValue(metadata, ["full_name", "name"]) ||
    [stringValue(profile, ["first_name"]), stringValue(profile, ["last_name"])]
      .filter(Boolean)
      .join(" ") ||
    email.split("@")[0] ||
    "SitGuru Member";

  const phone =
    stringValue(profile, ["phone", "phone_number", "mobile_phone"]) ||
    stringValue(workspace, ["phone", "phone_number", "mobile_phone"]) ||
    String(authUser.phone || "").trim() ||
    stringValue(metadata, ["phone", "phone_number"]);

  const zipCode =
    stringValue(profile, ["zip_code", "postal_code", "service_zip", "service_zip_code"]) ||
    stringValue(workspace, ["zip_code", "base_zip_code", "postal_code", "service_zip"]) ||
    stringValue(metadata, ["zip_code", "postal_code"]);

  const city =
    stringValue(profile, ["city", "service_city", "home_city"]) ||
    stringValue(workspace, ["city", "service_city", "home_city"]) ||
    stringValue(metadata, ["city", "service_city"]);

  const state =
    stringValue(profile, ["state", "service_state", "home_state"]) ||
    stringValue(workspace, ["state", "service_state", "home_state"]) ||
    stringValue(metadata, ["state", "service_state"]);

  const serviceArea =
    stringValue(profile, [
      "service_area",
      "community_area",
      "outreach_area",
      "service_location",
    ]) ||
    stringValue(workspace, [
      "service_area",
      "community_area",
      "outreach_area",
      "service_location",
    ]) ||
    stringValue(metadata, ["service_area", "community_area", "outreach_area"]) ||
    [city, state].filter(Boolean).join(", ");

  const profileReferralCode =
    stringValue(profile, ["referral_code", "ambassador_code", "invite_code"]) ||
    stringValue(workspace, ["referral_code", "ambassador_code", "invite_code"]);
  const referralCode = profileReferralCode || (await findReferralCode(userId));

  const normalizedRoleRows = roleRows
    .map((row) => normalizeRole(row.role))
    .filter((value): value is SupportedRole => Boolean(value));

  const technicalIssues: string[] = [];

  if (!profileResult.data) technicalIssues.push("SitGuru profile record missing");
  if (!normalizedRoleRows.includes(role)) technicalIssues.push(`${roleLabel(role)} role record missing`);
  if (role !== "pet_parent" && Object.keys(workspace).length === 0) {
    technicalIssues.push(`${roleLabel(role)} workspace missing`);
  }

  const missingFields: string[] = [];

  if (!fullName || fullName === "SitGuru Member") missingFields.push("full name");
  if (!email) missingFields.push("email address");
  if (email && !authUser.email_confirmed_at) missingFields.push("email verification");
  if (!phone) missingFields.push("phone number");
  if (!zipCode) missingFields.push("ZIP code");
  if (!city || !state) missingFields.push("city and state");
  if (!serviceArea) {
    missingFields.push(role === "ambassador" ? "community or outreach area" : "service area");
  }
  if (!hasPhoto(profile) && !hasPhoto(workspace)) missingFields.push("profile photo");
  if (!referralCode) missingFields.push("referral code");

  const uniqueMissingFields = Array.from(new Set(missingFields));
  const uniqueTechnicalIssues = Array.from(new Set(technicalIssues));

  return {
    userId,
    role,
    fullName,
    firstName: firstNameFrom(fullName, email),
    email,
    phone,
    emailVerified: Boolean(authUser.email_confirmed_at),
    completionLink: `${SITE_URL}${roleCompletionPath(role)}`,
    dashboardLink: `${SITE_URL}${roleDashboardPath(role)}`,
    referralCode,
    missingFields: uniqueMissingFields,
    technicalIssues: uniqueTechnicalIssues,
    complete: uniqueMissingFields.length === 0 && uniqueTechnicalIssues.length === 0,
    archivedOrSpam: isArchivedOrSpam(profile, workspace, metadata),
  };
}

async function attemptAutomaticRepair(snapshot: CompletionSnapshot) {
  if (snapshot.technicalIssues.length === 0) return snapshot;

  const supabaseAdmin = createSupabaseAdminClient();

  const result = await supabaseAdmin.rpc("provision_sitguru_account", {
    p_user_id: snapshot.userId,
    p_intent: snapshot.role,
    p_full_name: snapshot.fullName || null,
    p_email: snapshot.email || null,
    p_phone: snapshot.phone || null,
    p_zip_code: null,
    p_service_area: null,
    p_ambassador_referral_code: null,
    p_source: "profile_completion_reminder_repair",
  });

  if (result.error) {
    console.warn("Automatic account repair did not complete:", result.error.message);
    return snapshot;
  }

  return (await buildCompletionSnapshot(snapshot.userId, snapshot.role)) || snapshot;
}

async function getPreferences(userId: string) {
  const supabaseAdmin = createSupabaseAdminClient();

  await supabaseAdmin.from("notification_preferences").upsert(
    {
      user_id: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id", ignoreDuplicates: true },
  );

  const result = await supabaseAdmin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return asRecord(result.data);
}

async function isAutomationEnabled() {
  const supabaseAdmin = createSupabaseAdminClient();
  const result = await supabaseAdmin
    .from("sitguru_automation_settings")
    .select("enabled")
    .eq("automation_key", "profile_completion_reminders")
    .maybeSingle();

  if (result.error || !result.data) return true;
  return result.data.enabled !== false;
}

function buildMessage(snapshot: CompletionSnapshot, stage: ReminderStage) {
  const label = roleLabel(snapshot.role);
  const isLiveNotice = stage === "account_live";
  const isAccountReady = stage === "account_ready";
  const missing = snapshot.missingFields;

  const subject = isLiveNotice
    ? `Your SitGuru ${label} account is live`
    : isAccountReady
      ? `Your SitGuru ${label} account is ready`
      : `Finish setting up your SitGuru ${label} account`;

  const intro = isLiveNotice
    ? `Your SitGuru ${label} account is now live and your dashboard is available.`
    : isAccountReady
      ? `Your SitGuru ${label} account and dashboard have been created.`
      : `Your SitGuru ${label} account is saved, but a few details still need your attention.`;

  const missingText = missing.length
    ? `Please finish: ${missing.join(", ")}.`
    : "Your required registration details are complete.";

  const text = [
    `Hi ${snapshot.firstName},`,
    "",
    intro,
    "",
    missingText,
    "",
    `Continue here: ${snapshot.completionLink}`,
    snapshot.referralCode ? `Your referral code: ${snapshot.referralCode}` : "",
    "",
    "If anything on the website or app is preventing you from finishing, reply to this email and SitGuru will help.",
    "",
    "Warmly,",
    "The SitGuru Team",
    SUPPORT_EMAIL,
  ]
    .filter(Boolean)
    .join("\n");

  const missingList = missing.length
    ? `<ul style="margin:16px 0 0 0; padding-left:22px; color:#334155; line-height:1.8;">${missing
        .map((field) => `<li>${escapeHtml(field)}</li>`)
        .join("")}</ul>`
    : `<div style="margin-top:16px; border:1px solid #bbf7d0; background:#f0fdf4; color:#166534; border-radius:16px; padding:14px 16px; font-weight:700;">Your required registration details are complete.</div>`;

  const html = `<!doctype html>
<html>
  <body style="margin:0; background:#f7f3ec; font-family:Arial,Helvetica,sans-serif; color:#17351f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f3ec; padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background:#ffffff; border:1px solid #dbe8d5; border-radius:28px; overflow:hidden;">
            <tr>
              <td style="background:#087449; padding:28px; color:#ffffff;">
                <div style="font-size:12px; font-weight:800; letter-spacing:1.6px; text-transform:uppercase; opacity:.82;">SitGuru.com</div>
                <h1 style="margin:10px 0 0 0; font-size:30px; line-height:1.2;">${escapeHtml(subject)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;">
                <p style="margin:0; font-size:17px; line-height:1.7;">Hi ${escapeHtml(snapshot.firstName)},</p>
                <p style="margin:16px 0 0 0; font-size:16px; line-height:1.7; color:#475569;">${escapeHtml(intro)}</p>
                ${missingList}
                <div style="text-align:center; padding:28px 0 10px 0;">
                  <a href="${escapeHtml(snapshot.completionLink)}" style="display:inline-block; background:#087449; color:#ffffff; text-decoration:none; border-radius:999px; padding:15px 24px; font-size:15px; font-weight:800;">Finish your SitGuru setup</a>
                </div>
                ${
                  snapshot.referralCode
                    ? `<div style="margin-top:18px; background:#f0f7ed; border:1px solid #dbe8d5; border-radius:18px; padding:16px;"><div style="font-size:11px; text-transform:uppercase; letter-spacing:1.2px; color:#64748b; font-weight:800;">Referral code</div><div style="margin-top:6px; font-size:18px; font-weight:900; color:#087449; word-break:break-word;">${escapeHtml(snapshot.referralCode)}</div></div>`
                    : ""
                }
                <p style="margin:24px 0 0 0; font-size:14px; line-height:1.7; color:#64748b;">If anything on the website or app is preventing you from finishing, reply to this email and SitGuru will help.</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:22px 28px; text-align:center; color:#64748b; font-size:12px; line-height:1.6;">
                SitGuru.com - Stronger communities. Better care. Happier pets.<br />
                ${escapeHtml(SUPPORT_EMAIL)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const smsMissing = missing.slice(0, 4).join(", ");
  const sms = isLiveNotice
    ? `SitGuru: Your ${label} account is live. ${
        smsMissing ? `Finish: ${smsMissing}. ` : ""
      }Open: ${snapshot.completionLink} Reply STOP to opt out.`
    : `SitGuru: Your ${label} account is ready${
        smsMissing ? ` but still needs ${smsMissing}` : ""
      }. Finish here: ${snapshot.completionLink} Reply STOP to opt out.`;

  return { subject, text, html, sms };
}

async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return {
      channel: "email",
      sent: false,
      skipped: false,
      providerMessageId: null,
      error: "RESEND_API_KEY is missing.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: DEFAULT_FROM_EMAIL,
      to,
      reply_to: SUPPORT_EMAIL,
      subject,
      text,
      html,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!response.ok) {
    return {
      channel: "email",
      sent: false,
      skipped: false,
      providerMessageId: null,
      error:
        String(payload?.message || payload?.error || "Resend email delivery failed."),
    };
  }

  return {
    channel: "email",
    sent: true,
    skipped: false,
    providerMessageId: String(payload?.id || "") || null,
    error: null,
  };
}

async function sendSms({ to, body }: { to: string; body: string }): Promise<DeliveryResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const normalizedTo = normalizePhone(to);

  if (!accountSid || !authToken || !from) {
    return {
      channel: "sms",
      sent: false,
      skipped: true,
      providerMessageId: null,
      error: "Twilio SMS environment variables are not configured.",
    };
  }

  if (!normalizedTo) {
    return {
      channel: "sms",
      sent: false,
      skipped: true,
      providerMessageId: null,
      error: "A valid phone number is not available.",
    };
  }

  const form = new URLSearchParams({
    From: from,
    To: normalizedTo,
    Body: body.slice(0, 1500),
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!response.ok) {
    return {
      channel: "sms",
      sent: false,
      skipped: false,
      providerMessageId: null,
      error: String(payload?.message || "Twilio SMS delivery failed."),
    };
  }

  return {
    channel: "sms",
    sent: true,
    skipped: false,
    providerMessageId: String(payload?.sid || "") || null,
    error: null,
  };
}

async function logCommunication({
  snapshot,
  stage,
  delivery,
  subject,
  body,
  automationKey,
  metadata,
}: {
  snapshot: CompletionSnapshot;
  stage: ReminderStage;
  delivery: DeliveryResult;
  subject: string;
  body: string;
  automationKey: string;
  metadata?: Record<string, unknown>;
}) {
  const supabaseAdmin = createSupabaseAdminClient();

  await supabaseAdmin.from("communication_logs").upsert(
    {
      user_id: snapshot.userId,
      role_context: snapshot.role,
      channel: delivery.channel,
      direction: "outbound",
      subject,
      body,
      status: delivery.sent ? "sent" : delivery.skipped ? "skipped" : "failed",
      provider_message_id: delivery.providerMessageId,
      error_message: delivery.error,
      related_profile_completion_status: snapshot.complete ? "complete" : "incomplete",
      related_missing_fields: snapshot.missingFields,
      automation_key: automationKey,
      metadata: {
        stage,
        technical_issues: snapshot.technicalIssues,
        completion_link: snapshot.completionLink,
        ...metadata,
      },
      sent_at: delivery.sent ? new Date().toISOString() : null,
    },
    { onConflict: "automation_key", ignoreDuplicates: true },
  );
}

async function lastSentAt(userId: string, role: SupportedRole) {
  const supabaseAdmin = createSupabaseAdminClient();
  const result = await supabaseAdmin
    .from("communication_logs")
    .select("sent_at")
    .eq("user_id", userId)
    .eq("role_context", role)
    .eq("status", "sent")
    .in("channel", ["email", "sms"])
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return result.data?.sent_at ? new Date(result.data.sent_at).getTime() : null;
}

async function updateQueue(
  queueId: string,
  patch: Record<string, unknown>,
) {
  const supabaseAdmin = createSupabaseAdminClient();
  await supabaseAdmin
    .from("profile_completion_reminder_queue")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", queueId);
}

async function cancelRemainingQueue(userId: string, role: SupportedRole, reason: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  await supabaseAdmin
    .from("profile_completion_reminder_queue")
    .update({
      status: "cancelled",
      last_error: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("role_context", role)
    .in("status", ["pending", "failed"]);
}

async function sendTechnicalIssueAlert(
  snapshot: CompletionSnapshot,
  stage: ReminderStage,
) {
  const automationKey = `profile_completion_technical:${snapshot.userId}:${snapshot.role}`;
  const supabaseAdmin = createSupabaseAdminClient();
  const existing = await supabaseAdmin
    .from("communication_logs")
    .select("id")
    .eq("automation_key", automationKey)
    .maybeSingle();

  if (existing.data) return;

  const subject = `SitGuru signup needs automatic repair: ${snapshot.fullName}`;
  const body = [
    `User: ${snapshot.fullName}`,
    `Email: ${snapshot.email || "Not available"}`,
    `Role: ${roleLabel(snapshot.role)}`,
    `User ID: ${snapshot.userId}`,
    `Issue: ${snapshot.technicalIssues.join(", ")}`,
    `Missing user details: ${snapshot.missingFields.join(", ") || "None"}`,
    `Review: ${SITE_URL}/admin/account-lifecycle?query=${encodeURIComponent(snapshot.userId)}`,
  ].join("\n");

  const html = `<div style="font-family:Arial,sans-serif;line-height:1.7;color:#17351f"><h2>${escapeHtml(
    subject,
  )}</h2><pre style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px">${escapeHtml(
    body,
  )}</pre></div>`;
  const delivery = await sendEmail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject,
    text: body,
    html,
  });

  await logCommunication({
    snapshot,
    stage,
    delivery,
    subject,
    body,
    automationKey,
    metadata: { recipient: ADMIN_NOTIFICATION_EMAIL, admin_alert: true },
  });
}

async function processQueueRow(row: ReminderQueueRow) {
  const initialSnapshot = await buildCompletionSnapshot(row.user_id, row.role_context);

  if (!initialSnapshot) {
    await updateQueue(row.id, {
      status: "skipped",
      skipped_at: new Date().toISOString(),
      last_error: "Auth user or supported role could not be found.",
    });

    return { outcome: "skipped" as const, message: "User or supported role not found." };
  }

  let snapshot = initialSnapshot;

  if (snapshot.technicalIssues.length > 0) {
    snapshot = await attemptAutomaticRepair(snapshot);
  }

  if (snapshot.archivedOrSpam) {
    await updateQueue(row.id, {
      status: "skipped",
      skipped_at: new Date().toISOString(),
      last_error: "Archived, spam, or test account.",
    });
    await cancelRemainingQueue(snapshot.userId, snapshot.role, "Archived, spam, or test account.");

    return { outcome: "skipped" as const, message: "Archived, spam, or test account." };
  }

  if (snapshot.technicalIssues.length > 0) {
    await sendTechnicalIssueAlert(snapshot, row.stage);
    await updateQueue(row.id, {
      status: "skipped",
      skipped_at: new Date().toISOString(),
      last_error: `Technical issue: ${snapshot.technicalIssues.join(", ")}`,
    });
    await cancelRemainingQueue(
      snapshot.userId,
      snapshot.role,
      `Technical issue: ${snapshot.technicalIssues.join(", ")}`,
    );

    return {
      outcome: "technical_issue" as const,
      message: snapshot.technicalIssues.join(", "),
    };
  }

  if (snapshot.complete && !["account_ready", "account_live"].includes(row.stage)) {
    await updateQueue(row.id, {
      status: "skipped",
      skipped_at: new Date().toISOString(),
      last_error: "Profile is complete.",
    });
    await cancelRemainingQueue(snapshot.userId, snapshot.role, "Profile is complete.");

    return { outcome: "skipped" as const, message: "Profile is complete." };
  }

  const preferences = await getPreferences(snapshot.userId);
  const remindersEnabled = preferences.profile_completion_reminders_enabled !== false;
  const transactionalEnabled = preferences.transactional_enabled !== false;

  if (!remindersEnabled || !transactionalEnabled) {
    await updateQueue(row.id, {
      status: "skipped",
      skipped_at: new Date().toISOString(),
      last_error: "Profile completion reminders are disabled.",
    });
    await cancelRemainingQueue(
      snapshot.userId,
      snapshot.role,
      "Profile completion reminders are disabled.",
    );

    return { outcome: "skipped" as const, message: "Reminders disabled." };
  }

  const lastSent = await lastSentAt(snapshot.userId, snapshot.role);
  const gapHours = MINIMUM_GAP_HOURS[row.stage] || 0;

  if (lastSent && gapHours > 0) {
    const earliestNext = lastSent + gapHours * 60 * 60 * 1000;

    if (Date.now() < earliestNext) {
      await updateQueue(row.id, {
        status: "pending",
        scheduled_for: new Date(earliestNext).toISOString(),
        claimed_at: null,
        last_error: null,
      });

      return { outcome: "skipped" as const, message: "Rescheduled to preserve reminder spacing." };
    }
  }

  const message = buildMessage(snapshot, row.stage);
  const deliveries: DeliveryResult[] = [];
  const emailEnabled = preferences.email_enabled !== false && !preferences.email_opted_out_at;
  const smsEnabled =
    preferences.sms_enabled === true &&
    Boolean(preferences.sms_consent_at) &&
    !preferences.sms_opted_out_at;

  if (emailEnabled && snapshot.email) {
    deliveries.push(
      await sendEmail({
        to: snapshot.email,
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    );
  }

  if (smsEnabled && snapshot.phone) {
    deliveries.push(await sendSms({ to: snapshot.phone, body: message.sms }));
  }

  if (deliveries.length === 0) {
    await updateQueue(row.id, {
      status: "skipped",
      skipped_at: new Date().toISOString(),
      last_error: "No permitted email or SMS delivery channel is available.",
    });

    return { outcome: "skipped" as const, message: "No permitted delivery channel." };
  }

  for (const delivery of deliveries) {
    await logCommunication({
      snapshot,
      stage: row.stage,
      delivery,
      subject: message.subject,
      body: delivery.channel === "email" ? message.text : message.sms,
      automationKey: `profile_completion:${row.id}:${delivery.channel}`,
      metadata: { queue_id: row.id },
    });
  }

  const emailSent = deliveries.some((delivery) => delivery.channel === "email" && delivery.sent);
  const smsSent = deliveries.some((delivery) => delivery.channel === "sms" && delivery.sent);
  const anySent = emailSent || smsSent;
  const errors = deliveries
    .filter((delivery) => !delivery.sent && !delivery.skipped && delivery.error)
    .map((delivery) => `${delivery.channel}: ${delivery.error}`);

  if (emailSent || smsSent) {
    const supabaseAdmin = createSupabaseAdminClient();
    await supabaseAdmin
      .from("notification_preferences")
      .update({
        ...(emailSent ? { last_email_sent_at: new Date().toISOString() } : {}),
        ...(smsSent ? { last_sms_sent_at: new Date().toISOString() } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", snapshot.userId);
  }

  if (anySent) {
    await updateQueue(row.id, {
      status: "sent",
      sent_at: new Date().toISOString(),
      last_error: errors.length ? errors.join(" | ") : null,
    });

    return { outcome: "sent" as const, message: "Reminder delivered." };
  }

  const retryAt = new Date(Date.now() + Math.min(row.attempts + 1, 4) * 60 * 60 * 1000);
  await updateQueue(row.id, {
    status: "failed",
    scheduled_for: retryAt.toISOString(),
    claimed_at: null,
    last_error: errors.join(" | ") || "Provider delivery failed.",
  });

  return {
    outcome: "failed" as const,
    message: errors.join(" | ") || "Provider delivery failed.",
  };
}

export async function enqueueProfileCompletionReminders({
  userId,
  role,
  anchor,
  source,
}: {
  userId: string;
  role: SupportedRole;
  anchor?: string | Date;
  source?: string;
}) {
  const supabaseAdmin = createSupabaseAdminClient();
  const anchorValue =
    anchor instanceof Date
      ? anchor.toISOString()
      : typeof anchor === "string" && anchor
        ? new Date(anchor).toISOString()
        : new Date().toISOString();

  const result = await supabaseAdmin.rpc("enqueue_profile_completion_reminders", {
    p_user_id: userId,
    p_role_context: role,
    p_anchor: anchorValue,
    p_source: source || "signup",
  });

  if (result.error) {
    throw new Error(`Unable to queue profile reminders: ${result.error.message}`);
  }
}

export async function processProfileCompletionReminderQueue(
  options: ProcessQueueOptions = {},
): Promise<ProcessSummary> {
  const summary: ProcessSummary = {
    claimed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    technicalIssues: 0,
    details: [],
  };

  if (!(await isAutomationEnabled())) {
    return summary;
  }

  const supabaseAdmin = createSupabaseAdminClient();
  let rows: ReminderQueueRow[] = [];

  if (options.userId) {
    let query = supabaseAdmin
      .from("profile_completion_reminder_queue")
      .select("*")
      .eq("user_id", options.userId)
      .in("status", ["pending", "failed"])
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(1);

    if (options.stage) query = query.eq("stage", options.stage);

    const result = await query;

    if (result.error) {
      throw new Error(`Unable to load reminder queue: ${result.error.message}`);
    }

    rows = (result.data || []) as ReminderQueueRow[];

    for (const row of rows) {
      await supabaseAdmin
        .from("profile_completion_reminder_queue")
        .update({
          status: "processing",
          claimed_at: new Date().toISOString(),
          attempts: Number(row.attempts || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .in("status", ["pending", "failed"]);
    }
  } else {
    const result = await supabaseAdmin.rpc("claim_profile_completion_reminders", {
      p_limit: Math.max(1, Math.min(options.limit || 25, 100)),
    });

    if (result.error) {
      throw new Error(`Unable to claim reminder queue: ${result.error.message}`);
    }

    rows = (result.data || []) as ReminderQueueRow[];
  }

  summary.claimed = rows.length;

  for (const row of rows) {
    try {
      const result = await processQueueRow(row);

      if (result.outcome === "sent") summary.sent += 1;
      if (result.outcome === "skipped") summary.skipped += 1;
      if (result.outcome === "failed") summary.failed += 1;
      if (result.outcome === "technical_issue") summary.technicalIssues += 1;

      summary.details.push({
        queueId: row.id,
        userId: row.user_id,
        role: row.role_context,
        stage: row.stage,
        outcome: result.outcome,
        message: result.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown reminder error.";
      summary.failed += 1;
      summary.details.push({
        queueId: row.id,
        userId: row.user_id,
        role: row.role_context,
        stage: row.stage,
        outcome: "failed",
        message,
      });

      await updateQueue(row.id, {
        status: "failed",
        scheduled_for: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        claimed_at: null,
        last_error: message,
      });
    }
  }

  return summary;
}

export async function backfillRecentSignupReminderQueue({
  days = 14,
  maxUsers = 300,
}: {
  days?: number;
  maxUsers?: number;
} = {}) {
  const supabaseAdmin = createSupabaseAdminClient();
  const since = new Date(
    Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000,
  ).toISOString();

  const result = await supabaseAdmin.rpc(
    "get_recent_sitguru_signup_reminder_candidates",
    {
      p_since: since,
      p_limit: Math.max(1, Math.min(maxUsers, 1000)),
    },
  );

  if (result.error) {
    throw new Error(
      `Unable to scan recent SitGuru signups: ${result.error.message}`,
    );
  }

  const candidates = Array.isArray(result.data) ? result.data.map(asRecord) : [];
  let queued = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const userId = stringValue(candidate, ["user_id"]);
    const createdAt = stringValue(candidate, ["created_at"]);
    const role = normalizeRole(candidate.role_context);

    if (!userId || !role) {
      skipped += 1;
      continue;
    }

    try {
      await enqueueProfileCompletionReminders({
        userId,
        role,
        anchor: createdAt || new Date(),
        source: "cron_recent_signup_backfill",
      });
      queued += 1;
    } catch (error) {
      skipped += 1;
      console.warn("Could not enqueue recent signup reminder:", error);
    }
  }

  return { inspected: candidates.length, queued, skipped };
}

export async function sendImmediateProfileCompletionNotice({
  userId,
  role,
}: {
  userId: string;
  role: SupportedRole;
}) {
  await enqueueProfileCompletionReminders({
    userId,
    role,
    anchor: new Date(),
    source: "signup_provisioning",
  });

  return processProfileCompletionReminderQueue({
    userId,
    stage: "account_ready",
    limit: 1,
  });
}

export type { ReminderStage, SupportedRole };