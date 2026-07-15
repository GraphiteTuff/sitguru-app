import { Buffer } from "node:buffer";
import { createHash, randomUUID } from "node:crypto";
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
  name?: string | null;
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
  slug?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  mobile_phone?: string | null;
  cell_phone?: string | null;
};

type UserRoleRow = {
  user_id?: string | null;
  role?: string | null;
};

type RecipientContact = {
  userId: string;
  role: string;
  name: string;
  email: string;
  phone: string;
};

type RecipientResolution = {
  userId: string;
  roleHint: string;
  nameHint: string;
  warnings: string[];
};

type DirectConversationContext = {
  conversation: ConversationRow;
  recipient: RecipientContact;
  currentUserRole: string;
};

type DeliveryResult = {
  messageSaved: boolean;
  recipientFound: boolean;
  notificationCreated: boolean;
  emailSent: boolean;
  smsSent: boolean;
  warnings: string[];
};

type SavedMessageRow = {
  id: string;
  conversation_id?: string | null;
  sender_id?: string | null;
  recipient_id?: string | null;
  content?: string | null;
  body?: string | null;
  topic?: string | null;
  created_at?: string | null;
};

type MessageRoleContext = "customer" | "guru" | "ambassador" | "admin";

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeBoolean(value: unknown) {
  return value === true || safeString(value).toLowerCase() === "true";
}

function normalizeClientMessageKey(value: unknown) {
  const clean = safeString(value);

  if (!clean || clean.length > 200) return "";

  return clean;
}

function getClientMessageKey(
  req: NextRequest,
  body: Record<string, unknown> | null,
) {
  const headerKey = normalizeClientMessageKey(
    req.headers.get("idempotency-key"),
  );
  const bodyKey = normalizeClientMessageKey(body?.clientMessageId);

  if (headerKey && bodyKey && headerKey !== bodyKey) {
    throw new Error(
      "The message request identifiers did not match. Please refresh and try again.",
    );
  }

  return headerKey || bodyKey;
}

function createDeterministicMessageId(userId: string, clientMessageKey: string) {
  if (!clientMessageKey) return randomUUID();

  const digest = createHash("sha256")
    .update(`${userId}:${clientMessageKey}`)
    .digest();

  const bytes = Buffer.from(digest.subarray(0, 16));

  // RFC 4122-compatible deterministic UUID. The client key is namespaced
  // to the authenticated user so separate users cannot collide.
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString("hex");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

function getRequestedRoleContext(
  req: NextRequest,
  body: Record<string, unknown> | null,
): MessageRoleContext | "" {
  const value =
    safeString(body?.roleContext) ||
    safeString(req.headers.get("x-sitguru-role-context"));
  const normalized = normalizeRole(value);

  if (
    normalized === "customer" ||
    normalized === "guru" ||
    normalized === "ambassador" ||
    normalized === "admin"
  ) {
    return normalized;
  }

  return "";
}

function getMessageSource(
  req: NextRequest,
  body: Record<string, unknown> | null,
) {
  return (
    safeString(body?.source) ||
    safeString(req.headers.get("x-sitguru-message-source")) ||
    "message_send_api"
  ).slice(0, 120);
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
    value === "founder"
  ) {
    return "admin";
  }
  if (value.includes("ambassador")) return "ambassador";

  return value;
}

function isAdminRole(role?: string | null) {
  return normalizeRole(role) === "admin";
}

function isProbablyUuid(value?: string | null) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    safeString(value),
  );
}

function getBaseUrl() {
  const raw =
    safeString(process.env.NEXT_PUBLIC_APP_URL) ||
    safeString(process.env.NEXT_PUBLIC_SITE_URL) ||
    "https://www.sitguru.com";

  return raw.replace(/\/+$/, "");
}

function getDashboardHref(role?: string | null) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "guru") return "/guru/dashboard";
  if (normalizedRole === "ambassador") return "/ambassador/dashboard";
  if (normalizedRole === "admin") return "/admin";

  return "/customer/dashboard";
}

function buildThreadHref(
  conversationId: string,
  role?: string | null,
  source = "message_notification",
) {
  const normalizedRole = normalizeRole(role);
  const query = new URLSearchParams();

  if (
    normalizedRole === "customer" ||
    normalizedRole === "guru" ||
    normalizedRole === "ambassador" ||
    normalizedRole === "admin"
  ) {
    query.set("role", normalizedRole);
    query.set("returnTo", getDashboardHref(normalizedRole));
  }

  query.set("source", source);

  return `/messages/${conversationId}?${query.toString()}`;
}

function buildPublicThreadUrl(
  conversationId: string,
  role?: string | null,
  source = "message_notification",
) {
  return `${getBaseUrl()}${buildThreadHref(
    conversationId,
    role,
    source,
  )}`;
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
    profile.name ||
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

  const fullNameFromParts = [guru.first_name, guru.last_name]
    .map((part) => safeString(part))
    .filter(Boolean)
    .join(" ");

  return (
    safeString(guru.display_name) ||
    safeString(guru.full_name) ||
    safeString(guru.name) ||
    fullNameFromParts ||
    safeString(guru.email).split("@")[0]
  );
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

function titleFromSlug(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeText(value?: string | null) {
  return safeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

async function getProfileByEmail(email: string) {
  const cleanEmail = safeString(email).toLowerCase();
  if (!cleanEmail) return null;

  const rows = await safeRows<ProfileRow>(
    supabaseAdmin.from("profiles").select("*").ilike("email", cleanEmail).limit(1),
    "profiles by email",
  );

  return rows[0] || null;
}

async function getProfilesByName(name: string) {
  const cleanName = safeString(name);
  if (!cleanName) return [];

  const [fullNameRows, displayNameRows, nameRows] = await Promise.all([
    safeRows<ProfileRow>(
      supabaseAdmin.from("profiles").select("*").ilike("full_name", cleanName).limit(5),
      "profiles by full_name",
    ),
    safeRows<ProfileRow>(
      supabaseAdmin.from("profiles").select("*").ilike("display_name", cleanName).limit(5),
      "profiles by display_name",
    ),
    safeRows<ProfileRow>(
      supabaseAdmin.from("profiles").select("*").ilike("name", cleanName).limit(5),
      "profiles by name",
    ),
  ]);

  const seen = new Set<string>();

  return [...fullNameRows, ...displayNameRows, ...nameRows].filter((profile) => {
    const id = safeString(profile.id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

async function getGuruByUserId(userId: string) {
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
    supabaseAdmin.from("user_roles").select("user_id, role").eq("user_id", userId),
    "user_roles",
  );
}

async function resolveRole(params: {
  userId: string;
  participantRole?: string | null;
  conversation?: ConversationRow | null;
  preferredRole?: string | null;
}) {
  const participantRole = normalizeRole(params.participantRole);
  if (participantRole && participantRole !== "user") return participantRole;

  const preferredRole = normalizeRole(params.preferredRole);
  if (preferredRole && preferredRole !== "user") return preferredRole;

  const profile = await getProfile(params.userId);
  const profileRole = normalizeRole(
    profile?.role || profile?.user_role || profile?.account_type || profile?.type,
  );

  if (profileRole && profileRole !== "user") return profileRole;

  const roles = await getUserRoles(params.userId);
  const roleFromRows = roles
    .map((row) => normalizeRole(row.role))
    .find((role) => role && role !== "user");
  if (roleFromRows) return roleFromRows;

  if (params.conversation?.guru_id === params.userId) return "guru";
  if (params.conversation?.customer_id === params.userId) return "customer";
  if (params.conversation?.started_by_user_id === params.userId) return "admin";

  const guru = await getGuruByUserId(params.userId);
  if (guru?.user_id) return "guru";

  return "customer";
}

async function buildContact(userId: string, role: string): Promise<RecipientContact> {
  const [profile, guru] = await Promise.all([getProfile(userId), getGuruByUserId(userId)]);
  const normalizedRole = normalizeRole(role);

  return {
    userId,
    role: normalizedRole,
    name:
      normalizedRole === "guru"
        ? getGuruName(guru) || getProfileName(profile)
        : isAdminRole(normalizedRole)
          ? "SitGuru Admin"
          : getProfileName(profile),
    email: safeString(profile?.email) || safeString(guru?.email),
    phone: getProfilePhone(profile) || getGuruPhone(guru),
  };
}

async function resolveUserIdFromGuruCandidate(guru: GuruRow | null | undefined) {
  if (!guru) return "";

  const userId = safeString(guru.user_id);
  if (userId) return userId;

  const id = safeString(guru.id);
  if (isProbablyUuid(id)) return id;

  const profile = await getProfileByEmail(safeString(guru.email));
  if (profile?.id) return profile.id;

  return "";
}

async function findGuruCandidatesBySlug(slug: string) {
  const cleanSlug = safeString(slug).toLowerCase();
  const derivedName = titleFromSlug(cleanSlug);
  const candidates: GuruRow[] = [];

  if (!cleanSlug) return candidates;

  const candidateSources = await Promise.all([
    safeRows<GuruRow>(
      supabaseAdmin.from("public_guru_search_profiles").select("*").eq("slug", cleanSlug).limit(5),
      "public_guru_search_profiles by slug",
    ),
    safeRows<GuruRow>(
      supabaseAdmin.from("gurus").select("*").eq("slug", cleanSlug).limit(5),
      "gurus by slug",
    ),
    safeRows<GuruRow>(
      supabaseAdmin.from("public_guru_search_profiles").select("*").ilike("full_name", derivedName).limit(5),
      "public_guru_search_profiles by full_name",
    ),
    safeRows<GuruRow>(
      supabaseAdmin.from("gurus").select("*").ilike("full_name", derivedName).limit(5),
      "gurus by full_name",
    ),
    safeRows<GuruRow>(
      supabaseAdmin.from("gurus").select("*").ilike("display_name", derivedName).limit(5),
      "gurus by display_name",
    ),
  ]);

  candidateSources.forEach((rows) => candidates.push(...rows));

  if (!candidates.length && derivedName) {
    const profiles = await getProfilesByName(derivedName);
    profiles.forEach((profile) => {
      candidates.push({
        id: profile.id,
        user_id: profile.id,
        display_name: profile.display_name || profile.full_name || profile.name,
        full_name: profile.full_name,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        phone_number: profile.phone_number,
        mobile_phone: profile.mobile_phone,
        cell_phone: profile.cell_phone,
      });
    });
  }

  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const key =
      safeString(candidate.user_id) ||
      safeString(candidate.email).toLowerCase() ||
      safeString(candidate.id) ||
      getGuruName(candidate).toLowerCase();

    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function findGuruCandidatesById(guruId: string) {
  const cleanGuruId = safeString(guruId);
  const candidates: GuruRow[] = [];

  if (!cleanGuruId) return candidates;

  const sourceQueries: Promise<GuruRow[]>[] = [
    safeRows<GuruRow>(
      supabaseAdmin.from("public_guru_search_profiles").select("*").eq("id", cleanGuruId).limit(5),
      "public_guru_search_profiles by id",
    ),
    safeRows<GuruRow>(
      supabaseAdmin.from("gurus").select("*").eq("id", cleanGuruId).limit(5),
      "gurus by id",
    ),
    safeRows<GuruRow>(
      supabaseAdmin.from("public_guru_search_profiles").select("*").eq("user_id", cleanGuruId).limit(5),
      "public_guru_search_profiles by user_id",
    ),
    safeRows<GuruRow>(
      supabaseAdmin.from("gurus").select("*").eq("user_id", cleanGuruId).limit(5),
      "gurus by user_id",
    ),
  ];

  if (!isProbablyUuid(cleanGuruId)) {
    sourceQueries.push(findGuruCandidatesBySlug(cleanGuruId));
  }

  const sourceResults = await Promise.all(sourceQueries);
  sourceResults.forEach((rows) => candidates.push(...rows));

  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const key =
      safeString(candidate.user_id) ||
      safeString(candidate.email).toLowerCase() ||
      safeString(candidate.id) ||
      getGuruName(candidate).toLowerCase();

    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function findAdminRecipient(currentUserId: string) {
  const roleRows = await safeRows<UserRoleRow>(
    supabaseAdmin.from("user_roles").select("user_id, role").ilike("role", "%admin%"),
    "admin user_roles",
  );

  const adminUserIdFromRoles = roleRows
    .map((row) => safeString(row.user_id))
    .find((userId) => userId && userId !== currentUserId);

  if (adminUserIdFromRoles) return adminUserIdFromRoles;

  const profileRows = await safeRows<ProfileRow>(
    supabaseAdmin.from("profiles").select("*").ilike("role", "%admin%").limit(10),
    "admin profiles by role",
  );

  return (
    profileRows
      .map((profile) => safeString(profile.id))
      .find((userId) => userId && userId !== currentUserId) || ""
  );
}

async function resolveDirectRecipient(params: {
  body: Record<string, unknown> | null;
  currentUserId: string;
  currentUserRole: string;
}): Promise<RecipientResolution> {
  const warnings: string[] = [];
  const recipientId = safeString(params.body?.recipientId);
  const recipientName = safeString(params.body?.recipientName);
  const guruId = safeString(params.body?.guruId);
  const guruSlug = safeString(params.body?.guruSlug) || safeString(params.body?.guru);
  const customerId = safeString(params.body?.customerId);
  const adminMode = safeBoolean(params.body?.adminMode);

  if (recipientId) {
    return {
      userId: recipientId,
      roleHint: adminMode ? "admin" : "user",
      nameHint: recipientName,
      warnings,
    };
  }

  if (guruId || guruSlug) {
    const candidates = guruId
      ? await findGuruCandidatesById(guruId)
      : await findGuruCandidatesBySlug(guruSlug);

    for (const candidate of candidates) {
      const userId = await resolveUserIdFromGuruCandidate(candidate);

      if (userId) {
        return {
          userId,
          roleHint: "guru",
          nameHint: recipientName || getGuruName(candidate),
          warnings,
        };
      }
    }

    warnings.push(
      `Guru recipient could not be resolved from ${guruId ? `guruId ${guruId}` : `slug ${guruSlug}`}.`,
    );
  }

  if (customerId) {
    return {
      userId: customerId,
      roleHint: "customer",
      nameHint: recipientName,
      warnings,
    };
  }

  if (adminMode) {
    const adminUserId = await findAdminRecipient(params.currentUserId);

    if (adminUserId) {
      return {
        userId: adminUserId,
        roleHint: "admin",
        nameHint: "SitGuru Admin",
        warnings,
      };
    }

    warnings.push("No SitGuru Admin recipient could be resolved.");
  }

  if (recipientName) {
    const profiles = await getProfilesByName(recipientName);
    const matchingProfile = profiles.find((profile) => profile.id !== params.currentUserId);

    if (matchingProfile?.id) {
      return {
        userId: matchingProfile.id,
        roleHint: normalizeRole(
          matchingProfile.role || matchingProfile.user_role || matchingProfile.account_type || matchingProfile.type,
        ),
        nameHint: recipientName,
        warnings,
      };
    }
  }

  return {
    userId: "",
    roleHint: "user",
    nameHint: recipientName,
    warnings,
  };
}

async function createNotification(params: {
  recipient: RecipientContact;
  conversationId: string;
  preview: string;
  source: string;
}) {
  try {
    if (!params.recipient.userId) return false;

    const now = new Date().toISOString();
    const href = buildThreadHref(
      params.conversationId,
      params.recipient.role,
      params.source,
    );

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
  source: string;
}) {
  try {
    const apiKey = safeString(process.env.RESEND_API_KEY);
    const toEmail = safeString(params.recipient.email);

    if (!apiKey || !toEmail) return false;

    const resend = new Resend(apiKey);
    const threadUrl = buildPublicThreadUrl(
      params.conversationId,
      params.recipient.role,
      params.source,
    );
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
  source: string;
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

    const threadUrl = buildPublicThreadUrl(
      params.conversationId,
      params.recipient.role,
      params.source,
    );
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
  messageId: string;
  clientMessageKey: string;
  source: string;
  recipient: RecipientContact;
  delivery: DeliveryResult;
  createdNewConversation: boolean;
}) {
  try {
    await supabaseAdmin.from("admin_audit_logs").insert({
      actor_id: params.actorId,
      actor_email: params.actorEmail,
      action: params.createdNewConversation ? "message_thread_created" : "message_sent",
      area: "messages",
      target_type: "conversation",
      target_id: params.conversationId,
      metadata: {
        message_id: params.messageId,
        client_message_key_present: Boolean(params.clientMessageKey),
        source: params.source,
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

async function findExistingDirectConversation(params: {
  customerId: string;
  guruId: string;
  bookingId: string;
}) {
  if (!params.customerId && !params.guruId) return null;

  let query = supabaseAdmin
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(1);

  if (params.customerId) {
    query = query.eq("customer_id", params.customerId);
  }

  if (params.guruId) {
    query = query.eq("guru_id", params.guruId);
  }

  if (params.bookingId) {
    query = query.eq("booking_id", params.bookingId);
  } else {
    query = query.is("booking_id", null);
  }

  const rows = await safeRows<ConversationRow>(query, "existing direct conversation");

  return rows[0] || null;
}

async function ensureDirectConversation(params: {
  body: Record<string, unknown> | null;
  currentUserId: string;
  currentUserRole: string;
  recipient: RecipientContact;
  topic: string;
  preview: string;
}) {
  const now = new Date().toISOString();
  const bookingId = safeString(params.body?.bookingId);
  const subject = safeString(params.body?.subject) || params.topic || "Direct Message";
  const requestedCustomerId = safeString(params.body?.customerId);
  const requestedGuruId = safeString(params.body?.guruId);
  const recipientRole = normalizeRole(params.recipient.role);
  const currentUserRole = normalizeRole(params.currentUserRole);

  const customerId =
    requestedCustomerId ||
    (currentUserRole === "customer" ? params.currentUserId : "") ||
    (recipientRole === "customer" ? params.recipient.userId : "") ||
    params.currentUserId;

  const guruId =
    (recipientRole === "guru" ? params.recipient.userId : "") ||
    (currentUserRole === "guru" ? params.currentUserId : "") ||
    (isProbablyUuid(requestedGuruId) ? requestedGuruId : "");

  const existingConversation = await findExistingDirectConversation({
    customerId,
    guruId,
    bookingId,
  });

  if (existingConversation?.id) {
    return {
      conversation: existingConversation,
      createdNewConversation: false,
    };
  }

  const insertPayload = {
    customer_id: customerId || null,
    guru_id: guruId || null,
    booking_id: bookingId || null,
    started_by_user_id: params.currentUserId,
    subject,
    topic: params.topic,
    status: "open",
    last_message_at: now,
    last_message_preview: params.preview,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabaseAdmin
    .from("conversations")
    .insert(insertPayload)
    .select("*")
    .single<ConversationRow>();

  if (error || !data?.id) {
    throw new Error(error?.message || "Unable to create message thread.");
  }

  return {
    conversation: data,
    createdNewConversation: true,
  };
}

async function loadExistingConversationContext(params: {
  conversationId: string;
  currentUserId: string;
  body: Record<string, unknown> | null;
  preferredRole?: string | null;
}): Promise<DirectConversationContext> {
  const [{ data: conversation, error: conversationError }, participants] = await Promise.all([
    supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("id", params.conversationId)
      .maybeSingle<ConversationRow>(),
    safeRows<ConversationParticipantRow>(
      supabaseAdmin
        .from("conversation_participants")
        .select("*")
        .eq("conversation_id", params.conversationId),
      "conversation_participants",
    ),
  ]);

  if (conversationError || !conversation) {
    throw new Error("Message thread was not found.");
  }

  const participantRole = participants.find((participant) => participant.user_id === params.currentUserId)?.role;
  const currentUserRole = await resolveRole({
    userId: params.currentUserId,
    participantRole,
    conversation,
    preferredRole: params.preferredRole,
  });

  const allowedUserIds = new Set(
    [
      conversation.customer_id || "",
      conversation.guru_id || "",
      conversation.started_by_user_id || "",
      ...participants.map((participant) => participant.user_id || ""),
    ].filter(Boolean),
  );

  if (!allowedUserIds.has(params.currentUserId)) {
    throw new Error("You do not have access to this message thread.");
  }

  const recipientUserId =
    chooseRecipient({
      currentUserId: params.currentUserId,
      currentUserRole,
      conversation,
      participants,
    }) || safeString(params.body?.recipientId);

  if (!recipientUserId) {
    throw new Error("SitGuru could not find the other participant for this thread.");
  }

  const recipientRole = await resolveRole({
    userId: recipientUserId,
    participantRole: participants.find((participant) => participant.user_id === recipientUserId)?.role,
    conversation,
  });

  const recipient = await buildContact(recipientUserId, recipientRole);

  return {
    conversation,
    recipient,
    currentUserRole,
  };
}

async function loadNewConversationContext(params: {
  body: Record<string, unknown> | null;
  currentUserId: string;
  currentUserRole: string;
  topic: string;
  preview: string;
  delivery: DeliveryResult;
}) {
  const resolvedRecipient = await resolveDirectRecipient({
    body: params.body,
    currentUserId: params.currentUserId,
    currentUserRole: params.currentUserRole,
  });

  params.delivery.warnings.push(...resolvedRecipient.warnings);

  if (!resolvedRecipient.userId) {
    throw new Error(
      "SitGuru could not find this recipient yet. Please open the Guru profile again or select a recipient from Admin.",
    );
  }

  if (resolvedRecipient.userId === params.currentUserId) {
    throw new Error("You cannot start a message thread with yourself.");
  }

  const recipientRole = await resolveRole({
    userId: resolvedRecipient.userId,
    preferredRole: resolvedRecipient.roleHint,
  });
  const recipient = await buildContact(resolvedRecipient.userId, recipientRole);

  if (resolvedRecipient.nameHint && (!recipient.name || recipient.name === "SitGuru User")) {
    recipient.name = resolvedRecipient.nameHint;
  }

  const { conversation, createdNewConversation } =
    await ensureDirectConversation({
    body: params.body,
    currentUserId: params.currentUserId,
    currentUserRole: params.currentUserRole,
    recipient,
    topic: params.topic,
    preview: params.preview,
  });

  return {
    conversation,
    recipient,
    currentUserRole: params.currentUserRole,
    createdNewConversation,
  };
}

async function getExistingIdempotentMessage(messageId: string) {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .select(
      "id,conversation_id,sender_id,recipient_id,content,body,topic,created_at",
    )
    .eq("id", messageId)
    .maybeSingle<SavedMessageRow>();

  if (error) {
    console.error(
      "Idempotent message lookup failed:",
      error.message,
    );
    return null;
  }

  return data || null;
}

function isDuplicateInsertError(
  error?: { code?: string; message?: string } | null,
) {
  const code = safeString(error?.code);
  const message = safeString(error?.message).toLowerCase();

  return code === "23505" || message.includes("duplicate key");
}

function matchesIdempotentMessage({
  existingMessage,
  conversationId,
  senderId,
  messageText,
  topic,
}: {
  existingMessage: SavedMessageRow;
  conversationId: string;
  senderId: string;
  messageText: string;
  topic: string;
}) {
  return (
    safeString(existingMessage.conversation_id) === conversationId &&
    safeString(existingMessage.sender_id) === senderId &&
    (safeString(existingMessage.content) ||
      safeString(existingMessage.body)) === messageText &&
    safeString(existingMessage.topic) === topic
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

  let createdNewConversation = false;

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
    const topic =
      safeString(body?.topic) ||
      safeString(body?.subject) ||
      "direct_message";
    const clientMessageKey = getClientMessageKey(req, body);
    const requestedRoleContext = getRequestedRoleContext(req, body);
    const messageSource = getMessageSource(req, body);
    const messageId = createDeterministicMessageId(
      user.id,
      clientMessageKey,
    );

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

    const senderProfile = await getProfile(user.id);
    const baseCurrentUserRole = await resolveRole({ userId: user.id });
    const preview = getMessagePreview(messageText);

    let context: DirectConversationContext;

    if (conversationId) {
      context = await loadExistingConversationContext({
        conversationId,
        currentUserId: user.id,
        body,
        preferredRole: requestedRoleContext,
      });
    } else {
      const {
        conversation,
        recipient,
        currentUserRole,
        createdNewConversation: didCreateConversation,
      } = await loadNewConversationContext({
        body,
        currentUserId: user.id,
        currentUserRole: baseCurrentUserRole,
        topic,
        preview,
        delivery,
      });

      context = { conversation, recipient, currentUserRole };
      createdNewConversation = didCreateConversation;
    }

    const { conversation, recipient, currentUserRole } = context;

    delivery.recipientFound = Boolean(recipient.userId);

    const senderGuru = await getGuruByUserId(user.id);
    const senderName =
      currentUserRole === "guru"
        ? getGuruName(senderGuru) || getProfileName(senderProfile)
        : isAdminRole(currentUserRole)
          ? "SitGuru Admin"
          : getProfileName(senderProfile);
    const now = new Date().toISOString();

    const { data: messageRow, error: messageError } = await supabaseAdmin
      .from("messages")
      .insert({
        id: messageId,
        conversation_id: conversation.id,
        sender_id: user.id,
        recipient_id: recipient.userId,
        sender_role: currentUserRole,
        recipient_role: recipient.role,
        sender_name_snapshot: senderName,
        sender_email_snapshot:
          safeString(user.email) ||
          safeString(senderProfile?.email) ||
          null,
        sender_phone_snapshot: null,
        sender_role_snapshot: currentUserRole,
        recipient_name_snapshot: recipient.name,
        recipient_email_snapshot: recipient.email || null,
        recipient_phone_snapshot: recipient.phone || null,
        recipient_role_snapshot: recipient.role,
        content: messageText,
        body: messageText,
        topic,
        message_type: isAdminRole(currentUserRole)
          ? `direct_${recipient.role}`
          : `direct_${currentUserRole}`,
        status: "unread",
        is_read: false,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (messageError || !messageRow?.id) {
      if (isDuplicateInsertError(messageError)) {
        const existingMessage =
          await getExistingIdempotentMessage(messageId);

        if (
          existingMessage &&
          matchesIdempotentMessage({
            existingMessage,
            conversationId: conversation.id,
            senderId: user.id,
            messageText,
            topic,
          })
        ) {
          delivery.messageSaved = true;
          delivery.recipientFound = Boolean(recipient.userId);
          delivery.warnings.push(
            "Duplicate send prevented. SitGuru reused the message already saved for this request and did not repeat notifications, email, or SMS.",
          );

          return NextResponse.json({
            ok: true,
            messageId: existingMessage.id,
            conversationId: conversation.id,
            createdNewConversation: false,
            deduplicated: true,
            recipient: {
              userId: recipient.userId,
              role: recipient.role,
              name: recipient.name,
              emailAvailable: Boolean(recipient.email),
              phoneAvailable: Boolean(recipient.phone),
            },
            delivery,
          });
        }

        return NextResponse.json(
          {
            ok: false,
            error:
              "This message request identifier was already used for different content. Refresh the page before sending again.",
            delivery,
          },
          { status: 409 },
        );
      }

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

    const { error: conversationUpdateError } = await supabaseAdmin
      .from("conversations")
      .update({
        topic,
        subject: safeString(body?.subject) || conversation.subject || topic,
        status: "open",
        last_message_at: now,
        last_message_preview: preview,
        updated_at: now,
      })
      .eq("id", conversation.id);

    if (conversationUpdateError) {
      delivery.warnings.push(
        "The message was saved, but the conversation preview could not be updated.",
      );
      console.error(
        "Conversation message summary update failed:",
        conversationUpdateError.message,
      );
    }

    const { error: participantSyncError } = await supabaseAdmin
      .from("conversation_participants")
      .upsert(
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

    if (participantSyncError) {
      delivery.warnings.push(
        "The message was saved, but conversation participants could not be synchronized.",
      );
      console.error(
        "Conversation participant synchronization failed:",
        participantSyncError.message,
      );
    }

    delivery.notificationCreated = await createNotification({
      recipient,
      conversationId: conversation.id,
      preview,
      source: messageSource,
    });

    if (!delivery.notificationCreated) {
      delivery.warnings.push("In-app notification was not created.");
    }

    delivery.emailSent = await sendRecipientEmail({
      recipient,
      senderName,
      conversationId: conversation.id,
      source: messageSource,
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
      source: messageSource,
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
      actorEmail:
        user.email || safeString(senderProfile?.email) || null,
      conversationId: conversation.id,
      messageId: messageRow.id,
      clientMessageKey,
      source: messageSource,
      recipient,
      delivery,
      createdNewConversation,
    });

    return NextResponse.json({
      ok: true,
      messageId: messageRow.id,
      conversationId: conversation.id,
      createdNewConversation,
      deduplicated: false,
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

    const message = error instanceof Error ? error.message : "Unable to send message.";
    const status =
      message.includes("request identifiers did not match")
        ? 400
        : message.includes("not found") || message.includes("could not find")
          ? 404
          : message.includes("access") || message.includes("cannot")
            ? 403
            : 500;

    return NextResponse.json(
      {
        ok: false,
        error: message,
        delivery,
      },
      { status },
    );
  }
}