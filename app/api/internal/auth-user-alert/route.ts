import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: Record<string, unknown> | null;
  old_record?: Record<string, unknown> | null;
};

type AnyRow = Record<string, unknown>;

type SignupSnapshot = {
  authUser: AnyRow | null;
  profile: AnyRow | null;
  guru: AnyRow | null;
  ambassador: AnyRow | null;
  petParent: AnyRow | null;
  userRoles: string[];
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

  if (
    [
      "both",
      "customer_guru",
      "pet_parent_and_guru",
      "pet_owner_and_guru",
    ].includes(normalized)
  ) {
    return "both";
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
    case "both":
      return "Pet Parent + Guru";
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

function rowString(row: AnyRow | null | undefined, ...keys: string[]) {
  if (!row) return "";

  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return "";
}

function firstNonEmpty(...values: string[]) {
  return values.find((value) => value.trim())?.trim() || "";
}

function joinedName(row: AnyRow | null | undefined) {
  const firstName = rowString(row, "first_name", "firstName");
  const lastName = rowString(row, "last_name", "lastName");
  return `${firstName} ${lastName}`.trim();
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function safeMaybeSingle(
  label: string,
  query: PromiseLike<{ data: unknown; error: { message?: string } | null }>,
) {
  try {
    const { data, error } = await query;

    if (error) {
      console.warn(`Signup alert skipped ${label}:`, error.message || error);
      return null;
    }

    return (data || null) as AnyRow | null;
  } catch (error) {
    console.warn(`Signup alert skipped ${label}:`, error);
    return null;
  }
}

async function safeRows(
  label: string,
  query: PromiseLike<{ data: unknown; error: { message?: string } | null }>,
) {
  try {
    const { data, error } = await query;

    if (error) {
      console.warn(`Signup alert skipped ${label}:`, error.message || error);
      return [] as AnyRow[];
    }

    return Array.isArray(data) ? (data as AnyRow[]) : [];
  } catch (error) {
    console.warn(`Signup alert skipped ${label}:`, error);
    return [] as AnyRow[];
  }
}

function firstRow(rows: AnyRow[]) {
  return rows[0] || null;
}

async function loadSignupSnapshot(record: Record<string, unknown>) {
  const id = asString(record.id);
  const email = asString(record.email).toLowerCase();
  const supabaseAdmin = createSupabaseAdminClient();

  const [authResult, profile, userRoles] = await Promise.all([
    id
      ? supabaseAdmin.auth.admin.getUserById(id).catch((error) => {
          console.warn("Signup alert auth lookup skipped:", error);
          return { data: { user: null } };
        })
      : Promise.resolve({ data: { user: null } }),
    id
      ? safeMaybeSingle(
          "profiles.id",
          supabaseAdmin.from("profiles").select("*").eq("id", id).maybeSingle(),
        )
      : email
        ? safeMaybeSingle(
            "profiles.email",
            supabaseAdmin
              .from("profiles")
              .select("*")
              .eq("email", email)
              .limit(1)
              .maybeSingle(),
          )
        : Promise.resolve(null),
    id
      ? safeRows(
          "user_roles",
          supabaseAdmin.from("user_roles").select("role").eq("user_id", id),
        )
      : Promise.resolve([] as AnyRow[]),
  ]);

  const roleSpecificFilter = id
    ? [`user_id.eq.${id}`, `profile_id.eq.${id}`].join(",")
    : "";

  const [guruRows, ambassadorRows, petParentRows] = await Promise.all([
    roleSpecificFilter
      ? safeRows(
          "gurus",
          supabaseAdmin.from("gurus").select("*").or(roleSpecificFilter).limit(1),
        )
      : Promise.resolve([] as AnyRow[]),
    roleSpecificFilter
      ? safeRows(
          "ambassadors",
          supabaseAdmin
            .from("ambassadors")
            .select("*")
            .or(roleSpecificFilter)
            .limit(1),
        )
      : Promise.resolve([] as AnyRow[]),
    roleSpecificFilter
      ? safeRows(
          "pet_parents",
          supabaseAdmin
            .from("pet_parents")
            .select("*")
            .or([`user_id.eq.${id}`, `profile_id.eq.${id}`, `id.eq.${id}`].join(","))
            .limit(1),
        )
      : Promise.resolve([] as AnyRow[]),
  ]);

  return {
    authUser: (authResult.data?.user || null) as AnyRow | null,
    profile,
    guru: firstRow(guruRows),
    ambassador: firstRow(ambassadorRows),
    petParent: firstRow(petParentRows),
    userRoles: userRoles.map((row) => rowString(row, "role")).filter(Boolean),
  } satisfies SignupSnapshot;
}

function roleSetFromSnapshot(
  metadata: Record<string, unknown>,
  record: Record<string, unknown>,
  snapshot: SignupSnapshot | null,
) {
  const roles = new Set<string>();

  [
    getMetadataString(metadata, "role"),
    getMetadataString(metadata, "signup_role"),
    getMetadataString(metadata, "account_type"),
    getMetadataString(metadata, "account_intent"),
    asString(record.role),
    rowString(snapshot?.authUser, "role", "account_type"),
    getMetadataString(parseMetadata(snapshot?.authUser?.user_metadata), "role"),
    getMetadataString(parseMetadata(snapshot?.authUser?.user_metadata), "account_type"),
    getMetadataString(parseMetadata(snapshot?.authUser?.user_metadata), "account_intent"),
    getMetadataString(parseMetadata(snapshot?.authUser?.app_metadata), "role"),
    rowString(snapshot?.profile, "role", "account_type"),
    ...((snapshot?.userRoles || []) as string[]),
  ].forEach((candidate) => {
    const normalized = normalizeRole(candidate);
    if (normalized) roles.add(normalized);
  });

  if (snapshot?.guru) roles.add("guru");
  if (snapshot?.ambassador) roles.add("ambassador");
  if (snapshot?.petParent) roles.add("pet_parent");

  if (roles.has("both") || (roles.has("guru") && roles.has("pet_parent"))) {
    return "both";
  }

  if (roles.has("ambassador")) return "ambassador";
  if (roles.has("guru")) return "guru";
  if (roles.has("pet_parent")) return "pet_parent";

  return "";
}

function hasRoleProfile(role: string, snapshot: SignupSnapshot | null) {
  if (!snapshot) return false;
  if (role === "guru") return Boolean(snapshot.guru);
  if (role === "ambassador") return Boolean(snapshot.ambassador);
  if (role === "both") return Boolean(snapshot.guru);
  return Boolean(snapshot.profile || snapshot.petParent);
}

function shouldRetrySnapshot(role: string, snapshot: SignupSnapshot | null) {
  if (!snapshot) return false;
  if (!snapshot.profile && !snapshot.guru && !snapshot.ambassador && !snapshot.petParent) {
    return true;
  }

  return Boolean(role && !hasRoleProfile(role, snapshot));
}

async function loadSignupSnapshotWithRetry(
  record: Record<string, unknown>,
  initialRole: string,
) {
  try {
    const delays = [0, 650, 1400];
    let snapshot: SignupSnapshot | null = null;

    for (const delay of delays) {
      if (delay) await wait(delay);
      snapshot = await loadSignupSnapshot(record);
      const resolvedRole = roleSetFromSnapshot({}, record, snapshot) || initialRole;

      if (!shouldRetrySnapshot(resolvedRole, snapshot)) {
        return snapshot;
      }
    }

    return snapshot;
  } catch (error) {
    console.warn("Signup alert enrichment skipped:", error);
    return null;
  }
}

function getBestAccountName(
  record: Record<string, unknown>,
  metadata: Record<string, unknown>,
  snapshot: SignupSnapshot | null,
) {
  const firstName =
    getMetadataString(metadata, "first_name") || asString(record.first_name);
  const lastName =
    getMetadataString(metadata, "last_name") || asString(record.last_name);

  return firstNonEmpty(
    getMetadataString(metadata, "full_name"),
    getMetadataString(metadata, "name"),
    getMetadataString(metadata, "display_name"),
    asString(record.full_name),
    asString(record.name),
    asString(record.display_name),
    `${firstName} ${lastName}`.trim(),
    rowString(snapshot?.profile, "full_name", "display_name", "name"),
    joinedName(snapshot?.profile),
    rowString(snapshot?.guru, "display_name", "full_name", "name"),
    joinedName(snapshot?.guru),
    rowString(snapshot?.ambassador, "display_name", "full_name", "name"),
    joinedName(snapshot?.ambassador),
    rowString(snapshot?.petParent, "display_name", "full_name", "name", "parent_name"),
    joinedName(snapshot?.petParent),
    getMetadataString(parseMetadata(snapshot?.authUser?.user_metadata), "full_name"),
    getMetadataString(parseMetadata(snapshot?.authUser?.user_metadata), "name"),
    joinedName(parseMetadata(snapshot?.authUser?.user_metadata)),
    "SitGuru User",
  );
}

function getBestEmail(record: Record<string, unknown>, snapshot: SignupSnapshot | null) {
  return firstNonEmpty(
    asString(record.email),
    rowString(snapshot?.authUser, "email"),
    rowString(snapshot?.profile, "email"),
    rowString(snapshot?.guru, "email"),
    rowString(snapshot?.ambassador, "email"),
    rowString(snapshot?.petParent, "email"),
  );
}

function getBestPhone(
  record: Record<string, unknown>,
  metadata: Record<string, unknown>,
  snapshot: SignupSnapshot | null,
) {
  return firstNonEmpty(
    asString(record.phone),
    getMetadataString(metadata, "phone"),
    getMetadataString(metadata, "phone_number"),
    rowString(snapshot?.authUser, "phone"),
    getMetadataString(parseMetadata(snapshot?.authUser?.user_metadata), "phone"),
    getMetadataString(parseMetadata(snapshot?.authUser?.user_metadata), "phone_number"),
    rowString(snapshot?.profile, "phone", "phone_number", "mobile_phone"),
    rowString(snapshot?.guru, "phone", "phone_number", "mobile_phone"),
    rowString(snapshot?.ambassador, "phone", "phone_number", "mobile_phone"),
    rowString(snapshot?.petParent, "phone", "phone_number", "mobile_phone"),
  );
}

function getSource(metadata: Record<string, unknown>, snapshot: SignupSnapshot | null) {
  return firstNonEmpty(
    getMetadataString(metadata, "source"),
    getMetadataString(metadata, "signup_source"),
    getMetadataString(metadata, "signup_method"),
    getMetadataString(parseMetadata(snapshot?.authUser?.user_metadata), "source"),
    getMetadataString(parseMetadata(snapshot?.authUser?.user_metadata), "signup_source"),
    rowString(snapshot?.profile, "source"),
    "signup",
  );
}

function getMissingRequiredFields({
  role,
  name,
  email,
  phone,
  snapshot,
}: {
  role: string;
  name: string;
  email: string;
  phone: string;
  snapshot: SignupSnapshot | null;
}) {
  const missing: string[] = [];

  if (!name || name === "SitGuru User") missing.push("name");
  if (!email && !phone) missing.push("email_or_phone");
  if (!role) missing.push("role");
  if (!snapshot?.profile) missing.push("profiles_row");
  if ((role === "guru" || role === "both") && !snapshot?.guru) missing.push("gurus_row");
  if (role === "ambassador" && !snapshot?.ambassador) missing.push("ambassadors_row");

  return missing;
}

function getCompletionPercent(missing: string[], role: string) {
  const total = role === "guru" || role === "ambassador" || role === "both" ? 5 : 4;
  return Math.max(0, Math.round(((total - missing.length) / total) * 100));
}

function getSignupState({
  role,
  snapshot,
  missing,
}: {
  role: string;
  snapshot: SignupSnapshot | null;
  missing: string[];
}) {
  const hasProfile = Boolean(snapshot?.profile);
  const hasSpecificProfile = hasRoleProfile(role, snapshot);

  if (!hasProfile && !hasSpecificProfile) return "account_created_only";
  if (!hasProfile && hasSpecificProfile) return "role_profile_created";
  if (missing.length > 0) return "profile_incomplete";

  return "profile_complete";
}

function getLikelyIssueType({
  role,
  name,
  email,
  phone,
  snapshot,
  missing,
}: {
  role: string;
  name: string;
  email: string;
  phone: string;
  snapshot: SignupSnapshot | null;
  missing: string[];
}) {
  const profileRole = normalizeRole(
    firstNonEmpty(
      rowString(snapshot?.profile, "role"),
      rowString(snapshot?.profile, "account_type"),
    ),
  );

  if (!snapshot?.profile) return "auth_only_no_profile";
  if (!role) return "role_missing";
  if (
    profileRole &&
    role !== profileRole &&
    !(role === "both" && (profileRole === "guru" || profileRole === "pet_parent")) &&
    !(profileRole === "both" && (role === "guru" || role === "pet_parent"))
  ) {
    return "role_mismatch";
  }
  if ((role === "guru" || role === "both") && !snapshot?.guru) return "role_profile_missing";
  if (role === "ambassador" && !snapshot?.ambassador) return "role_profile_missing";
  if (name === "SitGuru User" && !email && !phone) return "possible_spam_or_bot";
  if (missing.length > 0) return "profile_started_incomplete";

  return "profile_complete";
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
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const recipients = getAdminSmsNumbers();

  if (
    !accountSid ||
    !authToken ||
    (!fromNumber && !messagingServiceSid) ||
    recipients.length === 0
  ) {
    return {
      skipped: true,
      reason:
        "Missing Twilio env values, TWILIO_FROM_NUMBER/TWILIO_MESSAGING_SERVICE_SID, or ADMIN_ALERT_SMS_TO",
    };
  }

  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  await Promise.all(
    recipients.map(async (to) => {
      const body = new URLSearchParams({
        To: to,
        Body: message,
      });

      if (messagingServiceSid) {
        body.set("MessagingServiceSid", messagingServiceSid);
      } else if (fromNumber) {
        body.set("From", fromNumber);
      }

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
  const initialRole = normalizeRole(
    getMetadataString(metadata, "role") ||
      getMetadataString(metadata, "signup_role") ||
      getMetadataString(metadata, "account_type") ||
      getMetadataString(metadata, "account_intent") ||
      asString(record.role),
  );
  const snapshot = await loadSignupSnapshotWithRetry(record, initialRole);
  const role = roleSetFromSnapshot(metadata, record, snapshot) || initialRole;

  if (!["guru", "pet_parent", "ambassador", "both"].includes(role)) {
    return NextResponse.json({ skipped: true, reason: "Role is not alertable", role });
  }

  const baseUrl = getBaseUrl(request);
  const id = asString(record.id);
  const email = getBestEmail(record, snapshot);
  const phone = getBestPhone(record, metadata, snapshot);
  const source = getSource(metadata, snapshot);
  const name = getBestAccountName(record, metadata, snapshot);
  const roleDisplay = getRoleDisplay(role);
  const createdAt =
    asString(record.created_at) ||
    rowString(snapshot?.authUser, "created_at", "createdAt") ||
    new Date().toISOString();
  const isPhoneOnly = Boolean(phone && !email);
  const missingRequiredFields = getMissingRequiredFields({
    role,
    name,
    email,
    phone,
    snapshot,
  });
  const completionPercent = getCompletionPercent(missingRequiredFields, role);
  const signupState = getSignupState({
    role,
    snapshot,
    missing: missingRequiredFields,
  });
  const likelyIssueType = getLikelyIssueType({
    role,
    name,
    email,
    phone,
    snapshot,
    missing: missingRequiredFields,
  });
  const isIncomplete = missingRequiredFields.length > 0;
  const missingLabel =
    missingRequiredFields.length > 0
      ? missingRequiredFields.join(", ")
      : "none";
  const statusLabel = signupState.replace(/_/g, " ");
  const issueLabel = likelyIssueType.replace(/_/g, " ");

  const reviewUrl = `${baseUrl}/admin/account-lifecycle?query=${encodeURIComponent(
    id || email || phone,
  )}`;

  const subject = `${roleDisplay} signup ${statusLabel}${isPhoneOnly ? " by phone" : ""}: ${name}`;
  const smsMessage = [
    `SitGuru alert: New ${roleDisplay} basic account created${isPhoneOnly ? " by phone" : ""}.`,
    `State: ${statusLabel}.`,
    `Name: ${name}.`,
    phone ? `Phone: ${formatPhone(phone)}.` : "Phone: not provided.",
    email ? `Email: ${email}.` : "Email: not provided.",
    `Issue: ${issueLabel}.`,
    `Missing: ${missingLabel}.`,
    `Review: ${reviewUrl}`,
  ].join(" ");

  const text = [
    `New ${roleDisplay} basic account created on SitGuru.`,
    "",
    `Status: ${statusLabel}`,
    `Likely issue: ${issueLabel}`,
    `Name: ${name}`,
    `Role: ${roleDisplay}`,
    `Email: ${email || "Not provided"}`,
    `Phone: ${formatPhone(phone)}`,
    `Missing required fields: ${missingLabel}`,
    `Completion: ${completionPercent}%`,
    `Source: ${source}`,
    `User ID: ${id || "Not provided"}`,
    `Created: ${createdAt}`,
    `Incomplete: ${isIncomplete ? "Yes" : "No"}`,
    "",
    `Review: ${reviewUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="margin: 0 0 12px;">New ${roleDisplay} basic account created</h2>
      <p><strong>Status:</strong> ${statusLabel}</p>
      <p><strong>Likely issue:</strong> ${issueLabel}</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Role:</strong> ${roleDisplay}</p>
      <p><strong>Email:</strong> ${email || "Not provided"}</p>
      <p><strong>Phone:</strong> ${formatPhone(phone)}</p>
      <p><strong>Missing required fields:</strong> ${missingLabel}</p>
      <p><strong>Completion:</strong> ${completionPercent}%</p>
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
        signupState,
        likelyIssueType,
        missingRequiredFields,
        completionPercent,
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
